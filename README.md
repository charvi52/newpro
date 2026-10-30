# Carely — offline safety cards, family demo and premium motion

Carely stores medicine pack details, decodes supported barcode/QR photos locally and provides an offline three-card safety panel with bundled CDSCO alerts, bilingual information and illustrative generic price comparisons. Start with [OFFLINE_DEMO.md](OFFLINE_DEMO.md) for the hackathon walkthrough and limitations.

## Start

Use Node.js 22.13+ and pnpm 11 (the supplied lockfile is pnpm 11.25.0).

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm run render:build
corepack pnpm run render:start
```

Open http://localhost:3000. The default portable `pnpm dev` and `pnpm build` workflow is also retained. No API keys are needed for the local cabinet, barcode decoding, or official quality-history search. The scan dialog searches five curated formulations and the bundled official records locally. The optional GTIN lookup provider outside Demo Mode still requires its existing configuration.

## Light and dark modes

Use the sun/moon switch in the header. Your choice is saved in this browser; before you choose, Carely follows the device theme. Both themes include forms, dialogs, results, notifications and the two motion effects. No images are colour-inverted. The mobile switch retains an accessible label.

## Current release

See RELEASE_NOTES.md for the two 3D motion treatments and the reliability fixes. Existing fonts, colours, page layout and navigation are retained. To upgrade cloud/AI features, run the current supabase/schema.sql before using them.

## What you can search

- **Medicine name / brand:** published quality-report candidates across the checked historical tables. A generic/name result is not a batch match. The existing scanner's medicine-name catalogue search also provides available strength, form and manufacturer details through Drug Information Service.
- **Batch number:** exact batch identifier search across the checked reports. Punctuation and leading zeros are preserved. Batch alone is not enough to identify a medicine.
- **Name + manufacturer + batch:** an exact normalized product/brand, manufacturer and batch agreement is labelled “Matching quality alert found”. Manufacturer comparison is conservative. Full report text or an exact normalized corporate name can agree; ambiguous differences remain candidates. Missing/abbreviated/different fields remain candidates marked “Details need confirmation”.
- **Barcode / QR photo:** supported codes decode on the device. GS1 batch (10), manufacturing date (11), expiry (17), serial (21) and GTIN (01) are read when encoded. In the scan's Search view, the decoded batch is prefilled in quality history. Retail GTIN-only codes do not contain arbitrary batch/expiry. Universal product identification, QR URL page scraping and label OCR are not provided.
- **Saved medicine:** open its detail card to check quality history with its name, manufacturer and batch prefilled. The manual confirmation screen has the same lookup.

Search progress and the completed outcome appear directly above the button, with the submitted details and checked-record count. Slow checks time out explicitly after 20 seconds.

Every evidence card includes the reported product, manufacturer, batch, issue, available manufacturing/expiry dates, laboratory, reporting period, source URL, retrieval time, and any spurious-investigation remarks or manufacturer reply. Missing information is never invented.

## Official data and update policy

Source: https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug

This archive contains **7,005 official records from 108 successfully retrieved monthly report tables**, with reporting years 2019–2026 and the latest report period September 2026, retrieved on 29 October 2026. These are real published records, not demo or simulated alerts. Coverage is the enumerated tables, not every medicine, every historical PDF, or every state submission.

The server refreshes the portal's default latest NSQ and spurious tables on first lookup and at most every 15 minutes afterward. Refreshes are shared between requests. Failed checks retry after one minute. Historical tables remain the bundled dated snapshot. To refresh all historical months:

```sh
pnpm run alerts:sync
pnpm test
pnpm run render:build
```

Then redeploy/restart. The sync command discovers years and months using the official portal, downloads with two concurrent requests, validates schemas/counts/reporting periods and writes data/cdsco-alerts.json atomically. Failed months retain their earlier stored records and original retrieval timestamps, and remain explicit coverage gaps. Only successfully retrieved tables replace earlier data. If no records load, the existing file is not replaced. Keep the original archive as a recovery copy before refreshing. No background scheduler is installed.

Results show exactly which report periods were checked, record counts, snapshot time, latest check time and coverage gaps. Live failures show an unavailable banner while dated historical matches can still be viewed. An unsuccessful live check never produces a reassuring empty result.

## Limits you should understand

This is **published quality-alert history, not complete manufacturing or supply-chain history**. CDSCO's public quality reports do not supply distribution, ownership or complete manufacturing timelines. Manufacturing/expiry dates are displayed only when reported. Some spurious cases remain under investigation; original remarks and firm replies are shown without treating them as proven manufacturer responsibility.

NSQ is not automatically the same as a recall. No matching alert found in the checked records does not establish safety, authenticity or effectiveness. Ask a pharmacist or doctor about treatment; do not change treatment based on these results.

## Device and cloud storage

The same medicine can be stored separately for different family members. Cabinets over 100 entries survive reload. Local entries remain in the browser after sign-out; this is a shared device-local list, not an account-isolated vault. Load cloud merges entries. Save cloud opens a review step, retains remote-only entries and rejects revision conflicts; device notes/expiry win identified conflicts only when you confirm. Clicking the same profile chip again returns to all owners. Last-checked details are stored separately on this device.

## Optional services

Supabase enables accounts, cloud cabinet snapshots and consent-based in-app family messages. OpenAI chat/speech requires Supabase sign-in and a private OpenAI API key. Optional GTIN-to-product lookup requires an OpenMRP key and provider coverage. These were not provisioned in this archive. See .env.example and SETUP.md. No secrets are included.

AI quota safeguards require the included migration: 6 combined requests/minute, 20 chat/day and 10 speech/day per account (UTC), including failed provider attempts. Family inbox refreshes on focus and every 30 seconds while visible.

See VALIDATION.md for checks and verification/ for command output. This remains a prototype, not a clinically validated medical product.

The verified `pnpm run render:build` script uses Next.js Webpack for compatibility with restricted environments; start it with `pnpm run render:start`.
