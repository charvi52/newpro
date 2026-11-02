# Changelog

## 1 November 2026

- Quality check now returns three states — flagged, cleared, not fully verifiable — instead of a bare "no record found". Every state is printable as a verification slip; the unverifiable state includes a complaint draft addressed to the state drugs controller / CDSCO / PvPI.
- New pack-evidence checks on the scanned code: GS1 check-digit validation, batch capture and encoded-expiry sanity (`lib/pack-evidence.ts`).
- The medicine quality history panel gained the verification slip button, and typing the manufacturer's exact name now confirms an exact record match instead of only a candidate.
- Medicine resolver: live Google Search grounding, key sent as the `x-goog-api-key` header, honest 404 when live search is not configured, and response caching to protect the free-tier quota.
- Fluency regression coverage for expiry dates, GS1 day-00 handling, invented prices and resolver limits plus pack-evidence and slip coverage. 61 tests passing.
- The optional AI chat assistant and server speech endpoint were removed; general medicine questions belong with a pharmacist, and every remaining feature works without any AI key.

## 30 October 2026

- Bundled CDSCO snapshot with 7,005 official NSQ and spurious-drug records across monthly tables from 2019 to 2026, searchable offline.
- Cabinet, scanner and quality history work without a network connection or API keys. Three-card safety panel presented in English and Hindi.
- Demo mode with clearly labelled fictional entries, a simulated alert and a caregiver preview; demo data never mixes with personal entries.
