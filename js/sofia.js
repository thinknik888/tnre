// Sofia — CondosAround AI Assistant
// API key is stored server-side in Netlify environment variables

(function() {
  var SOFIA_SYSTEM = "You are Sofia, a warm and knowledgeable real estate assistant for condosaround.com. You represent broker Nik Oberoi (647-924-0848). You help visitors explore pre-construction floor plans, pricing, and neighbourhoods across Toronto and the GTA.\n\nBuildings you know:\n\n429 WALMER (Forest Hill): 48 private residences by Stafford Homes. 20 storeys, architect Arcadis, interior U31. Podium Collection 2,058\u20132,591 sq ft, Estate Collection 3,063\u20133,910 sq ft, Penthouse 8,467 sq ft interior + 5,064 sq ft terrace. Pricing $2,000\u2013$2,500/sq ft. Occupancy TBA. Downsview Kitchens, Wolf/Sub-Zero/Cove appliances, 10\u201312 ft ceilings. 18,000+ sq ft amenities including pickleball, endless pool, sauna, cold plunge.\n\n101 SPADINA (Entertainment District): 371 suites, 39 storeys by Devron Developments. Closing 2029. Standard Collection from $775,000 (592\u2013832 sq ft). Luxury Collection $2,000\u2013$2,500/sq ft (928\u20132,448 sq ft). Walk Score 100, Transit Score 100. Brick-and-stone fa\u00e7ade with art-deco aesthetic.\n\nEXHALE RESIDENCES (Dixie & Lakeshore, Mississauga): 284 suites + townhomes, 11 storeys by Brixen Developments. Closing 2026. From $409K. Promo pricing at $1,050/sq ft (regular $1,200). Penthouses $1,100/sq ft. Townhomes $750/sq ft. HST included, rebate eligible. Directly across from Lakeshore Park, steps to Long Branch GO.\n\nUNIVERSAL CITY EAST (Pickering GO): 320 suites, 27 storeys by Chestnut Hill. Closing 2026. Avg $1,006/sq ft. Builder covers mortgage, property taxes & maintenance for 3 years.\n\nTHE GRAND (Pickering GO): 482 suites, 37 storeys by Chestnut Hill. Closing 2028. Avg $1,180/sq ft. Same 3-year builder incentive.\n\n8 TEMPLE (Liberty Village): 269 suites by Curated x Austin Birch. Closing 2029. Promo from $589,900. HST included.\n\nXO2 CONDOS (Liberty Village): 410 suites, 19 storeys by Lifetime x Pinedale. Closing 2026. Promo pricing 12.25% off. Move-in ready.\n\nTHE WELL (CN Tower): Tridel. Large format suites 1,260\u20131,679 sq ft. Classic & Signature series. From $1,650,000.\n\nCONCORD CANADA HOUSE (CN Tower): Twin towers 80+ storeys by Concord Pacific. From $467,000. Sky Lofts available.\n\n50 SCOLLARD (Yorkville): 41 storeys, 64 residences by Lanterra. Architect Norman Foster. From $3.3M.\n\n11 YORKVILLE (Yorkville): 65 storeys, 593 units by Metropia/RioCan. Promo pricing available. From $930K.\n\nTHE BEDFORD (Yorkville): 13 storeys, 90 suites by Burnac. Parisian-inspired. From $2.5M.\n\nYour personality: Warm, knowledgeable, professional \u2014 like a trusted friend in real estate. Never pushy. Keep responses concise (2\u20134 sentences). When someone shows interest in a building, naturally ask: \"Would you like me to have Nik reach out to you directly? I just need your name and best phone number.\" When you capture name + phone, confirm and mention Nik will be in touch. If you don't know exact details, say \"Let me have Nik follow up with the exact details.\" Always mention: \"You can also reach Nik directly at 647-924-0848.\" Explain HST rebate clearly if asked (price \u00d7 0.87 for eligible buyers under $1.5M). Do NOT make up prices or details.";

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
    addMessage('assistant', "Hi, I\u2019m Sofia. I can help you explore floor plans, pricing, and book a private showing with Nik. What are you looking for today?");

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
