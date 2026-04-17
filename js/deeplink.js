// Deep link floor plan modals via ?plan= query parameter
// Supports: openModal(id), openPlanModal(index), and back/forward navigation
(function() {
  var origOpen, origClose, origPlanOpen, origPlanClose;
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

  // --- Standard openModal(id) pattern ---
  if (typeof window.openModal === 'function') {
    origOpen = window.openModal;
    window.openModal = function(id) {
      origOpen(id);
      if (!isDeeplinkAction) {
        history.pushState({ plan: id }, '', setPlanUrl(typeof id === 'string' ? id : ''));
      }
    };
  }

  if (typeof window.closeModal === 'function') {
    origClose = window.closeModal;
    window.closeModal = function() {
      origClose();
      if (!isDeeplinkAction) {
        history.pushState(null, '', getCleanUrl());
      }
    };
  }

  // --- king-toronto-penthouse: openPlanModal(index) pattern ---
  if (typeof window.openPlanModal === 'function') {
    origPlanOpen = window.openPlanModal;
    window.openPlanModal = function(i) {
      origPlanOpen(i);
      if (!isDeeplinkAction) {
        history.pushState({ plan: String(i) }, '', setPlanUrl(i));
      }
    };
  }

  if (typeof window.closePlanModal === 'function') {
    origPlanClose = window.closePlanModal;
    window.closePlanModal = function() {
      origPlanClose();
      if (!isDeeplinkAction) {
        history.pushState(null, '', getCleanUrl());
      }
    };
  }

  // --- Handle browser back/forward ---
  window.addEventListener('popstate', function() {
    var params = new URLSearchParams(window.location.search);
    var plan = params.get('plan');
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

  // --- On page load, open if ?plan= present ---
  var params = new URLSearchParams(window.location.search);
  var plan = params.get('plan');
  if (plan) {
    setTimeout(function() {
      isDeeplinkAction = true;
      if (typeof window.openPlanModal === 'function' && !origOpen) {
        (origPlanOpen || window.openPlanModal)(parseInt(plan));
      } else if (typeof window.openModal === 'function') {
        (origOpen || window.openModal)(plan);
      }
      // Replace current history entry so the initial load doesn't double-stack
      history.replaceState({ plan: plan }, '', window.location.href);
      isDeeplinkAction = false;
    }, 800);
  }

  // --- Wrap modalNav to update URL on arrow navigation ---
  if (typeof window.modalNav === 'function') {
    var origNav = window.modalNav;
    window.modalNav = function(dir) {
      origNav(dir);
      // After nav, find the current plan ID from the modal
      var modal = document.getElementById('modal');
      if (modal && modal.classList.contains('active')) {
        // Try to get current plan key from planKeys array if it exists
        if (typeof window.planKeys !== 'undefined' && typeof window.currentPlanIdx !== 'undefined') {
          var id = window.planKeys[window.currentPlanIdx];
          if (id) history.replaceState({ plan: id }, '', setPlanUrl(id));
        }
      }
    };
  }
})();
