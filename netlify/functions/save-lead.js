var { getStore } = require('@netlify/blobs');

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var name = body.name || '';
  var phone = body.phone || '';
  var building = body.building || 'Unknown';
  var date = body.date || new Date().toISOString();
  // Optional extras (the project registration forms send these; older callers don't).
  var email = String(body.email || '').trim().slice(0, 160);
  var campaign = String(body.utm_campaign || '').trim().slice(0, 80);
  var adSource = String(body.utm_source || '').trim().slice(0, 40);
  if (body.website) {           // honeypot field: real people never fill it in
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  }

  if (!name || !phone) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Name and phone required' }) };
  }

  try {
    var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
    var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';

    var store;
    if (siteID && token) {
      store = getStore({ name: 'leads', siteID: siteID, token: token });
    } else {
      store = getStore('leads');
    }

    var existing = [];
    var raw = await store.get('leads', { type: 'json' });
    if (Array.isArray(raw)) {
      existing = raw;
    }

    var record = { name: name, phone: phone, building: building, date: date };
    if (email) record.email = email;
    if (campaign) record.campaign = campaign;
    if (adSource) record.source = adSource;
    existing.push(record);
    await store.setJSON('leads', existing);

    console.log('save-lead: saved lead #' + existing.length, { name: name, building: building });

    // Also send to Follow Up Boss (secondary — don't fail if this errors)
    var fubKey = process.env.FUB_API_KEY;
    if (fubKey) {
      try {
        var parts = name.split(' ');
        var firstName = parts[0] || '';
        var lastName = parts.slice(1).join(' ') || '';
        var fubAuth = 'Basic ' + Buffer.from(fubKey + ':').toString('base64');
        var fubPayload = {
          firstName: firstName,
          lastName: lastName,
          phones: [{ value: phone }],
          source: 'condosaround.com',
          tags: ['condosaround', 'condosaround - ' + building]
        };
        if (email) fubPayload.emails = [{ value: email }];
        if (adSource) fubPayload.tags.push('ad - ' + adSource);
        if (campaign) fubPayload.tags.push('campaign - ' + campaign);
        var fubRes = await fetch('https://api.followupboss.com/v1/people', {
          method: 'POST',
          headers: { 'Authorization': fubAuth, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(fubPayload)
        });
        console.log('save-lead: FUB response', fubRes.status);
      } catch (fubErr) {
        console.error('save-lead: FUB error (non-fatal)', fubErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, count: existing.length })
    };
  } catch (err) {
    console.error('save-lead error:', err.name, err.message, err.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to save lead', message: err.message, type: err.name })
    };
  }
};
