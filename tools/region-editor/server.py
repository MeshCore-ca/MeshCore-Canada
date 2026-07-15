#!/usr/bin/env python3
"""Authenticated, read-only MeshCore Canada region proposal editor.

The process intentionally has no endpoint that writes to the catalog, membership,
partition, or editor-cell files.  It validates a proposed change set against the
current membership and returns a canonical JSON download for normal review.
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
import mimetypes
import os
import re
import secrets
import stat
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import parse_qs, urlsplit


APP_DIR = Path(__file__).resolve().parent


def _default_repo_root(app_dir: Path) -> Path:
    """Find the checkout root without assuming the container has two parents."""
    return app_dir.parents[1] if len(app_dir.parents) > 1 else app_dir


REPO_ROOT = _default_repo_root(APP_DIR)
PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v1"
PRUID_RE = re.compile(r"^[0-9]{2}$")
TAG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
DGUID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
MAX_FORM_BYTES = 64 * 1024
MAX_PROPOSAL_BYTES = 2 * 1024 * 1024
MAX_PROPOSAL_CHANGES = 25_000


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _normalise_base_path(value: str) -> str:
    value = "/" + value.strip("/")
    return "" if value == "/" else value


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _clean_text(value: Any, max_length: int) -> str:
    if not isinstance(value, str):
        return ""
    value = " ".join(value.strip().split())
    if len(value) > max_length or any(ord(char) < 32 for char in value):
        return ""
    return value


@dataclass(frozen=True)
class Config:
    bind: str
    port: int
    base_path: str
    asset_dir: Path
    cell_dir: Path
    auth_file: Path
    secure_cookie: bool = True
    trusted_proxy: bool = False
    session_seconds: int = 8 * 60 * 60
    login_window_seconds: int = 5 * 60
    login_attempts: int = 5
    export_window_seconds: int = 60
    export_attempts: int = 20

    @classmethod
    def from_environment(cls) -> "Config":
        auth_value = os.environ.get("MCC_EDITOR_AUTH_FILE", "")
        if not auth_value:
            raise RuntimeError("MCC_EDITOR_AUTH_FILE must point to a mounted secret file")
        return cls(
            bind=os.environ.get("MCC_EDITOR_BIND", "0.0.0.0"),
            port=int(os.environ.get("MCC_EDITOR_PORT", "8080")),
            base_path=_normalise_base_path(os.environ.get("MCC_EDITOR_BASE_PATH", "/admin")),
            asset_dir=Path(
                os.environ.get("MCC_REGION_ASSET_DIR", str(REPO_ROOT / "docs" / "assets" / "regions"))
            ).resolve(),
            cell_dir=Path(
                os.environ.get("MCC_REGION_CELL_DIR", str(APP_DIR / "data" / "cells"))
            ).resolve(),
            auth_file=Path(auth_value).resolve(),
            secure_cookie=_env_bool("MCC_EDITOR_SECURE_COOKIE", True),
            trusted_proxy=_env_bool("MCC_EDITOR_TRUSTED_PROXY", False),
            session_seconds=int(os.environ.get("MCC_EDITOR_SESSION_SECONDS", str(8 * 60 * 60))),
            login_window_seconds=int(os.environ.get("MCC_EDITOR_LOGIN_WINDOW_SECONDS", str(5 * 60))),
            login_attempts=int(os.environ.get("MCC_EDITOR_LOGIN_ATTEMPTS", "5")),
            export_window_seconds=int(os.environ.get("MCC_EDITOR_EXPORT_WINDOW_SECONDS", "60")),
            export_attempts=int(os.environ.get("MCC_EDITOR_EXPORT_ATTEMPTS", "20")),
        )


@dataclass(frozen=True)
class AuthSecrets:
    username: str
    salt: bytes
    password_hash: bytes
    hmac_key: bytes
    n: int
    r: int
    p: int
    dklen: int

    @classmethod
    def load(cls, path: Path) -> "AuthSecrets":
        if not path.is_file():
            raise RuntimeError(f"authentication secret file does not exist: {path}")
        if os.name != "nt" and stat.S_IMODE(path.stat().st_mode) & 0o077:
            raise RuntimeError("authentication secret file must not be readable by group or others")
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            password = data["password"]
            result = cls(
                username=str(data["username"]),
                salt=base64.b64decode(password["salt"], validate=True),
                password_hash=base64.b64decode(password["hash"], validate=True),
                hmac_key=base64.b64decode(data["sessionHmacKey"], validate=True),
                n=int(password["n"]),
                r=int(password["r"]),
                p=int(password["p"]),
                dklen=int(password["dklen"]),
            )
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise RuntimeError("authentication secret file is invalid") from error
        if (
            data.get("version") != 1
            or data.get("password", {}).get("algorithm") != "scrypt"
            or not (1 <= len(result.username) <= 80)
            or result.n < 2**14
            or result.n & (result.n - 1)
            or result.r < 8
            or result.p < 1
            or result.dklen < 32
            or len(result.hmac_key) < 32
            or len(result.password_hash) != result.dklen
        ):
            raise RuntimeError("authentication secret file is invalid")
        return result

    def verify_password(self, username: str, password: str) -> bool:
        # Always run scrypt, even when the username is wrong, to avoid a useful
        # username timing oracle for this single-account service.
        try:
            candidate = hashlib.scrypt(
                password.encode("utf-8"),
                salt=self.salt,
                n=self.n,
                r=self.r,
                p=self.p,
                dklen=self.dklen,
            )
        except (UnicodeError, ValueError):
            candidate = b"\0" * self.dklen
        return hmac.compare_digest(candidate, self.password_hash) and hmac.compare_digest(
            username.encode("utf-8", "ignore"), self.username.encode("utf-8")
        )


def create_auth_file(path: Path, username: str, password: str) -> None:
    """Create a new password verifier and independent session signing key."""
    username = username.strip()
    if not (1 <= len(username) <= 80) or any(ord(char) < 33 for char in username):
        raise ValueError("username must be 1-80 visible characters without spaces")
    if len(password) < 14:
        raise ValueError("password must contain at least 14 characters")
    salt = secrets.token_bytes(16)
    n, r, p, dklen = 2**14, 8, 1, 32
    password_hash = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=n, r=r, p=p, dklen=dklen
    )
    payload = {
        "version": 1,
        "username": username,
        "password": {
            "algorithm": "scrypt",
            "n": n,
            "r": r,
            "p": p,
            "dklen": dklen,
            "salt": base64.b64encode(salt).decode("ascii"),
            "hash": base64.b64encode(password_hash).decode("ascii"),
        },
        "sessionHmacKey": base64.b64encode(secrets.token_bytes(32)).decode("ascii"),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as destination:
            json.dump(payload, destination, indent=2)
            destination.write("\n")
    except Exception:
        path.unlink(missing_ok=True)
        raise


class RateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window_seconds: int, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        cutoff = now - window_seconds
        with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= limit:
                return False
            events.append(now)
            return True


class RegionEditorApp:
    def __init__(self, config: Config, auth: AuthSecrets | None = None) -> None:
        self.config = config
        self.auth = auth or AuthSecrets.load(config.auth_file)
        self.rate_limiter = RateLimiter()
        self.templates = {
            "login": (APP_DIR / "templates" / "login.html").read_text(encoding="utf-8"),
            "editor": (APP_DIR / "templates" / "editor.html").read_text(encoding="utf-8"),
        }

    def handler_class(self) -> type["RegionEditorHandler"]:
        app = self

        class BoundHandler(RegionEditorHandler):
            application = app

        return BoundHandler

    def mint_signed_token(self, token_type: str, lifetime: int) -> str:
        now = int(time.time())
        payload = {
            "typ": token_type,
            "iat": now,
            "exp": now + lifetime,
            "nonce": _b64url_encode(secrets.token_bytes(18)),
        }
        encoded = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
        signature = _b64url_encode(hmac.new(self.auth.hmac_key, encoded.encode("ascii"), hashlib.sha256).digest())
        return f"{encoded}.{signature}"

    def verify_signed_token(self, token: str, expected_type: str) -> dict[str, Any] | None:
        try:
            encoded, provided_signature = token.split(".", 1)
            expected_signature = _b64url_encode(
                hmac.new(self.auth.hmac_key, encoded.encode("ascii"), hashlib.sha256).digest()
            )
            if not hmac.compare_digest(provided_signature, expected_signature):
                return None
            payload = json.loads(_b64url_decode(encoded).decode("utf-8"))
            now = int(time.time())
            if (
                payload.get("typ") != expected_type
                or not isinstance(payload.get("nonce"), str)
                or int(payload.get("iat", 0)) > now + 60
                or int(payload.get("exp", 0)) < now
            ):
                return None
            return payload
        except (ValueError, UnicodeError, json.JSONDecodeError, TypeError):
            return None

    def csrf_for_session(self, session: dict[str, Any]) -> str:
        return _b64url_encode(
            hmac.new(
                self.auth.hmac_key,
                b"csrf\0" + str(session["nonce"]).encode("ascii"),
                hashlib.sha256,
            ).digest()
        )

    def membership_path(self) -> Path:
        return self.config.asset_dir / "canada-region-membership.csv"

    def catalog_path(self) -> Path:
        return self.config.asset_dir / "canada-regions.json"

    def partition_path(self) -> Path:
        preferred = self.config.asset_dir / "canada-region-partition.geojson"
        if preferred.is_file():
            return preferred
        # The raw artifact is useful while regenerating, but remains read-only.
        return self.config.asset_dir / "canada-region-partition.raw.geojson"

    def cell_path(self, pruid: str) -> Path | None:
        candidates = (
            self.config.cell_dir / f"cells-{pruid}.topo.json",
            self.config.cell_dir / f"cells-{pruid}.topo.json.gz",
        )
        return next((path for path in candidates if path.is_file()), None)

    def province_rows(self, pruid: str) -> Iterable[dict[str, str]]:
        with self.membership_path().open("r", encoding="utf-8", newline="") as source:
            for row in csv.DictReader(source):
                if row.get("PRUID") == pruid:
                    yield row

    def editor_seed_tags(self, pruid: str) -> dict[str, str]:
        path = self.cell_path(pruid)
        if path is None:
            raise ProposalError("Editor cells are unavailable. Reload and try again.")
        try:
            if path.suffix == ".gz":
                with gzip.open(path, "rt", encoding="utf-8") as source:
                    topology = json.load(source)
            else:
                topology = json.loads(path.read_text(encoding="utf-8"))
            geometries = topology["objects"]["cells"]["geometries"]
            return {
                str(geometry.get("properties", {}).get("DGUID", "")): str(
                    geometry.get("properties", {}).get("seed_tag", "") or ""
                )
                for geometry in geometries
                if geometry.get("properties", {}).get("DGUID")
            }
        except (KeyError, TypeError, ValueError, OSError, json.JSONDecodeError) as error:
            raise ProposalError("Editor cells are invalid. Reload and try again.") from error

    def export_proposal(self, incoming: Any) -> dict[str, Any]:
        if not isinstance(incoming, dict) or incoming.get("schema") != PROPOSAL_SCHEMA:
            raise ProposalError("The proposal format is not supported.")
        allowed_top_level = {
            "schema",
            "baseMembershipSha256",
            "submittedBy",
            "reason",
            "changes",
        }
        if set(incoming) - allowed_top_level:
            raise ProposalError("The proposal contains unsupported fields.")
        base_hash = incoming.get("baseMembershipSha256")
        current_hash = _sha256(self.membership_path())
        if not isinstance(base_hash, str) or not hmac.compare_digest(base_hash, current_hash):
            raise ProposalError("The map changed after this edit began. Reload and try again.")
        raw_changes = incoming.get("changes")
        if not isinstance(raw_changes, list) or not 1 <= len(raw_changes) <= MAX_PROPOSAL_CHANGES:
            raise ProposalError("Choose at least one cell before exporting.")

        requested: dict[str, dict[str, str]] = {}
        for change in raw_changes:
            if not isinstance(change, dict):
                raise ProposalError("The proposal contains an invalid change.")
            dguid, before, after = change.get("DGUID"), change.get("from"), change.get("to")
            if (
                not isinstance(dguid, str)
                or not DGUID_RE.fullmatch(dguid)
                or not isinstance(before, str)
                or not TAG_RE.fullmatch(before)
                or not isinstance(after, str)
                or not TAG_RE.fullmatch(after)
                or dguid in requested
            ):
                raise ProposalError("The proposal contains an invalid change.")
            requested[dguid] = {"DGUID": dguid, "from": before, "to": after}

        catalog = json.loads(self.catalog_path().read_text(encoding="utf-8"))
        hierarchy = catalog.get("hierarchy", {})
        parent_tags = {
            str(entry.get("parent"))
            for entry in hierarchy.values()
            if isinstance(entry, dict) and entry.get("parent")
        }
        leaf_tags = set(hierarchy) - parent_tags
        found: dict[str, dict[str, str]] = {}
        leaf_provinces: dict[str, set[str]] = defaultdict(set)
        with self.membership_path().open("r", encoding="utf-8", newline="") as source:
            for row in csv.DictReader(source):
                leaf = row.get("leaf_tag", "")
                pruid = row.get("PRUID", "")
                if leaf and pruid:
                    leaf_provinces[leaf].add(pruid)
                dguid = row.get("DGUID", "")
                if dguid in requested:
                    found[dguid] = row

        if set(found) != set(requested):
            raise ProposalError("One or more cells no longer exist. Reload and try again.")
        provinces = {row.get("PRUID", "") for row in found.values()}
        if len(provinces) != 1 or "" in provinces:
            raise ProposalError("A proposal may change cells in only one province or territory.")
        pruid = next(iter(provinces))
        seed_tags = self.editor_seed_tags(pruid)
        if not set(requested).issubset(seed_tags):
            raise ProposalError("One or more cells are not available in the editor. Reload and try again.")
        canonical_changes: list[dict[str, str]] = []
        for dguid in sorted(requested):
            request = requested[dguid]
            current = found[dguid].get("leaf_tag", "")
            target = request["to"]
            if request["from"] != current:
                raise ProposalError("The map changed after this edit began. Reload and try again.")
            if target not in leaf_tags or leaf_provinces.get(target) != {pruid}:
                raise ProposalError("A target region must belong to the same province or territory.")
            if seed_tags.get(dguid) and seed_tags[dguid] != target:
                raise ProposalError("A region anchor cell cannot be moved away from its region.")
            if target == current:
                raise ProposalError("The proposal contains a change that has no effect.")
            canonical_changes.append({"DGUID": dguid, "from": current, "to": target})

        result: dict[str, Any] = {
            "schema": PROPOSAL_SCHEMA,
            "baseMembershipSha256": current_hash,
        }
        submitted_by = _clean_text(incoming.get("submittedBy"), 80)
        reason = _clean_text(incoming.get("reason"), 1000)
        if incoming.get("submittedBy") and not submitted_by:
            raise ProposalError("The submitted-by value is invalid.")
        if not reason:
            raise ProposalError("Add a short reason for this boundary change.")
        if submitted_by:
            result["submittedBy"] = submitted_by
        result["reason"] = reason
        result["changes"] = canonical_changes
        return result


class ProposalError(ValueError):
    pass


class RegionEditorHandler(BaseHTTPRequestHandler):
    application: RegionEditorApp
    server_version = "MCCRegionEditor/1"
    sys_version = ""

    @property
    def app(self) -> RegionEditorApp:
        return self.application

    def log_message(self, format_string: str, *args: Any) -> None:
        # Do not log request bodies, cookies, credentials, or query strings.
        message = format_string % args
        print(f"{self.log_date_time_string()} {self._client_ip()} {message}", flush=True)

    def _client_ip(self) -> str:
        value = self.client_address[0]
        if self.app.config.trusted_proxy:
            forwarded = self.headers.get("X-Forwarded-For", "").split(",", 1)[0].strip()
            if forwarded:
                try:
                    value = str(ipaddress.ip_address(forwarded))
                except ValueError:
                    pass
        return value

    def _relative_path(self) -> tuple[str, str] | None:
        parsed = urlsplit(self.path)
        request_path = parsed.path.rstrip("/") or "/"
        base = self.app.config.base_path
        if not base:
            return request_path, parsed.query
        if request_path == base:
            return "/", parsed.query
        if request_path.startswith(base + "/"):
            return request_path[len(base) :], parsed.query
        return None

    def _url(self, relative: str = "") -> str:
        base = self.app.config.base_path
        return (base or "") + (relative if relative.startswith("/") else "/" + relative)

    def _security_headers(self) -> list[tuple[str, str]]:
        headers = [
            (
                "Content-Security-Policy",
                "default-src 'none'; script-src 'self'; style-src 'self'; "
                "style-src-attr 'unsafe-inline'; img-src 'self' data: https://*.tile.openstreetmap.org; "
                "connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; "
                "form-action 'self'; frame-ancestors 'none'",
            ),
            ("X-Content-Type-Options", "nosniff"),
            ("X-Frame-Options", "DENY"),
            ("Referrer-Policy", "no-referrer"),
            ("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()"),
            ("Cross-Origin-Opener-Policy", "same-origin"),
            ("Cross-Origin-Resource-Policy", "same-origin"),
            ("Cache-Control", "no-store"),
        ]
        if self.app.config.secure_cookie:
            headers.append(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
        return headers

    def _send(
        self,
        status: HTTPStatus | int,
        body: bytes = b"",
        content_type: str = "text/plain; charset=utf-8",
        extra_headers: Iterable[tuple[str, str]] = (),
    ) -> None:
        extra_headers = list(extra_headers)
        overridden = {name.lower() for name, _ in extra_headers}
        self.send_response(int(status))
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for name, value in self._security_headers():
            if name.lower() not in overridden:
                self.send_header(name, value)
        for name, value in extra_headers:
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD" and body:
            self.wfile.write(body)

    def _json(
        self,
        status: HTTPStatus | int,
        data: Any,
        extra_headers: Iterable[tuple[str, str]] = (),
    ) -> None:
        body = (json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8", extra_headers)

    def _redirect(self, location: str, cookies: Iterable[str] = ()) -> None:
        headers = [("Location", location)] + [("Set-Cookie", cookie) for cookie in cookies]
        self._send(HTTPStatus.SEE_OTHER, b"", extra_headers=headers)

    def _cookie_header(self, name: str, value: str, max_age: int, http_only: bool = True) -> str:
        attributes = [
            f"{name}={value}",
            f"Path={self.app.config.base_path or '/'}",
            f"Max-Age={max_age}",
            "SameSite=Strict",
        ]
        if http_only:
            attributes.append("HttpOnly")
        if self.app.config.secure_cookie:
            attributes.append("Secure")
        return "; ".join(attributes)

    def _cookies(self) -> SimpleCookie[str]:
        result: SimpleCookie[str] = SimpleCookie()
        try:
            result.load(self.headers.get("Cookie", ""))
        except Exception:
            return SimpleCookie()
        return result

    def _session(self) -> dict[str, Any] | None:
        morsel = self._cookies().get("mcc_editor_session")
        if not morsel:
            return None
        return self.app.verify_signed_token(morsel.value, "session")

    def _require_session(self) -> dict[str, Any] | None:
        session = self._session()
        if session is None:
            if self._relative_path() and self._relative_path()[0].startswith("/api/"):
                self._json(HTTPStatus.UNAUTHORIZED, {"error": "Authentication required."})
            else:
                self._redirect(self._url("/login"))
        return session

    def _origin_ok(self) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return True
        parsed = urlsplit(origin)
        host = self.headers.get("Host", "")
        if not host:
            return False
        if self.app.config.trusted_proxy:
            scheme = self.headers.get("X-Forwarded-Proto", "https").split(",", 1)[0].strip()
        else:
            scheme = "https" if self.app.config.secure_cookie else "http"
        return parsed.scheme == scheme and parsed.netloc == host

    def _csrf_ok(self, session: dict[str, Any]) -> bool:
        supplied = self.headers.get("X-CSRF-Token", "")
        expected = self.app.csrf_for_session(session)
        return bool(supplied) and hmac.compare_digest(supplied, expected) and self._origin_ok()

    def _read_body(self, maximum: int) -> bytes | None:
        try:
            length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            length = -1
        if length < 0 or length > maximum:
            self._json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "Request rejected."})
            return None
        return self.rfile.read(length)

    def _render_template(self, name: str, replacements: dict[str, str]) -> bytes:
        content = self.app.templates[name]
        for key, value in replacements.items():
            content = content.replace("{{" + key + "}}", html.escape(value, quote=True))
        return content.encode("utf-8")

    def _serve_static(self, relative_path: str) -> None:
        if relative_path.startswith("/static/"):
            root = APP_DIR / "static"
            suffix = relative_path[len("/static/") :]
        elif relative_path.startswith("/vendor/"):
            root = APP_DIR / "vendor"
            suffix = relative_path[len("/vendor/") :]
        else:
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        try:
            path = (root / suffix).resolve()
            path.relative_to(root.resolve())
        except (ValueError, OSError):
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        if not path.is_file():
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        cache = "public, max-age=604800, immutable" if "/vendor/" in relative_path else "no-cache"
        self._send(HTTPStatus.OK, path.read_bytes(), content_type, (("Cache-Control", cache),))

    def _serve_data_file(self, path: Path, content_type: str, gzip_encoded: bool = False) -> None:
        if not path.is_file():
            self._json(HTTPStatus.SERVICE_UNAVAILABLE, {"error": "Editor data is not available."})
            return
        size = path.stat().st_size
        headers: list[tuple[str, str]] = [("ETag", '"' + _sha256(path) + '"')]
        if gzip_encoded:
            headers.append(("Content-Encoding", "gzip"))
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        for name, value in self._security_headers():
            self.send_header(name, value)
        for name, value in headers:
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            with path.open("rb") as source:
                for block in iter(lambda: source.read(256 * 1024), b""):
                    self.wfile.write(block)

    def do_HEAD(self) -> None:
        self.do_GET()

    def do_GET(self) -> None:
        relative = self._relative_path()
        parsed_path = urlsplit(self.path).path.rstrip("/") or "/"
        if parsed_path == "/healthz" or (relative and relative[0] == "/healthz"):
            self._json(HTTPStatus.OK, {"status": "ok"})
            return
        if relative is None:
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        path, query = relative
        if path.startswith("/static/") or path.startswith("/vendor/"):
            self._serve_static(path)
            return
        if path == "/login":
            if self._session():
                self._redirect(self._url("/"))
                return
            csrf = self.app.mint_signed_token("login-csrf", 10 * 60)
            body = self._render_template(
                "login",
                {"BASE_PATH": self.app.config.base_path, "LOGIN_CSRF": csrf, "ERROR": ""},
            )
            cookie = self._cookie_header("mcc_editor_login_csrf", csrf, 10 * 60)
            self._send(HTTPStatus.OK, body, "text/html; charset=utf-8", (("Set-Cookie", cookie),))
            return
        session = self._require_session()
        if session is None:
            return
        if path == "/":
            csrf = self.app.csrf_for_session(session)
            body = self._render_template(
                "editor",
                {
                    "BASE_PATH": self.app.config.base_path,
                    "CSRF_TOKEN": csrf,
                    "USERNAME": self.app.auth.username,
                },
            )
            self._send(HTTPStatus.OK, body, "text/html; charset=utf-8")
        elif path == "/api/catalog":
            self._serve_data_file(self.app.catalog_path(), "application/json; charset=utf-8")
        elif path == "/api/partition":
            self._serve_data_file(self.app.partition_path(), "application/geo+json; charset=utf-8")
        elif path == "/api/cell-manifest":
            self._serve_data_file(self.app.config.cell_dir / "manifest.json", "application/json; charset=utf-8")
        elif path == "/api/cells":
            values = parse_qs(query)
            pruid = values.get("province", [""])[0]
            if not PRUID_RE.fullmatch(pruid):
                self._json(HTTPStatus.BAD_REQUEST, {"error": "Choose a valid province or territory."})
                return
            cell_path = self.app.cell_path(pruid)
            if cell_path is None:
                self._json(HTTPStatus.NOT_FOUND, {"error": "Editor cells are not available for that area."})
                return
            self._serve_data_file(
                cell_path,
                "application/topo+json; charset=utf-8",
                gzip_encoded=cell_path.suffix == ".gz",
            )
        elif path == "/api/membership":
            values = parse_qs(query)
            pruid = values.get("province", [""])[0]
            if not PRUID_RE.fullmatch(pruid):
                self._json(HTTPStatus.BAD_REQUEST, {"error": "Choose a valid province or territory."})
                return
            membership_path = self.app.membership_path()
            if not membership_path.is_file():
                self._json(HTTPStatus.SERVICE_UNAVAILABLE, {"error": "Editor data is not available."})
                return
            rows = list(self.app.province_rows(pruid))
            self._json(
                HTTPStatus.OK,
                {
                    "province": pruid,
                    "baseMembershipSha256": _sha256(membership_path),
                    "rowCount": len(rows),
                    "rows": rows,
                },
            )
        else:
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})

    def do_POST(self) -> None:
        relative = self._relative_path()
        if relative is None:
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        path, _ = relative
        if path == "/login":
            self._post_login()
            return
        session = self._require_session()
        if session is None:
            return
        if not self._csrf_ok(session):
            self._json(HTTPStatus.FORBIDDEN, {"error": "Request rejected."})
            return
        if path == "/logout":
            expired = self._cookie_header("mcc_editor_session", "", 0)
            self._redirect(self._url("/login"), (expired,))
        elif path == "/api/export":
            key = "export:" + self._client_ip()
            if not self.app.rate_limiter.allow(
                key, self.app.config.export_attempts, self.app.config.export_window_seconds
            ):
                self._json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "Please wait and try again."})
                return
            if self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
                self._json(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, {"error": "Request rejected."})
                return
            body = self._read_body(MAX_PROPOSAL_BYTES)
            if body is None:
                return
            try:
                incoming = json.loads(body.decode("utf-8"))
                proposal = self.app.export_proposal(incoming)
            except (UnicodeError, json.JSONDecodeError):
                self._json(HTTPStatus.BAD_REQUEST, {"error": "The proposal is invalid."})
                return
            except (ProposalError, OSError, ValueError) as error:
                self._json(HTTPStatus.BAD_REQUEST, {"error": str(error) or "The proposal is invalid."})
                return
            output = (json.dumps(proposal, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
            filename = "mcc-region-proposal-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + ".json"
            self._send(
                HTTPStatus.OK,
                output,
                "application/json; charset=utf-8",
                (("Content-Disposition", f'attachment; filename="{filename}"'),),
            )
        else:
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found."})

    def _post_login(self) -> None:
        key = "login:" + self._client_ip()
        if not self.app.rate_limiter.allow(
            key, self.app.config.login_attempts, self.app.config.login_window_seconds
        ):
            self._login_failure(HTTPStatus.TOO_MANY_REQUESTS)
            return
        if (
            self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            != "application/x-www-form-urlencoded"
        ):
            self._login_failure()
            return
        body = self._read_body(MAX_FORM_BYTES)
        if body is None:
            return
        try:
            fields = parse_qs(body.decode("utf-8"), keep_blank_values=True, max_num_fields=8)
            username = fields.get("username", [""])[0]
            password = fields.get("password", [""])[0]
            supplied_csrf = fields.get("csrf", [""])[0]
        except (UnicodeError, ValueError):
            self._login_failure()
            return
        cookie_csrf = self._cookies().get("mcc_editor_login_csrf")
        csrf_ok = (
            bool(cookie_csrf)
            and hmac.compare_digest(
                supplied_csrf.encode("utf-8", "surrogatepass"),
                cookie_csrf.value.encode("utf-8", "surrogatepass"),
            )
            and self.app.verify_signed_token(supplied_csrf, "login-csrf") is not None
            and self._origin_ok()
        )
        credentials_ok = (
            len(username) <= 80
            and len(password) <= 1024
            and self.app.auth.verify_password(username, password)
        )
        if not (csrf_ok and credentials_ok):
            self._login_failure()
            return
        session = self.app.mint_signed_token("session", self.app.config.session_seconds)
        session_cookie = self._cookie_header(
            "mcc_editor_session", session, self.app.config.session_seconds
        )
        csrf_cookie = self._cookie_header("mcc_editor_login_csrf", "", 0)
        self._redirect(self._url("/"), (session_cookie, csrf_cookie))

    def _login_failure(self, status: HTTPStatus = HTTPStatus.UNAUTHORIZED) -> None:
        csrf = self.app.mint_signed_token("login-csrf", 10 * 60)
        body = self._render_template(
            "login",
            {
                "BASE_PATH": self.app.config.base_path,
                "LOGIN_CSRF": csrf,
                "ERROR": "Sign-in failed. Check your details or wait before trying again.",
            },
        )
        cookie = self._cookie_header("mcc_editor_login_csrf", csrf, 10 * 60)
        self._send(status, body, "text/html; charset=utf-8", (("Set-Cookie", cookie),))

    def do_PUT(self) -> None:
        self._json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "Method not allowed."}, (("Allow", "GET, HEAD, POST"),))

    do_PATCH = do_PUT
    do_DELETE = do_PUT


def main() -> None:
    config = Config.from_environment()
    app = RegionEditorApp(config)
    server = ThreadingHTTPServer((config.bind, config.port), app.handler_class())
    server.daemon_threads = True
    print(
        f"MeshCore Canada region editor listening on {config.bind}:{config.port}{config.base_path or '/'}",
        flush=True,
    )
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
