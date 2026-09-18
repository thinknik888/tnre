// Pull Facebook / Instagram instant-form leads into the dashboard's lead store.
//
// Needs a Page access token with leads_retrieval, saved from the dashboard
// (Settings -> Meta lead forms) into the private "dash-secrets" blob store.
// importNew() is run by the scheduled function meta-leads-sync and by the
// dashboard's "Sync now" button. Imported leads look like website leads
// (source "facebook") so they show in the Website Leads tab and trigger the
// same text alert.

var { getStore } = require('@netlify/blobs');
var notify = require('./notify');

var GRAPH = 'https://graph.facebook.com/v21.0';

function blobs(name) {
  var siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || '';
  var token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN || '';
  if (siteID && token) return getStore({ name: name, siteID: siteID, token: token });
  return getStore(name);
}

async function graph(path, params, token) {
  var url = new URL(GRAPH + '/' + path);
  Object.keys(params || {}).forEach(function (k) { url.searchParams.set(k, params[k]); });
  url.searchParams.set('access_token', token);
  var res = await fetch(url.toString());
  var data = await res.json();
  if (!res.ok || data.error) {
    var e = (data.error && data.error.message) || ('HTTP ' + res.status);
    throw new Error(e);
  }
  return data;
}

async function readConfig() {
  var s = blobs('dash-secrets');
  var exp = (await s.get('meta_token_expires')) || '';
  return {
    token: (await s.get('meta_page_token')) || '',
    pageId: (await s.get('meta_page_id')) || '',
    pageName: (await s.get('meta_page_name')) || '',
    expires: exp === '' ? null : parseInt(exp, 10)
  };
}

// Accepts either a Page token or a User token; resolves to the Page.
async function connect(rawToken) {
  var me = await graph('me', { fields: 'id,name' }, rawToken);
  var pageId = me.id, pageName = me.name, pageToken = rawToken;
  // A user token lists its pages; a page token does not.
  try {
    var accounts = await graph('me/accounts', { fields: 'id,name,access_token', limit: 100 }, rawToken);
    if (accounts.data && accounts.data.length) {
      var pick = accounts.data.find(function (p) { return /condos ?around/i.test(p.name); }) || accounts.data[0];
      pageId = pick.id; pageName = pick.name; pageToken = pick.access_token || rawToken;
    }
  } catch (e) { /* page tokens cannot call me/accounts; that is fine */ }
  var forms = await graph(pageId + '/leadgen_forms', { fields: 'id,name,status', limit: 100 }, pageToken);

  // How long will this Page token live? A Page token taken from a short-lived
  // user token dies within hours; one taken from an extended (60-day) user
  // token never expires. Say which, so a connection never fails silently.
  // expires: 0 = never, a millisecond timestamp, or null when Meta will not say.
  var expires = null;
  try {
    var dbg = await graph('debug_token', { input_token: pageToken }, rawToken);
    if (dbg.data && typeof dbg.data.expires_at === 'number') expires = dbg.data.expires_at === 0 ? 0 : dbg.data.expires_at * 1000;
  } catch (e) { /* not a developer token for this app; expiry stays unknown */ }

  var s = blobs('dash-secrets');
  await s.set('meta_page_token', pageToken);
  await s.set('meta_page_id', pageId);
  await s.set('meta_page_name', pageName);
  await s.set('meta_token_expires', expires === null ? '' : String(expires));
  return { pageId: pageId, pageName: pageName, expires: expires,
           forms: (forms.data || []).map(function (f) { return { id: f.id, name: f.name, status: f.status }; }) };
}

function field(lead, names) {
  var fd = lead.field_data || [];
  for (var i = 0; i < names.length; i++) {
    var hit = fd.find(function (f) { return f.name === names[i]; });
    if (hit && hit.values && hit.values[0]) return String(hit.values[0]);
  }
  return '';
}

async function importNew() {
  var cfg = await readConfig();
  if (!cfg.token || !cfg.pageId) return { ok: false, reason: 'Meta is not connected' };

  var state = blobs('meta-sync');
  var imported = (await state.get('imported_ids', { type: 'json' })) || {};
  var lastSync = parseInt((await state.get('last_sync')) || '0', 10);
  // look back 26 hours from the last sync (or 90 days on the first run) so nothing is missed
  var since = lastSync ? Math.floor(lastSync / 1000) - 26 * 3600 : Math.floor(Date.now() / 1000) - 90 * 86400;

  var forms;
  try {
    forms = await graph(cfg.pageId + '/leadgen_forms', { fields: 'id,name,status', limit: 100 }, cfg.token);
  } catch (e) {
    if (/expired|session|validat|OAuth/i.test(e.message)) return { ok: false, reason: 'The Facebook connection has expired. Reconnect it in Settings.' };
    throw e;
  }
  var leadsStore = blobs('leads');
  var existing = (await leadsStore.get('leads', { type: 'json' })) || [];
  var added = [];

  for (var i = 0; i < (forms.data || []).length; i++) {
    var form = forms.data[i];
    var building = form.name.split(/\s[-–(]/)[0].trim() || form.name;
    var next = form.id + '/leads';
    var params = {
      fields: 'id,created_time,field_data,ad_name,campaign_name,platform',
      limit: 100,
      filtering: JSON.stringify([{ field: 'time_created', operator: 'GREATER_THAN', value: since }])
    };
    var page = await graph(next, params, cfg.token);
    var rows = page.data || [];
    for (var j = 0; j < rows.length; j++) {
      var l = rows[j];
      if (imported[l.id]) continue;
      var record = {
        name: field(l, ['full_name', 'name', 'first_name']) || 'Facebook lead',
        phone: field(l, ['phone_number', 'phone']),
        email: field(l, ['email', 'work_email']),
        building: building,
        date: l.created_time || new Date().toISOString(),
        source: l.platform === 'ig' ? 'instagram' : 'facebook',
        campaign: l.campaign_name || form.name,
        meta_lead_id: l.id
      };
      existing.push(record);
      imported[l.id] = 1;
      added.push(record);
    }
  }

  if (added.length) await leadsStore.setJSON('leads', existing);
  await state.setJSON('imported_ids', imported);
  await state.set('last_sync', String(Date.now()));

  for (var k = 0; k < added.length; k++) await notify.sendLeadSms(added[k]);

  return { ok: true, forms: (forms.data || []).length, added: added.length, total: existing.length };
}

async function status() {
  var cfg = await readConfig();
  var state = blobs('meta-sync');
  var imported = (await state.get('imported_ids', { type: 'json' })) || {};
  return {
    connected: !!(cfg.token && cfg.pageId),
    pageName: cfg.pageName,
    expires: cfg.expires,
    imported: Object.keys(imported).length,
    lastSync: parseInt((await state.get('last_sync')) || '0', 10) || null
  };
}

module.exports = { connect: connect, importNew: importNew, status: status };
