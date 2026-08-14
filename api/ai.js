// Vercel serverless function: POST /api/ai
// Uses Google's Gemini API, which has a genuinely free, ongoing tier (no
// credit card, no expiration — see DEPLOY.md). Keeps the API key on the
// server; the React app in src/App.jsx calls this instead of any AI
// provider directly.
//
// Set the key in Vercel: Project Settings -> Environment Variables ->
// GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey
// Never commit it to the repo.

const MODEL = 'gemini-2.5-flash-lite'; // gemini-2.5-flash was deprecated for new
// accounts (Aug 2026) — flash-lite is Google's current recommended free-tier
// model for the generateContent endpoint. If this ever 404s again too, check
// https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY for
// the current list of model names your key can access.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
    return;
  }

  const { prompt, maxTokens } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  // Basic abuse guard: cap prompt size and token budget regardless of what
  // the client sends, since this endpoint is public and the free tier has
  // a daily request cap shared across everyone using this deployment.
  const safePrompt = prompt.slice(0, 4000);
  const safeMaxTokens = Math.min(Number(maxTokens) || 800, 1200);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: safePrompt }] }],
        generationConfig: { maxOutputTokens: safeMaxTokens },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error', response.status, errText); // now visible in Vercel Logs
      // 429 here means the free tier's daily/per-minute quota was hit —
      // shared across every visitor to this deployment.
      res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429 ? 'AI request limit reached, try again in a bit' : 'Upstream AI error',
        detail: errText.slice(0, 300),
      });
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim() || '';

    res.status(200).json({ text });
  } catch (err) {
    console.error('api/ai handler crashed', err); // now visible in Vercel Logs
    res.status(500).json({ error: 'Request failed', detail: String(err) });
  }
}
