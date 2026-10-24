#!/usr/bin/env python3
"""
Build js/plans-index.json from the floor-plan browser pages.

    python3 scripts/build_plans_index.py

The browsers in pages/ are the source of truth for plan data; this pulls each
card's facts into one compact index so the homepage can run a live filter
without shipping 240 cards of markup.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = ["pages/under-1800k.html", "pages/1500-to-6000-sqft.html"]

HOOD = {}
for hood, blds in {
    'Liberty Village': ['XO2', '8 Temple', '8 Temple · Combo'],
    'Pickering GO': ['Universal City East', 'The Grand'],
    'Dixie & Lakeshore': ['Exhale Residences'],
    'Yorkville': ['AKRA', '11 Yorkville', '50 Scollard', 'The Bedford'],
    'Forest Hill': ['South Forest Hill'],
    'CN Tower': ['101 Spadina', 'The Well', 'Concord Canada House', 'King Toronto',
                 'King Toronto Penthouse'],
    'Toronto Waterfront East': ['Aqualuna'],
    'Square One': ['Alba'],
}.items():
    for b in blds:
        HOOD[b] = hood

PAGE = {
    'XO2': 'buildings/xo2.html', '8 Temple': 'buildings/8-temple.html',
    'Universal City East': 'buildings/universal-city-east.html',
    'The Grand': 'buildings/the-grand.html', 'Exhale Residences': 'buildings/exhale.html',
    'AKRA': 'buildings/akra.html', 'South Forest Hill': 'buildings/south-forest-hill.html',
    '101 Spadina': 'buildings/101-spadina.html', 'The Well': 'buildings/the-well.html',
    'Concord Canada House': 'buildings/concord-canada-house.html',
    'King Toronto': 'buildings/king-toronto.html',
    'King Toronto Penthouse': 'buildings/king-toronto-penthouse.html',
    '11 Yorkville': 'buildings/11-yorkville.html', '50 Scollard': 'buildings/50-scollard.html',
    'The Bedford': 'buildings/the-bedford.html', 'Aqualuna': 'buildings/aqualuna.html',
    '8 Temple · Combo': 'buildings/8-temple.html', 'Alba': 'buildings/alba.html',
}

CARD = re.compile(
    r'<div class="fp-card"[^>]*?data-building="(?P<b>[^"]*)"[^>]*?'
    r'data-closing="(?P<c>[^"]*)"[^>]*?data-sqft="(?P<s>[^"]*)"[^>]*?'
    r'data-price="(?P<p>[^"]*)"[^>]*?>(?P<body>.*?)(?=<div class="fp-card"|</div>\s*</div>\s*</(?:section|div)>)',
    re.S)

def pick(body, cls):
    m = re.search(r'class="%s"[^>]*>(.*?)</' % cls, body, re.S)
    return re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''

def unesc(t):
    for a, b in [('&amp;', '&'), ('&middot;', '·'), ('&ndash;', '–'), ('&mdash;', '—'),
                 ('&rsquo;', '’'), ('&nbsp;', ' '), ('&amp;', '&')]:
        t = t.replace(a, b)
    return re.sub(r'\s+', ' ', t).strip()

seen, plans = set(), []
for rel in SRC:
    html = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    for m in CARD.finditer(html):
        b, body = unesc(m.group('b')), m.group('body')
        suite = unesc(pick(body, 'fp-suite'))
        sqft = int(m.group('s') or 0)
        key = (b, suite, sqft)
        if key in seen or not suite:
            continue
        seen.add(key)
        # HST state. The "Net of HST rebate" label is reliable (every one of those
        # is at or under $1.49M). "Contact for HST calculation" is used as a blanket
        # on the large-plan page — it tags an $18M penthouse — so above $1.5M the
        # $1.8M cutoff the site states on the homepage decides it instead.
        price = int(m.group('p') or 0)
        if 'Net of HST rebate' in body:
            hst = 2                       # full rebate, net price shown
        elif price and price < 1800000:
            hst = 1                       # phased rebate, needs a calculation
        else:
            hst = 0                       # over $1.8M, or no price published
        img = re.search(r'<img src="\.\./([^"]+)"', body)
        ipath = img.group(1) if img else ''
        stem = re.sub(r'\.(jpg|jpeg|png)$', '', ipath)
        has600 = bool(stem) and os.path.exists(os.path.join(ROOT, stem + '-600.avif'))
        plans.append({
            'b': b, 'h': HOOD.get(b, ''), 'n': suite,
            't': unesc(pick(body, 'fp-type')),
            's': sqft, 'p': int(m.group('p') or 0),
            'c': m.group('c'),
            'img': ipath, 'v': 1 if has600 else 0, 'hst': hst,
            'u': PAGE.get(b, ''),
        })

plans.sort(key=lambda x: (x['h'], x['b'], x['s']))
out = os.path.join(ROOT, 'js', 'plans-index.json')
json.dump(plans, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('%d plans -> js/plans-index.json (%.0f KB)' % (len(plans), os.path.getsize(out) / 1024))
hoods = {}
for p in plans:
    hoods[p['h'] or '(unmapped)'] = hoods.get(p['h'] or '(unmapped)', 0) + 1
for k, v in sorted(hoods.items(), key=lambda kv: -kv[1]):
    print('  %-20s %3d' % (k, v))
missing = sorted({p['b'] for p in plans if not p['u']})
if missing:
    print('  no building page:', ', '.join(missing))
