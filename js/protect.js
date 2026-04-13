// CondosAround.com — Content Protection
(function() {

  // 1. Disable right-click except on modal/floor plan elements
  document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('#modal') || e.target.closest('.modal-overlay') ||
        e.target.classList.contains('modal-img') || e.target.id === 'modal-img') return;
    e.preventDefault();
  });

  // 2. Block dev tools shortcuts
  document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return; }
    // Ctrl+U (view source)
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return; }
    // Ctrl+S (save)
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); return; }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (dev tools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault(); return;
    }
  });

  // 3. Disable text selection on non-input elements
  var protectCSS = document.createElement('style');
  protectCSS.textContent = 'body{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}input,textarea,select,.sofia-input{-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text;}';
  document.head.appendChild(protectCSS);

  // 4. Disable image drag except modal floor plan images
  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
      if (e.target.id === 'modal-img' || e.target.closest('.modal-image')) return;
      e.preventDefault();
    }
  });

  // 5. Disable long-press save on mobile images
  document.addEventListener('touchstart', function() {
    var style = document.getElementById('protect-touch');
    if (!style) {
      style = document.createElement('style');
      style.id = 'protect-touch';
      style.textContent = 'img{-webkit-touch-callout:none;}';
      document.head.appendChild(style);
    }
  }, { once: true });

  // 6. Console warning
  console.log('%c© CondosAround.com — All rights reserved. Unauthorized copying prohibited.', 'color:#002244; font-size:14px; font-weight:bold;');

  // 7. Hidden HTML comment
  var comment = document.createComment(' © CondosAround.com - Proprietary ');
  document.body.appendChild(comment);

})();
