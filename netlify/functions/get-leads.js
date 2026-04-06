var { getStore } = require('@netlify/blobs');

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
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

    var leads = [];
    var raw = await store.get('leads', { type: 'json' });
    if (Array.isArray(raw)) {
      leads = raw;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(leads)
    };
  } catch (err) {
    console.error('get-leads error:', err.name, err.message, err.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to read leads', message: err.message, type: err.name })
    };
  }
};
