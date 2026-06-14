import { useState } from 'react';
import { PRESET_LIST, PRESETS } from '../agentPresets';

const TOOL_TEMPLATE = {
  name: 'my_tool',
  description: 'Describe what this tool does',
  input_schema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'A parameter description' },
    },
    required: ['param'],
  },
};

function ToolCard({ tool, index, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const [schemaRaw, setSchemaRaw] = useState(() => JSON.stringify(tool.input_schema, null, 2));
  const [schemaError, setSchemaError] = useState(null);

  const handleSchemaChange = (raw) => {
    setSchemaRaw(raw);
    try {
      const parsed = JSON.parse(raw);
      onChange({ ...tool, input_schema: parsed });
      setSchemaError(null);
    } catch (e) {
      setSchemaError(e.message);
    }
  };

  return (
    <div style={{
      background: '#0d1a12',
      border: '1px solid #10b98133',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <span style={{ fontSize: 13, color: '#6ee7b7', fontFamily: 'monospace', fontWeight: 600 }}>⚙ {tool.name || 'unnamed'}</span>
        <button onClick={() => setOpen(v => !v)} style={{
          background: open ? '#10b98122' : 'transparent',
          border: `1px solid ${open ? '#10b981' : '#2a4a3a'}`,
          color: open ? '#34d399' : '#4a6a5a',
          borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 11, marginLeft: 'auto',
        }}>
          {open ? '▲ collapse' : '▼ edit'}
        </button>
        <button onClick={onDelete} style={{
          background: 'none', border: '1px solid #3a1a1a', color: '#5a2a2a',
          borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 11,
        }} title="Remove this tool">
          ✕
        </button>
      </div>

      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #10b98122' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 10, color: '#4a6a5a', display: 'block', marginBottom: 3, marginTop: 8 }}>TOOL NAME</label>
            <input
              value={tool.name}
              onChange={e => onChange({ ...tool, name: e.target.value.replace(/\s/g, '_') })}
              placeholder="tool_name"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a1a10', border: '1px solid #10b98133', borderRadius: 5,
                color: '#6ee7b7', fontFamily: 'monospace', fontSize: 13, padding: '5px 8px', outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 10, color: '#4a6a5a', display: 'block', marginBottom: 3 }}>DESCRIPTION</label>
            <textarea
              value={tool.description}
              onChange={e => onChange({ ...tool, description: e.target.value })}
              rows={2}
              placeholder="What does this tool do?"
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                background: '#0a1a10', border: '1px solid #10b98133', borderRadius: 5,
                color: '#a7f3d0', fontSize: 12, padding: '5px 8px', outline: 'none', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Input schema */}
          <div>
            <label style={{ fontSize: 10, color: '#4a6a5a', display: 'block', marginBottom: 3 }}>
              INPUT SCHEMA (JSON)
              {schemaError && <span style={{ color: '#f87171', marginLeft: 8 }}>⚠ {schemaError}</span>}
            </label>
            <textarea
              value={schemaRaw}
              onChange={e => handleSchemaChange(e.target.value)}
              rows={7}
              spellCheck={false}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                background: '#060e08', border: `1px solid ${schemaError ? '#ef4444' : '#10b98122'}`, borderRadius: 5,
                color: '#6ee7b7', fontFamily: 'monospace', fontSize: 11, padding: '6px 8px', outline: 'none', lineHeight: 1.6,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentConfig({ config, onChange }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonRaw, setJsonRaw] = useState(() => JSON.stringify(config.tools ?? [], null, 2));
  const [jsonError, setJsonError] = useState(null);

  const applyPreset = (id) => {
    const p = PRESETS[id];
    if (!p) return;
    const newConfig = { ...config, presetId: id, systemPrompt: p.systemPrompt, tools: [...(p.tools ?? [])] };
    onChange(newConfig);
    setJsonRaw(JSON.stringify(p.tools ?? [], null, 2));
    setJsonError(null);
  };

  const handleSystemPromptChange = (v) => {
    onChange({ ...config, systemPrompt: v, presetId: 'custom' });
  };

  const handleToolChange = (index, updated) => {
    const tools = [...(config.tools ?? [])];
    tools[index] = updated;
    onChange({ ...config, tools, presetId: 'custom' });
    setJsonRaw(JSON.stringify(tools, null, 2));
  };

  const handleToolDelete = (index) => {
    const tools = (config.tools ?? []).filter((_, i) => i !== index);
    onChange({ ...config, tools, presetId: 'custom' });
    setJsonRaw(JSON.stringify(tools, null, 2));
  };

  const handleAddTool = () => {
    const tools = [...(config.tools ?? []), { ...TOOL_TEMPLATE }];
    onChange({ ...config, tools, presetId: 'custom' });
    setJsonRaw(JSON.stringify(tools, null, 2));
  };

  const handleJsonChange = (raw) => {
    setJsonRaw(raw);
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array');
      onChange({ ...config, tools: parsed, presetId: 'custom' });
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const activeTools = config.tools ?? [];
  const hasAgent = config.systemPrompt?.trim() || activeTools.length > 0;
  const currentPreset = PRESETS[config.presetId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Presets */}
      <div>
        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 8 }}>
          SAMPLE PRESETS
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESET_LIST.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              title={p.description}
              style={{
                background: config.presetId === p.id ? '#6366f122' : '#12122a',
                border: `1px solid ${config.presetId === p.id ? '#6366f1' : '#2a2a4a'}`,
                color: config.presetId === p.id ? '#a5b4fc' : '#888',
                borderRadius: 8,
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: config.presetId === p.id ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {p.tools?.length > 0 && (
                <span style={{ background: '#10b98133', color: '#34d399', borderRadius: 10, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>
                  {p.tools.length}t
                </span>
              )}
              {p.thinkingHint && (
                <span style={{ background: '#f59e0b22', color: '#f59e0b', borderRadius: 10, padding: '1px 5px', fontSize: 10 }} title="Works best with Thinking enabled">
                  💭
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Thinking hint banner */}
        {currentPreset?.thinkingHint && (
          <div style={{
            marginTop: 8,
            background: '#78350f22',
            border: '1px solid #f59e0b33',
            borderRadius: 7,
            padding: '7px 12px',
            fontSize: 12,
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            💭 This preset works best with <strong>Thinking enabled</strong> (toggle in the header bar) — it generates extended reasoning tokens.
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 600, letterSpacing: '0.06em' }}>SYSTEM PROMPT</span>
          {config.systemPrompt?.trim() && (
            <span style={{ fontSize: 10, color: '#666' }}>{config.systemPrompt.trim().split(/\s+/).length} words</span>
          )}
          <button
            onClick={() => handleSystemPromptChange('')}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 11, marginLeft: 'auto' }}
          >
            Clear
          </button>
        </div>
        <textarea
          value={config.systemPrompt ?? ''}
          onChange={e => handleSystemPromptChange(e.target.value)}
          placeholder={`You are a helpful assistant...\n\nTip: the system prompt shapes the model's persona, tone, and behavior for the entire conversation.`}
          rows={6}
          style={{
            width: '100%',
            background: '#12122a',
            border: '1px solid #2a2a4a',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#c4b5fd',
            fontSize: 13,
            fontFamily: 'monospace',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tools */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600, letterSpacing: '0.06em' }}>
            TOOLS ({activeTools.length} configured)
          </span>
          <button onClick={handleAddTool} style={{
            background: '#10b98122', border: '1px solid #10b98144',
            color: '#34d399', borderRadius: 6, padding: '3px 10px',
            cursor: 'pointer', fontSize: 11, marginLeft: 'auto',
          }}>
            + Add tool
          </button>
          <button onClick={() => setShowJson(v => !v)} style={{
            background: showJson ? '#10b98122' : 'transparent',
            border: `1px solid ${showJson ? '#10b981' : '#2a2a4a'}`,
            color: showJson ? '#34d399' : '#555',
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11,
          }}>
            {showJson ? '▲ Hide JSON' : '{ } Raw JSON'}
          </button>
        </div>

        {/* Visual tool cards */}
        {!showJson && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeTools.length === 0 && (
              <div style={{ fontSize: 12, color: '#333', padding: '8px 0' }}>
                No tools — pick a preset or click "+ Add tool"
              </div>
            )}
            {activeTools.map((t, i) => (
              <ToolCard
                key={i}
                tool={t}
                index={i}
                onChange={(updated) => handleToolChange(i, updated)}
                onDelete={() => handleToolDelete(i)}
              />
            ))}
          </div>
        )}

        {/* Raw JSON editor */}
        {showJson && (
          <div>
            <textarea
              value={jsonRaw}
              onChange={e => handleJsonChange(e.target.value)}
              rows={14}
              spellCheck={false}
              style={{
                width: '100%',
                background: '#0a0a1a',
                border: `1px solid ${jsonError ? '#ef4444' : '#1e2a3a'}`,
                borderRadius: 8,
                padding: '10px 12px',
                color: '#6ee7b7',
                fontSize: 12,
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
            {jsonError && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>⚠ JSON error: {jsonError}</div>}
            <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>
              Array of Anthropic tool objects —{' '}
              <a href="https://docs.anthropic.com/en/docs/tool-use" target="_blank" rel="noreferrer" style={{ color: '#4a5a7a' }}>
                see docs
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Active config summary */}
      {hasAgent && (
        <div style={{
          background: '#0d1a0d',
          border: '1px solid #14401a',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 11,
          color: '#4a7a4a',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ color: '#34d399' }}>● Agent active</span>
          {config.systemPrompt?.trim() && <span>Prompt: {config.systemPrompt.trim().split(/\s+/).length}w</span>}
          {activeTools.length > 0 && <span>Tools: {activeTools.map(t => t.name).join(', ')}</span>}
        </div>
      )}
    </div>
  );
}
