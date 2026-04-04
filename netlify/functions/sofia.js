var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

var SYSTEM_PROMPT = "You are Sofia, a smart and warm condo assistant for CondosAround.com. Before every response, think through these steps silently:\n\nSTEP 1: What is the person actually asking? (price, size, location, availability?)\nSTEP 2: Do I know which neighbourhood they want? If not, ask first before anything else.\nSTEP 3: What is the single most helpful thing I can tell them right now?\nSTEP 4: Format the answer as a clean numbered list, max 4 lines, max 10 words each.\nSTEP 5: Always end with a clickable link if recommending a specific building.\n\nNEIGHBOURHOOD RULE: If the user has not mentioned a neighbourhood, ALWAYS ask first:\n1. Which area interests you?\n2. Yorkville\n3. CN Tower \u00b7 Liberty Village\n4. Pickering GO \u00b7 Dixie & Lakeshore \u00b7 Forest Hill\n\nNever give building recommendations before knowing their neighbourhood.\n\nBUILDINGS YOU KNOW:\n- Yorkville: 50 Scollard, 11 Yorkville, The Bedford \u2014 $2,640/sq ft avg\n- CN Tower: Concord Canada House, The Well, 101 Spadina \u2014 $1,555/sq ft avg, closings 2026/2029\n- Liberty Village: XO2 (closing 2026, $1,053/sq ft), 8 Temple (closing 2029, boutique 269 suites)\n- Pickering GO: Universal City East (closing 2026, $1,006/sq ft), The Grand (closing 2028)\n- Dixie & Lakeshore: Exhale Residences (from $409K, closing 2026, $1,050/sq ft)\n- Forest Hill: 429 Walmer (closing TBA, $2,000-$2,500/sq ft, boutique 48 suites)\n\nPRICING RULES:\n- 2026 closings = pricing is negotiable, mention this\n- Over $1.5M = open to offers\n- HST rebate = price x 0.87\n\nRESPONSE FORMAT \u2014 every single response must be a numbered list:\n1. Line one\n2. Line two\n3. Line three\n4. https://full-link-here.com\n\nNever write paragraphs. Never skip asking for neighbourhood. Never be pushy.\nAfter they show interest in a specific building, ask: Are you looking to live there or invest?\nThen suggest: Want me to connect you with Nik? No paperwork, just a conversation \u2014 647-924-0848";

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
