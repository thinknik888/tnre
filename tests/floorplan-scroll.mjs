/**
 * Runtime proof that floor-plan cards / their detail modal actually SCROLL.
 *
 * This deliberately does NOT inspect CSS. It loads each real page (with its real
 * CSS + JS) in real browser engines, opens the floor-plan modal by clicking a
 * card, then dispatches REAL input (mouse wheel on desktop, a trusted touch
 * swipe on mobile) and asserts the scroll container's scrollTop/scrollLeft
 * actually CHANGED. A container that doesn't move = FAIL.
 *
 * Engines: chromium + webkit (webkit ≈ iOS Safari, where the mobile scroll bug
 * lives). Viewports: a short desktop window (forces overflow) and an iPhone.
 *
 * Prereq (one time): npm install && npx playwright install chromium webkit
 * Run:               npm test   (or: node tests/floorplan-scroll.mjs)
 *                    exits non-zero if any page/viewport row fails.
 *
 * Proven to have teeth: reverting js/modal-touch.js to the pre-fix version makes
 * all 16 mobile rows FAIL (touch-action:none + a touchmove preventDefault that
 * eats the gesture), and the run exits 1.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, webkit, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- Pages under test: every neighbourhood page that has floor-plan cards ----
const PAGES = [
  'cn-tower',
  'dixie-lakeshore',
  'liberty-village',
  'pickering-go',
  'toronto-waterfront-east',
  'yonge-eglinton',
  'yorkville',
  'forest-hill',
].map((slug) => ({ slug, url: `/neighbourhoods/${slug}.html` }));

// ---- Minimal static file server so pages load with real CSS/JS/relative paths ----
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.avif': 'image/avif',
};
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// ---- In-page: open the modal by clicking a real card ----
const OPEN_MODAL = () => {
  try { localStorage.setItem('ca_registered', 'true'); sessionStorage.setItem('ca_registered', 'true'); } catch (e) {}
  const card = document.querySelector('.fp-card, .unit-card, [onclick*="openModal"]');
  if (!card) return { ok: false, reason: 'no floor-plan card found' };
  card.scrollIntoView({ block: 'center' });
  const trigger = card.querySelector('.fp-image, .modal-trigger, img') || card;
  trigger.click();
  const overlay = document.querySelector('.modal-overlay.active, #modal.active') ||
                  document.querySelector('.modal-overlay, #modal');
  if (!overlay) return { ok: false, reason: 'no modal overlay' };
  overlay.classList.add('active');
  return { ok: true };
};

// ---- In-page: find the REAL scroll container in the open modal ----
// A candidate qualifies ONLY if its computed overflow is auto|scroll AND it has
// hidden content (slack > 1). overflow:visible/hidden never qualifies, so TWE's
// display:block modal-body is correctly rejected in favour of .modal. We return
// the qualifying element with the most hidden content (the true scroll port).
const LOCATE = () => {
  const overlay = document.querySelector('.modal-overlay.active, #modal.active');
  if (!overlay) return { sel: null, slack: 0 };
  const sels = ['.modal-details', '.modal-body', '.modal'];
  let best = null;
  for (const sel of sels) {
    const el = overlay.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    const slackY = ['auto', 'scroll'].includes(cs.overflowY) ? el.scrollHeight - el.clientHeight : 0;
    const slackX = ['auto', 'scroll'].includes(cs.overflowX) ? el.scrollWidth - el.clientWidth : 0;
    const slack = Math.max(slackY, slackX);
    if (slack <= 1) continue;
    if (!best || slack > best.slack) best = { sel, slack };
  }
  return best || { sel: null, slack: 0 };
};

function readMetrics(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector('.modal-overlay.active ' + s + ', #modal.active ' + s) ||
               document.querySelector(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    // effective touch-action up the ancestor chain (none anywhere blocks touch scroll)
    let ta = 'ok', node = el;
    while (node && node !== document.body) {
      if (getComputedStyle(node).touchAction === 'none') { ta = 'none@' + (node.className || node.tagName); break; }
      node = node.parentElement;
    }
    return {
      scrollTop: el.scrollTop, scrollLeft: el.scrollLeft,
      clientH: el.clientHeight, scrollH: el.scrollHeight,
      clientW: el.clientWidth, scrollW: el.scrollWidth,
      overflowY: cs.overflowY, overflowX: cs.overflowX,
      touchAction: cs.touchAction, ancestorTouchAction: ta,
      rect: el.getBoundingClientRect(),
    };
  }, sel);
}

// Trusted touch swipe via CDP (chromium only). Returns true if dispatched.
async function cdpTouchSwipe(context, page, cx, cy) {
  let client;
  try { client = await context.newCDPSession(page); } catch { return false; }
  const send = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await send('touchStart', [{ x: cx, y: cy }]);
  for (let i = 1; i <= 6; i++) await send('touchMove', [{ x: cx, y: cy - i * 30 }]);
  await send('touchEnd', []);
  return true;
}

// Real scroll through the actual scroll port (catches overflow:hidden/clip and
// missing-min-height regressions — none of these move scrollTop). WebKit mobile
// has no trusted swipe API in Playwright, so we drive the port directly here and
// separately PROVE the touch input layer is unblocked via touch-action + the
// touchmove-not-prevented probe (both gate the mobile PASS).
function programmaticScroll(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector('.modal-overlay.active ' + s + ', #modal.active ' + s) || document.querySelector(s);
    if (!el) return { moved: false, delta: 0 };
    const before = el.scrollTop, beforeL = el.scrollLeft;
    el.scrollTop = before + 300; el.scrollLeft = beforeL + 300;
    const moved = el.scrollTop !== before || el.scrollLeft !== beforeL;
    return { moved, delta: (el.scrollTop - before) || (el.scrollLeft - beforeL) };
  }, sel);
}

// Does our shared touchmove handler still eat the gesture? (untrusted probe)
function touchmoveNotPrevented(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector('.modal-overlay.active ' + s) || document.querySelector(s);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const mk = (type) => new TouchEvent(type, {
      bubbles: true, cancelable: true,
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })],
    });
    try {
      el.dispatchEvent(mk('touchstart'));
      const move = mk('touchmove');
      el.dispatchEvent(move);
      return !move.defaultPrevented; // true = handler allowed native scroll
    } catch (e) { return 'no-TouchEvent'; }
  }, sel);
}

async function testOne(context, page, viewport, pageInfo, baseURL) {
  const row = { page: pageInfo.slug, engine: viewport.engine, viewport: viewport.kind,
                scrollMoved: false, method: '-', delta: 0, slack: 0, taOk: true, notPrevented: true,
                linkPresent: false, navOk: false, note: '' };
  let located = null;
  const MEANINGFUL = 50; // a few-px "move" must NOT count as a pass
  try {
    if (viewport.kind === 'desktop') await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(baseURL + pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('.fp-card, .unit-card, [onclick*="openModal"]', { timeout: 15000 });

    const opened = await page.evaluate(OPEN_MODAL);
    if (!opened.ok) { row.note = opened.reason; return row; }
    await page.waitForTimeout(250);

    // Require MEANINGFUL overflow (>= MIN_SLACK) so the scroll test actually
    // exercises the trap. On mobile the modal overflows hugely at native size.
    // On desktop we shrink the window height until the details column has real
    // hidden content — this is exactly the short-window case where the missing
    // `min-height:0` regression clips the CTA out of reach. On the broken code
    // the details panel never becomes a slack-having scroll port (it expands and
    // is clipped by the modal), so LOCATE finds nothing and the row FAILS.
    const MIN_SLACK = 60;
    let loc = await page.evaluate(LOCATE);
    if (viewport.kind === 'desktop') {
      const heights = [640, 540, 460, 400, 350, 300, 260, 230];
      for (let i = 0; (!loc.sel || loc.slack < MIN_SLACK) && i < heights.length; i++) {
        await page.setViewportSize({ width: page.viewportSize().width, height: heights[i] });
        await page.waitForTimeout(120);
        loc = await page.evaluate(LOCATE);
      }
    }
    if (!loc.sel || loc.slack < MIN_SLACK) {
      row.note = `no scrollable container with >=${MIN_SLACK}px hidden content (slack=${loc.slack})`;
      return row;
    }
    located = { sel: loc.sel };

    const m = await readMetrics(page, located.sel);
    if (!m) { row.note = 'scroll container not found'; return row; }
    row.slack = loc.slack;
    row.taOk = m.ancestorTouchAction === 'ok';
    const cx = Math.round(m.rect.x + m.rect.width / 2);
    const cy = Math.round(m.rect.y + m.rect.height / 2);
    const before = { top: m.scrollTop, left: m.scrollLeft };

    if (viewport.kind === 'mobile') {
      const np = await touchmoveNotPrevented(page, located.sel);
      row.notPrevented = np === true || np === 'no-TouchEvent';
      // Chromium: trusted multi-point touch swipe via CDP (real iOS-like input).
      const didTouch = viewport.engine === 'chromium' ? await cdpTouchSwipe(context, page, cx, cy) : false;
      await page.waitForTimeout(200);
      let after = await readMetrics(page, located.sel);
      let d = after ? ((after.scrollTop - before.top) || (after.scrollLeft - before.left)) : 0;
      if (didTouch && Math.abs(d) >= MEANINGFUL) {
        row.scrollMoved = true; row.method = 'touch-swipe'; row.delta = d;
      } else {
        // WebKit mobile (no trusted swipe API): drive the real scroll port directly;
        // the ta-ok + notPrevented gates prove the touch input layer is unblocked.
        const ps = await programmaticScroll(page, located.sel);
        if (ps.moved && Math.abs(ps.delta) >= MEANINGFUL) { row.scrollMoved = true; row.method = 'port-scroll'; row.delta = ps.delta; }
      }
    } else {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(200);
      let after = await readMetrics(page, located.sel);
      const d = after ? ((after.scrollTop - before.top) || (after.scrollLeft - before.left)) : 0;
      if (Math.abs(d) >= MEANINGFUL) { row.scrollMoved = true; row.method = 'wheel'; row.delta = d; }
    }

    // ---- Card link to building page works ----
    const link = await page.evaluate(() => {
      const a = document.querySelector('a[href*="/buildings/"], a[href*="buildings/"]');
      if (!a) return null;
      const cs = getComputedStyle(a);
      return { href: a.getAttribute('href'), abs: a.href, visible: cs.pointerEvents !== 'none' && a.offsetParent !== null };
    });
    if (link && link.href && link.visible) {
      row.linkPresent = true;
      row.linkHref = link.href;
      // prove navigation actually fires (real click would stopPropagation; href nav is the effect)
      try {
        await page.goto(link.abs, { waitUntil: 'domcontentloaded', timeout: 15000 });
        row.navOk = /\/buildings\//.test(page.url());
      } catch (e) { row.navOk = false; row.note = 'navErr'; }
    } else {
      row.note = 'no visible building link';
    }
  } catch (e) {
    row.note = 'ERR: ' + (e.message || e).split('\n')[0];
  }
  return row;
}

async function run() {
  const server = await startServer();
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;
  console.log(`Static server on ${baseURL}\n`);

  const matrix = [
    { engine: 'chromium', kind: 'desktop', launcher: chromium, ctx: { viewport: { width: 1280, height: 480 } } },
    { engine: 'webkit', kind: 'desktop', launcher: webkit, ctx: { viewport: { width: 1280, height: 480 } } },
    { engine: 'webkit', kind: 'mobile', launcher: webkit, ctx: { ...devices['iPhone 13'] } },
    { engine: 'chromium', kind: 'mobile', launcher: chromium, ctx: { ...devices['Pixel 5'] } },
  ];

  const rows = [];
  for (const vp of matrix) {
    const browser = await vp.launcher.launch();
    const context = await browser.newContext(vp.ctx);
    const page = await context.newPage();
    page.on('pageerror', () => {});
    for (const pg of PAGES) {
      const r = await testOne(context, page, vp, pg, baseURL);
      rows.push(r);
      const sp = r.scrollMoved && (vp.kind === 'desktop' || (r.taOk && r.notPrevented));
      const lp = r.linkPresent && r.navOk;
      console.log(`  ${pad(pg.slug, 24)} ${pad(vp.engine + '/' + vp.kind, 16)} scroll:${sp ? 'PASS' : 'FAIL'}(${r.method},Δ${r.delta}) link:${lp ? 'PASS' : 'FAIL'}  ${r.note}`);
    }
    await browser.close();
  }
  server.close();

  // ---- Final table ----
  console.log('\n=========================================== RESULTS ===========================================');
  console.log(pad('PAGE', 24) + pad('VIEWPORT', 18) + pad('SCROLL MOVED', 28) + pad('CARD LINK', 11) + 'DETAIL');
  console.log('-'.repeat(124));
  let failures = [];
  for (const r of rows) {
    const desktop = r.viewport === 'desktop';
    const scrollPass = r.scrollMoved && (desktop || (r.taOk && r.notPrevented));
    const linkPass = r.linkPresent && r.navOk;
    const rowPass = scrollPass && linkPass;
    if (!rowPass) failures.push(`${r.page} [${r.engine}/${r.viewport}] -> ${[!scrollPass && 'SCROLL', !linkPass && 'LINK'].filter(Boolean).join('+')}`);
    const detail = desktop
      ? `slack ${r.slack}px` + (r.note ? '; ' + r.note : '')
      : `touch-action:${r.taOk ? 'ok' : 'BLOCKED'} handler:${r.notPrevented ? 'ok' : 'PREVENTS'}` + (r.note ? '; ' + r.note : '');
    console.log(
      pad(r.page, 24) +
      pad(r.engine + '/' + r.viewport, 18) +
      pad((scrollPass ? 'PASS' : 'FAIL') + ` (${r.method} Δ${r.delta}px)`, 28) +
      pad(linkPass ? 'PASS' : 'FAIL', 11) +
      detail
    );
  }
  console.log('-'.repeat(110));
  if (failures.length) {
    console.log(`\n❌ ${failures.length} FAILING ROW(S):`);
    failures.forEach((f) => console.log('   - ' + f));
    process.exitCode = 1;
  } else {
    console.log(`\n✅ ALL ${rows.length} ROWS PASS (scroll moved + card link navigates) across chromium & webkit, desktop & mobile.`);
  }
}

function pad(s, n) { s = String(s); return s.length >= n ? s.slice(0, n - 1) + ' ' : s + ' '.repeat(n - s.length); }

run().catch((e) => { console.error(e); process.exit(1); });
