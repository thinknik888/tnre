var { getStore } = require('@netlify/blobs');
var notify = require('../lib/notify');

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

    var sms = await notify.sendLeadSms(record);
    console.log('save-lead: sms', JSON.stringify(sms));

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
