// Lead capture gate — intercepts heart/save clicks before save.js
(function() {
  var overlay;
  var pendingBtn = null;

  function isRegistered() {
    return sessionStorage.getItem('ca_registered') === 'true' || localStorage.getItem('ca_registered') === 'true';
  }

  function getBuilding() {
    var t = document.title || '';
    return t.split('\u2014')[0].split('|')[0].trim() || 'Unknown';
  }

  // -- Styles --
  var css = document.createElement('style');
  css.textContent = [
    '.reg-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10002;align-items:center;justify-content:center}',
    '.reg-ov.active{display:flex}',
    '.reg-box{background:#f0ede6;border-radius:12px;padding:40px;max-width:400px;width:90%;font-family:"Outfit",sans-serif}',
    '.reg-box h2{font-family:"Cormorant Garamond",serif;font-size:28px;color:#1a1a18;margin:0 0 8px;font-weight:600}',
    '.reg-box .reg-sub{font-size:14px;color:#6b6357;margin:0 0 24px;line-height:1.5}',
    '.reg-box input{display:block;width:100%;padding:14px 16px;margin-bottom:12px;border:1px solid #d4cec4;border-radius:8px;font-family:"Outfit",sans-serif;font-size:15px;color:#1a1a18;background:#fff;outline:none;box-sizing:border-box}',
    '.reg-box input:focus{border-color:#b89a56}',
    '.reg-box input::placeholder{color:#a09a90}',
    '.reg-go{width:100%;padding:16px;background:#b89a56;color:#fff;border:none;border-radius:8px;font-family:"Outfit",sans-serif;font-size:15px;font-weight:600;cursor:pointer;letter-spacing:0.02em}',
    '.reg-go:hover{background:#a08545}',
    '.reg-fine{font-size:12px;color:#a09a90;text-align:center;margin-top:14px}'
  ].join('\n');
  document.head.appendChild(css);

  // -- Build modal --
  overlay = document.createElement('div');
  overlay.className = 'reg-ov';
  overlay.innerHTML =
    '<div class="reg-box">' +
      '<h2>Save Floor Plans</h2>' +
      '<p class="reg-sub">Enter your details to save floor plans and get updates.</p>' +
      '<input id="reg-name" type="text" placeholder="Full Name" />' +
      '<input id="reg-phone" type="tel" placeholder="Phone Number" />' +
      '<button class="reg-go" id="reg-go">Save &amp; Continue \u2192</button>' +
      '<p class="reg-fine">No email = No spam.</p>' +
    '</div>';
  document.body.appendChild(overlay);

  // -- Submit --
  document.getElementById('reg-go').addEventListener('click', function() {
    var name = document.getElementById('reg-name').value.trim();
    var phone = document.getElementById('reg-phone').value.trim();
    if (!name || !phone) return;

    // Mark registered immediately — both storage types
    sessionStorage.setItem('ca_registered', 'true');
    localStorage.setItem('ca_registered', 'true');

    // Set ca_user so save.js skips its own modal
    localStorage.setItem('ca_user', JSON.stringify({ name: name, phone: phone, date: new Date().toISOString() }));

    // POST to Netlify Blobs save-lead function
    var payload = { name: name, phone: phone, building: getBuilding(), date: new Date().toISOString() };
    fetch('/.netlify/functions/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { console.log('[register] save-lead response:', r.status); })
    .catch(function(err) { console.error('[register] save-lead error:', err); });

    // Close modal and complete save
    overlay.classList.remove('active');
    if (pendingBtn) { pendingBtn.click(); pendingBtn = null; }
  });

  // -- Intercept heart clicks (capture phase, fires before save.js) --
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.save-btn');
    if (!btn) return;
    if (isRegistered()) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    pendingBtn = btn;
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    overlay.classList.add('active');
    document.getElementById('reg-name').focus();
  }, true);
})();
