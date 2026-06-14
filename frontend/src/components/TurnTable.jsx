export default function TurnTable({ turns }) {
  if (!turns.length) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            {['Turn', 'Input', 'Output', 'Reasoning', 'Tool calls', 'Cost', 'Stop reason'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#888', fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {turns.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '8px 12px', color: '#6366f1', fontWeight: 600 }}>T{t.turnIndex}</td>
              <td style={{ padding: '8px 12px', color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>{(t.usage?.input_tokens ?? 0).toLocaleString()}</td>
              <td style={{ padding: '8px 12px', color: '#22d3ee', fontVariantNumeric: 'tabular-nums' }}>{(t.usage?.output_tokens ?? 0).toLocaleString()}</td>
              <td style={{ padding: '8px 12px', color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>{(t.usage?.reasoning_tokens ?? 0).toLocaleString()}</td>
              <td style={{ padding: '8px 12px', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{t.toolCallCount ?? 0}</td>
              <td style={{ padding: '8px 12px', color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>${(t.cost?.total ?? 0).toFixed(6)}</td>
              <td style={{ padding: '8px 12px', color: '#666', fontSize: 11 }}>{t.stopReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
