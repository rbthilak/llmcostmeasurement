const BASE = 'http://localhost:3001/api';

export async function fetchModels() {
  const r = await fetch(`${BASE}/models`);
  return r.json();
}

export async function sendMessage({ model, messages, tools, enableThinking, thinkingBudget, apiKey, systemPrompt }) {
  const r = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, enableThinking, thinkingBudget, apiKey, systemPrompt }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error ?? 'Request failed');
  }
  return r.json();
}

export async function checkHealth() {
  const r = await fetch(`${BASE}/health`);
  return r.json();
}
