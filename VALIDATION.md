# Carely redesign validation

## Automated
- TypeScript no-emit check passed.
- 14 Node tests passed: official input, both real QR images, invalid payloads, exact six-field matching, deduplication, consent gating, reset scoping, corrupted-state recovery, bounded assistant, personal metadata persistence, validation, edit/remove behavior, and corrupt optional metadata.

## Browser verified
- Manual record entry saves and displays YOUR ENTRY.
- Search finds a record by batch.
- Editing changes the same record without a duplicate.
- Removal has an explicit confirmation and removes the selected record.
- Sample 1 blocks the staged letter O batch until corrected to digit 0.
- The scan result links directly to the simulated alert.
- Evidence lists all six fields, fixed simulation metadata and actual official count.
- Consent ON shows the simulated notification; OFF immediately hides medicine details.
- Core navigation and family controls translate when Hindi is selected.
- Uploading the bundled SAMPLE QR via the file chooser decodes to the correct review.
- Repeated saves do not duplicate cabinet entries.
- Unsupported typed guide questions return a bounded fallback.
- Reset confirmation restores initial sample entries and clears simulated alert state.
- A 390px embedded viewport was inspected; content width equals viewport width (no horizontal overflow). Mobile navigation and sample 2 decoding/saving were exercised.

## Limits
Camera hardware/permission paths and audible Hindi voice playback depend on the presentation device and were not verified with real hardware. No recording is supplied. Official alert checking, real notifications, label extraction, authenticated family accounts and cross-device persistence are not implemented. The photo is generated illustrative artwork, not a customer testimonial.
