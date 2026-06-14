# LLM Cost Meter

A real-time web app for measuring Anthropic Claude API costs by input tokens, output tokens, reasoning/thinking tokens, turns, and tool calls.

## Setup

### 1. Add your API key
Edit `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Start the backend
```bash
cd backend
npm run dev
```

### 3. Start the frontend
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Features
- Live conversation with cost tracking per turn
- Metrics: input tokens, output tokens, reasoning tokens, tool calls, total cost
- Bar chart: tokens per turn
- Line chart: cost over time (per-turn + cumulative)
- Tool call bar chart
- Per-turn breakdown table
- Extended thinking toggle (Sonnet, Opus, Fable)
- Model switcher (Haiku 4.5, Sonnet 4.6, Opus 4.8, Fable 5)
