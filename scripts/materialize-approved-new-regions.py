#!/usr/bin/env python3
"""Materialize approved new-region decisions into the canonical region catalog."""

from __future__ import annotations

import argparse
import json
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

import geopandas as gpd


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "docs" / "assets" / "regions" / "canada-regions.json"
DEFAULT_OVERRIDES = ROOT / "docs" / "assets" / "regions" / "municipal-overrides.json"
OVERRIDES_SCHEMA = "mcc-census-overrides/v2"
TAG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,28}$")
DGUID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
PR_TO_TAG = {
    "10": "nl", "11": "pe", "12": "ns", "13": "nb", "24": "qc",
    "35": "on", "46": "mb", "47": "sk", "48": "ab", "59": "bc",
    "60": "yt", "61": "nt", "62": "nu",
}
RECORD_KEYS = {
    "tag", "label", "parent", "anchorDguid", "status", "decision", "evidence",
    "reviewedAt", "approvedBy", "sourceIssue",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--digital-da", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES)
    return parser.parse_args()


def read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"{path.name} must contain a JSON object")
    return value


def write_atomic(path: Path, value: object) -> None:
    payload = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_bytes(payload)
    os.replace(temporary, path)


def hierarchy_leaves(hierarchy: dict[str, Any]) -> set[str]:
    parents = {
        str(entry.get("parent"))
        for entry in hierarchy.values()
        if isinstance(entry, dict) and entry.get("parent")
    }
    return set(hierarchy) - parents


def hierarchy_jurisdiction(tag: str, hierarchy: dict[str, Any]) -> str:
    path: list[str] = []
    seen: set[str] = set()
    current: str | None = tag
    while current:
        if current in seen or current not in hierarchy:
            raise ValueError(f"catalog hierarchy ancestry is invalid for {tag}")
        seen.add(current)
        path.insert(0, current)
        entry = hierarchy[current]
        current = str(entry["parent"]) if isinstance(entry, dict) and entry.get("parent") else None
    if len(path) < 2 or path[0] != "can" or path[1] not in PR_TO_TAG.values():
        raise ValueError(f"catalog hierarchy has no jurisdiction for {tag}")
    return path[1]


def normalized_region_label(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value).lower()
    ascii_text = "".join(character for character in decomposed if not unicodedata.combining(character))
    return re.sub(r"[^a-z0-9]+", " ", ascii_text).strip()


def catalog_name_authority(catalog: dict[str, Any], hierarchy: dict[str, Any]) -> tuple[set[str], set[str]]:
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
    aliases_value = catalog.get("aliases", {})
    if isinstance(aliases_value, dict):
        for names in aliases_value.values():
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


def materialize(catalog: dict[str, Any], overrides: dict[str, Any], digital: gpd.GeoDataFrame) -> list[str]:
    if overrides.get("schema") != OVERRIDES_SCHEMA or not isinstance(overrides.get("newRegions"), list):
        raise ValueError("municipal override new-region authority is invalid")
    hierarchy = catalog.get("hierarchy")
    status = catalog.get("status")
    seeds = catalog.get("seeds")
    aliases = catalog.get("aliases")
    metro_groups = catalog.get("metroGroups")
    strategy = catalog.get("strategy")
    if (
        not isinstance(hierarchy, dict) or not isinstance(status, dict)
        or not isinstance(seeds, list) or not isinstance(aliases, dict)
        or not isinstance(metro_groups, list) or not isinstance(strategy, dict)
    ):
        raise ValueError("region catalog cannot accept approved new regions")

    required_columns = {"DGUID", "PRUID", "geometry"}
    if not required_columns.issubset(digital.columns):
        raise ValueError("digital DA source is missing new-region anchor columns")
    digital = digital[["DGUID", "PRUID", "geometry"]].copy()
    digital["DGUID"] = digital["DGUID"].astype(str)
    digital["PRUID"] = digital["PRUID"].astype(str).str.zfill(2)
    if digital["DGUID"].duplicated().any():
        raise ValueError("digital DA source contains duplicate DGUID values")
    by_dguid = digital.set_index("DGUID")

    reserved, region_labels = catalog_name_authority(catalog, hierarchy)
    seed_by_tag = {
        str(seed.get("tag")): seed for seed in seeds if isinstance(seed, dict) and seed.get("tag")
    }
    added: list[str] = []

    for record in overrides["newRegions"]:
        if not isinstance(record, dict) or set(record) != RECORD_KEYS or record.get("status") != "approved":
            raise ValueError("approved new-region record has an invalid schema")
        tag = str(record.get("tag", ""))
        label = str(record.get("label", "")).strip()
        parent = str(record.get("parent", ""))
        anchor = str(record.get("anchorDguid", ""))
        source_issue = str(record.get("sourceIssue", ""))
        if (
            not TAG_RE.fullmatch(tag) or not label or len(label) > 80
            or not TAG_RE.fullmatch(parent) or not DGUID_RE.fullmatch(anchor)
            or not source_issue.startswith("https://github.com/MeshCore-ca/MeshCore-Canada/issues/")
        ):
            raise ValueError(f"approved new-region record is invalid for {tag or '<missing>'}")
        parent_entry = hierarchy.get(parent)
        if not isinstance(parent_entry, dict) or parent in hierarchy_leaves(hierarchy):
            raise ValueError(f"new region {tag} must use an existing catalogue group as its parent")
        if anchor not in by_dguid.index:
            raise ValueError(f"new region {tag} references an unknown anchor DGUID")
        anchor_row = by_dguid.loc[anchor]
        pruid = str(anchor_row["PRUID"]).zfill(2)
        jurisdiction = PR_TO_TAG.get(pruid)
        if not jurisdiction or hierarchy_jurisdiction(parent, hierarchy) != jurisdiction:
            raise ValueError(f"new region {tag} anchor is outside its catalogue parent")

        if tag in hierarchy:
            existing_status = status.get(tag)
            existing_seed = seed_by_tag.get(tag)
            existing_aliases = aliases.get(tag)
            matches = (
                hierarchy[tag].get("parent") == parent
                and hierarchy[tag].get("label") == label
                and isinstance(existing_status, dict)
                and existing_status.get("sourceUrl") == source_issue
                and isinstance(existing_seed, dict)
                and existing_seed.get("seedMethod") == f"approved anchor DGUID {anchor}"
                and isinstance(existing_aliases, list)
                and tag in existing_aliases
                and label in existing_aliases
            )
            if not matches:
                raise ValueError(f"materialized new region {tag} disagrees with its approved record")
            continue
        if tag in reserved:
            raise ValueError(f"new region tag {tag} collides with reserved authority")
        if normalized_region_label(label) in region_labels:
            raise ValueError(f"new region label {label!r} collides with reserved authority")

        point = gpd.GeoSeries(
            [anchor_row.geometry.representative_point()], crs=digital.crs
        ).to_crs("EPSG:4326").iloc[0]
        hierarchy[tag] = {"label": label, "parent": parent, "basis": "community-approved"}
        status[tag] = {
            "state": "approved",
            "reviewer": str(record.get("approvedBy", "")),
            "source": str(record.get("decision", "")),
            "sourceUrl": source_issue,
            "sourceTier": "community-review",
            "boundaryType": "official census cells",
            "basis": "community-approved",
        }
        seed = {
            "tag": tag,
            "lat": round(float(point.y), 6),
            "lon": round(float(point.x), 6),
            "r": 18,
            "resolve": True,
            "sourceTier": "community-review",
            "boundaryType": "official census cell",
            "seedMethod": f"approved anchor DGUID {anchor}",
        }
        seeds.append(seed)
        seed_by_tag[tag] = seed
        aliases[tag] = [tag, label] if label != tag else [tag]
        parent_label = str(hierarchy[jurisdiction].get("label", ""))
        group = next(
            (
                item for item in metro_groups
                if isinstance(item, dict) and item.get("label") == parent_label and isinstance(item.get("tags"), list)
            ),
            None,
        )
        if group is None:
            raise ValueError(f"new region {tag} has no catalogue group for {jurisdiction}")
        if tag not in group["tags"]:
            group["tags"].append(tag)
        reserved.add(tag)
        region_labels.add(normalized_region_label(label))
        added.append(tag)

    if added:
        strategy["hierarchyNodes"] = len(hierarchy)
        strategy["generatedLeafRegions"] = len(hierarchy_leaves(hierarchy))
        strategy["sourceSelectableRegions"] = int(strategy.get("sourceSelectableRegions", 0)) + len(added)
    return added


def main() -> None:
    args = parse_args()
    catalog = read_json(args.catalog)
    overrides = read_json(args.overrides)
    digital = gpd.read_file(args.digital_da)[["DGUID", "PRUID", "geometry"]]
    added = materialize(catalog, overrides, digital)
    if added:
        write_atomic(args.catalog, catalog)
    print(json.dumps({"added": added, "count": len(added)}, sort_keys=True))


if __name__ == "__main__":
    main()