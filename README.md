# Tether

Paste your tasks/syllabus, pick an accountability partner, and get held to it —
they get emailed when you finish or blow off a task, and a light on their desk
(Raspberry Pi) turns on the moment you miss a deadline.

## Quick start

1. **Install deps** (already done if you're reading this after setup):
   ```
   npm install
   ```

2. **Copy the env file and fill in real keys:**
   ```
   cp .env.example .env.local
   ```
   - `DATABASE_URL` — a Postgres connection string. Use your Tiger Data
     (Timescale) instance for the sponsor prize, or any Postgres works
     for local testing.
   - `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey
   - `RESEND_API_KEY` — from https://resend.com/api-keys (free tier is fine;
     the app runs fine without it too, it just logs the email instead of sending)
   - `NEXT_PUBLIC_BASE_URL` — set to your deployed URL once you have one
     (e.g. a Vultr instance), or leave as localhost for now.

3. **Create the tables:**
   ```
   psql "$DATABASE_URL" -f schema.sql
   ```

4. **Run it:**
   ```
   npm run dev
   ```
   Open http://localhost:3000, paste a task list, give it a partner email,
   and you'll land on your dashboard with a shareable partner link.

## How it fits together

- `/` — paste your tasks/syllabus, name your accountability partner
- `/api/commitments` — Gemini extracts structured tasks from what you pasted
- `/c/[ownerToken]` — your dashboard: mark tasks Done / Missed
- `/t/[partnerToken]` — read-only view your partner opens (auto-refreshes)
- `/api/tasks/[id]` — marking a task done/missed emails the partner
  (Gemini writes the actual message)
- `/api/hardware/[token]` — polled by the Raspberry Pi; returns `"missed"`
  the moment any task is marked missed

## Hardware (Raspberry Pi)

`pi/light.py` polls the hardware endpoint every 15s and drives an LED on
GPIO17. Edit `API_URL` at the top of the file with your deployed URL + a
token (either the owner or partner token both work), then run:

```
pip3 install requests RPi.GPIO
python3 pi/light.py
```

It runs fine without `RPi.GPIO` installed too (prints to console instead) —
useful for testing the polling logic on a laptop before wiring the real Pi.

## Scope notes for demo day

- No login system — the owner/partner tokens in the URLs ARE the auth.
  Good enough for a hackathon demo, say so plainly if asked.
- Overdue detection is manual (you click "Missed it") rather than an
  automatic deadline-checker — simplest thing that reliably works live.
- Real email inbox / calendar OAuth integration was intentionally cut —
  paste-in text covers the same "extract my due dates" value without the
  security surface area a real weekend build can't responsibly promise.
