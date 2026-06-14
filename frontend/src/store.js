import { useState, useCallback } from 'react';

// Context window limits per model (tokens)
export const MODEL_CONTEXT = {
  'claude-haiku-4-5-20251001': 200_000,
  'claude-sonnet-4-6': 200_000,
  'claude-opus-4-8': 200_000,
  'claude-fable-5': 200_000,
};

export const initialSession = (model = 'claude-sonnet-4-6') => ({
  id: Date.now(),
  model,
  startedAt: Date.now(),
  turns: [],
  totals: {
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    toolCalls: 0,
    cost: 0,
    totalTokens: 0,
    totalResponseMs: 0,
  },
});

export function useSession() {
  const [session, setSession] = useState(initialSession());
  const [history, setHistory] = useState([]);

  const addTurn = useCallback((userMessage, apiResponse) => {
    const inputT = apiResponse.usage?.input_tokens ?? 0;
    const outputT = apiResponse.usage?.output_tokens ?? 0;
    const reasoningT = apiResponse.usage?.reasoning_tokens ?? 0;
    const totalT = inputT + outputT + reasoningT;

    const turn = {
      id: Date.now(),
      turnIndex: 0, // set below
      userMessage,
      assistantContent: apiResponse.content,
      thinking: apiResponse.thinking,
      toolCalls: apiResponse.toolCalls ?? [],
      toolResults: apiResponse.toolResults ?? [],
      iterationStats: apiResponse.iterationStats ?? [],
      toolCallCount: apiResponse.toolCallCount ?? 0,
      agentLoops: apiResponse.agentLoops ?? 1,
      usage: apiResponse.usage,
      cost: apiResponse.cost,
      stopReason: apiResponse.stopReason,
      responseMs: apiResponse.responseMs ?? 0,
      totalTokens: totalT,
      timestamp: new Date().toISOString(),
      systemPromptPreview: apiResponse.systemPromptPreview,
    };

    setSession(prev => {
      const newTurn = { ...turn, turnIndex: prev.turns.length + 1 };
      return {
        ...prev,
        turns: [...prev.turns, newTurn],
        totals: {
          inputTokens: prev.totals.inputTokens + inputT,
          outputTokens: prev.totals.outputTokens + outputT,
          reasoningTokens: prev.totals.reasoningTokens + reasoningT,
          toolCalls: prev.totals.toolCalls + (apiResponse.toolCallCount ?? 0),
          cost: prev.totals.cost + (apiResponse.cost?.total ?? 0),
          totalTokens: prev.totals.totalTokens + totalT,
          totalResponseMs: prev.totals.totalResponseMs + (apiResponse.responseMs ?? 0),
        },
      };
    });

    setHistory(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: apiResponse.content || '' },
    ]);
  }, []);

  const resetSession = useCallback((model) => {
    setSession(initialSession(model || 'claude-sonnet-4-6'));
    setHistory([]);
  }, []);

  const setModel = useCallback((model) => {
    setSession(prev => ({ ...prev, model }));
  }, []);

  return { session, history, addTurn, resetSession, setModel };
}
