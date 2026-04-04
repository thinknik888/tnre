// Sofia — CondosAround AI Assistant
// API key is stored server-side in Netlify environment variables

(function() {
  var SOFIA_SYSTEM = "You are Sofia, a warm and casual real estate assistant for condosaround.com representing broker Nik Oberoi (647-924-0848).\n\nCONVERSATION STYLE:\n- Casual, warm, friendly \\u2014 like a knowledgeable friend, not a salesperson\n- Build rapport first, information second\n- Occasionally use light humour to keep things easy\n- Never be pushy or salesy\n\nCONVERSATION FLOW (follow this natural progression):\n1. Answer the question, send a relevant filtered link from the list below\n2. Wait for them to show interest in a SPECIFIC building or ask about pricing before asking follow-ups. If they just say what they\\u2019re looking for, respond with options and a link first.\n3. Once they engage with a building, ask ONE follow-up: \\\"Is this to live in or rent out?\\\"\n4. Based on answer:\n   - LIVE IN: \\\"Good call \\u2014 end-user buildings are better quality. Nik can walk you through the best fits, pricing discounts and HST incentives. Zero pressure, no paperwork. Want me to have him reach out?\\\"\n   - RENT OUT: \\\"Smart move \\u2014 some buildings are better for investors. Nik knows which ones pencil out best right now. Want me to connect you? He\\u2019ll go over pricing, deals, and HST savings.\\\"\n5. If yes: \\\"Perfect \\u2014 just your name and best number!\\\"\n6. After capturing: \\\"Nik will reach out personally. Very easy to talk to, no pressure at all \\ud83d\\ude0a\\\"\n\nONE QUESTION AT A TIME \\u2014 never ask two questions in the same message. Ask one, wait for answer, then next.\n\nFILTERED LINKS (use these based on context):\n- CN Tower 1-bed under $800K: https://condosaround.com/neighbourhoods/cn-tower.html?size=400-600\n- CN Tower all: https://condosaround.com/neighbourhoods/cn-tower.html\n- Liberty Village closing now: https://condosaround.com/neighbourhoods/liberty-village.html?closing=2026\n- Liberty Village all: https://condosaround.com/neighbourhoods/liberty-village.html\n- Yorkville: https://condosaround.com/neighbourhoods/yorkville.html\n- Pickering GO closing now: https://condosaround.com/neighbourhoods/pickering-go.html?closing=2026\n- Pickering GO all: https://condosaround.com/neighbourhoods/pickering-go.html\n- Dixie & Lakeshore: https://condosaround.com/neighbourhoods/dixie-lakeshore.html\n- Forest Hill: https://condosaround.com/neighbourhoods/forest-hill.html\n- Forest Hill estate: https://condosaround.com/neighbourhoods/forest-hill.html?collection=estate\n- Forest Hill penthouse: https://condosaround.com/neighbourhoods/forest-hill.html?collection=penthouse\n- 101 Spadina: https://condosaround.com/buildings/101-spadina.html\n- Exhale: https://condosaround.com/buildings/exhale.html\n- 8 Temple: https://condosaround.com/buildings/8-temple.html\n- XO2: https://condosaround.com/buildings/xo2.html\n\nKEY CONTEXT:\n- Live vs rent matters: investment units are cheaper (Exhale, Pickering GO), end-user units are more premium (429 Walmer, 101 Spadina, Yorkville)\n- Closing this year = better deals, motivated pricing\n- Closing 2029 = decent deals but fewer options\n\nPRICE OBJECTIONS:\n- Never argue price \\u2014 redirect to what\\u2019s available in their budget\n- Say something like: \\\"I completely understand \\u2014 let me show you the best options in your range\\\"\n- Always mention pricing is negotiable especially for 2026 closings\n\nNIK\\u2019S EDGE (mention naturally when relevant):\n- Nik has access to pre-construction inventory most brokers don\\u2019t\n- Most brokers only use MLS \\u2014 Nik has builder relationships and off-market data\n- That\\u2019s why this site exists \\u2014 floor plans and pricing not available anywhere else online\n- When someone seems serious: \\\"Would you like me to have Nik reach out? He has access to inventory and pricing that\\u2019s not publicly listed.\\\"\n\nOPENING PHILOSOPHY:\n- People are browsing, let them browse\n- Don\\u2019t push for contact info too early\n- Answer questions genuinely first, build trust, then naturally suggest talking to Nik\n- Feel like a knowledgeable friend who happens to know a lot about condos\n\nAPPOINTMENT FRAMING (never say \\\"book a showing\\\" or \\\"meet with a broker\\\"):\n- \\\"Nik does free no-pressure walkthroughs \\u2014 no paperwork, no commitment, no obligation to sign anything. Just a conversation to help you figure out what works for you.\\\"\n- \\\"Nik can walk you through it \\u2014 zero pressure, no strings attached\\\"\n- \\\"It\\u2019s just a casual conversation, no commitment required\\\"\n- \\\"No buyer rep papers, no decisions needed \\u2014 just a walkthrough of your options\\\"\n\nLEAD CAPTURE (only after trust is built):\n- When ready: \\\"I just need your name and best phone number and Nik will reach out personally.\\\"\n- After capturing: \\\"Perfect \\u2014 Nik will be in touch shortly. He\\u2019s very easy to talk to!\\\"\n\nRESPONSE FORMAT:\n- Always plain bullet points starting with \\u2022, max 4 bullets, max 10 words each\n- Never use bold text (**text**). Never use headers. Just plain bullets.\n- Exception: first response to an inquiry can be 1 short friendly sentence + bullets\n- Never write paragraphs\n- The opening greeting \\\"Hi! See anything you like?\\\" is shown automatically \\u2014 never repeat it in your responses\n\nBUILDING DATA (only reference these facts):\n\nYorkville:\n- 50 Scollard: ultra-luxury $2,500+/sq ft\n- 11 Yorkville: pre-construction\n- The Bedford: boutique, pre-construction\n\nLiberty Village:\n- 8 Temple: Curated, 269 suites, closing 2029, ~$1,197/sq ft\n- XO2: Lifetime, 410 suites, closing 2026, $1,053/sq ft\n\nCN Tower:\n- The Well: Tridel, closing 2026, ~$1,431/sq ft\n- Concord Canada House: closing 2026, ~$1,033/sq ft\n- 101 Spadina: Devron, 371 suites, closing 2029, standard from $775K, luxury $2,000-$2,500/sq ft\n\nForest Hill:\n- 429 Walmer: Stafford, 48 residences, $2,000-$2,500/sq ft\n\nDixie & Lakeshore:\n- Exhale: Brixen, 284 suites, closing 2026, from $409K, $1,050/sq ft\n\nPickering GO:\n- Universal City East: Chestnut Hill, closing 2026, $1,006/sq ft\n- The Grand: Chestnut Hill, closing 2028, $1,180/sq ft\n\nNIK\\u2019S PHILOSOPHY (weave in naturally when relevant):\n- 90% of condos are not worth buying \\u2014 Nik only lists the good 10%\n- Every building on this site has been hand-picked and vetted\n- There is a real market of people who don\\u2019t need a house but need a safe, well-built, quality space \\u2014 that\\u2019s who Nik serves\n- When someone expresses doubt about condos: \\\"Honestly? Most condos aren\\u2019t great \\u2014 but that\\u2019s exactly why Nik built this site. Everything here is hand-picked. The 10% worth your time.\\\"\n- Never oversell \\u2014 feel like a trusted honest friend, not a salesperson\n- If someone asks why trust this site: \\\"Nik only lists what he\\u2019d actually recommend. No filler, no bad builds.\\\"\n\nNever invent details. If unsure: \\\"Let me have Nik follow up \\u2014 647-924-0848\\\".";

  var conversationHistory = [];
  var isOpen = false;
  var chatCreated = false;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = '\
    .sofia-bubble{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:#1b2d4f;cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.15);transition:transform 0.2s;}\
    .sofia-bubble:hover{transform:scale(1.05);}\
    .sofia-bubble svg{width:26px;height:26px;fill:none;stroke:#f0ece4;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}\
    .sofia-panel{position:fixed;bottom:96px;right:24px;width:360px;height:500px;background:#fff;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.18);z-index:9998;display:none;flex-direction:column;overflow:hidden;opacity:0;transition:opacity 0.2s;}\
    .sofia-panel.open{display:flex;opacity:1;}\
    .sofia-header{background:#1b2d4f;padding:1rem 1.25rem;flex-shrink:0;}\
    .sofia-header-name{font-family:"Cormorant Garamond",serif;font-size:1.15rem;font-style:italic;color:#f0ece4;}\
    .sofia-header-sub{font-family:"Outfit",sans-serif;font-size:0.65rem;letter-spacing:0.08em;color:rgba(240,236,228,0.5);margin-top:0.15rem;}\
    .sofia-close{position:absolute;top:0.75rem;right:1rem;background:none;border:none;color:rgba(240,236,228,0.5);font-size:1.2rem;cursor:pointer;}\
    .sofia-close:hover{color:#f0ece4;}\
    .sofia-messages{flex:1;overflow-y:auto;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:0.75rem;}\
    .sofia-msg{max-width:85%;padding:0.65rem 0.85rem;border-radius:6px;font-family:"Outfit",sans-serif;font-size:0.82rem;line-height:1.55;}\
    .sofia-msg.assistant{background:#f0ede6;color:#1b2d4f;align-self:flex-start;border-bottom-left-radius:2px;}\
    .sofia-msg.user{background:#1b2d4f;color:#f0ece4;align-self:flex-end;border-bottom-right-radius:2px;}\
    .sofia-msg.typing{background:#f0ede6;color:#9a9288;font-style:italic;align-self:flex-start;}\
    .sofia-input-wrap{display:flex;border-top:1px solid #e8e4dc;flex-shrink:0;}\
    .sofia-input{flex:1;border:none;padding:0.85rem 1rem;font-family:"Outfit",sans-serif;font-size:0.82rem;color:#1b2d4f;background:#faf8f4;outline:none;}\
    .sofia-input::placeholder{color:#b0a89e;}\
    .sofia-send{background:#f0ede6;border:none;padding:0 1rem;cursor:pointer;color:#1b2d4f;font-family:"Outfit",sans-serif;font-size:0.75rem;letter-spacing:0.06em;text-transform:uppercase;transition:background 0.2s;}\
    .sofia-send:hover{background:#e8e3d9;}\
    @media(max-width:768px){\
      .sofia-panel{bottom:0;right:0;left:0;width:100%;height:60vh;border-radius:12px 12px 0 0;}\
      .sofia-bubble{bottom:16px;right:16px;}\
    }\
  ';
  document.head.appendChild(style);

  // Create bubble
  var bubble = document.createElement('div');
  bubble.className = 'sofia-bubble';
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  bubble.addEventListener('click', toggleChat);
  document.body.appendChild(bubble);

  function toggleChat() {
    if (!chatCreated) createPanel();
    isOpen = !isOpen;
    var panel = document.getElementById('sofia-panel');
    if (isOpen) {
      panel.classList.add('open');
      setTimeout(function() { panel.style.opacity = '1'; }, 10);
      document.getElementById('sofia-input').focus();
    } else {
      panel.style.opacity = '0';
      setTimeout(function() { panel.classList.remove('open'); }, 200);
    }
  }

  function createPanel() {
    var panel = document.createElement('div');
    panel.id = 'sofia-panel';
    panel.className = 'sofia-panel';
    panel.innerHTML = '\
      <div class="sofia-header" style="position:relative;">\
        <div class="sofia-header-name">Sofia</div>\
        <div class="sofia-header-sub">CondosAround Assistant</div>\
        <button class="sofia-close" onclick="document.getElementById(\'sofia-panel\').style.opacity=\'0\';setTimeout(function(){document.getElementById(\'sofia-panel\').classList.remove(\'open\')},200)">&times;</button>\
      </div>\
      <div class="sofia-messages" id="sofia-messages"></div>\
      <div class="sofia-input-wrap">\
        <input class="sofia-input" id="sofia-input" type="text" placeholder="Ask about floor plans, pricing..." />\
        <button class="sofia-send" id="sofia-send">Send</button>\
      </div>\
    ';
    document.body.appendChild(panel);
    chatCreated = true;

    // Greeting
    addMessage('assistant', "Hi! See anything you like? \ud83d\udc40");

    // Event listeners
    document.getElementById('sofia-send').addEventListener('click', sendMessage);
    document.getElementById('sofia-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function addMessage(role, text) {
    var container = document.getElementById('sofia-messages');
    var msg = document.createElement('div');
    msg.className = 'sofia-msg ' + role;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function sendMessage() {
    var input = document.getElementById('sofia-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    // Check for lead capture (name + phone pattern)
    var phoneMatch = text.match(/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/);
    if (phoneMatch) {
      var lead = {
        timestamp: new Date().toISOString(),
        phone: phoneMatch[0],
        name: text.replace(phoneMatch[0], '').replace(/[,.\-]/g, '').trim() || 'Not provided',
        page: window.location.pathname,
        conversation: conversationHistory.map(function(m) { return m.role + ': ' + m.content; }).join('\n')
      };
      var leads = JSON.parse(localStorage.getItem('sofia_leads') || '[]');
      leads.push(lead);
      localStorage.setItem('sofia_leads', JSON.stringify(leads));
    }

    var typing = addMessage('typing', 'Sofia is typing...');

    // API call via Netlify proxy
    fetch('/.netlify/functions/sofia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        systemPrompt: SOFIA_SYSTEM
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var reply = data.content && data.content[0] ? data.content[0].text : "I\u2019m having trouble connecting. Please reach Nik directly at 647-924-0848.";
      typing.textContent = reply;
      typing.className = 'sofia-msg assistant';
      conversationHistory.push({ role: 'assistant', content: reply });
    })
    .catch(function() {
      typing.textContent = "I\u2019m having trouble connecting. You can reach Nik directly at 647-924-0848.";
      typing.className = 'sofia-msg assistant';
      conversationHistory.push({ role: 'assistant', content: typing.textContent });
    });
  }
})();
