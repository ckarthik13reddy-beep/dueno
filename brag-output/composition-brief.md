# Hyperframes Composition Brief: Dueno

## Objective
Narrated launch film for Dueno: the AI accounts-receivable coworker. It covers the pain, the reveal, the six channels, the inbox thread in action, guardrails, proof, the 2027 roadmap and the wordmark.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape, 1920x1080, 30fps
- Duration: 59.6s (scenes flex to the 8 generated VO clips; total VO is 49.75s). This is longer than brag's 15–25s default because the user asked for a feature-explaining launch video with the roadmap.

## Source Material
- Project root: `MOCK DUENO (for presentation)/`
- Files read: `src/routes/index.tsx` (landing), `dashboard.tsx`, `inbox.tsx`, `channels.tsx`, `agent.tsx`, `automations.tsx`, `forecast.tsx`, `portal.tsx`, `invoices.tsx`, `src/lib/mock.ts`, `src/components/dueno/AppShell.tsx`, `Future.tsx`, `src/styles.css`, `roadmap.md`
- Product name: Dueno (wordmark "dueno." with the dot in the accent colour)
- Tagline: "The AI coworker that gets your invoices paid"
- Key UI to recreate: the Inbox thread for Priya Raman (INV-2041), with sidebar nav and context panel
- Copy that must appear verbatim (re-cased or trimmed is fine):
  - "Get paid on every channel your clients actually read."
  - "Your AI accounts-receivable coworker"
  - "Switched to WhatsApp — Priya replies 4× faster here"
  - "$2,400 received via Stripe · verified"
  - "Dispute detected · escalated to you · reminders paused"
  - "3.2× faster payment vs. manual chasing" / "94% of payer replies handled by AI" / "41h saved per month, per business"
  - "Coming 2027", "Agent Studio", "Cash forecast", "Payer portal"

## Creative Direction
- Tone preset: app-store with cinematic moments
- Creative direction: premium product keynote film; warm, confident, unhurried
- Hook: real overdue invoice rows stack up while the narrator says "You did the work… now you're chasing it."
- Outro: "dueno." with an amber glow that responds to the music, plus "Stop chasing. Start getting paid."
- Avoid: generic SaaS language, abstract filler, invented numbers, the owner's personal data (name, email, phone)

## Visual Identity (hex converted from the app's oklch tokens)
- Ground #FCFAF4 · ink #12241C · primary #154132 · dark panel #112C23 / #1E3C31 · panel text #EAE8DF
- Accent amber #F3AA40 (only as text on dark grounds; on cream it is used as a fill with #321F0F text)
- Muted text #5E6D66 · border #E0DED5 · success #2A8F62 · destructive #CC272E · warning #E68C2C / #301D0D
- Channels: WhatsApp #3BB360, Email #2784D5, SMS #A17ADF, Telegram #0AA0D2, Instagram #E63E84, Voice #E68C2C
- Display: Space Grotesk (variable woff2 in assets/fonts) · Body: DM Sans (variable woff2)

## Storyboard (absolute times)
1. s1-chase — 0.0–5.0 — invoice rows land, three headline lines, then a dark circle iris opens into s2
2. s2-reveal — 5.0–9.6 — pill, wordmark, amber dot (bell), tagline, then a cream flood
3. s3-channels — 9.6–19.6 — headline, six tiles on their spoken names, "One AI agent · Six channels", then a whip left
4. s4-thread — 19.6–30.6 — the app window whips in; messages arrive; payment verified with a punch-in; blur out
5. s5-guard — 30.6–35.8 — Marcus dispute card, warning pill, locked rule toggle; dip cut
6. s6-proof — 35.8–44.8 — three stat cards counting up, before/after chart drawing; a card grows into s7
7. s7-future — 44.8–54.2 — Coming 2027 badge, three roadmap cards on the VO; dark flood
8. s8-outro — 54.2–59.6 — wordmark, two lines, tagline

## Audio
- VO: Kokoro af_heart, 8 clips in `assets/vo/` at 0.4, 5.3, 9.8, 19.8, 30.8, 36.0, 45.0, 54.5
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (CC BY 4.0, Sascha Ende). A volume lane sits at ~0.14 under the voice and swells in the gaps. Fade-in 0.6s, fade-out 2.2s.
- Audio-reactive: outro glow opacity/scale driven by pre-extracted bass energy (frames 54.2–60s, 30fps)
- SFX: Kenney CC0, motion-matched (card places, drops, clicks, chips collide on "verified", chip lays on stats, card slides on roadmap, bells on the logo)
