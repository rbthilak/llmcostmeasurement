import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ turns, onSend, loading, model, disabled }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, loading]);

  const handleSend = () => {
    if (!input.trim() || loading || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 12 }}>
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingRight: 4,
      }}>
        {turns.length === 0 && (
          <div style={{ color: '#555', textAlign: 'center', marginTop: 60, fontSize: 14 }}>
            Send a message to start measuring costs
          </div>
        )}
        {turns.map(t => (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* User bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                background: '#6366f122',
                border: '1px solid #6366f144',
                borderRadius: '12px 12px 4px 12px',
                padding: '10px 14px',
                maxWidth: '75%',
                color: '#c7d2fe',
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {t.userMessage}
              </div>
            </div>

            {/* Thinking block */}
            {t.thinking && (
              <details style={{ marginLeft: 8 }}>
                <summary style={{ color: '#f59e0b', fontSize: 12, cursor: 'pointer', marginBottom: 4 }}>
                  Thinking ({(t.usage?.reasoning_tokens ?? 0).toLocaleString()} tokens)
                </summary>
                <div style={{
                  background: '#1a1a2e',
                  border: '1px solid #f59e0b33',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#a88a4a',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}>
                  {t.thinking}
                </div>
              </details>
            )}

            {/* Tool calls */}
            {t.toolCalls?.length > 0 && (
              <div style={{ marginLeft: 8 }}>
                {t.toolCalls.map((tc, i) => (
                  <div key={i} style={{
                    background: '#10b98122',
                    border: '1px solid #10b98144',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: '#6ee7b7',
                    fontFamily: 'monospace',
                    marginBottom: 4,
                  }}>
                    Tool: {tc.name}({JSON.stringify(tc.input)})
                  </div>
                ))}
              </div>
            )}

            {/* Assistant bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: '#1e1e2e',
                border: '1px solid #333',
                borderRadius: '12px 12px 12px 4px',
                padding: '10px 14px',
                maxWidth: '75%',
                color: '#e2e8f0',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {t.assistantContent || <span style={{ color: '#555' }}>[no text content]</span>}
              </div>
            </div>

            {/* Per-turn cost badge */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 4 }}>
              <Badge color="#6366f1">{(t.usage?.input_tokens ?? 0).toLocaleString()} in</Badge>
              <Badge color="#22d3ee">{(t.usage?.output_tokens ?? 0).toLocaleString()} out</Badge>
              {(t.usage?.reasoning_tokens ?? 0) > 0 && (
                <Badge color="#f59e0b">{(t.usage?.reasoning_tokens ?? 0).toLocaleString()} think</Badge>
              )}
              {(t.toolCallCount ?? 0) > 0 && (
                <Badge color="#10b981">{t.toolCallCount} tool{t.toolCallCount !== 1 ? 's' : ''}</Badge>
              )}
              <Badge color="#34d399">${(t.cost?.total ?? 0).toFixed(6)}</Badge>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: '#1e1e2e',
              border: '1px solid #333',
              borderRadius: '12px 12px 12px 4px',
              padding: '10px 14px',
              color: '#555',
              fontSize: 14,
            }}>
              <span className="typing-dots">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${model}... (Enter to send, Shift+Enter for newline)`}
          rows={2}
          style={{
            flex: 1,
            background: '#1e1e2e',
            border: '1px solid #333',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#e2e8f0',
            fontSize: 14,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || disabled}
          style={{
            background: loading || !input.trim() || disabled ? '#333' : '#6366f1',
            color: loading || !input.trim() || disabled ? '#666' : '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            cursor: loading || !input.trim() || disabled ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'background 0.2s',
            height: 44,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{
      background: `${color}22`,
      border: `1px solid ${color}44`,
      color,
      borderRadius: 20,
      padding: '2px 8px',
      fontSize: 11,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {children}
    </span>
  );
}
