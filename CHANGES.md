# What changed in this Carely revision

1. **One coherent interface:** removed the global Connected Services pile-up, Rohan fake phone, fictional medicine and batch alert, and four-question canned assistant. Features are now accessed through a single navigation flow.
2. **India-first official information:** removed US FDA medicine recall data from the Indian product flow; linked directly to CDSCO NSQ/spurious-drug alert lookup and official notices, with explicit warnings that Carely does not import or match Indian records automatically.
3. **Meaningful degraded mode:** account, AI and optional barcode lookup state is clearly communicated. Core scanning, local cabinet and provider-based medicine-name search do not require those private credentials.
4. **Data integrity:** new local cabinets start empty. The old fake sample entries are excluded during migration; manually entered records can be preserved.
5. **Setup and verification:** updated README, SETUP and VALIDATION files; added `/api/status`; updated tests.

**Not included:** provisioned Supabase project, private keys, live AI billing, authenticated multi-user E2E test, verified automatic CDSCO feed or finished medical-device validation. Those need the owner's infrastructure and further verification. A dependency-installed Next.js build could not be run in the current environment.
