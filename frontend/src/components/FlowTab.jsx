import { useState } from 'react';
import TokenInspector from './TokenInspector.jsx';
import { MODEL_CONTEXT } from '../store';

// ─── Token Block Map ───────────────────────────────────────────────────────────
const BLOCK_SIZE = 10;

function TokenMap({ turns, model }) {
  const [inspectorTurn, setInspectorTurn] = useState(null);
  const contextLimit = MODEL_CONTEXT[model] ?? 200_000;
  const lastTurn = turns[turns.length - 1];
  const latestInput = lastTurn?.usage?.input_tokens ?? 0;
  const contextPct = ((latestInput / contextLimit) * 100).toFixed(1);

  if (!turns.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#0d0d20', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Model context limit</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a5b4fc' }}>{(contextLimit / 1000).toFixed(0)}K tokens</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Current usage</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: latestInput / contextLimit > 0.9 ? '#f87171' : latestInput / contextLimit > 0.7 ? '#fbbf24' : '#34d399' }}>
            {latestInput.toLocaleString()} <span style={{ fontSize: 12, color: '#555' }}>({contextPct}%)</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(latestInput / contextLimit * 100, 100)}%`, background: latestInput / contextLimit > 0.9 ? '#ef4444' : latestInput / contextLimit > 0.7 ? '#f59e0b' : '#6366f1', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {turns.map(t => {
        const inputBlocks = Math.ceil((t.usage?.input_tokens ?? 0) / BLOCK_SIZE);
        const outputBlocks = Math.ceil((t.usage?.output_tokens ?? 0) / BLOCK_SIZE);
        const reasonBlocks = Math.ceil((t.usage?.reasoning_tokens ?? 0) / BLOCK_SIZE);
        const total = inputBlocks + outputBlocks + reasonBlocks;
        const blocks = [...Array(inputBlocks).fill('input'), ...Array(reasonBlocks).fill('reasoning'), ...Array(outputBlocks).fill('output')];
        const colorMap = { input: '#6366f1', output: '#22d3ee', reasoning: '#f59e0b' };
        const isSelected = inspectorTurn?.id === t.id;
        return (
          <div key={t.id} style={{ background: '#16162a', borderRadius: 8, padding: '10px 12px', border: `1px solid ${isSelected ? '#6366f155' : '#222'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>Turn {t.turnIndex}</span>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#555', flexWrap: 'wrap' }}>
                <span style={{ color: '#6366f1' }}>↗ {(t.usage?.input_tokens ?? 0).toLocaleString()} in</span>
                {(t.usage?.reasoning_tokens ?? 0) > 0 && <span style={{ color: '#f59e0b' }}>💭 {(t.usage?.reasoning_tokens ?? 0).toLocaleString()} think</span>}
                <span style={{ color: '#22d3ee' }}>↙ {(t.usage?.output_tokens ?? 0).toLocaleString()} out</span>
              </div>
              <button onClick={() => setInspectorTurn(isSelected ? null : t)} style={{ background: isSelected ? '#6366f122' : 'transparent', border: `1px solid ${isSelected ? '#6366f1' : '#2a2a4a'}`, color: isSelected ? '#a5b4fc' : '#555', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>
                🔬 {isSelected ? 'hide inspector' : 'token inspector'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, maxHeight: 100, overflowY: 'auto' }}>
              {blocks.map((type, i) => (
                <div key={i} title={`${type} token block`} style={{ width: 8, height: 8, borderRadius: 2, background: colorMap[type], opacity: 0.8, flexShrink: 0 }} />
              ))}
            </div>
            <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8, background: '#111' }}>
              <div style={{ width: `${(inputBlocks / total) * 100}%`, background: '#6366f1' }} />
              <div style={{ width: `${(reasonBlocks / total) * 100}%`, background: '#f59e0b' }} />
              <div style={{ width: `${(outputBlocks / total) * 100}%`, background: '#22d3ee' }} />
            </div>
            {isSelected && <div style={{ marginTop: 12, borderTop: '1px solid #2a2a4a', paddingTop: 12 }}><TokenInspector turn={t} /></div>}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#555', justifyContent: 'center', paddingTop: 4 }}>
        {[['#6366f1', 'Input tokens'], ['#f59e0b', 'Reasoning tokens'], ['#22d3ee', 'Output tokens']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            {l}
          </div>
        ))}
        <span>· Each block = {BLOCK_SIZE} tokens</span>
      </div>
    </div>
  );
}

// ─── Prompt Journey: Detailed Execution Flow ───────────────────────────────────

function VArrow({ color = '#2a2a4a', label, labelColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, padding: '2px 0' }}>
      {label && <div style={{ fontSize: 10, color: labelColor ?? '#555', marginBottom: 2, fontFamily: 'monospace' }}>{label}</div>}
      <div style={{ width: 2, height: 18, background: color }} />
      <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${color}` }} />
    </div>
  );
}

function StageBox({ children, color, glow, style }) {
  return (
    <div style={{
      background: '#111122',
      border: `1px solid ${color ?? '#2a2a4a'}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: glow ? `0 0 16px ${color}33` : 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

function StageLine({ icon, label, color, dim }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: dim ? '#444' : color }}>{label}</span>
    </div>
  );
}

function Chip({ children, color, bg }) {
  return (
    <span style={{ background: bg ?? `${color}18`, border: `1px solid ${color}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, color, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// Merge funnel: N sources → 1 output
function MergeFunnel({ sources }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Source boxes in a row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        {sources.map((s, i) => (
          <div key={i} style={{
            background: `${s.color}10`,
            border: `1px solid ${s.color}44`,
            borderRadius: 7,
            padding: '7px 10px',
            minWidth: s.wide ? 160 : 110,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
            </div>
            {s.sub && <div style={{ fontSize: 10, color: '#555', lineHeight: 1.4 }}>{s.sub}</div>}
            {s.content && (
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: s.color, background: `${s.color}10`, borderRadius: 4, padding: '3px 6px', marginTop: 2, lineHeight: 1.5, maxHeight: 48, overflowY: 'auto' }}>
                {s.content}
              </div>
            )}
            {s.chips && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                {s.chips.map((c, j) => <Chip key={j} color={s.color}>{c}</Chip>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Funnel lines converging downward */}
      <div style={{ position: 'relative', width: '100%', height: 28, display: 'flex', justifyContent: 'center' }}>
        <svg width="100%" height="28" style={{ display: 'block' }}>
          {sources.map((_, i) => {
            const totalW = sources.length;
            const x = ((i + 0.5) / totalW) * 100;
            return (
              <line key={i}
                x1={`${x}%`} y1="0"
                x2="50%" y2="28"
                stroke="#2a2a4a" strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// A single tool call + result block
function ToolCallBlock({ tc, result, loopIndex }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #10b98133', borderRadius: 7, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ background: '#0a1a12', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 12 }}>⚙️</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>{tc.name}()</span>
        <span style={{ fontSize: 10, color: '#555', marginLeft: 'auto' }}>{open ? '▲' : '▼ expand'}</span>
      </div>
      {open && (
        <div style={{ background: '#060e08', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <div style={{ fontSize: 9, color: '#4a6a5a', marginBottom: 3, textTransform: 'uppercase' }}>Arguments sent to executor</div>
            <pre style={{ margin: 0, fontSize: 10, color: '#6ee7b7', fontFamily: 'monospace', background: '#0a1a0e', borderRadius: 4, padding: '5px 8px', overflowX: 'auto', maxHeight: 80, overflowY: 'auto', lineHeight: 1.5 }}>
              {JSON.stringify(tc.input, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div style={{ fontSize: 9, color: '#4a6a5a', marginBottom: 3, textTransform: 'uppercase' }}>Result returned to LLM</div>
              <pre style={{ margin: 0, fontSize: 10, color: '#a7f3d0', fontFamily: 'monospace', background: '#0a1a0e', borderRadius: 4, padding: '5px 8px', overflowX: 'auto', maxHeight: 80, overflowY: 'auto', lineHeight: 1.5 }}>
                {JSON.stringify(result?.output ?? result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TurnFlow({ turn, index, prevTurn }) {
  const [expanded, setExpanded] = useState(index === 0);

  const hasReasoning = (turn.usage?.reasoning_tokens ?? 0) > 0;
  const hasTools = (turn.toolCallCount ?? 0) > 0;
  const hasSystemPrompt = !!turn.systemPromptPreview;
  const inputTok = turn.usage?.input_tokens ?? 0;
  const outputTok = turn.usage?.output_tokens ?? 0;
  const reasonTok = turn.usage?.reasoning_tokens ?? 0;
  const responseMs = turn.responseMs ?? 0;
  const cost = turn.cost?.total ?? 0;
  const agentLoops = turn.agentLoops ?? 1;
  const toolCalls = turn.toolCalls ?? [];
  const toolResults = turn.toolResults ?? [];
  const iterationStats = turn.iterationStats ?? [];

  // Estimate history token portion (input includes history + system + user)
  const historyNote = index > 0 ? `prev ${index} turn${index !== 1 ? 's' : ''} in context` : null;

  return (
    <div style={{ background: '#0e0e20', border: '1px solid #1e1e3e', borderRadius: 10, overflow: 'hidden' }}>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0', textAlign: 'left' }}
      >
        <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 13, minWidth: 50 }}>Turn {turn.turnIndex}</span>
        <span style={{ fontSize: 12, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          "{turn.userMessage}"
        </span>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, flexShrink: 0, flexWrap: 'wrap' }}>
          <Chip color="#6366f1">{inputTok.toLocaleString()} in</Chip>
          {hasReasoning && <Chip color="#f59e0b">{reasonTok.toLocaleString()} think</Chip>}
          <Chip color="#22d3ee">{outputTok.toLocaleString()} out</Chip>
          {hasTools && <Chip color="#10b981">{turn.toolCallCount} tool{turn.toolCallCount !== 1 ? 's' : ''}</Chip>}
          <Chip color="#34d399">${cost.toFixed(5)}</Chip>
          {responseMs > 0 && <Chip color="#fb923c">{(responseMs / 1000).toFixed(1)}s</Chip>}
        </div>
        <span style={{ color: '#333', fontSize: 12, marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 18px', borderTop: '1px solid #1a1a30', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* ── STAGE 1: INPUT ASSEMBLY ───────────────────────── */}
          <div style={{ width: '100%', marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>①</span> Input Assembly
              <span style={{ color: '#2a2a4a', fontWeight: 400 }}>— merged before sending to LLM</span>
            </div>

            <MergeFunnel sources={[
              {
                icon: '📋',
                label: 'System Prompt',
                color: '#a78bfa',
                sub: 'Agent instructions & persona',
                content: turn.systemPromptPreview
                  ? turn.systemPromptPreview.slice(0, 80) + (turn.systemPromptPreview.length > 80 ? '…' : '')
                  : 'None (use 🤖 Agent to add one)',
                wide: false,
              },
              {
                icon: '💬',
                label: 'Conv. History',
                color: '#818cf8',
                sub: historyNote ?? 'First turn — no prior history',
                chips: historyNote ? [`${index} prior msg${index !== 1 ? 's' : ''}`, 'accumulated context'] : ['fresh context'],
                wide: false,
              },
              {
                icon: '👤',
                label: 'User Message',
                color: '#a5b4fc',
                sub: 'This turn\'s input',
                content: turn.userMessage.slice(0, 100) + (turn.userMessage.length > 100 ? '…' : ''),
                wide: true,
              },
            ]} />
          </div>

          {/* Merge label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 2, height: 8, background: '#6366f1' }} />
            <div style={{ background: '#6366f122', border: '1px solid #6366f144', borderRadius: 5, padding: '3px 12px', fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>
              {inputTok.toLocaleString()} input tokens assembled
            </div>
            <div style={{ width: 2, height: 8, background: '#6366f1' }} />
            <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #6366f1' }} />
          </div>

          {/* ── STAGE 2: LLM CALL ──────────────────────────────── */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              <span>②</span> Claude API — LLM Call {agentLoops > 1 ? `(${agentLoops} iterations total)` : ''}
            </div>
            <StageBox color="#a78bfa" glow style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🟣</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>Claude API · api.anthropic.com</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Processes assembled prompt — generates tokens autoregressively</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Chip color="#6366f1">{inputTok.toLocaleString()} input tok</Chip>
                {agentLoops > 1 && <Chip color="#10b981">{agentLoops} LLM calls</Chip>}
              </div>
            </StageBox>
          </div>

          {/* ── STAGE 3: THINKING (conditional) ─────────────────── */}
          {hasReasoning ? (
            <>
              <VArrow color="#f59e0b" label="extended thinking enabled" labelColor="#92400e" />
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>③ Extended Thinking (internal reasoning)</div>
                <StageBox color="#f59e0b" glow style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>💭</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fcd34d' }}>Claude reasons internally</div>
                      <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>Hidden scratchpad — not shown to user, improves answer quality</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Chip color="#f59e0b">{reasonTok.toLocaleString()} reasoning tokens</Chip>
                  </div>
                </StageBox>
                {turn.thinking && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ fontSize: 10, color: '#78350f', cursor: 'pointer', padding: '4px 8px' }}>Show thinking excerpt</summary>
                    <div style={{ fontSize: 11, color: '#92400e', fontFamily: 'monospace', background: '#78350f11', borderRadius: 5, padding: '6px 10px', marginTop: 4, maxHeight: 100, overflowY: 'auto', lineHeight: 1.5 }}>
                      {turn.thinking.slice(0, 500)}{turn.thinking.length > 500 ? '…' : ''}
                    </div>
                  </details>
                )}
              </div>
            </>
          ) : (
            <>
              <VArrow color="#2a2a4a" />
              <div style={{ fontSize: 10, color: '#2a2a4a', fontStyle: 'italic', padding: '2px 0' }}>💭 Extended thinking disabled (enable Thinking toggle)</div>
            </>
          )}

          {/* ── STAGE 4: DECISION ──────────────────────────────── */}
          <VArrow color="#2a2a4a" />
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {hasReasoning ? '④' : '③'} LLM Decision — stop_reason
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StageBox color={hasTools ? '#10b981' : '#2a2a4a'} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, opacity: hasTools ? 1 : 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: hasTools ? '#34d399' : '#444' }}>⚙️ tool_use</div>
                <div style={{ fontSize: 10, color: '#555' }}>Claude requests one or more tools before answering</div>
              </StageBox>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: '#2a2a4a', fontWeight: 700 }}>|</div>
              <StageBox color={!hasTools ? '#22d3ee' : '#2a2a4a'} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, opacity: !hasTools ? 1 : 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: !hasTools ? '#67e8f9' : '#444' }}>✅ end_turn</div>
                <div style={{ fontSize: 10, color: '#555' }}>No tools needed — Claude writes its response directly</div>
              </StageBox>
            </div>
            {/* Active path indicator */}
            <div style={{ marginTop: 5, fontSize: 10, color: hasTools ? '#34d399' : '#67e8f9', fontFamily: 'monospace', textAlign: 'center' }}>
              ↳ stop_reason = "{hasTools ? `tool_use → ${agentLoops} loop${agentLoops !== 1 ? 's' : ''}` : (turn.stopReason ?? 'end_turn')}"
            </div>
          </div>

          {/* ── STAGE 5: AGENTIC TOOL LOOP (conditional) ─────────── */}
          {hasTools && (
            <>
              <VArrow color="#10b981" label="stop_reason = tool_use" labelColor="#10b981" />
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {hasReasoning ? '⑤' : '④'} Agentic Loop — {agentLoops} LLM calls · {toolCalls.length} tool call{toolCalls.length !== 1 ? 's' : ''}
                </div>

                {/* One card per LLM iteration */}
                {iterationStats.map((iter, iterIdx) => {
                  const isLastIter = iterIdx === iterationStats.length - 1;
                  // Tool calls that happened in this iteration
                  const iterToolCalls = iter.tool_calls ?? [];
                  // Match full tc objects for this iteration (tool calls are accumulated in order)
                  const tcOffset = iterationStats.slice(0, iterIdx).reduce((s, it) => s + (it.tool_calls?.length ?? 0), 0);
                  const iterTCs = toolCalls.slice(tcOffset, tcOffset + iterToolCalls.length);
                  // Context delta from backend
                  const delta = iter.context_delta;

                  return (
                    <div key={iterIdx} style={{ marginBottom: isLastIter ? 0 : 0 }}>
                      {/* ── Context merge box (for iterations > 1) ── */}
                      {delta && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0 }}>
                          <div style={{ width: 2, height: 10, background: '#2a2a4a' }} />
                          {/* What was added to context */}
                          <div style={{ width: '100%', background: '#0a120e', border: '1px solid #10b98133', borderRadius: 7, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 9, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              ↻ Context merge before LLM call #{iter.iteration}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {/* Prior context */}
                              <div style={{ background: '#6366f110', border: '1px solid #6366f133', borderRadius: 5, padding: '4px 8px', fontSize: 10 }}>
                                <div style={{ color: '#6366f1', fontWeight: 600 }}>📦 Prior context</div>
                                <div style={{ color: '#555', marginTop: 2 }}>{iterationStats[iterIdx - 1]?.input_tokens?.toLocaleString()} tokens from call #{iter.iteration - 1}</div>
                              </div>
                              {/* Assistant tool_use blocks added */}
                              <div style={{ background: '#a78bfa10', border: '1px solid #a78bfa33', borderRadius: 5, padding: '4px 8px', fontSize: 10 }}>
                                <div style={{ color: '#a78bfa', fontWeight: 600 }}>🟣 Assistant turn added</div>
                                <div style={{ color: '#555', marginTop: 2 }}>
                                  tool_use blocks: {delta.added_tool_calls?.join(', ') || '—'}
                                </div>
                              </div>
                              {/* Tool results added */}
                              {delta.added_tool_results?.map((r, ri) => (
                                <div key={ri} style={{ background: '#10b98110', border: '1px solid #10b98133', borderRadius: 5, padding: '4px 8px', fontSize: 10, flex: 1, minWidth: 140 }}>
                                  <div style={{ color: '#34d399', fontWeight: 600 }}>⚙ tool_result added</div>
                                  <div style={{ color: '#555', marginTop: 2, fontFamily: 'monospace', fontSize: 9 }}>
                                    {r.chars} chars · {r.preview.slice(0, 60)}{r.preview.length > 60 ? '…' : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Token growth bar */}
                            <div style={{ marginTop: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#555', marginBottom: 3 }}>
                                <span>Token count growth into this call</span>
                                <span style={{ color: '#a5b4fc' }}>
                                  {iterationStats[iterIdx - 1]?.input_tokens?.toLocaleString()} → <strong style={{ color: '#6366f1' }}>{iter.input_tokens.toLocaleString()}</strong> tokens
                                  {' '}(+{(iter.input_tokens - (iterationStats[iterIdx - 1]?.input_tokens ?? 0)).toLocaleString()})
                                </span>
                              </div>
                              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#111', gap: 0 }}>
                                {/* Prior tokens */}
                                <div style={{ background: '#6366f1', flex: iterationStats[iterIdx - 1]?.input_tokens ?? 0 }} title="prior context" />
                                {/* New tokens */}
                                <div style={{ background: '#10b981', flex: iter.input_tokens - (iterationStats[iterIdx - 1]?.input_tokens ?? 0) }} title="new tokens added" />
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#555', marginTop: 3 }}>
                                <span><span style={{ color: '#6366f1' }}>■</span> prior context</span>
                                <span><span style={{ color: '#10b981' }}>■</span> newly added (tool_use + tool_result)</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ width: 2, height: 10, background: '#2a2a4a' }} />
                          <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '7px solid #2a2a4a' }} />
                        </div>
                      )}

                      {/* ── LLM call card ── */}
                      <div style={{
                        background: '#0d0d20',
                        border: isLastIter ? '1px solid #6366f155' : '1px solid #a78bfa44',
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginTop: delta ? 0 : 0,
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14 }}>🟣</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isLastIter ? '#c4b5fd' : '#a78bfa' }}>
                            LLM Call #{iter.iteration}{isLastIter ? ' (final — generates response)' : ' → tool_use'}
                          </span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <Chip color="#6366f1">{iter.input_tokens.toLocaleString()} in</Chip>
                            <Chip color="#22d3ee">{iter.output_tokens.toLocaleString()} out</Chip>
                            {iter.reasoning_tokens > 0 && <Chip color="#f59e0b">{iter.reasoning_tokens.toLocaleString()} think</Chip>}
                            <Chip color="#94a3b8">stop: {iter.stop_reason}</Chip>
                          </div>
                        </div>

                        {/* Input breakdown for this call */}
                        <div style={{ background: '#080814', borderRadius: 6, padding: '7px 10px', marginBottom: 8 }}>
                          <div style={{ fontSize: 9, color: '#444', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            What's in this LLM call's input ({iter.input_tokens.toLocaleString()} tokens)
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {iterIdx === 0 ? (
                              <>
                                <Chip color="#a78bfa">📋 system prompt</Chip>
                                <Chip color="#818cf8">💬 conv. history ({index} prior turns)</Chip>
                                <Chip color="#a5b4fc">👤 user message</Chip>
                              </>
                            ) : (
                              <>
                                <Chip color="#6366f1">📦 all above + prior tool calls</Chip>
                                {delta?.added_tool_calls?.map(n => <Chip key={n} color="#a78bfa">🟣 tool_use: {n}</Chip>)}
                                {delta?.added_tool_results?.map((r, ri) => <Chip key={ri} color="#10b981">⚙ result: {r.chars}ch</Chip>)}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Tool calls made in this iteration (not last) */}
                        {!isLastIter && iterTCs.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div style={{ fontSize: 9, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                              Tools requested in this output:
                            </div>
                            {iterTCs.map((tc, ti) => {
                              const res = toolResults?.find(r => r.id === tc.id) ?? toolResults?.[tcOffset + ti];
                              return <ToolCallBlock key={tc.id ?? ti} tc={tc} result={res} />;
                            })}
                          </div>
                        )}
                      </div>

                      {/* Arrow down between iterations */}
                      {!isLastIter && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 2, height: 6, background: '#2a2a4a' }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Fallback when iterationStats is empty (old turn data) */}
                {iterationStats.length === 0 && (
                  <div style={{ border: '1px solid #10b98133', borderRadius: 8, padding: '10px 12px', background: '#060e08' }}>
                    {toolCalls.map((tc, i) => {
                      const res = toolResults?.find(r => r.id === tc.id) ?? toolResults?.[i];
                      return (
                        <div key={tc.id ?? i} style={{ marginBottom: 6 }}>
                          <ToolCallBlock tc={tc} result={res} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── FINAL STAGE: RESPONSE ──────────────────────────── */}
          <VArrow color="#22d3ee" />
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 10, color: '#22d3ee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {hasReasoning && hasTools ? '⑥' : hasReasoning || hasTools ? '⑤' : '④'} Final Response
            </div>
            <StageBox color="#22d3ee" glow style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>💬</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#67e8f9' }}>Claude's Response → Frontend → User</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>stop_reason: {turn.stopReason ?? 'end_turn'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip color="#22d3ee">{outputTok.toLocaleString()} output tokens</Chip>
                  <Chip color="#34d399">${cost.toFixed(5)}</Chip>
                  {responseMs > 0 && <Chip color="#fb923c">⏱ {(responseMs / 1000).toFixed(2)}s</Chip>}
                  <Chip color="#94a3b8">{((inputTok + outputTok + reasonTok) / Math.max(responseMs / 1000, 0.1)).toFixed(0)} tok/s</Chip>
                </div>
              </div>
              {turn.assistantContent && (
                <div style={{ fontSize: 11, color: '#164e63', fontFamily: 'monospace', background: '#0a2535', borderRadius: 5, padding: '6px 10px', lineHeight: 1.6, maxHeight: 80, overflowY: 'auto', borderLeft: '2px solid #22d3ee44' }}>
                  {turn.assistantContent.slice(0, 400)}{turn.assistantContent.length > 400 ? '…' : ''}
                </div>
              )}
            </StageBox>
          </div>

          {/* ── CUMULATIVE TOKEN COST TABLE ──────────────────────── */}
          <div style={{ width: '100%', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'Input tokens', val: inputTok.toLocaleString(), color: '#6366f1' },
                { label: 'Reasoning tokens', val: reasonTok > 0 ? reasonTok.toLocaleString() : '—', color: '#f59e0b' },
                { label: 'Output tokens', val: outputTok.toLocaleString(), color: '#22d3ee' },
                { label: 'Total tokens', val: (inputTok + reasonTok + outputTok).toLocaleString(), color: '#a5b4fc' },
                { label: 'Cost', val: `$${cost.toFixed(5)}`, color: '#34d399' },
                { label: 'LLM iterations', val: String(agentLoops), color: '#10b981' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 6, padding: '5px 10px', fontSize: 11 }}>
                  <div style={{ color: '#444', fontSize: 9, marginBottom: 2, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Main FlowTab ──────────────────────────────────────────────────────────────
export default function FlowTab({ turns, model }) {
  const [subTab, setSubTab] = useState('journey');

  if (!turns.length) {
    return (
      <div style={{ color: '#333', fontSize: 13, textAlign: 'center', paddingTop: 60 }}>
        Send a message to see the token flow and prompt journey
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'journey', label: '🔀 Prompt Journey' },
          { id: 'tokenmap', label: '🗺 Token Map & Inspector' },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            background: subTab === t.id ? '#6366f122' : 'transparent',
            border: `1px solid ${subTab === t.id ? '#6366f1' : '#2a2a4a'}`,
            color: subTab === t.id ? '#a5b4fc' : '#555',
            borderRadius: 7, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
            fontWeight: subTab === t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {subTab === 'journey' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: '#444', paddingLeft: 2 }}>
            Each turn shows the full execution chain: input assembly → LLM → optional tool loop → response
          </div>
          {turns.map((t, i) => <TurnFlow key={t.id} turn={t} index={i} prevTurn={turns[i - 1]} />)}
        </div>
      )}

      {subTab === 'tokenmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#444', paddingLeft: 2 }}>
            Each block = {BLOCK_SIZE} tokens. Click "token inspector" on a turn to see per-token chip visualization.
          </div>
          <TokenMap turns={turns} model={model} />
        </div>
      )}
    </div>
  );
}
