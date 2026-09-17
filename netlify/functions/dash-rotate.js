// Stores a new database password chosen by the dashboard (in the owner's own
// browser) so the server can keep signing in after the rotation. Requires a
// valid dashboard session. The password is written to a private blob store and
// is never returned by any endpoint.
//
//   POST { stage: 'pending', password }   remember the new password, not yet live
//   POST { stage: 'commit' }              the database accepted it: make it current
//   POST { stage: 'abort' }               the database refused it: forget it
//   GET                                   { rotated: true|false }

var auth = require('../lib/dash-auth');
var supa = require('../lib/dash-supabase');

var headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

function reply(status, body) {
  return { statusCode: status, headers: headers, body: JSON.stringify(body) };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (!auth.isAuthorized(event)) return reply(401, { error: 'Unauthorized' });

  var store = supa.secretsStore();

  if (event.httpMethod === 'GET') {
    return reply(200, { rotated: !!(await store.get('supabase_password')) });
  }
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });

  var body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Bad JSON' }); }

  if (body.stage === 'pending') {
    if (typeof body.password !== 'string' || body.password.length < 24) {
      return reply(400, { error: 'Password too short' });
    }
    await store.set('supabase_password_pending', body.password);
    return reply(200, { ok: true });
  }

  if (body.stage === 'commit') {
    var pending = await store.get('supabase_password_pending');
    if (!pending) return reply(409, { error: 'Nothing pending' });
    await store.set('supabase_password', pending);
    await store.delete('supabase_password_pending');
    return reply(200, { ok: true });
  }

  if (body.stage === 'abort') {
    await store.delete('supabase_password_pending');
    return reply(200, { ok: true });
  }

  return reply(400, { error: 'Unknown stage' });
};
