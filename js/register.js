// Lead capture gate for floor plan saves — overrides save.js modal
(function() {
  function isRegistered() {
    return sessionStorage.getItem('ca_registered') === '1';
  }

  function getBuilding() {
    var title = document.title || '';
    // Strip trailing " — CondosAround" or similar suffixes
    return title.split('—')[0].split('|')[0].trim() || 'Unknown';
  }

  // Inject styles
  var style = document.createElement('style');
  style.textContent = '\
    .reg-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10002;align-items:center;justify-content:center;}\
    .reg-overlay.active{display:flex;}\
    .reg-card{background:#f0ede6;border-radius:12px;padding:40px;max-width:400px;width:90%;position:relative;font-family:"Outfit",sans-serif;}\
    .reg-card h2{font-family:"Cormorant Garamond",serif;font-size:28px;color:#1a1a18;margin:0 0 8px;font-weight:600;}\
    .reg-card .reg-sub{font-size:14px;color:#6b6357;margin:0 0 24px;line-height:1.5;}\
    .reg-card input{display:block;width:100%;padding:14px 16px;margin-bottom:12px;border:1px solid #d4cec4;border-radius:8px;font-family:"Outfit",sans-serif;font-size:15px;color:#1a1a18;background:#fff;outline:none;box-sizing:border-box;}\
    .reg-card input:focus{border-color:#b89a56;}\
    .reg-card input::placeholder{color:#a09a90;}\
    .reg-btn{width:100%;padding:16px;background:#b89a56;color:#fff;border:none;border-radius:8px;font-family:"Outfit",sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s;letter-spacing:0.02em;}\
    .reg-btn:hover{background:#a08545;}\
    .reg-fine{font-size:12px;color:#a09a90;text-align:center;margin-top:14px;}\
    .reg-close{position:absolute;top:14px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#a09a90;line-height:1;padding:4px;display:none;}\
    .reg-close:hover{color:#1a1a18;}\
    .reg-check{width:56px;height:56px;border-radius:50%;background:#b89a56;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}\
    .reg-check svg{width:28px;height:28px;stroke:#fff;stroke-width:3;fill:none;}\
  ';
  document.head.appendChild(style);

  // Build modal
  var overlay = document.createElement('div');
  overlay.className = 'reg-overlay';
  overlay.innerHTML = '\
    <div class="reg-card">\
      <button class="reg-close" id="reg-close">&times;</button>\
      <div id="reg-form-view">\
        <h2>Save Floor Plans</h2>\
        <p class="reg-sub">Enter your details to save floor plans and get updates.</p>\
        <input id="reg-name" type="text" placeholder="Full Name" />\
        <input id="reg-phone" type="tel" placeholder="Phone Number" />\
        <button class="reg-btn" id="reg-submit">Save &amp; Continue &rarr;</button>\
        <p class="reg-fine">No spam. Nik will reach out personally.</p>\
      </div>\
      <div id="reg-confirm-view" style="display:none;text-align:center;">\
        <div class="reg-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>\
        <h2 id="reg-confirm-title"></h2>\
        <p class="reg-sub" style="margin-top:12px;">My name is Nik, I work primarily with builders and have inventory and incentives that can\u2019t always be shared publicly. Please expect a call from me over the next couple of days.</p>\
      </div>\
    </div>';
  document.body.appendChild(overlay);

  var pendingSaveBtn = null;
  var pendingPlanId = null;
  var autoCloseTimer = null;

  document.getElementById('reg-close').addEventListener('click', function() {
    closeModal();
  });

  document.getElementById('reg-submit').addEventListener('click', function() {
    var name = document.getElementById('reg-name').value.trim();
    var phone = document.getElementById('reg-phone').value.trim();
    if (!name || !phone) return;

    // Mark registered
    sessionStorage.setItem('ca_registered', '1');

    // Also set ca_user in localStorage so save.js won't show its own modal
    var userData = { name: name, phone: phone, date: new Date().toISOString() };
    localStorage.setItem('ca_user', JSON.stringify(userData));

    // Send to Follow Up Boss
    sendToFUB(name, phone);

    // Show confirmation
    document.getElementById('reg-form-view').style.display = 'none';
    document.getElementById('reg-confirm-view').style.display = 'block';
    document.getElementById('reg-confirm-title').textContent = "You\u2019re all set, " + name.split(' ')[0] + ".";
    document.getElementById('reg-close').style.display = 'block';

    // Auto-close after 8 seconds
    autoCloseTimer = setTimeout(function() { closeModal(); }, 8000);
  });

  function closeModal() {
    overlay.classList.remove('active');
    if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }

    // Complete the pending save
    if (pendingSaveBtn && pendingPlanId) {
      completeSave(pendingPlanId, pendingSaveBtn);
    }
    pendingSaveBtn = null;
    pendingPlanId = null;

    // Reset form for potential future use
    document.getElementById('reg-form-view').style.display = 'block';
    document.getElementById('reg-confirm-view').style.display = 'none';
    document.getElementById('reg-close').style.display = 'none';
  }

  function completeSave(planId, btn) {
    // Trigger a click on the save button — save.js will handle it now that ca_user is set
    btn.click();
  }

  function sendToFUB(name, phone) {
    var apiKey = localStorage.getItem('ca_fub_token');
    if (!apiKey) return;

    var building = getBuilding();
    var parts = name.split(' ');
    var firstName = parts[0] || '';
    var lastName = parts.slice(1).join(' ') || '';

    var payload = {
      firstName: firstName,
      lastName: lastName,
      phones: [{ value: phone }],
      source: 'condosaround.com',
      tags: ['condosaround', 'condosaround - ' + building],
      assignedTo: null
    };

    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.followupboss.com/v1/people', true);
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(apiKey + ':'));
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send(JSON.stringify(payload));

      // After person is created, add a note
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var person = JSON.parse(xhr.responseText);
            var personId = person.id || (person.response && person.response.id);
            if (personId) {
              var noteXhr = new XMLHttpRequest();
              noteXhr.open('POST', 'https://api.followupboss.com/v1/notes', true);
              noteXhr.setRequestHeader('Authorization', 'Basic ' + btoa(apiKey + ':'));
              noteXhr.setRequestHeader('Content-Type', 'application/json');
              noteXhr.send(JSON.stringify({
                personId: personId,
                body: 'Saved a floor plan on condosaround.com \u2014 ' + building
              }));
            }
          } catch(e) {}
        }
      };
    } catch(e) {}
  }

  // Intercept save button clicks before save.js handles them
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.save-btn');
    if (!btn) return;

    // If already registered this session, let save.js handle it
    if (isRegistered()) return;

    // Not registered — stop save.js from handling, show our modal
    e.stopImmediatePropagation();
    e.preventDefault();

    // Find the plan ID from the parent card
    var card = btn.closest('.fp-card') || btn.closest('.fp-row');
    if (!card) return;
    var onclick = card.getAttribute('onclick');
    if (!onclick) return;
    var m = onclick.match(/openModal\('([^']+)'\)/);
    if (!m) return;

    pendingPlanId = m[1];
    pendingSaveBtn = btn;

    // Reset and show form
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    document.getElementById('reg-form-view').style.display = 'block';
    document.getElementById('reg-confirm-view').style.display = 'none';
    document.getElementById('reg-close').style.display = 'none';
    overlay.classList.add('active');
    document.getElementById('reg-name').focus();
  }, true); // useCapture = true to fire before save.js handler
})();
