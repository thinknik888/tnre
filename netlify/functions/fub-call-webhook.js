const { createClient } = require('@supabase/supabase-js');

const SUPA_URL = 'https://aondcignkaztqpnkhetr.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmRjaWdua2F6dHFwbmtoZXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU3OTksImV4cCI6MjA4OTc2MTc5OX0.Knm6uXfHjQdi57Y1AEeD8RPuhyogMRAhIvBn6BFJSxk';
const DASH_EMAIL = 'nikhiloberoi80@gmail.com';
const DASH_PASS = 'condos2026';
const RENTAL_TAGS = ['RENTAL INQUIRY - SLOANE-LINKED', 'RENTAL INQUIRY - ELM-LINKED'];
const CAMPAIGN = 'rentals';

exports.handler = async function(event) {
  // Always return 200 — FUB retries on non-200
  const ok = { statusCode: 200, body: JSON.stringify({ received: true }) };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return ok;

  const fubKey = process.env.FUB_API_KEY;
  if (!fubKey) { console.error('fub-call-webhook: FUB_API_KEY not set'); return ok; }

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('fub-call-webhook: received event', JSON.stringify(payload).substring(0, 500));

    // Extract person ID from FUB webhook payload
    // FUB sends: { event, resourceIds, person, personId, ... }
    var personId = payload.personId || (payload.person && payload.person.id) || null;
    if (!personId && Array.isArray(payload.resourceIds) && payload.resourceIds.length > 0) {
      personId = payload.resourceIds[0];
    }
    if (!personId) { console.log('fub-call-webhook: no personId found'); return ok; }

    // Fetch person from FUB to check tags
    const auth = 'Basic ' + Buffer.from(fubKey + ':').toString('base64');
    const pRes = await fetch('https://api.followupboss.com/v1/people/' + personId, {
      headers: { 'Authorization': auth, 'Accept': 'application/json' }
    });
    if (!pRes.ok) { console.error('fub-call-webhook: FUB people fetch failed', pRes.status); return ok; }
    const person = await pRes.json();
    const tags = person.tags || [];

    // Check for rental tags
    const isRental = tags.some(function(t) { return RENTAL_TAGS.includes(t); });
    if (!isRental) { console.log('fub-call-webhook: not a rental lead, skipping'); return ok; }

    console.log('fub-call-webhook: rental lead confirmed, incrementing dials');

    // Get today's date in Toronto timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

    // Sign into Supabase as dashboard user
    const sb = createClient(SUPA_URL, SUPA_KEY);
    const { data: authData, error: authErr } = await sb.auth.signInWithPassword({ email: DASH_EMAIL, password: DASH_PASS });
    if (authErr) { console.error('fub-call-webhook: Supabase auth failed', authErr.message); return ok; }
    const userId = authData.user.id;

    // Fetch existing row for today
    const { data: existing } = await sb.from('pipeline_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('campaign', CAMPAIGN)
      .maybeSingle();

    if (existing) {
      // Increment dials
      await sb.from('pipeline_activity')
        .update({ dials: (existing.dials || 0) + 1 })
        .eq('user_id', userId)
        .eq('date', today)
        .eq('campaign', CAMPAIGN);
      console.log('fub-call-webhook: incremented dials to', (existing.dials || 0) + 1);
    } else {
      // Create new row with dials: 1
      await sb.from('pipeline_activity')
        .insert({
          user_id: userId,
          date: today,
          campaign: CAMPAIGN,
          dials: 1,
          contacts: 0,
          engaged: 0,
          appt_booked: 0,
          appt_completed: 0,
          offers_sent: 0,
          offers_firmed: 0
        });
      console.log('fub-call-webhook: created new row with dials: 1');
    }

    // Sign out
    await sb.auth.signOut();

    return ok;
  } catch (err) {
    console.error('fub-call-webhook: exception', err.message);
    return ok;
  }
};
