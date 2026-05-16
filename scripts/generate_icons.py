#!/usr/bin/env python3
"""Generate Android mipmap icons from assets/logo.png using Pillow."""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow is required. Run: pip install Pillow")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
RES_DIR = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
LOGO_PATH = PROJECT_ROOT / "assets" / "logo.png"

BG_COLOR = (13, 27, 42, 255)  # #0D1B2A - app dark background

MIPMAP_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def make_square_on_bg(img: Image.Image, size: int) -> Image.Image:
    """Resize image to square, composited on the brand background color."""
    canvas = Image.new("RGBA", (size, size), BG_COLOR)
    resized = img.resize((size, size), Image.LANCZOS)
    canvas.paste(resized, (0, 0), resized)
    return canvas.convert("RGB")


def make_circle_on_bg(img: Image.Image, size: int) -> Image.Image:
    """Circular icon: image composited on brand background, then clipped to circle."""
    canvas = Image.new("RGBA", (size, size), BG_COLOR)
    resized = img.resize((size, size), Image.LANCZOS)
    canvas.paste(resized, (0, 0), resized)

    # Apply circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)

    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(canvas, (0, 0), mask)
    final = Image.new("RGB", (size, size), BG_COLOR[:3])
    final.paste(result, (0, 0), result)
    return final


def make_foreground(img: Image.Image, fg_size: int) -> Image.Image:
    """Adaptive icon foreground: centered at ~72% with padding for safe zone."""
    canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    inner_size = int(fg_size * 0.72)
    inner = img.resize((inner_size, inner_size), Image.LANCZOS)
    offset = (fg_size - inner_size) // 2
    canvas.paste(inner, (offset, offset), inner)
    return canvas


def main():
    if not LOGO_PATH.exists():
        print(f"Error: logo not found at {LOGO_PATH}")
        sys.exit(1)

    logo = Image.open(LOGO_PATH).convert("RGBA")
    print(f"Loaded logo: {logo.size[0]}x{logo.size[1]}px")
    print()

    # Standard mipmap icons
    for density, size in MIPMAP_SIZES.items():
        out_dir = RES_DIR / density
        out_dir.mkdir(parents=True, exist_ok=True)

        make_square_on_bg(logo, size).save(out_dir / "ic_launcher.png", "PNG")
        make_circle_on_bg(logo, size).save(out_dir / "ic_launcher_round.png", "PNG")
        print(f"  {density}: ic_launcher.png + ic_launcher_round.png ({size}px)")

    print()

    # Adaptive icon foreground layers
    for density, fg_size in FOREGROUND_SIZES.items():
        out_dir = RES_DIR / density
        out_dir.mkdir(parents=True, exist_ok=True)
        make_foreground(logo, fg_size).save(out_dir / "ic_launcher_foreground.png", "PNG")
        print(f"  {density}: ic_launcher_foreground.png ({fg_size}px)")

    print()

    # mipmap-anydpi-v26 adaptive icon XML
    anydpi_dir = RES_DIR / "mipmap-anydpi-v26"
    anydpi_dir.mkdir(parents=True, exist_ok=True)

    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n'
    )
    (anydpi_dir / "ic_launcher.xml").write_text(adaptive_xml, encoding="utf-8")
    (anydpi_dir / "ic_launcher_round.xml").write_text(adaptive_xml, encoding="utf-8")
    print("  mipmap-anydpi-v26: ic_launcher.xml + ic_launcher_round.xml")

    # colors.xml with launcher background color
    values_dir = RES_DIR / "values"
    values_dir.mkdir(parents=True, exist_ok=True)
    colors_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <color name="ic_launcher_background">#0D1B2A</color>\n'
        '</resources>\n'
    )
    (values_dir / "colors.xml").write_text(colors_xml, encoding="utf-8")
    print("  values/colors.xml: ic_launcher_background=#0D1B2A")

    print()
    print("All icons generated successfully.")


if __name__ == "__main__":
    main()
