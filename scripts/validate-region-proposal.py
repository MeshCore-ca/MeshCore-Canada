#!/usr/bin/env python3
"""Validate and canonicalize a human region-editor proposal.

This tool deliberately has no apply mode.  It reads the authoritative
membership and writes a separate, valid-but-not-approved review artifact.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import unicodedata
from collections import Counter
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point


PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v1"
NEW_REGION_PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v2"
PROPOSAL_SCHEMAS = frozenset({PROPOSAL_SCHEMA, NEW_REGION_PROPOSAL_SCHEMA})
OUTPUT_SCHEMA = "mcc-region-editor-reviewed-diff/v1"
NEW_REGION_OUTPUT_SCHEMA = "mcc-region-editor-reviewed-diff/v2"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
DGUID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
TAG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,28}$")
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--proposal", type=Path, required=True)
    parser.add_argument("--membership", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--digital-da", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="Separate canonical review JSON")
    return parser.parse_args()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def dataset_sha256(path: Path) -> str:
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


def catalog_leaves(catalog: dict) -> tuple[set[str], dict[str, str]]:
    hierarchy = catalog.get("hierarchy")
    if not isinstance(hierarchy, dict):
        raise ValueError("catalog hierarchy must be an object")
    parents = {str(entry.get("parent")) for entry in hierarchy.values() if entry.get("parent")}
    leaves = set(hierarchy) - parents
    jurisdictions: dict[str, str] = {}
    for leaf in leaves:
        path: list[str] = []
        seen: set[str] = set()
        current = leaf
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


def seed_cells(digital: gpd.GeoDataFrame, catalog: dict) -> dict[str, str]:
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


def clean_optional_string(proposal: dict, key: str, maximum: int) -> str | None:
    if key not in proposal or proposal[key] is None:
        return None
    if not isinstance(proposal[key], str):
        raise ValueError(f"{key} must be a string")
    value = " ".join(proposal[key].strip().split())
    if not value:
        return None
    if len(value) > maximum:
        raise ValueError(f"{key} is longer than {maximum} characters")
    if any(ord(character) < 32 for character in value):
        raise ValueError(f"{key} contains a control character")
    return value


def normalized_region_label(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value).lower()
    ascii_text = "".join(character for character in decomposed if not unicodedata.combining(character))
    return re.sub(r"[^a-z0-9]+", " ", ascii_text).strip()


def catalog_name_authority(catalog: dict, hierarchy: dict) -> tuple[set[str], set[str]]:
    reserved_tags = set(hierarchy)
    region_labels: set[str] = set()

    def remember(value: object) -> None:
        if not isinstance(value, str):
            return
        name = value.strip()
        normalized = normalized_region_label(name)
        if normalized:
            region_labels.add(normalized)
        possible_tag = name.lower()
        if TAG_RE.fullmatch(possible_tag):
            reserved_tags.add(possible_tag)

    retired = catalog.get("retiredCanonicalTags", {})
    if isinstance(retired, dict):
        reserved_tags.update(str(tag) for tag in retired)
    elif isinstance(retired, list):
        reserved_tags.update(str(tag) for tag in retired if isinstance(tag, str))
    for entry in hierarchy.values():
        if isinstance(entry, dict):
            remember(entry.get("label"))
    aliases = catalog.get("aliases", {})
    if isinstance(aliases, dict):
        for names in aliases.values():
            if isinstance(names, list):
                for name in names:
                    remember(name)
    search_groups = catalog.get("searchGroups", {})
    if isinstance(search_groups, dict):
        for name, entry in search_groups.items():
            remember(name)
            if isinstance(entry, dict):
                remember(entry.get("label"))
    external = catalog.get("externalRegionPaths", {})
    if isinstance(external, dict):
        for entry in external.values():
            if not isinstance(entry, dict):
                continue
            path = entry.get("path", [])
            if isinstance(path, list):
                reserved_tags.update(str(tag) for tag in path if isinstance(tag, str))
            remember(entry.get("label"))
            tag_labels = entry.get("tagLabels", {})
            if isinstance(tag_labels, dict):
                for label in tag_labels.values():
                    remember(label)
    return reserved_tags, region_labels


def expected_new_region_parent(source_tags: set[str], hierarchy: dict, jurisdiction: str) -> str:
    parents = {
        tag: str(entry["parent"]) if isinstance(entry, dict) and entry.get("parent") else None
        for tag, entry in hierarchy.items()
    }
    chains: list[list[str]] = []
    for tag in sorted(source_tags):
        chain: list[str] = []
        seen: set[str] = set()
        current = parents.get(tag)
        while current and current not in seen:
            chain.append(current)
            seen.add(current)
            current = parents.get(current)
        if chain:
            chains.append(chain)
    if not chains:
        return jurisdiction
    return next(
        (
            candidate for candidate in chains[0]
            if candidate != "can" and all(candidate in chain for chain in chains[1:])
        ),
        jurisdiction,
    )


def main() -> None:
    args = parse_args()
    inputs = [args.proposal, args.membership, args.catalog, args.digital_da]
    if not all(path.exists() for path in inputs):
        raise ValueError("one or more proposal-validation inputs do not exist")
    output_resolved = args.output.resolve()
    if output_resolved in {path.resolve() for path in inputs}:
        raise ValueError("--output must be a separate file; authoritative inputs are read-only")
    if args.output.suffix.lower() != ".json":
        raise ValueError("--output must be a JSON file")

    proposal = read_json(args.proposal)
    if proposal.get("schema") not in PROPOSAL_SCHEMAS:
        raise ValueError(f"unsupported proposal schema; expected one of {sorted(PROPOSAL_SCHEMAS)}")
    is_new_region = proposal.get("schema") == NEW_REGION_PROPOSAL_SCHEMA
    allowed_top_level = {
        "schema",
        "baseMembershipSha256",
        "submittedBy",
        "reason",
        "createdAt",
        "changes",
    }
    if is_new_region:
        allowed_top_level.add("newRegion")
    unexpected_top_level = sorted(set(proposal) - allowed_top_level)
    if unexpected_top_level:
        raise ValueError(f"unexpected proposal fields: {unexpected_top_level}")

    actual_membership_hash = file_sha256(args.membership)
    claimed_membership_hash = str(proposal.get("baseMembershipSha256", "")).lower()
    if not SHA256_RE.fullmatch(claimed_membership_hash):
        raise ValueError("baseMembershipSha256 must be a lowercase SHA-256 digest")
    if claimed_membership_hash != actual_membership_hash:
        raise ValueError(
            "proposal is stale: baseMembershipSha256 does not match the current authoritative membership"
        )

    reason = clean_optional_string(proposal, "reason", 1000)
    if not reason:
        raise ValueError("reason is required before a proposal can be reviewed")
    submitted_by = clean_optional_string(proposal, "submittedBy", 80)
    created_at = clean_optional_string(proposal, "createdAt", 100)

    catalog = read_json(args.catalog)
    leaves, leaf_jurisdictions = catalog_leaves(catalog)
    hierarchy = catalog.get("hierarchy", {})
    new_region = None
    new_tag = ""
    if is_new_region:
        raw = proposal.get("newRegion")
        if not isinstance(raw, dict) or set(raw) != {"tag", "label", "parent", "anchorDguid"}:
            raise ValueError("newRegion must contain tag, label, parent, and anchorDguid")
        tag, label, parent, anchor = raw.get("tag"), raw.get("label"), raw.get("parent"), raw.get("anchorDguid")
        if (
            not isinstance(tag, str) or not TAG_RE.fullmatch(tag)
            or not isinstance(label, str) or not label.strip() or len(label) > 80
            or any(ord(character) < 32 or 0xD800 <= ord(character) <= 0xDFFF for character in label)
            or not isinstance(parent, str) or not TAG_RE.fullmatch(parent)
            or not isinstance(anchor, str) or not DGUID_RE.fullmatch(anchor)
        ):
            raise ValueError("newRegion contains an invalid name, tag, parent, or anchor")
        reserved, labels = catalog_name_authority(catalog, hierarchy)
        if tag in reserved or normalized_region_label(label) in labels:
            raise ValueError("new region tag or name already exists")
        new_tag = tag
        new_region = {"tag": tag, "label": label.strip(), "parent": parent, "anchorDguid": anchor}
    membership = pd.read_csv(args.membership, dtype=str, keep_default_na=False)
    required_columns = {"DGUID", "PRUID", "leaf_tag"}
    if not required_columns.issubset(membership.columns):
        raise ValueError(f"membership is missing columns {sorted(required_columns - set(membership.columns))}")
    if membership["DGUID"].duplicated().any():
        raise ValueError("membership contains duplicate DGUID values")
    membership["PRUID"] = membership["PRUID"].astype(str).str.zfill(2)
    invalid_membership_tags = sorted(set(membership["leaf_tag"]) - leaves)
    if invalid_membership_tags:
        raise ValueError(f"membership contains non-leaf tags: {invalid_membership_tags[:10]}")
    invalid_membership_jurisdictions = [
        dguid
        for dguid, pruid, tag in membership[["DGUID", "PRUID", "leaf_tag"]].itertuples(index=False, name=None)
        if PR_TO_TAG.get(pruid) != leaf_jurisdictions.get(tag)
    ]
    if invalid_membership_jurisdictions:
        raise ValueError(
            "membership crosses a province or territory boundary: "
            f"{invalid_membership_jurisdictions[:10]}"
        )
    membership_by_dguid = membership.set_index("DGUID", drop=False)

    digital = gpd.read_file(args.digital_da)[["DGUID", "PRUID", "geometry"]]
    if not digital.crs:
        raise ValueError("digital DA source must declare a CRS")
    digital["DGUID"] = digital["DGUID"].astype(str)
    digital["PRUID"] = digital["PRUID"].astype(str).str.zfill(2)
    if digital["DGUID"].duplicated().any():
        raise ValueError("digital DA source contains duplicate DGUID values")
    if set(digital["DGUID"]) != set(membership["DGUID"]):
        raise ValueError("digital DA and membership DGUID sets differ")
    membership_pruid = membership.set_index("DGUID")["PRUID"].astype(str)
    digital_pruid = digital.set_index("DGUID")["PRUID"].astype(str)
    pruid_mismatches = digital_pruid[digital_pruid != membership_pruid.reindex(digital_pruid.index)]
    if not pruid_mismatches.empty:
        raise ValueError(f"digital DA and membership PRUID disagree for {pruid_mismatches.index[0]}")
    seed_by_dguid = seed_cells(digital.sort_values("DGUID").reset_index(drop=True), catalog)

    changes = proposal.get("changes")
    if not isinstance(changes, list) or not changes:
        raise ValueError("changes must be a non-empty array")
    seen: set[str] = set()
    canonical_changes: list[dict] = []
    for index, raw_change in enumerate(changes):
        if not isinstance(raw_change, dict):
            raise ValueError(f"change {index} must be an object")
        allowed_change_fields = {"DGUID", "from", "to", "note"}
        unexpected_change_fields = sorted(set(raw_change) - allowed_change_fields)
        if unexpected_change_fields:
            raise ValueError(f"change {index} has unexpected fields: {unexpected_change_fields}")
        dguid = str(raw_change.get("DGUID", "")).strip()
        from_tag = str(raw_change.get("from", "")).strip()
        to_tag = str(raw_change.get("to", "")).strip()
        if not dguid or not from_tag or not to_tag:
            raise ValueError(f"change {index} requires DGUID, from, and to")
        if dguid in seen:
            raise ValueError(f"duplicate DGUID in proposal: {dguid}")
        seen.add(dguid)
        if dguid not in membership_by_dguid.index:
            raise ValueError(f"unknown DGUID in proposal: {dguid}")
        membership_row = membership_by_dguid.loc[dguid]
        current_tag = str(membership_row["leaf_tag"])
        pruid = str(membership_row["PRUID"])
        if from_tag != current_tag:
            raise ValueError(f"stale from value for {dguid}: proposal={from_tag}, current={current_tag}")
        if to_tag == from_tag:
            raise ValueError(f"no-op change for {dguid}: {from_tag} -> {to_tag}")
        jurisdiction = PR_TO_TAG.get(pruid)
        if not jurisdiction:
            raise ValueError(f"unknown PRUID {pruid} for {dguid}")
        if is_new_region:
            if to_tag != new_tag:
                raise ValueError(f"new region proposal has an unexpected target {to_tag}")
        else:
            if to_tag not in leaves:
                raise ValueError(f"target {to_tag} for {dguid} is not a catalog leaf")
            if leaf_jurisdictions.get(to_tag) != jurisdiction:
                raise ValueError(f"cross-jurisdiction change for {dguid}: PRUID {pruid} -> {to_tag}")
        protected_tag = seed_by_dguid.get(dguid)
        if protected_tag and to_tag != protected_tag:
            raise ValueError(f"seed protection forbids moving {dguid} away from {protected_tag}")

        canonical = {
            "DGUID": dguid,
            "PRUID": pruid,
            "from": from_tag,
            "to": to_tag,
        }
        for column in ("CDUID", "CDNAME", "CSDUID", "CSDNAME", "CSDTYPE"):
            if column in membership.columns and str(membership_row[column]).strip():
                canonical[column] = str(membership_row[column])
        note = str(raw_change.get("note", "")).strip()
        if len(note) > 1000:
            raise ValueError(f"change note for {dguid} is longer than 1000 characters")
        if note:
            canonical["note"] = note
        canonical_changes.append(canonical)

    if new_region:
        affected_pruids = {change["PRUID"] for change in canonical_changes}
        jurisdiction = PR_TO_TAG.get(next(iter(affected_pruids))) if len(affected_pruids) == 1 else None
        expected_parent = expected_new_region_parent(
            {str(change["from"]) for change in canonical_changes}, hierarchy, str(jurisdiction or "")
        )
        if not jurisdiction or new_region["parent"] != expected_parent or expected_parent not in hierarchy:
            raise ValueError("new region parent does not match the changed cells")
        anchor = new_region["anchorDguid"]
        changed_dguids = {change["DGUID"] for change in canonical_changes}
        if anchor not in changed_dguids or anchor in seed_by_dguid:
            raise ValueError("new region anchor must be a changed, unprotected cell")

    canonical_changes.sort(key=lambda change: change["DGUID"])
    moves = Counter(f"{change['from']}->{change['to']}" for change in canonical_changes)
    provinces = Counter(change["PRUID"] for change in canonical_changes)
    if len(provinces) != 1:
        raise ValueError("a proposal must contain changes from exactly one province or territory")
    touched_csds = sorted(
        {
            str(change["CSDUID"])
            for change in canonical_changes
            if str(change.get("CSDUID", "")).strip()
        }
    )
    changed_seed_cells = sum(change["DGUID"] in seed_by_dguid for change in canonical_changes)
    output = {
        "schema": NEW_REGION_OUTPUT_SCHEMA if new_region else OUTPUT_SCHEMA,
        "status": "valid-not-approved",
        "base": {
            "membershipSha256": actual_membership_hash,
            "catalogSha256": file_sha256(args.catalog),
            "digitalDaDatasetSha256": dataset_sha256(args.digital_da),
        },
        "submittedBy": submitted_by,
        "reason": reason,
        "createdAt": created_at,
        "summary": {
            "changeCount": len(canonical_changes),
            "provinces": dict(sorted(provinces.items())),
            "moves": dict(sorted(moves.items())),
            "touchedCensusSubdivisions": touched_csds,
            "seedCellsMoved": changed_seed_cells,
        },
        "changes": canonical_changes,
    }
    if new_region:
        output["newRegion"] = new_region
    payload = (json.dumps(output, ensure_ascii=False, indent=2, sort_keys=False) + "\n").encode("utf-8")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_name(f".{args.output.name}.tmp")
    temporary.write_bytes(payload)
    os.replace(temporary, args.output)
    print(
        json.dumps(
            {
                "output": str(args.output),
                "outputSha256": file_sha256(args.output),
                "status": output["status"],
                "changeCount": len(canonical_changes),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
