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
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB API key not configured' }) };
  }

  try {
    const { name, phone, building } = JSON.parse(event.body);
    if (!name || !phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and phone are required' }) };
    }

    const parts = name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    const buildingName = building || 'Unknown';
    const auth = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');

    // Create person in FUB
    const personRes = await fetch('https://api.followupboss.com/v1/people', {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phones: [{ value: phone }],
        source: 'condosaround.com',
        tags: ['condosaround', 'condosaround - ' + buildingName]
      })
    });

    const personData = await personRes.json();
    const personId = personData.id || (personData.response && personData.response.id);

    // Add note if person was created
    if (personId) {
      await fetch('https://api.followupboss.com/v1/notes', {
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
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
