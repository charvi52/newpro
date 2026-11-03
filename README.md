# MedPro — check a medicine pack against official CDSCO quality alerts

MedPro is a family medicine companion for Indian households. Save every pack in the house once, then check the details printed on the strip — medicine, manufacturer, batch — against **official CDSCO NSQ and spurious-drug quality-report records**. Each pack gets one of three verdicts with the official source attached, a printable verification slip for the chemist counter, and — in Dadi Mode — large text, pack photos and Hindi read-aloud.

**Live demo:** deployed on Vercel — see the repository About panel.

Made by **Charvi Naresh and Sparsh Rana**.

## How the verdicts work

The exact-match rule is deliberately strict: a verdict of **Matching quality alert found** requires agreement on product/brand, manufacturer and exact batch. Weaker links stay marked **Details need confirmation** and are never shown as matches. A full sweep with no matching alert is reported as **CLEARED — no matching alert in the official records checked** — worded as a verified absence, not a certificate of authenticity. Every record links to its official CDSCO source page.

## Try it in 60 seconds

Open the app (no sign-in needed), then:

- **Add manually** → `Dolo 650` + batch `MLS-251719` → confirmation-needed verdict with candidate records.
- **Add manually** → `Killmed 625LB` / `VADSP PHARMACEUTICALS` / `VT252296` → matching quality alert, with a print-ready verification slip and chemist alert slip.
- **Add manually** → `Dolo 650` / `Micro Labs Ltd` / `ABC123XYZ` → CLEARED against the indexed records.
- Add `Pan-D` and `Autrin` plus an `Ecosprin 75` to see the conflict checker flag duplicate paracetamol and a bleeding-risk combination.
- **Demo studio** (footer of the page) loads a sample cabinet with a simulated caregiver-notification scene, labelled fictional at every step.

Dadi Mode (header button) switches to a simplified start screen, bigger type, pack photos and Hindi audio. The app works fully offline after the first load; the official-records search runs against the bundled snapshot with the checked tables listed under each result.

## Honest limits

- The bundled snapshot covers the monthly report tables successfully retrieved; every result lists which tables were checked and which periods are missing.
- Lower prices in the Sasti Dawa Finder come from a live, source-linked search and are never invented without a source.
- Cloud backup and family inbox require optional Supabase configuration; unpanelled states are shown honestly rather than hidden.
- MedPro is a prototype. It does not authenticate medicines, provide a supply-chain history, or offer medical advice — questions about treatment belong with a pharmacist or doctor.

## Data and privacy

- Pack entries live in browser storage on your device. Nothing is uploaded by default.
- Official records: CDSCO NSQ and spurious-drug monthly bulletins, plus live retrieval of the latest tables with labelled coverage and gaps.
- Read-aloud audio uses the device speech engine; no server call.

## Setup

Node.js 22.13+ and pnpm 11 (the lockfile is pnpm 11.25.0).

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm run render:build
corepack pnpm run render:start
```

Open http://localhost:3000. No API keys are needed for the offline cabinet, barcode/QR decoding, official quality-history search or the demo studio.

Optional environment variables (see `.env.example`):

| Key | Purpose |
|---|---|
| `GEMINI_API_KEY` | Live, source-linked price search for the Sasti Dawa Finder |
| `OPENMRP_API_KEY` | Optional barcode-to-product lookup provider |
| `DATABASE_URL` | Optional PostgreSQL cache for barcode/search responses |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional cloud backup and family inbox |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL used for social share-card links |

## Documentation

- [OFFLINE_DEMO.md](OFFLINE_DEMO.md) — demo walkthrough and its boundaries
- [SETUP.md](SETUP.md) — device, HTTPS and motion notes
- [CHANGES.md](CHANGES.md) — release history
- [supabase/schema.sql](supabase/schema.sql) — optional cloud schema
