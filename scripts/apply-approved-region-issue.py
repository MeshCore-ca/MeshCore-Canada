#!/usr/bin/env python3
"""Verify an approved boundary issue and record its reviewed census decision."""

from __future__ import annotations

import argparse
import base64
import csv
import gzip
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v1"
NEW_REGION_PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v2"
PROPOSAL_SCHEMAS = frozenset({PROPOSAL_SCHEMA, NEW_REGION_PROPOSAL_SCHEMA})
AUTOMATION_SCHEMA = "mcc-region-boundary-automation/v1"
OVERRIDES_SCHEMA = "mcc-census-overrides/v2"
SOURCE_ID = "meshcore-canada-reviewed-census-overrides"
SIGNATURE_DOMAIN = "mcc-submission/v1"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
DGUID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
TAG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,28}$")
BASE64URL_RE = re.compile(r"^[A-Za-z0-9_-]+$")
PR_TO_TAG = {
    "10": "nl", "11": "pe", "12": "ns", "13": "nb", "24": "qc",
    "35": "on", "46": "mb", "47": "sk", "48": "ab", "59": "bc",
    "60": "yt", "61": "nt", "62": "nu",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--event", type=Path, required=True)
    parser.add_argument("--comments", type=Path, required=True)
    parser.add_argument("--public-key", type=Path, required=True)
    parser.add_argument("--config", type=Path, default=ROOT / ".github" / "region-boundary-automation.json")
    parser.add_argument("--membership", type=Path, default=ROOT / "docs" / "assets" / "regions" / "canada-region-membership.csv")
    parser.add_argument("--catalog", type=Path, default=ROOT / "docs" / "assets" / "regions" / "canada-regions.json")
    parser.add_argument("--cells-dir", type=Path, default=ROOT / "docs" / "assets" / "regions" / "cells")
    parser.add_argument("--overrides", type=Path, default=ROOT / "docs" / "assets" / "regions" / "municipal-overrides.json")
    parser.add_argument("--sources-lock", type=Path, default=ROOT / "docs" / "assets" / "regions" / "sources.lock.json")
    parser.add_argument("--summary", type=Path)
    parser.add_argument("--github-output", type=Path)
    return parser.parse_args()


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


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


def expected_new_region_parent(source_tags: set[str], hierarchy: dict[str, Any], jurisdiction: str) -> str:
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


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def pretty_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_atomic(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_bytes(payload)
    os.replace(temporary, path)


def single_marker(body: str, name: str, pattern: str) -> str:
    matches = re.findall(pattern, body)
    if len(matches) != 1:
        raise ValueError(f"issue must contain exactly one {name} marker")
    return str(matches[0])


def decode_base64url(value: str) -> bytes:
    if not value or not BASE64URL_RE.fullmatch(value):
        raise ValueError("submission payload contains invalid base64url data")
    try:
        return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
    except Exception as exc:
        raise ValueError("submission payload contains invalid base64url data") from exc


def flatten_comments(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        raise ValueError("issue comments response must be an array")
    flattened: list[dict[str, Any]] = []
    for entry in value:
        if isinstance(entry, list):
            flattened.extend(item for item in entry if isinstance(item, dict))
        elif isinstance(entry, dict):
            flattened.append(entry)
    return flattened


def actor_login(value: dict[str, Any]) -> str:
    for key in ("user", "author"):
        actor = value.get(key)
        if isinstance(actor, dict) and isinstance(actor.get("login"), str):
            return actor["login"]
    return ""


def extract_payload(body: str, comments: list[dict[str, Any]], proposal_hash: str, submission_bots: set[str]) -> bytes:
    inline = re.findall(r"<!-- submission-payload-gzip-base64url:([A-Za-z0-9_-]+) -->", body)
    if len(inline) > 1:
        raise ValueError("issue contains duplicate inline submission payloads")
    if inline:
        try:
            return gzip.decompress(decode_base64url(inline[0]))
        except (OSError, EOFError) as exc:
            raise ValueError("inline submission payload is not valid gzip data") from exc

    legacy = re.findall(
        r"### Canonical proposal JSON\s*\n+(?P<fence>`{3,})json\s*\n"
        r"(?P<payload>.*?)\n(?P=fence)(?:\n|$)",
        body,
        flags=re.DOTALL,
    )
    if len(legacy) > 1:
        raise ValueError("issue contains duplicate legacy submission payloads")
    if legacy:
        return legacy[0][1].encode("utf-8")

    declared = re.findall(r"<!-- submission-payload-chunks:(\d{1,3}) -->", body)
    if not declared:
        declared = re.findall(r"stored in \*\*(\d{1,3})\*\* ordered issue comment", body)
    if len(declared) != 1:
        raise ValueError("issue does not contain one complete submission payload")
    total = int(declared[0])
    if total < 1 or total > 100:
        raise ValueError("issue declares an invalid submission chunk count")
    chunks: dict[int, str] = {}
    marker_re = re.compile(
        rf"<!-- mcc-submission-chunk:{re.escape(proposal_hash)}:(\d{{1,3}})/(\d{{1,3}}) -->"
    )
    for comment in comments:
        comment_body = str(comment.get("body", ""))
        marker = marker_re.search(comment_body)
        if not marker:
            continue
        if actor_login(comment).lower() not in submission_bots:
            raise ValueError("a submission payload chunk was not posted by the submission App")
        index, marker_total = int(marker.group(1)), int(marker.group(2))
        if marker_total != total or index < 1 or index > total:
            raise ValueError("submission payload chunk numbering is inconsistent")
        hidden = re.findall(r"<!-- submission-payload-chunk-gzip-base64url:([A-Za-z0-9_-]+) -->", comment_body)
        legacy_chunk = re.findall(r"```text\s*\n([A-Za-z0-9_-]+)\n```", comment_body)
        values = hidden or legacy_chunk
        if len(values) != 1:
            raise ValueError("submission payload chunk is malformed")
        if index in chunks and chunks[index] != values[0]:
            raise ValueError("submission payload contains conflicting duplicate chunks")
        chunks[index] = values[0]
    if set(chunks) != set(range(1, total + 1)):
        raise ValueError("submission payload is missing one or more chunks")
    try:
        return gzip.decompress(decode_base64url("".join(chunks[index] for index in range(1, total + 1))))
    except (OSError, EOFError) as exc:
        raise ValueError("chunked submission payload is not valid gzip data") from exc


def verify_signature(public_key: Path, message: bytes, signature: bytes) -> None:
    if not public_key.is_file():
        raise ValueError("submission verification public key is unavailable")
    openssl = shutil.which("openssl")
    if not openssl:
        raise ValueError("openssl is required to verify the submission signature")
    with tempfile.TemporaryDirectory(prefix="mcc-submission-signature-") as temporary:
        root = Path(temporary)
        message_path, signature_path = root / "message", root / "signature"
        message_path.write_bytes(message)
        signature_path.write_bytes(signature)
        result = subprocess.run(
            [openssl, "dgst", "-sha256", "-verify", str(public_key), "-signature", str(signature_path), str(message_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    if result.returncode != 0:
        raise ValueError("submission signature verification failed")


def catalog_leaves(catalog: dict[str, Any]) -> tuple[set[str], dict[str, str]]:
    hierarchy = catalog.get("hierarchy")
    if not isinstance(hierarchy, dict):
        raise ValueError("region catalog hierarchy is invalid")
    parents = {str(entry.get("parent")) for entry in hierarchy.values() if isinstance(entry, dict) and entry.get("parent")}
    leaves = set(hierarchy) - parents
    jurisdictions: dict[str, str] = {}
    for leaf in leaves:
        path: list[str] = []
        seen: set[str] = set()
        current: Any = leaf
        while current:
            if not isinstance(current, str) or current in seen or current not in hierarchy:
                raise ValueError(f"catalog ancestry is invalid for {leaf}")
            seen.add(current)
            path.insert(0, current)
            current = hierarchy[current].get("parent")
        if len(path) < 3 or path[0] != "can":
            raise ValueError(f"catalog leaf {leaf} has no Canadian jurisdiction")
        jurisdictions[leaf] = path[1]
    return leaves, jurisdictions


def label_names(issue: dict[str, Any]) -> set[str]:
    return {
        label if isinstance(label, str) else str(label.get("name", ""))
        for label in issue.get("labels", [])
        if isinstance(label, (str, dict))
    }


def validate_event(event: dict[str, Any], config: dict[str, Any]) -> tuple[dict[str, Any], int, str, str]:
    if config.get("schema") != AUTOMATION_SCHEMA:
        raise ValueError("boundary automation configuration schema is invalid")
    issue = event.get("issue")
    if event.get("action") != "closed" or not isinstance(issue, dict):
        raise ValueError("automation accepts only an issue closed event")
    if issue.get("state") != "closed" or issue.get("state_reason") != "completed":
        raise ValueError("boundary issue was not closed as completed")
    label = str(config.get("label", ""))
    if label not in label_names(issue):
        raise ValueError(f"boundary issue is missing the {label} label")
    sender = event.get("sender")
    closer = sender.get("login") if isinstance(sender, dict) else None
    approvers = {str(login).lower() for login in config.get("approvers", []) if isinstance(login, str)}
    if not isinstance(closer, str) or closer.lower() not in approvers:
        raise ValueError("boundary issue was not closed by an approved maintainer")
    closed_by = issue.get("closed_by")
    if isinstance(closed_by, dict) and isinstance(closed_by.get("login"), str) and closed_by["login"].lower() != closer.lower():
        raise ValueError("boundary issue closer does not match the workflow actor")
    bots = {str(login).lower() for login in config.get("submissionBots", []) if isinstance(login, str)}
    if actor_login(issue).lower() not in bots:
        raise ValueError("boundary issue was not created by the submission App")
    number = issue.get("number")
    if not isinstance(number, int) or isinstance(number, bool) or number < 1:
        raise ValueError("boundary issue number is invalid")
    expected_url = f"https://github.com/{config.get('repository', '')}/issues/{number}"
    issue_url = str(issue.get("html_url") or issue.get("url") or "")
    if issue_url != expected_url:
        raise ValueError("boundary issue URL is not canonical")
    reviewed_at = str(issue.get("closed_at", ""))[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", reviewed_at):
        raise ValueError("boundary issue closure time is unavailable")
    return issue, number, issue_url, reviewed_at


def membership_rows(path: Path) -> tuple[list[dict[str, str]], dict[str, dict[str, str]]]:
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    required = {"DGUID", "PRUID", "CSDUID", "leaf_tag"}
    if not rows or not required.issubset(rows[0]):
        raise ValueError("authoritative membership is missing required columns")
    by_dguid: dict[str, dict[str, str]] = {}
    for row in rows:
        dguid = str(row["DGUID"])
        if not dguid or dguid in by_dguid:
            raise ValueError("authoritative membership has an empty or duplicate DGUID")
        by_dguid[dguid] = row
    return rows, by_dguid


def province_anchor_tags(
    cells_dir: Path,
    pruid: str,
    by_dguid: dict[str, dict[str, str]],
    leaves: set[str],
    jurisdictions: dict[str, str],
) -> dict[str, str]:
    path = cells_dir / f"cells-{pruid}.topo.json"
    topology = read_json(path)
    try:
        geometries = topology["objects"]["cells"]["geometries"]
    except (KeyError, TypeError) as exc:
        raise ValueError(f"cell authority is invalid for province {pruid}") from exc
    if not isinstance(topology, dict) or topology.get("type") != "Topology" or not isinstance(geometries, list):
        raise ValueError(f"cell authority is invalid for province {pruid}")
    seen: set[str] = set()
    anchors: dict[str, str] = {}
    counts: Counter[str] = Counter()
    for geometry in geometries:
        props = geometry.get("properties") if isinstance(geometry, dict) else None
        if not isinstance(props, dict):
            raise ValueError(f"cell authority is invalid for province {pruid}")
        dguid = str(props.get("DGUID", "")).strip()
        row = by_dguid.get(dguid)
        cell_pruid = str(props.get("PRUID", "")).strip().zfill(2)
        cell_leaf = str(props.get("leaf_tag", "")).strip()
        if (
            not dguid
            or dguid in seen
            or row is None
            or str(row["PRUID"]).zfill(2) != pruid
            or cell_pruid != pruid
            or cell_leaf != row["leaf_tag"]
        ):
            raise ValueError(f"cell authority disagrees with membership for province {pruid}")
        seen.add(dguid)
        seed = str(props.get("seed_tag", "")).strip()
        if seed:
            if seed != cell_leaf or seed not in leaves or jurisdictions.get(seed) != PR_TO_TAG[pruid]:
                raise ValueError(f"cell authority contains an invalid anchor for province {pruid}")
            anchors[dguid] = seed
            counts[seed] += 1
    expected_dguids = {
        dguid for dguid, row in by_dguid.items()
        if str(row["PRUID"]).zfill(2) == pruid
    }
    expected_leaves = {
        leaf for leaf in leaves
        if jurisdictions.get(leaf) == PR_TO_TAG[pruid]
    }
    if seen != expected_dguids or set(counts) != expected_leaves or any(count != 1 for count in counts.values()):
        raise ValueError(f"cell authority has incomplete anchors for province {pruid}")
    return anchors


def validate_proposal(
    proposal: Any,
    payload: bytes,
    proposal_hash: str,
    membership_path: Path,
    catalog_path: Path,
    cells_dir: Path,
) -> tuple[list[dict[str, str]], list[dict[str, str]], dict[str, str], bool, dict[str, str] | None]:
    if not isinstance(proposal, dict) or proposal.get("schema") not in PROPOSAL_SCHEMAS:
        raise ValueError("submission payload is not a region proposal")
    is_new_region = proposal.get("schema") == NEW_REGION_PROPOSAL_SCHEMA
    allowed = {"schema", "baseMembershipSha256", "submittedBy", "reason", "changes"}
    if is_new_region:
        allowed.add("newRegion")
    if set(proposal) - allowed:
        raise ValueError("submission payload is not a region proposal")
    if canonical_bytes(proposal) != payload or hashlib.sha256(payload).hexdigest() != proposal_hash:
        raise ValueError("submission payload is not canonical or does not match its hash")
    claimed_base = proposal.get("baseMembershipSha256")
    if not isinstance(claimed_base, str) or not SHA256_RE.fullmatch(claimed_base):
        raise ValueError("boundary proposal has an invalid base membership hash")
    base_membership_matched = claimed_base == file_sha256(membership_path)
    reason = proposal.get("reason")
    if not isinstance(reason, str) or not reason.strip() or len(reason) > 1000:
        raise ValueError("boundary proposal reason is invalid")
    catalog = read_json(catalog_path)
    if not isinstance(catalog, dict):
        raise ValueError("region catalog is invalid")
    leaves, jurisdictions = catalog_leaves(catalog)
    hierarchy = catalog.get("hierarchy", {})

    new_region: dict[str, str] | None = None
    new_tag = ""
    if is_new_region:
        raw = proposal.get("newRegion")
        if not isinstance(raw, dict) or set(raw) != {"tag", "label", "parent", "anchorDguid"}:
            raise ValueError("new region definition is invalid")
        tag, label, parent, anchor = raw.get("tag"), raw.get("label"), raw.get("parent"), raw.get("anchorDguid")
        if (
            not isinstance(tag, str) or not TAG_RE.fullmatch(tag)
            or not isinstance(label, str) or not label.strip() or len(label) > 80
            or any(ord(character) < 32 or 0xD800 <= ord(character) <= 0xDFFF for character in label)
            or not isinstance(parent, str) or not TAG_RE.fullmatch(parent)
            or not isinstance(anchor, str) or not DGUID_RE.fullmatch(anchor)
        ):
            raise ValueError("new region definition is invalid")
        reserved, labels = catalog_name_authority(catalog, hierarchy)
        if tag in reserved or normalized_region_label(label) in labels:
            raise ValueError("new region tag or name already exists")
        new_tag = tag
        new_region = {"tag": tag, "label": label.strip(), "parent": parent, "anchorDguid": anchor}

    rows, by_dguid = membership_rows(membership_path)
    changes = proposal.get("changes")
    if not isinstance(changes, list) or not changes:
        raise ValueError("boundary proposal has no changes")
    requested: dict[str, str] = {}
    provinces: set[str] = set()
    for change in changes:
        if not isinstance(change, dict) or set(change) != {"DGUID", "from", "to"}:
            raise ValueError("boundary proposal contains an invalid change")
        dguid, from_tag, to_tag = change.get("DGUID"), change.get("from"), change.get("to")
        if not all(isinstance(value, str) and value for value in (dguid, from_tag, to_tag)) or dguid in requested:
            raise ValueError("boundary proposal contains an incomplete or duplicate change")
        row = by_dguid.get(dguid)
        if not row or row["leaf_tag"] != from_tag or from_tag == to_tag:
            raise ValueError("boundary proposal is stale or contains a no-op")
        pruid = str(row["PRUID"]).zfill(2)
        if is_new_region:
            if to_tag != new_tag:
                raise ValueError("new region proposal has more than one target")
        elif to_tag not in leaves or jurisdictions.get(to_tag) != PR_TO_TAG.get(pruid):
            raise ValueError("boundary proposal crosses a province or territory")
        provinces.add(pruid)
        requested[dguid] = to_tag
    if len(provinces) != 1:
        raise ValueError("boundary proposal must affect exactly one province or territory")
    pruid = next(iter(provinces))
    anchors = province_anchor_tags(cells_dir, pruid, by_dguid, leaves, jurisdictions)
    for dguid, to_tag in requested.items():
        protected = anchors.get(dguid)
        if protected and to_tag != protected:
            raise ValueError("boundary proposal moves a current region anchor")
    if new_region:
        expected_parent = expected_new_region_parent(
            {str(change["from"]) for change in changes}, hierarchy, str(PR_TO_TAG.get(pruid, ""))
        )
        if new_region["parent"] != expected_parent or expected_parent not in hierarchy:
            raise ValueError("new region parent does not match the affected hierarchy")
        anchor = new_region["anchorDguid"]
        if anchor not in requested or anchor in anchors:
            raise ValueError("new region anchor is not a changed, unprotected cell")
    return rows, list(changes), requested, base_membership_matched, new_region


def already_recorded(overrides: dict[str, Any], issue_url: str) -> bool:
    records = (
        list(overrides.get("cohortOverrides", []))
        + list(overrides.get("splitExceptions", []))
        + list(overrides.get("newRegions", []))
    )
    return any(isinstance(record, dict) and record.get("sourceIssue") == issue_url for record in records)


def record_decision(overrides: dict[str, Any], rows: list[dict[str, str]], requested: dict[str, str], reason: str, issue_number: int, issue_url: str, reviewed_at: str, approved_by: str) -> list[str]:
    if (
        overrides.get("schema") != OVERRIDES_SCHEMA
        or overrides.get("censusVintage") != 2021
        or not isinstance(overrides.get("cohortOverrides"), list)
        or not isinstance(overrides.get("splitExceptions"), list)
        or not isinstance(overrides.get("newRegions"), list)
    ):
        raise ValueError("municipal override authority is invalid")
    rows_by_csd: dict[str, list[dict[str, str]]] = defaultdict(list)
    row_by_dguid: dict[str, dict[str, str]] = {}
    for row in rows:
        rows_by_csd[str(row["CSDUID"])].append(row)
        row_by_dguid[str(row["DGUID"])] = row
    touched = sorted({str(row_by_dguid[dguid]["CSDUID"]) for dguid in requested})
    cohort = [record for record in overrides["cohortOverrides"] if not (isinstance(record, dict) and str(record.get("level", "")).upper() == "CSD" and str(record.get("id", "")) in touched)]
    splits = [record for record in overrides["splitExceptions"] if not (isinstance(record, dict) and str(record.get("csduid", "")) in touched)]
    common = {
        "status": "approved",
        "decision": f"Approved boundary update #{issue_number}.",
        "evidence": [reason, issue_url],
        "reviewedAt": reviewed_at,
        "approvedBy": approved_by,
        "sourceIssue": issue_url,
    }
    for csduid in touched:
        csd_rows = sorted(rows_by_csd[csduid], key=lambda row: row["DGUID"])
        final = {row["DGUID"]: requested.get(row["DGUID"], row["leaf_tag"]) for row in csd_rows}
        owners = sorted(set(final.values()))
        if len(owners) == 1:
            cohort.append({"level": "CSD", "id": csduid, "leafTag": owners[0], **common})
        else:
            splits.append({
                "csduid": csduid,
                **common,
                "members": [{"dguid": dguid, "leafTag": final[dguid]} for dguid in sorted(final)],
            })
    overrides["cohortOverrides"] = sorted(cohort, key=lambda record: (str(record.get("level", "")).upper(), str(record.get("id", ""))))
    overrides["splitExceptions"] = sorted(splits, key=lambda record: str(record.get("csduid", "")))
    return touched


def record_new_region(
    overrides: dict[str, Any],
    new_region: dict[str, str] | None,
    reason: str,
    issue_number: int,
    issue_url: str,
    reviewed_at: str,
    approved_by: str,
) -> None:
    if not new_region:
        return
    records = overrides.get("newRegions")
    if not isinstance(records, list):
        raise ValueError("municipal override new-region authority is invalid")
    if any(isinstance(record, dict) and record.get("tag") == new_region["tag"] for record in records):
        raise ValueError("approved new region tag already exists in authority")
    records.append({
        **new_region,
        "status": "approved",
        "decision": f"Approved new region #{issue_number}.",
        "evidence": [reason, issue_url],
        "reviewedAt": reviewed_at,
        "approvedBy": approved_by,
        "sourceIssue": issue_url,
    })
    overrides["newRegions"] = sorted(records, key=lambda record: str(record.get("tag", "")))


def update_source_lock(lock: dict[str, Any], override_payload: bytes) -> None:
    sources = lock.get("sources")
    if not isinstance(sources, list):
        raise ValueError("region source lock is invalid")
    matches = [source for source in sources if isinstance(source, dict) and source.get("id") == SOURCE_ID]
    if len(matches) != 1:
        raise ValueError("region source lock has no unique municipal override record")
    matches[0]["bytes"] = len(override_payload)
    matches[0]["sha256"] = hashlib.sha256(override_payload).hexdigest()


def write_result(result: dict[str, Any], summary_path: Path | None, github_output: Path | None) -> None:
    if summary_path:
        write_atomic(summary_path, pretty_bytes(result))
    if github_output:
        lines = [
            f"issue_number={result['issueNumber']}",
            f"issue_url={result['issueUrl']}",
            f"change_count={result['changeCount']}",
            f"touched_csds={','.join(result['touchedCensusSubdivisions'])}",
            f"base_membership_matched={str(result['baseMembershipMatched']).lower()}",
            f"already_applied={str(result['alreadyApplied']).lower()}",
        ]
        with github_output.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write("\n".join(lines) + "\n")
    print(json.dumps(result, sort_keys=True))


def main() -> None:
    args = parse_args()
    event, comments, config = read_json(args.event), flatten_comments(read_json(args.comments)), read_json(args.config)
    if not isinstance(event, dict) or not isinstance(config, dict):
        raise ValueError("automation event or configuration is invalid")
    issue, issue_number, issue_url, reviewed_at = validate_event(event, config)
    body = str(issue.get("body", ""))
    schema = single_marker(body, "submission schema", r"<!-- submission-schema:([^ >]+) -->")
    if schema not in PROPOSAL_SCHEMAS:
        raise ValueError("closed issue is not a region proposal")
    proposal_hash = single_marker(body, "submission hash", r"<!-- submission-sha256:([0-9a-f]{64}) -->")
    signature_text = single_marker(body, "submission signature", r"<!-- submission-signature-rs256:([A-Za-z0-9_-]+) -->")
    bots = {str(login).lower() for login in config.get("submissionBots", []) if isinstance(login, str)}
    payload = extract_payload(body, comments, proposal_hash, bots)
    verify_signature(
        args.public_key,
        f"{SIGNATURE_DOMAIN}:{schema}:{proposal_hash}".encode("ascii"),
        decode_base64url(signature_text),
    )
    proposal = json.loads(payload)
    overrides = read_json(args.overrides)
    if not isinstance(overrides, dict):
        raise ValueError("municipal override authority is invalid")
    if already_recorded(overrides, issue_url):
        result = {
            "schema": "mcc-region-boundary-application/v1",
            "issueNumber": issue_number,
            "issueUrl": issue_url,
            "changeCount": len(proposal.get("changes", [])) if isinstance(proposal, dict) else 0,
            "touchedCensusSubdivisions": [],
            "baseMembershipMatched": (
                isinstance(proposal, dict)
                and proposal.get("baseMembershipSha256") == file_sha256(args.membership)
            ),
            "alreadyApplied": True,
        }
        write_result(result, args.summary, args.github_output)
        return
    rows, changes, requested, base_membership_matched, new_region = validate_proposal(
        proposal,
        payload,
        proposal_hash,
        args.membership,
        args.catalog,
        args.cells_dir,
    )
    approved_by = str(event["sender"]["login"])
    touched = record_decision(
        overrides, rows, requested, str(proposal["reason"]), issue_number,
        issue_url, reviewed_at, approved_by,
    )
    record_new_region(
        overrides, new_region, str(proposal["reason"]), issue_number,
        issue_url, reviewed_at, approved_by,
    )
    override_payload = pretty_bytes(overrides)
    source_lock = read_json(args.sources_lock)
    if not isinstance(source_lock, dict):
        raise ValueError("region source lock is invalid")
    update_source_lock(source_lock, override_payload)
    write_atomic(args.overrides, override_payload)
    write_atomic(args.sources_lock, pretty_bytes(source_lock))
    write_result({
        "schema": "mcc-region-boundary-application/v1",
        "issueNumber": issue_number,
        "issueUrl": issue_url,
        "changeCount": len(changes),
        "touchedCensusSubdivisions": touched,
        "baseMembershipMatched": base_membership_matched,
        "alreadyApplied": False,
    }, args.summary, args.github_output)


if __name__ == "__main__":
    main()
