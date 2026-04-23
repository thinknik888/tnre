// Mobile filter dropdowns — converts filter button rows to select dropdowns on screens under 768px.
// On change, triggers the corresponding button's click handler so the page's filter logic runs.
// Buttons are kept in the DOM (hidden via CSS on mobile) so click handlers attached by the page's
// inline script still fire cleanly when the select value changes.
(function() {
  if (window.innerWidth > 768) return;

  function valFor(btn, dataAttrs) {
    for (var i = 0; i < dataAttrs.length; i++) {
      var v = btn.getAttribute(dataAttrs[i]);
      if (v !== null) return v;
    }
    return '';
  }

  function convertFilterRow(filterId, dataAttrs) {
    var container = document.getElementById(filterId);
    if (!container) return;
    var buttons = container.querySelectorAll('.fp-filter-btn');
    if (!buttons.length) return;
    if (container.querySelector('select.fp-filter-select')) return; // idempotent

    var select = document.createElement('select');
    select.className = 'fp-filter-select';
    buttons.forEach(function(btn) {
      var opt = document.createElement('option');
      opt.value = valFor(btn, dataAttrs);
      opt.textContent = btn.textContent.trim();
      if (btn.classList.contains('active')) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', function() {
      var targetVal = select.value;
      buttons.forEach(function(btn) {
        if (valFor(btn, dataAttrs) === targetVal) btn.click();
      });
    });

    // Prepend select to container; keep buttons in DOM so click handlers still work
    container.insertBefore(select, container.firstChild);
  }

  // Keep buttons in DOM but hide on mobile
  var style = document.createElement('style');
  style.textContent =
    '.fp-filter-select{width:100%;padding:10px 14px;background:#f0ede6;border:1px solid #b89a56;border-radius:4px;font-family:"Outfit",sans-serif;font-size:0.82rem;color:#1a1a18;outline:none;appearance:auto;cursor:pointer;}' +
    '.fp-filter-select:focus{border-color:#b89a56;box-shadow:0 0 0 2px rgba(184,154,86,0.15);}' +
    '@media(max-width:768px){' +
    '.fp-filters .fp-filter-btn{display:none!important;}' +
    '.filter-row{flex-direction:column;align-items:stretch;gap:0.4rem;}' +
    '.filter-label{min-width:auto;}' +
    '}' +
    '@media(min-width:769px){.fp-filter-select{display:none;}}';
  document.head.appendChild(style);

  convertFilterRow('closing-filters',    ['data-closing-filter']);
  convertFilterRow('sqft-filters',       ['data-filter', 'data-size']);
  convertFilterRow('building-filters',   ['data-building-filter']);
  convertFilterRow('price-filters',      ['data-price-filter']);
  convertFilterRow('collection-filters', ['data-collection']);
})();
