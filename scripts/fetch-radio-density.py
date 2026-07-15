#!/usr/bin/env python3
"""Freeze privacy-safe Canadian radio-cluster evidence for region generation.

Raw node identifiers, names, and coordinates are used only in memory.  The
published artifact contains k-anonymous cluster counts by official CSD and
candidate region; it never contains an exact position or public key.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import urllib.parse
import urllib.request
from collections import Counter
from datetime import UTC, datetime, timedelta
from pathlib import Path

import geopandas as gpd
import pandas as pd
from scipy.cluster.hierarchy import fclusterdata
from shapely.geometry import Point


LIVE_URL = "https://live.meshcore.ca/api/nodes"
DEV_URL = "https://dev.meshcore.ca/api/v1/nodes"
SUPPORTED_ROLES = {"companion", "repeater", "room", "sensor"}
DECISION_ROLES = {"repeater", "room", "sensor"}
DEV_ROLE_NAMES = {
    "companion": "companion",
    "repeater": "repeater",
    "room": "room",
    "room_server": "room",
    "sensor": "sensor",
}
DEV_ROLE_CODES = {"1": "companion", "2": "repeater", "3": "room", "4": "sensor"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--digital-da", type=Path, required=True)
    parser.add_argument("--census-subdivisions", type=Path, required=True)
    parser.add_argument("--membership", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fresh-days", type=int, default=30)
    parser.add_argument("--cluster-km", type=float, default=30.0, help="Maximum complete-linkage cluster diameter")
    parser.add_argument("--k-anonymity", type=int, default=5)
    return parser.parse_args()


def fetch_json(url: str) -> tuple[dict, bytes]:
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "MeshCore-Canada-region-generator/1"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read()
    return json.loads(payload), payload


def fetch_live() -> tuple[list[dict], str, int]:
    nodes: list[dict] = []
    hashes = hashlib.sha256()
    limit = 500
    offset = 0
    pages = 0
    seen_page_fingerprints: set[str] = set()
    while offset < 10_000:
        url = f"{LIVE_URL}?limit={limit}&offset={offset}"
        payload, raw = fetch_json(url)
        hashes.update(raw)
        page = payload.get("nodes", [])
        pages += 1
        fingerprint = hashlib.sha256(raw).hexdigest()
        if fingerprint in seen_page_fingerprints:
            break
        seen_page_fingerprints.add(fingerprint)
        nodes.extend(page)
        if len(page) < limit:
            break
        offset += len(page)
    return nodes, hashes.hexdigest(), pages


def fetch_dev() -> tuple[list[dict], str, int]:
    nodes: list[dict] = []
    hashes = hashlib.sha256()
    cursor: str | None = None
    pages = 0
    while pages < 250:
        query = {"limit": "50"}
        if cursor:
            query["cursor"] = cursor
        url = f"{DEV_URL}?{urllib.parse.urlencode(query)}"
        payload, raw = fetch_json(url)
        hashes.update(raw)
        page = payload.get("items", [])
        pages += 1
        if not page:
            break
        nodes.extend(page)
        next_cursor = payload.get("nextCursor")
        if payload.get("hasMore") is not True or not next_cursor or next_cursor == cursor:
            break
        cursor = str(next_cursor)
    return nodes, hashes.hexdigest(), pages


def parse_timestamp(value: object) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.astimezone(UTC)
    except ValueError:
        return None


def valid_coordinate(lat: object, lon: object) -> tuple[float, float] | None:
    try:
        latitude = float(lat)
        longitude = float(lon)
    except (TypeError, ValueError):
        return None
    if not (math.isfinite(latitude) and math.isfinite(longitude)):
        return None
    if (latitude == 0 and longitude == 0) or not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return None
    return latitude, longitude


def provisional_ownership_sha256(membership: pd.DataFrame) -> str:
    """Bind evidence to the pre-radio candidate assignment, not its own output."""
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


def components(points: list[Point], maximum_diameter_metres: float) -> list[list[int]]:
    """Create compact clusters that cannot chain across a populated corridor."""
    coordinates = [(point.x, point.y) for point in points]
    labels = fclusterdata(
        coordinates,
        t=maximum_diameter_metres,
        criterion="distance",
        metric="euclidean",
        method="complete",
    )
    groups: dict[int, list[int]] = {}
    for index, label in enumerate(labels):
        groups.setdefault(int(label), []).append(index)
    return sorted(groups.values(), key=lambda group: (-len(group), min(group)))


def main() -> None:
    args = parse_args()
    snapshot = datetime.now(UTC).replace(microsecond=0)
    cutoff = snapshot - timedelta(days=args.fresh_days)

    live_nodes, live_hash, live_pages = fetch_live()
    dev_nodes, dev_hash, dev_pages = fetch_dev()

    live_by_key: dict[str, dict] = {}
    live_rejected_role = 0
    live_rejected_stale = 0
    live_rejected_coordinate = 0
    duplicate_live = 0
    for node in live_nodes:
        key = str(node.get("public_key", "")).lower()
        role = str(node.get("role", "")).lower()
        if not key:
            continue
        if role not in SUPPORTED_ROLES:
            live_rejected_role += 1
            continue
        seen = parse_timestamp(node.get("last_seen") or node.get("last_heard"))
        if not seen or seen < cutoff:
            live_rejected_stale += 1
            continue
        coordinate = valid_coordinate(node.get("lat"), node.get("lon"))
        if not coordinate:
            live_rejected_coordinate += 1
            continue
        prior = live_by_key.get(key)
        if prior:
            duplicate_live += 1
            if prior["seen"] >= seen:
                continue
        live_by_key[key] = {
            "key": key,
            "lat": coordinate[0],
            "lon": coordinate[1],
            "role": role,
            "seen": seen,
        }

    dev_by_key: dict[str, dict] = {}
    dev_rejected_role = 0
    dev_rejected_coordinate = 0
    duplicate_dev = 0
    for node in dev_nodes:
        key = str(node.get("publicKey", "")).lower()
        role_name = str(node.get("nodeTypeName", "")).lower()
        role = DEV_ROLE_NAMES.get(role_name) or DEV_ROLE_CODES.get(str(node.get("nodeType", "")))
        if not key:
            continue
        if role not in SUPPORTED_ROLES:
            dev_rejected_role += 1
            continue
        coordinate = valid_coordinate(node.get("lat"), node.get("lng"))
        if not coordinate:
            dev_rejected_coordinate += 1
            continue
        if key in dev_by_key:
            duplicate_dev += 1
            continue
        dev_by_key[key] = {
            "key": key,
            "lat": coordinate[0],
            "lon": coordinate[1],
            "role": role,
        }

    records: list[dict] = []
    dev_matches = 0
    cross_source_conflicts = 0
    cross_source_role_mismatches = 0
    dev_only_positioned = 0
    for key in sorted(set(live_by_key) | set(dev_by_key)):
        live = live_by_key.get(key)
        dev = dev_by_key.get(key)
        if live and dev:
            dev_matches += 1
            if abs(live["lat"] - dev["lat"]) > 0.1 or abs(live["lon"] - dev["lon"]) > 0.1:
                cross_source_conflicts += 1
                continue
            cross_source_role_mismatches += int(live["role"] != dev["role"])
        selected = live or dev
        if selected is None:
            continue
        if live is None:
            dev_only_positioned += 1
        records.append(
            {
                "key": key,
                "lat": selected["lat"],
                "lon": selected["lon"],
                "role": selected["role"],
                # The dev directory does not expose a per-node observation
                # timestamp. Dev-only nodes inform density, but only fresh live
                # fixed infrastructure may influence a boundary decision.
                "decisionEligible": live is not None and selected["role"] in DECISION_ROLES,
                "source": "live+dev" if live and dev else ("live" if live else "dev"),
            }
        )

    points = gpd.GeoDataFrame(
        records,
        geometry=[Point(record["lon"], record["lat"]) for record in records],
        crs="EPSG:4326",
    )
    digital = gpd.read_file(args.digital_da)[["DGUID", "geometry"]]
    csds = gpd.read_file(args.census_subdivisions)[["CSDUID", "geometry"]]
    points = points.to_crs(digital.crs)
    points = gpd.sjoin(points, digital, how="inner", predicate="within").drop(columns=["index_right"])
    points = gpd.sjoin(points, csds, how="inner", predicate="within").drop(columns=["index_right"])
    points = points.drop_duplicates("key", keep="first").reset_index(drop=True)
    membership = pd.read_csv(args.membership, dtype=str, keep_default_na=False)
    if "provisional_leaf_tag" not in membership.columns:
        raise ValueError("membership does not contain provisional_leaf_tag")
    candidate_column = "provisional_leaf_tag"
    points = points.merge(
        membership[["DGUID", candidate_column]],
        on="DGUID",
        how="left",
        validate="many_to_one",
    ).rename(columns={candidate_column: "candidate"})
    if points["candidate"].isna().any():
        raise ValueError("radio points joined to DAs missing from membership")

    clusters: list[dict] = []
    suppressed_small_clusters = 0
    suppressed_geographic_clusters = 0
    suppressed_candidate_aggregates = 0
    for group in components(list(points.geometry), args.cluster_km * 1000):
        if len(group) < args.k_anonymity:
            suppressed_small_clusters += 1
            continue
        observed = points.iloc[group]
        public_csds: list[dict] = []
        for csduid, observed_count in sorted(
            Counter(str(value) for value in observed["CSDUID"]).items()
        ):
            if observed_count < args.k_anonymity:
                continue
            participation: dict = {
                "id": csduid,
                "observedNodeCount": int(observed_count),
            }
            local_decision = observed[
                (observed["CSDUID"].astype(str) == csduid) & observed["decisionEligible"]
            ]
            candidate_counts = Counter(str(value) for value in local_decision["candidate"])
            if (
                sum(candidate_counts.values()) >= args.k_anonymity
                and candidate_counts
                and min(candidate_counts.values()) >= args.k_anonymity
            ):
                participation["decisionNodeCount"] = int(sum(candidate_counts.values()))
                participation["decisionCandidateCounts"] = {
                    key: int(value) for key, value in sorted(candidate_counts.items())
                }
            elif candidate_counts:
                # Suppress the entire decision breakdown instead of exposing or
                # silently discarding a candidate bucket with fewer than k nodes.
                suppressed_candidate_aggregates += 1
            public_csds.append(participation)
        if not public_csds:
            suppressed_geographic_clusters += 1
            continue
        identity = json.dumps(
            {"csds": public_csds},
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
        cluster = {
            "id": f"radio-{hashlib.sha256(identity).hexdigest()[:12]}",
            "nodeCount": int(sum(item["observedNodeCount"] for item in public_csds)),
            "observedNodeCount": int(sum(item["observedNodeCount"] for item in public_csds)),
            "censusSubdivisions": public_csds,
        }
        published_decision_count = sum(item.get("decisionNodeCount", 0) for item in public_csds)
        if published_decision_count:
            cluster["decisionNodeCount"] = int(published_decision_count)
        clusters.append(cluster)
    clusters.sort(key=lambda item: item["id"])

    output = {
        "schema": "mcc-radio-density/v2",
        "snapshotUtc": snapshot.isoformat().replace("+00:00", "Z"),
        "provisionalOwnershipSha256": provisional_ownership_sha256(membership),
        "privacy": {
            "rawIdentifiersPersisted": 0,
            "rawCoordinatesPersisted": 0,
            "kAnonymity": args.k_anonymity,
            "publishedGeographicCountMinimum": args.k_anonymity,
            "clusterMaximumDiameterKilometres": args.cluster_km,
            "observedRoles": sorted(SUPPORTED_ROLES),
            "decisionRoles": sorted(DECISION_ROLES),
            "liveFreshnessDays": args.fresh_days,
            "devNodeTimestampAvailable": False,
            "devOnlyUse": "advisory-density-only",
            "decisionEvidenceUnit": "cluster-census-subdivision-candidate",
        },
        "sourceAudit": {
            "live": {
                "url": LIVE_URL,
                "pages": live_pages,
                "records": len(live_nodes),
                "acceptedFreshPositionedRecords": len(live_by_key),
                "responseSha256": live_hash,
            },
            "dev": {
                "url": DEV_URL,
                "pages": dev_pages,
                "records": len(dev_nodes),
                "acceptedPositionedRecords": len(dev_by_key),
                "nodeTimestampAvailable": False,
                "responseSha256": dev_hash,
            },
            "deduplicatedPositionedNodes": len(records),
            "devOnlyPositionedNodes": dev_only_positioned,
            "insideCanada": int(len(points)),
            "fixedInfrastructureInsideCanada": int(
                points["role"].isin(DECISION_ROLES).sum()
            ),
            "decisionEligibleFixedInfrastructureInsideCanada": int(points["decisionEligible"].sum()),
            "devOnlyInsideCanada": int((points["source"] == "dev").sum()),
            "devMatchedLive": dev_matches,
            "crossSourceCoordinateConflictsExcluded": cross_source_conflicts,
            "crossSourceRoleMismatches": cross_source_role_mismatches,
            "duplicateLiveRecords": duplicate_live,
            "duplicateDevRecords": duplicate_dev,
            "liveRejectedRole": live_rejected_role,
            "liveRejectedStale": live_rejected_stale,
            "liveRejectedCoordinate": live_rejected_coordinate,
            "devRejectedRole": dev_rejected_role,
            "devRejectedCoordinate": dev_rejected_coordinate,
            "suppressedSmallClusters": suppressed_small_clusters,
            "suppressedGeographicClusters": suppressed_geographic_clusters,
            "suppressedCandidateAggregates": suppressed_candidate_aggregates,
        },
        "clusters": clusters,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(output, handle, indent=2, sort_keys=True)
        handle.write("\n")
    print(json.dumps({"output": str(args.output), "clusters": len(clusters), "insideCanada": len(points)}, indent=2))


if __name__ == "__main__":
    main()
