import ProgressBar from './ProgressBar';
import { MODEL_CONTEXT } from '../store';

function Card({ label, value, sub, color = '#6366f1', small }) {
  return (
    <div style={{
      background: '#1e1e2e',
      border: `1px solid ${color}22`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ fontSize: 11, color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: small ? 18 : 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#444' }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 8px' }}>
      {children}
    </div>
  );
}

export default function DashboardMetrics({ session, settings }) {
  const { totals, turns, model, startedAt } = session;

  const turnCount = turns.length;
  const avgCostPerTurn = turnCount > 0 ? totals.cost / turnCount : 0;
  const avgInputPerTurn = turnCount > 0 ? Math.round(totals.inputTokens / turnCount) : 0;
  const avgOutputPerTurn = turnCount > 0 ? Math.round(totals.outputTokens / turnCount) : 0;
  const avgResponseMs = turnCount > 0 ? Math.round(totals.totalResponseMs / turnCount) : 0;

  const totalTokens = totals.totalTokens;
  const inputPct = totalTokens > 0 ? (totals.inputTokens / totalTokens) * 100 : 0;
  const outputPct = totalTokens > 0 ? (totals.outputTokens / totalTokens) * 100 : 0;
  const reasoningPct = totalTokens > 0 ? (totals.reasoningTokens / totalTokens) * 100 : 0;

  const contextLimit = MODEL_CONTEXT[model] ?? 200_000;
  // Context usage = last turn's input tokens (cumulative conversation context)
  const lastInputTokens = turns.length > 0 ? turns[turns.length - 1].usage?.input_tokens ?? 0 : 0;

  const budget = settings?.budget ?? null;
  const budgetPct = budget ? (totals.cost / budget) * 100 : null;

  const sessionDurationMs = Date.now() - startedAt;
  const sessionDurationMin = (sessionDurationMs / 60000).toFixed(1);

  // Cost per 1K tokens
  const costPerKTokens = totalTokens > 0 ? (totals.cost / totalTokens) * 1000 : 0;

  // Token efficiency ratio
  const efficiencyRatio = totals.inputTokens > 0
    ? (totals.outputTokens / totals.inputTokens).toFixed(2)
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Cost section */}
      <div>
        <SectionTitle>Cost</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <Card label="Total cost" value={`$${totals.cost.toFixed(5)}`} color="#34d399" />
          <Card label="Avg / turn" value={`$${avgCostPerTurn.toFixed(5)}`} color="#6ee7b7" small />
          <Card label="Per 1K tokens" value={`$${costPerKTokens.toFixed(4)}`} color="#a7f3d0" small />
          <Card
            label="Last turn"
            value={turns.length > 0 ? `$${(turns[turns.length - 1].cost?.total ?? 0).toFixed(5)}` : '—'}
            color="#86efac"
            small
          />
        </div>
      </div>

      {/* Token section */}
      <div>
        <SectionTitle>Tokens</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <Card label="Total tokens" value={totalTokens.toLocaleString()} color="#a5b4fc" />
          <Card label="Input" value={totals.inputTokens.toLocaleString()} sub={`avg ${avgInputPerTurn.toLocaleString()}/turn`} color="#6366f1" small />
          <Card label="Output" value={totals.outputTokens.toLocaleString()} sub={`avg ${avgOutputPerTurn.toLocaleString()}/turn`} color="#22d3ee" small />
          <Card label="Reasoning" value={totals.reasoningTokens.toLocaleString()} color="#f59e0b" small />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
          <Card
            label="Context limit"
            value={`${(contextLimit / 1000).toFixed(0)}K`}
            sub={`${model} window`}
            color="#6366f1"
            small
          />
          <Card
            label="Context used %"
            value={`${((lastInputTokens / contextLimit) * 100).toFixed(1)}%`}
            sub={`${lastInputTokens.toLocaleString()} / ${(contextLimit / 1000).toFixed(0)}K`}
            color={lastInputTokens / contextLimit > 0.9 ? '#f87171' : lastInputTokens / contextLimit > 0.7 ? '#fbbf24' : '#34d399'}
            small
          />
          <Card
            label="Remaining ctx"
            value={(contextLimit - lastInputTokens).toLocaleString()}
            sub="tokens left in window"
            color="#818cf8"
            small
          />
          <Card
            label="Avg tokens/turn"
            value={turnCount > 0 ? Math.round(totalTokens / turnCount).toLocaleString() : '—'}
            sub="all token types"
            color="#94a3b8"
            small
          />
        </div>
      </div>

      {/* Session section */}
      <div>
        <SectionTitle>Session</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <Card label="Turns" value={turnCount} color="#c4b5fd" />
          <Card label="Tool calls" value={totals.toolCalls} color="#10b981" />
          <Card label="Avg response" value={avgResponseMs > 0 ? `${(avgResponseMs / 1000).toFixed(1)}s` : '—'} color="#fb923c" small />
          <Card label="Session time" value={`${sessionDurationMin}m`} color="#94a3b8" small />
        </div>
      </div>

      {/* Advanced */}
      <div>
        <SectionTitle>Efficiency</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <Card label="Output/Input ratio" value={efficiencyRatio} sub="output ÷ input tokens" color="#e879f9" small />
          <Card
            label="Input cache read"
            value={(turns.reduce((s, t) => s + (t.usage?.cache_read_input_tokens ?? 0), 0)).toLocaleString()}
            color="#67e8f9"
            small
          />
          <Card
            label="Input cache write"
            value={(turns.reduce((s, t) => s + (t.usage?.cache_creation_input_tokens ?? 0), 0)).toLocaleString()}
            color="#a5f3fc"
            small
          />
          <Card
            label="Stop reason (last)"
            value={turns.length > 0 ? turns[turns.length - 1].stopReason ?? '—' : '—'}
            color="#64748b"
            small
          />
        </div>
      </div>

      {/* Progress section */}
      <div>
        <SectionTitle>Progress</SectionTitle>
        <div style={{
          background: '#1e1e2e',
          border: '1px solid #222',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Context window */}
          <ProgressBar
            value={lastInputTokens}
            max={contextLimit}
            color="#6366f1"
            label="Context window usage"
            sublabel={`${lastInputTokens.toLocaleString()} / ${(contextLimit / 1000).toFixed(0)}K tokens`}
            warn={70}
          />

          {/* Budget */}
          {budget !== null ? (
            <ProgressBar
              value={totals.cost}
              max={budget}
              color="#34d399"
              label={`Cost budget ($${budget.toFixed(2)})`}
              sublabel={`$${totals.cost.toFixed(5)} used`}
              warn={80}
            />
          ) : (
            <div style={{ fontSize: 12, color: '#444' }}>
              No budget set — add one in Settings to track spend
            </div>
          )}

          {/* Token composition */}
          {totalTokens > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Token composition</div>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: '#111' }}>
                <div title={`Input: ${inputPct.toFixed(1)}%`} style={{ width: `${inputPct}%`, background: '#6366f1', transition: 'width 0.5s' }} />
                <div title={`Output: ${outputPct.toFixed(1)}%`} style={{ width: `${outputPct}%`, background: '#22d3ee', transition: 'width 0.5s' }} />
                <div title={`Reasoning: ${reasoningPct.toFixed(1)}%`} style={{ width: `${reasoningPct}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                {[
                  { label: 'Input', pct: inputPct, color: '#6366f1' },
                  { label: 'Output', pct: outputPct, color: '#22d3ee' },
                  { label: 'Reasoning', pct: reasoningPct, color: '#f59e0b' },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    {label} <span style={{ color }}>{pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget warning */}
          {budgetPct !== null && budgetPct >= 80 && (
            <div style={{
              background: budgetPct >= 100 ? '#ef444422' : '#f59e0b22',
              border: `1px solid ${budgetPct >= 100 ? '#ef4444' : '#f59e0b'}44`,
              borderRadius: 7,
              padding: '7px 12px',
              fontSize: 12,
              color: budgetPct >= 100 ? '#f87171' : '#fbbf24',
            }}>
              {budgetPct >= 100
                ? `⚠ Budget exceeded! $${totals.cost.toFixed(4)} spent of $${budget.toFixed(2)} limit`
                : `⚡ ${budgetPct.toFixed(0)}% of budget used`}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
