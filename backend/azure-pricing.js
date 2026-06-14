// Azure AI Foundry pay-as-you-go prices per million tokens (USD, June 2026)
// Sources: Azure AI Foundry model catalog marketplace pricing
export const AZURE_PRICING = {
  // OpenAI models
  'gpt-4o': { label: 'GPT-4o', inputPerM: 2.50, outputPerM: 10.00, reasoningPerM: 0 },
  'gpt-4o-mini': { label: 'GPT-4o mini', inputPerM: 0.15, outputPerM: 0.60, reasoningPerM: 0 },
  'gpt-4.1': { label: 'GPT-4.1', inputPerM: 2.00, outputPerM: 8.00, reasoningPerM: 0 },
  'gpt-4.1-mini': { label: 'GPT-4.1 mini', inputPerM: 0.40, outputPerM: 1.60, reasoningPerM: 0 },
  'gpt-4.1-nano': { label: 'GPT-4.1 nano', inputPerM: 0.10, outputPerM: 0.40, reasoningPerM: 0 },
  'o1': { label: 'o1', inputPerM: 15.00, outputPerM: 60.00, reasoningPerM: 60.00 },
  'o1-mini': { label: 'o1-mini', inputPerM: 1.10, outputPerM: 4.40, reasoningPerM: 4.40 },
  'o3': { label: 'o3', inputPerM: 10.00, outputPerM: 40.00, reasoningPerM: 40.00 },
  'o3-mini': { label: 'o3-mini', inputPerM: 1.10, outputPerM: 4.40, reasoningPerM: 4.40 },
  'o4-mini': { label: 'o4-mini', inputPerM: 1.10, outputPerM: 4.40, reasoningPerM: 4.40 },
  // Meta Llama
  'Meta-Llama-3.3-70B-Instruct': { label: 'Llama 3.3 70B', inputPerM: 0.23, outputPerM: 0.95, reasoningPerM: 0 },
  'Meta-Llama-3.1-405B-Instruct': { label: 'Llama 3.1 405B', inputPerM: 3.99, outputPerM: 3.99, reasoningPerM: 0 },
  'Meta-Llama-3.1-8B-Instruct': { label: 'Llama 3.1 8B', inputPerM: 0.03, outputPerM: 0.061, reasoningPerM: 0 },
  'Llama-4-Scout-17B-16E-Instruct': { label: 'Llama 4 Scout 17B', inputPerM: 0.17, outputPerM: 0.17, reasoningPerM: 0 },
  'Llama-4-Maverick-17B-128E-Instruct-FP8': { label: 'Llama 4 Maverick 17B', inputPerM: 0.19, outputPerM: 0.85, reasoningPerM: 0 },
  // Microsoft Phi
  'Phi-4': { label: 'Phi-4', inputPerM: 0.07, outputPerM: 0.14, reasoningPerM: 0 },
  'Phi-4-mini': { label: 'Phi-4 mini', inputPerM: 0.025, outputPerM: 0.05, reasoningPerM: 0 },
  'Phi-4-multimodal': { label: 'Phi-4 multimodal', inputPerM: 0.05, outputPerM: 0.10, reasoningPerM: 0 },
  // Mistral
  'Mistral-Large-2411': { label: 'Mistral Large', inputPerM: 3.00, outputPerM: 9.00, reasoningPerM: 0 },
  'Mistral-Small': { label: 'Mistral Small', inputPerM: 0.10, outputPerM: 0.30, reasoningPerM: 0 },
  'Codestral-2501': { label: 'Codestral', inputPerM: 0.30, outputPerM: 0.90, reasoningPerM: 0 },
  // DeepSeek
  'DeepSeek-R1': { label: 'DeepSeek R1', inputPerM: 0.55, outputPerM: 2.19, reasoningPerM: 2.19 },
  'DeepSeek-V3-0324': { label: 'DeepSeek V3', inputPerM: 0.27, outputPerM: 1.10, reasoningPerM: 0 },
  // Cohere
  'Cohere-command-r-plus-08-2024': { label: 'Command R+', inputPerM: 2.50, outputPerM: 10.00, reasoningPerM: 0 },
  'Cohere-command-r-08-2024': { label: 'Command R', inputPerM: 0.15, outputPerM: 0.60, reasoningPerM: 0 },
};

export function getAzurePricing(modelId) {
  // Exact match first
  if (AZURE_PRICING[modelId]) return AZURE_PRICING[modelId];
  // Prefix/substring match for deployment names
  for (const [key, val] of Object.entries(AZURE_PRICING)) {
    if (modelId.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(modelId.toLowerCase())) {
      return val;
    }
  }
  return null;
}

export function calculateAzureCost(modelId, usage) {
  const pricing = getAzurePricing(modelId);
  const inputTokens = usage.prompt_tokens ?? 0;
  const outputTokens = usage.completion_tokens ?? 0;
  const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;
  const nonReasoningOutput = outputTokens - reasoningTokens;

  if (!pricing) {
    return {
      total: 0,
      breakdown: { inputCost: 0, outputCost: 0, reasoningCost: 0, reasoningTokens, unknownPricing: true },
    };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerM;
  const reasoningCost = (reasoningTokens / 1_000_000) * (pricing.reasoningPerM || pricing.outputPerM);
  const outputCost = (nonReasoningOutput / 1_000_000) * pricing.outputPerM;

  return {
    total: inputCost + outputCost + reasoningCost,
    breakdown: { inputCost, outputCost, reasoningCost, reasoningTokens },
  };
}
