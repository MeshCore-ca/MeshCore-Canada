#!/usr/bin/env python3
"""Validate community data and keep the public directory pages generated from it."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import unicodedata
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "communities.json"
SCHEMA_PATH = ROOT / "schemas" / "community-directory.schema.json"
PROVINCES_DIR = ROOT / "docs" / "provinces"

SCHEMA_VERSION = "meshcore-canada-communities/v1"
VALID_CODES = {
    "AB",
    "BC",
    "MB",
    "NB",
    "NL",
    "NS",
    "NT",
    "NU",
    "ON",
    "PE",
    "QC",
    "SK",
    "YT",
}
VALID_STATUSES = {"active", "forming", "testing", "needs-update"}
VALID_CONTACT_TYPES = {"discord", "facebook", "meshmapper", "telegram", "website"}
VALID_CONTACT_HEALTH = {"verified", "needs-review", "expired"}
ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class Validation:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)


def load_data() -> dict[str, Any]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def parse_date(value: Any, field: str, check: Validation, *, nullable: bool = False) -> date | None:
    if value is None and nullable:
        return None
    if not isinstance(value, str):
        check.error(f"{field} must be an ISO date")
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        check.error(f"{field} must be an ISO date, got {value!r}")
        return None


def normalized(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value)
    return " ".join("".join(char for char in folded if not unicodedata.combining(char)).casefold().split())


def route_for_page(page: dict[str, Any]) -> str:
    return f"/provinces/{page['slug']}/"


def page_by_code(data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        code: page
        for page in data["directory_pages"]
        for code in page["codes"]
    }


def validate_contact(contact: Any, label: str, check: Validation, *, with_identity: bool = False) -> None:
    if not isinstance(contact, dict):
        check.error(f"{label} must be an object")
        return
    required = {"type", "label", "url", "health", "last_checked"}
    if with_identity:
        required |= {"id", "province"}
    missing = sorted(required - contact.keys())
    unexpected = sorted(contact.keys() - required)
    if unexpected:
        check.error(f"{label} has unsupported fields: {', '.join(unexpected)}")
    if missing:
        check.error(f"{label} is missing: {', '.join(missing)}")
        return
    if contact["type"] not in VALID_CONTACT_TYPES:
        check.error(f"{label}.type is not allowed: {contact['type']!r}")
    if not isinstance(contact["label"], str) or not contact["label"].strip():
        check.error(f"{label}.label must be non-empty")
    url = contact["url"]
    if url is not None:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            check.error(f"{label}.url must be an absolute HTTP(S) URL")
    elif contact["health"] != "needs-review":
        check.error(f"{label} without a URL must have needs-review health")
    if contact["health"] not in VALID_CONTACT_HEALTH:
        check.error(f"{label}.health is not allowed: {contact['health']!r}")
    checked = parse_date(contact["last_checked"], f"{label}.last_checked", check, nullable=True)
    if contact["health"] == "verified" and checked is None:
        check.error(f"{label} marked verified must have last_checked")
    if contact["health"] == "expired" and url is None:
        check.error(f"{label} marked expired must retain the expired URL for review")
    if with_identity:
        if not isinstance(contact["id"], str) or not ID_PATTERN.fullmatch(contact["id"]):
            check.error(f"{label}.id must be a stable kebab-case ID")
        if contact["province"] not in VALID_CODES:
            check.error(f"{label}.province is not a Canadian province/territory code")


def validate_data(data: dict[str, Any]) -> Validation:
    check = Validation()
    if data.get("schema") != SCHEMA_VERSION:
        check.error(f"schema must be {SCHEMA_VERSION!r}")
    if not SCHEMA_PATH.is_file():
        check.error(f"schema file is missing: {SCHEMA_PATH.relative_to(ROOT)}")

    metadata = data.get("metadata")
    if not isinstance(metadata, dict):
        check.error("metadata must be an object")
        metadata = {}
    for field in ("owner", "source_revision", "update_route"):
        if not isinstance(metadata.get(field), str) or not metadata[field].strip():
            check.error(f"metadata.{field} must be non-empty")
    parse_date(metadata.get("migrated_at"), "metadata.migrated_at", check)
    parse_date(metadata.get("review_by"), "metadata.review_by", check)

    defaults = data.get("national_defaults")
    if not isinstance(defaults, dict):
        check.error("national_defaults must be an object")
        defaults = {}
    for field in ("radio_preset", "raw_radio", "path_hash_mode", "cli_path_setting"):
        if field not in defaults:
            check.error(f"national_defaults.{field} is required")

    pages = data.get("directory_pages")
    if not isinstance(pages, list) or not pages:
        check.error("directory_pages must be a non-empty array")
        pages = []
    slugs: set[str] = set()
    all_codes: list[str] = []
    for index, page in enumerate(pages):
        label = f"directory_pages[{index}]"
        if not isinstance(page, dict):
            check.error(f"{label} must be an object")
            continue
        slug = page.get("slug")
        if not isinstance(slug, str) or not ID_PATTERN.fullmatch(slug):
            check.error(f"{label}.slug must be kebab-case")
        elif slug in slugs:
            check.error(f"duplicate directory page slug: {slug}")
        else:
            slugs.add(slug)
        if not isinstance(page.get("title"), str) or not page["title"].strip():
            check.error(f"{label}.title must be non-empty")
        codes = page.get("codes")
        if not isinstance(codes, list) or not codes:
            check.error(f"{label}.codes must be a non-empty array")
            codes = []
        for code in codes:
            if code not in VALID_CODES:
                check.error(f"{label} has invalid code {code!r}")
            all_codes.append(code)
        aliases = page.get("aliases")
        if not isinstance(aliases, list) or any(not isinstance(alias, str) or not alias.strip() for alias in aliases):
            check.error(f"{label}.aliases must contain non-empty strings")

    duplicated_codes = sorted(code for code, count in Counter(all_codes).items() if count > 1)
    missing_codes = sorted(VALID_CODES - set(all_codes))
    if duplicated_codes:
        check.error(f"jurisdiction codes appear on multiple pages: {', '.join(duplicated_codes)}")
    if missing_codes:
        check.error(f"jurisdiction codes have no directory page: {', '.join(missing_codes)}")

    code_pages = page_by_code(data) if pages else {}
    province_contacts = data.get("province_contacts")
    if not isinstance(province_contacts, list):
        check.error("province_contacts must be an array")
        province_contacts = []
    province_contact_ids: set[str] = set()
    for index, contact in enumerate(province_contacts):
        label = f"province_contacts[{index}]"
        validate_contact(contact, label, check, with_identity=True)
        if isinstance(contact, dict) and contact.get("id") in province_contact_ids:
            check.error(f"duplicate province contact ID: {contact['id']}")
        elif isinstance(contact, dict):
            province_contact_ids.add(contact.get("id"))

    communities = data.get("communities")
    if not isinstance(communities, list):
        check.error("communities must be an array")
        communities = []
    ids: set[str] = set()
    exact_communities: set[tuple[str, str, str]] = set()
    for index, community in enumerate(communities):
        label = f"communities[{index}]"
        if not isinstance(community, dict):
            check.error(f"{label} must be an object")
            continue
        community_id = community.get("id")
        if not isinstance(community_id, str) or not ID_PATTERN.fullmatch(community_id):
            check.error(f"{label}.id must be a stable kebab-case ID")
            community_id = f"invalid-{index}"
        elif community_id in ids:
            check.error(f"duplicate community ID: {community_id}")
        else:
            ids.add(community_id)

        for field in ("name", "service_area"):
            if not isinstance(community.get(field), str) or not community[field].strip():
                check.error(f"{label}.{field} must be non-empty")
        province = community.get("province")
        if province not in VALID_CODES:
            check.error(f"{label}.province is invalid: {province!r}")
        elif province not in code_pages:
            check.error(f"{label}.province has no directory page: {province}")
        status = community.get("status")
        if status not in VALID_STATUSES:
            check.error(f"{label}.status is invalid: {status!r}")

        for field in ("places", "aliases", "languages"):
            values = community.get(field)
            if not isinstance(values, list) or any(not isinstance(value, str) or not value.strip() for value in values):
                check.error(f"{label}.{field} must be an array of non-empty strings")
            elif len({normalized(value) for value in values}) != len(values):
                check.error(f"{label}.{field} contains duplicate normalized values")

        location = community.get("location")
        if not isinstance(location, dict):
            check.error(f"{label}.location must be an object")
        else:
            latitude = location.get("latitude")
            longitude = location.get("longitude")
            if (latitude is None) != (longitude is None):
                check.error(f"{label}.location must provide both latitude and longitude or neither")
            if latitude is not None and not (-90 <= latitude <= 90):
                check.error(f"{label}.location.latitude is out of range")
            if longitude is not None and not (-180 <= longitude <= 180):
                check.error(f"{label}.location.longitude is out of range")
            if location.get("precision") not in {"exact", "approximate", "service-area"}:
                check.error(f"{label}.location.precision is invalid")

        settings = community.get("settings")
        if not isinstance(settings, dict) or not isinstance(settings.get("inherit_national"), bool):
            check.error(f"{label}.settings must declare inherit_national")
            settings = {"overrides": {}}
        overrides = settings.get("overrides")
        if not isinstance(overrides, dict):
            check.error(f"{label}.settings.overrides must be an object")
            overrides = {}
        for field, value in overrides.items():
            if field not in {"radio_preset", "path_hash_mode"}:
                check.error(f"{label}.settings.overrides has unsupported field {field!r}")
            if value == defaults.get(field):
                check.error(f"{label} repeats inherited national {field} as an override")

        contacts = community.get("contacts")
        if not isinstance(contacts, list) or not contacts:
            check.error(f"{label}.contacts must be a non-empty array")
            contacts = []
        contact_keys: set[tuple[Any, Any, Any]] = set()
        for contact_index, contact in enumerate(contacts):
            contact_label = f"{label}.contacts[{contact_index}]"
            validate_contact(contact, contact_label, check)
            if isinstance(contact, dict):
                key = (contact.get("type"), contact.get("label"), contact.get("url"))
                if key in contact_keys:
                    check.error(f"{label} contains an exact duplicate contact")
                contact_keys.add(key)

        if "owner" not in community or (
            community["owner"] is not None
            and (not isinstance(community["owner"], str) or not community["owner"].strip())
        ):
            check.error(f"{label}.owner must be a non-empty string or null")
        verified = parse_date(community.get("verified_at"), f"{label}.verified_at", check, nullable=True)
        verify_by = parse_date(community.get("verify_by"), f"{label}.verify_by", check, nullable=True)
        if (verified is None) != (verify_by is None):
            check.error(f"{label} must set verified_at and verify_by together")
        if verified is not None and verify_by is not None and verify_by < verified:
            check.error(f"{label}.verify_by cannot precede verified_at")
        if verified is None:
            check.warn(f"{community.get('name', community_id)} needs a community verification date")

        expected_route = ""
        if province in code_pages:
            expected_route = f"{route_for_page(code_pages[province])}#community-{community_id}"
        if community.get("canonical_route") != expected_route:
            check.error(
                f"{label}.canonical_route must be {expected_route!r}, "
                f"got {community.get('canonical_route')!r}"
            )

        if all(isinstance(community.get(field), str) for field in ("name", "service_area")):
            exact_key = (province, normalized(community["name"]), normalized(community["service_area"]))
            if exact_key in exact_communities:
                check.error(f"exact duplicate community: {community['name']} ({province})")
            exact_communities.add(exact_key)

    stoonmesh = next((item for item in communities if item.get("id") == "stoonmesh"), None)
    if not stoonmesh:
        check.error("StoonMesh listing is missing")
    elif stoonmesh.get("settings", {}).get("overrides", {}).get("path_hash_mode") != "1-byte":
        check.error("StoonMesh must retain its reviewed 1-byte path-hash override")
    if defaults.get("path_hash_mode") != "3-byte":
        check.error("the national path-hash baseline must remain 3-byte")

    return check


def front_matter(*, title: str, description: str, task: str, metadata: dict[str, Any], scripts: bool) -> str:
    lines = [
        "---",
        f"title: {title}",
        f"description: {description}",
        "audience:",
        "  - community-seeker",
        "  - community-maintainer",
        f"task: {task}",
        "scope: canada-baseline",
        "status: draft",
        f"owner: {metadata['owner']}",
        f"last_reviewed: {metadata['migrated_at']}",
        f"review_by: {metadata['review_by']}",
        "difficulty: beginner",
        "estimated_time: 2-5 minutes",
        "destructive: false",
        "page_styles:",
        "  - assets/styles/communities.css",
    ]
    if scripts:
        lines.extend(
            [
                "page_scripts:",
                "  - assets/javascripts/communities.js",
            ]
        )
    lines.extend(["---", ""])
    return "\n".join(lines)


def status_label(status: str) -> str:
    return {
        "active": "Active",
        "forming": "Forming",
        "testing": "Testing",
        "needs-update": "Needs update",
    }[status]


def verification_label(community: dict[str, Any]) -> str:
    if community["verified_at"] is None:
        return "Not yet verified"
    return community["verified_at"]


def search_text(community: dict[str, Any], page: dict[str, Any]) -> str:
    values = [
        community["name"],
        community["service_area"],
        community["province"],
        page["title"],
        *page["aliases"],
        *community["places"],
        *community["aliases"],
    ]
    return " ".join(dict.fromkeys(normalized(value) for value in values))


def render_contacts(community: dict[str, Any], *, indent: str = "") -> list[str]:
    lines: list[str] = []
    for contact in community["contacts"]:
        if contact["url"]:
            value = (
                f'<a href="{html.escape(contact["url"], quote=True)}" rel="noopener">'
                f'{html.escape(contact["label"])}</a> '
                '<span class="mc-community-external">(external)</span>'
            )
        else:
            value = html.escape(contact["label"])
        lines.append(f"{indent}<li><strong>{contact['type'].title()}:</strong> {value}</li>")
    return lines


def render_settings(community: dict[str, Any], *, compact: bool = False) -> str:
    overrides = community["settings"]["overrides"]
    if not overrides:
        return "Uses the Canada baseline"
    values = []
    if "radio_preset" in overrides:
        values.append(
            f"Radio preset: <code>{html.escape(overrides['radio_preset'])}</code>"
        )
    if "path_hash_mode" in overrides:
        values.append(
            f"Path hash mode: <strong>{html.escape(overrides['path_hash_mode'])}</strong>"
        )  # Cards use raw HTML, so override values must be escaped markup.
    prefix = "Local override — " if compact else ""
    return prefix + "; ".join(values)


def render_directory_card(community: dict[str, Any], page: dict[str, Any]) -> str:
    search = html.escape(search_text(community, page), quote=True)
    has_override = str(bool(community["settings"]["overrides"])).lower()
    lines = [
        (
            f'<article class="mc-community-card" id="directory-{community["id"]}" '
            f'data-community-card data-community-status="{community["status"]}" '
            f'data-community-override="{has_override}" data-community-search="{search}">'
        ),
        '<div class="mc-community-card__header">',
        (
            f'<h3><a href="{page["slug"]}/#community-{community["id"]}">'
            f'{html.escape(community["name"])}</a></h3>'
        ),
        (
            f'<span class="mc-community-status" data-status="{community["status"]}">'
            f'{status_label(community["status"])}</span>'
        ),
        "</div>",
        f'<p class="mc-community-area">{html.escape(community["service_area"])}</p>',
        (
            f'<p><strong>Province:</strong> <a href="{page["slug"]}/">'
            f'{html.escape(page["title"].title())}</a></p>'
        ),
        f"<p><strong>Settings:</strong> {render_settings(community, compact=True)}</p>",
        f"<p><strong>Last verified:</strong> {verification_label(community)}</p>",
        '<ul class="mc-community-contacts">',
        *render_contacts(community),
        "</ul>",
        (
            f'<p class="mc-community-card__action"><a href="{page["slug"]}/#community-{community["id"]}">'
            "View listing details</a></p>"
        ),
        "</article>",
    ]
    return "\n".join(lines)


def render_index(data: dict[str, Any]) -> str:
    metadata = data["metadata"]
    pages = data["directory_pages"]
    communities = data["communities"]
    code_pages = page_by_code(data)
    active = sum(item["status"] == "active" for item in communities)
    forming = sum(item["status"] == "forming" for item in communities)
    overrides = sum(bool(item["settings"]["overrides"]) for item in communities)

    lines = [
        front_matter(
            title="Find a MeshCore community in Canada",
            description="Search Canadian MeshCore communities by place, province, community name, or common alias.",
            task="find-community",
            metadata=metadata,
            scripts=True,
        ).rstrip(),
        "",
        "<!-- Generated by scripts/validate-communities.py from data/communities.json. Do not edit by hand. -->",
        "",
        "# Find a MeshCore community",
        "",
        "Search by place, province, community name, or a common alias. The full list",
        "works without a map, location permission, or a GitHub account.",
        "",
        '<div class="mc-directory-summary" aria-label="Directory summary">',
        f"<span><strong>{len(communities)}</strong> listings</span>",
        f"<span><strong>{active}</strong> active</span>",
        f"<span><strong>{forming}</strong> forming</span>",
        f"<span><strong>{overrides}</strong> local override</span>",
        "</div>",
        "",
        '<div class="mc-directory-tools" data-community-directory>',
        '  <div class="mc-directory-tools__search">',
        '    <label for="community-search">Place, province, community, or alias</label>',
        (
            '    <input id="community-search" type="search" name="q" '
            'autocomplete="address-level2" placeholder="Try Ottawa, YQL, or Quebec">'
        ),
        "  </div>",
        '  <div class="mc-directory-tools__filter">',
        '    <label for="community-status">Status</label>',
        '    <select id="community-status">',
        '      <option value="">All statuses</option>',
        '      <option value="active">Active</option>',
        '      <option value="forming">Forming</option>',
        "    </select>",
        "  </div>",
        '  <label class="mc-directory-tools__check">',
        '    <input id="community-override" type="checkbox">',
        "    Has a local settings override",
        "  </label>",
        '  <button class="md-button" type="button" data-community-clear>Clear</button>',
        '  <output class="mc-directory-tools__count" data-community-count aria-live="polite">',
        f"    Showing {len(communities)} communities",
        "  </output>",
        "</div>",
        "",
        '<div class="mc-community-empty" data-community-empty hidden>',
        "  <h2>No matching community</h2>",
        "  <p>Try a nearby city, a province name, a location code such as YQL, or clear the filters.</p>",
        '  <button class="md-button" type="button" data-community-clear>Clear search</button>',
        '  <p><a href="../submit-idea/">Add a missing community</a></p>',
        "</div>",
        "",
        "## Communities",
        "",
        '<div class="mc-community-grid" data-community-results>',
    ]
    for community in communities:
        lines.append(render_directory_card(community, code_pages[community["province"]]))
    lines.extend(
        [
            "</div>",
            "",
            "## Canada baseline",
            "",
            "Use these settings only when your local community has not published an override.",
            "",
            "| Setting | Canada baseline |",
            "|---|---|",
            f'| Radio preset | `{data["national_defaults"]["radio_preset"]}` |',
            (
                "| Raw radio values | "
                f'`{data["national_defaults"]["raw_radio"]["frequency_mhz"]} MHz / '
                f'{data["national_defaults"]["raw_radio"]["bandwidth_khz"]} kHz / '
                f'SF{data["national_defaults"]["raw_radio"]["spreading_factor"]} / '
                f'CR{data["national_defaults"]["raw_radio"]["coding_rate"]}` |'
            ),
            f'| Path hash mode | `{data["national_defaults"]["path_hash_mode"]}` |',
            f'| Command-line path setting | `{data["national_defaults"]["cli_path_setting"]}` |',
            "",
            "!!! warning \"Check local settings first\"",
            "    Nearby devices need matching settings. A card marked **Local override**",
            "    takes precedence over the Canada baseline after you confirm it with the",
            "    listed community.",
            "",
            "## Browse by province or territory",
            "",
            '<div class="mc-province-grid">',
        ]
    )
    for page in pages:
        page_communities = [
            item for item in communities if item["province"] in page["codes"]
        ]
        page_active = sum(item["status"] == "active" for item in page_communities)
        page_forming = sum(item["status"] == "forming" for item in page_communities)
        labels = []
        if page_active:
            labels.append(f"{page_active} active")
        if page_forming:
            labels.append(f"{page_forming} forming")
        if not labels:
            labels.append("No listing yet")
        lines.extend(
            [
                '<article class="mc-province-card">',
                f'<h3><a href="{page["slug"]}/">{html.escape(page["title"].title())}</a></h3>',
                f"<p>{', '.join(labels)}</p>",
                "</article>",
            ]
        )
    lines.extend(
        [
            "</div>",
            "",
            "## Add or update a listing",
            "",
            "Found missing or outdated information?",
            f"[Send a community update]({metadata['update_route']}). No GitHub account is needed.",
            "",
            "Directory contacts are community-provided external links. **Not yet verified**",
            "means the directory stewards have preserved the listing but have not recorded a",
            "recent contact check. Use the update action if a link has expired.",
            "",
        ]
    )
    return "\n".join(lines)


def render_community_card(community: dict[str, Any], metadata: dict[str, Any]) -> str:
    lines = [
        (
            f'<article class="mc-community-card mc-community-card--detail" '
            f'id="community-{community["id"]}">'
        ),
        '<div class="mc-community-card__header">',
        f"<h3>{html.escape(community['name'])}</h3>",
        (
            f'<span class="mc-community-status" data-status="{community["status"]}">'
            f'{status_label(community["status"])}</span>'
        ),
        "</div>",
        f'<p class="mc-community-area">{html.escape(community["service_area"])}</p>',
        "<dl class=\"mc-community-facts\">",
        "<div><dt>Settings</dt>",
        f"<dd>{render_settings(community)}</dd></div>",
        "<div><dt>Last verified</dt>",
        f"<dd>{verification_label(community)}</dd></div>",
        "</dl>",
    ]
    if community["settings"]["overrides"]:
        lines.extend(
            [
                '<div class="mc-community-override" role="note">',
                "<strong>Local settings override</strong>",
                "<p>Confirm this setting with the community before changing a node.</p>",
                "</div>",
            ]
        )
    if community["status"] == "forming":
        lines.extend(
            [
                '<p class="mc-community-forming">',
                "This group is forming. Contact it to learn what is working and where help is needed.",
                "</p>",
            ]
        )
    lines.extend(
        [
            "<h4>Contacts</h4>",
            '<ul class="mc-community-contacts">',
            *render_contacts(community),
            "</ul>",
            '<p class="mc-community-contact-health">',
            "<strong>Contact check:</strong> Not yet verified",
            "</p>",
            (
                '<p class="mc-community-card__action"><a href="../../submit-idea/">'
                "Update this listing</a></p>"
            ),
            "</article>",
        ]
    )
    return "\n".join(lines)


def render_province_page(data: dict[str, Any], page: dict[str, Any]) -> str:
    metadata = data["metadata"]
    communities = [
        item for item in data["communities"] if item["province"] in page["codes"]
    ]
    province_contacts = [
        item for item in data["province_contacts"] if item["province"] in page["codes"]
    ]
    active = sum(item["status"] == "active" for item in communities)
    forming = sum(item["status"] == "forming" for item in communities)
    title_display = page["title"]
    description = (
        f"Find MeshCore community contacts, service areas, and local settings for {title_display}."
    )
    lines = [
        front_matter(
            title=f"MeshCore communities in {title_display}",
            description=description,
            task="browse-community-directory",
            metadata=metadata,
            scripts=False,
        ).rstrip(),
        "",
        "<!-- Generated by scripts/validate-communities.py from data/communities.json. Do not edit by hand. -->",
        "",
        f"# MeshCore communities in {title_display}",
        "",
    ]
    if communities:
        summary_parts = []
        if active:
            summary_parts.append(f"{active} active")
        if forming:
            summary_parts.append(f"{forming} forming")
        lines.extend(
            [
                f"This directory currently has **{len(communities)}** listing"
                f"{'' if len(communities) == 1 else 's'}: {', '.join(summary_parts)}.",
                "",
                "All listings inherit the [Canada baseline](index.md#canada-baseline) unless a",
                "card shows a local override.",
                "",
            ]
        )
    else:
        lines.extend(
            [
                "There is no reviewed community listing here yet.",
                "",
                '<div class="mc-community-empty mc-community-empty--page">',
                "  <h2>Help add the first listing</h2>",
                "  <p>Share the community name, service area, status, and a public contact link.</p>",
                '  <p><a class="md-button md-button--primary" href="../../submit-idea/">'
                "Add a community</a></p>",
                '  <p><a href="../">Browse all Canadian communities</a></p>',
                "</div>",
                "",
                "Until a reviewed local listing publishes an override, start with the",
                "[Canada baseline](index.md#canada-baseline) and confirm settings with nearby",
                "operators before transmitting.",
                "",
            ]
        )

    override_communities = [
        item for item in communities if item["settings"]["overrides"]
    ]
    if override_communities:
        lines.extend(
            [
                "!!! warning \"Local setting differs from the Canada baseline\"",
                "    One community on this page publishes a local setting override. Confirm",
                "    the current setting with its contact before configuring or changing a node.",
                "",
            ]
        )

    if communities:
        lines.extend(["## Community listings", "", '<div class="mc-community-grid">'])
        for community in communities:
            lines.append(render_community_card(community, metadata))
        lines.extend(["</div>", ""])

    if province_contacts:
        lines.extend(["## Province-wide contacts", "", '<div class="mc-community-card">'])
        for contact in province_contacts:
            if contact["url"]:
                rendered = (
                    f'<a href="{html.escape(contact["url"], quote=True)}" rel="noopener">'
                    f'{html.escape(contact["label"])}</a> '
                    '<span class="mc-community-external">(external)</span>'
                )
            else:
                rendered = html.escape(contact["label"])
            lines.extend(
                [
                    f"<p><strong>{contact['type'].title()}:</strong> {rendered}</p>",
                    "<p><strong>Contact check:</strong> Not yet verified</p>",
                ]
            )
        lines.extend(["</div>", ""])

    lines.extend(
        [
            "## Add or update a listing",
            "",
            f"[Send a community update]({metadata['update_route']}). No GitHub account is needed.",
            "",
            "The directory does not guess exact locations, languages, owners, or link health.",
            "Fields remain marked unverified until a community steward reviews them.",
            "",
        ]
    )
    return "\n".join(lines)


def generated_pages(data: dict[str, Any]) -> dict[Path, str]:
    pages = {PROVINCES_DIR / "index.md": render_index(data)}
    for page in data["directory_pages"]:
        pages[PROVINCES_DIR / f"{page['slug']}.md"] = render_province_page(data, page)
    return pages


def check_or_write_generated(
    data: dict[str, Any],
    check: Validation,
    *,
    write: bool,
) -> None:
    for path, expected in generated_pages(data).items():
        expected = expected.rstrip() + "\n"
        if write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(expected, encoding="utf-8", newline="\n")
            continue
        if not path.is_file():
            check.error(f"generated page is missing: {path.relative_to(ROOT)}")
            continue
        actual = path.read_text(encoding="utf-8")
        if actual != expected:
            check.error(
                f"{path.relative_to(ROOT)} is out of date; "
                "run: python scripts/validate-communities.py --write"
            )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write",
        action="store_true",
        help="write generated province and directory pages after validating data",
    )
    args = parser.parse_args()

    try:
        data = load_data()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: cannot read {DATA_PATH.relative_to(ROOT)}: {exc}", file=sys.stderr)
        return 1

    check = validate_data(data)
    if not check.errors:
        check_or_write_generated(data, check, write=args.write)

    for warning in check.warnings:
        print(f"WARNING: {warning}")
    for error in check.errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if check.errors:
        print(
            f"Community directory validation failed with {len(check.errors)} error(s).",
            file=sys.stderr,
        )
        return 1

    communities = data["communities"]
    active = sum(item["status"] == "active" for item in communities)
    forming = sum(item["status"] == "forming" for item in communities)
    mode = "generated and validated" if args.write else "validated"
    print(
        f"Community directory {mode}: {len(communities)} listings "
        f"({active} active, {forming} forming), "
        f"{len(data['directory_pages'])} directory pages."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
