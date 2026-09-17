// POST { name, phone, date }  -- removes one website lead from the private store.
// Requires a dashboard session token (see netlify/lib/dash-auth.js).

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
  if (siteID && token) return getStore({ name: 'leads', siteID: siteID, token: token });
  return getStore('leads');
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (!auth.isAuthorized(event)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };

  var body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  if (!body.name || !body.date) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'name and date required' }) };
  }

  try {
    var store = openStore();
    var leads = await store.get('leads', { type: 'json' });
    if (!Array.isArray(leads)) leads = [];
    var before = leads.length;
    // Match on the fields the dashboard shows; date is an ISO timestamp so it is unique in practice.
    var kept = leads.filter(function (l) {
      return !(l && l.name === body.name && l.date === body.date && (l.phone || '') === (body.phone || ''));
    });
    await store.setJSON('leads', kept);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ removed: before - kept.length, remaining: kept.length }) };
  } catch (err) {
    console.error('delete-lead:', err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Could not delete lead' }) };
  }
};
