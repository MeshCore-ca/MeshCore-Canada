from __future__ import annotations

import hashlib
import http.client
import json
import re
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from urllib.parse import urlencode


EDITOR_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(EDITOR_DIR))

from server import (  # noqa: E402
    AuthSecrets,
    Config,
    PROPOSAL_SCHEMA,
    RateLimiter,
    RegionEditorApp,
    ThreadingHTTPServer,
    _default_repo_root,
    create_auth_file,
)


class EditorServerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        root = Path(self.temporary.name)
        self.assets = root / "regions"
        self.cells = root / "cells"
        self.assets.mkdir()
        self.cells.mkdir()
        self.auth_path = root / "editor-auth.json"
        create_auth_file(self.auth_path, "reviewer", "correct horse battery staple")
        self._write_fixtures()
        self.membership_before = (self.assets / "canada-region-membership.csv").read_bytes()

        config = Config(
            bind="127.0.0.1",
            port=0,
            base_path="/admin",
            asset_dir=self.assets,
            cell_dir=self.cells,
            auth_file=self.auth_path,
            secure_cookie=True,
            trusted_proxy=False,
            session_seconds=900,
            login_attempts=20,
            login_window_seconds=60,
            export_attempts=20,
            export_window_seconds=60,
        )
        self.app = RegionEditorApp(config)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), self.app.handler_class())
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    def _write_fixtures(self) -> None:
        catalog = {
            "version": "test-v1",
            "hierarchy": {
                "can": {"label": "Canada", "parent": None},
                "on": {"label": "Ontario", "parent": "can"},
                "qc": {"label": "Quebec", "parent": "can"},
                "wat": {"label": "Waterloo", "parent": "on"},
                "wel": {"label": "Wellington", "parent": "on"},
                "mtl": {"label": "Montreal", "parent": "qc"},
            },
            "seeds": [{"tag": "wat"}, {"tag": "wel"}, {"tag": "mtl"}],
        }
        (self.assets / "canada-regions.json").write_text(
            json.dumps(catalog), encoding="utf-8"
        )
        membership = (
            "DGUID,DAUID,PRUID,ERUID,CDUID,CDNAME,CSDUID,CSDNAME,CSDTYPE,"
            "provisional_leaf_tag,provisional_assignment,leaf_tag,assignment\n"
            "2021S051235000001,35000001,35,3550,3530,Waterloo,3530010,Cambridge,CY,wat,seed,wat,csd\n"
            "2021S051235000002,35000002,35,3550,3530,Waterloo,3530010,Cambridge,CY,wel,seed,wel,csd\n"
            "2021S051224000003,24000003,24,2440,2466,Montreal,2466023,Montreal,V,mtl,seed,mtl,csd\n"
        )
        (self.assets / "canada-region-membership.csv").write_text(
            membership, encoding="utf-8", newline=""
        )
        partition = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"tag": "wat"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[-81, 43], [-80, 43], [-80, 44], [-81, 44], [-81, 43]]],
                    },
                }
            ],
        }
        (self.assets / "canada-region-partition.geojson").write_text(
            json.dumps(partition), encoding="utf-8"
        )
        topology = {
            "type": "Topology",
            "objects": {
                "cells": {
                    "type": "GeometryCollection",
                    "geometries": [
                        {
                            "type": "Polygon",
                            "arcs": [[0]],
                            "properties": {
                                "DGUID": "2021S051235000001",
                                "DAUID": "35000001",
                                "PRUID": "35",
                                "CSDUID": "3530010",
                                "CSDNAME": "Cambridge",
                                "leaf_tag": "wat",
                                "seed_tag": "wat",
                            },
                        },
                        {
                            "type": "Polygon",
                            "arcs": [[1]],
                            "properties": {
                                "DGUID": "2021S051235000002",
                                "DAUID": "35000002",
                                "PRUID": "35",
                                "CSDUID": "3530010",
                                "CSDNAME": "Cambridge",
                                "leaf_tag": "wel",
                                "seed_tag": "",
                            },
                        },
                    ],
                }
            },
            "arcs": [
                [[-81, 43], [-80.5, 43], [-80.5, 43.5], [-81, 43.5], [-81, 43]],
                [[-80.5, 43], [-80, 43], [-80, 43.5], [-80.5, 43.5], [-80.5, 43]],
            ],
        }
        (self.cells / "cells-35.topo.json").write_text(
            json.dumps(topology), encoding="utf-8"
        )
        (self.cells / "manifest.json").write_text(
            json.dumps({"provinces": [{"PRUID": "35", "file": "cells-35.topo.json"}]}),
            encoding="utf-8",
        )

    def request(self, method: str, path: str, body: bytes | None = None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        payload = response.read()
        result = (response.status, response.getheaders(), payload)
        connection.close()
        return result

    @staticmethod
    def header(headers, name: str):
        return next((value for key, value in headers if key.lower() == name.lower()), None)

    @staticmethod
    def headers(headers, name: str):
        return [value for key, value in headers if key.lower() == name.lower()]

    def login(self):
        status, headers, page = self.request("GET", "/admin/login")
        self.assertEqual(status, 200)
        csrf = re.search(rb'name="csrf" value="([^"]+)"', page).group(1).decode()
        csrf_cookie = self.header(headers, "Set-Cookie").split(";", 1)[0]
        form = urlencode(
            {"username": "reviewer", "password": "correct horse battery staple", "csrf": csrf}
        ).encode()
        status, headers, _ = self.request(
            "POST",
            "/admin/login",
            form,
            {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": str(len(form)),
                "Cookie": csrf_cookie,
                "Origin": f"https://127.0.0.1:{self.port}",
                "Host": f"127.0.0.1:{self.port}",
            },
        )
        # secure_cookie=True means the expected origin scheme is https, even
        # though this test sends requests directly over loopback HTTP.
        self.assertEqual(status, 303)
        self.last_login_cookies = self.headers(headers, "Set-Cookie")
        session_cookie = next(
            value.split(";", 1)[0]
            for value in self.last_login_cookies
            if value.startswith("mcc_editor_session=")
        )
        return session_cookie

    def editor_csrf(self, session_cookie: str):
        status, _, page = self.request("GET", "/admin/", headers={"Cookie": session_cookie})
        self.assertEqual(status, 200)
        return re.search(rb'name="csrf-token" content="([^"]+)"', page).group(1).decode()

    def test_authentication_cookie_and_security_headers(self):
        status, headers, _ = self.request("GET", "/admin/")
        self.assertEqual(status, 303)
        self.assertEqual(self.header(headers, "Location"), "/admin/login")

        status, headers, page = self.request("GET", "/admin/login")
        self.assertEqual(status, 200)
        self.assertIn(b"Region boundary editor", page)
        self.assertIn("default-src 'none'", self.header(headers, "Content-Security-Policy"))
        csrf = re.search(rb'name="csrf" value="([^"]+)"', page).group(1).decode()
        csrf_cookie = self.header(headers, "Set-Cookie").split(";", 1)[0]
        bad_form = urlencode({"username": "nobody", "password": "wrong", "csrf": csrf}).encode()
        status, _, failure = self.request(
            "POST",
            "/admin/login",
            bad_form,
            {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": str(len(bad_form)),
                "Cookie": csrf_cookie,
            },
        )
        self.assertEqual(status, 401)
        self.assertIn(b"Sign-in failed", failure)
        self.assertNotIn(b"nobody", failure)

        session_cookie = self.login()
        status, headers, page = self.request("GET", "/admin/", headers={"Cookie": session_cookie})
        self.assertEqual(status, 200)
        self.assertIn(b"Adjust official census cells", page)
        raw_cookie = next(
            value for value in self.last_login_cookies if value.startswith("mcc_editor_session=")
        )
        self.assertIn("; Secure", raw_cookie)
        self.assertIn("; HttpOnly", raw_cookie)
        self.assertIn("; SameSite=Strict", raw_cookie)
        self.assertIn("; Path=/admin", raw_cookie)

    def test_authenticated_data_endpoints_and_traversal_guard(self):
        status, _, data = self.request("GET", "/admin/api/catalog")
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(data)["error"], "Authentication required.")

        cookie = self.login()
        for path in (
            "/admin/api/catalog",
            "/admin/api/partition",
            "/admin/api/cell-manifest",
            "/admin/api/cells?province=35",
            "/admin/api/membership?province=35",
        ):
            status, _, _ = self.request("GET", path, headers={"Cookie": cookie})
            self.assertEqual(status, 200, path)

        status, _, _ = self.request(
            "GET", "/admin/vendor/../server.py", headers={"Cookie": cookie}
        )
        self.assertEqual(status, 404)

    def test_export_is_csrf_protected_canonical_and_read_only(self):
        cookie = self.login()
        csrf = self.editor_csrf(cookie)
        base_hash = hashlib.sha256(self.membership_before).hexdigest()
        proposal = {
            "schema": PROPOSAL_SCHEMA,
            "baseMembershipSha256": base_hash,
            "submittedBy": "Local reviewer",
            "reason": "Keep Cambridge together",
            "changes": [
                {"DGUID": "2021S051235000002", "from": "wel", "to": "wat"}
            ],
        }
        body = json.dumps(proposal).encode()
        status, _, _ = self.request(
            "POST",
            "/admin/api/export",
            body,
            {"Content-Type": "application/json", "Content-Length": str(len(body)), "Cookie": cookie},
        )
        self.assertEqual(status, 403)

        status, headers, output = self.request(
            "POST",
            "/admin/api/export",
            body,
            {
                "Content-Type": "application/json",
                "Content-Length": str(len(body)),
                "Cookie": cookie,
                "X-CSRF-Token": csrf,
            },
        )
        self.assertEqual(status, 200)
        self.assertIn("attachment", self.header(headers, "Content-Disposition"))
        canonical = json.loads(output)
        self.assertEqual(
            list(canonical),
            ["schema", "baseMembershipSha256", "submittedBy", "reason", "changes"],
        )
        self.assertEqual(canonical["changes"], proposal["changes"])
        self.assertEqual(
            (self.assets / "canada-region-membership.csv").read_bytes(), self.membership_before
        )

    def test_export_rejects_stale_and_cross_province_targets(self):
        cookie = self.login()
        csrf = self.editor_csrf(cookie)
        common_headers = {
            "Content-Type": "application/json",
            "Cookie": cookie,
            "X-CSRF-Token": csrf,
        }
        reasonless = {
            "schema": PROPOSAL_SCHEMA,
            "baseMembershipSha256": hashlib.sha256(self.membership_before).hexdigest(),
            "changes": [{"DGUID": "2021S051235000002", "from": "wel", "to": "wat"}],
        }
        body = json.dumps(reasonless).encode()
        status, _, output = self.request(
            "POST", "/admin/api/export", body, dict(common_headers, **{"Content-Length": str(len(body))})
        )
        self.assertEqual(status, 400)
        self.assertIn("reason", json.loads(output)["error"])

        stale = {
            "schema": PROPOSAL_SCHEMA,
            "baseMembershipSha256": "0" * 64,
            "changes": [{"DGUID": "2021S051235000002", "from": "wel", "to": "wat"}],
        }
        body = json.dumps(stale).encode()
        status, _, output = self.request(
            "POST", "/admin/api/export", body, dict(common_headers, **{"Content-Length": str(len(body))})
        )
        self.assertEqual(status, 400)
        self.assertIn("Reload", json.loads(output)["error"])

        cross = {
            "schema": PROPOSAL_SCHEMA,
            "baseMembershipSha256": hashlib.sha256(self.membership_before).hexdigest(),
            "changes": [{"DGUID": "2021S051235000002", "from": "wel", "to": "mtl"}],
        }
        body = json.dumps(cross).encode()
        status, _, output = self.request(
            "POST", "/admin/api/export", body, dict(common_headers, **{"Content-Length": str(len(body))})
        )
        self.assertEqual(status, 400)
        self.assertIn("same province", json.loads(output)["error"])

        protected = {
            "schema": PROPOSAL_SCHEMA,
            "baseMembershipSha256": hashlib.sha256(self.membership_before).hexdigest(),
            "changes": [{"DGUID": "2021S051235000001", "from": "wat", "to": "wel"}],
        }
        body = json.dumps(protected).encode()
        status, _, output = self.request(
            "POST", "/admin/api/export", body, dict(common_headers, **{"Content-Length": str(len(body))})
        )
        self.assertEqual(status, 400)
        self.assertIn("anchor cell", json.loads(output)["error"])

    def test_health_and_local_vendor_assets(self):
        status, _, payload = self.request("GET", "/healthz")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(payload), {"status": "ok"})
        status, headers, payload = self.request("GET", "/admin/vendor/leaflet/leaflet.js")
        self.assertEqual(status, 200)
        self.assertGreater(len(payload), 100_000)
        self.assertIn("immutable", self.header(headers, "Cache-Control"))


class SecurityUnitTests(unittest.TestCase):
    def test_container_root_path_is_supported(self):
        app_dir = Path("/app")
        self.assertEqual(_default_repo_root(app_dir), app_dir)

    def test_secret_uses_scrypt_and_never_contains_plaintext(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "secret.json"
            password = "a very long unique passphrase"
            create_auth_file(path, "admin", password)
            raw = path.read_text(encoding="utf-8")
            self.assertNotIn(password, raw)
            self.assertEqual(json.loads(raw)["password"]["algorithm"], "scrypt")
            secrets = AuthSecrets.load(path)
            self.assertTrue(secrets.verify_password("admin", password))
            self.assertFalse(secrets.verify_password("admin", "wrong"))
            self.assertFalse(secrets.verify_password("other", password))

    def test_rate_limiter_has_a_fixed_window(self):
        limiter = RateLimiter()
        self.assertTrue(limiter.allow("client", 2, 10, now=100))
        self.assertTrue(limiter.allow("client", 2, 10, now=101))
        self.assertFalse(limiter.allow("client", 2, 10, now=102))
        self.assertTrue(limiter.allow("client", 2, 10, now=111))

    def test_expired_signed_session_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            auth = root / "auth.json"
            create_auth_file(auth, "admin", "another secure passphrase")
            config = Config(
                bind="127.0.0.1",
                port=0,
                base_path="/admin",
                asset_dir=root,
                cell_dir=root,
                auth_file=auth,
            )
            app = RegionEditorApp(config)
            token = app.mint_signed_token("session", -1)
            time.sleep(0.01)
            self.assertIsNone(app.verify_signed_token(token, "session"))


if __name__ == "__main__":
    unittest.main()
