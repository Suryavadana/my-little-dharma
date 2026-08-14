# My Little Dharma — Web App (deployable)

This is a standalone version of the preview that works for anyone who opens
the link — no Claude account needed. The AI features (Ask Why, Ask Anything,
My Own Story, the mood check-in) run through your own small backend function
that calls **Google Gemini's free API tier** — genuinely free, ongoing, no
credit card, no expiration — so nobody pays anything to use this.

## What you need first
- A free Google account and a free [Gemini API key](https://aistudio.google.com/apikey)
  from Google AI Studio. Click "Create API key," no credit card required.
  The free tier gives ~1,500 requests/day shared across everyone who uses
  your deployed link — plenty for friends trying it out, but see the note
  below on what happens if that's ever exceeded.
- A free [GitHub](https://github.com) account
- A free [Vercel](https://vercel.com) account (sign up with GitHub — one click)

## Deploy steps (about 15–20 minutes the first time)

1. **Put this folder in a GitHub repo.**
   - Easiest: go to github.com → New repository → drag-and-drop upload all
     the files in this folder (or use `git init`, `git add .`,
     `git commit -m "init"`, `git remote add origin <your-repo-url>`,
     `git push` if you're comfortable with git).

2. **Import it into Vercel.**
   - Go to vercel.com → Add New → Project → pick the GitHub repo you just made.
   - Vercel auto-detects Vite; leave the default build settings.

3. **Add your API key before deploying.**
   - In the import screen (or later under Project → Settings → Environment
     Variables), add:
     - Name: `GEMINI_API_KEY`
     - Value: the key from Google AI Studio
   - Apply it to Production (and Preview if you want branch deploys to work too).

4. **Deploy.**
   - Click Deploy. Vercel builds the site and gives you a URL like
     `my-little-dharma-web.vercel.app`.

5. **Share the link.**
   - That URL works on any phone, tablet, or computer — nothing to install,
     nothing to pay. Send it straight to your friends over WhatsApp, text,
     whatever's easiest.

## Updating it later
Any time you want to change something, edit the files, push to GitHub, and
Vercel redeploys automatically — the same link stays live and just updates.

## About the free tier limit
Gemini's free tier is generous (~1,500 requests/day, shared across every
visitor to your link) but it is a real limit. If a lot of people use the app
at once, or a curious kid mashes buttons all day, the daily quota could be
hit — visitors would just see "AI request limit reached, try again in a bit"
until it resets, nothing breaks or costs money. For casual friend-and-family
sharing this is very unlikely to matter.

## Before you'd want real families using this long-term
This is set up for quick friend-and-family testing, not production:
- No content moderation pass beyond the safety instructions baked into each
  prompt (see PRD.md in the Flutter project for the same caveat).
- No login/accounts — everyone who has the link sees the same app with no
  personalization or saved progress across visits (progress resets on
  refresh, same as the in-chat preview).
- No parent gate — every screen, including AI chat, is open to anyone who
  opens the link, including kids.
- Google's free tier may use prompts/responses to improve their products
  (this is disclosed in their free-tier terms) — worth knowing since this
  app is used by children, even if no personal data beyond what's typed
  into a prompt is involved.

None of these need to block a casual "hey try this out" share with friends —
just worth knowing before treating this as more than that.
