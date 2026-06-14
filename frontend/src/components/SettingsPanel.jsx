import { useState } from 'react';

export default function SettingsPanel({ settings, onChange, onClose }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div style={{
      background: '#0d0d1e',
      borderBottom: '1px solid #2a2a4a',
      padding: '14px 24px',
    }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Anthropic key */}
        <div style={{ flex: '1 1 320px' }}>
          <label style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            ANTHROPIC API KEY
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-api03-..."
              value={settings.anthropicKey}
              onChange={e => onChange({ ...settings, anthropicKey: e.target.value })}
              style={inputStyle}
            />
            <button onClick={() => setShowKey(v => !v)} style={iconBtnStyle} title={showKey ? 'Hide' : 'Show'}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
            Stored in browser localStorage only. Never sent anywhere except your backend.
          </div>
        </div>

        {/* Budget */}
        <div style={{ flex: '0 1 180px' }}>
          <label style={{ fontSize: 11, color: '#34d399', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            COST BUDGET (USD)
          </label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: 14 }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="No limit"
              value={settings.budget ?? ''}
              onChange={e => onChange({ ...settings, budget: e.target.value ? parseFloat(e.target.value) : null })}
              style={{ ...inputStyle, width: 100 }}
            />
          </div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>Warns when exceeded</div>
        </div>

        {/* Thinking budget */}
        <div style={{ flex: '0 1 180px' }}>
          <label style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            THINKING BUDGET (tokens)
          </label>
          <input
            type="number"
            min="1000"
            max="32000"
            step="1000"
            value={settings.thinkingBudget ?? 3000}
            onChange={e => onChange({ ...settings, thinkingBudget: parseInt(e.target.value) || 3000 })}
            style={{ ...inputStyle, width: 100 }}
          />
          <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>For extended thinking mode</div>
        </div>

        <button onClick={onClose} style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: '1px solid #333',
          color: '#666',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: 'pointer',
          fontSize: 12,
          alignSelf: 'flex-start',
        }}>✕ Close</button>
      </div>
    </div>
  );
}

const inputStyle = {
  flex: 1,
  background: '#1e1e2e',
  border: '1px solid #333',
  borderRadius: 7,
  padding: '7px 10px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'monospace',
};

const iconBtnStyle = {
  background: '#1e1e2e',
  border: '1px solid #333',
  borderRadius: 7,
  padding: '7px 10px',
  cursor: 'pointer',
  fontSize: 14,
};
