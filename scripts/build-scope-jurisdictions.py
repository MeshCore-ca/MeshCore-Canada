#!/usr/bin/env python3
"""Keep the province lookup independent of IATA zone/scope boundaries."""
import hashlib
import json
from collections import defaultdict
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

root = Path(__file__).resolve().parents[1]
source = root / "docs/assets/regions/canada-region-partition-digital.geojson"
groups = defaultdict(list)
for feature in json.loads(source.read_text(encoding="utf-8"))["features"]:
    groups[feature["properties"]["jurisdiction"]].append(shape(feature["geometry"]))
assert len(groups) == 13
features = []
for province, polygons in sorted(groups.items()):
    geometry = unary_union(polygons)
    assert geometry.is_valid and not geometry.is_empty, province
    features.append({"type": "Feature", "properties": {"tag": province}, "geometry": mapping(geometry)})
result = {
    "type": "FeatureCollection",
    "purpose": "Province/territory lookup only. These are not radio scopes or MeshMapper zone boundaries.",
    "source": "Statistics Canada 2021 digital geography, dissolved from the existing reviewed snapshot without simplification",
    "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "features": features,
}
output = root / "docs/assets/regions/scope-jurisdictions.geojson"
output.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
print(f"Generated {len(features)} jurisdiction outlines for province lookup")
