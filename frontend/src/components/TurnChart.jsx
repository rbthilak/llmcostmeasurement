import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';

const COLORS = {
  input: '#6366f1',
  output: '#22d3ee',
  reasoning: '#f59e0b',
  toolCalls: '#10b981',
};

function fmt(v) {
  return v?.toLocaleString() ?? 0;
}

export function TokenBarChart({ turns }) {
  const data = turns.map(t => ({
    name: `T${t.turnIndex}`,
    Input: t.usage?.input_tokens ?? 0,
    Output: t.usage?.output_tokens ?? 0,
    Reasoning: t.usage?.reasoning_tokens ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
        <YAxis tick={{ fill: '#888', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
          labelStyle={{ color: '#ccc' }}
          formatter={(v, name) => [fmt(v), name]}
        />
        <Legend wrapperStyle={{ color: '#888', fontSize: 12 }} />
        <Bar dataKey="Input" fill={COLORS.input} radius={[4,4,0,0]} />
        <Bar dataKey="Output" fill={COLORS.output} radius={[4,4,0,0]} />
        <Bar dataKey="Reasoning" fill={COLORS.reasoning} radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CostLineChart({ turns }) {
  let cumulative = 0;
  const data = turns.map(t => {
    cumulative += t.cost?.total ?? 0;
    return {
      name: `T${t.turnIndex}`,
      'Turn cost ($)': parseFloat((t.cost?.total ?? 0).toFixed(6)),
      'Cumulative ($)': parseFloat(cumulative.toFixed(6)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
        <YAxis tick={{ fill: '#888', fontSize: 12 }} tickFormatter={v => `$${v.toFixed(4)}`} />
        <Tooltip
          contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
          formatter={v => [`$${v.toFixed(6)}`, '']}
        />
        <Legend wrapperStyle={{ color: '#888', fontSize: 12 }} />
        <Line type="monotone" dataKey="Turn cost ($)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
        <Line type="monotone" dataKey="Cumulative ($)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ToolCallChart({ turns }) {
  const data = turns.map(t => ({
    name: `T${t.turnIndex}`,
    'Tool calls': t.toolCallCount ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: '#888', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
        />
        <Bar dataKey="Tool calls" fill={COLORS.toolCalls} radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
