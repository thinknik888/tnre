var { getStore } = require('@netlify/blobs');

var DASH_SECRET = 'condos2026';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

var PATCHABLE = ['name','phone','email','type','building','unit','budget','purchase_price','closing_date','commission_percent','brokerage_split_percent','notes','archived'];
var NUMERIC = { budget:1, purchase_price:1, commission_percent:1, brokerage_split_percent:1 };

function openStore() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'clients', siteID: siteID, token: token });
  return getStore('clients');
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
  if (!body.id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'id required' }) };

  try {
    var store = openStore();
    var existing = await store.get(body.id, { type: 'json' });
    if (!existing) return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Not found' }) };

    var patch = body.patch || {};
    for (var i = 0; i < PATCHABLE.length; i++) {
      var k = PATCHABLE[i];
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
      var v = patch[k];
      if (NUMERIC[k]) {
        if (v === null || v === undefined || v === '') { existing[k] = null; }
        else { var n = Number(v); existing[k] = isFinite(n) ? n : null; }
      } else if (k === 'archived') {
        existing[k] = Boolean(v);
      } else if (k === 'type') {
        existing[k] = v === 'past' ? 'past' : 'active';
      } else {
        existing[k] = String(v == null ? '' : v);
      }
    }

    var nowIso = new Date().toISOString();
    if (body.action === 'log_call') {
      existing.calls = Array.isArray(existing.calls) ? existing.calls : [];
      existing.calls.push(nowIso);
    } else if (body.action === 'log_appointment') {
      existing.appointments = Array.isArray(existing.appointments) ? existing.appointments : [];
      existing.appointments.push(nowIso);
    }

    existing.updated_at = nowIso;
    await store.setJSON(body.id, existing);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, client: existing }) };
  } catch (err) {
    console.error('update-client error:', err.name, err.message, err.stack);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to update client', message: err.message, type: err.name }) };
  }
};
