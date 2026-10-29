# Carely

Carely is a family medicine-information prototype. It now reads common retail barcodes, QR codes, and GS1 DataMatrix codes in the browser, extracts GS1 GTIN/batch/expiry fields where present, and offers two separate product-information paths:

- Search by medicine or generic name through the public Drug Information Service, which describes its catalogue as Common Drug Codes for India from NRCeS/C-DAC.
- Optional GTIN lookup through OpenMRP when an `OPENMRP_API_KEY` is configured. OpenMRP describes its product data as community/brand maintained; it is not a government medicine-safety feed.

The UI shows source information and keeps product identification separate from batch alerts. The official-alert collection remains an empty repo JSON file. Carely never creates official alert records and never treats “no match” as proof of safety.

## Run locally

Use Node 22.13+ and pnpm:

```sh
pnpm install
pnpm dev
```

Open the site on HTTPS (or localhost), allow camera access, and choose **Scan with camera**. Camera use is device/browser dependent. You can also upload a clear image containing a printed barcode, QR or DataMatrix. Label text is not OCRed. The two bundled SAMPLE QR images still demonstrate the original fictional flow.

To search product details by name, type a brand or generic name in the catalogue search. Search terms are sent to `https://drugdb.in` by the Carely server route; the page explains this before submission. A scanned code is decoded locally first. When a visitor selects **Search product by barcode**, the code is sent to Carely; if the optional API key is configured, Carely forwards the GTIN to OpenMRP. Do not put API keys in browser code or commit real keys.

## Barcode lookup key

The GTIN-to-product provider is optional because no key was supplied with this project. To enable it:

1. Request an OpenMRP API key from its developer portal: https://openmrp.in/developers
2. Add it as `OPENMRP_API_KEY` in the server environment (for Render, use the service’s Environment settings).
3. Restart or redeploy the service.

Without that key, Carely still decodes a real barcode and can search the medicine catalogue by a name printed on the pack. A barcode read alone does not identify product details unless a data source maps its GTIN to a product. Catalogue coverage can be incomplete.

The name-search API is implemented in `app/api/medicine/search/route.ts`; GTIN matching is in `app/api/medicine/barcode/route.ts`. Provider responses are parsed into a limited display shape. A missing provider record is shown as “not found,” not as a safety verdict.

## Deploy on Render

This repo includes `render.yaml` and Render-specific Next.js scripts. In Render, create a Web Service from the Carely GitHub repository and use the Blueprint defaults. Set `OPENMRP_API_KEY` in Render’s secret Environment settings after obtaining a key. No credentials are included in this ZIP.

If you run the project manually, use:

```sh
pnpm install --frozen-lockfile
pnpm render:build
pnpm render:start
```

The Render Blueprint creates a PostgreSQL database. Carely creates its tables on the first catalogue request and caches public catalogue records with their provider, source URL, and fetch time. Cached medicine records are refreshed after 30 days; barcode mappings are keyed by GTIN. Search text itself and personal cabinet entries are not stored by Carely. The app does not upload or store a visitor’s cabinet in the server database. The included Render free database is a temporary cache and expires after 30 days; cached product data can be fetched again from the providers.

The official-alert JSON collection remains empty. Carely does not create or import official alert records.

## Data and safety limits

- Product records come from the named catalogue providers and may be missing, stale, or incorrect. Confirm the physical pack.
- Brand/generic search is informational; it does not recommend treatment, dose, or substitution.
- Barcode provider coverage depends on the provider. Do not claim every Indian medicine is supported.
- Batch-specific official alert checking is not connected. `data/official_alerts.json` intentionally has zero records; its count is shown in the UI.
- A standard EAN/UPC usually identifies a product code. Batch and expiry are only extracted when the code itself includes them, such as some GS1 DataMatrix payloads.
- Search query and barcode transmission happen only after the visitor submits a catalogue search or chooses barcode lookup. Personal cabinet entries remain browser-local.
- No user profile, family account, real notification, medicine authentication or safety verdict is implemented.

## Existing demo behavior

The two bundled sample QR images remain marked SAMPLE/FICTIONAL. The first demonstrates a staged batch correction; the second is a clean sample scan. The family-access control gates a local-only caregiver preview. Reset clears only Carely browser-local state and does not edit the official JSON file.

## Reference sources

- India Drug Registry announcement and API availability: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2278991
- Drug Information Service API and data attribution: https://drugdb.in/
- OpenMRP API, data model and license: https://github.com/openmrp-in/openmrp
- GS1 Application Identifiers for product, batch and expiry fields: https://ref.gs1.org/ai/
