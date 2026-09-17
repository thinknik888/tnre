// Dashboard authentication, shared by every private function.
//
// Nothing secret lives in this repo or in any page. The dashboard password is
// the DASH_PASSWORD environment variable on Netlify. Logging in (dash-login)
// exchanges it for a signed, expiring session token; every private function
// then requires that token in the `x-dash-token` header.
//
// If DASH_PASSWORD is not set, everything here fails closed.

var crypto = require('crypto');

var SESSION_DAYS = 30;

function password() {
  return process.env.DASH_PASSWORD || '';
}

function safeEqual(a, b) {
  var A = Buffer.from(String(a));
  var B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

function sign(expiry) {
  // Keyed on the password: changing DASH_PASSWORD signs everyone out.
  return crypto.createHmac('sha256', 'dash-session:' + password())
    .update(String(expiry))
    .digest('hex');
}

function checkPassword(candidate) {
  var p = password();
  return !!p && typeof candidate === 'string' && safeEqual(candidate, p);
}

function issueToken() {
  var expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return expiry + '.' + sign(expiry);
}

function verifyToken(token) {
  if (!password() || !token) return false;
  var parts = String(token).split('.');
  if (parts.length !== 2) return false;
  var expiry = parseInt(parts[0], 10);
  if (!expiry || expiry < Date.now()) return false;
  return safeEqual(parts[1], sign(expiry));
}

function isAuthorized(event) {
  var h = (event && event.headers) || {};
  return verifyToken(h['x-dash-token'] || h['X-Dash-Token'] || '');
}

module.exports = {
  checkPassword: checkPassword,
  issueToken: issueToken,
  verifyToken: verifyToken,
  isAuthorized: isAuthorized
};
