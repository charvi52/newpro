# Carely — connected service setup

No accounts, projects, external API keys or live deployment are provisioned in this ZIP. **Do not commit real keys**. Features requiring external providers are visibly disabled until configuration is complete; the local cabinet and scanner remain usable.

## 1. Environment configuration

Create `.env.local` for local development (or use Render Environment settings):

| Variable | Required for | Visibility |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | cloud cabinet, family, sign-in | Public project URL, available at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cloud cabinet, family, sign-in | Public **anon** key; never substitute service-role key |
| `OPENAI_API_KEY` | signed-in AI chat and speech | Private server only; billed separately |
| `OPENAI_CHAT_MODEL` | optional model choice | Private; default `gpt-4o-mini` |
| `OPENMRP_API_KEY` | optional GTIN-to-product lookup | Private server only |
| `DATABASE_URL` | optional catalogue database cache | Private; Render Blueprint supplies this |

The app's `/api/status` route reports boolean availability only and never emits keys. Empty configuration doesn't make the whole site unusable. In Render, rebuilding is necessary after changing `NEXT_PUBLIC_*` variables.

## 2. Supabase account and family setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Enable email/password sign-up and confirmation. Configure the actual production Site URL / redirect URLs and SMTP if needed.
3. Deploy with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Confirm two independent user accounts. In the cabinet page, sign in and explicitly **Save to cloud**. Sign in on another device and choose **Load cloud cabinet**.
5. In Family circle, grant a confirmed account by its email, write a message, then refresh the recipient's inbox after they sign in.
6. Revoke permission and verify the recipient can no longer read new or old messages from the API. Already read content cannot be taken back from a person's memory or an already-open client.

**Cloud save overwrites the previous snapshot.** It does not merge simultaneous edits. Sign-out clears the device cabinet view; saved cloud records remain on the server. Cabinet data is **never** shared by family permissions. Family sharing is in-app only and manual, not proactive regulatory alerting.

## 3. AI assistant

Add private `OPENAI_API_KEY` on the server and restart/redeploy. Signed-in visitors can ask general informational questions in English or Hindi. The question alone is sent to OpenAI; no cabinet entries or family messages are sent. Generated audio comes from the speech API, using the text of the visible reply.

Before a public launch add durable per-user usage quotas, rate limits, abuse handling, monitoring and billing alerts. Auth alone is not an effective cost limit. A ChatGPT subscription is **not** an API key.

## 4. India-specific medicine data and official alerts

Medicine-name search queries are sent to the [Drug Information Service](https://drugdb.in/), which attributes its catalogue to India's Common Drug Codes / NRCeS/C-DAC. The optional [OpenMRP provider](https://openmrp.in/developers) maps some barcodes to products if you obtain its key; product records may be incomplete or outdated. Always verify the physical pack.

Carely's India alerts page links to two official sources:

- [CDSCO public NSQ and spurious-drug portal](https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug)
- [CDSCO alerts and notices](https://cdsco.gov.in/opencms/opencms/en/Alerts/)

CDSCO's website lets visitors inspect official records. **Carely does not claim automated CDSCO ingestion, an exhaustive recall database, an auto-match by name/batch, or an India safety verdict**. This would need a licensed/verified structured ingestion pipeline, published update policy, source audit trails and manual review of ambiguous records. The previous United States FDA report lookup was intentionally removed from the Indian product flow. `/api/recalls` now explicitly returns `501` unsupported and official resource URLs. Do not silently fall back to US data.

## 5. Barcode coverage

ZXing decodes supported barcodes locally. A GTIN alone cannot reveal arbitrary batch, expiry or genuine status. Some GS1 symbols carry batch (`10`) and expiry (`17`) application identifiers. The app never invents missing label fields. If the optional provider doesn't identify a scanned GTIN, search by name or use manual entry. No label-photo OCR is implemented.

## 6. Render and acceptance checklist

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm render:build
corepack pnpm render:start
```

Test on HTTPS: navigation, camera permissions, barcode upload, product search, manual edits, local-storage migration, Supabase two-account RLS, cloud save/load, family revoke, AI availability and billing limits, and CDSCO official outbound links. See `VALIDATION.md` for verification results from this build environment.
