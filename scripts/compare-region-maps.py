#!/usr/bin/env python3
"""Measure how much each region on the combined map moved between two builds."""
import json
import sys
from pathlib import Path

import shapely
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform

# Statistics Canada Lambert, in metres, so distances are real kilometres.
to_metres = Transformer.from_crs(4326, 3347, always_xy=True).transform
# Pieces smaller than 5 hectares cannot hold a town. Ignoring them keeps rebuild
# slivers between zones from counting as a far-reaching change.
SLIVER_M2 = 50_000


def reach_km(before, after):
    """How far any added or removed piece of a region reaches beyond its old outline."""
    def farthest(pieces, other):
        worst = 0.0
        for piece in getattr(pieces, "geoms", [pieces]):
            if piece.is_empty or piece.area < SLIVER_M2:
                continue
            worst = max(worst, float(shapely.distance(shapely.points(shapely.get_coordinates(piece)), other).max()))
        return worst
    old, new = transform(to_metres, before), transform(to_metres, after)
    return max(farthest(new.difference(old), old), farthest(old.difference(new), new)) / 1000


def compare_maps(before, after):
    def index(collection):
        return {(f["properties"]["tag"], f["properties"]["regionSource"]): shape(f["geometry"]) for f in collection["features"]}
    old, new = index(before), index(after)
    changes = []
    for key in sorted(old.keys() & new.keys()):
        area = old[key].area
        moved = old[key].symmetric_difference(new[key]).area
        if moved > 0:
            # Area alone misses a thin spike reaching a distant town; its reach does not.
            changes.append({"tag": key[0], "source": key[1], "percent": round(moved / area * 100, 6),
                            "shiftKm": round(reach_km(old[key], new[key]), 3)})
    return {
        "added": sorted("%s (%s)" % key for key in new.keys() - old.keys()),
        "removed": sorted("%s (%s)" % key for key in old.keys() - new.keys()),
        "changes": sorted(changes, key=lambda item: -item["percent"]),
    }


if __name__ == "__main__":
    before, after, output = (Path(argument) for argument in sys.argv[1:4])
    report = compare_maps(json.loads(before.read_text(encoding="utf-8")), json.loads(after.read_text(encoding="utf-8")))
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    largest = report["changes"][0] if report["changes"] else None
    print(f"Map comparison: {len(report['changes'])} region(s) moved" +
          (f", largest {largest['tag']} ({largest['source']}) {largest['percent']:.4f}%" if largest else ""))
