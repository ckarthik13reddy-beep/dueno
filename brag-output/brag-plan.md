# Brag Plan: Dueno

## What is this app?
Dueno is an AI accounts-receivable coworker: one AI agent that chases unpaid invoices across WhatsApp, email, SMS, Telegram, Instagram and AI voice. It answers payer questions, negotiates within the owner's rules, and sends receipts.

## The angle
Every freelancer and small studio knows the awkward part of the job: the work is done, but the money isn't in. Dueno takes over the chasing. The film is a product launch: **the pain → the coworker → the product working → the proof → what's next**. It's narrated like a calm, confident launch keynote voice. The centerpiece is a real Dueno thread: Priya asks to pay half now, Dueno offers a split within the approved rules, and "$2,400 received via Stripe · verified" lands.

## Hook (first ~4 seconds)
Overdue invoice chips from the product's own data (INV-2029 · Overdue, INV-2038 · Disputed, INV-2041 · Due) pile onto a warm cream ground. The narration asks: "You did the work. You sent the invoice. And now… you're chasing it."

## Key moments (the middle)
- **Six channels**: the six channel tiles from the landing page snap in one by one, each in its brand channel colour (WhatsApp, Email, SMS, Telegram, Instagram, AI Voice).
- **The thread**: a recreation of the Inbox thread. An email reminder is followed by an AI note ("Switched to WhatsApp — Priya replies 4× faster here"). Priya asks to split, and Dueno replies with the plan. A green system pill reads "💸 $2,400 received via Stripe · verified". The side panel shows an AI payment likelihood of 92%.
- **Guardrails**: Marcus's dispute message is flagged with "Dispute detected · escalated to you · reminders paused".
- **Proof**: three stats from the landing page count up: 3.2× faster payment vs. manual chasing, 94% of payer replies handled by AI, 41h saved per month, per business.

## Future (the roadmap)
Cards marked "Coming 2027" (the badge used in the app's own future pages): Agent Studio ("Train your AI coworker on your voice"), Cash forecast ("Every invoice gets a predicted pay date"), Payer portal ("A branded, one-tap checkout"). Automations get a mention through the day-by-day collection flow (Day 0 Email → Day 3 WhatsApp → Day 7 SMS → Day 14 AI voice call).

## Outro / punchline
"dueno." wordmark with its amber dot, plus the line "The AI coworker that gets your invoices paid." VO: "Dueno. Stop chasing. Start getting paid."

## User flow worth showing
Invoice goes out by email → Dueno switches to the payer's preferred channel (WhatsApp) → payer asks for a split → AI offers a plan within the rules → payment verified. This is the centerpiece scene.

## Tone
- Preset: app-store, with cinematic moments
- Creative direction: "Premium product keynote film: warm, confident, unhurried"
- Interpretation: clean feature cards and real UI recreations, plus big type moments for the hook, the proof and the outro. Transitions vary and each has a cause on screen: an object that becomes the world, a whip, a colour flood, a blur swap. The voice is the clock.

## Format: landscape — 1920x1080
## Duration: ~55s (user explicitly asked for a feature-explaining launch video with narration and the roadmap, which needs more than the 15–25s brag default; the user's request wins)

## Visual identity (from the project, src/styles.css)
- Background: oklch(0.985 0.008 95) → cream #FBF9F3
- Ink / foreground: oklch(0.24 0.028 165) → deep green-ink #1C2B26
- Primary: oklch(0.34 0.055 168) → forest #2A4A40
- Sidebar (dark panels): oklch(0.27 0.038 168) → #1F352E
- Accent: oklch(0.79 0.145 72) → amber #E4A93A
- Success: oklch(0.58 0.115 160) → #3E9473
- Channel colours: WhatsApp oklch(0.68 0.16 150), Email oklch(0.6 0.15 250), SMS oklch(0.66 0.15 300), Telegram oklch(0.66 0.13 230), Instagram oklch(0.63 0.21 0), Voice oklch(0.72 0.15 62)
- Display font: Space Grotesk (500/600/700)
- Body font: DM Sans (400/500/600)
- Strongest visual element: the dark-green sidebar panel with the amber accent "dueno." wordmark, and the inbox thread bubbles

## Privacy substitutions
Only the fictional mock payers from src/lib/mock.ts appear (Priya Raman, Marcus Bell, Diego Alvarez). The owner's name, email, phone and handles from the dashboard and channel pages are left out. The payer portal header uses "Your Studio" in place of the owner's studio name.

## Share copy (draft)
Meet Dueno: the AI coworker that gets your invoices paid. It chases on WhatsApp, email, SMS, Telegram, Instagram and voice, so you don't have to.

## Audio direction
- Role: warm bed under narration, with sparse motion-matched accents
- Music: happy-beats-business-moves-vol-1-by-ende-dot-app.mp3 (120 BPM, most energetic, app-store fit)
- Music treatment: fades in over 0.6s and sits at about 0.14 under the voice. It swells to ~0.35 for the brief gaps (the hook-to-reveal hit and the outro) and fades out over 2s under the end card.
- Music cue guidance: preset `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`, 120.19 BPM, beats every ~0.5s from 3.02s. The voice is the primary clock. Beat grid is used for the channel tiles (every other beat, ~1s apart, so each label is readable) and the stat cards.
- Audio-reactive treatment: subtle. Music RMS drives a soft amber glow behind the wordmark on the outro. No waveform visuals.
- SFX posture: sparse to moderate, motion-matched.
- Audio-coupled moments: invoice chips landing (card place), channel tiles (soft drop), chat bubbles (light pop / click), payment verified (chips collide), stats (chip lay), roadmap cards (card slide), logo (bell).
- Restraint rule: no SFX under a spoken sentence's key word louder than the voice; no repeated identical whoosh on every cut.

## Voiceover script
Voice: Kokoro `af_heart` (warm, natural). Pronunciation: written "Dwayno" for TTS so it reads /dweɪnoʊ/, close to Spanish *dueño*.

1. Hook: "You did the work. You sent the invoice. And now… you're chasing it."
2. Reveal: "Meet Dueno — the AI coworker that gets your invoices paid."
3. Channels: "It follows up wherever your clients actually read. WhatsApp, email, SMS, Telegram, Instagram… even a natural AI voice call."
4. Thread: "Every payer lives in one thread. When Priya asks to pay half now, Dueno offers a split, within your rules. And twenty-four hundred dollars lands, verified."
5. Guardrails: "If a client disputes, it pauses the reminders and hands it straight to you."
6. Proof: "Paid three point two times faster. Ninety-four percent of replies, handled by AI. Forty-one hours back, every month."
7. Future: "And it's only getting smarter. Agent Studio, to train its voice. A cash forecast that predicts every pay date. And a one-tap payer portal."
8. Outro: "Dueno. Stop chasing. Start getting paid."

## Storyboard
(Scene durations flex to the generated VO clip lengths; each scene = its VO + ~0.6–1.0s breathing room.)

### Scene 1 — The chase — ~5s
Cream ground. Overdue chips drop and stack, each a status pill from the product: "INV-2029 · $3,150 · Overdue", "INV-2038 · $12,650 · Disputed", "INV-2041 · $4,800 · Due". Big line types in: "You did the work." then "Now you're chasing it." in ink, with "chasing" in amber.
Sequential/interaction: yes. Three chips land one by one.
Audio intent: tension, then the music opens.
Transition mood: object becomes the world. The dark-green panel grows from the centre to flood the frame → Scene 2.

### Scene 2 — Reveal — ~4.5s
Dark-green ground. "dueno." wordmark letters arrive with the amber dot landing last. Under it: "The AI coworker that gets your invoices paid." A small pill above reads "Your AI accounts-receivable coworker".
Audio: bell on the dot.
Transition: colour flood to cream → Scene 3.

### Scene 3 — Six channels — ~8s
Headline: "Get paid on every channel your clients actually read." with "every channel" in the gradient-ink treatment. Six channel tiles snap in one by one in their channel colours, with icons, in time with the VO naming them.
Sequential: yes, six tiles about 1 beat apart, synced to the spoken channel names.
Audio: soft drops.
Transition: whip left into the inbox → Scene 4.

### Scene 4 — The thread (centerpiece) — ~11s
Recreated Inbox: dark sidebar with nav (Overview, Inbox, Invoices, Channels…), thread header "Priya Raman · one thread · 3 channels", bubbles arriving in order:
- Dueno AI · Email: "Hi Priya, a friendly note that invoice INV-2041 for the brand refresh ($4,800) was due yesterday…" with INV-2041.pdf
- AI note: "Switched to WhatsApp — Priya replies 4× faster here"
- Priya · WhatsApp: "Hey! Sorry, finance is slow this month. Can I do half now and half on the 5th?"
- Dueno AI · WhatsApp: "Absolutely. I've sent a link for $2,400 today and scheduled the second half for Nov 5. 🙌" + note "Payment plan within your approved rules (max 2 installments)"
- System pill: "💸 $2,400 received via Stripe · verified" (camera punches in slightly)
Right panel: INV-2041 · $4,800 · Promised, AI payment likelihood bar fills to 92%.
Audio: pops on bubbles, chips collide on verified.
Transition: blur swap → Scene 5.

### Scene 5 — Guardrails — ~5s
Single message card: Marcus Bell · Email: "We were billed for 40 hours but the SOW says 32. I can't approve this as is." Then a warning pill "Dispute detected · escalated to you · reminders paused" slides under it. A shield check reads "AI won't negotiate amounts — handed off".
Transition: cut on the beat to dark → Scene 6.

### Scene 6 — Proof — ~8s
Dark-green ground, three stat cards from the landing page count up in amber: 3.2× / 94% / 41h with their labels, arriving in sync with the VO. Behind them the "Collected per month" line (before vs. with Dueno, May→Oct 18→48) draws.
Transition: object becomes the world. The third card expands → Scene 7.

### Scene 7 — What's next — ~10s
"Coming 2027" badge. Three roadmap cards slide in with VO: Agent Studio (tone chips Warm / Professional / Firm / Playful, plus a mini preview bubble), Cash forecast (mini area chart with "Expected in 30 days $31,040"), Payer portal ("$2,400 · Installment 2 of 2", Pay with Apple Pay button, method chips).
Sequential: yes, card by card on the VO.
Audio: card slides.
Transition: cards blur out; colour flood to dark → Scene 8.

### Scene 8 — Outro — ~4.5s
"dueno." wordmark with breathing amber glow (audio-reactive), plus "Stop chasing. Start getting paid." and below it "The AI coworker that gets your invoices paid." The final hold is ≥2s.
Audio: bell, music fades out.

**Music mood for this video:** upbeat, warm, business-confident
**Audio summary:** a short tense open, then the music opens on the reveal and sits under a warm narrator. Light UI accents ride the product actions, with one money hit on "verified", and the music swells and fades under the wordmark.
