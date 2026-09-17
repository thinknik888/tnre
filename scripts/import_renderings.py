#!/usr/bin/env python3
"""
Import builder marketing images into buildings/images/towns/ as web-ready files.

    python3 scripts/import_renderings.py scripts/manifests/south-banks.json

For every entry the repo receives:
    <name>.jpg              1600px JPEG  -- <img src> fallback only
    <name>-<w>.avif/.webp   responsive ladder -- what browsers actually download

The multi-megabyte masters stay wherever they are (usually ~/Downloads); only
the compressed derivatives are committed.

Manifest format (JSON):
    {
      "source_dir": "~/Downloads/SOUTH BANKS MARKETING ASSETS",
      "images": [
        {"name": "south-banks-hero", "file": "RENDERINGS/EXTERIOR.png",
         "widths": "hero", "crop": [0.0, 0.33, 1.0, 0.80]},
        {"name": "south-banks-rooftop", "file": "RENDERINGS/ROOFTOP TERRACE.png"}
      ]
    }

  widths  "hero" (480..2560), "card" (480..1280, default) or an explicit list
  crop    optional [left, top, right, bottom] as fractions of the source image
  pdf     true to rasterise page 1 of a PDF instead of opening an image
"""

import json
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install --upgrade pillow")

Image.MAX_IMAGE_PIXELS = None  # builder renderings are routinely >100 MP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "buildings", "images", "towns")

LADDERS = {"hero": [480, 800, 1280, 1920, 2560], "card": [480, 800, 1280]}
FALLBACK_W = 1600


def load(path, is_pdf):
    if not is_pdf:
        im = Image.open(path)
        im.load()
        return im
    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("PyMuPDF is required for PDF sources:  python3 -m pip install pymupdf")
    page = fitz.open(path)[0]
    scale = 3000 / max(page.rect.width, page.rect.height)
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    manifest = json.load(open(sys.argv[1], encoding="utf-8"))
    src_dir = os.path.expanduser(manifest["source_dir"])
    os.makedirs(DST, exist_ok=True)

    total_master = total_repo = 0
    print("%-28s %9s %9s %10s" % ("name", "master", "fallback", "avif@max"))
    print("-" * 60)
    for entry in manifest["images"]:
        name = entry["name"]
        src = os.path.join(src_dir, entry["file"])
        if not os.path.exists(src):
            print("%-28s  ! master not found: %s" % (name, entry["file"]))
            continue

        im = load(src, entry.get("pdf", False))
        if im.mode != "RGB":
            # flatten transparency onto white rather than black
            if "A" in im.getbands():
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im, mask=im.getchannel("A"))
                im = bg
            else:
                im = im.convert("RGB")
        if entry.get("crop"):
            l, t, r, b = entry["crop"]
            im = im.crop((round(im.width * l), round(im.height * t),
                          round(im.width * r), round(im.height * b)))

        widths = entry.get("widths", "card")
        widths = LADDERS[widths] if isinstance(widths, str) else widths

        def at(w):
            w = min(w, im.width)
            return im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)

        fallback = os.path.join(DST, name + ".jpg")
        at(FALLBACK_W).save(fallback, "JPEG", quality=82, optimize=True, progressive=True)
        repo = os.path.getsize(fallback)
        biggest = 0
        for w in widths:
            frame = at(w)
            a = os.path.join(DST, "%s-%d.avif" % (name, w))
            p = os.path.join(DST, "%s-%d.webp" % (name, w))
            frame.save(a, "AVIF", quality=55)
            frame.save(p, "WEBP", quality=80, method=6)
            repo += os.path.getsize(a) + os.path.getsize(p)
            biggest = os.path.getsize(a)

        total_master += os.path.getsize(src)
        total_repo += repo
        print("%-28s %8.1fM %8.0fK %9.0fK" % (
            name, os.path.getsize(src) / 1048576,
            os.path.getsize(fallback) / 1024, biggest / 1024))

    print("-" * 60)
    print("masters (left where they are): %.0f MB" % (total_master / 1048576))
    print("added to repo (all variants):  %.1f MB" % (total_repo / 1048576))


if __name__ == "__main__":
    main()
