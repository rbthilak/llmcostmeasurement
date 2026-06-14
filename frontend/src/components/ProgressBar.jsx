export default function ProgressBar({ value, max, color = '#6366f1', label, sublabel, warn }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isWarn = warn && pct >= warn;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
        <span style={{ fontSize: 12, color: barColor, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {pct.toFixed(1)}% {sublabel && <span style={{ color: '#555', fontWeight: 400 }}>({sublabel})</span>}
        </span>
      </div>
      <div style={{
        height: 6,
        background: '#1e1e2e',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid #222',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.5s ease, background 0.3s ease',
          boxShadow: pct > 0 ? `0 0 6px ${barColor}66` : 'none',
        }} />
      </div>
    </div>
  );
}
