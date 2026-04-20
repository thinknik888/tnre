var { getStore } = require('@netlify/blobs');

var DASH_SECRET = 'condos2026';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-secret',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

var DEFAULTS = { default_commission_percent: 2.5, default_brokerage_split_percent: 20 };

function openStore() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'client_settings', siteID: siteID, token: token });
  return getStore('client_settings');
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };

  var secret = event.headers['x-dash-secret'] || event.headers['X-Dash-Secret'] || '';
  if (secret !== DASH_SECRET) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    var store = openStore();
    var saved = await store.get('global', { type: 'json' });
    var out = {
      default_commission_percent: saved && isFinite(Number(saved.default_commission_percent)) ? Number(saved.default_commission_percent) : DEFAULTS.default_commission_percent,
      default_brokerage_split_percent: saved && isFinite(Number(saved.default_brokerage_split_percent)) ? Number(saved.default_brokerage_split_percent) : DEFAULTS.default_brokerage_split_percent
    };
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(out) };
  } catch (err) {
    console.error('get-settings error:', err.name, err.message, err.stack);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to read settings', message: err.message, type: err.name }) };
  }
};
