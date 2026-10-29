# Carely cleanup — verification notes

## Implemented in source

- Removed the second fictional Rohan family UI, hardcoded assistant, sample medicine / fake batch-alert views, and the globally stacked Connected Services block.
- Consolidated navigation into one first-party flow: Home, Cabinet, India alerts, Family, AI.
- India-specific official CDSCO links now replace US FDA lookup. No fake CDSCO data is generated. `/api/recalls` returns explicit HTTP 501 and links to the official portal; no auto-matching is claimed.
- Private `OPENAI_API_KEY`, public Supabase project settings and optional private barcode key use explicit setup statuses; the browser-local functions do not require them.
- A new clean local cabinet contains zero fictional medicines. The old fictional sandbox records are discarded on migration, while manually created records may be retained.
- `NEXT_PUBLIC_*` and secret key documentation has been updated.

## Verification run and outstanding work

- TypeScript/TSX files parsed successfully using TypeScript syntax parser; a dependency-installed Next.js typecheck and production build were **not run** in this environment.
- The tests were revised for the current product behavior, but a dependency-installed test runner was not available here.
- No live Supabase or OpenAI credentials were supplied, so the two-account, AI, speech and GTIN provider acceptance flows **cannot** be claimed as verified.
- Actual CDSCO site availability depends on its own uptime, and the official links need rechecking after deployment.
- Camera behavior must be checked on a real HTTPS browser and mobile device.

This is still a software prototype, not a clinically validated medical service.
