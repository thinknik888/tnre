#!/usr/bin/env python3
"""
Site-wide price emphasis on the legacy floor plan cards (fp-card).

    python3 scripts/apply_price_emphasis.py

Where a card carries a net-of-HST figure, that figure leads in navy bold and the
list / promotional price above it drops to plain text. Cards with no HST line
are left exactly as they were. Idempotent: re-running replaces the marked block.
"""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START, END = "/* price-emphasis:start */", "/* price-emphasis:end */"
CSS = START + """
    .fp-rebate { color: #002244 !important; font-weight: 600 !important; font-size: 0.95rem !important; }
    .fp-rebate-label { font-weight: 400 !important; font-size: 0.66rem; letter-spacing: 0.02em; color: var(--text-muted, #8a8a84) !important; }
    .fp-meta:has(.fp-rebate) .fp-price,
    .fp-meta:has(.fp-rebate) .fp-price-promo { font-family: inherit !important; font-weight: 400 !important; font-size: 0.82rem !important; color: var(--text-mid, #4a4a46) !important; }
    """ + END

changed = 0
for path in sorted(glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)):
    if "node_modules" in path or "_to_delete" in path:
        continue
    src = open(path, encoding="utf-8").read()
    if 'class="fp-rebate"' not in src:
        continue
    new = src
    if START in new:
        new = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: CSS, new, flags=re.S)
    else:
        new = new.replace("</style>", "    " + CSS + "\n  </style>", 1)
    # say what the figure is: the price net of the rebate, not the rebate itself
    new = new.replace('<span class="fp-rebate-label">HST Rebate </span>', '<span class="fp-rebate-label">Net of HST rebate </span>')
    if new != src:
        open(path, "w", encoding="utf-8").write(new)
        changed += 1
        print("  updated", os.path.relpath(path, ROOT))
print("%d page(s) updated" % changed)
