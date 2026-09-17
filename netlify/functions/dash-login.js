// POST { password }  ->  { token, supabase: { access_token, refresh_token } }
//
// The only place the dashboard password is checked. The password and the
// Supabase service login live in Netlify environment variables, never in the
// page or the repo:
//   DASH_PASSWORD            what you type on the dashboard login screen
//   DASH_SUPABASE_EMAIL      the dashboard's Supabase user
//   DASH_SUPABASE_PASSWORD   that user's password (never sent to the browser)
//   SUPABASE_URL / SUPABASE_ANON_KEY

var auth = require('../lib/dash-auth');
var supa = require('../lib/dash-supabase');

var headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { /* treated as a wrong password */ }

  if (!auth.checkPassword(body.password)) {
    await wait(700); // slows down guessing
    return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Incorrect password' }) };
  }

  var out = { token: auth.issueToken(), supabase: null };

  // Sign in to Supabase on the server so its password never reaches the browser.
  try {
    var session = await supa.signIn();
    out.supabase = { access_token: session.access_token, refresh_token: session.refresh_token };
  } catch (err) {
    console.error('dash-login:', err.message);
    out.supabase_error = err.message;
  }

  return { statusCode: 200, headers: headers, body: JSON.stringify(out) };
};
