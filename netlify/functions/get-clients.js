var { getStore } = require('@netlify/blobs');

var DASH_SECRET = 'condos2026';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-secret',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

function openStore() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'clients', siteID: siteID, token: token });
  return getStore('clients');
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };

  var secret = event.headers['x-dash-secret'] || event.headers['X-Dash-Secret'] || '';
  if (secret !== DASH_SECRET) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    var store = openStore();
    var listing = await store.list();
    var keys = (listing && listing.blobs) ? listing.blobs.map(function(b) { return b.key; }) : [];

    var clients = await Promise.all(keys.map(function(k) {
      return store.get(k, { type: 'json' });
    }));

    var out = clients.filter(function(c) { return c && c.id; });
    out.sort(function(a, b) {
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    });

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(out) };
  } catch (err) {
    console.error('get-clients error:', err.name, err.message, err.stack);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to read clients', message: err.message, type: err.name }) };
  }
};
