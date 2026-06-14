// WMO weather code → human-readable label
function weatherCodeLabel(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 9) return 'Fog';
  if (code <= 19) return 'Drizzle';
  if (code <= 29) return 'Rain';
  if (code <= 39) return 'Snow';
  if (code <= 49) return 'Freezing rain';
  if (code <= 59) return 'Showers';
  if (code <= 69) return 'Snow showers';
  if (code <= 79) return 'Snow grains';
  if (code <= 84) return 'Rain showers';
  if (code <= 94) return 'Thunderstorm';
  return 'Thunderstorm with hail';
}

export async function executeTool(name, input) {
  // ── calculate ─────────────────────────────────────────────────────────────
  if (name === 'calculate') {
    try {
      const expr = String(input.expression ?? '').replace(/[^0-9+\-*/().%\s]/g, '');
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr + ')')();
      return { expression: input.expression, result: String(result) };
    } catch (e) {
      return { error: `Could not evaluate: ${e.message}` };
    }
  }

  // ── calculate_stats ───────────────────────────────────────────────────────
  if (name === 'calculate_stats') {
    const nums = input.numbers ?? [];
    if (nums.length === 0) return { error: 'No numbers provided' };
    const metrics = input.metrics ?? ['mean', 'min', 'max', 'std', 'median'];
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const variance = nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nums.length;
    const all = {
      mean: parseFloat(mean.toFixed(6)),
      median: parseFloat(median.toFixed(6)),
      std: parseFloat(Math.sqrt(variance).toFixed(6)),
      min: Math.min(...nums),
      max: Math.max(...nums),
      count: nums.length,
      sum: parseFloat(nums.reduce((s, n) => s + n, 0).toFixed(6)),
      range: Math.max(...nums) - Math.min(...nums),
    };
    return Object.fromEntries(metrics.map(m => [m, all[m] ?? null]));
  }

  // ── get_weather (live — Open-Meteo, no API key needed) ────────────────────
  if (name === 'get_weather') {
    const location = String(input.location ?? '').trim();
    if (!location) return { error: 'location is required' };
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      const geo = await geoRes.json();
      if (!geo.results?.length) return { error: `Location "${location}" not found` };
      const { latitude, longitude, name: placeName, country, timezone } = geo.results[0];
      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code,relative_humidity_2m,uv_index` +
        `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset` +
        `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=${encodeURIComponent(timezone ?? 'auto')}&forecast_days=1`
      );
      const wx = await wxRes.json();
      const c = wx.current;
      const d = wx.daily;
      return {
        location: `${placeName}, ${country}`,
        latitude, longitude,
        timezone,
        current: {
          temperature_c: c.temperature_2m,
          feels_like_c: c.apparent_temperature,
          humidity_pct: c.relative_humidity_2m,
          precipitation_mm: c.precipitation,
          wind_speed_kmh: c.wind_speed_10m,
          uv_index: c.uv_index,
          conditions: weatherCodeLabel(c.weather_code),
        },
        today: {
          high_c: d?.temperature_2m_max?.[0],
          low_c: d?.temperature_2m_min?.[0],
          sunrise: d?.sunrise?.[0],
          sunset: d?.sunset?.[0],
        },
      };
    } catch (e) {
      return { error: `Weather fetch failed: ${e.message}` };
    }
  }

  // ── unit_converter ────────────────────────────────────────────────────────
  if (name === 'unit_converter') {
    const { value, from_unit, to_unit } = input;
    const v = parseFloat(value);
    if (isNaN(v)) return { error: 'value must be a number' };

    const f = from_unit?.toLowerCase().replace(/[^a-z_/]/g, '');
    const t = to_unit?.toLowerCase().replace(/[^a-z_/]/g, '');

    const conversions = {
      // Length (base: meter)
      m: 1, meter: 1, meters: 1,
      km: 1000, kilometer: 1000, kilometers: 1000,
      cm: 0.01, centimeter: 0.01, centimeters: 0.01,
      mm: 0.001, millimeter: 0.001,
      mi: 1609.344, mile: 1609.344, miles: 1609.344,
      ft: 0.3048, foot: 0.3048, feet: 0.3048,
      in: 0.0254, inch: 0.0254, inches: 0.0254,
      yd: 0.9144, yard: 0.9144, yards: 0.9144,
      // Weight (base: kg)
      kg: 1, kilogram: 1, kilograms: 1,
      g: 0.001, gram: 0.001, grams: 0.001,
      lb: 0.453592, pound: 0.453592, pounds: 0.453592,
      oz: 0.0283495, ounce: 0.0283495, ounces: 0.0283495,
      t: 1000, ton: 1000, tonne: 1000,
      // Volume (base: liter)
      l: 1, liter: 1, liters: 1, litre: 1,
      ml: 0.001, milliliter: 0.001, milliliters: 0.001,
      gal: 3.78541, gallon: 3.78541, gallons: 3.78541,
      fl_oz: 0.0295735, fluid_ounce: 0.0295735,
      cup: 0.236588, cups: 0.236588,
      pt: 0.473176, pint: 0.473176, pints: 0.473176,
      qt: 0.946353, quart: 0.946353, quarts: 0.946353,
      // Speed (base: m/s)
      m_s: 1, 'km/h': 0.277778, kmh: 0.277778,
      mph: 0.44704, knot: 0.514444, knots: 0.514444,
      // Data (base: byte)
      byte: 1, bytes: 1, b: 1,
      kb: 1024, kilobyte: 1024, kilobytes: 1024,
      mb: 1048576, megabyte: 1048576, megabytes: 1048576,
      gb: 1073741824, gigabyte: 1073741824, gigabytes: 1073741824,
      tb: 1099511627776, terabyte: 1099511627776,
    };

    // Temperature special case
    const tempFrom = { c: 'celsius', celsius: 'celsius', f: 'fahrenheit', fahrenheit: 'fahrenheit', k: 'kelvin', kelvin: 'kelvin' };
    if (tempFrom[f] && tempFrom[t]) {
      let celsius;
      if (tempFrom[f] === 'celsius') celsius = v;
      else if (tempFrom[f] === 'fahrenheit') celsius = (v - 32) * 5 / 9;
      else celsius = v - 273.15;
      let result;
      if (tempFrom[t] === 'celsius') result = celsius;
      else if (tempFrom[t] === 'fahrenheit') result = celsius * 9 / 5 + 32;
      else result = celsius + 273.15;
      return { value, from_unit, to_unit, result: parseFloat(result.toFixed(6)), formula: `${v} ${from_unit} → ${result.toFixed(4)} ${to_unit}` };
    }

    if (!conversions[f]) return { error: `Unknown unit: ${from_unit}` };
    if (!conversions[t]) return { error: `Unknown unit: ${to_unit}` };
    const result = (v * conversions[f]) / conversions[t];
    return { value, from_unit, to_unit, result: parseFloat(result.toFixed(8)), formula: `${v} ${from_unit} = ${result.toFixed(6)} ${to_unit}` };
  }

  // ── text_analyzer ─────────────────────────────────────────────────────────
  if (name === 'text_analyzer') {
    const text = String(input.text ?? '');
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;

    // Word frequency top 10
    const freq = {};
    for (const w of words) {
      const key = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key.length > 2) freq[key] = (freq[key] ?? 0) + 1;
    }
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Reading time at 200 wpm
    const readingTimeSec = Math.round((words.length / 200) * 60);

    // Avg word length
    const avgWordLen = words.length > 0
      ? parseFloat((words.reduce((s, w) => s + w.replace(/[^a-z0-9]/gi, '').length, 0) / words.length).toFixed(2))
      : 0;

    return {
      characters: chars,
      characters_no_spaces: charsNoSpace,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      avg_word_length: avgWordLen,
      avg_sentence_length_words: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      estimated_reading_time: readingTimeSec < 60 ? `${readingTimeSec}s` : `${Math.round(readingTimeSec / 60)}m`,
      top_words: topWords,
      language_guess: /[^\x00-\x7F]/.test(text) ? 'non-ASCII detected' : 'Latin/ASCII',
    };
  }

  // ── format_json ───────────────────────────────────────────────────────────
  if (name === 'format_json') {
    const raw = String(input.json_string ?? input.json ?? '');
    const indent = parseInt(input.indent ?? 2);
    try {
      const parsed = JSON.parse(raw);
      const formatted = JSON.stringify(parsed, null, indent);
      const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
      return {
        formatted,
        valid: true,
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        top_level_keys: Array.isArray(parsed) ? parsed.length : keys,
      };
    } catch (e) {
      return { valid: false, error: e.message, raw };
    }
  }

  // ── generate_uuid ─────────────────────────────────────────────────────────
  if (name === 'generate_uuid') {
    const count = Math.min(parseInt(input.count ?? 1), 20);
    const { randomUUID } = await import('crypto');
    const uuids = Array.from({ length: count }, () => randomUUID());
    return count === 1 ? { uuid: uuids[0] } : { uuids, count };
  }

  // ── web_search (DuckDuckGo instant answers — no key needed) ──────────────
  if (name === 'web_search') {
    const query = String(input.query ?? '');
    try {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );
      const data = await res.json();
      const results = [];
      if (data.AbstractText) {
        results.push({ type: 'abstract', title: data.Heading, snippet: data.AbstractText, url: data.AbstractURL, source: data.AbstractSource });
      }
      for (const r of (data.RelatedTopics ?? []).slice(0, 5)) {
        if (r.Text && r.FirstURL) {
          results.push({ type: 'related', snippet: r.Text, url: r.FirstURL });
        }
      }
      if (data.Answer) {
        results.unshift({ type: 'instant_answer', answer: data.Answer, answer_type: data.AnswerType });
      }
      if (!results.length) {
        return { query, results: [], note: 'No instant answers found. For richer results connect Brave Search or Tavily API.' };
      }
      return { query, results };
    } catch (e) {
      return { query, error: `Search failed: ${e.message}` };
    }
  }

  // ── lookup_order ──────────────────────────────────────────────────────────
  if (name === 'lookup_order') {
    const id = String(input.order_id ?? 'unknown').toUpperCase();
    // Deterministic mock data based on order ID hash
    const statuses = ['processing', 'shipped', 'out_for_delivery', 'delivered'];
    const hash = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
    const status = statuses[hash % statuses.length];
    const deliveryDays = status === 'delivered' ? -1 : (hash % 5) + 1;
    const delivery = new Date(Date.now() + deliveryDays * 86400000).toISOString().slice(0, 10);
    const items = [
      ['Widget Pro x1', 'USB-C Cable x2', 'Phone Stand x1'],
      ['Laptop Bag x1', 'Mouse Pad x1'],
      ['Headphones x1', 'Charging Dock x1', 'Screen Cleaner x3'],
      ['Keyboard x1', 'HDMI Cable x2'],
    ][hash % 4];
    return {
      order_id: id,
      status,
      placed_date: new Date(Date.now() - (hash % 14) * 86400000).toISOString().slice(0, 10),
      estimated_delivery: status === 'delivered' ? 'Delivered' : delivery,
      items,
      total: `$${((hash % 200) + 9).toFixed(2)}`,
      shipping: status === 'delivered' ? 'Standard (delivered)' : 'Standard (3-5 business days)',
      tracking: `1Z${id.replace(/\D/g, '')}${hash.toString().slice(0, 8).padStart(8, '0')}`,
    };
  }

  // ── lookup_account ────────────────────────────────────────────────────────
  if (name === 'lookup_account') {
    const email = String(input.email ?? '').toLowerCase();
    if (!email.includes('@')) return { error: 'Invalid email address' };
    const hash = [...email].reduce((s, c) => s + c.charCodeAt(0), 0);
    const tiers = ['standard', 'plus', 'premium', 'enterprise'];
    const names = ['Alex Johnson', 'Morgan Lee', 'Jordan Smith', 'Casey Park', 'Taylor Brown'];
    return {
      email,
      name: names[hash % names.length],
      account_status: hash % 10 === 0 ? 'suspended' : 'active',
      member_tier: tiers[hash % tiers.length],
      member_since: new Date(Date.now() - (hash % 1000) * 86400000).toISOString().slice(0, 10),
      orders_count: (hash % 50) + 1,
      total_spent: `$${((hash % 5000) + 49).toFixed(2)}`,
      last_login: new Date(Date.now() - (hash % 30) * 86400000).toISOString().slice(0, 10),
      preferences: { newsletter: hash % 2 === 0, sms_alerts: hash % 3 === 0 },
    };
  }

  // ── generic fallback ──────────────────────────────────────────────────────
  return {
    result: `Tool "${name}" executed successfully.`,
    input_received: input,
    note: 'Custom tool — implement real logic in backend/tool-executor.js',
  };
}
