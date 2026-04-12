// Deep link floor plan modals via #hash
(function() {
  // Wrap openModal to update URL hash
  if (typeof window.openModal === 'function') {
    var origOpen = window.openModal;
    window.openModal = function(id) {
      origOpen(id);
      history.replaceState(null, '', '#' + id);
    };
  }

  // Wrap closeModal to clear hash
  if (typeof window.closeModal === 'function') {
    var origClose = window.closeModal;
    window.closeModal = function() {
      origClose();
      history.replaceState(null, '', window.location.pathname + window.location.search);
    };
  }

  // On page load, open modal if #hash exists
  var hash = window.location.hash.replace('#', '');
  if (hash && typeof window.openModal === 'function') {
    setTimeout(function() { window.openModal(hash); }, 800);
  }
})();
