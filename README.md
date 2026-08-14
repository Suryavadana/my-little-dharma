# My Little Dharma 🪷

A values-based storytelling web app for kids, inspired by Hindu epics and folklore. Built as a full-stack solo project — React frontend, serverless AI backend, deployed and live.

**[🔗 Live demo](https://my-little-dharma.vercel.app)** — try it yourself, no signup required.

---

## What it does

Kids ask a question like *"why should I tell the truth?"* and get back a short, original story — pulled from Hindu mythology and the Panchatantra — that answers it, plus a simple real-life challenge tied to the lesson. Everything else in the app (a chatbot, a shloka-learning tool, games, a mood check-in, a gratitude journal) is built around the same idea: turning a values-education product brief into something a kid would actually enjoy tapping through.

| Feature | What it does |
|---|---|
| **Ask Why** | Generates a mythology-based story answering any "why should I...?" question |
| **Ask Anything** | A kid-safe chatbot for questions about gods, festivals, and stories |
| **My Own Story** | Personalized adventure starring the child's name, favorite animal, and hobby |
| **Shlokas** | 8 full Sanskrit verses with meaning, word-by-word breakdown, and phrase-by-phrase audio |
| **Games** | A memory-match game and a 3-category mythology quiz |
| **How Are You Feeling?** | Daily mood check-in with an AI-generated affirmation and a breathing exercise |
| **Gratitude Journal** | Three-good-things journaling with streak tracking |
| **Parent Dashboard** | Live stats (stories read, shlokas learned, kindness score, streaks) as a bar chart |

## Why this is more than a UI demo

The interesting engineering problem here wasn't the React — it's what happens the moment an app calls an LLM from a public, unauthenticated page:

- **The API key can never reach the browser.** All AI calls route through a serverless function (`api/ai.js`) that holds the key server-side; the client only ever talks to my own backend.
- **Every prompt is constrained, not just the UI.** Content-safety rules (age-appropriate tone, no graphic content, no religious-instruction framing) are baked directly into the system prompt sent with every request — not just enforced by what buttons exist on screen.
- **Public endpoints need abuse limits even on a hobby project.** The backend caps prompt length and output size server-side regardless of what the client sends, since anyone with the link can hit the API.
- **Chasing a moving target.** Midway through building this, Google deprecated the Gemini model I'd originally wired up (`generateContent` was retired for new API keys in favor of a new Interactions API) — the backend was rewritten mid-project to match, which is a pretty normal day in real API-integration work.

## Tech stack

- **Frontend:** React 18 + Vite, Tailwind CSS
- **Backend:** Vercel serverless functions (Node)
- **AI:** Google Gemini API (free tier) via a custom backend proxy
- **Hosting:** Vercel (Hobby/free tier)
- **In-browser APIs:** Web Speech Synthesis for shloka audio playback

No component libraries — the design system (colors, type pairing, the "unfurling manuscript" story-reveal treatment) is custom.

## Architecture

```
Browser (React)
      │
      │  POST /api/ai  { prompt, maxTokens }
      ▼
Vercel serverless function (api/ai.js)
      │
      │  holds GEMINI_API_KEY server-side only
      ▼
Google Gemini API (Interactions endpoint)
```

The frontend never sees an API key, never talks to Google directly, and has no
knowledge of which AI provider is behind `/api/ai` — swapping providers later
is a one-file change.

## Running it locally

```bash
git clone https://github.com/<your-username>/my-little-dharma.git
cd my-little-dharma
npm install
cp .env.example .env.local   # add your own GEMINI_API_KEY
npm run dev
```

Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required.

## Deploying your own copy

Full step-by-step in [`DEPLOY.md`](./DEPLOY.md) — GitHub → Vercel, entirely free, no server to manage.

## What I'd build next

- Persist progress with a real database instead of in-memory session state
- Move the shloka audio from browser TTS to licensed native-speaker recordings — a genuine accuracy ceiling I hit and documented rather than papered over
- Add automated content moderation as a second pass behind the prompt-level safety rules
- Expand from 2 games to the full set originally scoped, with real illustration work

## License

MIT — feel free to fork and build on this.
