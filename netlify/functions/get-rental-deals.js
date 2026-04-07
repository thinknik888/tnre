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
    // Fetch all deals with pagination
    const allDeals = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const url = 'https://api.followupboss.com/v1/deals?limit=' + limit + '&offset=' + offset;
      const res = await fetch(url, {
        headers: { 'Authorization': auth, 'Accept': 'application/json' }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('get-rental-deals: FUB error', res.status, text);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB API error', status: res.status }) };
      }

      const data = await res.json();
      const batch = data.deals || [];
      allDeals.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }

    const EXCLUDE = ['nik oberoi', 'nikhil oberoi'];

    // Fetch lead contact for each deal from its people array
    const deals = await Promise.all(allDeals.map(async function(deal) {
      let personName = '—';
      let personPhone = '—';

      // Collect person IDs from deal — FUB uses people array, personId, or contactId
      const personIds = [];
      if (Array.isArray(deal.people)) {
        deal.people.forEach(function(p) {
          if (p.id) personIds.push(p.id);
          else if (typeof p === 'number') personIds.push(p);
        });
      }
      if (deal.personId && !personIds.includes(deal.personId)) personIds.push(deal.personId);
      if (deal.contactId && !personIds.includes(deal.contactId)) personIds.push(deal.contactId);

      // Fetch each person and find the first non-agent lead
      for (const pid of personIds) {
        try {
          const pRes = await fetch('https://api.followupboss.com/v1/people/' + pid, {
            headers: { 'Authorization': auth, 'Accept': 'application/json' }
          });
          if (!pRes.ok) continue;
          const person = await pRes.json();
          const fullName = ((person.firstName || '') + ' ' + (person.lastName || '')).trim();
          if (!fullName || EXCLUDE.includes(fullName.toLowerCase())) continue;
          personName = fullName;
          personPhone = person.phones && person.phones.length > 0 ? person.phones[0].value : '—';
          break;
        } catch (e) {
          console.error('get-rental-deals: person fetch error', pid, e.message);
        }
      }

      // If no people array worked, try inline fields from the deal itself
      if (personName === '—') {
        const inlineName = ((deal.contactFirstName || deal.firstName || '') + ' ' + (deal.contactLastName || deal.lastName || '')).trim();
        if (inlineName && !EXCLUDE.includes(inlineName.toLowerCase())) {
          personName = inlineName;
          personPhone = deal.contactPhone || deal.phone || '—';
        }
      }

      return {
        name: personName,
        phone: personPhone,
        dealName: deal.name || '—',
        value: deal.price || deal.value || 0,
        stage: deal.stageName || deal.stage || '—',
        notes: deal.description || deal.notes || '',
        created: deal.created || ''
      };
    }));

    return { statusCode: 200, headers, body: JSON.stringify(deals) };
  } catch (err) {
    console.error('get-rental-deals: exception', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', message: err.message }) };
  }
};
