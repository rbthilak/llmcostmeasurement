// Anthropic model pricing per million tokens (as of June 2026)
export const MODELS = {
  'claude-haiku-4-5-20251001': {
    label: 'Claude Haiku 4.5',
    inputPerM: 0.80,
    outputPerM: 4.00,
    cacheWritePerM: 1.00,
    cacheReadPerM: 0.08,
    supportsThinking: false,
  },
  'claude-sonnet-4-6': {
    label: 'Claude Sonnet 4.6',
    inputPerM: 3.00,
    outputPerM: 15.00,
    cacheWritePerM: 3.75,
    cacheReadPerM: 0.30,
    supportsThinking: true,
    thinkingOutputPerM: 15.00,
  },
  'claude-opus-4-8': {
    label: 'Claude Opus 4.8',
    inputPerM: 15.00,
    outputPerM: 75.00,
    cacheWritePerM: 18.75,
    cacheReadPerM: 1.50,
    supportsThinking: true,
    thinkingOutputPerM: 75.00,
  },
  'claude-fable-5': {
    label: 'Claude Fable 5',
    inputPerM: 8.00,
    outputPerM: 40.00,
    cacheWritePerM: 10.00,
    cacheReadPerM: 0.80,
    supportsThinking: true,
    thinkingOutputPerM: 40.00,
  },
};

export function calculateCost(model, usage) {
  const pricing = MODELS[model];
  if (!pricing) return { total: 0, breakdown: {} };

  const inputCost = (usage.input_tokens / 1_000_000) * pricing.inputPerM;
  const outputCost = (usage.output_tokens / 1_000_000) * pricing.outputPerM;
  const thinkingCost = usage.cache_creation_input_tokens
    ? (usage.cache_creation_input_tokens / 1_000_000) * pricing.cacheWritePerM
    : 0;
  const cacheReadCost = usage.cache_read_input_tokens
    ? (usage.cache_read_input_tokens / 1_000_000) * pricing.cacheReadPerM
    : 0;

  // Reasoning/thinking tokens are billed as output tokens in Anthropic's API
  const reasoningTokens = usage.reasoning_tokens ?? 0;

  const breakdown = {
    inputCost,
    outputCost,
    thinkingCost,
    cacheReadCost,
    reasoningTokens,
  };

  return {
    total: inputCost + outputCost + thinkingCost + cacheReadCost,
    breakdown,
  };
}
