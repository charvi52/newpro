# MedPro — setup and deployment

No accounts, external API keys, or live deployment are provisioned in this repository. **Do not commit real keys.** Features that need external providers stay visibly disabled until configured; the local cabinet, barcode/QR scan, official CDSCO quality-history search, and demo studio work without any key.

## 1. Environment variables

Create `.env.local` for local development, or add the same keys in your hosting dashboard (Vercel Project Settings → Environment Variables).

| Variable | Required for | Visibility / notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional AI enrichment only. Any medicine name resolves through the keyless DrugDB catalogue without it. | Private server only. |
| `GEMINI_MODEL` | Override the Gemini model (optional) | Private server only. Defaults to `gemini-flash-lite-latest`. |
| `OPENMRP_API_KEY` | Optional GTIN-to-product barcode lookup | Private server only. |
| `DATABASE_URL` | Optional PostgreSQL cache for barcode/search responses | Private server only. |
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud cabinet, family sign-in / inbox | Public project URL; available at build time. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud cabinet, family sign-in / inbox | Public **anon** key only — never use a service-role key here. |
| `NEXT_PUBLIC_SITE_URL` | Absolute deployed site URL for social share-card links | Public; optional. |

The app's `/api/status` route reports boolean availability only and never emits keys. Empty configuration does not make the whole site unusable. After changing `NEXT_PUBLIC_*` variables, rebuild/redeploy so the values are baked into the client bundle.

## 2. Local development

Requirements: Node.js 22.13+ and pnpm 11 (lockfile: pnpm 11.25.0).

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

Open http://localhost:3000. No API keys are needed for the offline cabinet, barcode/QR decoding, official quality-history search, or the demo studio.

## 3. Supabase (optional cloud backup and family inbox)

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Enable email/password sign-up and confirmation. Configure the production Site URL / redirect URLs and SMTP if needed.
3. Deploy with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Confirm two independent user accounts. In the cabinet page, sign in and explicitly **Save to cloud**. Sign in on another device and choose **Load cloud cabinet**.
5. In Family circle, grant a confirmed account by its email, write a message, then refresh the recipient's inbox after they sign in.
6. Revoke permission and verify the recipient can no longer read new or old messages from the API. Already-read content cannot be taken back from an already-open client.

**Apply the current `supabase/schema.sql` before using cloud saves.** Cloud load merges device and remote records. Save requires conflict review and uses a revision-checked RPC. Device edits after review and simultaneous remote edits stop the save rather than silently overwriting. Sign-out keeps device-local entries and leaves saved cloud records on the server. Local entries are shared within this browser, not isolated by account. Cabinet data is **never** shared by family permissions. Family sharing is in-app only and manual, not proactive regulatory alerting.

## 4. India-specific medicine data and official alerts

Medicine-name search uses the public [DrugDB](https://drugdb.in/) catalogue endpoint (`/v1/search`), which needs no API key. It returns the brand, manufacturer, active composition and a catalogue MRP. That MRP is catalogue data, not a live pharmacy quote: the app always asks you to match the price printed on the physical pack. The optional [OpenMRP provider](https://openmrp.in/developers) maps some barcodes to products if you obtain its key; product records may be incomplete or outdated. Always verify the physical pack.

MedPro's quality-alert flow links to official CDSCO sources:

- [CDSCO public NSQ and spurious-drug portal](https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug)
- [CDSCO alerts and notices](https://cdsco.gov.in/opencms/opencms/en/Alerts/)

MedPro imports the public portal's structured NSQ/spurious report tables and searches the bundled official history, plus live latest-table refreshes. Run `pnpm run alerts:sync` to rebuild the historical snapshot, then rebuild/redeploy. The full update policy and matching rules are in [README.md](README.md). `/api/recalls?product=...&manufacturer=...&batch=...` returns results, source evidence, reporting periods, and coverage metadata. Name-only or batch-only queries are candidates. All three identifiers must agree for a matching-alert label. No US FDA fallback is used.

This is not an exhaustive recall database or a safety verdict. Distribution/ownership history is unavailable. Spurious-investigation remarks must be read with the original evidence. Missing alerts do not establish safety.

## 5. Barcode coverage

ZXing decodes supported barcodes locally. A GTIN alone cannot reveal arbitrary batch, expiry, or genuine status. Some GS1 symbols carry batch (`10`), manufacturing date (`11`), expiry (`17`), and serial (`21`) application identifiers. The app never invents missing label fields. If the optional provider does not identify a scanned GTIN, search by name or use manual entry. No label-photo OCR is implemented.

## 6. Deployment and acceptance checklist

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

Vercel deployment (current live demo): import the repo, keep the default Next.js build command (`pnpm build` / `next build --webpack` per package script), and add any needed environment variables before deploying.

Test on HTTPS: navigation, camera permissions, barcode upload, product search, manual edits, local-storage migration, Supabase two-account RLS, cloud save/load, family revoke, and CDSCO official outbound links.

## 7. Motion and devices

Three.js loads after the interface becomes interactive. Reduced-motion users get static decoration and no card movement. WebGL failure has a static fallback. Camera scanning prefers the rear camera but still requires actual browser permission and HTTPS/localhost. A decoded barcode is not an authenticity check. QR photo decoding was tested with generated fixtures; real device acceptance is still required.
