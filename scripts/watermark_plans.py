"""Bake a centered diagonal watermark onto floor plan JPGs as `-wm.jpg` siblings.

Reads a newline-delimited list of source paths from argv[1] (or from /tmp/floor-plan-jpgs.txt).
Never overwrites originals. Skips files that already end in `-wm`.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys

LINE1 = "condosaround.com"
LINE2 = "Nik  /  647-924-0848"
ANGLE = 30
OPACITY = 55  # 0-255
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"


def watermark(src: Path, dst: Path) -> None:
    base = Image.open(src).convert("RGBA")
    w, h = base.size
    font_size = int(w * 0.06)
    font_bold = ImageFont.truetype(FONT_BOLD, font_size)
    font_reg = ImageFont.truetype(FONT_REG, int(font_size * 0.75))

    pad = int(max(w, h) * 1.5)
    layer = Image.new("RGBA", (w + pad, h + pad), (255, 255, 255, 0))
    ld = ImageDraw.Draw(layer)

    b1 = ld.textbbox((0, 0), LINE1, font=font_bold)
    b2 = ld.textbbox((0, 0), LINE2, font=font_reg)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    gap = int(font_size * 0.25)
    block_h = h1 + gap + h2

    cx = (w + pad) // 2
    cy = (h + pad) // 2 - block_h // 2

    ld.text((cx - w1 // 2, cy), LINE1, fill=(20, 20, 20, OPACITY), font=font_bold)
    ld.text((cx - w2 // 2, cy + h1 + gap), LINE2, fill=(20, 20, 20, OPACITY), font=font_reg)

    layer = layer.rotate(ANGLE, resample=Image.BICUBIC, expand=False)
    lx = (layer.width - w) // 2
    ly = (layer.height - h) // 2
    layer = layer.crop((lx, ly, lx + w, ly + h))

    out = Image.alpha_composite(base, layer).convert("RGB")
    out.save(dst, quality=85, optimize=True)
    print(f"  ✓ {dst.name}")


def main() -> None:
    list_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/floor-plan-jpgs.txt"
    with open(list_path) as f:
        sources = [Path(line.strip()) for line in f if line.strip()]
    sources = [p for p in sources if p.exists() and not p.stem.endswith("-wm")]
    print(f"Watermarking {len(sources)} floor plan JPGs")
    skipped = 0
    created = 0
    for src in sources:
        dst = src.with_name(src.stem + "-wm.jpg")
        if dst.exists():
            skipped += 1
            continue
        try:
            watermark(src, dst)
            created += 1
        except Exception as e:
            print(f"  ✗ {src.name}: {e}")
    print(f"\nDone. Created {created}, skipped {skipped} (already existed).")


if __name__ == "__main__":
    main()
