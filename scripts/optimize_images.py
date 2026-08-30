#!/usr/bin/env python3
"""
Generate responsive AVIF + WebP derivatives beside source JPEG/PNG images.

The originals are never modified or deleted -- they stay as the <img src>
fallback, which also keeps js/modal-full-plan.js's "-wm.jpg" derivation working.

Output naming:  hero.jpg  ->  hero-800.avif, hero-800.webp, hero-1600.avif, ...

Usage
  python3 scripts/optimize_images.py PATH [PATH ...] [options]

    PATH            a file, or a directory (non-recursive unless -r)

  -w, --widths      comma-separated target widths (default: 600,1200)
  -r, --recursive   descend into subdirectories
  -x, --exclude     substring; skip any source whose name contains it
                    (repeatable; '-wm' is always excluded)
      --force       re-encode even if derivatives are newer than the source
      --dry-run     report what would happen, write nothing

Examples
  # floor-plan cards (line art, portrait)
  python3 scripts/optimize_images.py neighbourhoods/images -w 600,1200

  # photographic renderings that also back a full-bleed hero
  python3 scripts/optimize_images.py buildings/images/towns -w 480,800,1280,1920,2560
"""

import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install --upgrade pillow")

SOURCE_EXT = {".jpg", ".jpeg", ".png"}
ALWAYS_EXCLUDE = ("-wm",)

# Quality settings. AVIF ~55 and WebP ~80 are visually transparent for both
# photographic renderings and line-art floor plans at these display sizes.
AVIF_KW = {"quality": 55}
WEBP_KW = {"quality": 80, "method": 6}


def human(n):
    return "%.0f KB" % (n / 1024.0) if n < 1024 * 1024 else "%.2f MB" % (n / 1048576.0)


def collect(paths, recursive, excludes):
    out = []
    for p in paths:
        if os.path.isfile(p):
            out.append(p)
            continue
        if not os.path.isdir(p):
            print("  ! not found: %s" % p, file=sys.stderr)
            continue
        walker = os.walk(p) if recursive else [(p, [], os.listdir(p))]
        for root, _dirs, files in walker:
            for f in files:
                out.append(os.path.join(root, f))

    keep = []
    for f in sorted(set(out)):
        stem, ext = os.path.splitext(os.path.basename(f))
        if ext.lower() not in SOURCE_EXT:
            continue
        if any(e in stem for e in excludes):
            continue
        # Derivatives are only ever .avif/.webp, so the extension filter above
        # already guarantees we never re-ingest our own output.
        keep.append(f)
    return keep


def derive(src, widths, force, dry):
    """Encode one source into its AVIF/WebP ladder. Returns (written, bytes_out)."""
    try:
        im = Image.open(src)
        im.load()
    except Exception as exc:
        print("  ! unreadable %s (%s)" % (src, exc))
        return 0, 0

    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")

    root, _ = os.path.splitext(src)
    src_mtime = os.path.getmtime(src)
    written, total = 0, 0

    for w in widths:
        # Never upscale: a source narrower than the target just yields its own width.
        target = min(w, im.width)
        resized = None
        for fmt, ext, kw in (("AVIF", ".avif", AVIF_KW), ("WEBP", ".webp", WEBP_KW)):
            out = "%s-%d%s" % (root, w, ext)
            if (not force and os.path.exists(out)
                    and os.path.getmtime(out) >= src_mtime):
                total += os.path.getsize(out)
                continue
            if dry:
                written += 1
                continue
            if resized is None:
                h = max(1, round(im.height * target / im.width))
                resized = im.resize((target, h), Image.LANCZOS)
                if fmt == "AVIF" and resized.mode == "RGBA":
                    pass  # AVIF handles alpha
            try:
                payload = resized
                if fmt == "WEBP" and payload.mode == "RGBA":
                    pass
                payload.save(out, fmt, **kw)
            except Exception as exc:
                print("  ! %s failed for %s (%s)" % (fmt, src, exc))
                continue
            written += 1
            total += os.path.getsize(out)

    return written, total


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("paths", nargs="+")
    ap.add_argument("-w", "--widths", default="600,1200")
    ap.add_argument("-r", "--recursive", action="store_true")
    ap.add_argument("-x", "--exclude", action="append", default=[])
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    widths = sorted({int(w) for w in args.widths.split(",") if w.strip()})
    if not widths:
        sys.exit("no widths given")
    excludes = list(ALWAYS_EXCLUDE) + args.exclude

    sources = collect(args.paths, args.recursive, excludes)
    if not sources:
        sys.exit("no source images matched")

    print("%d source image(s), widths %s%s"
          % (len(sources), widths, "  [dry run]" if args.dry_run else ""))

    src_bytes = sum(os.path.getsize(s) for s in sources)
    written = out_bytes = 0
    for s in sources:
        w, b = derive(s, widths, args.force, args.dry_run)
        written += w
        out_bytes += b

    print("\n  originals      %s across %d file(s)  (untouched)"
          % (human(src_bytes), len(sources)))
    print("  derivatives    %s  (%d file(s) written this run)"
          % (human(out_bytes), written))
    if src_bytes and out_bytes and not args.dry_run:
        # Compare like for like: one served variant per source, largest width.
        served = 0
        for s in sources:
            root, _ = os.path.splitext(s)
            cand = "%s-%d.avif" % (root, widths[-1])
            served += os.path.getsize(cand) if os.path.exists(cand) else os.path.getsize(s)
        print("  largest-variant payload %s vs %s original  (%.0f%% smaller)"
              % (human(served), human(src_bytes), (1 - served / src_bytes) * 100))


if __name__ == "__main__":
    main()
