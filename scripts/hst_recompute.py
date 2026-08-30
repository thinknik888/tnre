#!/usr/bin/env python3
"""Recompute HST rebate values from 0.87 -> 0.90. Dry-run by default.
Run with --apply to write changes.
Rules:
  generic rebate = round_half_up(base * factor)
  XO2 rebate     = round_half_up(base * factor + 24000)
  base = promo (if present & non-null) else price/start/data-price/last-$-in-fp-price
Recompute (not scale) so pre-existing manual errors get corrected.
"""
import re, sys, math, os

APPLY = "--apply" in sys.argv
OLD, NEW = 0.87, 0.90

def rhu(x):  # round half up (matches JS Math.round for positives)
    return int(math.floor(x + 0.5))

def money(n):
    return "${:,}".format(n)

def parse_money(s):
    return int(s.replace("$", "").replace(",", ""))

anomalies = []
summary = []

# ---- Group 3 files: recompute hardcoded values (JS objects + DOM cards) ----
GROUP3 = [
    "buildings/101-spadina.html","buildings/8-temple.html","buildings/akra.html",
    "buildings/concord-canada-house.html","buildings/exhale.html","buildings/the-grand.html",
    "buildings/universal-city-east.html","buildings/xo2.html",
    "neighbourhoods/cn-tower.html","neighbourhoods/dixie-lakeshore.html",
    "neighbourhoods/liberty-village.html","neighbourhoods/pickering-go.html",
    "neighbourhoods/yonge-eglinton.html",
    "pages/under-1800k.html","pages/1500-to-6000-sqft.html",
]

REBATE_LABEL = r'(?:After )?HST Rebate(?: Price)? '

def is_xo2_file(path):
    return os.path.basename(path) == "xo2.html"

def js_base(line):
    m = re.search(r"promo:\s*'\$([\d,]+)'", line)
    if m: return parse_money(m.group(1))
    m = re.search(r"\bprice:\s*'\$([\d,]+)'", line)
    if m: return parse_money(m.group(1))
    m = re.search(r"\bstart:\s*'\$([\d,]+)'", line)
    if m: return parse_money(m.group(1))
    return None

def js_is_xo2(line, path):
    return is_xo2_file(path) or "building: 'XO2" in line or "building: EAST" == "nope"

def dom_base(block):
    m = re.search(r'fp-price-promo">\$([\d,]+)', block)
    if m: return parse_money(m.group(1))
    m = re.search(r'data-price="(\d+)"', block)
    if m: return int(m.group(1))
    m = re.search(r'<span class="fp-price">([^<]*)</span>', block)
    if m:
        nums = re.findall(r'\$([\d,]+)', m.group(1))
        if nums: return parse_money(nums[-1])
    return None

def dom_is_xo2(block, path):
    return (is_xo2_file(path) or 'data-building="XO2"' in block
            or 'fp-building-tag">XO2' in block)

for path in GROUP3:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    js_n = dom_n = 0

    # (a) JS-object rebate fields
    def js_sub(m):
        global js_n
        line = m.group(0)
        if "rebate: null" in line: return line
        base = js_base(line)
        if base is None: return line
        xo2 = js_is_xo2(line, path)
        old = parse_money(re.search(r"rebate:\s*'\$([\d,]+)'", line).group(1))
        exp_old = rhu(base*OLD + (24000 if xo2 else 0))
        new = rhu(base*NEW + (24000 if xo2 else 0))
        if abs(old-exp_old) > 1:
            anomalies.append(f"{path} [JS] base={base} xo2={xo2} old={old} expected_old={exp_old} -> new={new}")
        js_n += 1
        return re.sub(r"(rebate:\s*')\$[\d,]+(')", r"\g<1>"+money(new)+r"\g<2>", line)
    # operate line by line for JS objects
    out_lines = []
    for ln in text.split("\n"):
        if re.search(r"rebate:\s*'\$[\d,]+'", ln):
            ln = js_sub(re.match(r".*", ln, re.S))
        out_lines.append(ln)
    text = "\n".join(out_lines)

    # (b) DOM fp-rebate spans (split into card blocks)
    parts = re.split(r'(?=<div class="fp-card")', text)
    for i, block in enumerate(parts):
        rb = re.search(r'(<span class="fp-rebate"><span class="fp-rebate-label">'+REBATE_LABEL+r'</span>\$)([\d,]+)(</span>)', block)
        if not rb: continue
        base = dom_base(block)
        if base is None:
            anomalies.append(f"{path} [DOM] NO BASE FOUND near rebate {rb.group(2)}")
            continue
        xo2 = dom_is_xo2(block, path)
        old = parse_money(rb.group(2))
        exp_old = rhu(base*OLD + (24000 if xo2 else 0))
        new = rhu(base*NEW + (24000 if xo2 else 0))
        if abs(old-exp_old) > 1:
            anomalies.append(f"{path} [DOM] base={base} xo2={xo2} old={old} expected_old={exp_old} -> new={new}")
        # group(1) already ends with the literal '$'; insert digits only (no extra '$')
        parts[i] = block[:rb.start()] + rb.group(1) + "{:,}".format(new) + rb.group(3) + block[rb.end():]
        dom_n += 1
    text = "".join(parts)

    summary.append(f"{path:45s} JS={js_n:3d} DOM={dom_n:3d}")
    if APPLY:
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)

# ---- Group 1: live JS calculators (swap factor) ----
GROUP1 = ["neighbourhoods/yorkville.html","homes/caivan-riverview/index.html"]
for path in GROUP1:
    with open(path, encoding="utf-8") as f: text = f.read()
    n = text.count("* 0.87")
    text = text.replace("* 0.87", "* 0.90")
    summary.append(f"{path:45s} JS-calc 0.87->0.90 x{n}")
    if APPLY:
        with open(path,"w",encoding="utf-8") as f: f.write(text)

# ---- Group 2: label/disclaimer text ----
GROUP2 = ["buildings/xo2.html","buildings/8-temple.html","pages/under-1800k.html"]
for path in GROUP2:
    with open(path, encoding="utf-8") as f: text = f.read()
    n = text.count("0.87")
    text = text.replace("&times; 0.87","&times; 0.90").replace("× 0.87","× 0.90")
    summary.append(f"{path:45s} label 0.87->0.90 x{n}")
    if APPLY:
        with open(path,"w",encoding="utf-8") as f: f.write(text)

print("MODE:", "APPLY" if APPLY else "DRY-RUN")
print("\n".join(summary))
print(f"\nANOMALIES ({len(anomalies)}):")
for a in anomalies: print("  ", a)
