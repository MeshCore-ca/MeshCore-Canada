#!/usr/bin/env python3
"""Check published IATA geometry, without imposing the former census partition."""
import json
import copy
import runpy
from pathlib import Path

from shapely.geometry import Point, box, mapping, shape
from shapely.ops import unary_union

root = Path(__file__).resolve().parents[1] / "docs/assets/regions"
zones = json.loads((root / "iata-boundaries.geojson").read_text(encoding="utf-8"))
published = json.loads((root / "meshmapper-iata-boundaries.geojson").read_text(encoding="utf-8"))
provinces = json.loads((root / "scope-jurisdictions.geojson").read_text(encoding="utf-8"))
for collection in (zones, provinces):
    for feature in collection["features"]:
        geometry = shape(feature["geometry"])
        assert geometry.is_valid and not geometry.is_empty and geometry.area > 0, feature["properties"]
zone_shapes = {feature["properties"]["tag"]: shape(feature["geometry"]) for feature in zones["features"]}
for feature in zones["features"]:
    assert zone_shapes[feature["properties"]["tag"]].covers(Point(*feature["properties"]["center"])), feature["properties"]["tag"]
province_shapes = {feature["properties"]["tag"]: shape(feature["geometry"]) for feature in provinces["features"]}
for province, point in [("on", Point(-75.6972, 45.4215)), ("qc", Point(-75.7013, 45.4765))]:
    assert zone_shapes["yow"].contains(point)
    assert province_shapes[province].contains(point)
assert not any(geometry.contains(Point(-74.006, 40.7128)) for geometry in province_shapes.values())
repository = Path(__file__).resolve().parents[1]
policy = json.loads((repository / "data/iata-starter-regions.json").read_text(encoding="utf-8"))
labrador = json.loads((repository / "data/iata-labrador-outline.geojson").read_text(encoding="utf-8"))
builder = runpy.run_path(str(repository / "scripts/build-iata-boundaries.py"))["build_boundaries"]
expected = builder(published, provinces, policy, labrador)
for feature in expected:
    assert zone_shapes[feature["properties"]["tag"]].symmetric_difference(shape(feature["geometry"])).area < 1e-10
published_area = unary_union([shape(feature["geometry"]) for feature in published["features"]])
starter_shapes = {entry["tag"]: zone_shapes[entry["tag"]] for entry in policy["regions"]}
for tag, geometry in starter_shapes.items():
    assert geometry.intersection(published_area).area < 1e-10, tag
    for other, second in starter_shapes.items():
        if tag != other:
            assert geometry.intersection(second).area < 1e-10, (tag, other)
for province in {entry["province"] for entry in policy["regions"]}:
    assigned = unary_union([zone_shapes[entry["tag"]] for entry in policy["regions"] if entry["province"] == province])
    assert province_shapes[province].difference(published_area.union(assigned)).area < 1e-10, province
for tag, point in [("yyg", Point(-63.1311, 46.2382)), ("yyt", Point(-52.7128, 47.5605)),
                   ("yyr", Point(-60.326, 53.303)), ("yxy", Point(-135.0568, 60.7212)),
                   ("yzf", Point(-114.3774, 62.454)), ("yfb", Point(-68.517, 63.7467)),
                   ("yyr", Point(-56.95, 51.426)), ("yyt", Point(-55.596, 51.37))]:
    assert zone_shapes[tag].contains(point), tag
print(f"IATA geometry verified: {len(published['features'])} MeshMapper zones + {len(starter_shapes)} non-overlapping starters covering five added jurisdictions")

# Future published zones must take space from a starter, never the reverse.
future = copy.deepcopy(published)
overlap = province_shapes["pe"].intersection(box(-64.2, 46.1, -63.7, 46.5))
assert overlap.area > 0
future["features"].append({"type": "Feature", "properties": {"tag": "test"}, "geometry": mapping(overlap)})
updated = builder(future, provinces, policy, labrador)
assert shape(next(feature for feature in updated if feature["properties"]["tag"] == "yyg")["geometry"]).intersection(overlap).area < 1e-10
future["features"][-1]["properties"]["tag"] = "yyg"
try:
    builder(future, provinces, policy, labrador)
except AssertionError as error:
    assert "review and replace" in str(error)
else:
    raise AssertionError("A newly published starter code must require a deliberate source transition")
