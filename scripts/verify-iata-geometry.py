#!/usr/bin/env python3
"""Verify source boundaries, planning topology and geographic assignments."""
import copy
import json
import runpy
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import Point, box, mapping, shape
from shapely.ops import unary_union
from shapely.prepared import prep

repository = Path(__file__).resolve().parents[1]
root = repository / "docs/assets/regions"
def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

zones = load(root / "iata-boundaries.geojson")
published = load(root / "meshmapper-iata-boundaries.geojson")
provinces = load(root / "scope-jurisdictions.geojson")
policy = load(repository / "data/iata-starter-regions.json")
scopes = load(repository / "data/iata-scope-policy.json")
labrador = load(repository / "data/iata-labrador-outline.geojson")
assert zones["schema"] == "meshcore-canada-iata-boundaries/v2"

def key(feature):
    return feature["properties"]["tag"], feature["properties"]["regionSource"]

parts = {key(feature): shape(feature["geometry"]) for feature in zones["features"]}
assert len(parts) == len(zones["features"])
for collection in (zones, provinces):
    for feature in collection["features"]:
        geometry = shape(feature["geometry"])
        assert geometry.is_valid and not geometry.is_empty and geometry.area > 0, feature["properties"]
        if collection is zones and feature["properties"].get("planningKind") != "extension":
            assert geometry.covers(Point(*feature["properties"]["center"])), key(feature)
for feature in published["features"]:
    retained = next(part for part in zones["features"] if key(part) == (feature["properties"]["tag"], "meshmapper"))
    assert retained["geometry"] == feature["geometry"], "Published MeshMapper coordinates changed"
province_shapes = {feature["properties"]["tag"]: shape(feature["geometry"]) for feature in provinces["features"]}
for province, point in [("on", Point(-75.6972, 45.4215)), ("qc", Point(-75.7013, 45.4765))]:
    assert parts["yow", "meshmapper"].contains(point)
    assert province_shapes[province].contains(point)
assert not any(geometry.contains(Point(-74.006, 40.7128)) for geometry in province_shapes.values())

builder = runpy.run_path(str(repository / "scripts/build-iata-boundaries.py"))["build_boundaries"]
expected = builder(published, provinces, policy, labrador, scopes)
assert {key(feature) for feature in expected} == set(parts)
for feature in expected:
    assert parts[key(feature)].symmetric_difference(shape(feature["geometry"])).area < 1e-10

published_area = unary_union([shape(feature["geometry"]) for feature in published["features"]])
planning = {tag: geometry for (tag, source), geometry in parts.items() if source == "meshcore-canada"}
assert {entry["province"] for entry in policy["regions"]} == set(province_shapes)
planning_area = unary_union(list(planning.values()))
for tag, geometry in planning.items():
    assert geometry.intersection(published_area).area < 1e-10, tag
    for other, second in planning.items():
        if tag < other:
            assert geometry.intersection(second).area < 1e-10, (tag, other)
for province, geometry in province_shapes.items():
    assert geometry.difference(published_area.union(planning_area)).area < 1e-10, province

# User-reported and named-town regressions. These are not region seed centres.
for tag, point in [
    ("ykf", Point(-81.2619, 43.8678)),  # Reported Wingham-area point, formerly YSB.
    ("yxu", Point(-81.71, 43.743)),     # Goderich.
    ("ylk", Point(-81.636, 44.176)),    # Kincardine.
    ("ysb", Point(-80.993, 46.492)),    # Sudbury stays Sudbury.
    ("yyg", Point(-63.1311, 46.2382)), ("yyt", Point(-52.7128, 47.5605)),
    ("yyr", Point(-60.326, 53.303)), ("yxy", Point(-135.0568, 60.7212)),
    ("yzf", Point(-114.3774, 62.454)), ("yfb", Point(-68.517, 63.7467)),
    ("yyr", Point(-56.95, 51.426)), ("yyt", Point(-55.596, 51.37))
]:
    assert planning[tag].contains(point), tag
assert not planning["ysb"].intersects(box(-83, 42, -78, 44.2)), "Sudbury must not absorb southern Ontario"

# Independently check a half-degree grid against ALL eligible regional centres,
# not the candidate subset used by the generator. Published zones retain priority.
project = Transformer.from_crs(4326, 3347, always_xy=True).transform
published_prepared = prep(published_area)
planning_prepared = {tag: prep(geometry) for tag, geometry in planning.items()}
checked = 0
province_counts = {}
for province in sorted({entry["province"] for entry in policy["regions"] if entry["area"] == "hub"}):
    centres = [(feature["properties"]["tag"], project(*feature["properties"]["center"]))
               for feature in published["features"] if province in scopes["zoneProvinces"][feature["properties"]["tag"]]]
    centres += [(entry["tag"], project(*entry["center"])) for entry in policy["regions"] if entry["province"] == province]
    province_shape = prep(province_shapes[province])
    west, south, east, north = province_shapes[province].bounds
    count = 0
    for ix in range(int(west * 2) - 1, int(east * 2) + 2):
        for iy in range(int(south * 2), int(north * 2) + 2):
            point = Point(ix / 2, iy / 2)
            if not province_shape.contains(point) or published_prepared.covers(point):
                continue
            x, y = project(point.x, point.y)
            distances = sorted((((cx-x)**2 + (cy-y)**2)**0.5, tag) for tag, (cx, cy) in centres)
            # Inverse-projected curved edges are sampled at 10 km. Avoid samples
            # within 50 m of an exact bisector, where that approximation matters.
            if len(distances) > 1 and distances[1][0] - distances[0][0] < 50:
                continue
            owners = [tag for tag, geometry in planning_prepared.items() if geometry.contains(point)]
            assert owners == [distances[0][1]], (province, point.wkt, owners, distances[:3])
            count += 1
    assert count > 0, province
    province_counts[province] = count
    checked += count
assert checked > 2000, checked

# Reordering metadata must not award leftover land to a different final entry.
reordered = copy.deepcopy(policy)
reordered["regions"].reverse()
for feature in builder(published, provinces, reordered, labrador, scopes):
    assert parts[key(feature)].symmetric_difference(shape(feature["geometry"])).area < 1e-10

# Future published zones take space from planning, never the reverse.
future = copy.deepcopy(published)
overlap = province_shapes["pe"].intersection(box(-64.2, 46.1, -63.7, 46.5))
assert overlap.area > 0
future["features"].append({"type": "Feature", "properties": {"tag": "tst", "center": [-63.9, 46.3], "sourceUrl": "https://tst.meshmapper.net/"}, "geometry": mapping(overlap)})
future_scopes = copy.deepcopy(scopes)
future_scopes["zoneProvinces"]["tst"] = ["pe"]
updated = builder(future, provinces, policy, labrador, future_scopes)
assert shape(next(feature for feature in updated if feature["properties"]["tag"] == "yyg")["geometry"]).intersection(overlap).area < 1e-10
future["features"][-1]["properties"]["tag"] = "yyg"
try:
    builder(future, provinces, policy, labrador, future_scopes)
except AssertionError as error:
    assert "review and replace" in str(error)
else:
    raise AssertionError("A newly published starter code requires an explicit source transition")

print(f"IATA geometry verified: {len(published['features'])} unchanged published zones, {len(planning)} planning features, all 13 jurisdictions; {checked} independent gap checks: {province_counts}")
