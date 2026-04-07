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

  // Add touch-action CSS and larger mobile image
  var style = document.createElement('style');
  style.textContent = '.modal-image img{touch-action:none;transform-origin:0 0;}@media(max-width:768px){.modal-image{min-height:60vh!important;max-height:70vh;}.modal-image img{max-height:65vh;}}';
  document.head.appendChild(style);
})();
