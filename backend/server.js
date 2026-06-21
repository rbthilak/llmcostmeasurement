import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import { get_encoding } from 'tiktoken';
import { MODELS, calculateCost } from './pricing.js';
import azureRoutes from './azure-routes.js';
import { executeTool } from './tool-executor.js';

// Shared encoder — cl100k_base is the closest public BPE to Claude's tokenizer
const enc = get_encoding('cl100k_base');

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/.*\.azurestaticapps\.net$/,
];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.some(r => r.test(origin))) }));
app.use(express.json());

// Config endpoint — tells the frontend what's pre-configured
app.get('/api/config', (_req, res) => {
  const azureModels = Object.keys(process.env).filter(k => k.startsWith('AZURE_MODEL_') && k.endsWith('_ENDPOINT'));
  res.json({
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    azureConfigured: azureModels.length > 0,
    githubConfigured: !!process.env.GITHUB_TOKEN,
  });
});

app.get('/api/models', (_req, res) => {
  res.json(MODELS);
});

// POST /api/chat — agentic loop with tool execution
app.post('/api/chat', async (req, res) => {
  const { model, messages, tools, enableThinking, thinkingBudget, apiKey, systemPrompt } = req.body;

  if (!model || !messages) return res.status(400).json({ error: 'model and messages are required' });

  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!resolvedKey) return res.status(401).json({ error: 'No Anthropic API key provided. Enter it in Settings.' });

  const client = new Anthropic({ apiKey: resolvedKey });

  const baseParams = {
    model,
    max_tokens: 8096,
    messages: [...messages],
  };

  if (systemPrompt?.trim()) baseParams.system = systemPrompt.trim();
  if (tools?.length) baseParams.tools = tools;

  if (enableThinking && MODELS[model]?.supportsThinking) {
    baseParams.thinking = { type: 'enabled', budget_tokens: thinkingBudget ?? 2000 };
    baseParams.max_tokens = Math.max(baseParams.max_tokens, (thinkingBudget ?? 2000) + 4096);
  }

  const startMs = Date.now();

  // Accumulated usage across all loop iterations
  const totalUsage = { input_tokens: 0, output_tokens: 0, reasoning_tokens: 0,
    cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  const allToolCalls = [];
  const toolResults = []; // { id, name, input, output } per call
  const iterationStats = []; // per-loop token breakdown
  let finalContent = '';
  let finalStopReason = '';
  let loopCount = 0;

  try {
    const params = { ...baseParams };

    while (loopCount < 10) {
      loopCount++;
      const response = await client.messages.create(params);

      // Accumulate usage
      for (const k of Object.keys(totalUsage)) {
        totalUsage[k] = (totalUsage[k] ?? 0) + (response.usage?.[k] ?? 0);
      }

      // Extract thinking tokens
      const thinkingBlocks = response.content.filter(b => b.type === 'thinking');
      const reasonTokens = thinkingBlocks.reduce((s, b) => s + Math.ceil((b.thinking?.length ?? 0) / 4), 0);
      totalUsage.reasoning_tokens += reasonTokens;

      finalStopReason = response.stop_reason;

      // Record per-iteration stats
      const iterToolCalls = response.content.filter(b => b.type === 'tool_use');
      iterationStats.push({
        iteration: loopCount,
        input_tokens: response.usage?.input_tokens ?? 0,
        output_tokens: response.usage?.output_tokens ?? 0,
        reasoning_tokens: reasonTokens,
        stop_reason: response.stop_reason,
        tool_calls: iterToolCalls.map(b => b.name),
        // track what was added to context before this call vs prior call
        context_delta: loopCount === 1 ? null : (() => {
          // The messages added since last LLM call:
          // assistant content (tool_use blocks) + tool_result user turn
          const msgs = params.messages;
          const lastAssistant = msgs[msgs.length - 2];
          const lastToolResults = msgs[msgs.length - 1];
          const assistantBlocks = Array.isArray(lastAssistant?.content) ? lastAssistant.content : [];
          const toolResultBlocks2 = Array.isArray(lastToolResults?.content) ? lastToolResults.content : [];
          const addedTools = assistantBlocks.filter(b => b.type === 'tool_use').map(b => b.name);
          const addedResults = toolResultBlocks2.filter(b => b.type === 'tool_result').map(b => {
            const txt = typeof b.content === 'string' ? b.content : JSON.stringify(b.content);
            return { tool_use_id: b.tool_use_id, chars: txt.length, preview: txt.slice(0, 120) };
          });
          return { added_tool_calls: addedTools, added_tool_results: addedResults };
        })(),
      });

      if (response.stop_reason !== 'tool_use') {
        finalContent = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
        break;
      }

      // Execute tool calls
      const toolUseBlocks = iterToolCalls;
      allToolCalls.push(...toolUseBlocks);

      const toolResultBlocks = await Promise.all(toolUseBlocks.map(async tu => {
        const output = await executeTool(tu.name, tu.input);
        toolResults.push({ id: tu.id, name: tu.name, input: tu.input, output });
        return {
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(output),
        };
      }));

      // Push assistant turn + tool results into message history
      params.messages = [
        ...params.messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResultBlocks },
      ];
    }

    const responseMs = Date.now() - startMs;
    const { total, breakdown } = calculateCost(model, totalUsage);

    // Collect thinking text across all iterations for the inspector
    const allThinking = [];
    for (const msg of params.messages) {
      if (Array.isArray(msg.content)) {
        for (const b of msg.content) {
          if (b.type === 'thinking' && b.thinking) allThinking.push(b.thinking);
        }
      }
    }

    res.json({
      content: finalContent,
      thinking: allThinking.join('\n\n---\n\n') || undefined,
      toolCalls: allToolCalls,
      toolResults,
      iterationStats,
      toolCallCount: allToolCalls.length,
      agentLoops: loopCount,
      stopReason: finalStopReason,
      usage: totalUsage,
      cost: { total, breakdown },
      responseMs,
      systemPromptPreview: systemPrompt?.trim() ? systemPrompt.trim().slice(0, 200) : undefined,
    });
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tokenize — returns individual token texts for visualization
app.post('/api/tokenize', (req, res) => {
  const { texts } = req.body; // { input?, output?, reasoning? }
  const result = {};
  for (const [key, text] of Object.entries(texts ?? {})) {
    if (!text) { result[key] = []; continue; }
    try {
      const ids = enc.encode(text);
      const tokens = Array.from(ids).map(id => {
        const bytes = enc.decode(new Uint32Array([id]));
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      });
      result[key] = tokens;
    } catch {
      result[key] = [];
    }
  }
  res.json(result);
});

app.use('/api/azure', azureRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, keySet: !!process.env.ANTHROPIC_API_KEY, clientToolsSupport: true });
});

app.listen(PORT, () => {
  console.log(`LLM Cost server running on http://localhost:${PORT}`);
});
