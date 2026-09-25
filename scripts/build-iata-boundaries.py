#!/usr/bin/env python3
"""Add explicitly labelled starter regions without changing MeshMapper geometry."""
import argparse
import hashlib
import json
from pathlib import Path

from shapely.geometry import Point, mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
INPUTS = {
    "meshmapper": "docs/assets/regions/meshmapper-iata-boundaries.geojson",
    "jurisdictions": "docs/assets/regions/scope-jurisdictions.geojson",
    "starters": "data/iata-starter-regions.json",
    "labrador": "data/iata-labrador-outline.geojson",
}


def refresh_labrador(archive):
    """Extract Labrador's two official census divisions from the pinned source."""
    import geopandas as gpd
    lock = json.loads((ROOT / "docs/assets/regions/sources.lock.json").read_text(encoding="utf-8"))
    source = next(entry for entry in lock["sources"] if entry["id"] == "statcan-census-divisions-digital-2021")
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == source["sha256"]
    divisions = gpd.read_file(archive.resolve(), columns=["CDUID", "geometry"])
    divisions = divisions.loc[divisions["CDUID"].isin(["1010", "1011"])].to_crs("EPSG:4326")
    assert set(divisions["CDUID"]) == {"1010", "1011"}
    geometry = unary_union(divisions.geometry)
    assert geometry.is_valid
    feature = {"type": "Feature", "properties": {"name": "Labrador", "censusDivisions": ["1010", "1011"],
               "sourceUrl": source["url"], "sourceSha256": source["sha256"], "licence": source["licence"]},
               "geometry": mapping(geometry)}
    (ROOT / INPUTS["labrador"]).write_text(json.dumps(feature, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")


def build_boundaries(published, jurisdictions, policy, labrador):
    assert policy["schema"] == "meshcore-canada-iata-starters/v1"
    existing = {feature["properties"]["tag"] for feature in published["features"]}
    provinces = {feature["properties"]["tag"]: shape(feature["geometry"]) for feature in jurisdictions["features"]}
    definitions = policy["regions"]
    assert len({entry["tag"] for entry in definitions}) == len(definitions)
    assert not existing.intersection(entry["tag"] for entry in definitions), "MeshMapper now publishes a starter code: review and replace the starter definition first"
    labrador_area = provinces["nl"].intersection(shape(labrador["geometry"]))
    nl = {"labrador": labrador_area, "newfoundland": provinces["nl"].difference(labrador_area)}
    published_area = unary_union([shape(feature["geometry"]) for feature in published["features"]])
    features = [dict(feature, properties=dict(feature["properties"], regionSource="meshmapper")) for feature in published["features"]]
    for entry in definitions:
        footprint = provinces[entry["province"]] if entry["area"] == "province" else nl[entry["area"]]
        # Published zones always win, including future zones added inside a starter.
        geometry = footprint.difference(published_area)
        assert geometry.is_valid and not geometry.is_empty, entry["tag"]
        assert geometry.geom_type in ("Polygon", "MultiPolygon"), entry["tag"]
        assert geometry.covers(Point(*entry["center"])), "Starter hub is covered by MeshMapper; review the remaining starter area"
        features.append({
            "type": "Feature",
            "properties": {
                "code": entry["tag"].upper(), "tag": entry["tag"], "country": "CA",
                "name": entry["name"], "nameFr": entry["nameFr"], "center": entry["center"],
                "regionSource": "meshcore-canada", "province": entry["province"],
                "hub": entry["hub"], "codeSource": entry["codeSource"],
                "boundaryNote": "MeshCore Canada starter region; not a published MeshMapper zone",
            },
            "geometry": mapping(geometry),
        })
    return features


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--labrador-source", type=Path, help="Refresh the Labrador outline from the pinned Statistics Canada CD ZIP")
    args = parser.parse_args()
    if args.labrador_source:
        refresh_labrador(args.labrador_source)
    data = {name: json.loads((ROOT / path).read_text(encoding="utf-8")) for name, path in INPUTS.items()}
    features = build_boundaries(data["meshmapper"], data["jurisdictions"], data["starters"], data["labrador"])
    output = {
        "type": "FeatureCollection", "schema": "meshcore-canada-iata-boundaries/v1",
        "featureCount": len(features), "publishedCount": len(data["meshmapper"]["features"]),
        "starterCount": len(data["starters"]["regions"]),
        "sourceHashes": {name: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for name, path in INPUTS.items()},
        "features": features,
    }
    path = ROOT / "docs/assets/regions/iata-boundaries.geojson"
    path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f"Generated {output['publishedCount']} unchanged MeshMapper zones + {output['starterCount']} starter regions")


if __name__ == "__main__":
    main()
