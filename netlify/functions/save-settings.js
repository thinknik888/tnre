var { getStore } = require('@netlify/blobs');

var auth = require('../lib/dash-auth');

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function openStore() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'client_settings', siteID: siteID, token: token });
  return getStore('client_settings');
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };

  if (!auth.isAuthorized(event)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var c = Number(body.default_commission_percent);
  var s = Number(body.default_brokerage_split_percent);
  var settings = {
    default_commission_percent: isFinite(c) ? c : 2.5,
    default_brokerage_split_percent: isFinite(s) ? s : 20
  };

  try {
    var store = openStore();
    await store.setJSON('global', settings);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, settings: settings }) };
  } catch (err) {
    console.error('save-settings error:', err.name, err.message, err.stack);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to save settings', message: err.message, type: err.name }) };
  }
};
