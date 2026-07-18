#!/usr/bin/env python3
"""Anonymous, server-validated MeshCore Canada submission gateway.

The service deliberately has no repository contents permission.  It accepts a
small, fixed JSON contract and uses a repository-restricted GitHub App
installation token to create an issue. Region proposals are revalidated against
mounted authority files; community ideas never depend on those files.
"""

from __future__ import annotations

import base64
import csv
import gzip
import hashlib
import hmac
import html
import ipaddress
import json
import os
import re
import secrets
import sqlite3
import stat
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict, deque
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, Mapping, Protocol


API_VERSION = 1
DEFAULT_BASE_PATH = "/api/meshcore-canada/submissions"
PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v1"
IDEA_SCHEMA = "mcc-community-idea/v1"
TURNSTILE_ACTION = "meshcore_submission"
GITHUB_OWNER = "MeshCore-ca"
GITHUB_REPO = "MeshCore-Canada"
GITHUB_FULL_NAME = f"{GITHUB_OWNER}/{GITHUB_REPO}"
GITHUB_LABEL = "enhancement"
BOUNDARY_UPDATE_LABEL = "boundary-update"
GITHUB_API_VERSION = "2026-03-10"
MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_CHANGES = 25_000
MAX_TURNSTILE_TOKEN = 2_048
INLINE_CANONICAL_BYTES = 40_000
COMMENT_CHUNK_CHARS = 48_000
MAX_COMMENTS = 100
COMMENTS_PAGE_SIZE = 20
MAX_COMMENT_PAGES = 100
MAX_ISSUE_BODY_BYTES = 65_000
MAX_MOVE_SUMMARY = 100

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
DGUID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
TAG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
CHUNK_MARKER_RE = re.compile(
    r"<!-- mcc-submission-chunk:([0-9a-f]{64}):(\d{1,3})/(\d{1,3}) -->"
)
JS_WHITESPACE_RE = re.compile(
    r"[\x09-\x0d\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+"
)
JS_TRIM_START_RE = re.compile(
    r"^[\x09-\x0d\x20\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+"
)
JS_TRIM_END_RE = re.compile(
    r"[\x09-\x0d\x20\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$"
)
IDEA_CATEGORIES = frozenset({
    "Newcomer or accessibility improvement",
    "Documentation correction",
    "Hardware or build-guide idea",
    "Regional community information",
    "Network tool or service idea",
    "Feature or project idea",
    "Other community feedback",
})
IDEA_EXPERIENCE_LEVELS = frozenset({
    "Brand new / researching",
    "Setting up my first node",
    "Active mesh user",
    "Repeater, room server, or observer operator",
    "Developer or documentation contributor",
})
PR_TO_TAG = {
    "10": "nl", "11": "pe", "12": "ns", "13": "nb", "24": "qc",
    "35": "on", "46": "mb", "47": "sk", "48": "ab", "59": "bc",
    "60": "yt", "61": "nt", "62": "nu",
}


class GatewayError(Exception):
    """A safe client-facing error (never contains submitted content)."""

    def __init__(self, status: int, code: str, message: str, *, retry_after: int | None = None):
        super().__init__(code)
        self.status = status
        self.code = code
        self.message = message
        self.retry_after = retry_after


class UpstreamError(GatewayError):
    def __init__(self, _code: str = "service_unavailable"):
        super().__init__(502, "service_unavailable", "The submission could not be sent right now. Try again later.")


def _is_int(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _clean_text(value: object, maximum: int, *, required: bool) -> str:
    if value is None and not required:
        return ""
    if not isinstance(value, str):
        raise GatewayError(422, "invalid_proposal", "The proposal contains invalid text.")
    # Match docs/config/editor/validate.js exactly, rather than Python's
    # broader str.split whitespace table.
    cleaned = JS_WHITESPACE_RE.sub(" ", value).strip(" ")
    if required and not cleaned:
        raise GatewayError(422, "invalid_proposal", "Add a short reason for this boundary change.")
    if len(cleaned) > maximum or any(ord(ch) < 32 or 0xD800 <= ord(ch) <= 0xDFFF for ch in cleaned):
        raise GatewayError(422, "invalid_proposal", "The proposal contains invalid text.")
    return cleaned


def _js_trim(value: str) -> str:
    return JS_TRIM_END_RE.sub("", JS_TRIM_START_RE.sub("", value))


def _clean_idea_text(
    value: object, maximum: int, *, required: bool, multiline: bool,
) -> str:
    if not isinstance(value, str):
        raise GatewayError(422, "invalid_submission", "The idea contains invalid text.")
    normalized = value.replace("\r\n", "\n").replace("\r", "\n") if multiline else value
    cleaned = _js_trim(normalized)
    if required and not cleaned:
        raise GatewayError(422, "invalid_submission", "Complete all required idea fields.")
    if len(cleaned) > maximum:
        raise GatewayError(422, "invalid_submission", "One or more idea fields are too long.")
    for character in cleaned:
        codepoint = ord(character)
        if 0xD800 <= codepoint <= 0xDFFF:
            raise GatewayError(422, "invalid_submission", "The idea contains invalid text.")
        if character == "\n" and multiline:
            continue
        if codepoint < 32 or 0x7F <= codepoint <= 0x9F or character in {chr(0x2028), chr(0x2029)}:
            raise GatewayError(422, "invalid_submission", "The idea contains invalid text.")
    return cleaned


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canonical_json(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def _canonical_submission_json(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _strict_json_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON object key")
        result[key] = value
    return result


def _reject_json_constant(_value: str) -> object:
    raise ValueError("non-finite JSON number")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _safe_markdown_text(value: str) -> str:
    # HTML escaping prevents Markdown structure injection.  A zero-width space
    # prevents user-supplied GitHub @mentions from notifying accounts or teams.
    return html.escape(value, quote=True).replace("@", "@\u200b")


def _safe_html_block(value: str) -> str:
    return "<p>" + _safe_markdown_text(value).replace("\n", "<br>\n") + "</p>"


def _json_fence(payload: str) -> str:
    longest = max((len(run) for run in re.findall(r"`+", payload)), default=0)
    fence = "`" * max(3, longest + 1)
    return f"{fence}json\n{payload}\n{fence}\n"


def _valid_issue_url(value: object, issue_number: int) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urllib.parse.urlsplit(value)
    return (
        parsed.scheme == "https"
        and parsed.netloc == "github.com"
        and parsed.username is None
        and parsed.password is None
        and parsed.path == f"/{GITHUB_FULL_NAME}/issues/{issue_number}"
        and not parsed.query
        and not parsed.fragment
    )


def read_secret_file(path: Path, *, maximum: int, pem: bool = False) -> str:
    """Read a root-owned-style secret and fail closed on weak file metadata."""
    try:
        metadata = path.lstat()
    except OSError as exc:
        raise RuntimeError("a required secret file is unavailable") from exc
    if stat.S_ISLNK(metadata.st_mode) or not stat.S_ISREG(metadata.st_mode):
        raise RuntimeError("a required secret path is not a regular file")
    if stat.S_IMODE(metadata.st_mode) & 0o077:
        raise RuntimeError("a required secret file is readable or writable by group/other")
    if metadata.st_size <= 0 or metadata.st_size > maximum:
        raise RuntimeError("a required secret file has an invalid size")
    try:
        value = path.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError) as exc:
        raise RuntimeError("a required secret file cannot be read") from exc
    if not value:
        raise RuntimeError("a required secret file is empty")
    if pem and not value.startswith("-----BEGIN "):
        raise RuntimeError("the GitHub App private key is not PEM encoded")
    return value


@dataclass(frozen=True)
class MembershipRow:
    dguid: str
    pruid: str
    leaf_tag: str


@dataclass(frozen=True)
class AuthoritySnapshot:
    membership_sha256: str
    membership: Mapping[str, MembershipRow]
    leaves: frozenset[str]
    leaf_jurisdictions: Mapping[str, str]
    seed_tags: Mapping[str, str]


class AuthorityCache:
    """Reload authority atomically whenever a mounted input changes."""

    def __init__(self, membership_path: Path, catalog_path: Path, cells_dir: Path):
        self.membership_path = membership_path
        self.catalog_path = catalog_path
        self.cells_dir = cells_dir
        self._lock = threading.Lock()
        self._signature: tuple[Any, ...] | None = None
        self._snapshot: AuthoritySnapshot | None = None

    def _paths(self) -> list[Path]:
        if not self.cells_dir.is_dir():
            raise RuntimeError("the mounted cells directory is unavailable")
        return [self.membership_path, self.catalog_path, *sorted(self.cells_dir.glob("cells-*.topo.json"))]

    def _stat_signature(self) -> tuple[Any, ...]:
        result: list[tuple[str, int, int, int]] = []
        for path in self._paths():
            try:
                info = path.stat()
            except OSError as exc:
                raise RuntimeError("a mounted authority file is unavailable") from exc
            if not stat.S_ISREG(info.st_mode):
                raise RuntimeError("a mounted authority input is not a regular file")
            result.append((path.name, info.st_size, info.st_mtime_ns, getattr(info, "st_ino", 0)))
        return tuple(result)

    def get(self) -> AuthoritySnapshot:
        signature = self._stat_signature()
        if self._snapshot is not None and signature == self._signature:
            return self._snapshot
        with self._lock:
            signature = self._stat_signature()
            if self._snapshot is not None and signature == self._signature:
                return self._snapshot
            for _ in range(3):
                before = self._stat_signature()
                snapshot = self._load()
                after = self._stat_signature()
                if before == after:
                    self._snapshot = snapshot
                    self._signature = after
                    return snapshot
            raise RuntimeError("mounted authority data changed repeatedly while loading")

    def _load(self) -> AuthoritySnapshot:
        membership_bytes = self.membership_path.read_bytes()
        try:
            text = membership_bytes.decode("utf-8-sig")
        except UnicodeError as exc:
            raise RuntimeError("membership CSV is not UTF-8") from exc
        reader = csv.DictReader(text.splitlines())
        required = {"DGUID", "PRUID", "leaf_tag"}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise RuntimeError("membership CSV is missing required columns")

        try:
            catalog = json.loads(self.catalog_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise RuntimeError("catalog JSON is invalid") from exc
        leaves, jurisdictions = self._catalog_leaves(catalog)

        membership: dict[str, MembershipRow] = {}
        for raw in reader:
            dguid = str(raw.get("DGUID", "")).strip()
            pruid = str(raw.get("PRUID", "")).strip().zfill(2)
            leaf = str(raw.get("leaf_tag", "")).strip()
            if not DGUID_RE.fullmatch(dguid) or pruid not in PR_TO_TAG or leaf not in leaves:
                raise RuntimeError("membership CSV contains an invalid row")
            if dguid in membership:
                raise RuntimeError("membership CSV contains duplicate DGUID values")
            if jurisdictions.get(leaf) != PR_TO_TAG[pruid]:
                raise RuntimeError("membership CSV crosses a province or territory")
            membership[dguid] = MembershipRow(dguid, pruid, leaf)
        if not membership:
            raise RuntimeError("membership CSV is empty")

        expected_files = {f"cells-{pruid}.topo.json" for pruid in sorted({row.pruid for row in membership.values()})}
        actual_paths = {path.name: path for path in self.cells_dir.glob("cells-*.topo.json")}
        if set(actual_paths) != expected_files:
            raise RuntimeError("the per-province cell set does not match membership")

        seen: set[str] = set()
        seed_tags: dict[str, str] = {}
        seed_counts: Counter[str] = Counter()
        for filename in sorted(expected_files):
            try:
                topology = json.loads(actual_paths[filename].read_text(encoding="utf-8"))
                geometries = topology["objects"]["cells"]["geometries"]
            except (OSError, UnicodeError, json.JSONDecodeError, KeyError, TypeError) as exc:
                raise RuntimeError("a per-province TopoJSON file is invalid") from exc
            if topology.get("type") != "Topology" or not isinstance(geometries, list):
                raise RuntimeError("a per-province TopoJSON file has an invalid schema")
            file_pruid = filename.removeprefix("cells-").removesuffix(".topo.json")
            for geometry in geometries:
                props = geometry.get("properties") if isinstance(geometry, dict) else None
                if not isinstance(props, dict):
                    raise RuntimeError("a TopoJSON cell has invalid properties")
                dguid = str(props.get("DGUID", "")).strip()
                pruid = str(props.get("PRUID", "")).strip().zfill(2)
                leaf = str(props.get("leaf_tag", "")).strip()
                seed = str(props.get("seed_tag", "")).strip()
                row = membership.get(dguid)
                if dguid in seen or row is None or pruid != file_pruid or row.pruid != pruid or row.leaf_tag != leaf:
                    raise RuntimeError("TopoJSON cell authority disagrees with membership")
                seen.add(dguid)
                if seed:
                    if seed not in leaves or jurisdictions.get(seed) != PR_TO_TAG[pruid] or seed != leaf:
                        raise RuntimeError("TopoJSON contains an invalid seed_tag")
                    seed_tags[dguid] = seed
                    seed_counts[seed] += 1
        if seen != set(membership):
            raise RuntimeError("TopoJSON and membership DGUID sets differ")
        if set(seed_counts) != leaves or any(count != 1 for count in seed_counts.values()):
            raise RuntimeError("TopoJSON must contain exactly one anchor for every leaf region")

        return AuthoritySnapshot(
            membership_sha256=_sha256(membership_bytes),
            membership=membership,
            leaves=frozenset(leaves),
            leaf_jurisdictions=jurisdictions,
            seed_tags=seed_tags,
        )

    @staticmethod
    def _catalog_leaves(catalog: object) -> tuple[set[str], dict[str, str]]:
        if not isinstance(catalog, dict) or not isinstance(catalog.get("hierarchy"), dict):
            raise RuntimeError("catalog hierarchy is invalid")
        hierarchy = catalog["hierarchy"]
        if not all(isinstance(tag, str) and TAG_RE.fullmatch(tag) and isinstance(entry, dict) for tag, entry in hierarchy.items()):
            raise RuntimeError("catalog hierarchy contains invalid entries")
        parents = {entry.get("parent") for entry in hierarchy.values() if entry.get("parent")}
        leaves = set(hierarchy) - parents
        jurisdictions: dict[str, str] = {}
        for leaf in leaves:
            path: list[str] = []
            seen: set[str] = set()
            current: object = leaf
            while current:
                if not isinstance(current, str) or current in seen or current not in hierarchy:
                    raise RuntimeError("catalog hierarchy ancestry is invalid")
                seen.add(current)
                path.insert(0, current)
                current = hierarchy[current].get("parent")
            if len(path) < 3 or path[0] != "can" or path[1] not in PR_TO_TAG.values():
                raise RuntimeError("a catalog leaf has no jurisdiction ancestor")
            jurisdictions[leaf] = path[1]
        return leaves, jurisdictions


def validate_proposal(raw: object, authority: AuthoritySnapshot) -> tuple[dict[str, Any], bytes, str]:
    if not isinstance(raw, dict) or set(raw) - {"schema", "baseMembershipSha256", "submittedBy", "reason", "changes"}:
        raise GatewayError(422, "invalid_proposal", "The proposal format is not supported.")
    if raw.get("schema") != PROPOSAL_SCHEMA:
        raise GatewayError(422, "invalid_proposal", "The proposal format is not supported.")
    claimed_hash = raw.get("baseMembershipSha256")
    if not isinstance(claimed_hash, str) or not SHA256_RE.fullmatch(claimed_hash) or not hmac.compare_digest(claimed_hash, authority.membership_sha256):
        raise GatewayError(409, "stale_base", "The region map changed. Reload the editor and try again.")
    changes = raw.get("changes")
    if not isinstance(changes, list) or not changes:
        raise GatewayError(422, "invalid_proposal", "Choose at least one cell before submitting.")
    if len(changes) > MAX_CHANGES:
        raise GatewayError(413, "payload_too_large", "Choose fewer cells before submitting.")

    requested: dict[str, tuple[str, str]] = {}
    for change in changes:
        if not isinstance(change, dict) or set(change) != {"DGUID", "from", "to"}:
            raise GatewayError(422, "invalid_proposal", "The proposal contains an invalid change.")
        dguid, from_tag, to_tag = change.get("DGUID"), change.get("from"), change.get("to")
        if not isinstance(dguid, str) or not DGUID_RE.fullmatch(dguid) or not isinstance(from_tag, str) or not TAG_RE.fullmatch(from_tag) or not isinstance(to_tag, str) or not TAG_RE.fullmatch(to_tag):
            raise GatewayError(422, "invalid_proposal", "The proposal contains an invalid change.")
        if dguid in requested:
            raise GatewayError(422, "invalid_proposal", "The proposal contains a duplicate cell.")
        requested[dguid] = (from_tag, to_tag)

    provinces: set[str] = set()
    canonical_changes: list[dict[str, str]] = []
    for dguid in sorted(requested):
        row = authority.membership.get(dguid)
        if row is None:
            raise GatewayError(422, "invalid_proposal", "One or more cells no longer exist.")
        from_tag, to_tag = requested[dguid]
        if from_tag != row.leaf_tag:
            raise GatewayError(409, "stale_base", "The region map changed. Reload the editor and try again.")
        if to_tag == from_tag:
            raise GatewayError(422, "invalid_proposal", "The proposal contains a change that has no effect.")
        if to_tag not in authority.leaves or authority.leaf_jurisdictions.get(to_tag) != PR_TO_TAG[row.pruid]:
            raise GatewayError(422, "invalid_proposal", "A target region must belong to the same province or territory.")
        protected = authority.seed_tags.get(dguid)
        if protected and to_tag != protected:
            raise GatewayError(422, "invalid_proposal", "A region anchor cell cannot be moved away from its region.")
        provinces.add(row.pruid)
        canonical_changes.append({"DGUID": dguid, "from": row.leaf_tag, "to": to_tag})
    if len(provinces) != 1:
        raise GatewayError(422, "invalid_proposal", "A proposal may change cells in only one province or territory.")

    submitted_by = _clean_text(raw.get("submittedBy"), 80, required=False)
    reason = _clean_text(raw.get("reason"), 1000, required=True)
    canonical: dict[str, Any] = {
        "schema": PROPOSAL_SCHEMA,
        "baseMembershipSha256": authority.membership_sha256,
        "reason": reason,
        "changes": canonical_changes,
    }
    if submitted_by:
        canonical["submittedBy"] = submitted_by
    # This byte representation is a public browser/server contract.  Do not add
    # a trailing newline or change escaping/separators without a schema bump.
    try:
        payload = json.dumps(
            canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
    except (UnicodeEncodeError, ValueError) as exc:
        raise GatewayError(422, "invalid_proposal", "The proposal contains invalid Unicode.") from exc
    return canonical, payload, _sha256(payload)


def validate_idea(raw: object) -> tuple[dict[str, Any], bytes, str]:
    required_keys = {
        "schema", "category", "experience", "summary", "need", "idea",
        "publicAcknowledged",
    }
    optional_keys = {"region", "context", "followUp"}
    if (
        not isinstance(raw, dict)
        or not required_keys.issubset(raw)
        or set(raw) - required_keys - optional_keys
        or raw.get("schema") != IDEA_SCHEMA
        or raw.get("publicAcknowledged") is not True
    ):
        raise GatewayError(422, "invalid_submission", "The idea format is not supported.")

    category = _clean_idea_text(
        raw.get("category"), 100, required=True, multiline=False
    )
    experience = _clean_idea_text(
        raw.get("experience"), 100, required=True, multiline=False
    )
    if category not in IDEA_CATEGORIES or experience not in IDEA_EXPERIENCE_LEVELS:
        raise GatewayError(422, "invalid_submission", "Choose a valid idea category and experience level.")

    canonical: dict[str, Any] = {
        "schema": IDEA_SCHEMA,
        "category": category,
        "experience": experience,
        "summary": _clean_idea_text(raw.get("summary"), 100, required=True, multiline=False),
        "need": _clean_idea_text(raw.get("need"), 2000, required=True, multiline=True),
        "idea": _clean_idea_text(raw.get("idea"), 2000, required=True, multiline=True),
        "publicAcknowledged": True,
    }
    optional_fields = (
        ("region", 100, False),
        ("context", 2000, True),
        ("followUp", 120, False),
    )
    for name, maximum, multiline in optional_fields:
        if name not in raw:
            continue
        value = _clean_idea_text(raw[name], maximum, required=False, multiline=multiline)
        if value:
            canonical[name] = value
    try:
        payload = _canonical_submission_json(canonical)
    except (UnicodeEncodeError, ValueError) as exc:
        raise GatewayError(422, "invalid_submission", "The idea contains invalid Unicode.") from exc
    return canonical, payload, _sha256(payload)


class JsonTransport(Protocol):
    def request(self, method: str, url: str, headers: Mapping[str, str], body: bytes | None, timeout: float) -> tuple[int, Mapping[str, str], object]: ...


class UrllibJsonTransport:
    def request(self, method: str, url: str, headers: Mapping[str, str], body: bytes | None, timeout: float) -> tuple[int, Mapping[str, str], object]:
        request = urllib.request.Request(url, data=body, headers=dict(headers), method=method)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                raw = response.read(MAX_BODY_BYTES + 1)
                status = response.status
                response_headers = dict(response.headers.items())
        except urllib.error.HTTPError as exc:
            raw = exc.read(MAX_BODY_BYTES + 1)
            status = exc.code
            response_headers = dict(exc.headers.items()) if exc.headers else {}
        except (OSError, TimeoutError) as exc:
            raise UpstreamError() from exc
        if len(raw) > MAX_BODY_BYTES:
            raise UpstreamError()
        try:
            parsed = json.loads(raw.decode("utf-8")) if raw else {}
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise UpstreamError() from exc
        return status, response_headers, parsed


class TurnstileVerifier:
    def __init__(self, transport: JsonTransport, secret: str, hostnames: frozenset[str]):
        self.transport = transport
        self.secret = secret
        self.hostnames = hostnames

    def verify(self, token: str, remote_ip: str) -> None:
        body = urllib.parse.urlencode({"secret": self.secret, "response": token, "remoteip": remote_ip}).encode("ascii")
        status, _, result = self.transport.request(
            "POST", "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "mcc-submission-gateway/1"},
            body, 10.0,
        )
        if status != 200 or not isinstance(result, dict):
            raise UpstreamError("turnstile-unavailable")
        if result.get("success") is not True or result.get("hostname") not in self.hostnames or result.get("action") != TURNSTILE_ACTION:
            raise GatewayError(403, "turnstile_failed", "Human verification failed. Refresh and try again.")


class OpenSSLSigner:
    def __init__(self, private_key_path: Path, executable: str = "openssl"):
        self.private_key_path = private_key_path
        self.executable = executable

    def sign(self, data: bytes) -> bytes:
        try:
            completed = subprocess.run(
                [self.executable, "dgst", "-sha256", "-sign", str(self.private_key_path)],
                input=data, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                check=True, timeout=10,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise UpstreamError("github-auth-failed") from exc
        if not completed.stdout:
            raise UpstreamError("github-auth-failed")
        return completed.stdout


class ProposalLedger:
    """Durable fail-closed idempotency state shared through a SQLite file."""

    def __init__(self, path: Path):
        self.path = path
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            with self._connect() as connection:
                connection.execute("PRAGMA journal_mode=WAL")
                connection.execute("PRAGMA synchronous=FULL")
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS proposals (
                        proposal_sha256 TEXT PRIMARY KEY,
                        state TEXT NOT NULL CHECK (state IN ('pending', 'created')),
                        issue_number INTEGER,
                        issue_url TEXT,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL,
                        CHECK (
                            (state = 'pending' AND issue_number IS NULL AND issue_url IS NULL)
                            OR
                            (state = 'created' AND issue_number IS NOT NULL AND issue_url IS NOT NULL)
                        )
                    )
                    """
                )
        except sqlite3.Error as exc:
            raise RuntimeError("the proposal ledger cannot be initialized") from exc

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout=10000")
        try:
            yield connection
        finally:
            connection.close()

    def lookup(self, proposal_hash: str) -> dict[str, Any] | None:
        try:
            with self._connect() as connection:
                row = connection.execute(
                    "SELECT state, issue_number, issue_url FROM proposals WHERE proposal_sha256 = ?",
                    (proposal_hash,),
                ).fetchone()
        except sqlite3.Error as exc:
            raise UpstreamError("ledger_failed") from exc
        return dict(row) if row else None

    def insert_pending(self, proposal_hash: str, now: int) -> bool:
        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    "INSERT OR IGNORE INTO proposals "
                    "(proposal_sha256, state, issue_number, issue_url, created_at, updated_at) "
                    "VALUES (?, 'pending', NULL, NULL, ?, ?)",
                    (proposal_hash, now, now),
                )
                return cursor.rowcount == 1
        except sqlite3.Error as exc:
            raise UpstreamError("ledger_failed") from exc

    def mark_created(self, proposal_hash: str, issue_number: int, issue_url: str, now: int) -> None:
        try:
            with self._connect() as connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT state, issue_number, issue_url FROM proposals WHERE proposal_sha256 = ?",
                    (proposal_hash,),
                ).fetchone()
                if row and row["state"] == "created" and (
                    int(row["issue_number"]) != issue_number or row["issue_url"] != issue_url
                ):
                    raise UpstreamError("ledger_conflict")
                if row:
                    connection.execute(
                        "UPDATE proposals SET state='created', issue_number=?, issue_url=?, updated_at=? "
                        "WHERE proposal_sha256=?",
                        (issue_number, issue_url, now, proposal_hash),
                    )
                else:
                    connection.execute(
                        "INSERT INTO proposals "
                        "(proposal_sha256, state, issue_number, issue_url, created_at, updated_at) "
                        "VALUES (?, 'created', ?, ?, ?, ?)",
                        (proposal_hash, issue_number, issue_url, now, now),
                    )
                connection.commit()
        except UpstreamError:
            raise
        except sqlite3.Error as exc:
            raise UpstreamError("ledger_failed") from exc

    def delete_pending(self, proposal_hash: str) -> bool:
        """Remove only an unresolved row; a created record is never deleted."""
        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    "DELETE FROM proposals WHERE proposal_sha256 = ? AND state = 'pending'",
                    (proposal_hash,),
                )
                return cursor.rowcount == 1
        except sqlite3.Error as exc:
            raise UpstreamError("ledger_failed") from exc


class GitHubAppClient:
    def __init__(
        self, transport: JsonTransport, signer: OpenSSLSigner, client_id: str,
        installation_id: int, ledger: ProposalLedger, *, now: Callable[[], float] = time.time,
        sleep: Callable[[float], None] = time.sleep,
    ):
        self.transport = transport
        self.signer = signer
        self.client_id = client_id
        self.installation_id = installation_id
        self.ledger = ledger
        self.now = now
        self.sleep = sleep
        self._token = ""
        self._token_expires = 0.0
        self._token_lock = threading.Lock()
        self._mutation_lock = threading.Lock()
        self._blocked_until = 0.0
        self.api = "https://api.github.com"

    def _jwt(self) -> str:
        now = int(self.now())
        header = _b64url(_canonical_json({"alg": "RS256", "typ": "JWT"}).rstrip(b"\n"))
        payload = _b64url(_canonical_json({"iat": now - 60, "exp": now + 540, "iss": self.client_id}).rstrip(b"\n"))
        signing_input = f"{header}.{payload}".encode("ascii")
        return f"{header}.{payload}.{_b64url(self.signer.sign(signing_input))}"

    def _installation_token(self) -> str:
        if self._token and self.now() < self._token_expires - 60:
            return self._token
        with self._token_lock:
            if self._token and self.now() < self._token_expires - 60:
                return self._token
            body = _canonical_json({"repositories": [GITHUB_REPO], "permissions": {"issues": "write"}})
            status, _, result = self.transport.request(
                "POST", f"{self.api}/app/installations/{self.installation_id}/access_tokens",
                self._headers(self._jwt()), body, 15.0,
            )
            if status != 201 or not isinstance(result, dict) or not isinstance(result.get("token"), str):
                raise UpstreamError("github-auth-failed")
            permissions = result.get("permissions")
            repositories = result.get("repositories")
            names = {repo.get("full_name") for repo in repositories} if isinstance(repositories, list) and all(isinstance(repo, dict) for repo in repositories) else set()
            allowed_permissions = {"issues": "write", "metadata": "read"}
            if (
                not isinstance(permissions, dict)
                or permissions.get("issues") != "write"
                or any(allowed_permissions.get(name) != access for name, access in permissions.items())
                or names != {GITHUB_FULL_NAME}
            ):
                raise UpstreamError("github-auth-scope-invalid")
            expiry = result.get("expires_at")
            try:
                parsed_expiry = datetime.fromisoformat(str(expiry).replace("Z", "+00:00")).timestamp()
            except (TypeError, ValueError) as exc:
                raise UpstreamError("github-auth-failed") from exc
            self._token = result["token"]
            self._token_expires = parsed_expiry
            return self._token

    @staticmethod
    def _headers(token: str) -> dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
            "User-Agent": "mcc-submission-gateway/1",
            "Content-Type": "application/json",
        }

    def _call(
        self, method: str, path: str, body: object | None = None,
        *, return_definitive_client_error: bool = False,
    ) -> tuple[int, Mapping[str, str], object]:
        if self.now() < self._blocked_until:
            raise UpstreamError("github-rate-limited")
        token = self._installation_token()
        encoded = _canonical_json(body) if body is not None else None
        status, headers, result = self.transport.request(method, f"{self.api}{path}", self._headers(token), encoded, 20.0)
        if status in {429, 502, 503, 504} or status == 403 and ("Retry-After" in headers or str(headers.get("X-RateLimit-Remaining", "")) == "0"):
            try:
                retry_after = max(1, min(3600, int(headers.get("Retry-After", "60"))))
            except (TypeError, ValueError):
                retry_after = 60
            self._blocked_until = max(self._blocked_until, self.now() + retry_after)
            if return_definitive_client_error and 400 <= status < 500:
                return status, headers, result
            raise UpstreamError("github-rate-limited")
        return status, headers, result

    def _submission_signature(self, schema: str, submission_hash: str) -> str:
        message = f"mcc-submission/v1:{schema}:{submission_hash}".encode("ascii")
        return _b64url(self.signer.sign(message))

    def _find_issue(self, schema: str, submission_hash: str, submission_signature: str) -> dict[str, Any] | None:
        schema_marker = f"submission-schema:{schema}"
        marker = f"submission-sha256:{submission_hash}"
        signature_marker = f"submission-signature-rs256:{submission_signature}"
        query = urllib.parse.urlencode({"q": f'repo:{GITHUB_FULL_NAME} is:issue in:body "{marker}"', "per_page": "10"})
        status, _, result = self._call("GET", f"/search/issues?{query}")
        if status != 200 or not isinstance(result, dict) or not isinstance(result.get("items"), list):
            raise UpstreamError()
        for issue in result["items"]:
            body = str(issue.get("body", "")) if isinstance(issue, dict) else ""
            if (
                isinstance(issue, dict)
                and schema_marker in body
                and marker in body
                and signature_marker in body
                and _is_int(issue.get("number"))
            ):
                return issue
        return None

    def submit(self, canonical: dict[str, Any], canonical_bytes: bytes, proposal_hash: str) -> dict[str, Any]:
        with self._mutation_lock:
            schema = canonical.get("schema")
            if schema not in {PROPOSAL_SCHEMA, IDEA_SCHEMA}:
                raise UpstreamError("unsupported_submission_schema")
            submission_signature = self._submission_signature(schema, proposal_hash)
            title, issue_body, chunked = build_issue(
                canonical, canonical_bytes, proposal_hash, submission_signature
            )
            entry = self.ledger.lookup(proposal_hash)
            issue: dict[str, Any] | None = None
            duplicate = entry is not None
            if entry and entry["state"] == "created":
                issue = {"number": entry["issue_number"], "html_url": entry["issue_url"]}
            elif entry and entry["state"] == "pending":
                issue = self._find_issue(schema, proposal_hash, submission_signature)
                if issue is None:
                    # A prior create may have succeeded just before a crash and
                    # GitHub search is eventually consistent.  Never create a
                    # second issue from an unresolved pending record.
                    raise GatewayError(
                        503, "service_unavailable",
                        "This submission is still being recorded. Try again shortly.",
                    )
                self._record_issue(proposal_hash, issue)
            else:
                issue = self._find_issue(schema, proposal_hash, submission_signature)
                if issue is not None:
                    duplicate = True
                    self._record_issue(proposal_hash, issue)
            if issue is None:
                if not self.ledger.insert_pending(proposal_hash, int(self.now())):
                    raise GatewayError(
                        503, "service_unavailable",
                        "This submission is still being recorded. Try again shortly.",
                    )
                status, _, result = self._call(
                    "POST", f"/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues",
                    {
                        "title": title,
                        "body": issue_body,
                        "labels": [GITHUB_LABEL]
                        + ([BOUNDARY_UPDATE_LABEL] if schema == PROPOSAL_SCHEMA else []),
                    },
                    return_definitive_client_error=True,
                )
                if status != 201 or not isinstance(result, dict) or not _is_int(result.get("number")):
                    if 400 <= status < 500:
                        # A completed 4xx response proves GitHub rejected the
                        # create. Clearing only `pending` makes a later retry
                        # safe. Network errors, 5xx, crashes, and unexpected
                        # success statuses remain fail-closed.
                        self.ledger.delete_pending(proposal_hash)
                    raise UpstreamError()
                issue = result
                # Persist immediately after GitHub confirms creation, before any
                # optional comment writes.  Retries can then resume safely.
                self._record_issue(proposal_hash, issue)
            if chunked:
                self._resume_chunks(
                    int(issue["number"]), canonical_bytes, proposal_hash,
                    delay_before_first=not duplicate,
                )
            issue_url = issue.get("html_url")
            if not _valid_issue_url(issue_url, int(issue["number"])):
                raise UpstreamError()
            return {
                "ok": True,
                "issueNumber": int(issue["number"]),
                "issueUrl": issue_url,
                "submissionSha256": proposal_hash,
                "duplicate": duplicate,
            }

    def _record_issue(self, proposal_hash: str, issue: Mapping[str, Any]) -> None:
        number = issue.get("number")
        issue_url = issue.get("html_url")
        if not _is_int(number) or not _valid_issue_url(issue_url, int(number)):
            raise UpstreamError()
        self.ledger.mark_created(proposal_hash, int(number), issue_url, int(self.now()))

    def _resume_chunks(
        self, issue_number: int, canonical_bytes: bytes, proposal_hash: str,
        *, delay_before_first: bool,
    ) -> None:
        compressed = gzip.compress(canonical_bytes, compresslevel=9, mtime=0)
        encoded = _b64url(compressed)
        chunks = [encoded[i:i + COMMENT_CHUNK_CHARS] for i in range(0, len(encoded), COMMENT_CHUNK_CHARS)]
        if not chunks or len(chunks) > MAX_COMMENTS:
            raise UpstreamError("proposal-payload-too-large")
        expected_bodies = {
            index: build_chunk_comment(proposal_hash, index, len(chunks), chunk)
            for index, chunk in enumerate(chunks, 1)
        }
        existing: set[int] = set()
        page = 1
        while True:
            status, _, result = self._call(
                "GET", f"/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues/{issue_number}/comments?per_page={COMMENTS_PAGE_SIZE}&page={page}"
            )
            if status != 200 or not isinstance(result, list):
                raise UpstreamError()
            for comment in result:
                body = str(comment.get("body", "")) if isinstance(comment, dict) else ""
                match = CHUNK_MARKER_RE.search(body)
                if match and match.group(1) == proposal_hash and int(match.group(3)) == len(chunks):
                    index = int(match.group(2))
                    if expected_bodies.get(index) == body:
                        existing.add(index)
            if len(result) < COMMENTS_PAGE_SIZE:
                break
            page += 1
            if page > MAX_COMMENT_PAGES:
                raise UpstreamError()
        posted = False
        for index, chunk in enumerate(chunks, 1):
            if index in existing:
                continue
            if posted or delay_before_first:
                self.sleep(1.0)
                delay_before_first = False
            body = expected_bodies[index]
            status, _, result = self._call(
                "POST", f"/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues/{issue_number}/comments", {"body": body}
            )
            if status != 201 or not isinstance(result, dict):
                raise UpstreamError()
            posted = True


def build_chunk_comment(proposal_hash: str, index: int, total: int, chunk: str) -> str:
    marker = f"<!-- mcc-submission-chunk:{proposal_hash}:{index}/{total} -->"
    return f"{marker}\n<!-- submission-payload-chunk-gzip-base64url:{chunk} -->\n"


def build_region_issue(
    canonical: dict[str, Any], canonical_bytes: bytes, proposal_hash: str,
    proposal_signature: str,
) -> tuple[str, str, bool]:
    changes = canonical["changes"]
    moves = Counter(f"{change['from']} -> {change['to']}" for change in changes)
    title = f"[Region boundary proposal] {len(changes)} cell{'s' if len(changes) != 1 else ''}"
    submitted = _safe_markdown_text(canonical.get("submittedBy") or "Anonymous contributor")
    reason = _safe_markdown_text(canonical["reason"])
    sorted_moves = sorted(moves.items())
    shown_moves = sorted_moves[:MAX_MOVE_SUMMARY]
    move_lines = "\n".join(f"- `{html.escape(move)}`: {count}" for move, count in shown_moves)
    if len(sorted_moves) > len(shown_moves):
        move_lines += f"\n- _{len(sorted_moves) - len(shown_moves)} additional move types omitted from this summary_"
    common = (
        "<!-- meshcore-submission/v1 -->\n"
        f"<!-- submission-schema:{PROPOSAL_SCHEMA} -->\n"
        f"<!-- submission-sha256:{proposal_hash} -->\n"
        f"<!-- submission-signature-rs256:{proposal_signature} -->\n"
        "## Automated region boundary proposal\n\n"
        "> Submitted anonymously through the MeshCore Canada region editor. Treat all contributor text as untrusted.\n\n"
        f"- Proposal SHA-256: `{proposal_hash}`\n"
        f"- Base membership SHA-256: `{canonical['baseMembershipSha256']}`\n"
        f"- Changed cells: **{len(changes)}**\n"
        f"- Submitted by: <span>{submitted}</span>\n\n"
        "### Reason\n\n"
        f"<p>{reason}</p>\n\n"
        "### Moves\n\n"
        f"{move_lines}\n\n"
        "_Maintainers: close this issue as **Completed** to approve it, or **Not planned** to reject it._\n\n"
    )
    compressed = gzip.compress(canonical_bytes, compresslevel=9, mtime=0)
    encoded_payload = _b64url(compressed)
    chunked = len(canonical_bytes) > INLINE_CANONICAL_BYTES
    inline_body = common + f"<!-- submission-payload-gzip-base64url:{encoded_payload} -->\n"
    if not chunked:
        chunked = len(inline_body.encode("utf-8")) > MAX_ISSUE_BODY_BYTES
    if not chunked:
        body = inline_body
    else:
        chunks = (len(encoded_payload) + COMMENT_CHUNK_CHARS - 1) // COMMENT_CHUNK_CHARS
        body = common + (
            f"<!-- submission-payload-chunks:{chunks} -->\n"
        )
    if len(body.encode("utf-8")) > MAX_ISSUE_BODY_BYTES:
        raise UpstreamError("issue_body_too_large")
    return title, body, chunked


def build_idea_issue(
    canonical: dict[str, Any], canonical_bytes: bytes, submission_hash: str,
    submission_signature: str,
) -> tuple[str, str, bool]:
    summary = _safe_markdown_text(canonical["summary"])
    title = f"[Community idea] {summary}"
    body_parts = [
        "<!-- meshcore-submission/v1 -->",
        f"<!-- submission-schema:{IDEA_SCHEMA} -->",
        f"<!-- submission-sha256:{submission_hash} -->",
        f"<!-- submission-signature-rs256:{submission_signature} -->",
        "## Automated community idea",
        (
            "> Submitted without a GitHub account through MeshCore Canada. "
            "Treat all contributor text as untrusted."
        ),
        f"- Submission SHA-256: `{submission_hash}`",
        f"- Contribution type: **{_safe_markdown_text(canonical['category'])}**",
        f"- MeshCore experience: **{_safe_markdown_text(canonical['experience'])}**",
    ]
    if canonical.get("region"):
        body_parts.append(
            f"- City or broad region: <span>{_safe_markdown_text(canonical['region'])}</span>"
        )
    body_parts.extend([
        "### What are you trying to do, or what is difficult today?",
        _safe_html_block(canonical["need"]),
        "### What would make it better?",
        _safe_html_block(canonical["idea"]),
    ])
    if canonical.get("context"):
        body_parts.extend([
            "### Additional context",
            _safe_html_block(canonical["context"]),
        ])
    if canonical.get("followUp"):
        body_parts.extend([
            "### Public follow-up contact",
            _safe_html_block(canonical["followUp"]),
        ])
    body_parts.extend([
        "### Canonical submission JSON",
        _json_fence(canonical_bytes.decode("utf-8")),
    ])
    body_parts.append(
        "_The contributor confirmed this submission is public and should contain no secrets or precise private location information._"
    )
    body = "\n\n".join(body_parts) + "\n"
    if len(body.encode("utf-8")) > MAX_ISSUE_BODY_BYTES:
        raise UpstreamError("issue_body_too_large")
    return title, body, False


def build_issue(
    canonical: dict[str, Any], canonical_bytes: bytes, submission_hash: str,
    submission_signature: str,
) -> tuple[str, str, bool]:
    if canonical.get("schema") == PROPOSAL_SCHEMA:
        return build_region_issue(canonical, canonical_bytes, submission_hash, submission_signature)
    if canonical.get("schema") == IDEA_SCHEMA:
        return build_idea_issue(canonical, canonical_bytes, submission_hash, submission_signature)
    raise UpstreamError("unsupported_submission_schema")


class RateLimiter:
    def __init__(
        self, limit: int, window_seconds: int, *, now: Callable[[], float] = time.monotonic,
        max_keys: int = 10_000,
    ):
        self.limit = limit
        self.window = window_seconds
        self.now = now
        self.max_keys = max_keys
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()
        self._checks = 0

    def _sweep(self, current: float) -> None:
        expired = []
        for key, events in self._events.items():
            while events and events[0] <= current - self.window:
                events.popleft()
            if not events:
                expired.append(key)
        for key in expired:
            self._events.pop(key, None)

    def check(self, key: str) -> None:
        current = self.now()
        with self._lock:
            self._checks += 1
            if self._checks % 256 == 0:
                self._sweep(current)
            events = self._events.get(key)
            if events is None:
                if len(self._events) >= self.max_keys:
                    self._sweep(current)
                if len(self._events) >= self.max_keys:
                    raise GatewayError(
                        429, "rate_limited",
                        "Too many proposals were attempted. Try again later.",
                        retry_after=self.window,
                    )
                events = deque()
                self._events[key] = events
            while events and events[0] <= current - self.window:
                events.popleft()
            if len(events) >= self.limit:
                retry = max(1, int(events[0] + self.window - current) + 1)
                raise GatewayError(429, "rate_limited", "Too many proposals were attempted. Try again later.", retry_after=retry)
            events.append(current)


@dataclass(frozen=True)
class GatewayConfig:
    base_path: str
    turnstile_site_key: str
    allowed_origins: frozenset[str]
    trusted_proxy_networks: tuple[ipaddress.IPv4Network | ipaddress.IPv6Network, ...]


class GatewayService:
    def __init__(
        self, config: GatewayConfig, authority: AuthorityCache,
        turnstile: TurnstileVerifier, github: GitHubAppClient, rate_limiter: RateLimiter,
        pre_rate_limiter: RateLimiter | None = None,
        global_pre_limiter: RateLimiter | None = None,
    ):
        self.config = config
        self.authority = authority
        self.turnstile = turnstile
        self.github = github
        self.rate_limiter = rate_limiter
        self.pre_rate_limiter = pre_rate_limiter
        self.global_pre_limiter = global_pre_limiter
        self._ip_salt = secrets.token_bytes(32)

    def client_ip(self, peer: str, forwarded_for: str | None) -> str:
        try:
            peer_ip = ipaddress.ip_address(peer)
        except ValueError:
            raise GatewayError(400, "invalid_proposal", "The request could not be accepted.")
        trusted = any(peer_ip in network for network in self.config.trusted_proxy_networks)
        if trusted and forwarded_for:
            candidates = [part.strip() for part in forwarded_for.split(",")]
            if len(candidates) != 1:
                raise GatewayError(400, "invalid_proposal", "The request could not be accepted.")
            try:
                addresses = [ipaddress.ip_address(part) for part in candidates]
            except ValueError:
                raise GatewayError(400, "invalid_proposal", "The request could not be accepted.")
            if not addresses:
                raise GatewayError(400, "invalid_proposal", "The request could not be accepted.")
            return str(addresses[0])
        return str(peer_ip)

    def submit(self, envelope: object, client_ip: str) -> dict[str, Any]:
        if (
            not isinstance(envelope, dict)
            or set(envelope) != {"version", "submission", "turnstileToken", "website"}
            or not _is_int(envelope.get("version"))
            or envelope.get("version") != API_VERSION
        ):
            raise GatewayError(400, "invalid_submission", "The request format is not supported.")
        if not isinstance(envelope.get("website"), str) or envelope["website"]:
            raise GatewayError(400, "invalid_submission", "The request could not be accepted.")
        submission = envelope.get("submission")
        if not isinstance(submission, dict) or submission.get("schema") not in {PROPOSAL_SCHEMA, IDEA_SCHEMA}:
            raise GatewayError(422, "invalid_submission", "The submission format is not supported.")
        token = envelope.get("turnstileToken")
        if not isinstance(token, str) or not token or len(token) > MAX_TURNSTILE_TOKEN:
            raise GatewayError(400, "turnstile_failed", "Human verification is required.")
        rate_key = hmac.new(self._ip_salt, client_ip.encode("ascii"), hashlib.sha256).hexdigest()
        # Higher pre-verification bounds prevent forged Origin requests from
        # turning the service into an unlimited Siteverify client. They are kept
        # separate from the low verified-submission quota below.
        if self.pre_rate_limiter:
            self.pre_rate_limiter.check(rate_key)
        if self.global_pre_limiter:
            self.global_pre_limiter.check("global")
        self.turnstile.verify(token, client_ip)
        self.rate_limiter.check(rate_key)
        if submission["schema"] == IDEA_SCHEMA:
            canonical, payload, submission_hash = validate_idea(submission)
        else:
            try:
                authority = self.authority.get()
            except RuntimeError as exc:
                raise GatewayError(
                    503, "service_unavailable", "Region data is being updated. Try again shortly."
                ) from exc
            canonical, payload, submission_hash = validate_proposal(submission, authority)
        return self.github.submit(canonical, payload, submission_hash)


class GatewayHandler(BaseHTTPRequestHandler):
    server_version = "MCCSubmissionGateway/1"
    protocol_version = "HTTP/1.1"

    def setup(self) -> None:
        super().setup()
        self.connection.settimeout(15.0)

    @property
    def service(self) -> GatewayService:
        return self.server.service  # type: ignore[attr-defined]

    def log_message(self, _format: str, *_args: object) -> None:
        # BaseHTTPRequestHandler includes client IP and raw path; never emit it.
        return

    def _origin(self) -> str | None:
        return self.headers.get("Origin")

    def _allowed_origin(self) -> str | None:
        origin = self._origin()
        return origin if origin in self.service.config.allowed_origins else None

    def _route(self) -> str:
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.query or parsed.fragment:
            return "unknown"
        if parsed.path == self.service.config.base_path:
            return "submit"
        if parsed.path == self.service.config.base_path + "/config":
            return "config"
        if parsed.path == "/healthz":
            return "health"
        return "unknown"

    def _send(self, status: int, value: object | None, *, cors: bool = False, retry_after: int | None = None) -> None:
        payload = b"" if value is None else _canonical_json(value)
        self.send_response(status)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Connection", "close")
        self.close_connection = True
        if payload:
            self.send_header("Content-Type", "application/json; charset=utf-8")
        if cors:
            origin = self._allowed_origin()
            if origin:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
        if retry_after is not None:
            self.send_header("Retry-After", str(retry_after))
        self.end_headers()
        if payload and self.command != "HEAD":
            self.wfile.write(payload)

    def _error(self, error: GatewayError, *, cors: bool) -> None:
        self._send(error.status, {"ok": False, "error": {"code": error.code, "message": error.message}}, cors=cors, retry_after=error.retry_after)

    def do_OPTIONS(self) -> None:
        if self._route() != "submit" or not self._allowed_origin():
            self._error(GatewayError(403, "invalid_submission", "This site is not allowed to send submissions."), cors=False)
            return
        requested_method = self.headers.get("Access-Control-Request-Method", "")
        requested_headers = {item.strip().lower() for item in self.headers.get("Access-Control-Request-Headers", "").split(",") if item.strip()}
        if requested_method != "POST" or not requested_headers.issubset({"content-type"}):
            self._error(GatewayError(400, "invalid_submission", "The browser preflight was not accepted."), cors=True)
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.send_header("Access-Control-Allow-Origin", self._allowed_origin())
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.send_header("Connection", "close")
        self.close_connection = True
        self.end_headers()

    def do_GET(self) -> None:
        route = self._route()
        if route == "health":
            self._send(200, {"ok": True})
            return
        if route != "config":
            self._error(GatewayError(404, "invalid_submission", "The requested endpoint does not exist."), cors=False)
            return
        origin = self._origin()
        if origin is not None and not self._allowed_origin():
            self._error(GatewayError(403, "invalid_submission", "This site is not allowed to use the submission service."), cors=False)
            return
        self._send(
            200,
            {"version": API_VERSION, "turnstileSiteKey": self.service.config.turnstile_site_key, "turnstileAction": TURNSTILE_ACTION},
            cors=origin is not None,
        )

    def do_POST(self) -> None:
        cors = self._route() == "submit" and self._allowed_origin() is not None
        try:
            if self._route() != "submit":
                raise GatewayError(404, "invalid_submission", "The requested endpoint does not exist.")
            if not cors:
                raise GatewayError(403, "invalid_submission", "This site is not allowed to send submissions.")
            if self.headers.get("Transfer-Encoding"):
                raise GatewayError(411, "invalid_submission", "A fixed request length is required.")
            content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if content_type != "application/json":
                raise GatewayError(415, "invalid_submission", "Send the submission as JSON.")
            length_value = self.headers.get("Content-Length")
            try:
                length = int(length_value or "")
            except ValueError:
                raise GatewayError(411, "invalid_submission", "A fixed request length is required.")
            if length <= 0 or length > MAX_BODY_BYTES:
                raise GatewayError(413, "payload_too_large", "The submission request is too large.")
            body = self.rfile.read(length)
            if len(body) != length:
                raise GatewayError(400, "invalid_submission", "The request body was incomplete.")
            try:
                envelope = json.loads(
                    body.decode("utf-8"),
                    object_pairs_hook=_strict_json_object,
                    parse_constant=_reject_json_constant,
                )
            except (UnicodeError, json.JSONDecodeError, ValueError):
                raise GatewayError(400, "invalid_submission", "The request body is not valid JSON.")
            client_ip = self.service.client_ip(self.client_address[0], self.headers.get("X-Forwarded-For"))
            result = self.service.submit(envelope, client_ip)
            self._send(200, result, cors=True)
        except GatewayError as error:
            self._error(error, cors=cors)
        except Exception:
            # Do not log exception values: transports or parsers may hold secrets
            # or user content.  Operators get a request ID/status from Caddy.
            self._error(GatewayError(500, "service_unavailable", "The submission could not be sent right now."), cors=cors)


class SafeThreadingHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, server_address: tuple[str, int], handler: type[BaseHTTPRequestHandler], *, max_workers: int = 32):
        super().__init__(server_address, handler)
        self._worker_slots = threading.BoundedSemaphore(max_workers)

    def process_request(self, request: object, client_address: object) -> None:
        if not self._worker_slots.acquire(blocking=False):
            try:
                request.close()  # type: ignore[attr-defined]
            except OSError:
                pass
            return
        try:
            super().process_request(request, client_address)
        except Exception:
            self._worker_slots.release()
            raise

    def process_request_thread(self, request: object, client_address: object) -> None:
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._worker_slots.release()

    def handle_error(self, _request: object, _client_address: object) -> None:
        # Suppress stdlib traceback/client-address logging.
        return


def parse_origins(value: str) -> frozenset[str]:
    origins: set[str] = set()
    for item in value.split(","):
        origin = item.strip()
        if not origin:
            continue
        parsed = urllib.parse.urlsplit(origin)
        if parsed.scheme not in {"https", "http"} or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username or parsed.password or origin.endswith("/"):
            raise RuntimeError("ALLOWED_ORIGINS contains an invalid exact origin")
        origins.add(origin)
    if not origins or "*" in origins:
        raise RuntimeError("ALLOWED_ORIGINS must be a non-empty exact allowlist")
    return frozenset(origins)


def parse_hostnames(value: str) -> frozenset[str]:
    hosts = frozenset(item.strip().lower() for item in value.split(",") if item.strip())
    if not hosts or any("/" in host or ":" in host or "*" in host for host in hosts):
        raise RuntimeError("TURNSTILE_EXPECTED_HOSTNAMES must be an exact hostname allowlist")
    return hosts


def parse_networks(value: str) -> tuple[ipaddress.IPv4Network | ipaddress.IPv6Network, ...]:
    try:
        networks = tuple(ipaddress.ip_network(item.strip(), strict=False) for item in value.split(",") if item.strip())
    except ValueError as exc:
        raise RuntimeError("TRUSTED_PROXY_CIDRS is invalid") from exc
    allowed_parents = (
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("fc00::/7"),
        ipaddress.ip_network("::1/128"),
    )
    if any(
        not any(network.version == parent.version and network.subnet_of(parent) for parent in allowed_parents)
        for network in networks
    ):
        raise RuntimeError("TRUSTED_PROXY_CIDRS may contain only private or loopback networks")
    return networks


def build_server_from_env(environ: Mapping[str, str] = os.environ) -> SafeThreadingHTTPServer:
    required = [
        "ALLOWED_ORIGINS", "TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_FILE",
        "TURNSTILE_EXPECTED_HOSTNAMES", "GITHUB_APP_CLIENT_ID",
        "GITHUB_APP_INSTALLATION_ID", "GITHUB_APP_PRIVATE_KEY_FILE",
    ]
    missing = [name for name in required if not environ.get(name)]
    if missing:
        raise RuntimeError("required gateway configuration is missing")
    base_path = environ.get("BASE_PATH", DEFAULT_BASE_PATH)
    if not base_path.startswith("/") or base_path.endswith("/") or "?" in base_path or "#" in base_path:
        raise RuntimeError("BASE_PATH is invalid")
    turnstile_secret = read_secret_file(Path(environ["TURNSTILE_SECRET_FILE"]), maximum=4096)
    private_key_path = Path(environ["GITHUB_APP_PRIVATE_KEY_FILE"])
    read_secret_file(private_key_path, maximum=64 * 1024, pem=True)
    try:
        installation_id = int(environ["GITHUB_APP_INSTALLATION_ID"])
        port = int(environ.get("PORT", "8787"))
        rate_limit = int(environ.get("RATE_LIMIT", "5"))
        rate_window = int(environ.get("RATE_WINDOW_SECONDS", "3600"))
        max_workers = int(environ.get("MAX_WORKERS", "32"))
        pre_rate_limit = int(environ.get("PRE_RATE_LIMIT", "30"))
        pre_rate_window = int(environ.get("PRE_RATE_WINDOW_SECONDS", "300"))
        global_pre_limit = int(environ.get("GLOBAL_PRE_RATE_LIMIT", "300"))
        global_pre_window = int(environ.get("GLOBAL_PRE_RATE_WINDOW_SECONDS", "60"))
    except ValueError as exc:
        raise RuntimeError("a numeric gateway setting is invalid") from exc
    if (
        installation_id <= 0 or not 1 <= port <= 65535 or rate_limit <= 0
        or rate_window <= 0 or not 1 <= max_workers <= 128
        or pre_rate_limit <= 0 or pre_rate_window <= 0
        or global_pre_limit <= 0 or global_pre_window <= 0
    ):
        raise RuntimeError("a numeric gateway setting is out of range")
    authority = AuthorityCache(
        Path(environ.get("MEMBERSHIP_PATH", "/data/canada-region-membership.csv")),
        Path(environ.get("CATALOG_PATH", "/data/canada-regions.json")),
        Path(environ.get("CELLS_DIR", "/data/cells")),
    )
    transport = UrllibJsonTransport()
    service = GatewayService(
        GatewayConfig(
            base_path=base_path,
            turnstile_site_key=environ["TURNSTILE_SITE_KEY"],
            allowed_origins=parse_origins(environ["ALLOWED_ORIGINS"]),
            trusted_proxy_networks=parse_networks(environ.get("TRUSTED_PROXY_CIDRS", "")),
        ),
        authority,
        TurnstileVerifier(transport, turnstile_secret, parse_hostnames(environ["TURNSTILE_EXPECTED_HOSTNAMES"])),
        GitHubAppClient(
            transport,
            OpenSSLSigner(private_key_path, environ.get("OPENSSL_BIN", "openssl")),
            environ["GITHUB_APP_CLIENT_ID"], installation_id,
            ProposalLedger(Path(environ.get("LEDGER_PATH", "/state/submissions.sqlite3"))),
        ),
        RateLimiter(rate_limit, rate_window),
        RateLimiter(pre_rate_limit, pre_rate_window),
        RateLimiter(global_pre_limit, global_pre_window, max_keys=1),
    )
    server = SafeThreadingHTTPServer(
        (environ.get("LISTEN_HOST", "0.0.0.0"), port), GatewayHandler,
        max_workers=max_workers,
    )
    server.service = service  # type: ignore[attr-defined]
    return server


def main() -> None:
    server = build_server_from_env()
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
