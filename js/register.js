// Lead capture gate — intercepts heart/save clicks before save.js
(function() {
  var overlay, formView, confirmView, closeBtn, autoTimer;
  var pendingBtn = null;

  function isRegistered() {
    return sessionStorage.getItem('ca_registered') === 'true';
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
    '.reg-box{background:#f0ede6;border-radius:12px;padding:40px;max-width:400px;width:90%;position:relative;font-family:"Outfit",sans-serif}',
    '.reg-box h2{font-family:"Cormorant Garamond",serif;font-size:28px;color:#1a1a18;margin:0 0 8px;font-weight:600}',
    '.reg-box .reg-sub{font-size:14px;color:#6b6357;margin:0 0 24px;line-height:1.5}',
    '.reg-box input{display:block;width:100%;padding:14px 16px;margin-bottom:12px;border:1px solid #d4cec4;border-radius:8px;font-family:"Outfit",sans-serif;font-size:15px;color:#1a1a18;background:#fff;outline:none;box-sizing:border-box}',
    '.reg-box input:focus{border-color:#b89a56}',
    '.reg-box input::placeholder{color:#a09a90}',
    '.reg-go{width:100%;padding:16px;background:#b89a56;color:#fff;border:none;border-radius:8px;font-family:"Outfit",sans-serif;font-size:15px;font-weight:600;cursor:pointer;letter-spacing:0.02em}',
    '.reg-go:hover{background:#a08545}',
    '.reg-fine{font-size:12px;color:#a09a90;text-align:center;margin-top:14px}',
    '.reg-x{position:absolute;top:14px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#a09a90;line-height:1;padding:4px;display:none}',
    '.reg-x:hover{color:#1a1a18}',
    '.reg-chk{width:56px;height:56px;border-radius:50%;background:#b89a56;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}',
    '.reg-chk svg{width:28px;height:28px;stroke:#fff;stroke-width:3;fill:none}'
  ].join('\n');
  document.head.appendChild(css);

  // -- Build modal --
  overlay = document.createElement('div');
  overlay.className = 'reg-ov';

  overlay.innerHTML =
    '<div class="reg-box">' +
      '<button class="reg-x" id="reg-x">\u00d7</button>' +
      '<div id="reg-form">' +
        '<h2>Save Floor Plans</h2>' +
        '<p class="reg-sub">Enter your details to save floor plans and get updates.</p>' +
        '<input id="reg-name" type="text" placeholder="Full Name" />' +
        '<input id="reg-phone" type="tel" placeholder="Phone Number" />' +
        '<button class="reg-go" id="reg-go">Save &amp; Continue \u2192</button>' +
        '<p class="reg-fine">No email = No spam.</p>' +
      '</div>' +
      '<div id="reg-done" style="display:none;text-align:center">' +
        '<div class="reg-chk"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<h2 id="reg-hi"></h2>' +
        '<p class="reg-sub" style="margin-top:12px">My name is Nik, I work primarily with builders and have inventory and incentives that can\u2019t always be shared publicly. Please expect a call from me over the next couple of days.</p>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  formView = document.getElementById('reg-form');
  confirmView = document.getElementById('reg-done');
  closeBtn = document.getElementById('reg-x');

  // -- Close (confirmation only) --
  closeBtn.addEventListener('click', function() { hideModal(); });

  function hideModal() {
    overlay.classList.remove('active');
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    // Complete the pending save
    if (pendingBtn) { pendingBtn.click(); pendingBtn = null; }
    // Reset views
    formView.style.display = '';
    confirmView.style.display = 'none';
    closeBtn.style.display = 'none';
  }

  // -- Submit --
  document.getElementById('reg-go').addEventListener('click', function() {
    var name = document.getElementById('reg-name').value.trim();
    var phone = document.getElementById('reg-phone').value.trim();
    if (!name || !phone) return;

    // Mark registered for this session
    sessionStorage.setItem('ca_registered', 'true');

    // Set ca_user so save.js skips its own modal
    localStorage.setItem('ca_user', JSON.stringify({ name: name, phone: phone, date: new Date().toISOString() }));

    // POST to Netlify function
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/.netlify/functions/capture-lead', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ name: name, phone: phone, building: getBuilding() }));
    } catch (e) { /* silent */ }

    // Show confirmation
    formView.style.display = 'none';
    confirmView.style.display = '';
    document.getElementById('reg-hi').textContent = 'You\u2019re all set, ' + name.split(' ')[0] + '.';
    closeBtn.style.display = '';

    autoTimer = setTimeout(function() { hideModal(); }, 8000);
  });

  // -- Intercept heart clicks (capture phase, fires before save.js) --
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.save-btn');
    if (!btn) return;
    if (isRegistered()) return; // already registered, let save.js handle it

    e.stopImmediatePropagation();
    e.preventDefault();

    pendingBtn = btn;

    // Reset and show form
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    formView.style.display = '';
    confirmView.style.display = 'none';
    closeBtn.style.display = 'none';
    overlay.classList.add('active');
    document.getElementById('reg-name').focus();
  }, true);
})();
