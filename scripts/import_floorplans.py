#!/usr/bin/env python3
"""
Render every floor plan in a builder's plan book into web-ready images.

    python3 scripts/import_floorplans.py scripts/manifests/westshore-plans.json

The manifest lists each plan with the PDF page it sits on and which half of
the spread ("L", "R", or "F" for a plan that spans the whole spread) -- or an
"image" path for a ready-made plan card -- plus the facts the page shows
(type, sq ft, beds, baths, level).  For every plan the
repo receives, under <out>/:

    <slug>.jpg              1280px JPEG fallback
    <slug>-<w>.avif/.webp   responsive ladder (480/800/1280, +1920 for spreads)
    <slug>-lock.webp        64px blurred stand-in shown before the plans unlock

The crop drops the builder's navy header band and the disclaimer line; the
page itself carries those as text.
"""
import json
import os
import sys

from PIL import Image, ImageFilter

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF is required:  python3 -m pip install pymupdf")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def render(doc, page_no, dpi):
    page = doc[page_no - 1]
    pix = page.get_pixmap(dpi=dpi, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    m = json.load(open(sys.argv[1], encoding="utf-8"))
    docs = {}

    def doc_for(path):
        path = os.path.expanduser(path)
        if path not in docs:
            docs[path] = fitz.open(path)
        return docs[path]

    out = os.path.join(ROOT, m["out"])
    os.makedirs(out, exist_ok=True)
    crop = m.get("crop", {"top": 0.0, "bottom": 1.0})
    top, bottom = crop["top"], crop["bottom"]
    left, right = crop.get("left", 0.0), crop.get("right", 1.0)

    cache = {}
    total = 0
    for p in m["plans"]:
        if p.get("image"):
            # a ready-made plan image (e.g. the builder's own plan card): used whole, unless
            # "crop": true asks for the manifest crop and margin trim like a PDF page
            plan = Image.open(os.path.join(ROOT, p["image"])).convert("RGB")
            if p.get("crop"):
                w, h = plan.size
                plan = plan.crop((round(w * left), round(h * top), round(w * right), round(h * bottom)))
                bbox = Image.eval(plan.convert("L"), lambda v: 0 if v > 245 else 255).getbbox()
                if bbox:
                    pad = 24
                    plan = plan.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                                      min(plan.width, bbox[2] + pad), min(plan.height, bbox[3] + pad)))
        else:
            # a plan may come from its own PDF ("pdf" on the entry) instead of the shared book
            key = (p.get("pdf") or m["pdf"], p["page"])
            if key not in cache:
                cache = {key: render(doc_for(key[0]), p["page"], 200)}   # one page at a time
            im = cache[key]
            w, h = im.size
            x0, x1 = {"L": (0.0, 0.5), "R": (0.5, 1.0), "F": (0.0, 1.0)}[p["half"]]
            # optional side crop (e.g. a builder's info column beside every drawing)
            x0, x1 = left + (right - left) * x0, left + (right - left) * x1
            plan = im.crop((round(w * x0), round(h * top), round(w * x1), round(h * bottom)))
            # trim white margins, keeping a little breathing room
            bbox = Image.eval(plan.convert("L"), lambda v: 0 if v > 245 else 255).getbbox()
            if bbox:
                pad = 24
                plan = plan.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                                  min(plan.width, bbox[2] + pad), min(plan.height, bbox[3] + pad)))

        widths = [480, 800, 1280] + ([1920] if p.get("half", "F") == "F" else [])

        def at(width):
            width = min(width, plan.width)
            return plan.resize((width, max(1, round(plan.height * width / plan.width))), Image.LANCZOS)

        slug = p["slug"]
        size = 0
        fb = os.path.join(out, slug + ".jpg")
        at(1280).save(fb, "JPEG", quality=78, optimize=True, progressive=True)
        size += os.path.getsize(fb)
        for width in widths:
            frame = at(width)
            a = os.path.join(out, "%s-%d.avif" % (slug, width))
            wp = os.path.join(out, "%s-%d.webp" % (slug, width))
            frame.save(a, "AVIF", quality=60)
            frame.save(wp, "WEBP", quality=82, method=6)
            size += os.path.getsize(a) + os.path.getsize(wp)
        lock = at(160).filter(ImageFilter.GaussianBlur(3)).resize((64, max(1, round(plan.height * 64 / plan.width))), Image.LANCZOS)
        lock.save(os.path.join(out, slug + "-lock.webp"), "WEBP", quality=55, method=6)
        total += size
        print("  %-24s %5dx%-5d %5.0f KB all variants" % (slug, plan.width, plan.height, size / 1024))
    print("%d plans, %.1f MB added to the repo" % (len(m["plans"]), total / 1048576))


if __name__ == "__main__":
    main()
