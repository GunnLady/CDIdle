#!/usr/bin/env python3
"""Compose a processed sprite over an immutable terrain using source anchors."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def pair(value: str) -> tuple[int, int]:
    try:
        left, right = value.split(",", 1)
        return int(left), int(right)
    except ValueError as error:
        raise argparse.ArgumentTypeError("expected X,Y") from error


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--terrain", required=True, type=Path)
    parser.add_argument("--sprite", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--source-anchor", required=True, type=pair)
    parser.add_argument("--terrain-anchor", required=True, type=pair)
    parser.add_argument("--scale", required=True, type=float)
    args = parser.parse_args()

    if args.scale <= 0:
        raise SystemExit("scale must be positive")

    terrain = Image.open(args.terrain).convert("RGBA")
    sprite = Image.open(args.sprite).convert("RGBA")
    scaled_size = tuple(max(1, round(value * args.scale)) for value in sprite.size)
    sprite = sprite.resize(scaled_size, Image.Resampling.LANCZOS)
    source_anchor = tuple(round(value * args.scale) for value in args.source_anchor)
    position = tuple(target - source for target, source in zip(args.terrain_anchor, source_anchor))
    terrain.alpha_composite(sprite, dest=position)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    terrain.save(args.out)
    print(f"Wrote {args.out} at {position} with size {scaled_size}")


if __name__ == "__main__":
    main()
