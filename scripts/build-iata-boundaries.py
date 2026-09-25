#!/usr/bin/env python3
"""Add explicitly labelled starter regions without changing MeshMapper geometry."""
import argparse
import hashlib
import json
from pathlib import Path

from shapely import voronoi_polygons
from shapely.geometry import MultiPoint, Point, mapping, shape
from shapely.ops import transform, unary_union
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
INPUTS = {
    "meshmapper": "docs/assets/regions/meshmapper-iata-boundaries.geojson",
    "jurisdictions": "docs/assets/regions/scope-jurisdictions.geojson",
    "starters": "data/iata-starter-regions.json",
    "scopes": "data/iata-scope-policy.json",
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


def polygonal(geometry):
    if geometry.geom_type == "GeometryCollection":
        return unary_union([part for part in geometry.geoms if part.geom_type in ("Polygon", "MultiPolygon")])
    return geometry


def build_boundaries(published, jurisdictions, policy, labrador, scopes):
    assert policy["schema"] == "meshcore-canada-iata-starters/v1"
    existing = {feature["properties"]["tag"] for feature in published["features"]}
    provinces = {feature["properties"]["tag"]: shape(feature["geometry"]) for feature in jurisdictions["features"]}
    definitions = policy["regions"]
    assert len({entry["tag"] for entry in definitions}) == len(definitions)
    assert not existing.intersection(entry["tag"] for entry in definitions), "MeshMapper now publishes a starter code: review and replace the starter definition first"
    labrador_area = provinces["nl"].intersection(shape(labrador["geometry"]))
    nl = {"labrador": labrador_area, "newfoundland": provinces["nl"].difference(labrador_area)}
    published_area = unary_union([shape(feature["geometry"]) for feature in published["features"]])
    # Planning areas only: preserve source coastlines and every published zone.
    # Projected hub distances avoid treating a longitude degree as a latitude degree.
    forward = Transformer.from_crs(4326, 3347, always_xy=True).transform
    reverse = Transformer.from_crs(3347, 4326, always_xy=True).transform
    hub_areas = {}
    for province in sorted({entry["province"] for entry in definitions if entry["area"] == "hub"}):
        # Existing regions must compete for gaps too. Restricting this list to
        # new hubs made Sudbury absorb land near Waterloo, London and Barrie.
        entries = [feature["properties"] for feature in published["features"]
                   if province in scopes["zoneProvinces"][feature["properties"]["tag"]]]
        entries += [entry for entry in definitions if entry["province"] == province and entry["area"] == "hub"]
        entries.sort(key=lambda entry: entry["tag"])
        footprint = provinces[province]
        points = [Point(*forward(*entry["center"])) for entry in entries]
        extent = transform(forward, footprint).envelope.buffer(500000)
        cells = list(voronoi_polygons(MultiPoint(points), extend_to=extent).geoms)
        remaining = footprint.difference(published_area)
        for entry, point in zip(entries, points):
            cell = next(cell for cell in cells if cell.covers(point))
            area = polygonal(remaining.intersection(transform(reverse, cell.segmentize(10000))))
            if not area.is_empty:
                hub_areas.setdefault(entry["tag"], []).append(area)
            remaining = remaining.difference(area)
        # Never silently give unexplained leftovers to the last region.
        assert remaining.area < 1e-10, f"Unassigned planning geometry in {province}: {remaining.area}"
    features = [dict(feature, properties=dict(feature["properties"], regionSource="meshmapper")) for feature in published["features"]]
    for entry in definitions:
        footprint = unary_union(hub_areas[entry["tag"]]) if entry["area"] == "hub" else provinces[entry["province"]] if entry["area"] == "province" else nl[entry["area"]]
        # Published zones always win, including future zones added inside a starter.
        geometry = polygonal(footprint.difference(published_area))
        assert geometry.is_valid and not geometry.is_empty, entry["tag"]
        assert geometry.geom_type in ("Polygon", "MultiPolygon"), entry["tag"]
        assert geometry.covers(Point(*entry["center"])), "Starter hub is covered by MeshMapper; review the remaining starter area"
        features.append({
            "type": "Feature",
            "properties": {
                "code": entry["tag"].upper(), "tag": entry["tag"], "country": "CA",
                "name": entry["name"], "nameFr": entry["nameFr"], "center": entry["center"],
                "regionSource": "meshcore-canada", "province": entry["province"],
                "planningKind": "starter",
                "hub": entry["hub"], "codeSource": entry["codeSource"],
                "boundaryNote": "MeshCore Canada starter region; not a published MeshMapper zone",
            },
            "geometry": mapping(geometry),
        })
    # Keep the published feature intact. The extra area is a separate, explicitly
    # provisional feature using the same IATA code, not a MeshMapper edit.
    for feature in published["features"]:
        properties = feature["properties"]
        areas = hub_areas.get(properties["tag"], [])
        if not areas:
            continue
        geometry = polygonal(unary_union(areas))
        assert geometry.is_valid and not geometry.is_empty
        features.append({"type": "Feature", "properties": dict(properties,
            regionSource="meshcore-canada", planningKind="extension",
            provinces=scopes["zoneProvinces"][properties["tag"]],
            codeSource=properties["sourceUrl"],
            boundaryNote="MeshCore Canada planning extension; outside the published MeshMapper boundary"),
            "geometry": mapping(geometry)})
    return features


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--labrador-source", type=Path, help="Refresh the Labrador outline from the pinned Statistics Canada CD ZIP")
    args = parser.parse_args()
    if args.labrador_source:
        refresh_labrador(args.labrador_source)
    data = {name: json.loads((ROOT / path).read_text(encoding="utf-8")) for name, path in INPUTS.items()}
    features = build_boundaries(data["meshmapper"], data["jurisdictions"], data["starters"], data["labrador"], data["scopes"])
    output = {
        "type": "FeatureCollection", "schema": "meshcore-canada-iata-boundaries/v2",
        "featureCount": len(features), "publishedCount": len(data["meshmapper"]["features"]),
        "starterCount": len(data["starters"]["regions"]),
        "planningExtensionCount": sum(feature["properties"].get("planningKind") == "extension" for feature in features),
        "sourceHashes": {name: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for name, path in INPUTS.items()},
        "features": features,
    }
    path = ROOT / "docs/assets/regions/iata-boundaries.geojson"
    path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f"Generated {output['publishedCount']} unchanged MeshMapper zones + {output['starterCount']} starter regions + {output['planningExtensionCount']} separately labelled planning extensions")


if __name__ == "__main__":
    main()
