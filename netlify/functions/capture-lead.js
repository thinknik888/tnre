exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.FUB_API_KEY;
  if (!apiKey) {
    console.error('capture-lead: FUB_API_KEY env var is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB API key not configured' }) };
  }

  try {
    const { name, phone, building } = JSON.parse(event.body);
    console.log('capture-lead: received', { name, phone, building });

    if (!name || !phone) {
      console.error('capture-lead: missing name or phone');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and phone are required' }) };
    }

    const parts = name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    const buildingName = building || 'Unknown';
    const auth = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');

    const payload = {
      firstName,
      lastName,
      phones: [{ value: phone }],
      source: 'condosaround.com',
      tags: ['condosaround', 'condosaround - ' + buildingName]
    };

    console.log('capture-lead: posting to FUB', JSON.stringify(payload));

    const personRes = await fetch('https://api.followupboss.com/v1/people', {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const personText = await personRes.text();
    console.log('capture-lead: FUB response', personRes.status, personText);

    if (!personRes.ok) {
      console.error('capture-lead: FUB API error', personRes.status, personText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB API error', status: personRes.status }) };
    }

    const personData = JSON.parse(personText);
    const personId = personData.id || (personData.response && personData.response.id);

    if (personId) {
      console.log('capture-lead: adding note for person', personId);
      const noteRes = await fetch('https://api.followupboss.com/v1/notes', {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personId,
          body: 'Saved a floor plan on condosaround.com \u2014 ' + buildingName
        })
      });
      console.log('capture-lead: note response', noteRes.status);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, personId }) };
  } catch (err) {
    console.error('capture-lead: exception', err.message, err.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', message: err.message }) };
  }
};
