#!/usr/bin/env python3
"""
Rewrite floor-plan card <img> tags into <picture> with AVIF/WebP sources.

    python3 scripts/apply_picture_tags.py                # apply
    python3 scripts/apply_picture_tags.py --dry-run      # report only

Only touches single-line ".fp-image" / ".fp-row-image" cards whose derivatives
exist on disk. The original .jpg stays as the <img src> fallback, so:
  * js/save.js keeps finding .fp-image to inject its save button,
  * js/modal-touch.js's ".fp-image img" CSS still matches,
  * the modal and floor-plan-viewer keep working off .jpg paths.

Also drops the empty src="" on #modal-img, which otherwise makes the browser
re-request the whole HTML page as an image on every load.
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIDTHS = [600, 1200]
SIZES = "(max-width: 900px) 100vw, 46vw"

CARD_IMG = re.compile(
    r'(?P<open><div class="fp-(?:row-)?image"[^>]*>)'
    r'\s*(?P<img><img\s+src="(?P<src>[^"]+\.(?:jpg|jpeg|png))"(?P<rest>[^>]*?)/?>)\s*'
    r'(?P<close></div>)',
    re.IGNORECASE)

MODAL_IMG = re.compile(r'<img([^>]*?)\sid="modal-img"\ssrc=""([^>]*?)>', re.IGNORECASE)
MODAL_IMG2 = re.compile(r'<img([^>]*?)\ssrc=""([^>]*?)\sid="modal-img"([^>]*?)>', re.IGNORECASE)


def derivatives_for(page_path, src):
    """Return (avif_srcset, webp_srcset) if derivatives exist, else (None, None)."""
    base_dir = os.path.dirname(page_path)
    stem, _ext = os.path.splitext(src)
    avif, webp = [], []
    for w in WIDTHS:
        for ext, bucket in ((".avif", avif), (".webp", webp)):
            rel = "%s-%d%s" % (stem, w, ext)
            if os.path.exists(os.path.join(base_dir, rel)):
                bucket.append("%s %dw" % (rel, w))
    return (", ".join(avif) or None, ", ".join(webp) or None)


def convert(page_path, text):
    stats = {"wrapped": 0, "skipped": 0, "modal": 0}

    def repl(m):
        src = m.group("src")
        avif, webp = derivatives_for(page_path, src)
        if not avif and not webp:
            stats["skipped"] += 1
            return m.group(0)
        rest = m.group("rest").rstrip()
        if "decoding=" not in rest:
            rest += ' decoding="async"'
        sources = ""
        if avif:
            sources += '<source type="image/avif" sizes="%s" srcset="%s">' % (SIZES, avif)
        if webp:
            sources += '<source type="image/webp" sizes="%s" srcset="%s">' % (SIZES, webp)
        stats["wrapped"] += 1
        return '%s<picture>%s<img src="%s"%s></picture>%s' % (
            m.group("open"), sources, src, rest, m.group("close"))

    out = CARD_IMG.sub(repl, text)

    def modal_fix(m):
        stats["modal"] += 1
        return "<img%s id=\"modal-img\"%s>" % (m.group(1), m.group(2))

    out, n = MODAL_IMG.subn(modal_fix, out)
    out = MODAL_IMG2.sub(
        lambda m: (stats.__setitem__("modal", stats["modal"] + 1)
                   or '<img%s%s id="modal-img"%s>' % (m.group(1), m.group(2), m.group(3))),
        out)
    return out, stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("paths", nargs="*",
                    default=["neighbourhoods", "buildings", "pages", "rentals", "homes"])
    args = ap.parse_args()

    pages = []
    for p in args.paths:
        full = os.path.join(ROOT, p)
        if os.path.isfile(full) and full.endswith(".html"):
            pages.append(full)
        for root, _d, files in os.walk(full):
            pages += [os.path.join(root, f) for f in files if f.endswith(".html")]

    tot = {"wrapped": 0, "skipped": 0, "modal": 0, "files": 0}
    for page in sorted(set(pages)):
        text = open(page, encoding="utf-8").read()
        new, st = convert(page, text)
        if new == text:
            continue
        tot["files"] += 1
        for k in ("wrapped", "skipped", "modal"):
            tot[k] += st[k]
        rel = os.path.relpath(page, ROOT)
        print("  %-52s +%3d picture  %s" % (
            rel, st["wrapped"], "modal-src fixed" if st["modal"] else ""))
        if not args.dry_run:
            open(page, "w", encoding="utf-8").write(new)

    print("\n%s %d file(s): %d <img> wrapped, %d skipped (no derivatives), %d modal src cleared"
          % ("would update" if args.dry_run else "updated",
             tot["files"], tot["wrapped"], tot["skipped"], tot["modal"]))


if __name__ == "__main__":
    main()
