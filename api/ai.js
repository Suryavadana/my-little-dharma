// Vercel serverless function: POST /api/ai
// Uses Google's Gemini API (Interactions endpoint), which has a genuinely
// free, ongoing tier (no credit card, no expiration — see DEPLOY.md).
// Keeps the API key on the server; the React app in src/App.jsx calls this
// instead of any AI provider directly.
//
// Set the key in Vercel: Project Settings -> Environment Variables ->
// GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey
// Never commit it to the repo.
//
// NOTE: Google retired the older generateContent endpoint for new API keys
// (Aug 2026) in favor of the Interactions API — this file was updated to
// match. If you see 404s again in the future, check
// https://ai.google.dev/gemini-api/docs/interactions for the current
// endpoint shape, since Google's APIs move fast.

const MODEL = 'gemini-3.5-flash';

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

  // Basic abuse guard: cap prompt size regardless of what the client sends,
  // since this endpoint is public and the free tier has a daily request cap
  // shared across everyone using this deployment.
  const safePrompt = prompt.slice(0, 4000);

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify({
        model: MODEL,
        input: safePrompt,
        store: false, // stateless — we don't need multi-turn history here
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error', response.status, errText); // visible in Vercel Logs
      res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429 ? 'AI request limit reached, try again in a bit' : 'Upstream AI error',
        detail: errText.slice(0, 300),
      });
      return;
    }

    const data = await response.json();
    const text = (data.steps || [])
      .filter((s) => s.type === 'model_output')
      .flatMap((s) => s.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();

    res.status(200).json({ text });
  } catch (err) {
    console.error('api/ai handler crashed', err); // visible in Vercel Logs
    res.status(500).json({ error: 'Request failed', detail: String(err) });
  }
}
