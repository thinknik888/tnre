// Text-alert settings for the dashboard (requires a dashboard session token).
//
//   GET                       -> { configured, from, to }  (never returns the token)
//   POST { twilio_sid, twilio_token, twilio_from, notify_to }  -> saves them
//   POST { test: true }       -> sends a test text to notify_to

var auth = require('../lib/dash-auth');
var notify = require('../lib/notify');

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

function mask(n) {
  n = String(n || '');
  return n.length > 4 ? n.slice(0, -4).replace(/\d/g, '•') + n.slice(-4) : n;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (!auth.isAuthorized(event)) return reply(401, { error: 'Unauthorized' });

  if (event.httpMethod === 'GET') {
    var cfg = await notify.readConfig();
    return reply(200, { configured: notify.ready(cfg), from: mask(cfg.twilio_from), to: mask(cfg.notify_to) });
  }
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });

  var body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Bad JSON' }); }

  if (body.test) {
    var r = await notify.sendSms('CondosAround test: new-lead text alerts are working.');
    return reply(r.sent ? 200 : 502, r);
  }

  var s = notify.store();
  var saved = 0;
  for (var i = 0; i < notify.KEYS.length; i++) {
    var k = notify.KEYS[i];
    var v = String(body[k] || '').trim();
    if (v) { await s.set(k, v); saved++; }
  }
  var after = await notify.readConfig();
  return reply(200, { saved: saved, configured: notify.ready(after), from: mask(after.twilio_from), to: mask(after.notify_to) });
};
