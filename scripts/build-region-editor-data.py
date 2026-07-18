#!/usr/bin/env python3
"""Build deterministic, province-lazy census cells for the region editor.

The editor operates on complete Statistics Canada 2021 Dissemination Areas
(DAs), never on freehand polygons.  Each province or territory is simplified as
one topology so neighbouring cells continue to share exactly the same border.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point


MAPSHAPER_VERSION = "0.6.113"
SCHEMA = "mcc-region-editor-data/v1"
PR_TO_TAG = {
    "10": "nl",
    "11": "pe",
    "12": "ns",
    "13": "nb",
    "24": "qc",
    "35": "on",
    "46": "mb",
    "47": "sk",
    "48": "ab",
    "59": "bc",
    "60": "yt",
    "61": "nt",
    "62": "nu",
}
SHAPEFILE_PARTS = (".shp", ".shx", ".dbf", ".prj", ".cpg")
RETAIN_RE = re.compile(r"^(?:100|[1-9]?\d(?:\.\d+)?)%$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--digital-da", type=Path, required=True, help="2021 digital DA shapefile")
    parser.add_argument("--census-subdivisions", type=Path, required=True, help="2021 digital CSD shapefile")
    parser.add_argument("--census-divisions", type=Path, required=True, help="2021 digital CD shapefile")
    parser.add_argument("--membership", type=Path, required=True, help="Generated DA-to-region membership CSV")
    parser.add_argument("--catalog", type=Path, required=True, help="Canonical region catalog JSON")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument(
        "--format",
        choices=("topojson", "geojson"),
        default="topojson",
        help="TopoJSON is smaller and is the production editor format",
    )
    parser.add_argument(
        "--retain",
        default="8%",
        help="Percentage of shared boundary vertices retained by Mapshaper (default: 8%%)",
    )
    return parser.parse_args()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def dataset_sha256(path: Path) -> str:
    """Hash the meaningful parts of a shapefile as one deterministic dataset."""
    if path.suffix.lower() != ".shp":
        return file_sha256(path)
    parts = [path.with_suffix(extension) for extension in SHAPEFILE_PARTS]
    parts = [part for part in parts if part.exists()]
    if not parts or path not in parts:
        raise ValueError(f"shapefile is incomplete or missing: {path}")
    digest = hashlib.sha256()
    for part in parts:
        digest.update(part.suffix.lower().encode("ascii"))
        digest.update(b"\0")
        digest.update(str(part.stat().st_size).encode("ascii"))
        digest.update(b"\0")
        with part.open("rb") as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(block)
    return digest.hexdigest()


def read_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"expected a JSON object in {path}")
    return value


def canonical_json_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=False) + "\n").encode("utf-8")


def write_atomic(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_bytes(payload)
    os.replace(temporary, path)


def normalize_code(series: pd.Series, width: int) -> pd.Series:
    return series.astype(str).str.strip().str.zfill(width)


def official_point_join(
    points: gpd.GeoDataFrame,
    geography: gpd.GeoDataFrame,
    columns: list[str],
) -> pd.DataFrame:
    """Return one official containing geography for every DA representative."""
    id_column = columns[0]
    joined = gpd.sjoin(
        points[["_row", "geometry"]],
        geography[columns + ["geometry"]],
        how="left",
        predicate="within",
    )
    if joined[id_column].isna().any():
        missing = joined.loc[joined[id_column].isna(), "_row"].astype(int).tolist()[:10]
        raise ValueError(f"DA representative points outside every {id_column}: {missing}")
    ambiguity = joined.groupby("_row")[id_column].nunique()
    ambiguous = ambiguity[ambiguity > 1].index.astype(int).tolist()[:10]
    if ambiguous:
        raise ValueError(f"DA representative points inside multiple {id_column} values: {ambiguous}")
    return (
        joined.sort_values(["_row", id_column])
        .drop_duplicates("_row", keep="first")
        .sort_values("_row")[columns]
        .reset_index(drop=True)
    )


def seed_cells(digital: gpd.GeoDataFrame, catalog: dict) -> dict[str, str]:
    """Resolve catalog seeds with the same covers/min-DGUID tie break as the generator."""
    seeds = catalog.get("seeds")
    if not isinstance(seeds, list):
        raise ValueError("catalog seeds must be an array")
    seed_frame = gpd.GeoDataFrame(
        [
            {
                "tag": str(seed["tag"]),
                "geometry": Point(float(seed["lon"]), float(seed["lat"])),
            }
            for seed in seeds
        ],
        crs="EPSG:4326",
    ).to_crs(digital.crs)
    result: dict[str, str] = {}
    for _, seed in seed_frame.sort_values("tag").iterrows():
        candidates = digital.iloc[list(digital.sindex.query(seed.geometry, predicate="intersects"))]
        candidates = candidates[candidates.geometry.apply(lambda geometry: geometry.covers(seed.geometry))]
        if candidates.empty:
            raise ValueError(f"seed {seed['tag']} is outside every digital DA")
        dguid = min(candidates["DGUID"].astype(str))
        prior = result.get(dguid)
        if prior and prior != seed["tag"]:
            raise ValueError(f"seed collision in {dguid}: {prior}, {seed['tag']}")
        result[dguid] = str(seed["tag"])
    return result


def catalog_leaves(catalog: dict) -> tuple[set[str], dict[str, str]]:
    hierarchy = catalog.get("hierarchy")
    if not isinstance(hierarchy, dict):
        raise ValueError("catalog hierarchy must be an object")
    parents = {str(entry.get("parent")) for entry in hierarchy.values() if entry.get("parent")}
    leaves = set(hierarchy) - parents
    jurisdictions: dict[str, str] = {}
    for leaf in leaves:
        seen: set[str] = set()
        current = leaf
        path: list[str] = []
        while current:
            if current in seen or current not in hierarchy:
                raise ValueError(f"invalid hierarchy ancestry for {leaf}")
            seen.add(current)
            path.insert(0, current)
            current = hierarchy[current].get("parent")
        if len(path) < 3 or path[0] != "can":
            raise ValueError(f"leaf {leaf} has no province or territory ancestor")
        jurisdictions[leaf] = path[1]
    return leaves, jurisdictions


def run_mapshaper(raw_path: Path, output_path: Path, output_format: str, retain: str) -> None:
    npx = shutil.which("npx")
    if not npx:
        raise ValueError("npx is required for shared-topology editor data")
    environment = os.environ.copy()
    environment.setdefault("NODE_OPTIONS", "--max-old-space-size=6144")
    format_name = "topojson" if output_format == "topojson" else "geojson"
    command = [
        npx,
        "--yes",
        f"mapshaper@{MAPSHAPER_VERSION}",
        str(raw_path),
        "-rename-layers",
        "cells",
        "-simplify",
        "weighted",
        retain,
        "keep-shapes",
        "-snap",
        "precision=0.000001",
        "fix-geometry",
        "-o",
        f"format={format_name}",
        "fix-geometry",
    ]
    # TopoJSON uses a quantized transform; GeoJSON needs an explicit decimal
    # precision.  The preceding topology-wide snap applies to both formats.
    if output_format == "geojson":
        command.append("precision=0.000001")
    command.extend(["force", str(output_path)])
    subprocess.run(
        command,
        check=True,
        env=environment,
    )


def verify_output(path: Path, output_format: str, expected_dguids: list[str]) -> None:
    value = read_json(path)
    if output_format == "topojson":
        if value.get("type") != "Topology" or "cells" not in value.get("objects", {}):
            raise ValueError(f"{path.name} has no TopoJSON cells object")
        geometries = value["objects"]["cells"].get("geometries", [])
        actual = [str(geometry.get("properties", {}).get("DGUID", "")) for geometry in geometries]
        empty = [
            actual[index]
            for index, geometry in enumerate(geometries)
            if geometry.get("type") not in {"Polygon", "MultiPolygon"} or not geometry.get("arcs")
        ]
    else:
        if value.get("type") != "FeatureCollection":
            raise ValueError(f"{path.name} is not a GeoJSON FeatureCollection")
        features = value.get("features", [])
        actual = [str(feature.get("properties", {}).get("DGUID", "")) for feature in features]
        empty = [
            actual[index]
            for index, feature in enumerate(features)
            if not feature.get("geometry")
            or feature["geometry"].get("type") not in {"Polygon", "MultiPolygon"}
            or not feature["geometry"].get("coordinates")
        ]
    if len(actual) != len(expected_dguids) or sorted(actual) != sorted(expected_dguids):
        raise ValueError(
            f"{path.name} did not preserve every DA: expected {len(expected_dguids)}, "
            f"found {len(actual)} ({len(set(actual))} unique)"
        )
    if empty:
        raise ValueError(f"{path.name} contains empty or non-polygon DA geometries: {empty[:10]}")


def main() -> None:
    args = parse_args()
    if not RETAIN_RE.fullmatch(args.retain):
        raise ValueError("--retain must be a percentage from 0% through 100%")
    if not (args.digital_da.exists() and args.census_subdivisions.exists() and args.census_divisions.exists()):
        raise ValueError("one or more census source files do not exist")
    if not (args.membership.exists() and args.catalog.exists()):
        raise ValueError("membership or catalog input does not exist")

    catalog = read_json(args.catalog)
    leaves, leaf_jurisdictions = catalog_leaves(catalog)
    membership = pd.read_csv(args.membership, dtype=str, keep_default_na=False)
    required_membership = {"DGUID", "leaf_tag"}
    if not required_membership.issubset(membership.columns):
        raise ValueError(f"membership is missing columns {sorted(required_membership - set(membership.columns))}")
    if membership["DGUID"].duplicated().any():
        raise ValueError("membership contains duplicate DGUID values")
    if not set(membership["leaf_tag"]).issubset(leaves):
        raise ValueError("membership contains a non-leaf region tag")

    digital = gpd.read_file(args.digital_da)[["DAUID", "DGUID", "PRUID", "geometry"]]
    csds = gpd.read_file(args.census_subdivisions)[["CSDUID", "CSDNAME", "CSDTYPE", "PRUID", "geometry"]]
    cds = gpd.read_file(args.census_divisions)[["CDUID", "CDNAME", "CDTYPE", "PRUID", "geometry"]]
    if not digital.crs or not csds.crs or not cds.crs:
        raise ValueError("all census datasets must declare a CRS")
    if len({str(digital.crs), str(csds.crs), str(cds.crs)}) != 1:
        raise ValueError(f"census source CRS mismatch: DA={digital.crs}, CSD={csds.crs}, CD={cds.crs}")

    digital["DGUID"] = digital["DGUID"].astype(str)
    digital["DAUID"] = digital["DAUID"].astype(str)
    digital["PRUID"] = normalize_code(digital["PRUID"], 2)
    csds["CSDUID"] = csds["CSDUID"].astype(str)
    csds["PRUID"] = normalize_code(csds["PRUID"], 2)
    cds["CDUID"] = cds["CDUID"].astype(str)
    cds["PRUID"] = normalize_code(cds["PRUID"], 2)
    digital = digital.sort_values("DGUID").reset_index(drop=True)
    if digital["DGUID"].duplicated().any():
        raise ValueError("digital DA source contains duplicate DGUID values")
    if set(digital["DGUID"]) != set(membership["DGUID"]):
        raise ValueError("digital DA and membership DGUID sets differ")

    digital = digital.merge(
        membership[["DGUID", "leaf_tag"]],
        on="DGUID",
        how="left",
        validate="one_to_one",
    )
    cross_jurisdiction = [
        dguid
        for dguid, pruid, tag in digital[["DGUID", "PRUID", "leaf_tag"]].itertuples(index=False, name=None)
        if PR_TO_TAG.get(pruid) != leaf_jurisdictions.get(tag)
    ]
    if cross_jurisdiction:
        raise ValueError(f"membership crosses a province or territory boundary: {cross_jurisdiction[:10]}")

    representatives = gpd.GeoDataFrame(
        {"_row": digital.index},
        geometry=digital.geometry.representative_point(),
        crs=digital.crs,
    )
    csd_values = official_point_join(representatives, csds, ["CSDUID", "CSDNAME", "CSDTYPE"])
    cd_values = official_point_join(representatives, cds, ["CDUID", "CDNAME", "CDTYPE"])
    for column in csd_values:
        digital[column] = csd_values[column].astype(str)
    for column in cd_values:
        digital[column] = cd_values[column].astype(str)

    for column in ("CDUID", "CDNAME", "CSDUID", "CSDNAME", "CSDTYPE"):
        if column in membership.columns:
            expected = membership.set_index("DGUID")[column].astype(str)
            actual = digital.set_index("DGUID")[column].astype(str)
            mismatches = actual[actual != expected.reindex(actual.index)]
            if not mismatches.empty:
                raise ValueError(f"membership {column} disagrees with official geometry for {mismatches.index[0]}")

    seed_by_dguid = seed_cells(digital, catalog)
    digital["seed_tag"] = digital["DGUID"].map(seed_by_dguid).fillna("")
    bad_seed_owners = digital[(digital["seed_tag"] != "") & (digital["seed_tag"] != digital["leaf_tag"])]
    if not bad_seed_owners.empty:
        example = bad_seed_owners.iloc[0]
        raise ValueError(
            f"seed cell {example['DGUID']} is owned by {example['leaf_tag']}, expected {example['seed_tag']}"
        )

    output_extension = "topo.json" if args.format == "topojson" else "geojson"
    output_entries: list[dict] = []
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="mcc-region-editor-") as temporary_name:
        temporary_dir = Path(temporary_name)
        for pruid in sorted(digital["PRUID"].unique()):
            if pruid not in PR_TO_TAG:
                raise ValueError(f"unknown PRUID {pruid}")
            province = digital[digital["PRUID"] == pruid].copy()
            province = province[
                [
                    "DGUID",
                    "DAUID",
                    "PRUID",
                    "CDUID",
                    "CDNAME",
                    "CSDUID",
                    "CSDNAME",
                    "CSDTYPE",
                    "leaf_tag",
                    "seed_tag",
                    "geometry",
                ]
            ].sort_values("DGUID")
            province = province.to_crs("EPSG:4326")
            bounds = [round(float(value), 6) for value in province.total_bounds]
            raw_path = temporary_dir / f"cells-{pruid}.raw.geojson"
            built_path = temporary_dir / f"cells-{pruid}.{output_extension}"
            province.to_file(raw_path, driver="GeoJSON", index=False)
            run_mapshaper(raw_path, built_path, args.format, args.retain)
            expected_dguids = list(province["DGUID"].astype(str))
            verify_output(built_path, args.format, expected_dguids)

            output_path = args.output_dir / built_path.name
            # The system temporary directory and repository may be on different
            # Windows volumes.  Stage the copy beside its destination so the
            # final replace remains atomic in either layout.
            staged_output = output_path.with_name(f".{output_path.name}.tmp")
            shutil.copyfile(built_path, staged_output)
            os.replace(staged_output, output_path)
            province_tag = PR_TO_TAG[pruid]
            hierarchy_entry = catalog["hierarchy"].get(province_tag, {})
            output_entries.append(
                {
                    "pruid": pruid,
                    "tag": province_tag,
                    "name": str(hierarchy_entry.get("label", province_tag)),
                    "file": output_path.name,
                    "object": "cells" if args.format == "topojson" else None,
                    "cellCount": len(province),
                    "leafCount": int(province["leaf_tag"].nunique()),
                    "boundsWgs84": bounds,
                    "bytes": output_path.stat().st_size,
                    "sha256": file_sha256(output_path),
                }
            )

    manifest = {
        "schema": SCHEMA,
        "censusVintage": 2021,
        "format": args.format,
        "crs": "EPSG:4326",
        "topologyObject": "cells" if args.format == "topojson" else None,
        "cellProperties": [
            "DGUID",
            "DAUID",
            "PRUID",
            "CDUID",
            "CDNAME",
            "CSDUID",
            "CSDNAME",
            "CSDTYPE",
            "leaf_tag",
            "seed_tag",
        ],
        "simplification": {
            "tool": "mapshaper",
            "version": MAPSHAPER_VERSION,
            "method": "weighted-visvalingam",
            "retainedVertices": args.retain,
            "jointTopologyPerProvince": True,
            "keepShapes": True,
            "coordinatePrecision": 0.000001,
        },
        "inputs": {
            "membershipSha256": file_sha256(args.membership),
            "catalogSha256": file_sha256(args.catalog),
            "digitalDaDatasetSha256": dataset_sha256(args.digital_da),
            "censusSubdivisionDatasetSha256": dataset_sha256(args.census_subdivisions),
            "censusDivisionDatasetSha256": dataset_sha256(args.census_divisions),
        },
        "totalCells": len(digital),
        "seedCellCount": len(seed_by_dguid),
        "provinces": output_entries,
    }
    manifest_path = args.output_dir / "manifest.json"
    write_atomic(manifest_path, canonical_json_bytes(manifest))
    manifest_hash = file_sha256(manifest_path)
    write_atomic(args.output_dir / "manifest.sha256", f"{manifest_hash}  manifest.json\n".encode("ascii"))
    print(
        json.dumps(
            {
                "manifest": str(manifest_path),
                "manifestSha256": manifest_hash,
                "provinceCount": len(output_entries),
                "cellCount": len(digital),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
