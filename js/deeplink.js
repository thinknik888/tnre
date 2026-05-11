// Deep link floor plan modals via ?plan= and filter persistence via ?filter=
// - ?plan=<id>: opens the floor plan modal on load
// - ?filter=<slug>: applies the matching filter on load
// - Combined ?filter=X&plan=Y: applies filter, then opens plan
// Uses history.replaceState so URL stays shareable without polluting history.
(function() {
  var origOpen, origClose, origPlanOpen, origPlanClose, origFilterPlans;
  var isDeeplinkAction = false;

  function getCleanUrl() {
    var url = new URL(window.location);
    url.searchParams.delete('plan');
    var qs = url.searchParams.toString();
    return url.pathname + (qs ? '?' + qs : '');
  }

  function setPlanUrl(id) {
    var url = new URL(window.location);
    url.searchParams.set('plan', id);
    return url.pathname + '?' + url.searchParams.toString();
  }

  function updateFilterUrl(slug) {
    var url = new URL(window.location);
    if (slug && slug !== 'all') url.searchParams.set('filter', slug);
    else url.searchParams.delete('filter');
    var qs = url.searchParams.toString();
    history.replaceState(history.state, '', url.pathname + (qs ? '?' + qs : ''));
  }

  function btnSlug(btn) {
    return btn.dataset.filter || btn.dataset.collectionFilter || null;
  }

  // --- Standard openModal(id) pattern ---
  if (typeof window.openModal === 'function') {
    origOpen = window.openModal;
    window.openModal = function(id) {
      origOpen(id);
      if (!isDeeplinkAction) {
        history.replaceState({ plan: id }, '', setPlanUrl(typeof id === 'string' ? id : ''));
      }
    };
  }

  if (typeof window.closeModal === 'function') {
    origClose = window.closeModal;
    window.closeModal = function() {
      origClose();
      if (!isDeeplinkAction) {
        history.replaceState(null, '', getCleanUrl());
      }
    };
  }

  // --- king-toronto-penthouse: openPlanModal(index) pattern ---
  if (typeof window.openPlanModal === 'function') {
    origPlanOpen = window.openPlanModal;
    window.openPlanModal = function(i) {
      origPlanOpen(i);
      if (!isDeeplinkAction) {
        history.replaceState({ plan: String(i) }, '', setPlanUrl(i));
      }
    };
  }

  if (typeof window.closePlanModal === 'function') {
    origPlanClose = window.closePlanModal;
    window.closePlanModal = function() {
      origPlanClose();
      if (!isDeeplinkAction) {
        history.replaceState(null, '', getCleanUrl());
      }
    };
  }

  // --- Filter persistence: data-filter, data-collection-filter ---
  // Skip pages that already manage their own multi-param URL scheme (e.g. ?size=&price=).
  var hasOwnFilterUrl = !!document.querySelector('[data-price-filter], [data-closing-filter], [data-building-filter]');
  var filterSel = '.fp-filter-btn[data-filter], .fp-filter-btn[data-collection-filter], ' +
                  '.filter-btn[data-filter], .filter-btn[data-collection-filter]';
  if (!hasOwnFilterUrl) {
    document.querySelectorAll(filterSel).forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (isDeeplinkAction) return;
        var slug = btnSlug(btn);
        if (slug) updateFilterUrl(slug);
      });
    });
  }

  // Wrap south-forest-hill's filterPlans(col) inline pattern
  if (typeof window.filterPlans === 'function') {
    origFilterPlans = window.filterPlans;
    window.filterPlans = function(col) {
      origFilterPlans.apply(this, arguments);
      if (!isDeeplinkAction) updateFilterUrl(col);
    };
  }

  // --- On load, apply ?filter= ---
  var params = new URLSearchParams(window.location.search);
  var filterParam = params.get('filter');
  var planParam = params.get('plan');

  if (filterParam && !hasOwnFilterUrl) {
    isDeeplinkAction = true;
    var btn = document.querySelector(
      '.fp-filter-btn[data-filter="' + filterParam + '"], ' +
      '.fp-filter-btn[data-collection-filter="' + filterParam + '"], ' +
      '.filter-btn[data-filter="' + filterParam + '"], ' +
      '.filter-btn[data-collection-filter="' + filterParam + '"]'
    );
    if (btn) {
      btn.click();
    } else if (typeof origFilterPlans === 'function') {
      // SFH-style: find inline-onclick button matching the slug
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        var oc = b.getAttribute('onclick') || '';
        if (oc.indexOf("filterPlans('" + filterParam + "')") >= 0) b.click();
      });
    }
    isDeeplinkAction = false;
  }

  // --- Handle browser back/forward ---
  window.addEventListener('popstate', function() {
    var p = new URLSearchParams(window.location.search);
    var plan = p.get('plan');
    isDeeplinkAction = true;
    if (plan) {
      if (origPlanOpen && !origOpen) {
        origPlanOpen(parseInt(plan));
      } else if (origOpen) {
        origOpen(plan);
      }
    } else {
      if (origPlanClose) origPlanClose();
      if (origClose) origClose();
    }
    isDeeplinkAction = false;
  });

  // --- On load, open ?plan= (deferred so the page settles first) ---
  if (planParam) {
    setTimeout(function() {
      isDeeplinkAction = true;
      if (typeof window.openPlanModal === 'function' && !origOpen) {
        (origPlanOpen || window.openPlanModal)(parseInt(planParam));
      } else if (typeof window.openModal === 'function') {
        (origOpen || window.openModal)(planParam);
      }
      history.replaceState({ plan: planParam }, '', window.location.href);
      isDeeplinkAction = false;
    }, 800);
  }

  // --- Wrap modalNav to update URL on arrow navigation ---
  if (typeof window.modalNav === 'function') {
    var origNav = window.modalNav;
    window.modalNav = function(dir) {
      origNav(dir);
      var modal = document.getElementById('modal');
      if (modal && modal.classList.contains('active')) {
        if (typeof window.planKeys !== 'undefined' && typeof window.currentPlanIdx !== 'undefined') {
          var id = window.planKeys[window.currentPlanIdx];
          if (id) history.replaceState({ plan: id }, '', setPlanUrl(id));
        }
      }
    };
  }
})();
