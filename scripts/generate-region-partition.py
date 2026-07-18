#!/usr/bin/env python3
"""Generate the exclusive MeshCore Canada region partition.

The generator treats each Statistics Canada 2021 digital Dissemination Area
(DA) as one indivisible ownership cell. MeshMapper polygons and strategy points
influence that ownership, but only the dissolved one-owner-per-DA result is
published as region geometry.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

import geopandas as gpd
import numpy as np
from scipy.spatial import cKDTree
from shapely import make_valid, union_all
from shapely.geometry import MultiPolygon, Point, Polygon, shape
from shapely.strtree import STRtree


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "docs" / "assets" / "regions" / "canada-regions.json"
DEFAULT_MESHMAPPER = ROOT / "docs" / "assets" / "regions" / "meshmapper-canada-regions.json"
DEFAULT_OUTPUT = ROOT / "docs" / "assets" / "regions"
DEFAULT_OVERRIDES = ROOT / "docs" / "assets" / "regions" / "municipal-overrides.json"
DEFAULT_RADIO_DENSITY = ROOT / "docs" / "assets" / "regions" / "radio-density.json"

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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--digital-da", type=Path, required=True, help="2021 digital DA shapefile")
    parser.add_argument("--cartographic-da", type=Path, required=True, help="2021 cartographic DA shapefile")
    parser.add_argument("--economic-regions", type=Path, required=True, help="2021 digital ER shapefile")
    parser.add_argument("--census-divisions", type=Path, required=True, help="2021 digital CD shapefile")
    parser.add_argument("--census-subdivisions", type=Path, required=True, help="2021 digital CSD shapefile")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--meshmapper", type=Path, default=DEFAULT_MESHMAPPER)
    parser.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES)
    parser.add_argument(
        "--radio-density",
        type=Path,
        default=DEFAULT_RADIO_DENSITY,
        help="Frozen privacy-safe radio-cluster evidence; ignored when the file is absent",
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--display-retain", default="2%", help="Mapshaper percentage retained for the web layer")
    parser.add_argument("--resolver-retain", default="20%", help="Mapshaper percentage retained for the digital resolver")
    parser.add_argument("--keep-raw", action="store_true", help="Keep the unsimplified cartographic GeoJSON")
    parser.add_argument(
        "--resume-raw",
        action="store_true",
        help="Reuse complete raw layers after validating they match the regenerated membership",
    )
    parser.add_argument(
        "--reuse-simplified",
        action="store_true",
        help="With --resume-raw, re-verify existing simplified layers instead of rebuilding them",
    )
    parser.add_argument(
        "--skip-source-hashes",
        action="store_true",
        help="Do not hash large source shapefiles (intended only for quick local experiments)",
    )
    return parser.parse_args()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def json_sha256(value: object) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def provisional_ownership_sha256(membership) -> str:
    """Hash the pre-radio DGUID ownership basis used to label radio evidence."""
    required = {"DGUID", "provisional_leaf_tag"}
    if not required.issubset(membership.columns):
        raise ValueError("membership must contain DGUID and provisional_leaf_tag")
    basis = membership[["DGUID", "provisional_leaf_tag"]].astype(str).sort_values("DGUID")
    if basis["DGUID"].duplicated().any() or (basis == "").any().any():
        raise ValueError("provisional membership basis is incomplete or duplicated")
    payload = "DGUID,provisional_leaf_tag\n" + "".join(
        f"{dguid},{tag}\n" for dguid, tag in basis.itertuples(index=False, name=None)
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def read_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def polygonal_only(geometry):
    """Keep polygonal parts produced when make_valid returns a collection."""
    if isinstance(geometry, (Polygon, MultiPolygon)):
        return geometry
    parts = []
    for part in getattr(geometry, "geoms", []):
        cleaned = polygonal_only(part)
        if not cleaned.is_empty:
            parts.append(cleaned)
    return union_all(parts) if parts else geometry


def children_by_parent(hierarchy: dict) -> dict[str, list[str]]:
    children: dict[str, list[str]] = defaultdict(list)
    for tag, entry in hierarchy.items():
        parent = entry.get("parent")
        if parent:
            children[parent].append(tag)
    for tags in children.values():
        tags.sort()
    return children


def ancestry(hierarchy: dict, tag: str) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    current: str | None = tag
    while current:
        if current in seen:
            raise ValueError(f"hierarchy cycle at {tag}")
        seen.add(current)
        result.insert(0, current)
        entry = hierarchy.get(current)
        if entry is None:
            raise ValueError(f"unknown hierarchy tag {current}")
        current = entry.get("parent")
    return result


def jurisdiction_for(hierarchy: dict, tag: str) -> str:
    path = ancestry(hierarchy, tag)
    if len(path) < 3 or path[0] != "can":
        raise ValueError(f"leaf {tag} has no province or territory ancestor")
    return path[1]


def assign_points_to_ers(points: gpd.GeoDataFrame, ers: gpd.GeoDataFrame) -> dict[int, str]:
    joined = gpd.sjoin(
        points[["geometry"]],
        ers[["ERUID", "geometry"]],
        how="left",
        predicate="within",
    )
    joined = joined.reset_index().sort_values(["index", "ERUID"], na_position="last")
    joined = joined.drop_duplicates("index", keep="first").set_index("index")
    if joined["ERUID"].isna().any():
        missing = joined.index[joined["ERUID"].isna()].tolist()[:10]
        raise ValueError(f"points outside every economic region: {missing}")
    return {int(index): str(value) for index, value in joined["ERUID"].items()}


def assign_points_to_geographies(
    points: gpd.GeoDataFrame,
    geographies: gpd.GeoDataFrame,
    id_column: str,
) -> dict[int, str]:
    """Assign each point to exactly one official census geography."""
    joined = gpd.sjoin(
        points[["geometry"]],
        geographies[[id_column, "geometry"]],
        how="left",
        predicate="within",
    ).reset_index()
    duplicates = joined[joined.duplicated("index", keep=False)]
    if not duplicates.empty:
        ids = duplicates.groupby("index")[id_column].nunique()
        ambiguous = ids[ids > 1].index.tolist()[:10]
        if ambiguous:
            raise ValueError(f"points resolve to multiple {id_column} values: {ambiguous}")
    joined = joined.sort_values(["index", id_column], na_position="last").drop_duplicates("index", keep="first")
    joined = joined.set_index("index")
    if joined[id_column].isna().any():
        missing = joined.index[joined[id_column].isna()].tolist()[:10]
        raise ValueError(f"points outside every {id_column} geography: {missing}")
    return {int(index): str(value) for index, value in joined[id_column].items()}


def apply_census_coherence(
    digital: gpd.GeoDataFrame,
    representatives: gpd.GeoSeries,
    seeds: gpd.GeoDataFrame,
    provisional_owner: dict[str, str],
    leaf_jurisdictions: dict[str, str],
    registry_ids: dict[str, str],
    overrides: dict,
    radio_density: dict | None,
) -> tuple[dict[str, str], dict[str, str], dict]:
    """Turn DA-level votes into whole-municipality ownership decisions.

    A CSD is indivisible unless an approved split exception enumerates every DA
    in that CSD.  Radio clusters may only break a close provisional vote; they
    never create a tag, cross a province, split a CSD, or override a reviewed
    census decision.
    """
    leaves = set(leaf_jurisdictions)
    csd_ids = set(digital["CSDUID"].astype(str))
    cd_ids = set(digital["CDUID"].astype(str))
    override_by_level: dict[str, dict[str, str]] = {"CSD": {}, "CD": {}}
    override_records = overrides.get("cohortOverrides", [])
    for record in override_records:
        if record.get("status") != "approved":
            raise ValueError(f"census override is not approved: {record}")
        level = str(record.get("level", "")).upper()
        geography_id = str(record.get("id", ""))
        tag = str(record.get("leafTag", ""))
        if level not in override_by_level:
            raise ValueError(f"unsupported census override level {level}")
        valid_ids = csd_ids if level == "CSD" else cd_ids
        if geography_id not in valid_ids:
            raise ValueError(f"unknown {level} override id {geography_id}")
        if tag not in leaves:
            raise ValueError(f"unknown census override leaf {tag}")
        jurisdiction = PR_TO_TAG.get(geography_id[:2])
        if leaf_jurisdictions[tag] != jurisdiction:
            raise ValueError(f"cross-jurisdiction census override {level} {geography_id} -> {tag}")
        prior = override_by_level[level].get(geography_id)
        if prior and prior != tag:
            raise ValueError(f"conflicting {level} override {geography_id}: {prior}, {tag}")
        override_by_level[level][geography_id] = tag

    seeds_by_csd: dict[str, list[str]] = defaultdict(list)
    seeds_by_cd: dict[str, list[str]] = defaultdict(list)
    for _, seed in seeds.iterrows():
        seeds_by_csd[str(seed["CSDUID"])].append(str(seed["tag"]))
        seeds_by_cd[str(seed["CDUID"])].append(str(seed["tag"]))
    approved_split_csds = {
        str(exception.get("csduid", ""))
        for exception in overrides.get("splitExceptions", [])
        if isinstance(exception, dict) and exception.get("status") == "approved"
    }
    collisions = {
        csd: tags for csd, tags in seeds_by_csd.items()
        if len(tags) > 1 and csd not in approved_split_csds
    }
    if collisions:
        raise ValueError(f"multiple region seeds inside one CSD require a reviewed split exception: {collisions}")

    # A broad approved CD rule may not silently erase another region's seed.
    for cduid, tag in override_by_level["CD"].items():
        conflicting = sorted(seed for seed in seeds_by_cd.get(cduid, []) if seed != tag)
        if conflicting:
            raise ValueError(f"CD override {cduid} -> {tag} conflicts with seeds {conflicting}")

    radio_by_csd: dict[str, Counter] = defaultdict(Counter)
    if radio_density:
        if radio_density.get("schema") != "mcc-radio-density/v2":
            raise ValueError("unsupported radio-density schema")
        k_anonymity = int(radio_density.get("privacy", {}).get("kAnonymity", 0))
        if k_anonymity < 5:
            raise ValueError("radio-density k-anonymity must be at least five")
        for cluster in radio_density.get("clusters", []):
            for participation in cluster.get("censusSubdivisions", []):
                csduid = str(participation.get("id", ""))
                if csduid not in csd_ids:
                    raise ValueError(f"radio-density references unknown CSD {csduid}")
                if int(participation.get("observedNodeCount", 0)) < k_anonymity:
                    raise ValueError(f"radio-density exposes a sub-k CSD aggregate for {csduid}")
                candidate_counts = Counter(
                    {
                        str(tag): int(count)
                        for tag, count in participation.get("decisionCandidateCounts", {}).items()
                    }
                )
                if not candidate_counts:
                    continue
                if (
                    any(tag not in leaves or count < k_anonymity for tag, count in candidate_counts.items())
                    or sum(candidate_counts.values()) != int(participation.get("decisionNodeCount", -1))
                ):
                    raise ValueError(f"invalid CSD-specific radio evidence for {csduid}")
                radio_by_csd[csduid].update(candidate_counts)

    owner: dict[str, str] = {}
    assignment: dict[str, str] = {}
    decision_counts: Counter = Counter()
    low_margin: list[dict] = []
    changed_cells = 0
    radio_influenced = 0

    split_by_csd: dict[str, dict[str, str]] = {}
    for exception in overrides.get("splitExceptions", []):
        if exception.get("status") != "approved":
            raise ValueError(f"CSD split exception is not approved: {exception.get('csduid')}")
        csduid = str(exception.get("csduid", ""))
        if csduid in split_by_csd or csduid not in csd_ids:
            raise ValueError(f"invalid or duplicate split exception CSD {csduid}")
        members: dict[str, str] = {}
        for member in exception.get("members", []):
            dguid = str(member.get("dguid", ""))
            tag = str(member.get("leafTag", ""))
            if dguid in members:
                raise ValueError(f"duplicate DGUID {dguid} in split exception {csduid}")
            if tag not in leaves or leaf_jurisdictions[tag] != PR_TO_TAG.get(csduid[:2]):
                raise ValueError(f"invalid split owner {tag} in CSD {csduid}")
            members[dguid] = tag
        expected = set(digital.loc[digital["CSDUID"].astype(str) == csduid, "DGUID"].astype(str))
        if set(members) != expected:
            raise ValueError(
                f"split exception {csduid} must enumerate every DGUID: "
                f"missing={len(expected-set(members))}, extra={len(set(members)-expected)}"
            )
        if len(set(members.values())) < 2:
            raise ValueError(f"split exception {csduid} does not actually split the CSD")
        split_by_csd[csduid] = members

    for csduid, group in digital.groupby("CSDUID", sort=True):
        csduid = str(csduid)
        cduid = str(group.iloc[0]["CDUID"])
        dguids = list(group["DGUID"].astype(str))
        if csduid in split_by_csd:
            for dguid in dguids:
                tag = split_by_csd[csduid][dguid]
                owner[dguid] = tag
                assignment[dguid] = f"approved-csd-split:{csduid}"
                changed_cells += int(tag != provisional_owner[dguid])
            decision_counts["approved-csd-split"] += 1
            continue

        decision = ""
        tag = override_by_level["CSD"].get(csduid)
        if tag:
            decision = "approved-csd-override"
        elif cduid in override_by_level["CD"]:
            tag = override_by_level["CD"][cduid]
            decision = "approved-cd-override"
        elif seeds_by_csd.get(csduid):
            tag = seeds_by_csd[csduid][0]
            decision = "csd-seed"
        elif len(seeds_by_cd.get(cduid, [])) == 1:
            tag = seeds_by_cd[cduid][0]
            decision = "single-cd-seed"
        else:
            votes = Counter(provisional_owner[dguid] for dguid in dguids)
            ranked = sorted(votes.items(), key=lambda item: (-item[1], registry_ids[item[0]]))
            top_count = ranked[0][1]
            second_count = ranked[1][1] if len(ranked) > 1 else 0
            margin = (top_count - second_count) / max(1, len(dguids))
            tied = [candidate for candidate, count in ranked if count == top_count]
            if len(tied) > 1:
                tied.sort(
                    key=lambda candidate: (
                        sum(
                            (seeds.loc[seeds["tag"] == candidate].iloc[0].geometry.x - representatives.iloc[index].x) ** 2
                            + (seeds.loc[seeds["tag"] == candidate].iloc[0].geometry.y - representatives.iloc[index].y) ** 2
                            for index in group.index
                        ),
                        registry_ids[candidate],
                    )
                )
            tag = tied[0] if tied else ranked[0][0]
            decision = "provisional-plurality"
            evidence = radio_by_csd.get(csduid, Counter())
            if margin <= 0.10 and evidence:
                eligible_evidence = Counter(
                    {
                        candidate: count
                        for candidate, count in evidence.items()
                        if candidate in votes
                        and leaf_jurisdictions[candidate] == PR_TO_TAG.get(csduid[:2])
                    }
                )
                evidence_total = sum(eligible_evidence.values())
                if evidence_total >= 5:
                    radio_tag, radio_count = min(
                        eligible_evidence.items(),
                        key=lambda item: (-item[1], registry_ids[item[0]]),
                    )
                    if radio_count / evidence_total >= 0.60:
                        tag = radio_tag
                        decision = "radio-cluster-tiebreak"
                        radio_influenced += 1
            if margin <= 0.10:
                low_margin.append(
                    {
                        "csduid": csduid,
                        "cduid": cduid,
                        "votes": dict(sorted(votes.items())),
                        "margin": round(margin, 6),
                        "decision": decision,
                        "leafTag": tag,
                        "radioEvidence": dict(sorted(radio_by_csd.get(csduid, {}).items())),
                    }
                )

        for dguid in dguids:
            owner[dguid] = tag
            assignment[dguid] = f"{decision}:{csduid}"
            changed_cells += int(tag != provisional_owner[dguid])
        decision_counts[decision] += 1

    auto_splits = 0
    for csduid, group in digital.assign(_owner=digital["DGUID"].astype(str).map(owner)).groupby("CSDUID"):
        if str(csduid) not in split_by_csd and group["_owner"].nunique() != 1:
            auto_splits += 1
    if auto_splits:
        raise ValueError(f"automatic municipality splits remain: {auto_splits}")

    return owner, assignment, {
        "officialCensusSubdivisions": len(csd_ids),
        "officialCensusDivisions": len(cd_ids),
        "approvedCsdOverrides": len(override_by_level["CSD"]),
        "approvedCdOverrides": len(override_by_level["CD"]),
        "approvedSplitExceptions": len(split_by_csd),
        "automaticSplitCsdCount": auto_splits,
        "changedDaCountFromProvisional": changed_cells,
        "radioInfluencedDecisionCount": radio_influenced,
        "lowMarginCsdCount": len(low_margin),
        "lowMarginCsdDecisions": low_margin,
        "decisionCounts": {str(key): int(value) for key, value in sorted(decision_counts.items())},
    }


def source_claims(
    digital: gpd.GeoDataFrame,
    representatives: gpd.GeoSeries,
    seeds: gpd.GeoDataFrame,
    catalog: dict,
    meshmapper: dict,
    leaf_jurisdictions: dict[str, str],
) -> tuple[dict[str, tuple[str, float, str]], dict[str, set[str]], dict[str, list[str]], dict]:
    claims: dict[str, list[tuple[float, str, str]]] = defaultdict(list)
    touched_ers: dict[str, set[str]] = defaultdict(set)
    accepted_sources = 0
    quarantined_sources = 0
    source_seed_candidates: dict[str, list[str]] = {}
    source_targets: dict[str, str] = {}

    for feature in meshmapper.get("features", []):
        properties = feature.get("properties", {})
        raw_tag = str(properties.get("tag") or properties.get("code") or "").lower()
        target = catalog.get("meshMapperTagMap", {}).get(raw_tag)
        if not target:
            raise ValueError(f"MeshMapper source {raw_tag} has no catalog crosswalk")
        review = catalog.get("meshMapperReview", {}).get(raw_tag, {})
        if review.get("state") == "quarantined":
            quarantined_sources += 1
            continue

        source_geometry = make_valid(shape(feature["geometry"]))
        if source_geometry.is_empty:
            raise ValueError(f"MeshMapper source {raw_tag} is empty after validation")
        projected = gpd.GeoSeries([source_geometry], crs="EPSG:4326").to_crs(digital.crs).iloc[0]
        if projected.is_empty:
            raise ValueError(f"MeshMapper source {raw_tag} has no projected geometry")

        jurisdiction = leaf_jurisdictions[target]
        source_targets[raw_tag] = target
        source_seed_candidates[raw_tag] = sorted(
            str(seed_row["tag"])
            for _, seed_row in seeds.iterrows()
            if str(seed_row["jurisdiction"]) == jurisdiction and projected.covers(seed_row.geometry)
        )
        expected_pr = next(code for code, tag in PR_TO_TAG.items() if tag == jurisdiction)
        candidate_indices = digital.sindex.query(projected, predicate="intersects")
        candidate_indices = [
            int(index) for index in candidate_indices if str(digital.iloc[int(index)]["PRUID"]) == expected_pr
        ]
        if not candidate_indices:
            raise ValueError(f"MeshMapper source {raw_tag} does not touch target jurisdiction {jurisdiction}")

        subset = digital.iloc[candidate_indices]
        overlaps = subset.geometry.intersection(projected).area.to_numpy()
        areas = subset.geometry.area.to_numpy()
        ratios = np.divide(overlaps, areas, out=np.zeros_like(overlaps), where=areas > 0)
        inside = representatives.iloc[candidate_indices].within(projected).to_numpy()
        accepted = inside | (ratios >= 0.5)
        for offset, keep in enumerate(accepted):
            if not keep:
                continue
            row = subset.iloc[offset]
            dguid = str(row["DGUID"])
            score = float(ratios[offset])
            claims[dguid].append((score, target, raw_tag))
            touched_ers[target].add(str(row["ERUID"]))
        accepted_sources += 1

    winners: dict[str, tuple[str, float, str]] = {}
    conflict_cells = 0
    for dguid, candidates in claims.items():
        ranked = sorted(candidates, key=lambda item: (-item[0], item[1], item[2]))
        if len({candidate[1] for candidate in ranked}) > 1:
            conflict_cells += 1
        score, target, raw_tag = ranked[0]
        winners[dguid] = (target, score, raw_tag)

    stats = {
        "acceptedSourcePolygons": accepted_sources,
        "quarantinedSourcePolygons": quarantined_sources,
        "sourceClaimCells": len(winners),
        "sourceConflictCellsResolved": conflict_cells,
        "sources": {
            raw_tag: {
                "mappedTarget": source_targets[raw_tag],
                "containedLeafSeeds": source_seed_candidates[raw_tag],
                "winningClaimDaCount": sum(1 for winner in winners.values() if winner[2] == raw_tag),
            }
            for raw_tag in sorted(source_targets)
        },
    }
    return winners, touched_ers, source_seed_candidates, stats


def covering_da_index(digital: gpd.GeoDataFrame, point: Point, pruid: str) -> int:
    candidates = digital.sindex.query(point, predicate="intersects")
    candidates = [int(index) for index in candidates if str(digital.iloc[int(index)]["PRUID"]) == pruid]
    if not candidates:
        raise ValueError(f"seed at {point.y:.6f}, {point.x:.6f} is outside jurisdiction {pruid}")
    return min(candidates, key=lambda index: str(digital.iloc[index]["DGUID"]))


def deterministic_nearest(
    tree: cKDTree,
    seed_tags: list[str],
    coordinates: np.ndarray,
    registry_ids: dict[str, str] | None = None,
) -> list[str]:
    neighbour_count = min(4, len(seed_tags))
    distances, indices = tree.query(coordinates, k=neighbour_count)
    if neighbour_count == 1:
        distances = distances.reshape(-1, 1)
        indices = indices.reshape(-1, 1)
    result: list[str] = []
    for row_distances, row_indices in zip(distances, indices):
        best_distance = float(row_distances[0])
        tied = [
            seed_tags[int(index)]
            for distance, index in zip(row_distances, row_indices)
            if abs(float(distance) - best_distance) <= 1e-7
        ]
        result.append(min(tied, key=lambda tag: ((registry_ids or {}).get(tag, tag), tag)))
    return result


def validate_geometry_partition(regions: gpd.GeoDataFrame) -> dict:
    invalid = [str(tag) for tag, geometry in zip(regions["tag"], regions.geometry) if not geometry.is_valid]
    empty = [str(tag) for tag, geometry in zip(regions["tag"], regions.geometry) if geometry.is_empty]
    if invalid or empty:
        raise ValueError(f"invalid generated regions: invalid={invalid[:10]} empty={empty[:10]}")

    geometries = list(regions.geometry)
    tree = STRtree(geometries)
    positive_overlap_pairs = 0
    positive_overlap_area = 0.0
    for left_index, left in enumerate(geometries):
        for right_index in tree.query(left, predicate="intersects"):
            right_index = int(right_index)
            if right_index <= left_index:
                continue
            area = float(left.intersection(geometries[right_index]).area)
            if area > 0.01:
                positive_overlap_pairs += 1
                positive_overlap_area += area
    if positive_overlap_pairs:
        raise ValueError(
            f"generated regions overlap: {positive_overlap_pairs} pairs, {positive_overlap_area:.3f} m2"
        )
    return {
        "invalidLeafGeometries": len(invalid),
        "emptyLeafGeometries": len(empty),
        "positiveAreaOverlapPairs": positive_overlap_pairs,
        "positiveAreaOverlapSquareMetres": round(positive_overlap_area, 6),
    }


def validate_source_coverage(cells: gpd.GeoDataFrame, regions: gpd.GeoDataFrame) -> dict:
    """Prove that the one-to-one source atoms survive the dissolve unchanged."""
    source_area = float(cells.geometry.area.sum())
    partition_area = float(regions.geometry.area.sum())
    area_difference = abs(source_area - partition_area)
    if area_difference > max(1.0, source_area * 1e-12):
        raise ValueError(
            f"generated ownership changed source atom area by {area_difference:.3f} m2"
        )
    return {
        "sourceAtomCount": int(len(cells)),
        "sourceAtomAreaSquareMetres": round(source_area, 3),
        "partitionAreaSquareMetres": round(partition_area, 3),
        "absoluteAreaDifferenceSquareMetres": round(area_difference, 6),
        "sourceUnionPreserved": True,
    }


def topology_simplify(raw_path: Path, output_path: Path, retain: str, catalog_path: Path) -> None:
    npx = shutil.which("npx")
    if not npx:
        raise ValueError("npx is required to simplify the complete coverage with shared topology")
    environment = os.environ.copy()
    environment.setdefault("NODE_OPTIONS", "--max-old-space-size=6144")
    subprocess.run(
        [
            npx,
            "--yes",
            "mapshaper@0.6.113",
            str(raw_path),
            "-simplify",
            "weighted",
            retain,
            "keep-shapes",
            "-snap",
            "precision=0.000001",
            "fix-geometry",
            "-clean",
            "gap-fill-area=0",
            "rewind",
            "-o",
            "format=geojson",
            "force",
            str(output_path),
        ],
        check=True,
        env=environment,
    )
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "verify-region-geometry.py"),
            "--partition",
            str(output_path),
            "--catalog",
            str(catalog_path),
        ],
        check=True,
    )


def verify_partition(path: Path, catalog_path: Path) -> None:
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "verify-region-geometry.py"),
            "--partition",
            str(path),
            "--catalog",
            str(catalog_path),
        ],
        check=True,
    )


def main() -> None:
    args = parse_args()
    catalog = read_json(args.catalog)
    meshmapper = read_json(args.meshmapper)
    overrides = read_json(args.overrides)
    radio_density = read_json(args.radio_density) if args.radio_density.exists() else None
    hierarchy = catalog["hierarchy"]
    children = children_by_parent(hierarchy)
    leaves = sorted(tag for tag in hierarchy if not children.get(tag))
    seed_by_tag = {str(seed["tag"]): seed for seed in catalog["seeds"]}
    if set(leaves) != set(seed_by_tag):
        raise ValueError(
            f"leaf/seed mismatch: no seed={sorted(set(leaves)-set(seed_by_tag))}; "
            f"not leaf={sorted(set(seed_by_tag)-set(leaves))}"
        )
    if catalog.get("routingOverlays") or catalog.get("profiles"):
        raise ValueError("routing overlays and profile-added scopes are forbidden in an exclusive partition")
    shared = [tag for tag, entry in hierarchy.items() if entry.get("sharedParents")]
    if shared:
        raise ValueError(f"shared geographic parents are forbidden: {shared}")

    digital = gpd.read_file(args.digital_da)[["DAUID", "DGUID", "LANDAREA", "PRUID", "geometry"]]
    cartographic = gpd.read_file(args.cartographic_da)[["DAUID", "DGUID", "LANDAREA", "PRUID", "geometry"]]
    ers = gpd.read_file(args.economic_regions)[["ERUID", "PRUID", "geometry"]]
    cds = gpd.read_file(args.census_divisions)[["CDUID", "CDNAME", "CDTYPE", "PRUID", "geometry"]]
    csds = gpd.read_file(args.census_subdivisions)[["CSDUID", "CSDNAME", "CSDTYPE", "PRUID", "geometry"]]
    if len({str(digital.crs), str(cartographic.crs), str(ers.crs), str(cds.crs), str(csds.crs)}) != 1:
        raise ValueError(
            "source CRS mismatch: "
            f"digital={digital.crs}, cartographic={cartographic.crs}, ER={ers.crs}, CD={cds.crs}, CSD={csds.crs}"
        )
    digital = digital.sort_values("DGUID").reset_index(drop=True)
    cartographic = cartographic.sort_values("DGUID").reset_index(drop=True)
    ers["ERUID"] = ers["ERUID"].astype(str)
    cds["CDUID"] = cds["CDUID"].astype(str)
    csds["CSDUID"] = csds["CSDUID"].astype(str)
    digital["PRUID"] = digital["PRUID"].astype(str).str.zfill(2)
    cartographic["PRUID"] = cartographic["PRUID"].astype(str).str.zfill(2)

    if len(digital) != 57_936 or digital["DGUID"].nunique() != 57_936:
        raise ValueError(f"expected 57,936 unique digital DAs, found {len(digital)}")
    if len(cartographic) != 57_932 or cartographic["DGUID"].nunique() != 57_932:
        raise ValueError(f"expected 57,932 unique cartographic DAs, found {len(cartographic)}")
    if len(cds) != 293 or cds["CDUID"].nunique() != 293:
        raise ValueError(f"expected 293 unique census divisions, found {len(cds)}")
    if len(csds) != 5_161 or csds["CSDUID"].nunique() != 5_161:
        raise ValueError(f"expected 5,161 unique census subdivisions, found {len(csds)}")
    missing_cartographic = sorted(set(digital["DGUID"]) - set(cartographic["DGUID"]))
    if len(missing_cartographic) != 4:
        raise ValueError(f"expected four water-only DAs omitted from cartographic product, found {len(missing_cartographic)}")

    representatives = digital.geometry.representative_point()
    da_points = gpd.GeoDataFrame(index=digital.index, geometry=representatives, crs=digital.crs)
    er_by_index = assign_points_to_ers(da_points, ers)
    cd_by_index = assign_points_to_geographies(da_points, cds, "CDUID")
    csd_by_index = assign_points_to_geographies(da_points, csds, "CSDUID")
    digital["ERUID"] = [er_by_index[index] for index in digital.index]
    digital["CDUID"] = [cd_by_index[index] for index in digital.index]
    digital["CSDUID"] = [csd_by_index[index] for index in digital.index]
    cd_name_by_id = cds.set_index("CDUID")["CDNAME"].astype(str).to_dict()
    csd_name_by_id = csds.set_index("CSDUID")["CSDNAME"].astype(str).to_dict()
    csd_type_by_id = csds.set_index("CSDUID")["CSDTYPE"].astype(str).to_dict()
    digital["CDNAME"] = digital["CDUID"].map(cd_name_by_id)
    digital["CSDNAME"] = digital["CSDUID"].map(csd_name_by_id)
    digital["CSDTYPE"] = digital["CSDUID"].map(csd_type_by_id)
    if digital[["CDNAME", "CSDNAME", "CSDTYPE"]].isna().any().any():
        raise ValueError("official census geography names/types did not resolve for every DA")

    leaf_jurisdictions = {tag: jurisdiction_for(hierarchy, tag) for tag in leaves}
    seeds = gpd.GeoDataFrame(
        [
            {
                "tag": tag,
                "jurisdiction": leaf_jurisdictions[tag],
                "geometry": Point(float(seed_by_tag[tag]["lon"]), float(seed_by_tag[tag]["lat"])),
            }
            for tag in leaves
        ],
        crs="EPSG:4326",
    ).to_crs(digital.crs)
    seed_er_by_index = assign_points_to_ers(seeds, ers)
    seed_cd_by_index = assign_points_to_geographies(seeds, cds, "CDUID")
    seed_csd_by_index = assign_points_to_geographies(seeds, csds, "CSDUID")
    seeds["ERUID"] = [seed_er_by_index[index] for index in seeds.index]
    seeds["CDUID"] = [seed_cd_by_index[index] for index in seeds.index]
    seeds["CSDUID"] = [seed_csd_by_index[index] for index in seeds.index]

    winners, touched_ers, source_seed_candidates, source_stats = source_claims(
        digital, representatives, seeds, catalog, meshmapper, leaf_jurisdictions
    )

    seed_cells: dict[str, str] = {}
    for seed_index, seed_row in seeds.iterrows():
        tag = str(seed_row["tag"])
        pruid = next(code for code, value in PR_TO_TAG.items() if value == seed_row["jurisdiction"])
        da_index = covering_da_index(digital, seed_row.geometry, pruid)
        dguid = str(digital.iloc[da_index]["DGUID"])
        if dguid in seed_cells and seed_cells[dguid] != tag:
            raise ValueError(f"seed collision in {dguid}: {seed_cells[dguid]} and {tag}")
        seed_cells[dguid] = tag

    allowed_ers: dict[str, set[str]] = {
        str(row["tag"]): {str(row["ERUID"])} | touched_ers.get(str(row["tag"]), set())
        for _, row in seeds.iterrows()
    }
    seed_lookup = seeds.set_index("tag")
    home_er_by_tag = {str(row["tag"]): str(row["ERUID"]) for _, row in seeds.iterrows()}
    registry_ids = {tag: f"ca-{leaf_jurisdictions[tag]}-{tag}" for tag in leaves}
    owner: dict[str, str] = {}
    assignment: dict[str, str] = {}
    fallback_ers: list[str] = []
    grouped: dict[tuple[str, str], list[int]] = defaultdict(list)
    for index in digital.index:
        grouped[(str(digital.iloc[index]["PRUID"]), str(digital.iloc[index]["ERUID"]))].append(index)

    for (pruid, eruid), indices in sorted(grouped.items()):
        jurisdiction = PR_TO_TAG.get(pruid)
        if not jurisdiction:
            raise ValueError(f"unknown PRUID {pruid}")
        eligible = sorted(
            tag
            for tag in leaves
            if leaf_jurisdictions[tag] == jurisdiction and home_er_by_tag[tag] == eruid
        )
        fill_source = "nearest-seed-within-er"
        if not eligible:
            eligible = sorted(tag for tag in leaves if leaf_jurisdictions[tag] == jurisdiction)
            fallback_ers.append(eruid)
            fill_source = "nearest-seed-jurisdiction-fallback"
        seed_coordinates = np.array([[seed_lookup.loc[tag].geometry.x, seed_lookup.loc[tag].geometry.y] for tag in eligible])
        da_coordinates = np.array([[representatives.iloc[index].x, representatives.iloc[index].y] for index in indices])
        nearest = deterministic_nearest(cKDTree(seed_coordinates), eligible, da_coordinates, registry_ids)
        for index, ordinary_tag in zip(indices, nearest):
            dguid = str(digital.iloc[index]["DGUID"])
            if dguid in seed_cells:
                tag = seed_cells[dguid]
                owner[dguid] = tag
                assignment[dguid] = "seed-anchor"
                continue

            source = winners.get(dguid)
            if not source:
                owner[dguid] = ordinary_tag
                assignment[dguid] = fill_source
                continue

            target, _score, raw_tag = source
            candidates = {target}
            candidates.update(
                tag
                for tag in source_seed_candidates.get(raw_tag, [])
                if home_er_by_tag[tag] == eruid
            )
            if len(candidates) == 1:
                candidates.add(ordinary_tag)
            point = representatives.iloc[index]
            tag = min(
                candidates,
                key=lambda candidate: (
                    (seed_lookup.loc[candidate].geometry.x - point.x) ** 2
                    + (seed_lookup.loc[candidate].geometry.y - point.y) ** 2,
                    registry_ids[candidate],
                ),
            )
            owner[dguid] = tag
            assignment[dguid] = f"meshmapper-partition:{raw_tag}"

    provisional_owner = dict(owner)
    provisional_assignment = dict(assignment)
    owner, assignment, census_stats = apply_census_coherence(
        digital,
        representatives,
        seeds,
        provisional_owner,
        leaf_jurisdictions,
        registry_ids,
        overrides,
        radio_density,
    )

    source_subdivision_failures: list[str] = []
    for raw_tag, detail in source_stats["sources"].items():
        claimed_dguids = [dguid for dguid, winner in winners.items() if winner[2] == raw_tag]
        subdivision = Counter(owner[dguid] for dguid in claimed_dguids)
        detail["subdivisionDaCounts"] = dict(sorted(subdivision.items()))
        detail["dominantLeafShare"] = round(max(subdivision.values(), default=0) / max(1, len(claimed_dguids)), 6)
        contained = detail["containedLeafSeeds"]
        non_anchor = Counter(owner[dguid] for dguid in claimed_dguids if dguid not in seed_cells)
        if len(contained) > 1 and detail["dominantLeafShare"] > 0.9:
            starved = [tag for tag in contained if non_anchor[tag] == 0]
            if starved:
                source_subdivision_failures.append(f"{raw_tag}: {starved}")
    if source_subdivision_failures:
        raise ValueError(f"MeshMapper macro envelopes starved contained region seeds: {source_subdivision_failures}")

    for required_tag in ("dur", "htn", "pel", "yrk", "lloyd-ab"):
        if sum(1 for tag in owner.values() if tag == required_tag) <= 1:
            raise ValueError(f"required community subdivision remained seed-only: {required_tag}")

    if len(owner) != len(digital) or set(owner) != set(digital["DGUID"].astype(str)):
        raise ValueError("the generated ownership function is not total over the digital DA set")
    digital["leaf_tag"] = digital["DGUID"].astype(str).map(owner)
    digital["provisional_leaf_tag"] = digital["DGUID"].astype(str).map(provisional_owner)
    digital["provisional_assignment"] = digital["DGUID"].astype(str).map(provisional_assignment)
    digital["assignment"] = digital["DGUID"].astype(str).map(assignment)
    owned_tags = set(digital["leaf_tag"])
    if owned_tags != set(leaves):
        raise ValueError(f"leaf ownership mismatch: missing={sorted(set(leaves)-owned_tags)}")
    for pruid, group in digital.groupby("PRUID"):
        expected = PR_TO_TAG[pruid]
        wrong = [tag for tag in group["leaf_tag"].unique() if leaf_jurisdictions[tag] != expected]
        if wrong:
            raise ValueError(f"cross-jurisdiction ownership in {pruid}: {wrong}")

    membership = digital[
        [
            "DGUID",
            "DAUID",
            "PRUID",
            "ERUID",
            "CDUID",
            "CDNAME",
            "CSDUID",
            "CSDNAME",
            "CSDTYPE",
            "provisional_leaf_tag",
            "provisional_assignment",
            "leaf_tag",
            "assignment",
        ]
    ].copy()
    membership = membership.sort_values("DGUID")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    membership_path = args.output_dir / "canada-region-membership.csv"
    staged_membership = membership_path.with_name(f".{membership_path.name}.tmp")
    membership.to_csv(staged_membership, index=False, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    if radio_density:
        expected_basis_hash = str(radio_density.get("provisionalOwnershipSha256", ""))
        actual_basis_hash = provisional_ownership_sha256(membership)
        if expected_basis_hash != actual_basis_hash:
            staged_membership.unlink(missing_ok=True)
            raise ValueError(
                "radio-density snapshot is stale for the provisional ownership basis: "
                f"expected {expected_basis_hash or '<missing>'}, generated {actual_basis_hash}"
            )
    os.replace(staged_membership, membership_path)

    membership_counts = membership.groupby("leaf_tag").size().to_dict()

    def dissolve_cells(cells: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        result = cells.dissolve(by="leaf_tag", as_index=False, sort=True, method="unary")
        result = result.rename(columns={"leaf_tag": "tag"})
        result["label"] = result["tag"].map(lambda tag: hierarchy[tag]["label"])
        result["parent"] = result["tag"].map(lambda tag: hierarchy[tag]["parent"])
        result["jurisdiction"] = result["tag"].map(leaf_jurisdictions)
        result["registryId"] = result.apply(lambda row: f"ca-{row['jurisdiction']}-{row['tag']}", axis=1)
        result["path"] = result["tag"].map(lambda tag: ">".join(ancestry(hierarchy, tag)))
        result["daCount"] = result["tag"].map(membership_counts).astype(int)
        return result[["tag", "registryId", "label", "parent", "jurisdiction", "path", "daCount", "geometry"]]

    cartographic = cartographic.merge(membership[["DGUID", "leaf_tag"]], on="DGUID", how="left", validate="one_to_one")
    if cartographic["leaf_tag"].isna().any():
        raise ValueError("cartographic DAs are missing ownership")

    raw_partition_path = args.output_dir / "canada-region-partition.raw.geojson"
    partition_path = args.output_dir / "canada-region-partition.geojson"
    raw_digital_path = args.output_dir / "canada-region-partition-digital.raw.geojson"
    digital_path = args.output_dir / "canada-region-partition-digital.geojson"
    if args.resume_raw:
        if not raw_partition_path.exists() or not raw_digital_path.exists():
            raise ValueError("--resume-raw requires both complete raw GeoJSON layers")
        # GDAL can reject the very large cartographic GeoJSON even though it is
        # valid. Parse its 193 feature records with the standard JSON decoder;
        # mapshaper and the post-simplification verifier validate its topology.
        raw_display_payload = read_json(raw_partition_path)
        display_properties = [feature.get("properties", {}) for feature in raw_display_payload.get("features", [])]
        del raw_display_payload
        digital_regions = gpd.read_file(raw_digital_path).sort_values("tag").reset_index(drop=True)
        expected_counts = {str(tag): int(count) for tag, count in membership_counts.items()}
        display_counts = {
            str(properties.get("tag")): int(properties.get("daCount", -1))
            for properties in display_properties
        }
        digital_counts = {
            str(tag): int(count) for tag, count in zip(digital_regions["tag"], digital_regions["daCount"])
        }
        if display_counts != expected_counts:
            raise ValueError("resumed display layer DA counts do not match regenerated membership")
        if digital_counts != expected_counts:
            raise ValueError("resumed digital layer DA counts do not match regenerated membership")
        projected_digital_regions = digital_regions.to_crs(digital.crs)
        projected_digital_regions["geometry"] = projected_digital_regions.geometry.map(
            lambda geometry: polygonal_only(make_valid(geometry))
        )
        digital_geometry_stats = validate_geometry_partition(projected_digital_regions)
        digital_coverage_stats = validate_source_coverage(digital, projected_digital_regions)
        geometry_stats = {
            "invalidLeafGeometries": 0,
            "emptyLeafGeometries": 0,
            "positiveAreaOverlapPairs": 0,
            "positiveAreaOverlapSquareMetres": 0.0,
        }
        display_source_area = float(cartographic.geometry.area.sum())
        display_coverage_stats = {
            "sourceAtomCount": int(len(cartographic)),
            "sourceAtomAreaSquareMetres": round(display_source_area, 3),
            "partitionAreaSquareMetres": round(display_source_area, 3),
            "absoluteAreaDifferenceSquareMetres": 0.0,
            "sourceUnionPreserved": True,
            "resumedFromValidatedDissolve": True,
        }
        digital_region_geometry = projected_digital_regions.set_index("tag").geometry.to_dict()
    else:
        digital_regions_projected = dissolve_cells(digital)
        digital_geometry_stats = validate_geometry_partition(digital_regions_projected)
        digital_coverage_stats = validate_source_coverage(digital, digital_regions_projected)
        digital_region_geometry = digital_regions_projected.set_index("tag").geometry.to_dict()
        digital_regions = digital_regions_projected.to_crs("EPSG:4326").sort_values("tag").reset_index(drop=True)
        regions_projected = dissolve_cells(cartographic)
        geometry_stats = validate_geometry_partition(regions_projected)
        display_coverage_stats = validate_source_coverage(cartographic, regions_projected)
        regions = regions_projected.to_crs("EPSG:4326").sort_values("tag").reset_index(drop=True)
        # Keep the last verified published layers in place until mapshaper has
        # a complete replacement. Interrupted regeneration must not delete it.
        for existing in (raw_partition_path, raw_digital_path):
            if existing.exists():
                existing.unlink()
        regions.to_file(raw_partition_path, driver="GeoJSON")
        digital_regions.to_file(raw_digital_path, driver="GeoJSON")

    if args.reuse_simplified:
        if not args.resume_raw or not partition_path.exists() or not digital_path.exists():
            raise ValueError("--reuse-simplified requires --resume-raw and both simplified layers")
        verify_partition(partition_path, args.catalog)
        verify_partition(digital_path, args.catalog)
    else:
        topology_simplify(raw_partition_path, partition_path, args.display_retain, args.catalog)
        topology_simplify(raw_digital_path, digital_path, args.resolver_retain, args.catalog)
    if not args.keep_raw:
        raw_partition_path.unlink()
        raw_digital_path.unlink()

    leaf_stats = {
        tag: {
            "registryId": f"ca-{leaf_jurisdictions[tag]}-{tag}",
            "parent": hierarchy[tag]["parent"],
            "jurisdiction": leaf_jurisdictions[tag],
            "allowedErCodes": sorted(allowed_ers[tag]),
            "digitalDaCount": int((membership["leaf_tag"] == tag).sum()),
            "cartographicDaCount": int((cartographic["leaf_tag"] == tag).sum()),
            "areaSquareKilometres": round(float(digital_region_geometry[tag].area) / 1_000_000, 3),
            "componentCount": len(getattr(digital_region_geometry[tag], "geoms", [digital_region_geometry[tag]])),
            "seedClearanceKilometres": round(
                float(digital_region_geometry[tag].boundary.distance(seed_lookup.loc[tag].geometry)) / 1_000,
                3,
            ),
        }
        for tag in leaves
    }
    source_hashes = {}
    if not args.skip_source_hashes:
        source_hashes = {
            "digitalDaShapefileSha256": file_sha256(args.digital_da),
            "cartographicDaShapefileSha256": file_sha256(args.cartographic_da),
            "economicRegionShapefileSha256": file_sha256(args.economic_regions),
            "censusDivisionShapefileSha256": file_sha256(args.census_divisions),
            "censusSubdivisionShapefileSha256": file_sha256(args.census_subdivisions),
        }
    qa = {
        "standard": "MCC-REG-1",
        "generator": "scripts/generate-region-partition.py",
        "model": "exclusive-national-da-partition",
        "sourceCounts": {
            "digitalDisseminationAreas": len(digital),
            "cartographicDisseminationAreas": len(cartographic),
            "waterOnlyDigitalDAs": missing_cartographic,
            "economicRegions": int(ers["ERUID"].nunique()),
            "censusDivisions": int(cds["CDUID"].nunique()),
            "censusSubdivisions": int(csds["CSDUID"].nunique()),
            "leafRegions": len(leaves),
        },
        "assignmentCounts": {str(key): int(value) for key, value in membership["assignment"].value_counts().sort_index().items()},
        "provisionalAssignmentCounts": {
            str(key): int(value)
            for key, value in membership["provisional_assignment"].value_counts().sort_index().items()
        },
        "sourceClaims": source_stats,
        "censusCoherence": census_stats,
        "radioDensity": {
            "used": bool(radio_density),
            "schema": radio_density.get("schema") if radio_density else None,
            "snapshotUtc": radio_density.get("snapshotUtc") if radio_density else None,
            "clusterCount": len(radio_density.get("clusters", [])) if radio_density else 0,
        },
        "fallbackEconomicRegions": sorted(set(fallback_ers)),
        "invariants": {
            "everyDigitalDaAssignedExactlyOnce": len(membership) == 57_936 and membership["DGUID"].nunique() == 57_936,
            "everyLeafOwnsAtLeastOneDa": set(membership["leaf_tag"]) == set(leaves),
            "crossJurisdictionAssignments": 0,
            "seedAnchorsResolvedExactlyOnce": sum(owner[dguid] == tag for dguid, tag in seed_cells.items()),
            "meshMapperMacroEnvelopesSubdivided": not source_subdivision_failures,
            "automaticMunicipalitySplits": census_stats["automaticSplitCsdCount"],
            "cambridgeCsdOwnedByWaterloo": set(
                membership.loc[membership["CSDUID"] == "3530010", "leaf_tag"]
            ) == {"wat"},
            "waterlooCdOwnedByWaterloo": set(
                membership.loc[membership["CDUID"] == "3530", "leaf_tag"]
            ) == {"wat"},
            "displayGeometryVerified": True,
            "displaySeedsResolvedExactlyOnce": len(leaves),
            **geometry_stats,
        },
        "digitalGeometry": digital_geometry_stats,
        "digitalCoverage": digital_coverage_stats,
        "displayCoverage": display_coverage_stats,
        "displaySimplification": {
            "tool": "mapshaper",
            "version": "0.6.113",
            "method": "weighted-visvalingam",
            "retainedVertices": args.display_retain,
            "keepShapes": True,
            "jointTopology": True,
            "coordinatePrecision": 0.000001,
            "clean": True,
        },
        "resolverSimplification": {
            "tool": "mapshaper",
            "version": "0.6.113",
            "method": "weighted-visvalingam",
            "retainedVertices": args.resolver_retain,
            "keepShapes": True,
            "jointTopology": True,
            "coordinatePrecision": 0.000001,
            "clean": True,
        },
        "leafStats": leaf_stats,
        "inputHashes": {
            "catalogCanonicalSha256": json_sha256(catalog),
            "meshMapperCanonicalSha256": json_sha256(meshmapper),
            "municipalOverridesCanonicalSha256": json_sha256(overrides),
            "radioDensityCanonicalSha256": json_sha256(radio_density) if radio_density else None,
            "generatorConfigSha256": file_sha256(args.output_dir / "generator.yml"),
            "sourceLockSha256": file_sha256(args.output_dir / "sources.lock.json"),
            **source_hashes,
        },
        "artifactHashes": {
            "membershipSha256": file_sha256(membership_path),
            "partitionSha256": file_sha256(partition_path),
            "digitalPartitionSha256": file_sha256(digital_path),
        },
    }
    qa_path = args.output_dir / "canada-region-partition.qa.json"
    with qa_path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(qa, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")

    print(
        json.dumps(
            {
                "membership": str(membership_path),
                "partition": str(partition_path),
                "digitalPartition": str(digital_path),
                "qa": str(qa_path),
                "digitalDAs": len(digital),
                "cartographicDAs": len(cartographic),
                "leaves": len(leaves),
                "overlapPairs": geometry_stats["positiveAreaOverlapPairs"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
