#!/usr/bin/env python3
"""
Rebuild neighbourhoods/dixie-lakeshore.html into the townhome-led layout:

    hero -> [ Townhomes: cards + compare + Exhale plans ] | [ Condo Apartments ]

    python3 scripts/build_dixie_lakeshore.py

Idempotent -- exits without touching the page if it has already been rebuilt.

The existing floor-plan card markup is MOVED, never regenerated, so pricing and
HST edits made anywhere else in the file survive untouched. Content comes from
scripts/fragments/.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "neighbourhoods", "dixie-lakeshore.html")
IMG = os.path.join(ROOT, "buildings", "images", "towns")
FRAG = os.path.join(ROOT, "scripts", "fragments")

HERO_W = [480, 800, 1280, 1920, 2560]
CARD_W = [480, 800, 1280]
CARD_SIZES = "(max-width: 900px) 100vw, (max-width: 1024px) 50vw, 33vw"


def srcset(name, widths, ext):
    return ", ".join(
        "../buildings/images/towns/%s-%d.%s %dw" % (name, w, ext, w)
        for w in widths
        if os.path.exists(os.path.join(IMG, "%s-%d.%s" % (name, w, ext))))


def picture(name, alt, sizes, widths, cls="", eager=False):
    avif, webp = srcset(name, widths, "avif"), srcset(name, widths, "webp")
    load = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    out = ["<picture>"]
    if avif:
        out.append('<source type="image/avif" sizes="%s" srcset="%s">' % (sizes, avif))
    if webp:
        out.append('<source type="image/webp" sizes="%s" srcset="%s">' % (sizes, webp))
    out.append('<img%s src="../buildings/images/towns/%s.jpg" alt="%s" %s decoding="async">'
               % (' class="%s"' % cls if cls else "", name, alt, load))
    out.append("</picture>")
    return "".join(out)


OLD_NAV = """<div class="sec-nav" id="sec-nav">
  <a href="#townhomes" class="on">Townhomes<span class="sec-nav-count">3</span></a>
  <a href="#compare">Compare</a>
  <a href="#exhale-towns">Exhale Town Plans<span class="sec-nav-count">11</span></a>
  <a href="#condos">Condo Apartments<span class="sec-nav-count">88</span></a>
</div>"""

NEW_NAV = """<div class="sec-nav" id="sec-nav" role="tablist">
  <a href="#townhomes" class="on" data-panel="panel-townhomes" data-target="townhomes" role="tab" aria-selected="true">Townhomes<span class="sec-nav-count">3</span></a>
  <a href="#compare" data-panel="panel-townhomes" data-target="compare" role="tab" aria-selected="false">Compare</a>
  <a href="#exhale-towns" data-panel="panel-townhomes" data-target="exhale-towns" role="tab" aria-selected="false">Exhale Town Plans<span class="sec-nav-count">11</span></a>
  <a href="#condos" data-panel="panel-condos" data-target="condos" role="tab" aria-selected="false">Condo Apartments<span class="sec-nav-count">88</span></a>
</div>"""

MOBILE_NAV_OLD = ('      @media(max-width:768px){.nav-logo{display:none!important;}'
                  'nav a[href*="stats"]{display:none!important;}'
                  '.nav-link:not([href*="saved"]){display:none!important;}}')

MOBILE_NAV_NEW = MOBILE_NAV_OLD + """
    nav > a { white-space: nowrap; }
    .nav-back .nav-back-short { display: none; }
    @media (max-width: 768px) {
      nav { padding: 0.85rem 1rem; gap: 0.5rem; min-height: 56px; }
      nav a[href*="about"] { display: none !important; }
      .nav-back { font-size: 0.62rem; letter-spacing: 0.06em; }
      .nav-back .nav-back-long { display: none; }
      .nav-back .nav-back-short { display: inline; }
      .nav-cta { padding: 0.55rem 0.9rem; font-size: 0.78rem; }
      .sec-nav { padding: 0 1rem; }
      .sec-nav a { padding: 0.9rem 1rem; font-size: 0.66rem; }
    }"""

SOLD_CSS = """    .proj-flag.gold { background: rgba(201,168,76,0.95); color: #17130a; }
    .proj-flag.sold { background: rgba(122,38,38,0.95); color: #fff; font-weight: 600; }
    .proj-card.is-sold .proj-img img { filter: saturate(0.55) brightness(0.92); }
    .proj-card.is-sold:hover .proj-img img { filter: saturate(0.75) brightness(0.97); }
    .proj-card.is-sold .proj-price { color: var(--text-muted); text-decoration: line-through; text-decoration-thickness: 1px; }
    .proj-card.is-sold .proj-price-lbl::after { content: " \\2014 sold out"; color: #7a2626; }
    .sec-nav a { cursor: pointer; }
    .tabpanel[hidden] { display: none; }
    #panel-condos > .sqft-section { border-top: none; }"""

HERO_CSS_OLD = ("    .hero-nb { position: relative; min-height: 62vh; display: flex; "
                "align-items: flex-end; background: #0d1b2a "
                "url('../buildings/images/towns/pier-house-hero.jpg') center 58%/cover no-repeat; }")

HERO_CSS_NEW = """    .hero-nb { position: relative; min-height: 62vh; display: flex; align-items: flex-end; background: #0d1b2a; overflow: hidden; }
    .hero-nb picture { position: absolute; inset: 0; }
    .hero-nb-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 58%; }"""


def read_fragment(name):
    with open(os.path.join(FRAG, name), encoding="utf-8") as fh:
        return fh.read()


def retitle(block, old, new, section_id):
    out = []
    for line in block:
        if old in line:
            line = line.replace(old, new)
        if line.strip() == '<div class="sqft-section">' and section_id:
            line = line.replace('<div class="sqft-section">',
                                '<div class="sqft-section" id="%s">' % section_id)
            section_id = None
        out.append(line)
    return out


def restructure(src):
    """Reorder the page and wrap the two views in tab panels."""
    lines = src.split("\n")

    def find(pred, what):
        for i, line in enumerate(lines):
            if pred(line):
                return i
        sys.exit("marker not found: " + what)

    i_style = find(lambda l: l.strip() == "</style>", "</style>")
    i_header = find(lambda l: '<div class="page-header">' in l, "page-header")
    i_condo = find(lambda l: "<!-- FLOOR PLANS -->" in l, "FLOOR PLANS")
    i_towns = find(lambda l: "<!-- TOWNHOMES -->" in l, "TOWNHOMES")
    i_cta = find(lambda l: '<div class="cta-strip">' in l, "cta-strip")
    i_body = find(lambda l: l.strip() == "</body>", "</body>")
    if not i_style < i_header < i_condo < i_towns < i_cta < i_body:
        sys.exit("unexpected section order -- page structure changed, aborting")

    condo = retitle(lines[i_condo:i_towns],
                    '<div class="sqft-title">Floor <em>Plans</em></div>',
                    '<div class="sqft-title">Condo <em>Apartments</em></div>', "condos")
    towns = retitle(lines[i_towns:i_cta],
                    '<div class="sqft-title"><em>Townhomes</em></div>',
                    '<div class="sqft-title">Exhale Townhome <em>Floor Plans</em></div>',
                    "exhale-towns")

    # Split the townhome fragment: page chrome (hero + tab bar) stays outside
    # the panels, the "Townhomes" cat-band goes inside panel-townhomes.
    fragment = read_fragment("dixie_townhomes.html")
    split_at = '<section class="cat-band" id="townhomes">'
    if split_at not in fragment:
        sys.exit("fragment is missing the townhomes cat-band marker")
    chrome, cards = fragment.split(split_at, 1)
    cards = split_at + cards

    return "\n".join(
        lines[:i_style]
        + [read_fragment("dixie_extra.css")]
        + lines[i_style:i_header]
        # The hero and the tab bar sit ABOVE the panels and stay visible; only
        # the townhome cards + compare table belong inside the townhome panel.
        + [chrome]
        + ['<div class="tabpanel" id="panel-townhomes">', cards]
        + towns
        + ['</div><!-- /panel-townhomes -->',
           '<div class="tabpanel" id="panel-condos" hidden>']
        + condo
        + ['</div><!-- /panel-condos -->']
        + lines[i_cta:i_body]
        + [read_fragment("dixie_tabs.js")]
        + lines[i_body:])


def main():
    src = open(PAGE, encoding="utf-8").read()
    if 'id="panel-townhomes"' in src:
        print("  dixie-lakeshore.html already rebuilt - skipping")
        return

    src = restructure(src)

    # hero: CSS background -> responsive <picture>, and preload it
    src = src.replace(HERO_CSS_OLD, HERO_CSS_NEW)
    src = src.replace(
        '<section class="hero-nb">\n  <div class="hero-nb-inner">',
        '<section class="hero-nb">\n  '
        + picture("pier-house-hero", "Pier House Towns streetscape rendering",
                  "100vw", HERO_W, "hero-nb-img", True)
        + '\n  <div class="hero-nb-inner">')
    hero_avif = srcset("pier-house-hero", HERO_W, "avif")
    if hero_avif:
        src = src.replace(
            '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond',
            '<link rel="preload" as="image" type="image/avif" imagesizes="100vw" '
            'imagesrcset="%s">\n  '
            '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond'
            % hero_avif, 1)

    # project card images -> <picture>
    for name, alt in [
        ("pier-house-b2b-front", "Pier House Towns exterior rendering"),
        ("aura-hero", "Aura Lakeview Village Towns exterior rendering"),
        ("exhale-towns-hero", "Exhale Townhome Collection exterior rendering"),
    ]:
        pattern = (r'<img src="\.\./buildings/images/towns/%s\.jpg" alt="[^"]*" loading="lazy" />'
                   % re.escape(name))
        m = re.search(pattern, src)
        if m:
            src = src.replace(m.group(0), picture(name, alt, CARD_SIZES, CARD_W))

    # sub-nav -> tabs
    if OLD_NAV not in src:
        sys.exit("sub-nav markup did not match -- aborting")
    src = src.replace(OLD_NAV, NEW_NAV)

    # Pier House sold out
    src = src.replace('    .proj-flag.gold { background: rgba(201,168,76,0.95); color: #17130a; }',
                      SOLD_CSS)
    src = src.replace('<a class="proj-card" href="../buildings/pier-house-towns.html">',
                      '<a class="proj-card is-sold" href="../buildings/pier-house-towns.html">')
    src = src.replace('<span class="proj-flag">Now selling</span>',
                      '<span class="proj-flag sold">Sold out</span>')
    src = src.replace('<th>Pier House Towns<small>Branthaven</small></th>',
                      '<th>Pier House Towns<small>Branthaven &middot; Sold out</small></th>')
    src = src.replace(
        '            <td class="hi">$819,900</td>',
        '            <td class="hi" style="color:#7a2626;">Sold out '
        '<span style="display:block;font-weight:400;color:var(--text-muted);'
        'font-size:0.78rem;">was $819,900</span></td>')
    src = src.replace('<div class="cat-count"><b>3</b>Communities selling</div>',
                      '<div class="cat-count"><b>3</b>Communities &middot; 2 selling</div>')

    # sticky sub-nav follows the measured nav height
    src = src.replace(".sec-nav { position: sticky; top: 61px;",
                      ".sec-nav { position: sticky; top: var(--nav-h, 61px);")
    src = src.replace("    .sec-nav { padding: 0 1.5rem; top: 57px; }",
                      "    .sec-nav { padding: 0 1.5rem; }")

    # mobile refinements
    src = src.replace("      .hero-nb { min-height: 52vh; }",
                      "      .hero-nb { min-height: 50vh; }\n"
                      "      .hero-nb-img { object-position: center 62%; }")
    src = src.replace("      .proj-grid { grid-template-columns: 1fr; }\n    }",
                      "    }\n    @media (max-width: 700px) "
                      "{ .proj-grid { grid-template-columns: 1fr; } }")
    src = src.replace(MOBILE_NAV_OLD, MOBILE_NAV_NEW)
    src = src.replace(
        '<a href="../index.html" class="nav-back">&larr; All neighbourhoods</a>',
        '<a href="../index.html" class="nav-back">&larr; '
        '<span class="nav-back-long">All neighbourhoods</span>'
        '<span class="nav-back-short">All areas</span></a>')

    # NOTE: do NOT switch this page to `overflow-x: clip`. On the root element
    # a clipped x-axis forces the y-axis to clip as well, which makes the whole
    # viewport unscrollable. The sticky sub-nav is worth less than scrolling.

    open(PAGE, "w", encoding="utf-8").write(src)
    print("  rebuilt neighbourhoods/dixie-lakeshore.html")


if __name__ == "__main__":
    main()
