#!/usr/bin/env python3
"""Fail closed if the committed Canadian display partition overlaps or misroutes seeds."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.strtree import STRtree
from shapely.validation import explain_validity


ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--partition",
        type=Path,
        default=ROOT / "docs" / "assets" / "regions" / "canada-region-partition.geojson",
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=ROOT / "docs" / "assets" / "regions" / "canada-regions.json",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    partition = json.loads(args.partition.read_text(encoding="utf-8"))
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    features = partition.get("features", [])
    if partition.get("type") != "FeatureCollection" or len(features) != 193:
        raise SystemExit(f"expected 193 generated leaf features, found {len(features)}")

    tags = [str(feature.get("properties", {}).get("tag", "")) for feature in features]
    if len(set(tags)) != len(tags) or any(not tag for tag in tags):
        raise SystemExit("partition tags are blank or duplicated")
    by_tag = {tag: shape(feature["geometry"]) for tag, feature in zip(tags, features)}

    invalid = {tag: explain_validity(geometry) for tag, geometry in by_tag.items() if not geometry.is_valid}
    empty = [tag for tag, geometry in by_tag.items() if geometry.is_empty]
    if invalid or empty:
        raise SystemExit(f"invalid partition geometry: invalid={invalid}; empty={empty}")

    geometries = [by_tag[tag] for tag in tags]
    tree = STRtree(geometries)
    overlaps: list[tuple[str, str, float]] = []
    for left_index, left in enumerate(geometries):
        for right_index in tree.query(left, predicate="intersects"):
            right_index = int(right_index)
            if right_index <= left_index:
                continue
            area = float(left.intersection(geometries[right_index]).area)
            if area > 1e-12:
                overlaps.append((tags[left_index], tags[right_index], area))
    if overlaps:
        raise SystemExit(f"positive-area region overlaps found: {overlaps[:10]}")

    seed_failures: list[str] = []
    for seed in catalog.get("seeds", []):
        tag = str(seed["tag"])
        point = Point(float(seed["lon"]), float(seed["lat"]))
        containing = sorted(candidate for candidate, geometry in by_tag.items() if geometry.covers(point))
        if containing != [tag]:
            seed_failures.append(f"{tag} -> {containing}")
    if seed_failures:
        raise SystemExit(f"seed routing is not unique: {seed_failures[:20]}")

    print(
        json.dumps(
            {
                "features": len(features),
                "valid": len(features),
                "positiveAreaOverlapPairs": 0,
                "seedsResolvedExactlyOnce": len(catalog.get("seeds", [])),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
