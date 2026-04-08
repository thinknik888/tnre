# tnre

## Webhooks

### FUB Call Webhook
**URL:** `https://condosaround.com/.netlify/functions/fub-call-webhook`

Set this in FUB under **Admin > API > Webhooks > Call Logged event**.

When a call is logged against a contact tagged with `RENTAL INQUIRY - SLOANE-LINKED` or `RENTAL INQUIRY - ELM-LINKED`, the webhook auto-increments today's Dials count in the Rentals Dashboard pipeline tracker (Supabase `pipeline_activity` table, campaign `rentals`).