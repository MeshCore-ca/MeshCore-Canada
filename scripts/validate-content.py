#!/usr/bin/env python3
"""Fail-closed validation for public MeshCore Canada documentation pages."""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import yaml


REQUIRED = (
    "title",
    "description",
    "audience",
    "task",
    "scope",
    "status",
    "owner",
    "last_reviewed",
    "review_by",
)
STATUSES = {"verified", "draft", "experimental", "legacy", "archived"}
FIXED_SCOPES = {
    "canada-baseline",
    "upstream-meshcore",
    "ottawa-field-practice",
    "experimental",
    "legacy",
    "regulatory-reference",
}
SLUG = re.compile(r"^[a-z0-9-]+$")
H1 = re.compile(r"^#(?!#)\s+(.+?)\s*$", re.MULTILINE)
HEADING = re.compile(r"^#{2,6}\s+(.+?)\s*$", re.MULTILINE)
ASSET_KEYS = ("page_styles", "page_scripts", "page_modules")


def parse_date(value: Any) -> dt.date | None:
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    if isinstance(value, str):
        try:
            return dt.date.fromisoformat(value)
        except ValueError:
            return None
    return None


def read_page(path: Path) -> tuple[dict[str, Any], str, list[str]]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text, ["missing YAML front matter at the first line"]

    try:
        closing = next(index for index, line in enumerate(lines[1:], 1) if line.strip() == "---")
    except StopIteration:
        return {}, text, ["front matter is not closed with ---"]

    try:
        metadata = yaml.safe_load("\n".join(lines[1:closing])) or {}
    except yaml.YAMLError as exc:
        return {}, "\n".join(lines[closing + 1 :]), [f"invalid YAML front matter: {exc}"]
    if not isinstance(metadata, dict):
        errors.append("front matter must be a mapping")
        metadata = {}
    return metadata, "\n".join(lines[closing + 1 :]), errors


def validate_page(path: Path, docs_root: Path, today: dt.date) -> tuple[dict[str, Any], list[str]]:
    metadata, body, errors = read_page(path)
    for key in REQUIRED:
        if key not in metadata or metadata[key] in (None, "", []):
            errors.append(f"missing required metadata: {key}")

    title = metadata.get("title")
    description = metadata.get("description")
    audience = metadata.get("audience")
    task = metadata.get("task")
    scope = metadata.get("scope")
    status = metadata.get("status")
    owner = metadata.get("owner")

    if isinstance(title, str):
        if len(title.strip()) < 4:
            errors.append("title must contain at least four characters")
        if title.strip().casefold() == "overview":
            errors.append("title cannot be the unqualified word Overview")
    elif title is not None:
        errors.append("title must be a string")

    if isinstance(description, str):
        length = len(description.strip())
        if not 24 <= length <= 180:
            errors.append("description must be 24-180 characters")
    elif description is not None:
        errors.append("description must be a string")

    if not isinstance(audience, list) or not audience:
        if audience is not None:
            errors.append("audience must be a non-empty list")
    elif any(not isinstance(value, str) or not SLUG.fullmatch(value) for value in audience):
        errors.append("audience values must be lowercase slugs")

    for key, value in (("task", task), ("owner", owner)):
        if value is not None and (not isinstance(value, str) or not SLUG.fullmatch(value)):
            errors.append(f"{key} must be a lowercase slug")

    if isinstance(scope, str):
        valid_scope = (
            scope in FIXED_SCOPES
            or re.fullmatch(r"province:[a-z]{2}", scope)
            or re.fullmatch(r"community:[a-z0-9-]+", scope)
        )
        if not valid_scope:
            errors.append(f"unsupported scope: {scope}")
    elif scope is not None:
        errors.append("scope must be a string")

    if status is not None and status not in STATUSES:
        errors.append(f"unsupported status: {status}")
    if status == "verified" and not metadata.get("tested_with") and not metadata.get("evidence"):
        errors.append("verified pages require tested_with or evidence")

    last_reviewed = parse_date(metadata.get("last_reviewed"))
    review_by = parse_date(metadata.get("review_by"))
    if metadata.get("last_reviewed") is not None and last_reviewed is None:
        errors.append("last_reviewed must be an ISO date")
    if metadata.get("review_by") is not None and review_by is None:
        errors.append("review_by must be an ISO date")
    if last_reviewed and review_by and last_reviewed > review_by:
        errors.append("review_by cannot be earlier than last_reviewed")
    if status == "verified" and review_by and review_by < today:
        errors.append(f"verified page review expired on {review_by.isoformat()}")

    headings = H1.findall(body)
    if len(headings) != 1:
        errors.append(f"expected exactly one H1, found {len(headings)}")
    if len(re.sub(r"[\s#*_`<>-]", "", body)) < 80:
        errors.append("page body is empty or materially incomplete")

    if metadata.get("destructive") is True:
        section_names = [value.casefold() for value in HEADING.findall(body)]
        required_sections = {
            "preflight or backup": ("before", "preflight", "backup"),
            "verification": ("verify", "verification", "check", "make sure"),
            "recovery": ("recovery", "undo", "restore"),
        }
        for label, words in required_sections.items():
            if not any(any(word in section for word in words) for section in section_names):
                errors.append(f"destructive page is missing a {label} heading")

    for key in ASSET_KEYS:
        values = metadata.get(key, [])
        if values is None:
            continue
        if not isinstance(values, list) or any(not isinstance(value, str) for value in values):
            errors.append(f"{key} must be a list of relative asset paths")
            continue
        for value in values:
            parsed = urlsplit(value)
            asset_path = parsed.path
            if (
                parsed.scheme
                or parsed.netloc
                or asset_path.startswith("/")
                or ".." in Path(asset_path).parts
            ):
                errors.append(f"{key} contains a non-local path: {value}")
                continue
            if not asset_path or not (docs_root / asset_path).is_file():
                errors.append(f"{key} asset does not exist: {value}")

    return metadata, errors


def validate_tree(docs_root: Path, today: dt.date) -> list[str]:
    problems: list[str] = []
    titles: dict[str, list[Path]] = defaultdict(list)
    descriptions: dict[str, list[Path]] = defaultdict(list)
    pages = sorted(path for path in docs_root.rglob("*.md") if "assets" not in path.relative_to(docs_root).parts)

    for path in pages:
        metadata, errors = validate_page(path, docs_root, today)
        relative = path.relative_to(docs_root).as_posix()
        problems.extend(f"{relative}: {error}" for error in errors)
        if isinstance(metadata.get("title"), str):
            titles[metadata["title"].strip().casefold()].append(path)
        if isinstance(metadata.get("description"), str):
            descriptions[metadata["description"].strip().casefold()].append(path)

    for label, values in (("title", titles), ("description", descriptions)):
        for duplicate, paths in values.items():
            if duplicate and len(paths) > 1:
                joined = ", ".join(path.relative_to(docs_root).as_posix() for path in paths)
                problems.append(f"duplicate {label}: {joined}")

    if not pages:
        problems.append("no Markdown pages found")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs", type=Path, default=Path("docs"))
    parser.add_argument("--today", type=dt.date.fromisoformat, default=dt.date.today())
    args = parser.parse_args()

    docs_root = args.docs.resolve()
    problems = validate_tree(docs_root, args.today)
    if problems:
        print(f"Content validation failed with {len(problems)} problem(s):", file=sys.stderr)
        for problem in problems:
            print(f"- {problem}", file=sys.stderr)
        return 1

    page_count = sum(1 for path in docs_root.rglob("*.md") if "assets" not in path.relative_to(docs_root).parts)
    print(f"Content validation passed for {page_count} pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
