// Scheduled (see netlify.toml): pulls new Facebook / Instagram form leads into
// the dashboard every 10 minutes and texts the owner about each one.
var meta = require('../lib/meta-leads');

exports.handler = async function () {
  try {
    var r = await meta.importNew();
    console.log('meta-leads-sync:', JSON.stringify(r));
  } catch (err) {
    console.error('meta-leads-sync:', err.message);
  }
  return { statusCode: 200 };
};
