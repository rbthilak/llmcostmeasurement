export default function MetricCard({ label, value, sub, color = '#6366f1', icon }) {
  return (
    <div style={{
      background: '#1e1e2e',
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 13 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#666' }}>{sub}</div>}
    </div>
  );
}
