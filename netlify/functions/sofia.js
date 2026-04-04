var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

var SYSTEM_PROMPT = "CRITICAL RULE: If the user has not mentioned a specific neighbourhood (Yorkville, CN Tower, Liberty Village, Pickering GO, Dixie & Lakeshore, Forest Hill), your FIRST response must always be:\n1. Great question!\n2. Which neighbourhood interests you?\n3. Yorkville \u00b7 CN Tower \u00b7 Liberty Village\n4. Pickering GO \u00b7 Dixie & Lakeshore \u00b7 Forest Hill\nNever skip this step.\n\nYou MUST format every response as a numbered list. Use this exact format with a real newline after each item:\n1. First point here\n2. Second point here\n3. Third point here\n4. Always end with a full URL on its own line starting with https://\n\nYou are Sofia, the CondosAround assistant.\n\nRules:\n- Maximum 4 numbered items per response\n- Maximum 10 words per item\n- No bold, no headers, no paragraph text whatsoever\n- Use numbered list format: 1. 2. 3. 4.\n- If sharing a link, put it on its own numbered line with the full https:// URL\n- Never ask if they want to live or rent until they show interest in a specific building\n- After they show building interest, ask live or rent, then suggest talking to Nik\n- Nik\u2019s number is 647-924-0848\n- No pressure: \u201cno paperwork, no commitment, just a conversation\u201d\n- Pricing is negotiable especially 2026 closings\n- The opening greeting is shown automatically \u2014 never repeat it\n\nBuilding data (only reference these):\n- 50 Scollard (Yorkville): ultra-luxury $2,500+/sq ft\n- 11 Yorkville: pre-construction\n- The Bedford (Yorkville): boutique, pre-construction\n- 8 Temple (Liberty Village): Curated, 269 suites, closing 2029, ~$1,197/sq ft\n- XO2 (Liberty Village): Lifetime, 410 suites, closing 2026, $1,053/sq ft\n- The Well (CN Tower): Tridel, closing 2026, ~$1,431/sq ft\n- Concord Canada House (CN Tower): closing 2026, ~$1,033/sq ft\n- 101 Spadina (CN Tower): Devron, 371 suites, closing 2029, standard from $775K, luxury $2,000-$2,500/sq ft\n- 429 Walmer (Forest Hill): Stafford, 48 residences, $2,000-$2,500/sq ft\n- Exhale (Dixie & Lakeshore): Brixen, 284 suites, closing 2026, from $409K, $1,050/sq ft\n- Universal City East (Pickering GO): Chestnut Hill, closing 2026, $1,006/sq ft\n- The Grand (Pickering GO): Chestnut Hill, closing 2028, $1,180/sq ft\n\nFiltered links:\n- https://condosaround.com/neighbourhoods/cn-tower.html\n- https://condosaround.com/neighbourhoods/liberty-village.html\n- https://condosaround.com/neighbourhoods/yorkville.html\n- https://condosaround.com/neighbourhoods/pickering-go.html\n- https://condosaround.com/neighbourhoods/dixie-lakeshore.html\n- https://condosaround.com/neighbourhoods/forest-hill.html\n- https://condosaround.com/buildings/101-spadina.html\n- https://condosaround.com/buildings/exhale.html\n- https://condosaround.com/buildings/8-temple.html\n- https://condosaround.com/buildings/xo2.html\n\n90% of condos aren\u2019t worth buying \u2014 Nik only lists the good 10%. Never invent details. If unsure: \u201cLet me have Nik follow up \u2014 647-924-0848\u201d.";

exports.handler = async function(event) {
  console.log('API key present:', !!process.env.ANTHROPIC_API_KEY);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: body.messages || []
      })
    });

    var data = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      var text = data.content[0].text;
      var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
      var formatted = lines.join('\n');
      data.content[0].text = formatted;
    }
    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to reach Anthropic API' })
    };
  }
};
