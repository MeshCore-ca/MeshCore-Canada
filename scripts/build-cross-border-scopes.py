#!/usr/bin/env python3
"""Build the cross-border scopes the setup tool offers from data/cross-border-scopes.yml.

The YAML file is the only place to edit. This script checks it and writes
docs/assets/regions/cross-border-scopes.json, which the setup tool reads. With
--check it changes nothing and fails if the JSON no longer matches the YAML.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "cross-border-scopes.yml"
POLICY = ROOT / "data" / "iata-scope-policy.json"
OUTPUT = ROOT / "docs" / "assets" / "regions" / "cross-border-scopes.json"

SCHEMA = "meshcore-canada-cross-border-scopes/v1"
# The scope generator's own rule for a scope name (MeshCoreIataScopes budget).
SCOPE_RE = re.compile(r"^[a-z0-9-]{1,29}$")
TEXT_FIELDS = ["name", "nameFr", "description", "descriptionFr"]
FIELDS = ["scope", *TEXT_FIELDS, "provinces"]
BOOL_TAG = "tag:yaml.org,2002:bool"


class ScopeError(ValueError):
    """The YAML file can't be used. `problems` lists everything wrong, in plain words."""

    def __init__(self, problems: list[str]) -> None:
        super().__init__("\n".join(problems))
        self.problems = list(problems)


class _Loader(yaml.SafeLoader):
    """YAML where only true and false are booleans.

    Plain YAML reads an unquoted `on` (Ontario) as true and `no` as false, so a province
    list like [on, qc] would silently lose Ontario. Here they stay the text they look like.
    """


_Loader.yaml_implicit_resolvers = {
    first: [(tag, pattern) for tag, pattern in resolvers if tag != BOOL_TAG]
    for first, resolvers in yaml.SafeLoader.yaml_implicit_resolvers.items()
}
_Loader.add_implicit_resolver(BOOL_TAG, re.compile(r"^(?:true|True|TRUE|false|False|FALSE)$"), list("tTfF"))


def _read_yaml(path: Path) -> Any:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as error:
        raise ScopeError([f"Can't read {path}: {error.strerror or error}"]) from error
    try:
        return yaml.load(text, Loader=_Loader)  # noqa: S506 - the loader above is a SafeLoader
    except yaml.YAMLError as error:
        raise ScopeError([f"The file is not valid YAML: {str(error).splitlines()[0]}"]) from error


def _policy_names(path: Path) -> tuple[list[str], set[str]]:
    """The province codes, and every label the tool already uses (so a scope can't reuse one)."""
    try:
        policy = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise ScopeError([f"Can't read the catalogue policy {path}: {error}"]) from error
    provinces = sorted(policy["provinces"])
    used = set(provinces) | set(policy.get("meshScopes", {})) | set(policy.get("reservedScopes", []))
    return provinces, used


def _entry_problems(number: int, entry: Any, provinces: list[str], used: set[str], seen: set[str]) -> list[str]:
    where = f"entry {number}"
    if not isinstance(entry, dict):
        return [f"{where}: must be a group of fields ({', '.join(FIELDS)})"]
    problems = []
    for field in entry:
        if field not in FIELDS:
            problems.append(f"{where}: unknown field {field!r} (the fields are {', '.join(FIELDS)})")
    for field in FIELDS:
        if field not in entry or entry[field] is None:
            problems.append(f"{where}: {field} is missing")

    scope = entry.get("scope")
    if scope is not None:
        if not isinstance(scope, str) or not SCOPE_RE.match(scope):
            problems.append(f"{where}: scope must be 1 to 29 lowercase letters, numbers or dashes (got {scope!r})")
        elif scope in used:
            problems.append(f"{where}: scope {scope!r} is already used by the tool for a province or a wider scope")
        elif scope in seen:
            problems.append(f"{where}: scope {scope!r} is listed twice")
        else:
            seen.add(scope)

    for field in TEXT_FIELDS:
        value = entry.get(field)
        if value is None:
            continue
        if not isinstance(value, str):
            problems.append(f"{where}: {field} must be text (got {value!r})")
        elif not value.strip():
            problems.append(f"{where}: {field} must not be empty")

    codes = entry.get("provinces")
    if codes is not None:
        if not isinstance(codes, list):
            problems.append(f"{where}: provinces must be a list of province codes, for example [on]")
        elif not codes:
            problems.append(f"{where}: provinces must list at least one province code")
        else:
            listed: set[str] = set()
            for code in codes:
                if not isinstance(code, str) or code not in provinces:
                    problems.append(f"{where}: provinces: {code!r} is not a province code (use {', '.join(provinces)})")
                elif code in listed:
                    problems.append(f"{where}: provinces lists {code!r} twice")
                else:
                    listed.add(code)
    return problems


def load_scopes(source: Path = SOURCE, policy: Path = POLICY) -> list[dict[str, Any]]:
    """The checked scopes, in the order the file lists them. Raises ScopeError listing every problem."""
    provinces, used = _policy_names(policy)
    raw = _read_yaml(source)
    if not isinstance(raw, dict) or "scopes" not in raw:
        raise ScopeError(["The file must start with `scopes:` followed by the list of scopes"])
    entries = raw["scopes"]
    if not isinstance(entries, list):
        raise ScopeError(["scopes must be a list of entries (write `scopes: []` for none)"])
    problems: list[str] = []
    seen: set[str] = set()
    for number, entry in enumerate(entries, start=1):
        problems.extend(_entry_problems(number, entry, provinces, used, seen))
    if problems:
        raise ScopeError(problems)
    return [
        {"scope": entry["scope"], **{field: entry[field].strip() for field in TEXT_FIELDS}, "provinces": list(entry["provinces"])}
        for entry in entries
    ]


def render(scopes: list[dict[str, Any]]) -> str:
    """The JSON text, one field to a line so a change shows up plainly in review."""

    def value(item: Any) -> str:
        return json.dumps(item, ensure_ascii=False)

    entries = [
        "    {\n" + ",\n".join(f"      {value(key)}: {value(field)}" for key, field in scope.items()) + "\n    }"
        for scope in scopes
    ]
    listed = "[\n" + ",\n".join(entries) + "\n  ]" if entries else "[]"
    return (
        "{\n"
        f'  "schema": {value(SCHEMA)},\n'
        f'  "generatedFrom": {value("data/cross-border-scopes.yml")},\n'
        f'  "scopes": {listed}\n'
        "}\n"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true", help="change nothing; fail if the JSON doesn't match the YAML")
    parser.add_argument("--source", type=Path, default=SOURCE, help=argparse.SUPPRESS)
    parser.add_argument("--policy", type=Path, default=POLICY, help=argparse.SUPPRESS)
    parser.add_argument("--output", type=Path, default=OUTPUT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)

    try:
        scopes = load_scopes(args.source, args.policy)
    except ScopeError as error:
        print(f"{args.source} has problems:", file=sys.stderr)
        for problem in error.problems:
            print(f"  - {problem}", file=sys.stderr)
        return 1

    expected = render(scopes)
    if args.check:
        current = args.output.read_text(encoding="utf-8") if args.output.exists() else None
        if current != expected:
            print(f"{args.output} is out of date. Run: python scripts/build-cross-border-scopes.py", file=sys.stderr)
            return 1
        print(f"Cross-border scopes are up to date ({len(scopes)}).")
        return 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(expected, encoding="utf-8", newline="\n")
    print(f"Wrote {len(scopes)} cross-border scopes to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
