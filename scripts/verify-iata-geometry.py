#!/usr/bin/env python3
"""Check published IATA geometry, without imposing the former census partition."""
import json
from pathlib import Path

from shapely.geometry import Point, shape

root = Path(__file__).resolve().parents[1] / "docs/assets/regions"
zones = json.loads((root / "meshmapper-iata-boundaries.geojson").read_text(encoding="utf-8"))
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
assert not any(geometry.contains(Point(-100, 80)) for geometry in zone_shapes.values())
print(f"IATA geometry verified: {len(zone_shapes)} published zones and {len(province_shapes)} separate province outlines")
