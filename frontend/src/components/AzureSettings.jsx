import { useState } from 'react';
import { fetchAzureModels } from '../azure';

export default function AzureSettings({ config, onChange, onModelsLoaded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFetch = async () => {
    if (!config.endpoint || !config.apiKey) {
      setError('Both endpoint and API key are required');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const models = await fetchAzureModels(config.endpoint, config.apiKey);
      onModelsLoaded(models);
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#12122a',
      border: '1px solid #2a2a4a',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, letterSpacing: '0.05em' }}>
        AZURE AI FOUNDRY
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Endpoint URL</div>
          <input
            type="text"
            placeholder="https://your-resource.services.ai.azure.com"
            value={config.endpoint}
            onChange={e => onChange({ ...config, endpoint: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>API Key</div>
          <input
            type="password"
            placeholder="••••••••"
            value={config.apiKey}
            onChange={e => onChange({ ...config, apiKey: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              background: loading ? '#333' : '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Loading…' : 'Fetch models'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#f87171', background: '#ef444422', borderRadius: 6, padding: '6px 10px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ fontSize: 12, color: '#34d399', background: '#10b98122', borderRadius: 6, padding: '6px 10px' }}>
          Models loaded successfully
        </div>
      )}

      <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>
        Find your endpoint in Azure AI Foundry → your project → Overview → Azure AI Services endpoint
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#1e1e2e',
  border: '1px solid #333',
  borderRadius: 7,
  padding: '7px 10px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
};
