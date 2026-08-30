
<script>
/* Sub-nav behaves as in-page tabs: Townhomes and Condo Apartments are two
   views of the same page. Compare and Exhale Plans scroll within the townhome
   view. Also publishes the measured nav height so the sub-nav sticks flush. */
(function () {
  var nav = document.querySelector('nav');
  if (nav) {
    var applyNavH = function () {
      document.documentElement.style.setProperty(
        '--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
    };
    applyNavH();
    addEventListener('resize', applyNavH, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(applyNavH);
  }

  var bar = document.getElementById('sec-nav');
  if (!bar) return;
  var links = [].slice.call(bar.querySelectorAll('a'));
  var panels = {};
  links.forEach(function (a) {
    panels[a.dataset.panel] = document.getElementById(a.dataset.panel);
  });

  function headerOffset() {
    return (nav ? nav.getBoundingClientRect().height : 0)
      + bar.getBoundingClientRect().height + 8;
  }

  function show(panelId, targetId, doScroll) {
    Object.keys(panels).forEach(function (id) {
      if (panels[id]) panels[id].hidden = (id !== panelId);
    });
    links.forEach(function (a) {
      var on = a.dataset.panel === panelId && a.dataset.target === targetId;
      a.classList.toggle('on', on);
      a.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (doScroll) {
      /* Switching the top-level view returns you to the top of the page, the
         way changing pages would. Sub-anchors scroll to their section.
         Either way, measure only after layout settles: hiding a panel changes
         the document height, and measuring too early overshoots badly. */
      var topLevel = (targetId === 'townhomes' || targetId === 'condos');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var y = 0;
          if (!topLevel) {
            var el = document.getElementById(targetId);
            if (el) y = el.getBoundingClientRect().top + window.scrollY - headerOffset();
          }
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        });
      });
    }
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(a.dataset.panel, a.dataset.target, true);
      history.replaceState(null, '', '#' + a.dataset.target);
    });
  });

  var hash = (location.hash || '').replace('#', '');
  var match = links.filter(function (a) { return a.dataset.target === hash; })[0];
  if (match) show(match.dataset.panel, match.dataset.target, true);
  else show('panel-townhomes', 'townhomes', false);

  window.addEventListener('scroll', function () {
    if (panels['panel-condos'] && !panels['panel-condos'].hidden) return;
    var inView = links.filter(function (a) { return a.dataset.panel === 'panel-townhomes'; });
    var y = window.scrollY + headerOffset() + 20, active = inView[0];
    inView.forEach(function (a) {
      var el = document.getElementById(a.dataset.target);
      if (el && el.offsetTop <= y) active = a;
    });
    links.forEach(function (a) { a.classList.toggle('on', a === active); });
  }, { passive: true });

  /* A ?plan= deep link must reveal whichever tab holds that card. */
  window.addEventListener('load', function () {
    var plan = new URLSearchParams(location.search).get('plan');
    if (!plan) return;
    var card = document.querySelector('[onclick*="openModal(\'' + plan + '\')"]');
    var panel = card && card.closest('.tabpanel');
    if (panel && panel.hidden) {
      var link = links.filter(function (a) { return a.dataset.panel === panel.id; })[0];
      if (link) show(link.dataset.panel, link.dataset.target, false);
    }
  });
})();
</script>
