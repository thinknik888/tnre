var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Note: This returns leads from sofia_leads localStorage submissions
// In production, you'd use a database. This endpoint validates the admin key
// and returns a confirmation. Leads are stored client-side and sent via save-lead.js SMS.

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  var adminKey = process.env.ADMIN_KEY;
  var providedKey = event.headers['x-admin-key'] || event.queryStringParameters.key;

  if (!adminKey || providedKey !== adminKey) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ authenticated: true, message: 'Access granted. Leads are delivered via SMS to 647-924-0848.' })
  };
};
