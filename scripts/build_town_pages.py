#!/usr/bin/env python3
"""
Generate the townhome project pages under buildings/ from one shared template.

    python3 scripts/build_town_pages.py

Adding a fourth community = add one entry to PROJECTS and re-run. Images are
expected in buildings/images/towns/ with the responsive ladder produced by
scripts/optimize_images.py (or scratchpad/build_renderings.py for masters).
"""

import html
import os
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "buildings")
IMG_DIR = os.path.join(OUT_DIR, "images", "towns")

HERO_W = [480, 800, 1280, 1920, 2560]
CARD_W = [480, 800, 1280]


# --------------------------------------------------------------------------
# data
# --------------------------------------------------------------------------

PROJECTS = {
    "pier-house-towns": {
        "name": "Pier House Towns",
        "builder": "Branthaven",
        "status": "Sold out",
        "tagline": "Live the lake. Love the city.",
        "address": "South of Lakeshore Rd E &amp; Dixie Rd, Mississauga",
        "area": "Lakeview Village",
        "hero": "pier-house-hero",
        "hero_alt": "Pier House Towns streetscape rendering",
        "meta": "Pier House Towns by Branthaven at Lakeview Village, Mississauga. "
                "164 three-storey townhomes from $819,900. Full price list, floor plan "
                "series, incentives and deposit structure.",
        "facts": [
            ("From", "$819,900"),
            ("Size", "1,255 &ndash; 2,195 sq ft"),
            ("Bedrooms", "2 &ndash; 5"),
            ("Storeys", "3"),
            ("Homes", "164"),
            ("Parking", "2 &ndash; 4 spaces"),
        ],
        "intro": [
            "Introducing Pier House, Branthaven&rsquo;s townhome enclave inside the "
            "visionary Lakeview Village master plan &mdash; a 177-acre waterfront "
            "revitalization that will reshape Mississauga&rsquo;s shoreline with new "
            "parks, trails, cultural amenities and conservation lands.",
            "Four contemporary collections of family-sized, three-storey homes, each "
            "with outdoor space, an above-grade private garage and a driveway. One "
            "minute&rsquo;s walk to the waterfront pier; a twenty-minute commute "
            "downtown via Long Branch GO, the TTC loop or the QEW.",
        ],
        "tables": [
            {
                "title": "Price list",
                "note": "Starting prices and square footage. Premiums vary by elevation "
                        "and lot. Purchase price includes HST. Builder list dated April 25, 2026.",
                "cols": ["Model", "Beds", "Condition", "Sq ft", "Outdoor space", "From"],
                "groups": [
                    ("21&prime; Back to Back Series", [
                        ["The Cumberland", "2", "Interior", "1,255", "2 balconies", "$819,900"],
                        ["The Elmvale", "3", "Interior", "1,380", "2 balconies", "$869,900"],
                        ["The Elmvale", "3", "End", "1,420", "2 balconies", "$929,900"],
                        ["The Link", "3", "Interior", "1,425", "2 balconies", "$889,900"],
                        ["The Link", "3", "End", "1,465", "2 balconies", "$934,900"],
                        ["The Link", "3", "Flankage", "1,515", "2 balconies", "$945,900"],
                        ["The Mews", "3", "Corner", "1,670", "2 balconies", "$969,900"],
                    ]),
                    ("16&prime; Rear Lane Series", [
                        ["The Drift", "2&ndash;4", "Interior", "1,740", "2 balconies", "$1,019,900"],
                        ["The Drift", "2&ndash;4", "End", "1,790", "2 balconies", "$1,070,900"],
                    ]),
                    ("18&prime; Garden Series", [
                        ["The Elmswood", "3&ndash;4", "Interior", "1,810",
                         "Backyard + 2nd-storey deck + 3rd-storey balcony", "$1,149,900"],
                        ["The Elmswood", "3&ndash;4", "End", "1,915",
                         "Backyard + 2nd-storey deck + 3rd-storey balcony", "$1,199,900"],
                    ]),
                    ("20&prime; Rear Lane Series", [
                        ["The Bluffs", "3&ndash;5", "Interior", "2,110",
                         "2 balconies &middot; double garage", "$1,264,900"],
                    ]),
                ],
            },
            {
                "title": "Optional floor plan upgrades",
                "note": "",
                "cols": ["Model", "Plan option", "Cost"],
                "groups": [("", [
                    ["16&prime; The Drift", "Ground floor guest suite", "$18,500"],
                    ["16&prime; The Drift", "Third floor luxury ensuite", "$7,000"],
                    ["16&prime; The Drift", "Third floor dual primary bedrooms", "$8,000"],
                    ["18&prime; The Elmswood", "Ground floor guest suite", "$20,000"],
                    ["18&prime; The Elmswood", "Third floor luxury ensuite", "$8,500"],
                    ["20&prime; The Bluffs", "Ground floor guest suite", "$19,000"],
                    ["20&prime; The Bluffs", "Third floor fourth bedroom", "$4,000"],
                ])],
            },
        ],
        "incentives": [
            "4-piece stainless steel kitchen appliance package with white washer &amp; dryer",
            "$8,000 d&eacute;cor dollars",
            "1 year free POTL fees",
            "Free assignment (admin &amp; legal fees apply)",
            "$0 capped development charges",
            "Quartz counters in kitchen and bathrooms",
            "Prefinished oak engineered hardwood on ground, second and third floor hallways",
            "9&prime; ceilings on the ground and second floor, smooth ceilings throughout",
            "Central air conditioning, professionally sized and installed",
            "Smart thermostat, USB charging receptacles, integrated LED nightlights",
        ],
        "deposit": {
            "title": "Deposit &mdash; 10% total",
            "rows": [
                ("At signing", "$5,000"),
                ("30 &ndash; 240 days", "$8,500 &times; 8 &nbsp;<span class=\"dim\">(21&prime; B2B)</span><br>"
                                        "$10,000 &times; 8 &nbsp;<span class=\"dim\">(all other series)</span>"),
                ("270 days", "Balance to 10%"),
            ],
            "foot": "Payable to Brattys LLP, In Trust. POTL fee $110/month covers landscaping "
                    "and maintenance of common areas and roadway snow clearing.",
        },
        "commute": [
            ("4 min", "Long Branch GO Station"),
            ("4 min", "TTC Long Branch Loop"),
            ("5 min", "QEW / 427"),
            ("6 min", "Sherway Gardens"),
            ("9 min", "Queensway Hospital"),
            ("15 min", "Pearson Airport"),
            ("20 min", "Downtown Toronto"),
        ],
        "gallery": [
            ("pier-house-street", "Pier House Towns streetscape"),
            ("pier-house-b2b-front", "21 foot back-to-back elevation"),
            ("pier-house-18-front", "18 foot garden series front elevation"),
            ("pier-house-20-front", "20 foot rear lane series front elevation"),
            ("pier-house-16-back", "16 foot rear lane series rear elevation"),
            ("pier-house-aerial", "Aerial view of Pier House Towns"),
            ("pier-house-kitchen", "Pier House Towns kitchen interior"),
            ("pier-house-living", "Pier House Towns living room interior"),
            ("pier-house-bedroom", "Pier House Towns bedroom interior"),
            ("pier-house-backyard", "Pier House Towns backyard"),
        ],
        "source": "Branthaven price list dated April 25, 2026 and Pier House quick facts.",
    },

    "aura-lakeview-towns": {
        "name": "Aura Lakeview Village Towns",
        "builder": "Caivan",
        "tagline": "Exceptional lakeside townhomes.",
        "address": "Lakeshore Rd E between Cawthra Rd &amp; Dixie Rd, Mississauga",
        "area": "Lakeview Village",
        "hero": "aura-hero",
        "hero_alt": "Aura Lakeview Village Towns exterior rendering",
        "meta": "Aura Lakeview Village Towns by Caivan on Lakeshore Rd E, Mississauga. "
                "Two-storey urban towns 811&ndash;1,138 sq ft from $539,990, with "
                "first-time buyer pricing from $499,106. Price list and available lots.",
        "facts": [
            ("From", "$539,990"),
            ("FTHB from", "$499,106"),
            ("Size", "811 &ndash; 1,138 sq ft"),
            ("Bedrooms", "2 &ndash; 3"),
            ("Baths", "1.5 &ndash; 2"),
            ("Occupancy", "Summer 2027"),
        ],
        "intro": [
            "Aura sits a two-minute walk from the Lake Ontario waterfront inside "
            "Lakeview Village &mdash; Canada&rsquo;s most transformative waterfront "
            "community, designed for healthier, future-ready living.",
            "Two-storey urban towns in Main and Upper Residences, with underground "
            "parking, built-in retail and offices, and the lowest entry point in the "
            "GTA for new townhome living at the waterfront.",
        ],
        "tables": [
            {
                "title": "Price list &mdash; Block 1",
                "note": "Pre-launch offer is after tax. First-time buyer pricing is before tax "
                        "and guaranteed for eligible FTHB purchasers. Builder list dated February 24, 2026.",
                "cols": ["Model", "Type", "Sq ft", "List price", "Pre-launch offer", "FTHB tax-free"],
                "groups": [
                    ("Main Residences", [
                        ["The Echo", "2 bedrooms", "811", "$599,990", "$539,990", "$499,106"],
                        ["The Echo End", "2 bedrooms", "836", "$634,990", "$574,990", "$530,080"],
                        ["The Lux (Corner)", "3 bed (opt. 2)", "986", "$679,990", "$619,990", "$569,903"],
                        ["The Prism (End)", "3 bedrooms", "986", "$709,990", "$649,990", "$596,451"],
                    ]),
                    ("Upper Residences", [
                        ["The Halo", "2 bedrooms", "957", "$659,990", "$599,990", "$552,204"],
                        ["The Halo End", "2 bedrooms", "977", "$699,990", "$639,990", "$587,602"],
                        ["The Nova (Corner)", "3 bed (opt. 2)", "1,138", "$759,990", "$699,990", "$640,699"],
                    ]),
                ],
            },
            {
                "title": "Add-ons",
                "note": "",
                "cols": ["Item", "Cost"],
                "groups": [("", [
                    ["Electric vehicle charging station (supply &amp; installation)", "$10,600 + tax"],
                    ["Tandem parking stall with locker (by waitlist)", "$39,900 + tax"],
                ])],
            },
        ],
        "incentives": [
            "Exclusive tax rebate guarantee &mdash; GST + PST rebates for eligible first-time buyers",
            "Extended deposit structure &mdash; only $55,000 until occupancy",
            "6-piece appliance package",
            "1-car underground parking spot",
            "Condo fees waived for 12 months",
            "$0 development charge cap",
            "$5,000 total closing cost cap",
            "Right to lease",
            "Free assignments (legal fees apply)",
        ],
        "deposit": {
            "title": "Deposit &mdash; $65,000 total",
            "rows": [
                ("At signing", "$10,000"),
                ("30 / 60 / 90 days", "$7,500 each"),
                ("150 / 210 / 330 days", "$7,500 each"),
                ("At occupancy", "$10,000"),
            ],
            "foot": "Initial deposit by bank draft, payable to Bennett Jones LLP, In Trust. "
                    "Bring government photo ID for each purchaser and a mortgage pre-approval letter.",
        },
        "commute": [
            ("2 min walk", "Lake Ontario waterfront"),
            ("At your door", "Parks and nature trails"),
            ("Built-in", "Retail, offices and restaurants"),
            ("Quick access", "GO Transit, QEW and Highway 427"),
        ],
        "gallery": [
            ("aura-lakefront", "Aura Lakeview Village Towns at Ogden Park"),
            ("aura-streetscape", "Aura community streetscape along the waterway"),
            ("aura-kitchen", "Aura Lakeview Village Towns kitchen interior"),
            ("aura-living", "Aura Lakeview Village Towns living room interior"),
            ("aura-bedroom", "Aura Lakeview Village Towns main bedroom interior"),
        ],
        "source": "Caivan price list and available-lot list dated February 24, 2026.",
    },

    "exhale-towns": {
        "name": "Exhale Townhome Collection",
        "builder": "Brixen Developments",
        "tagline": "Two-storey towns at the base of Exhale.",
        "address": "1381 Lakeshore Rd E, Mississauga",
        "area": "Lakeshore &amp; Dixie",
        "hero": "exhale-towns-hero",
        "hero_alt": "Exhale Townhome Collection exterior rendering",
        "meta": "Exhale Townhome Collection by Brixen Developments at 1381 Lakeshore Rd E, "
                "Mississauga. Eleven two-storey townhome plans, 945&ndash;1,710 sq ft, "
                "from $708,750 with 2026 occupancy.",
        "facts": [
            ("From", "$708,750"),
            ("Size", "945 &ndash; 1,710 sq ft"),
            ("Bedrooms", "2 &ndash; 3 + den"),
            ("Storeys", "2"),
            ("Plans", "11"),
            ("Occupancy", "2026"),
        ],
        "intro": [
            "The Townhome Collection sits at grade beneath Exhale on Lakeshore Road "
            "East at Dixie &mdash; directly across from Lakeshore Park, a short walk "
            "from the water, and three minutes from Dixie Outlet Mall.",
            "Eleven two-storey plans from 945 to 1,710 sq ft, with private patios and "
            "access to the full Exhale amenity floor. The earliest occupancy of the "
            "three townhome communities in this neighbourhood.",
        ],
        "tables": [
            {
                "title": "Floor plans &amp; pricing",
                "note": "Promotional pricing shown against the original list price. "
                        "HST rebate value is the estimated net after rebate.",
                "cols": ["Plan", "Sq ft", "List price", "Promotional price", "After HST rebate"],
                "groups": [("", [
                    ["Townhome 4", "945", "$945,000", "$708,750", "$616,612"],
                    ["Townhome 3", "1,005", "$1,005,000", "$753,750", "$655,762"],
                    ["Townhome 2", "1,018", "$1,018,000", "$763,500", "$664,245"],
                    ["Townhome 8", "1,020", "$1,020,000", "$765,000", "$665,550"],
                    ["Townhome 10", "1,055", "$1,055,000", "$791,250", "$688,388"],
                    ["Townhome 11", "1,065", "$1,065,000", "$798,750", "$694,912"],
                    ["Townhome 1", "1,265", "$1,265,000", "$948,750", "$825,412"],
                    ["Townhome 9", "1,310", "$1,310,000", "$982,500", "$854,775"],
                    ["Townhome 6", "1,430", "$1,430,000", "$1,072,500", "$933,075"],
                    ["Townhome 5", "1,485", "$1,485,000", "$1,113,750", "$968,962"],
                    ["Townhome 7", "1,710", "$1,710,000", "$1,282,500", "$1,115,775"],
                ])],
            },
        ],
        "incentives": [
            "Promotional pricing on every remaining town plan",
            "HST rebate value reflected in the pricing above",
            "2026 occupancy &mdash; the earliest of the three townhome communities here",
            "Full access to the Exhale amenity floor, gym and rooftop",
        ],
        "deposit": None,
        "commute": [
            ("Across the street", "Lakeshore Park"),
            ("3 min", "Dixie Outlet Mall"),
            ("Nearby", "Dixie GO Station"),
            ("Planned", "Lakeshore MiWay BRT and LRT"),
        ],
        "gallery": [
            ("exhale-towns-suite", "Exhale Townhome Collection interior"),
            ("exhale-aerial", "Aerial view of Exhale on Lakeshore"),
            ("exhale-siteplan", "Exhale Townhome Collection site plan"),
        ],
        "plans_link": ("../neighbourhoods/dixie-lakeshore.html#exhale-towns",
                       "View all 11 floor plans"),
        "source": "Current Exhale promotional pricing and the Exhale Townhome Collection plan set.",
    },
}

ORDER = ["pier-house-towns", "aura-lakeview-towns", "exhale-towns"]

SIBLINGS = {
    "pier-house-towns": "Pier House Towns",
    "aura-lakeview-towns": "Aura Lakeview Village Towns",
    "exhale-towns": "Exhale Townhome Collection",
}


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def have(name, w, ext):
    return os.path.exists(os.path.join(IMG_DIR, "%s-%d.%s" % (name, w, ext)))


def picture(name, alt, sizes, widths, cls="", eager=False):
    """<picture> with AVIF + WebP sources and a JPEG fallback in <img src>."""
    avif = ", ".join("images/towns/%s-%d.avif %dw" % (name, w, w)
                     for w in widths if have(name, w, "avif"))
    webp = ", ".join("images/towns/%s-%d.webp %dw" % (name, w, w)
                     for w in widths if have(name, w, "webp"))
    loading = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    src = "images/towns/%s.jpg" % name
    out = ["<picture>"]
    if avif:
        out.append('  <source type="image/avif" sizes="%s" srcset="%s">' % (sizes, avif))
    if webp:
        out.append('  <source type="image/webp" sizes="%s" srcset="%s">' % (sizes, webp))
    out.append('  <img src="%s" alt="%s" %s decoding="async"%s>'
               % (src, html.escape(alt, quote=True), loading,
                  ' class="%s"' % cls if cls else ""))
    out.append("</picture>")
    return "\n      ".join(out)


def table_html(t):
    ncol = len(t["cols"])
    rows = []
    for gname, grows in t["groups"]:
        if gname:
            rows.append('        <tr class="grp"><td colspan="%d">%s</td></tr>' % (ncol, gname))
        for r in grows:
            cells = "".join("<td%s>%s</td>" % (' class="num"' if i == len(r) - 1 else "", c)
                            for i, c in enumerate(r))
            rows.append("        <tr>%s</tr>" % cells)
    note = '\n    <p class="tbl-note">%s</p>' % t["note"] if t["note"] else ""
    return """  <div class="tbl-block">
    <h3 class="tbl-title">%s</h3>
    <div class="tbl-scroll">
      <table class="dt">
        <thead><tr>%s</tr></thead>
        <tbody>
%s
        </tbody>
      </table>
    </div>%s
  </div>""" % (
        t["title"],
        "".join("<th>%s</th>" % c for c in t["cols"]),
        "\n".join(rows),
        note,
    )


def build(slug, p):
    facts = "\n".join(
        '      <div class="fact"><div class="fact-lbl">%s</div><div class="fact-val">%s</div></div>'
        % (k, v) for k, v in p["facts"])

    intro = "\n".join("      <p>%s</p>" % t for t in p["intro"])

    tables = "\n".join(table_html(t) for t in p["tables"])

    plans_link = ""
    if p.get("plans_link"):
        href, label = p["plans_link"]
        plans_link = ('\n  <p class="plans-link"><a href="%s">%s &rarr;</a></p>' % (href, label))

    incentives = "\n".join("        <li>%s</li>" % i for i in p["incentives"])

    if p["deposit"]:
        drows = "\n".join(
            '          <div class="dep-row"><span class="dep-when">%s</span>'
            '<span class="dep-amt">%s</span></div>' % (w, a)
            for w, a in p["deposit"]["rows"])
        deposit = """      <div class="dep-card">
        <h3 class="side-title">%s</h3>
%s
        <p class="dep-foot">%s</p>
      </div>""" % (p["deposit"]["title"], drows, p["deposit"]["foot"])
    else:
        deposit = ""

    commute = "\n".join(
        '        <div class="cm-row"><span class="cm-time">%s</span>'
        '<span class="cm-place">%s</span></div>' % (t, pl) for t, pl in p["commute"])

    gallery = "\n".join(
        '      <figure class="gal-item">%s<figcaption>%s</figcaption></figure>'
        % (picture(n, a, "(max-width: 700px) 100vw, 50vw", CARD_W), a)
        for n, a in p["gallery"])

    others = "\n".join(
        '      <a class="sib" href="%s.html"><span class="sib-lbl">Also in Dixie &amp; Lakeshore</span>'
        '<span class="sib-name">%s &rarr;</span></a>' % (s, SIBLINGS[s])
        for s in ORDER if s != slug)

    status_badge = ('<div class="hero-status">%s</div>\n    ' % p["status"]) if p.get("status") else ""
    hero_pic = picture(p["hero"], p["hero_alt"], "100vw", HERO_W, cls="hero-img", eager=True)
    hero_preload = ""
    if have(p["hero"], 1280, "avif"):
        hero_preload = (
            '\n  <link rel="preload" as="image" type="image/avif" '
            'imagesizes="100vw" imagesrcset="%s">'
            % ", ".join("images/towns/%s-%d.avif %dw" % (p["hero"], w, w)
                        for w in HERO_W if have(p["hero"], w, "avif")))

    return TEMPLATE.format(
        name=p["name"], builder=p["builder"], tagline=p["tagline"],
        address=p["address"], area=p["area"], meta=p["meta"],
        hero_pic=hero_pic, hero_preload=hero_preload,
        facts=facts, intro=intro, tables=tables, plans_link=plans_link,
        incentives=incentives, deposit=deposit, commute=commute,
        gallery=gallery, others=others, source=p["source"], status_badge=status_badge,
        price_from=dict(p["facts"])["From"],
        name_url=quote(p["name"].replace("&amp;", "&")),
    )


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{name} &mdash; {builder} &middot; Dixie &amp; Lakeshore | CondosAround.com</title>
  <meta name="description" content="{meta}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />{hero_preload}
  <style>
    :root {{ --navy: #002244; --navy-deep: #001a35; --gold: #c9a84c; --gold-soft: #e2c684;
             --white: #fff; --off-white: #faf8f4; --cream: #f3ede2; --text: #1a1a18;
             --text-mid: #4a4a46; --text-muted: #8a8a84; --border: rgba(0,34,68,0.13); }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    html, body {{ overflow-x: hidden; max-width: 100%; }}
    body {{ font-family: 'Outfit', sans-serif; background: var(--off-white); color: var(--text); }}
    img {{ max-width: 100%; display: block; }}

    nav {{ display: flex; align-items: center; justify-content: space-between; gap: 1rem;
           padding: 1.15rem 3rem; background: rgba(250,248,244,0.95); backdrop-filter: blur(12px);
           border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }}
    .nav-logo {{ font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--text); text-decoration: none; }}
    .nav-logo em {{ font-style: italic; color: var(--navy); }}
    .nav-back {{ font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
                 color: var(--text-muted); text-decoration: none; }}
    .nav-back:hover {{ color: var(--navy); }}
    .nav-cta {{ background: var(--navy); color: #fff; padding: 0.6rem 1.4rem; border-radius: 2px;
                text-decoration: none; font-size: 0.82rem; white-space: nowrap; }}
    nav > a {{ white-space: nowrap; }}
    .nav-back .nb-short {{ display: none; }}

    .hero {{ position: relative; min-height: 66vh; display: flex; align-items: flex-end; background: var(--navy-deep); }}
    .hero picture, .hero .hero-img {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
    .hero .hero-img {{ object-fit: cover; object-position: center 55%; }}
    .hero::after {{ content: ''; position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(180deg, rgba(0,18,38,0.25) 0%, rgba(0,18,38,0.55) 45%, rgba(0,18,38,0.93) 100%); }}
    .hero-inner {{ position: relative; z-index: 2; padding: 5rem 3rem 2.5rem; width: 100%; }}
    .hero-builder {{ font-size: 0.66rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.9rem; }}
    .hero-status {{ display: inline-block; background: rgba(122,38,38,0.95); color: #fff; font-size: 0.66rem;
                    font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; padding: 0.42rem 0.9rem;
                    border-radius: 2px; margin-bottom: 1rem; }}
    .hero-title {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5.5vw, 4.4rem);
                   font-weight: 300; line-height: 1.02; color: #fff; margin-bottom: 0.7rem; }}
    .hero-tag {{ font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.35rem; color: var(--gold-soft); margin-bottom: 0.9rem; }}
    .hero-addr {{ font-size: 0.88rem; color: rgba(255,255,255,0.62); }}
    .hero-credit {{ position: absolute; right: 1rem; bottom: 0.45rem; z-index: 2; font-size: 0.56rem; color: rgba(255,255,255,0.32); }}

    .facts {{ display: grid; grid-template-columns: repeat(6, 1fr); background: var(--navy); }}
    .fact {{ padding: 1.5rem 1.25rem; border-right: 1px solid rgba(255,255,255,0.09); }}
    .fact:last-child {{ border-right: none; }}
    .fact-lbl {{ font-size: 0.58rem; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-bottom: 0.4rem; }}
    .fact-val {{ font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; color: var(--gold-soft); line-height: 1.15; }}

    section {{ padding: 4.5rem 3rem; border-bottom: 1px solid var(--border); }}
    .sec-eyebrow {{ font-size: 0.63rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.7rem; }}
    .sec-title {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(1.9rem, 3vw, 2.7rem); font-weight: 300; line-height: 1.12; margin-bottom: 1.75rem; }}
    .sec-title em {{ font-style: italic; color: var(--navy); }}

    .overview {{ display: grid; grid-template-columns: 1.35fr 1fr; gap: 4rem; align-items: start; }}
    .overview p {{ font-size: 1rem; line-height: 1.85; color: var(--text-mid); font-weight: 300; margin-bottom: 1.15rem; }}
    .side-title {{ font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 400; margin-bottom: 1.1rem; }}
    .cm-row {{ display: flex; gap: 1rem; padding: 0.72rem 0; border-bottom: 1px solid var(--border); font-size: 0.86rem; }}
    .cm-row:last-child {{ border-bottom: none; }}
    .cm-time {{ color: var(--navy); font-weight: 600; min-width: 6.5rem; }}
    .cm-place {{ color: var(--text-mid); }}

    .tbl-block {{ margin-bottom: 3rem; }}
    .tbl-block:last-child {{ margin-bottom: 0; }}
    .tbl-title {{ font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 400; margin-bottom: 1rem; }}
    .tbl-scroll {{ overflow-x: auto; border: 1px solid #e8e4dc; border-radius: 10px; background: #fff; }}
    table.dt {{ width: 100%; border-collapse: collapse; min-width: 660px; font-size: 0.85rem; }}
    table.dt th, table.dt td {{ text-align: left; padding: 0.85rem 1.15rem; border-bottom: 1px solid #efebe2; }}
    table.dt thead th {{ background: var(--navy); color: #fff; font-weight: 500; font-size: 0.74rem;
                         letter-spacing: 0.07em; text-transform: uppercase; border-bottom: none; }}
    table.dt tbody tr:last-child td {{ border-bottom: none; }}
    table.dt tr.grp td {{ background: var(--cream); font-size: 0.66rem; letter-spacing: 0.14em;
                          text-transform: uppercase; color: var(--navy); font-weight: 600; }}
    table.dt td.num {{ color: var(--navy); font-weight: 600; white-space: nowrap; }}
    .tbl-note {{ font-size: 0.72rem; color: var(--text-muted); font-style: italic; line-height: 1.65; margin-top: 0.85rem; }}
    .plans-link {{ margin-top: 1.5rem; }}
    .plans-link a {{ font-size: 0.72rem; letter-spacing: 0.11em; text-transform: uppercase;
                     color: var(--navy); text-decoration: none; border-bottom: 1px solid var(--gold); padding-bottom: 3px; }}

    .two-col {{ display: grid; grid-template-columns: 1.2fr 1fr; gap: 3.5rem; align-items: start; }}
    .inc-list {{ list-style: none; }}
    .inc-list li {{ position: relative; padding-left: 1.5rem; margin-bottom: 0.85rem; font-size: 0.92rem;
                    line-height: 1.7; color: var(--text-mid); }}
    .inc-list li::before {{ content: ''; position: absolute; left: 0; top: 0.62rem; width: 5px; height: 5px;
                            border-radius: 50%; background: var(--gold); }}
    .dep-card {{ background: #fff; border: 1px solid #e8e4dc; border-radius: 10px; padding: 1.75rem; }}
    .dep-row {{ display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0;
                border-bottom: 1px solid var(--border); font-size: 0.85rem; }}
    .dep-row:last-of-type {{ border-bottom: none; }}
    .dep-when {{ color: var(--text-muted); }}
    .dep-amt {{ color: var(--navy); font-weight: 600; text-align: right; }}
    .dep-amt .dim {{ color: var(--text-muted); font-weight: 300; font-size: 0.78rem; }}
    .dep-foot {{ font-size: 0.72rem; color: var(--text-muted); font-style: italic; line-height: 1.65;
                 margin-top: 1.1rem; padding-top: 1.1rem; border-top: 1px solid var(--border); }}

    .gal {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }}
    .gal-item {{ margin: 0; border-radius: 10px; overflow: hidden; background: var(--cream); }}
    .gal-item img {{ width: 100%; aspect-ratio: 16/10; object-fit: cover; transition: transform 0.5s; }}
    .gal-item:hover img {{ transform: scale(1.03); }}
    .gal-item figcaption {{ font-size: 0.7rem; color: var(--text-muted); padding: 0.7rem 0.15rem 0; }}

    .sibs {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }}
    .sib {{ display: block; background: #fff; border: 1px solid #e8e4dc; border-radius: 10px;
            padding: 1.5rem 1.75rem; text-decoration: none; transition: border-color 0.2s, transform 0.2s; }}
    .sib:hover {{ border-color: var(--gold); transform: translateY(-2px); }}
    .sib-lbl {{ display: block; font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase;
                color: var(--text-muted); margin-bottom: 0.4rem; }}
    .sib-name {{ display: block; font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; color: var(--navy); }}

    .cta {{ background: var(--text); padding: 4rem 3rem; display: flex; align-items: center;
            justify-content: space-between; gap: 2rem; flex-wrap: wrap; border: none; }}
    .cta-h {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(1.6rem, 2.5vw, 2.3rem); font-weight: 300; color: #fff; }}
    .cta-h em {{ font-style: italic; color: var(--gold); }}
    .cta-actions {{ display: flex; gap: 1rem; flex-wrap: wrap; }}
    .btn-w {{ background: #fff; color: var(--text); padding: 0.85rem 2rem; border-radius: 2px; text-decoration: none;
              font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; }}
    .btn-o {{ color: var(--gold); border: 1px solid var(--gold); padding: 0.85rem 2rem; border-radius: 2px;
              text-decoration: none; font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; }}

    .disclaimer {{ padding: 2.25rem 3rem; background: var(--cream); font-size: 0.7rem; line-height: 1.75;
                   color: var(--text-muted); font-style: italic; border: none; }}
    footer {{ background: var(--text); padding: 2rem 3rem; display: flex; justify-content: space-between;
              align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.72rem; color: rgba(255,255,255,0.3); }}
    .footer-logo {{ font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: rgba(255,255,255,0.5); }}
    .footer-logo em {{ font-style: italic; color: var(--gold); opacity: 0.75; }}

    @media (max-width: 1000px) {{
      .facts {{ grid-template-columns: repeat(3, 1fr); }}
      .fact:nth-child(3n) {{ border-right: none; }}
      .fact:nth-child(-n+3) {{ border-bottom: 1px solid rgba(255,255,255,0.09); }}
      .overview, .two-col {{ grid-template-columns: 1fr; gap: 2.5rem; }}
    }}
    @media (max-width: 700px) {{
      nav {{ padding: 0.8rem 1rem; gap: 0.5rem; }}
      .nav-logo {{ display: none; }}
      .nav-compare {{ display: none; }}
      .nav-back .nb-long {{ display: none; }}
      .nav-back .nb-short {{ display: inline; }}
      .nav-cta {{ padding: 0.6rem 0.95rem; font-size: 0.8rem; }}
      .hero {{ min-height: 50vh; }}
      .hero .hero-img {{ object-position: center 62%; }}
      .hero-inner {{ padding: 3.5rem 1.25rem 2rem; }}
      section, .cta, .disclaimer, footer {{ padding-left: 1.25rem; padding-right: 1.25rem; }}
      section {{ padding-top: 3rem; padding-bottom: 3rem; }}
      .facts {{ grid-template-columns: repeat(2, 1fr); }}
      .fact:nth-child(3n) {{ border-right: 1px solid rgba(255,255,255,0.09); }}
      .fact:nth-child(2n) {{ border-right: none; }}
      .gal, .sibs {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>

<nav>
  <a href="../index.html" class="nav-logo">Condos<em>Around</em></a>
  <a href="../neighbourhoods/dixie-lakeshore.html#townhomes" class="nav-back">&larr; <span class="nb-long">Dixie &amp; Lakeshore</span><span class="nb-short">Back</span></a>
  <a href="../neighbourhoods/dixie-lakeshore.html#compare" class="nav-back nav-compare">Compare townhomes</a>
  <a href="tel:6479240848" class="nav-cta">647-924-0848</a>
</nav>

<header class="hero">
  {hero_pic}
  <div class="hero-inner">
    {status_badge}<div class="hero-builder">{builder} &middot; {area}</div>
    <h1 class="hero-title">{name}</h1>
    <div class="hero-tag">{tagline}</div>
    <div class="hero-addr">{address}</div>
  </div>
  <div class="hero-credit">Artist&rsquo;s concept</div>
</header>

<div class="facts">
{facts}
</div>

<section>
  <div class="overview">
    <div>
      <div class="sec-eyebrow">Overview</div>
      <h2 class="sec-title">About <em>{name}</em></h2>
{intro}
    </div>
    <div>
      <h3 class="side-title">Getting around</h3>
{commute}
    </div>
  </div>
</section>

<section>
  <div class="sec-eyebrow">Pricing</div>
  <h2 class="sec-title">Models &amp; <em>prices</em></h2>
{tables}{plans_link}
</section>

<section>
  <div class="two-col">
    <div>
      <div class="sec-eyebrow">What&rsquo;s included</div>
      <h2 class="sec-title">Current <em>incentives</em></h2>
      <ul class="inc-list">
{incentives}
      </ul>
    </div>
    <div>
{deposit}
    </div>
  </div>
</section>

<section>
  <div class="sec-eyebrow">Gallery</div>
  <h2 class="sec-title">Renderings</h2>
  <div class="gal">
{gallery}
  </div>
</section>

<section>
  <div class="sec-eyebrow">Nearby</div>
  <h2 class="sec-title">Compare with the <em>other two</em></h2>
  <div class="sibs">
{others}
  </div>
</section>

<div class="cta">
  <div class="cta-h">Interested in {name}?<br><em>Let&rsquo;s talk floor plans.</em></div>
  <div class="cta-actions">
    <a href="tel:6479240848" class="btn-w">Call 647-924-0848</a>
    <a href="sms:6479240848?body=Hi%2C%20I%27d%20like%20information%20on%20{name_url}." class="btn-o">Text for details</a>
  </div>
</div>

<div class="disclaimer">
  Source: {source} Renderings are artist&rsquo;s concept. Prices, sizes, incentives,
  specifications and availability are subject to change without notice and may not reflect
  the current release. Any GST/HST rebate reference depends on purchaser eligibility and on
  legislation being enacted as anticipated. Confirm all figures with the sales office before
  relying on them. Brokers protected. E.&amp;O.E.
</div>

<footer>
  <div class="footer-logo">Condos<em>Around</em></div>
  <div>CondosAround.com &middot; &copy; 2025</div>
</footer>

<script src="../js/save.js"></script>
<script src="../js/sofia.js"></script>
<script src="../js/protect.js"></script>
</body>
</html>
"""


def main():
    for slug in ORDER:
        path = os.path.join(OUT_DIR, slug + ".html")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(slug, PROJECTS[slug]))
        print("  wrote buildings/%s.html  (%.1f KB)" % (slug, os.path.getsize(path) / 1024))


if __name__ == "__main__":
    main()
