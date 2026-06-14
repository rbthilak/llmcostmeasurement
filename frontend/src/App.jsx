import { useState, useEffect } from 'react';
import { fetchModels, sendMessage, checkHealth } from './api';
import { sendAzureMessage } from './azure';
import { useSession, MODEL_CONTEXT } from './store';
import DashboardMetrics from './components/DashboardMetrics';
import ChatPanel from './components/ChatPanel';
import TurnTable from './components/TurnTable';
import { TokenBarChart, CostLineChart, ToolCallChart } from './components/TurnChart';
import AzureSettings from './components/AzureSettings';
import SettingsPanel from './components/SettingsPanel';
import FlowTab from './components/FlowTab';
import AgentConfig from './components/AgentConfig';
import './App.css';

const LS_SETTINGS = 'llmcost_settings';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '{}');
  } catch { return {}; }
}

function saveSettings(s) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
}

const DEFAULT_SETTINGS = {
  anthropicKey: '',
  budget: null,
  thinkingBudget: 3000,
};

export default function App() {
  const [provider, setProvider] = useState('anthropic');
  const [anthropicModels, setAnthropicModels] = useState({});
  const [health, setHealth] = useState(null);

  const [azureConfig, setAzureConfig] = useState({ endpoint: '', apiKey: '' });
  const [azureModels, setAzureModels] = useState([]);
  const [azureModel, setAzureModel] = useState('');
  const [showAzureSettings, setShowAzureSettings] = useState(false);

  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...loadSettings() }));
  const [showSettings, setShowSettings] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);

  const [agentConfig, setAgentConfig] = useState({ presetId: 'blank', systemPrompt: '', tools: [] });
  const [showAgent, setShowAgent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  const { session, history, addTurn, resetSession, setModel } = useSession();

  useEffect(() => {
    fetchModels().then(setAnthropicModels).catch(() => {});
    checkHealth().then(setHealth).catch(() => {});
  }, []);

  const handleSettingsChange = (s) => {
    setSettings(s);
    saveSettings(s);
  };

  const switchProvider = (p) => {
    setProvider(p);
    resetSession(p === 'anthropic' ? session.model : (azureModel || ''));
    setError(null);
  };

  const handleAzureModelsLoaded = (models) => {
    setAzureModels(models);
    if (models.length > 0 && !azureModel) setAzureModel(models[0].id);
    setShowAzureSettings(false);
  };

  const handleSend = async (userMessage) => {
    setLoading(true);
    setError(null);
    try {
      const msgs = [...history, { role: 'user', content: userMessage }];
      let response;

      if (provider === 'anthropic') {
        const apiKey = settings.anthropicKey || undefined;
        response = await sendMessage({
          model: session.model,
          messages: msgs,
          enableThinking,
          thinkingBudget: settings.thinkingBudget,
          apiKey,
          systemPrompt: agentConfig.systemPrompt || undefined,
          tools: agentConfig.tools?.length ? agentConfig.tools : undefined,
        });
      } else {
        if (!azureModel) throw new Error('Select an Azure model first');
        if (!azureConfig.endpoint || !azureConfig.apiKey) throw new Error('Configure your Azure endpoint and API key');
        response = await sendAzureMessage({
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          model: azureModel,
          messages: msgs,
        });
      }
      addTurn(userMessage, response);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isAzure = provider === 'azure';
  const currentModelLabel = isAzure
    ? (azureModels.find(m => m.id === azureModel)?.label ?? azureModel ?? 'No model selected')
    : (anthropicModels[session.model]?.label ?? session.model);

  const hasData = session.turns.length > 0;
  const selectedAzureInfo = azureModels.find(m => m.id === azureModel);
  const hasAnthropicKey = !!(settings.anthropicKey || (health?.keySet));
  const budgetExceeded = settings.budget && session.totals.cost >= settings.budget;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #222',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#0d0d1e',
        flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.5px' }}>LLM Cost Meter</span>
        </div>

        {/* Provider toggle */}
        <div style={{ display: 'flex', background: '#1a1a2e', borderRadius: 8, padding: 3, border: '1px solid #2a2a4a' }}>
          {[{ id: 'anthropic', label: '🟣 Anthropic' }, { id: 'azure', label: '🔵 Azure AI Foundry' }].map(p => (
            <button key={p.id} onClick={() => switchProvider(p.id)} style={{
              background: provider === p.id ? '#6366f1' : 'transparent',
              color: provider === p.id ? '#fff' : '#666',
              border: 'none', borderRadius: 6, padding: '4px 12px',
              fontSize: 12, fontWeight: provider === p.id ? 600 : 400, cursor: 'pointer',
            }}>{p.label}</button>
          ))}
        </div>

        {/* Model selector */}
        {!isAzure ? (
          <select value={session.model} onChange={e => { setModel(e.target.value); resetSession(e.target.value); }} style={selectStyle}>
            {Object.entries(anthropicModels).map(([id, m]) => (
              <option key={id} value={id}>{m.label}</option>
            ))}
          </select>
        ) : (
          azureModels.length > 0 ? (
            <select value={azureModel} onChange={e => { setAzureModel(e.target.value); resetSession(e.target.value); }} style={selectStyle}>
              {azureModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 12, color: '#444' }}>No models — configure below</span>
          )
        )}

        {/* Context limit badge */}
        {!isAzure && (
          <span style={{
            fontSize: 11, borderRadius: 20, padding: '2px 9px',
            background: '#6366f111', border: '1px solid #6366f133', color: '#6366f1',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {((MODEL_CONTEXT[session.model] ?? 200_000) / 1000).toFixed(0)}K ctx
          </span>
        )}

        {/* Thinking toggle */}
        {!isAzure && anthropicModels[session.model]?.supportsThinking && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888', cursor: 'pointer' }}>
            <input type="checkbox" checked={enableThinking} onChange={e => setEnableThinking(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
            Thinking
          </label>
        )}

        {/* Azure config btn */}
        {isAzure && (
          <button onClick={() => setShowAzureSettings(v => !v)} style={{
            ...outlineBtn,
            borderColor: showAzureSettings ? '#6366f1' : '#333',
            color: showAzureSettings ? '#a5b4fc' : '#888',
          }}>⚙ Configure Azure</button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Status badges */}
        {!isAzure && (
          <span style={{
            fontSize: 11, borderRadius: 20, padding: '2px 8px',
            background: hasAnthropicKey ? '#10b98122' : '#ef444422',
            color: hasAnthropicKey ? '#34d399' : '#f87171',
            border: `1px solid ${hasAnthropicKey ? '#10b98144' : '#ef444444'}`,
          }}>
            {hasAnthropicKey ? '● connected' : '● no key'}
          </span>
        )}

        {/* Budget badge */}
        {settings.budget && (
          <span style={{
            fontSize: 11, borderRadius: 20, padding: '2px 8px',
            background: budgetExceeded ? '#ef444422' : '#34d39922',
            color: budgetExceeded ? '#f87171' : '#34d399',
            border: `1px solid ${budgetExceeded ? '#ef4444' : '#34d399'}44`,
          }}>
            ${session.totals.cost.toFixed(4)} / ${settings.budget.toFixed(2)}
          </span>
        )}

        {/* Agent config btn */}
        <button onClick={() => { setShowAgent(v => !v); setShowSettings(false); }} style={{
          ...outlineBtn,
          borderColor: showAgent ? '#a78bfa' : agentHasConfig(agentConfig) ? '#6366f144' : '#333',
          color: showAgent ? '#c4b5fd' : agentHasConfig(agentConfig) ? '#a78bfa' : '#888',
          background: agentHasConfig(agentConfig) ? '#6366f108' : 'transparent',
        }}>
          🤖 Agent
          {agentConfig.tools?.length > 0 && (
            <span style={{ marginLeft: 5, background: '#10b98133', color: '#34d399', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>
              {agentConfig.tools.length}
            </span>
          )}
        </button>

        {/* Settings btn */}
        <button onClick={() => { setShowSettings(v => !v); setShowAgent(false); }} style={{
          ...outlineBtn,
          borderColor: showSettings ? '#6366f1' : '#333',
          color: showSettings ? '#a5b4fc' : '#888',
        }}>⚙ Settings</button>

        <button onClick={() => resetSession(isAzure ? azureModel : session.model)} style={{ ...outlineBtn }}>
          Reset
        </button>
      </header>

      {/* Agent config panel */}
      {showAgent && (
        <div style={{ background: '#0d0d1e', borderBottom: '1px solid #2a2a4a', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>🤖 Agent Configuration</span>
            <button onClick={() => setShowAgent(false)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 12 }}>✕ Close</button>
          </div>
          <AgentConfig config={agentConfig} onChange={setAgentConfig} />
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Azure config panel */}
      {isAzure && showAzureSettings && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #222', background: '#0d0d1e' }}>
          <AzureSettings config={azureConfig} onChange={setAzureConfig} onModelsLoaded={handleAzureModelsLoaded} />
        </div>
      )}

      {/* Azure setup prompt */}
      {isAzure && azureModels.length === 0 && !showAzureSettings && (
        <div style={{ padding: '8px 20px', background: '#12122a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#555' }}>
          Configure your Azure AI Foundry endpoint to load available models.
          <button onClick={() => setShowAzureSettings(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
            Set up Azure
          </button>
        </div>
      )}

      {/* Azure pricing hint */}
      {isAzure && selectedAzureInfo?.pricing && (
        <div style={{ padding: '5px 20px', background: '#0d1220', borderBottom: '1px solid #1a2030', fontSize: 11, color: '#4a6080', display: 'flex', gap: 16 }}>
          <span>Input: <b style={{ color: '#5a7090' }}>${selectedAzureInfo.pricing.inputPerM}/M</b></span>
          <span>Output: <b style={{ color: '#5a7090' }}>${selectedAzureInfo.pricing.outputPerM}/M</b></span>
          {selectedAzureInfo.pricing.reasoningPerM > 0 && <span>Reasoning: <b style={{ color: '#5a7090' }}>${selectedAzureInfo.pricing.reasoningPerM}/M</b></span>}
          <span style={{ color: '#2a3a50' }}>· Azure PAYG pricing</span>
        </div>
      )}

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Chat */}
        <div style={{ width: '42%', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: 16, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ fontSize: 12, color: '#444', marginBottom: 10 }}>
            {isAzure && <span style={{ color: '#6366f1aa' }}>Azure · </span>}
            {session.turns.length} turn{session.turns.length !== 1 ? 's' : ''} · {currentModelLabel}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <ChatPanel turns={session.turns} onSend={handleSend} loading={loading} model={currentModelLabel}
              disabled={isAzure && (!azureModel || !azureConfig.endpoint || !azureConfig.apiKey)} />
          </div>
          {error && (
            <div style={{ marginTop: 8, background: '#ef444422', border: '1px solid #ef444444', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Right: Dashboard */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #222', flexShrink: 0 }}>
            {[
              { id: 'metrics', label: '📊 Metrics' },
              { id: 'flow', label: '🔀 Flow' },
              { id: 'charts', label: '📈 Charts' },
              { id: 'table', label: '🗂 Table' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: 'transparent', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === tab.id ? '#a5b4fc' : '#555',
                padding: '7px 14px', cursor: 'pointer', fontSize: 12,
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}>{tab.label}</button>
            ))}
          </div>

          {!hasData && (
            <div style={{ color: '#333', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
              {!isAzure && !hasAnthropicKey
                ? <span>Add your Anthropic API key in <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Settings</button> to start</span>
                : isAzure && azureModels.length === 0
                  ? 'Configure your Azure endpoint above to start'
                  : 'Send a message to start measuring costs'}
            </div>
          )}

          {activeTab === 'metrics' && (
            <DashboardMetrics session={session} settings={settings} />
          )}

          {activeTab === 'flow' && (
            <FlowTab turns={session.turns} model={isAzure ? azureModel : session.model} />
          )}

          {hasData && activeTab === 'charts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section title="Tokens per turn"><TokenBarChart turns={session.turns} /></Section>
              <Section title="Cost over turns"><CostLineChart turns={session.turns} /></Section>
              {session.totals.toolCalls > 0 && <Section title="Tool calls per turn"><ToolCallChart turns={session.turns} /></Section>}
            </div>
          )}

          {hasData && activeTab === 'table' && (
            <Section title="Per-turn breakdown"><TurnTable turns={session.turns} /></Section>
          )}
        </div>
      </div>
    </div>
  );
}

function agentHasConfig(c) {
  return !!(c?.systemPrompt?.trim() || c?.tools?.length);
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#1e1e2e', border: '1px solid #222', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 10, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

const selectStyle = {
  background: '#1e1e2e', border: '1px solid #2a2a3e', color: '#e2e8f0',
  borderRadius: 7, padding: '5px 10px', fontSize: 12, cursor: 'pointer',
};

const outlineBtn = {
  background: 'transparent', border: '1px solid #333', color: '#777',
  borderRadius: 7, padding: '5px 10px', fontSize: 12, cursor: 'pointer',
};
