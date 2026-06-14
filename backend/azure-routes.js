import { Router } from 'express';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { calculateAzureCost, AZURE_PRICING } from './azure-pricing.js';

const router = Router();

function makeClient(endpoint, apiKey) {
  const base = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return ModelClient(base, new AzureKeyCredential(apiKey));
}

// GET /api/azure/models — list models available on the endpoint
router.get('/models', async (req, res) => {
  const { endpoint, apiKey } = req.query;
  if (!endpoint || !apiKey) {
    return res.status(400).json({ error: 'endpoint and apiKey query params required' });
  }
  try {
    const client = makeClient(endpoint, apiKey);
    const response = await client.path('/models').get();
    if (isUnexpected(response)) {
      return res.status(response.status).json({ error: response.body?.error?.message ?? 'Azure error' });
    }
    const models = (response.body?.value ?? []).map(m => ({
      id: m.name ?? m.id,
      label: m.display_name ?? m.name ?? m.id,
      modelType: m.model_type,
      pricing: AZURE_PRICING[m.name] ?? AZURE_PRICING[m.id] ?? null,
    }));
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/azure/chat
router.post('/chat', async (req, res) => {
  const { endpoint, apiKey, model, messages, maxTokens } = req.body;
  if (!endpoint || !apiKey || !model || !messages) {
    return res.status(400).json({ error: 'endpoint, apiKey, model, messages required' });
  }
  try {
    const client = makeClient(endpoint, apiKey);
    const response = await client.path('/chat/completions').post({
      body: {
        model,
        messages,
        max_tokens: maxTokens ?? 4096,
      },
    });
    if (isUnexpected(response)) {
      return res.status(response.status).json({ error: response.body?.error?.message ?? 'Azure error' });
    }
    const body = response.body;
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
        cached_tokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
      },
      cost: { total, breakdown },
      model: body.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
