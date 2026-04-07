exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const apiKey = process.env.FUB_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB API key not configured' }) };
  }

  const auth = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');

  try {
    const people = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = 'https://api.followupboss.com/v1/people?sort=created&limit=' + limit + '&offset=' + offset + '&tag[]=' + encodeURIComponent('WELL FOR SALE FORM');
      const res = await fetch(url, {
        headers: {
          'Authorization': auth,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('get-sales-leads: FUB error', res.status, text);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB API error', status: res.status }) };
      }

      const data = await res.json();
      const batch = data.people || [];
      people.push(...batch);

      if (batch.length < limit) break;
      offset += limit;
    }

    const leads = people.map(function(p) {
      const phone = p.phones && p.phones.length > 0 ? p.phones[0].value : '';
      return {
        name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || '—',
        phone: phone || '—',
        tag: 'WELL FOR SALE FORM',
        date: p.created || ''
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify(leads) };
  } catch (err) {
    console.error('get-sales-leads: exception', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', message: err.message }) };
  }
};
