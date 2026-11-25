/**
 * Gemini API key rotation (backend only).
 *
 * Keys are read from server environment variables and never sent to the browser.
 * Set as many as you have in your hosting dashboard (Vercel → Environment Variables):
 *
 *   GEMINI_API_KEY=...          # primary (required for any live AI search)
 *   GEMINI_API_KEY_2=...        # optional fallback
 *   GEMINI_API_KEY_3=...        # optional fallback
 *
 * Leave them empty and the app still works: any-medicine search falls back to the
 * keyless public DrugDB catalogue, and popular brands use the bundled curated list.
 */
export function listGeminiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary) keys.push(primary);
  for (let i = 2; i <= 5; i++) {
    const envName = `GEMINI_API_KEY_${i}` as const;
    const value = process.env[envName];
    if (value) keys.push(value);
  }
  return keys;
}

export function hasAnyGeminiKey(): boolean {
  return listGeminiKeys().length > 0;
}
