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
    var store = getStore('leads');
    var leads = [];
    try {
      var raw = await store.get('leads', { type: 'json' });
      if (Array.isArray(raw)) leads = raw;
    } catch (e) {
      // No data yet
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(leads)
    };
  } catch (err) {
    console.error('get-leads error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to read leads', message: err.message })
    };
  }
};
