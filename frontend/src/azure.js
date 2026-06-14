const BASE = 'http://localhost:3001/api/azure';

export async function fetchAzureModels(endpoint, apiKey) {
  const params = new URLSearchParams({ endpoint, apiKey });
  const r = await fetch(`${BASE}/models?${params}`);
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error ?? 'Failed to fetch Azure models');
  }
  return r.json(); // [{ id, label, modelType, pricing }]
}

export async function sendAzureMessage({ endpoint, apiKey, model, messages }) {
  const r = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, apiKey, model, messages }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error ?? 'Azure request failed');
  }
  return r.json();
}
