#!/usr/bin/env python3
"""Validate CDIdle visual manifest paths, hashes, dimensions, and geometry."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


ALLOWED_STATES = {"draft", "source-approved", "processed", "context-approved", "integrated", "rejected"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    root = manifest_path.parent
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors: list[str] = []

    if data.get("schemaVersion") != 1:
        errors.append("unsupported schemaVersion")

    terrain_size = data.get("coordinateSystem", {}).get("terrainSizePx")
    if not isinstance(terrain_size, list) or len(terrain_size) != 2:
        errors.append("coordinateSystem.terrainSizePx must contain width and height")
        terrain_size = [0, 0]

    for reference in data.get("references", []):
        if not (root / reference).is_file():
            errors.append(f"missing reference: {reference}")

    identifiers: set[str] = set()
    for asset in data.get("assets", []):
        asset_id = asset.get("id", "<missing-id>")
        if asset_id in identifiers:
            errors.append(f"duplicate asset id: {asset_id}")
        identifiers.add(asset_id)
        if asset.get("status") not in ALLOWED_STATES:
            errors.append(f"{asset_id}: invalid status {asset.get('status')}")

        paths: dict[str, Path] = {}
        for field in ("path", "sourcePath", "processedPath", "promptPath"):
            if value := asset.get(field):
                paths[field] = root / value
        if preview := asset.get("placement", {}).get("previewPath"):
            paths["previewPath"] = root / preview
        for field, path in paths.items():
            if not path.is_file():
                errors.append(f"{asset_id}: missing {field} {path.relative_to(root)}")

        for hash_field, path_field in (("sha256", "path"), ("sourceSha256", "sourcePath"), ("processedSha256", "processedPath")):
            expected = asset.get(hash_field)
            path = paths.get(path_field)
            if expected and path and path.is_file() and sha256(path) != expected.lower():
                errors.append(f"{asset_id}: {hash_field} mismatch")

        dimensions = asset.get("dimensionsPx")
        image_path = paths.get("sourcePath") or paths.get("path")
        if dimensions and image_path and image_path.is_file():
            with Image.open(image_path) as image:
                if list(image.size) != dimensions:
                    errors.append(f"{asset_id}: dimensions {image.size} do not match {dimensions}")

        placement = asset.get("placement")
        if placement:
            anchor = placement.get("terrainAnchorPx")
            if not isinstance(anchor, list) or len(anchor) != 2:
                errors.append(f"{asset_id}: invalid terrainAnchorPx")
            elif not (0 <= anchor[0] < terrain_size[0] and 0 <= anchor[1] < terrain_size[1]):
                errors.append(f"{asset_id}: terrain anchor outside master terrain")
            scale = placement.get("scale")
            if not isinstance(scale, (int, float)) or scale <= 0:
                errors.append(f"{asset_id}: scale must be positive")

    if errors:
        print(f"FAIL: {manifest_path}")
        for error in errors:
            print(f"  error={error}")
        return 1

    print(f"OK: {manifest_path}")
    print(f"  references={len(data.get('references', []))}")
    print(f"  assets={len(data.get('assets', []))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
