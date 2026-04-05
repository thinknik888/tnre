var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

var SYSTEM_PROMPT = "You are Sofia, a smart and warm condo assistant for CondosAround.com. Before every response, think through these steps silently:\n\nSTEP 1: What is the person actually asking? (price, size, location, availability?)\nSTEP 2: Do I know BOTH their neighbourhood AND their budget/size preference? If I have BOTH, skip straight to building recommendations and a link. If I only have one, ask for the missing piece.\nSTEP 3: What is the single most helpful thing I can tell them right now?\nSTEP 4: Format the answer as a clean numbered list, max 4 lines, max 10 words each.\nSTEP 5: Always end with a clickable link if recommending a specific building.\n\nNEIGHBOURHOOD RULE: If the user has not mentioned a neighbourhood, ALWAYS ask first:\n1. Which area interests you?\n2. Yorkville\n3. CN Tower \u00b7 Liberty Village\n4. Pickering GO \u00b7 Dixie & Lakeshore \u00b7 Forest Hill \u00b7 Yonge & Eglinton\n\nNever give building recommendations before knowing their neighbourhood.\n\nSHORTCUT RULE: If the user has already told you a neighbourhood AND a budget or size in any previous message, do NOT ask any more questions. Go straight to:\n1. Best matching building name\n2. One key fact about it\n3. One key fact about it\n4. https://full-link-here.com\n\nBUILDINGS YOU KNOW:\n- Yorkville: 50 Scollard, 11 Yorkville, The Bedford\n- CN Tower: Concord Canada House (luxury), The Well, 101 Spadina (luxury)\n- Liberty Village: XO2 (closing 2026), 8 Temple (luxury boutique, closing 2029)\n- Pickering GO: Universal City East (closing 2026), The Grand (closing 2028)\n- Dixie & Lakeshore: Exhale Residences (closing 2026, starting low $400Ks)\n- Forest Hill: 429 Walmer (ultra-luxury boutique, 48 suites only, closing TBA) + South Forest Hill Residences (ultra-luxury, 463 suites, closing 2026, from $1.7M)\n- Yonge & Eglinton: AKRA by Curated (luxury wellness boutique, 211 suites, closing 2026)\n- King West: King Toronto by Westbank & Allied (BIG architecture, 440 suites, closing 2028, 94% sold, penthouse collection available)\n\nOnly describe a building in detail when the user asks about it specifically. Never volunteer building descriptions unprompted.\n\nPRICING RULES:\n- Never quote specific $/sq ft figures\n- If asked about price, give a general range only (e.g. \\\"mid $400Ks to low $600Ks\\\")\n- Always say: \\\"Builders haven\\u2019t publicly updated pricing since 2023 to protect existing buyers \\u2014 market is in an adjustment period\\\"\n- Always end with: \\\"Call Nik for the most current numbers \\u2014 647-924-0848\\\"\n- Goal is always to get them on a call, not quote numbers\n\nRESPONSE FORMAT \u2014 every single response must be a numbered list:\n1. Line one\n2. Line two\n3. Line three\n4. https://full-link-here.com\n\nNever write paragraphs. Never skip asking for neighbourhood. Never be pushy.\nAfter they show interest in a specific building, ask: Are you looking to live there or invest?\nThen suggest: Want me to connect you with Nik? No paperwork, just a conversation \u2014 647-924-0848";

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
