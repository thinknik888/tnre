// Floor Plan Save System
(function() {
  // Clean up old keys
  localStorage.removeItem('savedPlans');
  localStorage.removeItem('ca-saved');
  localStorage.removeItem('ca_saved_plans');

  var saved = JSON.parse(localStorage.getItem('ca-saved-plans') || '[]');
  var user = JSON.parse(localStorage.getItem('ca_user') || 'null');

  // Ensure saved is an array
  if (!Array.isArray(saved)) saved = [];

  function isSaved(planId) {
    return saved.some(function(p) { return p.id === planId; });
  }

  var style = document.createElement('style');
  style.textContent = '\
    .save-btn{position:absolute;top:0.75rem;right:0.75rem;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:5;transition:all 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.1);}\
    .save-btn:hover{transform:scale(1.1);}\
    .save-btn svg{width:18px;height:18px;stroke:#8a8a84;stroke-width:2;fill:none;transition:all 0.2s;}\
    .save-btn.saved svg{fill:#b89a56;stroke:#b89a56;}\
    .save-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;align-items:center;justify-content:center;}\
    .save-modal-overlay.active{display:flex;}\
    .save-modal{background:#fff;border-radius:8px;padding:2rem;max-width:380px;width:90%;text-align:center;font-family:"Outfit",sans-serif;position:relative;}\
    .save-modal h3{font-family:"Cormorant Garamond",serif;font-size:1.4rem;color:#1a1a18;margin-bottom:0.5rem;}\
    .save-modal p{font-size:0.82rem;color:#6b6357;margin-bottom:1.5rem;line-height:1.5;}\
    .save-modal input{display:block;width:100%;padding:0.75rem 1rem;margin-bottom:0.75rem;border:1px solid #d4cec4;border-radius:4px;font-family:"Outfit",sans-serif;font-size:0.85rem;outline:none;}\
    .save-modal input:focus{border-color:#b89a56;}\
    .save-modal-submit{width:100%;padding:0.85rem;background:#b89a56;color:#fff;border:none;border-radius:4px;font-family:"Outfit",sans-serif;font-size:0.82rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:background 0.2s;}\
    .save-modal-submit:hover{background:#a08545;}\
    .save-modal-close{position:absolute;top:0.75rem;right:0.75rem;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#8a8a84;line-height:1;padding:0.25rem;}\
    .save-modal-close:hover{color:#1a1a18;}\
    .save-toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1a1a18;color:#f0ede6;padding:0.65rem 1.5rem;border-radius:4px;font-family:"Outfit",sans-serif;font-size:0.78rem;z-index:10001;opacity:0;transition:opacity 0.3s;pointer-events:none;}\
    .save-toast.show{opacity:1;}\
    .nav-saved{position:relative;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;color:#8a8a84;text-decoration:none;transition:color 0.2s;}\
    .nav-saved:hover{color:#b89a56;}\
    .nav-saved-badge{position:absolute;top:-6px;right:-10px;background:#b89a56;color:#fff;font-size:0.55rem;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;}\
  ';
  document.head.appendChild(style);

  var heartSvg = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  function getPlanData(planId) {
    var data = { id: planId, image: '', building: '', neighbourhood: '', type: '', sqft: '', price: '', savedAt: Date.now() };

    // Read from page's plans JS object (primary source)
    if (typeof plans !== 'undefined' && plans[planId]) {
      var p = plans[planId];
      data.image = p.img || '';
      data.building = p.building || '';
      data.type = p.type || '';
      data.sqft = p.size || p.indoor || '';
      data.price = p.price || p.promo || '';
    }

    // Get neighbourhood from page eyebrow
    var eyebrow = document.querySelector('.page-eyebrow');
    if (eyebrow) data.neighbourhood = eyebrow.textContent.trim();

    return data;
  }

  function savePlan(planId, btn) {
    var data = getPlanData(planId);
    saved.push(data);
    localStorage.setItem('ca-saved-plans', JSON.stringify(saved));
    btn.classList.add('saved');
    showToast('Saved to your list');
    updateBadge();
  }

  function unsavePlan(planId, btn) {
    saved = saved.filter(function(p) { return p.id !== planId; });
    localStorage.setItem('ca-saved-plans', JSON.stringify(saved));
    btn.classList.remove('saved');
    showToast('Removed from your list');
    updateBadge();
  }

  function addSaveButtons() {
    document.querySelectorAll('.fp-card').forEach(function(card) {
      var onclick = card.getAttribute('onclick');
      if (!onclick) return;
      var m = onclick.match(/openModal\('([^']+)'\)/);
      if (!m) return;
      var imgDiv = card.querySelector('.fp-image');
      if (!imgDiv || imgDiv.querySelector('.save-btn')) return;
      imgDiv.style.position = 'relative';
      addBtn(imgDiv, m[1]);
    });
    document.querySelectorAll('.fp-row').forEach(function(row) {
      var onclick = row.getAttribute('onclick');
      if (!onclick) return;
      var m = onclick.match(/openModal\('([^']+)'\)/);
      if (!m) return;
      var imgDiv = row.querySelector('.fp-row-image');
      if (!imgDiv || imgDiv.querySelector('.save-btn')) return;
      imgDiv.style.position = 'relative';
      addBtn(imgDiv, m[1]);
    });
  }

  function addBtn(container, planId) {
    var btn = document.createElement('button');
    btn.className = 'save-btn' + (isSaved(planId) ? ' saved' : '');
    btn.innerHTML = heartSvg;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!user) {
        showLoginModal(planId, btn);
      } else {
        if (isSaved(planId)) {
          unsavePlan(planId, btn);
        } else {
          savePlan(planId, btn);
        }
      }
    });
    container.appendChild(btn);
  }

  var modalEl = null;
  var pendingPlanId = null;
  var pendingBtn = null;

  function showLoginModal(planId, btn) {
    pendingPlanId = planId;
    pendingBtn = btn;

    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.className = 'save-modal-overlay';
      modalEl.innerHTML = '<div class="save-modal">\
        <button class="save-modal-close" id="save-close">&times;</button>\
        <h3>Save Floor Plans</h3>\
        <p>Just your name and number to keep your list ready.</p>\
        <input id="save-name" type="text" placeholder="Your name" />\
        <input id="save-phone" type="tel" placeholder="Phone number" />\
        <button class="save-modal-submit" id="save-submit">Save My Plans</button>\
      </div>';
      document.body.appendChild(modalEl);
      document.getElementById('save-close').addEventListener('click', function() {
        modalEl.classList.remove('active');
        pendingPlanId = null; pendingBtn = null;
      });
    }
    modalEl.classList.add('active');
    document.getElementById('save-name').value = '';
    document.getElementById('save-phone').value = '';
    document.getElementById('save-name').focus();

    document.getElementById('save-submit').onclick = function() {
      var name = document.getElementById('save-name').value.trim();
      var phone = document.getElementById('save-phone').value.trim();
      if (!name || !phone) return;
      user = { name: name, phone: phone, date: new Date().toISOString() };
      localStorage.setItem('ca_user', JSON.stringify(user));
      modalEl.classList.remove('active');
      if (pendingPlanId && pendingBtn) {
        savePlan(pendingPlanId, pendingBtn);
      }
      pendingPlanId = null; pendingBtn = null;
    };
  }

  var toastEl = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'save-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function() { toastEl.classList.remove('show'); }, 2000);
  }

  function addNavLink() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var cta = nav.querySelector('.nav-cta');
    if (!cta) return;
    var link = document.createElement('a');
    link.className = 'nav-saved';
    link.id = 'nav-saved-link';
    var depth = window.location.pathname.split('/').filter(function(s) { return s.length > 0; }).length;
    var prefix = depth > 1 ? '../' : '';
    link.href = prefix + 'pages/saved.html';
    link.innerHTML = '&#x2661; Saved';
    if (saved.length > 0) {
      link.innerHTML += '<span class="nav-saved-badge">' + saved.length + '</span>';
    }
    cta.parentNode.insertBefore(link, cta);
  }

  function updateBadge() {
    var link = document.getElementById('nav-saved-link');
    if (!link) return;
    var badge = link.querySelector('.nav-saved-badge');
    if (saved.length > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-saved-badge';
        link.appendChild(badge);
      }
      badge.textContent = saved.length;
    } else if (badge) {
      badge.remove();
    }
  }

  addNavLink();
  addSaveButtons();
})();
