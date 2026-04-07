// Mobile filter dropdowns — converts filter button rows to select dropdowns on screens under 768px
(function() {
  if (window.innerWidth > 768) return;

  function convertFilterRow(filterId, dataAttr) {
    var container = document.getElementById(filterId);
    if (!container) return;
    var buttons = container.querySelectorAll('.fp-filter-btn');
    if (!buttons.length) return;

    var select = document.createElement('select');
    select.className = 'fp-filter-select';
    buttons.forEach(function(btn) {
      var opt = document.createElement('option');
      opt.value = btn.getAttribute(dataAttr) || btn.dataset.filter || '';
      opt.textContent = btn.textContent.trim();
      if (btn.classList.contains('active')) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', function() {
      // Find matching button and click it
      buttons.forEach(function(btn) {
        var val = btn.getAttribute(dataAttr) || btn.dataset.filter || '';
        if (val === select.value) btn.click();
      });
    });

    container.innerHTML = '';
    container.appendChild(select);
  }

  // Add styles
  var style = document.createElement('style');
  style.textContent = '.fp-filter-select{width:100%;padding:10px 14px;background:#f0ede6;border:1px solid #b89a56;border-radius:4px;font-family:"Outfit",sans-serif;font-size:0.82rem;color:#1a1a18;outline:none;appearance:auto;cursor:pointer;}.fp-filter-select:focus{border-color:#b89a56;box-shadow:0 0 0 2px rgba(184,154,86,0.15);}@media(min-width:769px){.fp-filter-select{display:none;}}@media(max-width:768px){.filter-row{flex-direction:column;align-items:stretch;gap:0.4rem;}.filter-label{min-width:auto;}}';
  document.head.appendChild(style);

  convertFilterRow('closing-filters', 'data-closing-filter');
  convertFilterRow('sqft-filters', 'data-filter');
  convertFilterRow('building-filters', 'data-building-filter');
  // Forest Hill collection filters
  convertFilterRow('collection-filters', 'data-collection');
})();
