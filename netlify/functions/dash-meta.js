// Meta lead-form connection for the dashboard (requires a dashboard session token).
//   GET                 -> connection status
//   POST { token }      -> connect (Page or User access token; never returned)
//   POST { sync: true } -> import new leads now

var auth = require('../lib/dash-auth');
var meta = require('../lib/meta-leads');

var headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-dash-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};
function reply(status, body) { return { statusCode: status, headers: headers, body: JSON.stringify(body) }; }

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (!auth.isAuthorized(event)) return reply(401, { error: 'Unauthorized' });
  try {
    if (event.httpMethod === 'GET') return reply(200, await meta.status());
    if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
    var body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Bad JSON' }); }
    if (body.sync) return reply(200, await meta.importNew());
    if (body.token) {
      var r = await meta.connect(String(body.token).trim());
      var first = await meta.importNew();
      return reply(200, { connected: true, pageName: r.pageName, forms: r.forms, imported: first.added });
    }
    return reply(400, { error: 'Nothing to do' });
  } catch (err) {
    console.error('dash-meta:', err.message);
    return reply(502, { error: err.message });
  }
};
