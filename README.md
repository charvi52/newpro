# Carely — India-first connected medicine cabinet

This project removes the duplicate fictional sandbox and keeps one coherent navigation:

**Discover → My cabinet → India alerts → Family circle → Carely AI**

## What works without API keys

- Decode real EAN/UPC retail barcodes, QR codes and supported GS1 DataMatrix codes locally through the camera (HTTPS / localhost) or an uploaded photo.
- Read the actual GTIN and, only if present in the symbol, encoded batch/expiry. Ordinary retail barcodes do not contain batch or expiry.
- Search the Indian Common Drug Codes catalogue by medicine name via [Drug Information Service](https://drugdb.in/) when the public provider is available.
- Save, edit and delete personal medicine-label records in this browser. New cabinets are empty; old fictional samples are excluded from migration.
- Open the [official CDSCO NSQ / Spurious Drugs lookup](https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug) and [CDSCO official alerts and notices](https://cdsco.gov.in/opencms/opencms/en/Alerts/). These are outbound official reference links, not an automated Carely batch verification service.

## Optional connected services

- **Supabase**: authenticated accounts, cloud cabinet save/load, permissions and an in-app family message inbox. Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` plus `supabase/schema.sql`.
- **Carely AI**: OpenAI chat and generated voice, restricted to signed-in visitors. Requires private `OPENAI_API_KEY`. ChatGPT Plus does not supply API usage credit. This application is not safe to expose publicly without quotas, rate limiting and billing safeguards.
- **GTIN product lookup**: optional OpenMRP data lookup. Requires private `OPENMRP_API_KEY` and compatible provider coverage. Barcode decoding itself needs no key.

The app reads configuration status at `/api/status`. Missing keys are shown as "Setup needed" instead of misleadingly displaying a functional service. No keys are included in the project ZIP.

## Run locally

Requirements: Node.js 22.13+, pnpm 11.

```sh
cp .env.example .env.local
corepack pnpm install
corepack pnpm dev
```

Open the local URL, allow camera access, and try **Scan a real code**. You can use **Search** if the scan doesn't include a GTIN or the optional barcode provider is not configured.

## Deploy to Render

1. Push the project to GitHub and create a Render service or Blueprint using `render.yaml`.
2. In Render Environment, set Supabase public configuration and your private OpenAI key **only if you want those features enabled**. Configure Supabase using `supabase/schema.sql`.
3. Restart/redeploy after changing any `NEXT_PUBLIC_` setting (those values are required during Next.js build).
4. Set `OPENMRP_API_KEY` separately if a provider key is available.
5. Run a real two-account end-to-end test of sign-up, confirmation, family permission, inbox access, revocation and cloud save/load before presenting these services as deployed.

A Render PostgreSQL database caches public catalogue records. Supabase is a separate service storing account-related data. A free Render database can expire and is not durable medical-record infrastructure.

## Important limits

- Official India batch-alert data is **not** automatically imported or matched. The old US FDA search was removed from the Indian flow. `GET /api/recalls` returns HTTP 501 with official CDSCO links and a coverage warning, never an invented result.
- An NSQ result is not automatically the same thing as a recall. A missing result does not establish authenticity, effectiveness or safety.
- Pack images are decoded for supported machine-readable barcodes. No OCR, photo medicine identification, medicine verification or universal barcode catalogue is promised.
- AI answers can be inaccurate and should not guide medical decisions. Consult a pharmacist or qualified clinician about a specific medicine.
- Family notifications are authenticated **in-app messages**, not SMS/email/WhatsApp/push or automatic regulatory monitoring.
- This is a prototype, not a clinically validated medical product.

Read [SETUP.md](SETUP.md) for detailed environment and acceptance instructions, and [VALIDATION.md](VALIDATION.md) for what was and was not verified.
