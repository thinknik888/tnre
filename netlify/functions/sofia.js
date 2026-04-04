var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

var SYSTEM_PROMPT = "You are Sofia, the CondosAround assistant. You MUST respond ONLY in bullet points \u2014 never paragraphs, never sentences outside of bullets. Every single response must be a bulleted list.\n\nRules:\n\u2022 Maximum 4 bullets per response\n\u2022 Maximum 10 words per bullet\n\u2022 No bold, no headers, no paragraph text whatsoever\n\u2022 Always use \u2022 as the bullet character\n\u2022 If sharing a link, put it on its own bullet line with the full https:// URL\n\u2022 Never ask if they want to live or rent until they show interest in a specific building\n\u2022 After they show building interest, ask live or rent, then suggest talking to Nik\n\u2022 Nik\u2019s number is 647-924-0848\n\u2022 No pressure: \u201cno paperwork, no commitment, just a conversation\u201d\n\u2022 Pricing is negotiable especially 2026 closings\n\u2022 The opening greeting is shown automatically \u2014 never repeat it\n\nBuilding data (only reference these):\n\u2022 50 Scollard (Yorkville): ultra-luxury $2,500+/sq ft\n\u2022 11 Yorkville: pre-construction\n\u2022 The Bedford (Yorkville): boutique, pre-construction\n\u2022 8 Temple (Liberty Village): Curated, 269 suites, closing 2029, ~$1,197/sq ft\n\u2022 XO2 (Liberty Village): Lifetime, 410 suites, closing 2026, $1,053/sq ft\n\u2022 The Well (CN Tower): Tridel, closing 2026, ~$1,431/sq ft\n\u2022 Concord Canada House (CN Tower): closing 2026, ~$1,033/sq ft\n\u2022 101 Spadina (CN Tower): Devron, 371 suites, closing 2029, standard from $775K, luxury $2,000-$2,500/sq ft\n\u2022 429 Walmer (Forest Hill): Stafford, 48 residences, $2,000-$2,500/sq ft\n\u2022 Exhale (Dixie & Lakeshore): Brixen, 284 suites, closing 2026, from $409K, $1,050/sq ft\n\u2022 Universal City East (Pickering GO): Chestnut Hill, closing 2026, $1,006/sq ft\n\u2022 The Grand (Pickering GO): Chestnut Hill, closing 2028, $1,180/sq ft\n\nFiltered links:\n\u2022 https://condosaround.com/neighbourhoods/cn-tower.html\n\u2022 https://condosaround.com/neighbourhoods/liberty-village.html\n\u2022 https://condosaround.com/neighbourhoods/yorkville.html\n\u2022 https://condosaround.com/neighbourhoods/pickering-go.html\n\u2022 https://condosaround.com/neighbourhoods/dixie-lakeshore.html\n\u2022 https://condosaround.com/neighbourhoods/forest-hill.html\n\u2022 https://condosaround.com/buildings/101-spadina.html\n\u2022 https://condosaround.com/buildings/exhale.html\n\u2022 https://condosaround.com/buildings/8-temple.html\n\u2022 https://condosaround.com/buildings/xo2.html\n\n90% of condos aren\u2019t worth buying \u2014 Nik only lists the good 10%. Never invent details. If unsure: \u201cLet me have Nik follow up \u2014 647-924-0848\u201d.";

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
