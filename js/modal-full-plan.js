// Shared: injects "Full plan ↗" navy pill into detail modal.
// Target: opens current #modal-img src in a new tab. Pairs with View Building Page → when present.
(function () {
  function init() {
    var modal = document.getElementById('modal');
    var img = document.getElementById('modal-img');
    if (!modal || !img) return;
    var cta = modal.querySelector('.modal-cta');
    if (!cta) return;

    if (document.getElementById('modal-full-plan-row')) return;

    var row = document.createElement('div');
    row.id = 'modal-full-plan-row';
    row.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-bottom:1rem;flex-wrap:wrap;';

    var btn = document.createElement('a');
    btn.id = 'modal-full-plan';
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.textContent = 'Full plan ↗';
    btn.style.cssText = 'display:inline-block;background:rgba(0,34,68,0.85);color:#fff;font-size:11px;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-family:inherit;letter-spacing:.02em;text-decoration:none;line-height:1.4;';
    row.appendChild(btn);

    // If a dynamic View Building link slot exists, pull it into the same row and normalize to pill.
    var buildingSlot = document.getElementById('m-building-link-wrap') || document.getElementById('m-building-link');
    if (buildingSlot && cta.contains(buildingSlot)) {
      row.appendChild(buildingSlot);
      buildingSlot.style.cssText = 'display:inline-flex;';
    }

    cta.insertBefore(row, cta.firstChild);

    // Post-process: if the JS later injects a .btn-full-building / .btn-full anchor into the slot, style it inline pill.
    function normalizeSlotChild() {
      if (!buildingSlot) return;
      var a = buildingSlot.querySelector('a');
      if (a) {
        a.style.cssText = 'display:inline-block;background:#002244;color:#fff;font-size:11px;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-family:inherit;letter-spacing:.02em;text-decoration:none;line-height:1.4;margin:0;';
      }
    }
    if (buildingSlot) {
      new MutationObserver(normalizeSlotChild).observe(buildingSlot, { childList: true, subtree: true });
      normalizeSlotChild();
    }

    function sync() { btn.href = img.getAttribute('src') || '#'; }
    sync();
    new MutationObserver(sync).observe(img, { attributes: true, attributeFilter: ['src'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
