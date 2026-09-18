// New-lead text alerts via Twilio.
//
// Credentials are pasted by the owner into the dashboard (Settings -> Text
// alerts) and stored in the private "dash-secrets" blob store; nothing lives in
// this repo. If they are not configured, sendLeadSms() does nothing.

var { getStore } = require('@netlify/blobs');

var KEYS = ['twilio_sid', 'twilio_token', 'twilio_from', 'notify_to'];

function store() {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: 'dash-secrets', siteID: siteID, token: token });
  return getStore('dash-secrets');
}

async function readConfig() {
  var s = store();
  var cfg = {};
  for (var i = 0; i < KEYS.length; i++) {
    cfg[KEYS[i]] = (await s.get(KEYS[i])) || process.env[KEYS[i].toUpperCase()] || '';
  }
  return cfg;
}

function ready(cfg) {
  return KEYS.every(function (k) { return cfg[k]; });
}

async function sendSms(text) {
  var cfg = await readConfig();
  if (!ready(cfg)) return { sent: false, reason: 'not configured' };
  var res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(cfg.twilio_sid) + '/Messages.json', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(cfg.twilio_sid + ':' + cfg.twilio_token).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ From: cfg.twilio_from, To: cfg.notify_to, Body: text }).toString()
  });
  if (!res.ok) {
    var detail = '';
    try { detail = (await res.json()).message || ''; } catch (e) { /* ignore */ }
    console.error('notify: Twilio ' + res.status + ' ' + detail);
    return { sent: false, reason: 'twilio ' + res.status + (detail ? ': ' + detail : '') };
  }
  return { sent: true };
}

// Fire-and-forget from lead capture: never lets a texting problem break the form.
async function sendLeadSms(lead) {
  try {
    var where = lead.source ? ' (' + lead.source + (lead.campaign ? ' / ' + lead.campaign : '') + ')' : '';
    var text = 'New lead: ' + (lead.name || '?') + ' ' + (lead.phone || '') +
      (lead.email ? ' ' + lead.email : '') + ' — ' + (lead.building || 'CondosAround') + where;
    return await sendSms(text.slice(0, 320));
  } catch (err) {
    console.error('notify: ' + err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { KEYS: KEYS, store: store, readConfig: readConfig, ready: ready, sendSms: sendSms, sendLeadSms: sendLeadSms };
