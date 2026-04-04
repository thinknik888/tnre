var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var name = body.name || '';
  var phone = body.phone || '';
  var plans = body.plans || [];
  var planNames = body.planNames || [];

  if (!name || !phone) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Name and phone required' }) };
  }

  // Send SMS via Twilio
  var sid = process.env.TWILIO_ACCOUNT_SID;
  var token = process.env.TWILIO_AUTH_TOKEN;
  var from = process.env.TWILIO_PHONE_NUMBER;
  var to = '+16479240848';

  if (sid && token && from) {
    try {
      var msg = 'New lead on CondosAround: ' + name + ' ' + phone + ' saved ' + plans.length + ' floor plans: ' + planNames.join(', ');
      var twilioUrl = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json';
      var params = new URLSearchParams();
      params.append('To', to);
      params.append('From', from);
      params.append('Body', msg);

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(sid + ':' + token).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
    } catch (e) {
      console.log('Twilio error:', e.message);
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, message: 'Lead saved and SMS sent' })
  };
};
