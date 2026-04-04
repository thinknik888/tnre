// Protect images from right-click, drag, and long-press save
document.addEventListener('contextmenu', function(e) {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', function(e) {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('touchstart', function() {
  var style = document.getElementById('protect-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'protect-style';
    style.textContent = 'img { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; pointer-events: auto; }';
    document.head.appendChild(style);
  }
}, { once: true });
