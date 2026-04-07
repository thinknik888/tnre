// Deep link floor plan modals via ?plan= URL parameter
(function() {
  // Wrap openModal to update URL
  if (typeof window.openModal === 'function') {
    var origOpen = window.openModal;
    window.openModal = function(id) {
      origOpen(id);
      var url = new URL(window.location);
      url.searchParams.set('plan', id);
      history.replaceState(null, '', url);
    };
  }

  // Wrap closeModal to remove URL parameter
  if (typeof window.closeModal === 'function') {
    var origClose = window.closeModal;
    window.closeModal = function() {
      origClose();
      var url = new URL(window.location);
      url.searchParams.delete('plan');
      history.replaceState(null, '', url);
    };
  }

  // On page load, open modal if ?plan= exists
  var params = new URLSearchParams(window.location.search);
  var planId = params.get('plan');
  if (planId && typeof window.openModal === 'function') {
    // Small delay to ensure plans data is loaded
    setTimeout(function() { window.openModal(planId); }, 300);
  }
})();
