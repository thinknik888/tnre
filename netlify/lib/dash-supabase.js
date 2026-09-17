// Server-side Supabase sign-in for the dashboard's database user.
//
// The database password is NOT the dashboard password and is never sent to a
// browser. It is looked up, in order, from:
//   1. the private "dash-secrets" blob store (written by the dashboard's
//      "Secure database login" button -- see functions/dash-rotate.js)
//   2. the DASH_SUPABASE_PASSWORD environment variable (initial value)
// A freshly rotated password is kept as "pending" until the rotation is
// confirmed, so a half-finished rotation can never lock the dashboard out.

var { getStore } = require('@netlify/blobs');

function config() {
  return {
    url: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
    anon: process.env.SUPABASE_ANON_KEY || '',
    email: process.env.DASH_SUPABASE_EMAIL || ''
  };
}

function secretsStore() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'dash-secrets', siteID: siteID, token: token });
  return getStore('dash-secrets');
}

async function candidatePasswords() {
  var list = [];
  try {
    var store = secretsStore();
    var current = await store.get('supabase_password');
    var pending = await store.get('supabase_password_pending');
    if (current) list.push(current);
    if (pending) list.push(pending);
  } catch (err) {
    console.error('dash-supabase: could not read secrets store', err.message);
  }
  if (process.env.DASH_SUPABASE_PASSWORD) list.push(process.env.DASH_SUPABASE_PASSWORD);
  return list;
}

// Resolves to { access_token, refresh_token, user } or throws.
async function signIn() {
  var c = config();
  if (!c.url || !c.anon || !c.email) throw new Error('Supabase is not configured on the server');
  var passwords = await candidatePasswords();
  if (!passwords.length) throw new Error('No database password is configured on the server');

  var lastStatus = 0;
  for (var i = 0; i < passwords.length; i++) {
    var res = await fetch(c.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: c.anon },
      body: JSON.stringify({ email: c.email, password: passwords[i] })
    });
    lastStatus = res.status;
    if (res.ok) {
      var data = await res.json();
      if (data.access_token) return data;
    }
  }
  throw new Error('Database sign-in failed (' + lastStatus + ')');
}

module.exports = { config: config, secretsStore: secretsStore, signIn: signIn };
