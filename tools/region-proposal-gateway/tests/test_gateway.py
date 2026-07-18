from __future__ import annotations

import hashlib
import http.client
import io
import json
import os
import stat
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import boundary_preview  # noqa: E402
import gateway  # noqa: E402


def write_authority(root: Path, *, first_leaf: str = "aaa") -> tuple[Path, Path, Path, str]:
    cells = root / "cells"
    cells.mkdir(exist_ok=True)
    catalog = {
        "hierarchy": {
            "can": {"parent": None},
            "on": {"parent": "can"},
            "aaa": {"parent": "on"},
            "bbb": {"parent": "on"},
        }
    }
    catalog_path = root / "canada-regions.json"
    catalog_path.write_text(json.dumps(catalog), encoding="utf-8")
    membership_text = (
        "DGUID,PRUID,leaf_tag\n"
        f"2021S0512TEST0001,35,{first_leaf}\n"
        "2021S0512TEST0002,35,bbb\n"
        "2021S0512TEST0003,35,aaa\n"
    )
    membership_path = root / "canada-region-membership.csv"
    membership_path.write_text(membership_text, encoding="utf-8", newline="")
    topology = {
        "type": "Topology",
        "transform": {"scale": [0.01, 0.01], "translate": [-80.5, 43.3]},
        "objects": {
            "cells": {
                "type": "GeometryCollection",
                "geometries": [
                    {"type": "Polygon", "arcs": [[0]], "properties": {"DGUID": "2021S0512TEST0001", "PRUID": "35", "leaf_tag": first_leaf, "seed_tag": first_leaf if first_leaf == "aaa" else ""}},
                    {"type": "Polygon", "arcs": [[1]], "properties": {"DGUID": "2021S0512TEST0002", "PRUID": "35", "leaf_tag": "bbb", "seed_tag": "bbb"}},
                    {"type": "Polygon", "arcs": [[2]], "properties": {"DGUID": "2021S0512TEST0003", "PRUID": "35", "leaf_tag": "aaa", "seed_tag": "aaa" if first_leaf != "aaa" else ""}},
                ],
            }
        },
        "arcs": [
            [[0, 0], [10, 0], [0, 10], [-10, 0], [0, -10]],
            [[20, 0], [10, 0], [0, 10], [-10, 0], [0, -10]],
            [[0, 20], [10, 0], [0, 10], [-10, 0], [0, -10]],
        ],
    }
    (cells / "cells-35.topo.json").write_text(json.dumps(topology), encoding="utf-8")
    raw = membership_path.read_bytes()
    return membership_path, catalog_path, cells, hashlib.sha256(raw).hexdigest()


def valid_proposal(membership_hash: str) -> dict:
    return {
        "schema": gateway.PROPOSAL_SCHEMA,
        "baseMembershipSha256": membership_hash,
        "submittedBy": "  Test   Person ",
        "reason": " Keep this town together. ",
        "changes": [{"DGUID": "2021S0512TEST0003", "from": "aaa", "to": "bbb"}],
    }




def valid_idea() -> dict:
    return {
        "schema": gateway.IDEA_SCHEMA,
        "category": "Feature or project idea",
        "experience": "Active mesh user",
        "summary": "  Better regional setup help  ",
        "region": "  Waterloo Region, Ontario  ",
        "need": "  First line\r\n\r\nSecond line  ",
        "idea": "  Add a guided checklist.  ",
        "context": "   ",
        "followUp": "  @meshfriend on Discord  ",
        "publicAcknowledged": True,
    }
class AuthorityTests(unittest.TestCase):
    def test_loads_and_cross_checks_all_authority_sources(self):
        with tempfile.TemporaryDirectory() as temporary:
            paths = write_authority(Path(temporary))
            snapshot = gateway.AuthorityCache(*paths[:3]).get()
            self.assertEqual(snapshot.membership_sha256, paths[3])
            self.assertEqual(snapshot.seed_tags["2021S0512TEST0001"], "aaa")
            self.assertEqual(snapshot.leaf_jurisdictions, {"aaa": "on", "bbb": "on"})
            self.assertEqual(
                snapshot.topology_sha256["35"],
                hashlib.sha256((paths[2] / "cells-35.topo.json").read_bytes()).hexdigest(),
            )

    def test_reloads_when_mounted_files_change(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            paths = write_authority(root)
            cache = gateway.AuthorityCache(*paths[:3])
            first = cache.get()
            paths = write_authority(root, first_leaf="bbb")
            second = cache.get()
            self.assertNotEqual(first.membership_sha256, second.membership_sha256)
            self.assertEqual(second.membership["2021S0512TEST0001"].leaf_tag, "bbb")

    def test_rejects_topology_membership_disagreement(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            paths = write_authority(root)
            topology_path = paths[2] / "cells-35.topo.json"
            topology = json.loads(topology_path.read_text(encoding="utf-8"))
            topology["objects"]["cells"]["geometries"][0]["properties"]["leaf_tag"] = "bbb"
            topology_path.write_text(json.dumps(topology), encoding="utf-8")
            with self.assertRaisesRegex(RuntimeError, "disagrees"):
                gateway.AuthorityCache(*paths[:3]).get()

    def test_preview_topology_must_match_loaded_snapshot(self):
        with tempfile.TemporaryDirectory() as temporary:
            paths = write_authority(Path(temporary))
            cache = gateway.AuthorityCache(*paths[:3])
            snapshot = cache.get()
            self.assertEqual(cache.topology(snapshot, "35")["type"], "Topology")
            topology_path = paths[2] / "cells-35.topo.json"
            topology_path.write_text(
                topology_path.read_text(encoding="utf-8") + " ",
                encoding="utf-8",
            )
            with self.assertRaisesRegex(RuntimeError, "changed"):
                cache.topology(snapshot, "35")


class ProposalValidationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        paths = write_authority(Path(self.temporary.name))
        self.snapshot = gateway.AuthorityCache(*paths[:3]).get()
        self.membership_hash = paths[3]

    def tearDown(self):
        self.temporary.cleanup()

    def test_canonicalizes_and_hashes_exact_browser_contract(self):
        canonical, payload, digest = gateway.validate_proposal(valid_proposal(self.membership_hash), self.snapshot)
        expected = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        self.assertEqual(payload, expected)
        self.assertFalse(payload.endswith(b"\n"))
        self.assertEqual(digest, hashlib.sha256(expected).hexdigest())
        self.assertEqual(canonical["submittedBy"], "Test Person")

    def test_rejects_stale_base(self):
        proposal = valid_proposal("0" * 64)
        with self.assertRaises(gateway.GatewayError) as raised:
            gateway.validate_proposal(proposal, self.snapshot)
        self.assertEqual((raised.exception.status, raised.exception.code), (409, "stale_base"))

    def test_rejects_anchor_move_and_duplicate(self):
        proposal = valid_proposal(self.membership_hash)
        proposal["changes"][0] = {"DGUID": "2021S0512TEST0002", "from": "bbb", "to": "aaa"}
        with self.assertRaises(gateway.GatewayError) as raised:
            gateway.validate_proposal(proposal, self.snapshot)
        self.assertEqual(raised.exception.code, "invalid_proposal")
        proposal = valid_proposal(self.membership_hash)
        proposal["changes"] *= 2
        with self.assertRaises(gateway.GatewayError) as raised:
            gateway.validate_proposal(proposal, self.snapshot)
        self.assertEqual(raised.exception.code, "invalid_proposal")

    def test_rejects_surrogate_text(self):
        proposal = valid_proposal(self.membership_hash)
        proposal["reason"] = "bad \ud800 text"
        with self.assertRaises(gateway.GatewayError) as raised:
            gateway.validate_proposal(proposal, self.snapshot)
        self.assertEqual(raised.exception.code, "invalid_proposal")

    def test_normalizes_unicode_next_line_like_browser_validator(self):
        proposal = valid_proposal(self.membership_hash)
        proposal["reason"] = "keep\u0085the town together"
        canonical, _, _ = gateway.validate_proposal(proposal, self.snapshot)
        self.assertEqual(canonical["reason"], "keep the town together")


class PreviewTests(unittest.TestCase):
    def test_gateway_imports_without_site_packages(self):
        gateway_dir = str(Path(__file__).resolve().parents[1])
        code = (
            "import sys;"
            f"sys.path.insert(0, {gateway_dir!r});"
            "import boundary_preview, gateway;"
            "assert boundary_preview.Image is None"
        )
        completed = subprocess.run(
            [sys.executable, "-S", "-c", code],
            check=False,
            capture_output=True,
            text=True,
            timeout=20,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)

    def test_renders_deterministic_current_and_proposed_png(self):
        with tempfile.TemporaryDirectory() as temporary:
            paths = write_authority(Path(temporary))
            authority = gateway.AuthorityCache(*paths[:3])
            snapshot = authority.get()
            canonical, _, _ = gateway.validate_proposal(
                valid_proposal(snapshot.membership_sha256), snapshot
            )
            topology = authority.topology(snapshot, "35")
            first = gateway.render_boundary_preview(canonical, topology)
            second = gateway.render_boundary_preview(canonical, topology)
            self.assertEqual(first, second)
            self.assertLess(len(first), gateway.MAX_PREVIEW_BYTES)
            with Image.open(io.BytesIO(first)) as image:
                self.assertEqual(image.format, "PNG")
                self.assertEqual(image.size, (1600, 1000))
                self.assertEqual(image.mode, "RGB")

    def test_renders_valid_preview_without_pillow_at_runtime(self):
        with tempfile.TemporaryDirectory() as temporary:
            paths = write_authority(Path(temporary))
            authority = gateway.AuthorityCache(*paths[:3])
            snapshot = authority.get()
            canonical, _, _ = gateway.validate_proposal(
                valid_proposal(snapshot.membership_sha256), snapshot
            )
            topology = authority.topology(snapshot, "35")
            with mock.patch.object(boundary_preview, "Image", None):
                first = gateway.render_boundary_preview(canonical, topology)
                second = gateway.render_boundary_preview(canonical, topology)
            self.assertEqual(first, second)
            self.assertLess(len(first), gateway.MAX_PREVIEW_BYTES)
            with Image.open(io.BytesIO(first)) as image:
                self.assertEqual(image.format, "PNG")
                self.assertEqual(image.size, (1600, 1000))
                self.assertEqual(image.mode, "RGB")

    def test_store_uses_immutable_hash_path_and_rejects_invalid_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            store = gateway.PreviewStore(
                root,
                "https://api.meshcore.ca:21323/api/meshcore-canada/submissions",
                gateway.DEFAULT_BASE_PATH,
            )
            output = io.BytesIO()
            Image.new("RGB", (2, 2), "white").save(output, format="PNG")
            digest = "a" * 64
            url = store.put(digest, output.getvalue())
            self.assertEqual(
                url,
                "https://api.meshcore.ca:21323/api/meshcore-canada/submissions/"
                f"previews/{digest}.png",
            )
            self.assertEqual(store.get(digest), output.getvalue())
            # An existing hash remains immutable across a later renderer change.
            other = io.BytesIO()
            Image.new("RGB", (3, 3), "black").save(other, format="PNG")
            self.assertEqual(store.put(digest, other.getvalue()), url)
            self.assertEqual(store.get(digest), output.getvalue())
            (root / f"{digest}.png").write_bytes(b"not a png")
            with self.assertRaisesRegex(RuntimeError, "invalid"):
                store.get(digest)




class IdeaValidationTests(unittest.TestCase):
    def test_canonicalizes_optional_fields_and_hash(self):
        canonical, payload, digest = gateway.validate_idea(valid_idea())
        self.assertEqual(canonical["summary"], "Better regional setup help")
        self.assertEqual(canonical["need"], "First line\n\nSecond line")
        self.assertEqual(canonical["region"], "Waterloo Region, Ontario")
        self.assertEqual(canonical["followUp"], "@meshfriend on Discord")
        self.assertNotIn("context", canonical)
        expected = json.dumps(
            canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        self.assertEqual(payload, expected)
        self.assertEqual(digest, hashlib.sha256(expected).hexdigest())

    def test_rejects_invalid_shape_enums_consent_and_text(self):
        cases = []
        extra = valid_idea()
        extra["repository"] = "someone/else"
        cases.append(extra)
        missing = valid_idea()
        missing.pop("summary")
        cases.append(missing)
        consent = valid_idea()
        consent["publicAcknowledged"] = False
        cases.append(consent)
        category = valid_idea()
        category["category"] = "Arbitrary"
        cases.append(category)
        title = valid_idea()
        title["summary"] = "bad\nnewline"
        cases.append(title)
        control = valid_idea()
        control["idea"] = "bad" + chr(0) + "text"
        cases.append(control)
        long_text = valid_idea()
        long_text["need"] = "x" * 2001
        cases.append(long_text)
        for submission in cases:
            with self.subTest(submission=submission):
                with self.assertRaises(gateway.GatewayError) as raised:
                    gateway.validate_idea(submission)
                self.assertEqual(raised.exception.code, "invalid_submission")

    def test_issue_escapes_title_body_mentions_and_fences(self):
        idea = valid_idea()
        idea["summary"] = "<script> @team ```"
        idea["need"] = "Need </p> and @admins"
        idea["idea"] = "Try ``` inside"
        canonical, payload, digest = gateway.validate_idea(idea)
        title, body, chunked = gateway.build_issue(
            canonical, payload, digest, "signature"
        )
        self.assertFalse(chunked)
        self.assertIn("&lt;script&gt;", title)
        self.assertNotIn("<script>", title)
        self.assertIn("@\u200bteam", title)
        rendered = body.split("### Canonical submission JSON", 1)[0]
        self.assertNotIn("Need </p>", rendered)
        self.assertIn("Need &lt;/p&gt;", rendered)
        self.assertIn("@\u200badmins", rendered)
        self.assertIn(f"submission-schema:{gateway.IDEA_SCHEMA}", body)
        self.assertIn("submission-sha256:" + digest, body)
        self.assertIn("````json", body)


class FakeSigner:
    def __init__(self):
        self.inputs = []

    def sign(self, data: bytes) -> bytes:
        self.inputs.append(data)
        return b"signature"


class RoutingTransport:
    def __init__(self):
        self.calls = []
        self.issue = None
        self.comments = []
        self.fail_comment_number = None
        self.comment_posts = 0

    def request(self, method, url, headers, body, timeout):
        parsed = json.loads(body) if body and headers.get("Content-Type") == "application/json" else None
        self.calls.append((method, url, dict(headers), parsed))
        if "/access_tokens" in url:
            return 201, {}, {
                "token": "installation-token",
                "expires_at": "2035-01-01T00:00:00Z",
                "permissions": {"issues": "write"},
                "repositories": [{"full_name": gateway.GITHUB_FULL_NAME}],
            }
        if "/search/issues?" in url:
            return 200, {}, {"items": [self.issue] if self.issue else []}
        if url.endswith("/issues") and method == "POST":
            self.issue = {
                "number": 42,
                "html_url": "https://github.com/MeshCore-ca/MeshCore-Canada/issues/42",
                "body": parsed["body"],
            }
            return 201, {}, self.issue
        if "/comments?" in url:
            return 200, {}, [{"body": value} for value in self.comments]
        if url.endswith("/comments") and method == "POST":
            self.comment_posts += 1
            if self.fail_comment_number == self.comment_posts:
                return 500, {}, {}
            self.comments.append(parsed["body"])
            return 201, {}, {"id": self.comment_posts}
        raise AssertionError((method, url))


class GitHubTests(unittest.TestCase):
    def make_client(self, transport, sleeps=None):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        return gateway.GitHubAppClient(
            transport, FakeSigner(), "Iv1.client", 123,
            gateway.ProposalLedger(Path(temporary.name) / "ledger.sqlite3"),
            now=lambda: 1_900_000_000.0,
            sleep=(lambda seconds: sleeps.append(seconds)) if sleeps is not None else (lambda _seconds: None),
        )


    def test_signature_is_domain_separated_by_schema(self):
        client = object.__new__(gateway.GitHubAppClient)
        signer = FakeSigner()
        client.signer = signer
        digest = "a" * 64
        region = client._submission_signature(gateway.PROPOSAL_SCHEMA, digest)
        idea = client._submission_signature(gateway.IDEA_SCHEMA, digest)
        self.assertEqual(region, idea)
        self.assertNotEqual(signer.inputs[0], signer.inputs[1])
        self.assertIn(gateway.PROPOSAL_SCHEMA.encode("ascii"), signer.inputs[0])
        self.assertIn(gateway.IDEA_SCHEMA.encode("ascii"), signer.inputs[1])
    def test_small_submission_uses_restricted_token_and_fixed_issue(self):
        transport = RoutingTransport()
        client = self.make_client(transport)
        canonical = {
            "schema": gateway.PROPOSAL_SCHEMA,
            "baseMembershipSha256": "a" * 64,
            "submittedBy": "@team <script>",
            "reason": "Try ``` and @admin </p>",
            "changes": [{"DGUID": "2021S0512TEST0001", "from": "aaa", "to": "bbb"}],
        }
        payload = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()
        digest = hashlib.sha256(payload).hexdigest()
        result = client.submit(canonical, payload, digest)
        self.assertEqual(result["issueNumber"], 42)
        self.assertFalse(result["duplicate"])
        token_call = transport.calls[0]
        self.assertEqual(token_call[3], {"permissions": {"issues": "write"}, "repositories": ["MeshCore-Canada"]})
        issue_call = next(call for call in transport.calls if call[1].endswith("/issues"))
        self.assertEqual(issue_call[3]["labels"], ["enhancement", "boundary-update"])
        body = issue_call[3]["body"]
        self.assertIn("submission-sha256:" + digest, body)
        self.assertIn("@\u200bteam", body)
        self.assertNotIn("<script>", body)
        self.assertNotIn("Canonical proposal JSON", body)
        self.assertIn("submission-payload-gzip-base64url:", body)
        self.assertIn("close this issue as **Completed**", body)
        self.assertNotIn("contents", json.dumps(transport.calls).lower())

    def test_boundary_preview_comment_is_visible_and_idempotent(self):
        transport = RoutingTransport()
        client = self.make_client(transport)
        canonical = {
            "schema": gateway.PROPOSAL_SCHEMA,
            "baseMembershipSha256": "a" * 64,
            "reason": "Keep the city together",
            "changes": [
                {"DGUID": "2021S0512TEST0001", "from": "aaa", "to": "bbb"}
            ],
        }
        payload = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()
        digest = hashlib.sha256(payload).hexdigest()
        preview_url = (
            "https://api.meshcore.ca:21323/api/meshcore-canada/submissions/"
            f"previews/{digest}.png"
        )
        first = client.submit(
            canonical, payload, digest, preview_url=preview_url
        )
        second = client.submit(
            canonical, payload, digest, preview_url=preview_url
        )
        self.assertFalse(first["duplicate"])
        self.assertTrue(second["duplicate"])
        self.assertEqual(len(transport.comments), 1)
        comment = transport.comments[0]
        self.assertIn(f"<!-- mcc-boundary-preview:{digest} -->", comment)
        self.assertIn(f"]({preview_url})", comment)
        self.assertIn("nothing has been approved yet", comment)

    def test_boundary_preview_comment_resumes_after_ambiguous_failure(self):
        transport = RoutingTransport()
        client = self.make_client(transport)
        canonical = {
            "schema": gateway.PROPOSAL_SCHEMA,
            "baseMembershipSha256": "a" * 64,
            "reason": "Keep the city together",
            "changes": [
                {"DGUID": "2021S0512TEST0001", "from": "aaa", "to": "bbb"}
            ],
        }
        payload = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()
        digest = hashlib.sha256(payload).hexdigest()
        preview_url = (
            "https://api.meshcore.ca:21323/api/meshcore-canada/submissions/"
            f"previews/{digest}.png"
        )
        transport.fail_comment_number = 1
        with self.assertRaises(gateway.UpstreamError):
            client.submit(canonical, payload, digest, preview_url=preview_url)
        self.assertEqual(client.ledger.lookup(digest)["state"], "created")
        transport.fail_comment_number = None
        result = client.submit(
            canonical, payload, digest, preview_url=preview_url
        )
        self.assertTrue(result["duplicate"])
        self.assertEqual(len(transport.comments), 1)
        self.assertIn(f"mcc-boundary-preview:{digest}", transport.comments[0])

    def test_duplicate_search_returns_existing_issue_without_create(self):
        transport = RoutingTransport()
        digest = "b" * 64
        signature = gateway._b64url(b"signature")
        transport.issue = {
            "number": 9,
            "html_url": "https://github.com/MeshCore-ca/MeshCore-Canada/issues/9",
            "body": f"submission-schema:{gateway.PROPOSAL_SCHEMA}\nsubmission-sha256:{digest}\nsubmission-signature-rs256:{signature}",
        }
        client = self.make_client(transport)
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        result = client.submit(canonical, b"{}", digest)
        self.assertTrue(result["duplicate"])
        self.assertFalse(any(call[0] == "POST" and call[1].endswith("/issues") for call in transport.calls))

    def test_rejects_noncanonical_issue_url(self):
        transport = RoutingTransport()
        digest = "c" * 64
        signature = gateway._b64url(b"signature")
        transport.issue = {
            "number": 9,
            "html_url": "https://github.com/MeshCore-ca/MeshCore-Canada/issues/9?redirect=evil",
            "body": f"submission-schema:{gateway.PROPOSAL_SCHEMA}\nsubmission-sha256:{digest}\nsubmission-signature-rs256:{signature}",
        }
        client = self.make_client(transport)
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        with self.assertRaises(gateway.UpstreamError):
            client.submit(canonical, b"{}", digest)

    def test_ignores_counterfeit_hash_marker_without_app_signature(self):
        transport = RoutingTransport()
        digest = "f" * 64
        transport.issue = {
            "number": 7,
            "html_url": "https://github.com/MeshCore-ca/MeshCore-Canada/issues/7",
            "body": "submission-sha256:" + digest,
        }
        client = self.make_client(transport)
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        result = client.submit(canonical, b"{}", digest)
        self.assertFalse(result["duplicate"])
        self.assertTrue(any(call[0] == "POST" and call[1].endswith("/issues") for call in transport.calls))

    def test_large_submission_resumes_missing_chunks_after_failure(self):
        transport = RoutingTransport()
        sleeps = []
        client = self.make_client(transport, sleeps)
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        payload = bytes(range(256)) * 200
        digest = hashlib.sha256(payload).hexdigest()
        transport.fail_comment_number = 2
        with mock.patch.object(gateway, "COMMENT_CHUNK_CHARS", 100):
            with self.assertRaises(gateway.UpstreamError):
                client.submit(canonical, payload, digest)
            first_comment = transport.comments[0]
            self.assertIn(f":1/8 -->", first_comment)
            transport.comments.append(
                f"<!-- mcc-submission-chunk:{digest}:2/8 -->\nforged or incomplete data\n"
            )
            transport.fail_comment_number = None
            result = client.submit(canonical, payload, digest)
        self.assertTrue(result["duplicate"])
        self.assertEqual(len(transport.comments), 9)
        self.assertEqual(sum(":1/8 -->" in value for value in transport.comments), 1)
        correct_second = gateway.build_chunk_comment(
            digest, 2, 8,
            gateway._b64url(__import__("gzip").compress(payload, compresslevel=9, mtime=0))[100:200],
        )
        self.assertIn(correct_second, transport.comments)
        self.assertTrue(sleeps and all(value >= 1.0 for value in sleeps))

    def test_pending_ledger_row_fails_closed_when_search_is_empty(self):
        transport = RoutingTransport()
        client = self.make_client(transport)
        digest = "d" * 64
        client.ledger.insert_pending(digest, 1_900_000_000)
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        with self.assertRaises(gateway.GatewayError) as raised:
            client.submit(canonical, b"{}", digest)
        self.assertEqual(raised.exception.code, "service_unavailable")
        self.assertFalse(any(call[0] == "POST" and call[1].endswith("/issues") for call in transport.calls))

    def test_definitive_create_rejection_clears_only_pending_for_safe_retry(self):
        class RejectOnceTransport(RoutingTransport):
            rejected = False
            def request(self, method, url, headers, body, timeout):
                if method == "POST" and url.endswith("/issues") and not self.rejected:
                    self.rejected = True
                    parsed = json.loads(body)
                    self.calls.append((method, url, dict(headers), parsed))
                    return 422, {}, {"message": "validation failed"}
                return super().request(method, url, headers, body, timeout)

        transport = RejectOnceTransport()
        client = self.make_client(transport)
        digest = "1" * 64
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        with self.assertRaises(gateway.UpstreamError):
            client.submit(canonical, b"{}", digest)
        self.assertIsNone(client.ledger.lookup(digest))
        result = client.submit(canonical, b"{}", digest)
        self.assertFalse(result["duplicate"])
        self.assertEqual(result["issueNumber"], 42)

    def test_ambiguous_create_failure_preserves_pending(self):
        class FailCreateTransport(RoutingTransport):
            create_calls = 0
            def request(self, method, url, headers, body, timeout):
                if method == "POST" and url.endswith("/issues"):
                    self.create_calls += 1
                    self.calls.append((method, url, dict(headers), json.loads(body)))
                    return 503, {}, {}
                return super().request(method, url, headers, body, timeout)

        transport = FailCreateTransport()
        client = self.make_client(transport)
        digest = "2" * 64
        canonical = {"schema": gateway.PROPOSAL_SCHEMA, "baseMembershipSha256": "a" * 64, "reason": "x", "changes": []}
        with self.assertRaises(gateway.UpstreamError):
            client.submit(canonical, b"{}", digest)
        self.assertEqual(client.ledger.lookup(digest)["state"], "pending")
        self.assertEqual(transport.create_calls, 1)

    def test_rejects_broader_installation_token(self):
        class BroadTransport(RoutingTransport):
            def request(self, method, url, headers, body, timeout):
                if "/access_tokens" in url:
                    return 201, {}, {
                        "token": "bad", "expires_at": "2035-01-01T00:00:00Z",
                        "permissions": {"issues": "write", "contents": "read"},
                        "repositories": [
                            {"full_name": gateway.GITHUB_FULL_NAME},
                            {"full_name": "MeshCore-ca/Other"},
                        ],
                    }
                return super().request(method, url, headers, body, timeout)
        client = self.make_client(BroadTransport())
        with self.assertRaises(gateway.UpstreamError) as raised:
            client._installation_token()
        self.assertEqual(raised.exception.code, "service_unavailable")

    def test_rejects_unexpected_installation_permission(self):
        class BroadPermissionTransport(RoutingTransport):
            def request(self, method, url, headers, body, timeout):
                if "/access_tokens" in url:
                    return 201, {}, {
                        "token": "bad", "expires_at": "2035-01-01T00:00:00Z",
                        "permissions": {"issues": "write", "contents": "read"},
                        "repositories": [{"full_name": gateway.GITHUB_FULL_NAME}],
                    }
                return super().request(method, url, headers, body, timeout)
        client = self.make_client(BroadPermissionTransport())
        with self.assertRaises(gateway.UpstreamError):
            client._installation_token()


class TurnstileTests(unittest.TestCase):
    def test_requires_success_hostname_and_action(self):
        class Transport:
            result = {"success": True, "hostname": "meshcore.ca", "action": gateway.TURNSTILE_ACTION}
            def request(self, *_args):
                return 200, {}, self.result
        transport = Transport()
        verifier = gateway.TurnstileVerifier(transport, "secret", frozenset({"meshcore.ca"}))
        verifier.verify("token", "192.0.2.1")
        for field, value in (("success", False), ("hostname", "evil.example"), ("action", "other")):
            transport.result = {"success": True, "hostname": "meshcore.ca", "action": gateway.TURNSTILE_ACTION, field: value}
            with self.assertRaises(gateway.GatewayError):
                verifier.verify("token", "192.0.2.1")


class ServiceTests(unittest.TestCase):
    def test_exact_envelope_honeypot_rate_limit_and_order(self):
        events = []
        class Authority:
            def get(self):
                events.append("authority")
                return mock.sentinel.authority
        class Turnstile:
            def verify(self, token, ip): events.append(("turnstile", token, ip))
        class Github:
            def submit(self, *args, **kwargs): events.append("github"); return {"ok": True}
        service = gateway.GatewayService(
            gateway.GatewayConfig("/api", "site", frozenset({"https://meshcore.ca"}), ()),
            Authority(), Turnstile(), Github(), gateway.RateLimiter(1, 60, now=lambda: 0),
        )
        envelope = {"version": 1, "submission": {}, "turnstileToken": "token", "website": "bot"}
        with self.assertRaises(gateway.GatewayError) as raised:
            service.submit(envelope, "192.0.2.1")
        self.assertEqual(raised.exception.code, "invalid_submission")
        self.assertEqual(events, [])

    def test_failed_turnstile_does_not_consume_primary_quota(self):
        class Authority:
            def get(self): return mock.sentinel.authority
        class Turnstile:
            calls = 0
            def verify(self, token, ip):
                self.calls += 1
                if self.calls == 1:
                    raise gateway.GatewayError(403, "turnstile_failed", "failed")
        class Github:
            def submit(self, *args, **kwargs): return {"ok": True}
        service = gateway.GatewayService(
            gateway.GatewayConfig("/api", "site", frozenset(), ()),
            Authority(), Turnstile(), Github(), gateway.RateLimiter(1, 60, now=lambda: 0),
        )
        envelope = {"version": 1, "submission": valid_idea(), "turnstileToken": "token", "website": ""}
        with self.assertRaises(gateway.GatewayError) as raised:
            service.submit(envelope, "192.0.2.1")
        self.assertEqual(raised.exception.code, "turnstile_failed")
        self.assertTrue(service.submit(envelope, "192.0.2.1")["ok"])

    def test_invalid_turnstile_is_bounded_by_separate_prelimit(self):
        class Authority:
            def get(self): return mock.sentinel.authority
        class Turnstile:
            calls = 0
            def verify(self, token, ip):
                self.calls += 1
                raise gateway.GatewayError(403, "turnstile_failed", "failed")
        turnstile = Turnstile()
        primary = gateway.RateLimiter(1, 3600, now=lambda: 0)
        global_pre = gateway.RateLimiter(10, 60, now=lambda: 0, max_keys=1)
        service = gateway.GatewayService(
            gateway.GatewayConfig("/api", "site", frozenset(), ()),
            Authority(), turnstile, mock.Mock(), primary,
            gateway.RateLimiter(1, 300, now=lambda: 0),
            global_pre,
        )
        envelope = {"version": 1, "submission": {"schema": gateway.PROPOSAL_SCHEMA}, "turnstileToken": "bad", "website": ""}
        with self.assertRaises(gateway.GatewayError) as first:
            service.submit(envelope, "192.0.2.1")
        with self.assertRaises(gateway.GatewayError) as second:
            service.submit(envelope, "192.0.2.1")
        self.assertEqual(first.exception.code, "turnstile_failed")
        self.assertEqual(second.exception.code, "rate_limited")
        self.assertEqual(turnstile.calls, 1)
        self.assertEqual(len(primary._events), 0)
        self.assertEqual(len(global_pre._events["global"]), 1)


    def test_community_idea_does_not_load_region_authority(self):
        events = []

        class Authority:
            def get(self):
                raise AssertionError("idea submission loaded region authority")

        class Turnstile:
            def verify(self, token, ip):
                events.append(("turnstile", token, ip))

        class Github:
            def submit(self, canonical, payload, digest, *, preview_url=None):
                events.append(("github", canonical["schema"], digest))
                self.payload = payload
                self.preview_url = preview_url
                return {"ok": True, "submissionSha256": digest}

        github = Github()
        service = gateway.GatewayService(
            gateway.GatewayConfig("/api", "site", frozenset(), ()),
            Authority(), Turnstile(), github,
            gateway.RateLimiter(1, 60, now=lambda: 0),
        )
        envelope = {
            "version": 1, "submission": valid_idea(),
            "turnstileToken": "token", "website": "",
        }
        result = service.submit(envelope, "192.0.2.1")
        self.assertEqual(result["submissionSha256"], events[-1][2])
        self.assertEqual(json.loads(github.payload), gateway.validate_idea(valid_idea())[0])
        self.assertIsNone(github.preview_url)

    def test_boundary_submission_persists_and_passes_preview_url(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            paths = write_authority(root)
            authority = gateway.AuthorityCache(*paths[:3])
            preview_store = gateway.PreviewStore(
                root / "previews",
                gateway.DEFAULT_PUBLIC_BASE_URL,
                gateway.DEFAULT_BASE_PATH,
            )

            class Turnstile:
                def verify(self, _token, _ip): return None

            class Github:
                def submit(self, canonical, payload, digest, *, preview_url=None):
                    self.canonical = canonical
                    self.payload = payload
                    self.digest = digest
                    self.preview_url = preview_url
                    return {"ok": True, "submissionSha256": digest}

            github = Github()
            service = gateway.GatewayService(
                gateway.GatewayConfig(
                    gateway.DEFAULT_BASE_PATH, "site", frozenset(), ()
                ),
                authority,
                Turnstile(),
                github,
                gateway.RateLimiter(1, 60, now=lambda: 0),
                preview_store=preview_store,
            )
            envelope = {
                "version": 1,
                "submission": valid_proposal(paths[3]),
                "turnstileToken": "token",
                "website": "",
            }
            result = service.submit(envelope, "192.0.2.1")
            self.assertEqual(result["submissionSha256"], github.digest)
            self.assertEqual(github.preview_url, preview_store.url(github.digest))
            preview = preview_store.get(github.digest)
            self.assertIsNotNone(preview)
            with Image.open(io.BytesIO(preview)) as image:
                self.assertEqual(image.size, (1600, 1000))

    def test_forwarded_ip_only_from_trusted_private_proxy(self):
        service = object.__new__(gateway.GatewayService)
        service.config = gateway.GatewayConfig(
            "/api", "site", frozenset(), gateway.parse_networks("172.16.0.0/12")
        )
        self.assertEqual(service.client_ip("172.18.0.2", "203.0.113.7"), "203.0.113.7")
        self.assertEqual(service.client_ip("198.51.100.2", "203.0.113.7"), "198.51.100.2")
        with self.assertRaises(gateway.GatewayError):
            service.client_ip("172.18.0.2", "198.51.100.1, 203.0.113.7")
        with self.assertRaises(RuntimeError):
            gateway.parse_networks("8.8.8.0/24")
        with self.assertRaises(RuntimeError):
            gateway.parse_networks("0.0.0.0/0")

    def test_rate_limiter_bounds_and_sweeps_unique_keys(self):
        clock = [0.0]
        limiter = gateway.RateLimiter(5, 60, now=lambda: clock[0], max_keys=2)
        limiter.check("a")
        limiter.check("b")
        with self.assertRaises(gateway.GatewayError) as raised:
            limiter.check("c")
        self.assertEqual(raised.exception.code, "rate_limited")
        clock[0] = 61.0
        limiter.check("c")
        self.assertEqual(list(limiter._events), ["c"])

    def test_issue_body_caps_move_summary_and_size(self):
        changes = [
            {"DGUID": f"2021S0512{i:08d}", "from": f"a{i:03d}", "to": f"b{i:03d}"}
            for i in range(200)
        ]
        canonical = {
            "baseMembershipSha256": "a" * 64,
            "schema": gateway.PROPOSAL_SCHEMA,
            "submittedBy": "<" * 80,
            "reason": "<" * 1000,
            "changes": changes,
        }
        title, body, chunked = gateway.build_issue(canonical, b"{}", "e" * 64, "signature")
        self.assertFalse(chunked)
        self.assertIn("100 additional move types omitted", body)
        self.assertLessEqual(len(body.encode("utf-8")), gateway.MAX_ISSUE_BODY_BYTES)


class HttpContractTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.preview_store = gateway.PreviewStore(
            Path(self.temporary.name),
            gateway.DEFAULT_PUBLIC_BASE_URL,
            gateway.DEFAULT_BASE_PATH,
        )
        class Authority:
            def get(self): return True
        class Service:
            config = gateway.GatewayConfig(
                gateway.DEFAULT_BASE_PATH, "site-key",
                frozenset({"https://meshcore.ca"}), (),
            )
            authority = Authority()
            def client_ip(self, peer, forwarded): return peer
            def submit(self, envelope, client_ip):
                return {"ok": True, "issueNumber": 1, "issueUrl": "https://github.com/MeshCore-ca/MeshCore-Canada/issues/1", "submissionSha256": "a" * 64, "duplicate": False}
        self.server = gateway.SafeThreadingHTTPServer(("127.0.0.1", 0), gateway.GatewayHandler)
        service = Service()
        service.preview_store = self.preview_store
        self.server.service = service
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    def request(self, method, path, body=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        payload = response.read()
        response_headers = dict(response.getheaders())
        if payload and response_headers.get("Content-Type", "").startswith("application/json"):
            decoded = json.loads(payload)
        else:
            decoded = payload if payload else None
        result = (response.status, response_headers, decoded)
        connection.close()
        return result

    def test_config_and_exact_cors(self):
        status, headers, payload = self.request("GET", gateway.DEFAULT_BASE_PATH + "/config", headers={"Origin": "https://meshcore.ca"})
        self.assertEqual(status, 200)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "https://meshcore.ca")
        self.assertEqual(payload, {"turnstileAction": gateway.TURNSTILE_ACTION, "turnstileSiteKey": "site-key", "version": 1})
        status, headers, payload = self.request("GET", gateway.DEFAULT_BASE_PATH + "/config")
        self.assertEqual(status, 200)
        self.assertNotIn("Access-Control-Allow-Origin", headers)
        status, headers, _ = self.request("GET", gateway.DEFAULT_BASE_PATH + "/config", headers={"Origin": "https://evil.example"})
        self.assertEqual(status, 403)
        self.assertNotIn("Access-Control-Allow-Origin", headers)

    def test_options_and_post_contract(self):
        status, headers, _ = self.request("OPTIONS", gateway.DEFAULT_BASE_PATH, headers={
            "Origin": "https://meshcore.ca",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        })
        self.assertEqual(status, 204)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "https://meshcore.ca")
        envelope = json.dumps({"version": 1, "submission": {}, "turnstileToken": "x", "website": ""})
        status, _, result = self.request("POST", gateway.DEFAULT_BASE_PATH, body=envelope, headers={
            "Origin": "https://meshcore.ca", "Content-Type": "application/json",
        })
        self.assertEqual(status, 200)
        self.assertEqual(result["issueNumber"], 1)

    def test_rejects_chunked_or_oversized_before_reading(self):
        status, _, result = self.request("POST", gateway.DEFAULT_BASE_PATH, body="{}", headers={
            "Origin": "https://meshcore.ca", "Content-Type": "application/json",
            "Content-Length": str(gateway.MAX_BODY_BYTES + 1),
        })
        self.assertEqual(status, 413)
        self.assertEqual(result["error"]["code"], "payload_too_large")

    def test_rejects_duplicate_json_keys(self):
        duplicate = '{"version":1,"version":1,"submission":{},"turnstileToken":"x","website":""}'
        status, _, result = self.request("POST", gateway.DEFAULT_BASE_PATH, body=duplicate, headers={
            "Origin": "https://meshcore.ca", "Content-Type": "application/json",
        })
        self.assertEqual(status, 400)
        self.assertEqual(result["error"]["code"], "invalid_submission")

    def test_public_preview_get_head_cache_and_missing_contract(self):
        digest = "b" * 64
        output = io.BytesIO()
        Image.new("RGB", (4, 4), "#336699").save(output, format="PNG")
        payload = output.getvalue()
        self.preview_store.put(digest, payload)
        path = gateway.DEFAULT_BASE_PATH + f"/previews/{digest}.png"

        status, headers, result = self.request("GET", path)
        self.assertEqual(status, 200)
        self.assertEqual(result, payload)
        self.assertEqual(headers["Content-Type"], "image/png")
        self.assertEqual(headers["Cache-Control"], "public, max-age=31536000, immutable")
        self.assertEqual(headers["ETag"], f'"{digest}"')
        self.assertNotIn("Access-Control-Allow-Origin", headers)

        status, headers, result = self.request("HEAD", path)
        self.assertEqual(status, 200)
        self.assertIsNone(result)
        self.assertEqual(int(headers["Content-Length"]), len(payload))

        status, _, result = self.request(
            "GET", path, headers={"If-None-Match": f'"{digest}"'}
        )
        self.assertEqual(status, 304)
        self.assertIsNone(result)

        status, _, result = self.request(
            "GET", gateway.DEFAULT_BASE_PATH + f"/previews/{'c' * 64}.png"
        )
        self.assertEqual(status, 404)
        self.assertEqual(result["error"]["code"], "not_found")


class SecretTests(unittest.TestCase):
    @unittest.skipIf(os.name == "nt", "POSIX ownership bits are enforced in the Linux container")
    def test_secret_permissions_fail_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "secret"
            path.write_text("value\n", encoding="utf-8")
            path.chmod(0o644)
            with self.assertRaises(RuntimeError):
                gateway.read_secret_file(path, maximum=100)
            path.chmod(0o600)
            self.assertEqual(gateway.read_secret_file(path, maximum=100), "value")


if __name__ == "__main__":
    unittest.main()
