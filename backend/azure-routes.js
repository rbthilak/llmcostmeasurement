import { Router } from 'express';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { calculateAzureCost, AZURE_PRICING } from './azure-pricing.js';
import { executeTool } from './tool-executor.js';

const router = Router();

// Registry of AI Foundry serverless endpoints — each model has its own endpoint + key.
// Loaded from AZURE_FOUNDRY_MODELS env var (JSON array) or individual AZURE_MODEL_<ID>_* vars.
// Format: [{ id, label, endpoint, key, pricing? }]
function loadFoundryRegistry() {
  if (process.env.AZURE_FOUNDRY_MODELS) {
    try { return JSON.parse(process.env.AZURE_FOUNDRY_MODELS); } catch {}
  }
  // Fall back to scanning individual env vars: AZURE_MODEL_PHI4_ENDPOINT / AZURE_MODEL_PHI4_KEY
  const registry = [];
  const prefix = 'AZURE_MODEL_';
  const endpoints = Object.keys(process.env).filter(k => k.startsWith(prefix) && k.endsWith('_ENDPOINT'));
  for (const epKey of endpoints) {
    const tag = epKey.slice(prefix.length, -'_ENDPOINT'.length);
    const keyVar = `${prefix}${tag}_KEY`;
    const labelVar = `${prefix}${tag}_LABEL`;
    const endpoint = process.env[epKey];
    const key = process.env[keyVar];
    if (endpoint && key) {
      const id = tag.toLowerCase().replace(/_/g, '-');
      registry.push({ id, label: process.env[labelVar] ?? id, endpoint, key });
    }
  }
  return registry;
}

function makeClient(endpoint, apiKey) {
  const base = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return ModelClient(base, new AzureKeyCredential(apiKey));
}

function resolveModel(modelId) {
  const registry = loadFoundryRegistry();
  return registry.find(m => m.id === modelId) ?? null;
}

// GET /api/azure/models — return all registered AI Foundry models
router.get('/models', (_req, res) => {
  const registry = loadFoundryRegistry();
  const models = registry.map(m => ({
    id: m.id,
    label: m.label,
    endpoint: m.endpoint,
    modelType: 'chat-completion',
    pricing: AZURE_PRICING[m.id] ?? null,
  }));
  res.json(models);
});

// POST /api/azure/chat — route to the correct endpoint based on model id
router.post('/chat', async (req, res) => {
  const { model, messages, maxTokens } = req.body;
  if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });

  const entry = resolveModel(model);
  if (!entry) return res.status(404).json({ error: `Model "${model}" is not registered. Add it in Azure AI Foundry and configure the backend.` });

  try {
    // Serverless endpoints require Bearer auth — use fetch directly
    const base = entry.endpoint.endsWith('/') ? entry.endpoint.slice(0, -1) : entry.endpoint;
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${entry.key}` },
      body: JSON.stringify({ messages, max_tokens: maxTokens ?? 4096 }),
      signal: AbortSignal.timeout(60000),
    });
    const body = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: body?.error?.message ?? `Azure returned ${r.status}` });

    const choice = body.choices?.[0];
    const usage = body.usage ?? {};
    const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;
    const toolCalls = choice?.message?.tool_calls ?? [];
    const { total, breakdown } = calculateAzureCost(model, usage);

    res.json({
      content: choice?.message?.content ?? '',
      toolCalls,
      toolCallCount: toolCalls.length,
      stopReason: choice?.finish_reason,
      usage: {
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        reasoning_tokens: reasoningTokens,
        cached_tokens: 0,
      },
      cost: { total, breakdown },
      model: body.model ?? model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GitHub Models ──────────────────────────────────────────────────────────────
const GITHUB_ENDPOINT = 'https://models.inference.ai.azure.com';

const GITHUB_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { id: 'Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B (Meta)' },
  { id: 'Meta-Llama-3.1-405B-Instruct', label: 'Llama 3.1 405B (Meta)' },
];

router.get('/github/models', (_req, res) => {
  if (!process.env.GITHUB_TOKEN) return res.status(400).json({ error: 'GITHUB_TOKEN not configured' });
  res.json(GITHUB_MODELS.map(m => ({ ...m, modelType: 'chat-completion', pricing: null })));
});

// Convert Anthropic tool format → OpenAI function format
function toOpenAITools(anthropicTools) {
  if (!anthropicTools?.length) return undefined;
  return anthropicTools.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));
}

// Single GitHub Models call — returns raw choice, usage, and the updated messages array.
async function githubSingleCall({ client, model, messages, openAITools, maxTokens }) {
  const body = { model, messages, max_tokens: maxTokens ?? 4096 };
  if (openAITools) body.tools = openAITools;
  const response = await client.path('/chat/completions').post({ body });
  if (isUnexpected(response)) {
    const status = parseInt(response.status, 10) || 500;
    throw Object.assign(new Error(response.body?.error?.message ?? `GitHub Models returned ${response.status}`), { status });
  }
  const data = response.body;
  const choice = data.choices?.[0];
  const usage = data.usage ?? {};
  return { choice, usage };
}

router.post('/github/chat', async (req, res) => {
  const { model, messages, maxTokens, systemPrompt, tools, clientTools } = req.body;
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(400).json({ error: 'GITHUB_TOKEN not configured' });
  if (!model || !messages) return res.status(400).json({ error: 'model and messages required' });

  const startMs = Date.now();
  const openAITools = toOpenAITools(tools);
  const client = makeClient(GITHUB_ENDPOINT, token);

  const runningMessages = systemPrompt?.trim()
    ? [{ role: 'system', content: systemPrompt.trim() }, ...messages]
    : [...messages];

  try {
    if (clientTools) {
      // ── Client-side tool execution mode ──────────────────────────────────
      // Do ONE LLM call and return tool calls to the browser to execute.
      const { choice, usage } = await githubSingleCall({ client, model, messages: runningMessages, openAITools, maxTokens });
      const iterTCs = choice?.message?.tool_calls ?? [];
      const iterStat = {
        iteration: 1,
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        reasoning_tokens: 0,
        stop_reason: choice?.finish_reason,
        tool_calls: iterTCs.map(tc => tc.function?.name),
        context_delta: null,
      };

      if (choice?.finish_reason === 'tool_calls' && iterTCs.length) {
        // Push assistant message so client has the full context to continue
        const assistantMsg = { role: 'assistant', content: choice.message.content ?? null, tool_calls: iterTCs };
        runningMessages.push(assistantMsg);

        const pendingToolCalls = iterTCs.map(tc => ({
          id: tc.id,
          name: tc.function?.name,
          input: (() => { try { return JSON.parse(tc.function?.arguments ?? '{}'); } catch { return {}; } })(),
        }));

        return res.json({
          pending: true,
          pendingToolCalls,
          messagesForContinue: runningMessages,  // includes system + history + assistant tool_calls msg
          iterationStats: [iterStat],
          usage: { input_tokens: usage.prompt_tokens ?? 0, output_tokens: usage.completion_tokens ?? 0, reasoning_tokens: 0, cached_tokens: 0 },
          responseMs: Date.now() - startMs,
          model,
        });
      }

      // No tool calls — return final response directly
      return res.json({
        pending: false,
        content: choice?.message?.content ?? '',
        toolCalls: [],
        toolResults: [],
        iterationStats: [iterStat],
        toolCallCount: 0,
        agentLoops: 1,
        stopReason: choice?.finish_reason,
        usage: { input_tokens: usage.prompt_tokens ?? 0, output_tokens: usage.completion_tokens ?? 0, reasoning_tokens: 0, cached_tokens: 0 },
        cost: { total: 0, breakdown: { inputCost: 0, outputCost: 0 } },
        responseMs: Date.now() - startMs,
        systemPromptPreview: systemPrompt?.trim() ? systemPrompt.trim().slice(0, 200) : undefined,
        model,
      });
    }

    // ── Server-side tool execution mode (legacy / no-tools path) ─────────
    const totalUsage = { prompt_tokens: 0, completion_tokens: 0 };
    const allToolCalls = [];
    const toolResults = [];
    const iterationStats = [];
    let finalContent = '';
    let finalStopReason = '';
    let loopCount = 0;

    while (loopCount < 10) {
      loopCount++;
      const { choice, usage } = await githubSingleCall({ client, model, messages: runningMessages, openAITools, maxTokens });
      totalUsage.prompt_tokens += usage.prompt_tokens ?? 0;
      totalUsage.completion_tokens += usage.completion_tokens ?? 0;
      finalStopReason = choice?.finish_reason;

      const iterTCs = choice?.message?.tool_calls ?? [];
      iterationStats.push({
        iteration: loopCount,
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        reasoning_tokens: 0,
        stop_reason: choice?.finish_reason,
        tool_calls: iterTCs.map(tc => tc.function?.name),
        context_delta: loopCount === 1 ? null : null,
      });

      if (choice?.finish_reason !== 'tool_calls' || !iterTCs.length) {
        finalContent = choice?.message?.content ?? '';
        break;
      }

      runningMessages.push({ role: 'assistant', content: choice.message.content ?? null, tool_calls: iterTCs });

      const toolResultMessages = await Promise.all(iterTCs.map(async tc => {
        const name = tc.function?.name;
        const args = (() => { try { return JSON.parse(tc.function?.arguments ?? '{}'); } catch { return {}; } })();
        const output = await executeTool(name, args);
        allToolCalls.push({ id: tc.id, name, input: args });
        toolResults.push({ id: tc.id, name, input: args, output });
        return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(output) };
      }));

      toolResultMessages.forEach(m => runningMessages.push(m));
    }

    res.json({
      content: finalContent,
      toolCalls: allToolCalls,
      toolResults,
      iterationStats,
      toolCallCount: allToolCalls.length,
      agentLoops: loopCount,
      stopReason: finalStopReason,
      usage: {
        input_tokens: totalUsage.prompt_tokens,
        output_tokens: totalUsage.completion_tokens,
        reasoning_tokens: 0,
        cached_tokens: 0,
      },
      cost: { total: 0, breakdown: { inputCost: 0, outputCost: 0 } },
      responseMs: Date.now() - startMs,
      systemPromptPreview: systemPrompt?.trim() ? systemPrompt.trim().slice(0, 200) : undefined,
      model,
    });
  } catch (err) {
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
