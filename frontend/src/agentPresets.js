export const PRESETS = {
  blank: {
    label: 'Blank',
    icon: '⬜',
    description: 'No system prompt, no tools',
    systemPrompt: '',
    tools: [],
  },

  assistant: {
    label: 'General Assistant',
    icon: '🤖',
    description: 'Helpful, concise assistant',
    systemPrompt: `You are a helpful, harmless, and honest assistant. Be concise and clear. When you're unsure about something, say so rather than guessing.`,
    tools: [],
  },

  codeHelper: {
    label: 'Code Helper',
    icon: '👨‍💻',
    description: 'Code review, debugging, writing',
    systemPrompt: `You are an expert software engineer with deep knowledge across languages and frameworks. Help with:
- Code review and best practices
- Debugging and root cause analysis
- Writing clean, maintainable code
- Explaining complex concepts clearly

Always show code in properly formatted blocks. Explain your reasoning briefly.`,
    tools: [],
  },

  calculator: {
    label: 'Calculator Agent',
    icon: '🧮',
    description: 'Math agent with real calculator + unit converter',
    systemPrompt: `You are a precise math and measurement assistant. For any numerical computation — no matter how simple — always use the calculate tool. For unit conversions use the unit_converter tool. Show your work by explaining what you're computing before calling the tool.`,
    tools: [
      {
        name: 'calculate',
        description: 'Evaluate a mathematical expression. Supports +, -, *, /, %, (), and standard JS Math operations like Math.sqrt(), Math.pow(), Math.PI.',
        input_schema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'A valid JavaScript math expression, e.g. "(12.5 * 8) / 3.14" or "Math.sqrt(144)"',
            },
          },
          required: ['expression'],
        },
      },
      {
        name: 'unit_converter',
        description: 'Convert between units of measurement. Supports length, weight, volume, temperature, speed, and data sizes.',
        input_schema: {
          type: 'object',
          properties: {
            value: { type: 'number', description: 'The numeric value to convert' },
            from_unit: { type: 'string', description: 'Source unit (e.g. "km", "celsius", "lb", "gallon", "mph")' },
            to_unit: { type: 'string', description: 'Target unit (e.g. "miles", "fahrenheit", "kg", "liter", "kmh")' },
          },
          required: ['value', 'from_unit', 'to_unit'],
        },
      },
    ],
  },

  weatherBot: {
    label: 'Weather Bot',
    icon: '🌤',
    description: 'Live weather via Open-Meteo (no API key needed)',
    systemPrompt: `You are a helpful weather assistant. Use the get_weather tool to fetch current conditions for any location. Always report both Celsius and Fahrenheit (use unit_converter). Mention sunrise/sunset times if relevant. If the user asks about multiple locations compare them.`,
    tools: [
      {
        name: 'get_weather',
        description: 'Get live current weather and today\'s forecast for any city or location worldwide. Uses Open-Meteo API — no API key needed.',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City or place name, e.g. "London", "Tokyo", "New York"' },
          },
          required: ['location'],
        },
      },
      {
        name: 'unit_converter',
        description: 'Convert between units, e.g. Celsius to Fahrenheit, km/h to mph.',
        input_schema: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            from_unit: { type: 'string' },
            to_unit: { type: 'string' },
          },
          required: ['value', 'from_unit', 'to_unit'],
        },
      },
    ],
  },

  dataAnalyst: {
    label: 'Data Analyst',
    icon: '📊',
    description: 'Statistical analysis + text analysis tools',
    systemPrompt: `You are a data analysis expert. Help users understand their data by:
- Computing descriptive statistics with calculate_stats
- Analyzing text with text_analyzer
- Interpreting results in plain language
- Suggesting further analyses

Always use tools for computation rather than estimating.`,
    tools: [
      {
        name: 'calculate_stats',
        description: 'Compute descriptive statistics for a list of numbers. Returns mean, median, std deviation, min, max, sum, range, and count.',
        input_schema: {
          type: 'object',
          properties: {
            numbers: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of numbers to analyze',
            },
            metrics: {
              type: 'array',
              items: { type: 'string', enum: ['mean', 'median', 'std', 'min', 'max', 'count', 'sum', 'range'] },
              description: 'Which statistics to compute',
            },
          },
          required: ['numbers', 'metrics'],
        },
      },
      {
        name: 'text_analyzer',
        description: 'Analyze a block of text: word count, character count, sentence count, reading time estimate, top frequent words, avg sentence length.',
        input_schema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'The text to analyze' },
          },
          required: ['text'],
        },
      },
      {
        name: 'calculate',
        description: 'Evaluate a math expression.',
        input_schema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'JS math expression' },
          },
          required: ['expression'],
        },
      },
    ],
  },

  webSearch: {
    label: 'Web Search',
    icon: '🔍',
    description: 'Research with DuckDuckGo instant answers',
    systemPrompt: `You are a research assistant. When you need factual or current information, use the web_search tool first. Summarize and cite sources clearly. If instant answers are limited, let the user know you're working from DuckDuckGo's public API.`,
    tools: [
      {
        name: 'web_search',
        description: 'Search the web using DuckDuckGo Instant Answers. Returns abstract summaries, instant answers, and related topics. No API key needed.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query — be specific for best results' },
          },
          required: ['query'],
        },
      },
    ],
  },

  customerSupport: {
    label: 'Customer Support',
    icon: '🎧',
    description: 'Support agent with order & account lookup',
    systemPrompt: `You are a friendly and professional customer support agent. Guidelines:
- Always greet the customer and acknowledge their concern
- Be empathetic and solution-focused
- Use the lookup tools to retrieve real order and account information
- Escalate to a human agent if the issue is complex or the customer is frustrated
- Never invent order details — always use the lookup tools

Tone: warm, professional, helpful.`,
    tools: [
      {
        name: 'lookup_order',
        description: 'Look up order status, items, and delivery estimate by order ID (e.g. "ORD-12345").',
        input_schema: {
          type: 'object',
          properties: {
            order_id: { type: 'string', description: 'Order ID string' },
          },
          required: ['order_id'],
        },
      },
      {
        name: 'lookup_account',
        description: 'Look up customer account, tier, order history, and preferences by email address.',
        input_schema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Customer email address' },
          },
          required: ['email'],
        },
      },
    ],
  },

  // ── Reasoning-heavy presets (enable Thinking toggle for best results) ──────

  logicPuzzles: {
    label: 'Logic Puzzles',
    icon: '🧩',
    description: 'Tricky reasoning puzzles — enable Thinking for deep solutions',
    thinkingHint: true,
    systemPrompt: `You are a logic and puzzle expert. Approach each problem methodically:
1. Restate what's given and what's asked
2. Identify constraints and eliminations
3. Work through possibilities systematically
4. Verify your answer satisfies all conditions
5. Explain your reasoning step by step

Take your time — correctness matters more than speed. Try these classic types:
- Zebra/Einstein puzzles (who owns the fish?)
- River crossing problems
- Knights and Knaves (truth-tellers vs liars)
- Grid-based logic deductions
- Lateral thinking problems`,
    tools: [],
  },

  mathProofs: {
    label: 'Math Proofs',
    icon: '📐',
    description: 'Step-by-step proofs and hard problems — enable Thinking',
    thinkingHint: true,
    systemPrompt: `You are a rigorous mathematics tutor. For every problem:
1. Identify what type of problem it is (algebra, calculus, combinatorics, etc.)
2. State your proof strategy before beginning
3. Write each step explicitly with justification
4. Verify the result by checking edge cases or working backwards
5. Note any assumptions or constraints

Be precise with notation. Show all intermediate steps — do not skip. If a problem has multiple solution methods, show the most elegant one and mention alternatives.`,
    tools: [
      {
        name: 'calculate',
        description: 'Verify numerical results of expressions during proof steps.',
        input_schema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'JS math expression to verify' },
          },
          required: ['expression'],
        },
      },
    ],
  },

  decisionAdvisor: {
    label: 'Decision Advisor',
    icon: '⚖️',
    description: 'Structured decision analysis — enable Thinking for deep reasoning',
    thinkingHint: true,
    systemPrompt: `You are a strategic decision analysis expert trained in structured reasoning frameworks. When given a decision to analyze:

1. **Clarify** the core decision and constraints
2. **Enumerate** all realistic options (don't anchor too early)
3. **Identify** the key criteria that matter (short vs long-term, risk tolerance, values)
4. **Analyze** each option against each criterion with pros/cons
5. **Stress-test** your recommendation — what would change your mind?
6. **Recommend** a course of action with confidence level and key assumptions

Frameworks to draw from: decision trees, expected value, second-order effects, regret minimization, inversion. Be direct — give a recommendation, not just a menu of options.`,
    tools: [],
  },

  codeDebugger: {
    label: 'Code Debugger',
    icon: '🐛',
    description: 'Deep code debugging with reasoning — enable Thinking',
    thinkingHint: true,
    systemPrompt: `You are an expert debugger and software detective. When given a bug or unexpected behavior:

1. **Reproduce** — describe what exact input causes the issue
2. **Hypothesize** — list 3-5 possible root causes, ordered by likelihood
3. **Eliminate** — reason through each hypothesis with evidence from the code
4. **Diagnose** — identify the root cause with confidence
5. **Fix** — provide the minimal correct fix with explanation
6. **Prevent** — suggest a test or guard to prevent regression

Look for: off-by-one errors, race conditions, null/undefined, type coercion, async issues, scope bugs, wrong assumptions about library APIs. Trace data flow carefully.`,
    tools: [
      {
        name: 'calculate',
        description: 'Verify numeric values or expressions during debugging.',
        input_schema: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
          },
          required: ['expression'],
        },
      },
      {
        name: 'format_json',
        description: 'Parse and format a JSON string to inspect its structure.',
        input_schema: {
          type: 'object',
          properties: {
            json_string: { type: 'string', description: 'JSON string to validate and pretty-print' },
            indent: { type: 'number', description: 'Indentation spaces (default 2)' },
          },
          required: ['json_string'],
        },
      },
    ],
  },

  devUtilities: {
    label: 'Dev Utilities',
    icon: '🛠',
    description: 'UUID generation, JSON formatting, text analysis',
    systemPrompt: `You are a developer utilities assistant. Help with common dev tasks using your tools:
- Generate UUIDs with generate_uuid
- Validate and format JSON with format_json
- Analyze text content with text_analyzer
- Evaluate expressions with calculate

Always use tools for operations rather than approximating.`,
    tools: [
      {
        name: 'generate_uuid',
        description: 'Generate one or more random UUIDs (v4).',
        input_schema: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of UUIDs to generate (1-20, default 1)' },
          },
        },
      },
      {
        name: 'format_json',
        description: 'Validate and pretty-print a JSON string.',
        input_schema: {
          type: 'object',
          properties: {
            json_string: { type: 'string', description: 'JSON string to validate and format' },
            indent: { type: 'number', description: 'Indentation (default 2)' },
          },
          required: ['json_string'],
        },
      },
      {
        name: 'text_analyzer',
        description: 'Analyze text: word count, reading time, top words, sentence stats.',
        input_schema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      },
      {
        name: 'calculate',
        description: 'Evaluate a math expression.',
        input_schema: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
          },
          required: ['expression'],
        },
      },
    ],
  },
};

export const PRESET_LIST = Object.entries(PRESETS).map(([id, p]) => ({ id, ...p }));
