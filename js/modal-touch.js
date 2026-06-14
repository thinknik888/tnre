// Pinch-to-zoom and drag-to-pan for floor plan modal images on mobile
(function() {
  var img, scale = 1, posX = 0, posY = 0;
  var startDist = 0, startScale = 1;
  var panStartX = 0, panStartY = 0, panPosX = 0, panPosY = 0;
  var isPanning = false, lastTap = 0;

  function getImg() {
    if (!img) img = document.getElementById('modal-img');
    return img;
  }

  function applyTransform() {
    var el = getImg();
    if (el) el.style.transform = 'translate(' + posX + 'px,' + posY + 'px) scale(' + scale + ')';
  }

  function reset() {
    scale = 1; posX = 0; posY = 0;
    var el = getImg();
    if (el) el.style.transform = '';
  }

  // Expose for closeModal / nav
  window.resetModalZoom = reset;

  function getTouchDist(t) {
    var dx = t[0].clientX - t[1].clientX;
    var dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Prevent the BACKGROUND page from scrolling while a modal is open, but never
  // block the modal's own scrollable regions. Touching anywhere inside .modal
  // (image, body, details) must scroll natively; only drags on the inert
  // backdrop outside .modal are suppressed. The image's pinch/pan gestures are
  // handled (and preventDefault'd) by the dedicated listeners below.
  document.addEventListener('touchmove', function(e) {
    var overlay = e.target.closest('.modal-overlay');
    if (!overlay || !overlay.classList.contains('active')) return;
    if (e.target.closest('.modal')) return; // inside the modal → allow native scroll
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchstart', function(e) {
    var el = getImg();
    if (!el || !el.closest('.modal-image')) return;
    if (!e.target.closest('.modal-image')) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      startDist = getTouchDist(e.touches);
      startScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      isPanning = true;
      panStartX = e.touches[0].clientX;
      panStartY = e.touches[0].clientY;
      panPosX = posX;
      panPosY = posY;
    }
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    var el = getImg();
    if (!el || !e.target.closest('.modal-image')) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      var dist = getTouchDist(e.touches);
      scale = Math.min(Math.max(startScale * (dist / startDist), 1), 5);
      if (scale === 1) { posX = 0; posY = 0; }
      applyTransform();
    } else if (e.touches.length === 1 && isPanning && scale > 1) {
      e.preventDefault();
      posX = panPosX + (e.touches[0].clientX - panStartX);
      posY = panPosY + (e.touches[0].clientY - panStartY);
      applyTransform();
    }
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    if (!e.target.closest('.modal-image') && !e.target.closest('.modal')) return;
    if (e.touches.length < 2) startDist = 0;
    if (e.touches.length === 0) isPanning = false;
    if (scale <= 1) reset();

    // Double-tap to toggle zoom
    if (e.touches.length === 0 && e.target.closest('.modal-image')) {
      var now = Date.now();
      if (now - lastTap < 300) {
        if (scale > 1) reset(); else { scale = 2.5; applyTransform(); }
      }
      lastTap = now;
    }
  });

  // Add touch-action CSS, mobile card image sizing, and modal touch isolation
  var style = document.createElement('style');
  style.textContent = ''
    // Keep the backdrop fixed, but DON'T disable touch-action on the whole overlay —
    // that was killing scroll inside the modal on every page. Only the image area
    // opts out of native gestures (custom pinch/pan); the scroll containers pan-y.
    + '.modal-overlay.active{overflow:hidden;}'
    + '.modal,.modal-body,.modal-details{touch-action:pan-y;}'
    + '.modal-image{touch-action:none;}'
    + '.modal-image img{touch-action:none;transform-origin:center center;}'
    // Architecture A (fixed-height modal, overflow:hidden): the details column must
    // be a real scroll container — needs min-height:0 so it can shrink and scroll.
    // Architecture B (modal itself scrolls): these are harmless (no bounded height).
    + '.modal-body{min-height:0;}'
    + '.modal-details{overflow-y:auto;min-height:0;-webkit-overflow-scrolling:touch;}'
    // Visible scroll affordance — navy (#002244) from the existing palette, no new colors.
    + '.modal,.modal-details{scrollbar-width:thin;scrollbar-color:rgba(0,34,68,0.35) transparent;}'
    + '.modal::-webkit-scrollbar,.modal-details::-webkit-scrollbar{width:9px;height:9px;}'
    + '.modal::-webkit-scrollbar-track,.modal-details::-webkit-scrollbar-track{background:transparent;}'
    + '.modal::-webkit-scrollbar-thumb,.modal-details::-webkit-scrollbar-thumb{background:rgba(0,34,68,0.35);border-radius:5px;}'
    + '.modal::-webkit-scrollbar-thumb:hover,.modal-details::-webkit-scrollbar-thumb:hover{background:rgba(0,34,68,0.6);}'
    + '@media(max-width:768px){.fp-image{min-height:auto!important;padding:0.5rem!important;}.fp-image img{width:100%!important;height:auto!important;min-height:60vw;object-fit:contain;}.fp-row-image{padding:0.5rem!important;}.fp-row-image img{width:100%!important;height:auto!important;}.modal-image{min-height:60vh!important;max-height:70vh;}.modal-image img{max-height:65vh;}}';
  document.head.appendChild(style);
})();
