#!/usr/bin/env python3
"""Validate CDIdle chroma, alpha, or opaque raster assets."""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError as error:
    raise SystemExit("Pillow is required: install the dependency used by imagegen chroma removal.") from error


def parse_size(value: str) -> tuple[int, int]:
    try:
        width, height = value.lower().split("x", 1)
        return int(width), int(height)
    except ValueError as error:
        raise argparse.ArgumentTypeError("expected WIDTHxHEIGHT") from error


def parse_color(value: str) -> tuple[int, int, int]:
    raw = value.removeprefix("#")
    if len(raw) != 6:
        raise argparse.ArgumentTypeError("expected a color such as #00ff00")
    try:
        return tuple(int(raw[index:index + 2], 16) for index in (0, 2, 4))  # type: ignore[return-value]
    except ValueError as error:
        raise argparse.ArgumentTypeError("invalid hexadecimal color") from error


def distance(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def border_pixels(image: Image.Image) -> list[tuple[int, int, int]]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    return (
        [rgb.getpixel((x, 0)) for x in range(width)]
        + [rgb.getpixel((x, height - 1)) for x in range(width)]
        + [rgb.getpixel((0, y)) for y in range(1, height - 1)]
        + [rgb.getpixel((width - 1, y)) for y in range(1, height - 1)]
    )


def sampled_key(image: Image.Image) -> tuple[int, int, int]:
    samples = border_pixels(image)
    channels = zip(*samples)
    return tuple(sorted(channel)[len(samples) // 2] for channel in channels)  # type: ignore[return-value]


def pixels(image: Image.Image):
    """Return the current Pillow pixel iterator without deprecated APIs."""
    getter = getattr(image, "get_flattened_data", None)
    return getter() if getter else image.getdata()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--kind", required=True, choices=("chroma", "alpha", "opaque"))
    parser.add_argument("--expected-size", type=parse_size)
    parser.add_argument("--key-color", type=parse_color)
    parser.add_argument("--tolerance", type=float, default=32.0)
    parser.add_argument("--max-bytes", type=int, default=5_000_000)
    args = parser.parse_args()

    errors: list[str] = []
    image = Image.open(args.input)
    width, height = image.size
    size_bytes = args.input.stat().st_size

    if args.expected_size and image.size != args.expected_size:
        errors.append(f"dimensions {width}x{height}, expected {args.expected_size[0]}x{args.expected_size[1]}")
    if size_bytes > args.max_bytes:
        errors.append(f"file size {size_bytes} exceeds {args.max_bytes} bytes")

    details: list[str] = [f"kind={args.kind}", f"dimensions={width}x{height}", f"bytes={size_bytes}"]

    if args.kind == "chroma":
        key = args.key_color or sampled_key(image)
        border = border_pixels(image)
        matching = sum(distance(pixel, key) <= args.tolerance for pixel in border)
        border_ratio = matching / len(border)
        details.extend((f"key=#{key[0]:02x}{key[1]:02x}{key[2]:02x}", f"matchingBorder={border_ratio:.4f}"))
        if border_ratio < 0.98:
            errors.append(f"only {border_ratio:.2%} of border matches chroma key")
        rgb = image.convert("RGB")
        subject = sum(distance(pixel, key) > args.tolerance for pixel in pixels(rgb))
        coverage = subject / (width * height)
        details.append(f"subjectCoverage={coverage:.4f}")
        if not 0.01 <= coverage <= 0.90:
            errors.append(f"implausible subject coverage {coverage:.2%}")

    if args.kind == "alpha":
        if "A" not in image.getbands():
            errors.append("missing alpha channel")
        else:
            rgba = image.convert("RGBA")
            alpha = rgba.getchannel("A")
            bbox = alpha.getbbox()
            alpha_pixels = tuple(pixels(alpha))
            visible = sum(value > 0 for value in alpha_pixels)
            partial = sum(0 < value < 255 for value in alpha_pixels)
            coverage = visible / (width * height)
            corners = [alpha.getpixel(point) for point in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))]
            details.extend((f"visibleBounds={bbox}", f"visibleCoverage={coverage:.4f}", f"partialAlpha={partial}"))
            if any(corners):
                errors.append(f"corners are not transparent: {corners}")
            if not 0.01 <= coverage <= 0.90:
                errors.append(f"implausible visible coverage {coverage:.2%}")
            if args.key_color:
                key = args.key_color
                fringe = sum(
                    alpha_value > 0 and distance(pixel[:3], key) <= args.tolerance
                    for pixel, alpha_value in zip(pixels(rgba), alpha_pixels)
                )
                details.append(f"visibleKeyPixels={fringe}")
                if fringe > max(10, int(visible * 0.005)):
                    errors.append(f"too many visible key-colored pixels: {fringe}")

    status = "FAIL" if errors else "OK"
    print(f"{status}: {args.input}")
    for detail in details:
        print(f"  {detail}")
    for error in errors:
        print(f"  error={error}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
