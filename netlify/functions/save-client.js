var { getStore } = require('@netlify/blobs');
var crypto = require('crypto');

var DASH_SECRET = 'condos2026';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function openStore() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'clients', siteID: siteID, token: token });
  return getStore('clients');
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  var n = Number(v);
  return isFinite(n) ? n : null;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };

  var secret = event.headers['x-dash-secret'] || event.headers['X-Dash-Secret'] || '';
  if (secret !== DASH_SECRET) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!body.name || !body.phone) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Name and phone required' }) };
  }

  try {
    var id = crypto.randomUUID();
    var now = new Date().toISOString();
    var client = {
      id: id,
      name: String(body.name || '').trim(),
      phone: String(body.phone || '').trim(),
      email: String(body.email || '').trim(),
      type: body.type === 'past' ? 'past' : 'active',
      building: String(body.building || '').trim(),
      unit: String(body.unit || '').trim(),
      budget: num(body.budget),
      purchase_price: num(body.purchase_price),
      closing_date: String(body.closing_date || '').trim(),
      commission_percent: num(body.commission_percent),
      brokerage_split_percent: num(body.brokerage_split_percent),
      notes: String(body.notes || ''),
      calls: [],
      appointments: [],
      created_at: now,
      updated_at: now,
      archived: false
    };

    var store = openStore();
    await store.setJSON(id, client);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, client: client }) };
  } catch (err) {
    console.error('save-client error:', err.name, err.message, err.stack);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to save client', message: err.message, type: err.name }) };
  }
};
