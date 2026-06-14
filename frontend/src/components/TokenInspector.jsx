import { useState, useEffect } from 'react';

const BASE = 'http://localhost:3001/api';

// 8 alternating background shades per token type so adjacent tokens are visually distinct
const PALETTES = {
  input: [
    '#3730a322', '#4338ca22', '#4f46e522', '#6366f122',
    '#3730a333', '#4338ca33', '#4f46e533', '#6366f133',
  ],
  output: [
    '#0e749122', '#0891b222', '#06b6d422', '#22d3ee22',
    '#0e749133', '#0891b233', '#06b6d433', '#22d3ee33',
  ],
  reasoning: [
    '#92400e22', '#b4530a22', '#d9770622', '#f59e0b22',
    '#92400e33', '#b4530a33', '#d9770633', '#f59e0b33',
  ],
};

const TEXT_COLORS = {
  input: '#a5b4fc',
  output: '#67e8f9',
  reasoning: '#fcd34d',
};

const BORDER_COLORS = {
  input: '#6366f144',
  output: '#22d3ee44',
  reasoning: '#f59e0b44',
};

function TokenChip({ text, index, type, hovered, onHover, onLeave }) {
  const palette = PALETTES[type];
  const bg = palette[index % palette.length];
  const isHovered = hovered === index;

  // Replace special whitespace chars for display
  const display = text
    .replace(/\n/g, '↵')
    .replace(/\t/g, '→')
    .replace(/^ $/, '·');

  return (
    <span
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onLeave}
      title={`Token ${index + 1}: "${text}" (${text.length} chars)`}
      style={{
        display: 'inline-block',
        background: isHovered ? `${bg.slice(0, -2)}88` : bg,
        border: `1px solid ${isHovered ? BORDER_COLORS[type].slice(0, -2) + 'aa' : BORDER_COLORS[type]}`,
        borderRadius: 4,
        padding: '1px 4px',
        margin: '2px 2px',
        fontSize: 12,
        fontFamily: 'monospace',
        color: TEXT_COLORS[type],
        cursor: 'default',
        verticalAlign: 'middle',
        lineHeight: 1.6,
        transition: 'background 0.1s, border 0.1s',
        whiteSpace: 'pre',
        boxShadow: isHovered ? `0 0 4px ${BORDER_COLORS[type]}` : 'none',
      }}
    >
      {display}
    </span>
  );
}

function TokenSection({ type, tokens, label, raw }) {
  const [hovered, setHovered] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  if (!tokens || tokens.length === 0) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          {label} — <span style={{ color: '#333' }}>0 tokens</span>
        </div>
        <div style={{ fontSize: 12, color: '#2a2a3a', fontStyle: 'italic' }}>none</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: TEXT_COLORS[type], fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{
          background: `${BORDER_COLORS[type].slice(0, -2)}22`,
          border: `1px solid ${BORDER_COLORS[type]}`,
          borderRadius: 10,
          padding: '1px 8px',
          fontSize: 11,
          color: TEXT_COLORS[type],
          fontWeight: 600,
        }}>
          {tokens.length} tokens
        </span>
        {hovered !== null && (
          <span style={{ fontSize: 11, color: '#666', marginLeft: 4 }}>
            Token {hovered + 1}: <span style={{ fontFamily: 'monospace', color: TEXT_COLORS[type] }}>"{tokens[hovered]}"</span>
          </span>
        )}
        <button
          onClick={() => setShowRaw(v => !v)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#444', fontSize: 11, cursor: 'pointer' }}
        >
          {showRaw ? 'show tokens' : 'show raw'}
        </button>
      </div>

      {/* Token chips or raw text */}
      {showRaw ? (
        <div style={{
          background: '#0a0a1a',
          border: `1px solid ${BORDER_COLORS[type]}`,
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 12,
          fontFamily: 'monospace',
          color: TEXT_COLORS[type],
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          maxHeight: 120,
          overflowY: 'auto',
        }}>
          {raw}
        </div>
      ) : (
        <div style={{
          background: '#0a0a14',
          border: `1px solid ${BORDER_COLORS[type].slice(0, -2)}33`,
          borderRadius: 6,
          padding: '8px 6px',
          lineHeight: 1.8,
          maxHeight: 180,
          overflowY: 'auto',
        }}>
          {tokens.map((tok, i) => (
            <TokenChip
              key={i}
              text={tok}
              index={i}
              type={type}
              hovered={hovered}
              onHover={setHovered}
              onLeave={() => setHovered(null)}
            />
          ))}
        </div>
      )}

      {/* Mini token frequency bar */}
      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        {getTopTokens(tokens, 5).map(({ tok, count }) => (
          <span key={tok} style={{ fontSize: 10, color: '#444', background: '#111', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace' }}>
            "{tok === ' ' ? '·' : tok}" ×{count}
          </span>
        ))}
      </div>
    </div>
  );
}

function getTopTokens(tokens, n) {
  const counts = {};
  for (const t of tokens) counts[t] = (counts[t] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([tok, count]) => ({ tok, count }));
}

export default function TokenInspector({ turn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/tokenize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: {
            input: turn.userMessage ?? '',
            output: turn.assistantContent ?? '',
            reasoning: turn.thinking ?? '',
          },
        }),
      });
      const json = await r.json();
      setData(json);
      setLoaded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ fontSize: 12, color: '#555', padding: '12px 0', textAlign: 'center' }}>
      Tokenizing…
    </div>
  );

  if (error) return (
    <div style={{ fontSize: 12, color: '#f87171', padding: 8 }}>Error: {error}</div>
  );

  if (!data) return null;

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
        Hover a token chip to inspect it. Each chip = 1 token (BPE cl100k, approximate — actual Claude tokenization may differ slightly).
      </div>

      <TokenSection
        type="input"
        label="Input (prompt sent)"
        tokens={data.input}
        raw={turn.userMessage}
      />

      {turn.thinking && (
        <TokenSection
          type="reasoning"
          label="Reasoning (extended thinking)"
          tokens={data.reasoning}
          raw={turn.thinking}
        />
      )}

      <TokenSection
        type="output"
        label="Output (response received)"
        tokens={data.output}
        raw={turn.assistantContent}
      />

      {/* Token count summary */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 4,
        padding: '8px 10px',
        background: '#0d0d1e',
        borderRadius: 6,
        border: '1px solid #1a1a2e',
        fontSize: 12,
      }}>
        <span style={{ color: '#a5b4fc' }}>In: {data.input?.length ?? 0}</span>
        {data.reasoning?.length > 0 && <span style={{ color: '#fcd34d' }}>Think: {data.reasoning.length}</span>}
        <span style={{ color: '#67e8f9' }}>Out: {data.output?.length ?? 0}</span>
        <span style={{ color: '#555' }}>Total: {(data.input?.length ?? 0) + (data.reasoning?.length ?? 0) + (data.output?.length ?? 0)}</span>
        <span style={{ color: '#333', marginLeft: 'auto', fontSize: 11 }}>API reported: {(turn.usage?.input_tokens ?? 0) + (turn.usage?.output_tokens ?? 0)} tok</span>
      </div>
    </div>
  );
}
