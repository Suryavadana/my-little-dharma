# My Little Dharma 🪷

A values-based storytelling web app for kids, inspired by Hindu epics and folklore. Built as a full-stack solo project — React frontend, serverless AI backend, deployed and live.

**[🔗 Live demo](https://my-little-dharma.vercel.app)** — try it yourself, no signup required.

---

## What it does

Kids ask a question like *"why should I tell the truth?"* and get back a short, original story — pulled from Hindu mythology and the Panchatantra — that answers it, plus a simple real-life challenge tied to the lesson. Everything else in the app (a chatbot, a real pre-written bedtime story library, a growing Sanskrit shloka library, six mythology-themed games, a mood check-in, a gratitude journal) is built around the same idea: turning a values-education product brief into something a kid would actually enjoy tapping through — and something a pre-reader can use too, since every story can be read aloud.

| Feature | What it does |
|---|---|
| **Ask Why** | Generates a mythology-based story answering any "why should I...?" question |
| **Ask Anything** | A kid-safe chatbot for questions about gods, festivals, and stories |
| **My Own Story** | Personalized adventure starring the child's name, favorite animal, and hobby |
| **Bedtime Stories** | 8 full pre-written stories (Hanuman, Ganesha, Krishna, Panchatantra, and more) — real content, not generated on demand |
| **Shlokas** | 21 full Sanskrit verses (including 8 from the Bhagavad Gita) with meaning and word-by-word breakdown, a rotating "Shloka of the Day," and natural-language search to find one by topic |
| **Read to Me** | Every story (Ask Why, My Own Story, Bedtime Stories) can be read aloud — built for ages 3–5 who can't read fluently yet |
| **Games** | Memory Match, a 3-category mythology quiz, Word Search, Spot the Difference, Temple Builder (learn temple architecture piece by piece), and Hanuman's Leap (a real-time jump-the-obstacles action game) |
| **How Are You Feeling?** | Daily mood check-in with an AI-generated affirmation and a breathing exercise |
| **Gratitude Journal** | Three-good-things journaling with streak tracking |
| **Parent Dashboard** | Live stats (stories read, shlokas learned, kindness score, streaks) as a bar chart, with a one-tap progress reset |

Progress persists on-device (stories completed, shlokas learned, gratitude streaks) so it survives closing the tab — with no accounts and nothing sent to a server, which also means no child's data ever leaves their own device.

## Why this is more than a UI demo

The interesting engineering problem here wasn't the React — it's what happens the moment an app calls an LLM from a public, unauthenticated page, and the judgment calls that come with building something children actually use:

- **The API key can never reach the browser.** All AI calls route through a serverless function (`api/ai.js`) that holds the key server-side; the client only ever talks to my own backend.
- **Every prompt is constrained, not just the UI.** Content-safety rules (age-appropriate tone, no graphic content, no religious-instruction framing) are baked directly into the system prompt sent with every request — not just enforced by what buttons exist on screen.
- **The AI is never allowed to invent scripture.** The Shloka search feature matches a child's request against a curated, verified library first, and only asks the AI to *pick* from that known list as a fallback — it's never asked to generate new Sanskrit text. Getting a sacred verse wrong is a different, worse kind of mistake than a normal hallucination, so that path is closed off entirely.
- **Public endpoints need abuse limits even on a hobby project.** The backend caps prompt length and output size server-side regardless of what the client sends, since anyone with the link can hit the API.
- **Chasing a moving target.** Midway through building this, Google deprecated the Gemini model I'd originally wired up (`generateContent` was retired for new API keys in favor of a new Interactions API) — the backend was rewritten mid-project to match, which is a pretty normal day in real API-integration work.

## Tech stack

- **Frontend:** React 18 + Vite, Tailwind CSS
- **Backend:** Vercel serverless functions (Node)
- **AI:** Google Gemini API (free tier) via a custom backend proxy
- **Hosting:** Vercel (Hobby/free tier)
- **In-browser APIs:** Web Speech Synthesis for shloka audio and full story read-aloud; localStorage for on-device progress persistence

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

- Multiple child profiles on one device, so siblings can keep separate progress without needing accounts
- Move the shloka and story audio from browser TTS to licensed native-speaker recordings — a genuine accuracy ceiling I hit and documented rather than papered over
- Add automated content moderation as a second pass behind the prompt-level safety rules
- The remaining games from the original scope (crossword, jigsaw puzzle, coloring/creativity tools) — these need either real illustration work or more complex interaction design than the code-only style used so far
- Downloadable, printable milestone certificates and shareable story cards
