from __future__ import annotations

import base64
import gzip
import hashlib
import importlib.util
import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[2]


def load_script(name: str):
    path = ROOT / "scripts" / name
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


apply_issue = load_script("apply-approved-region-issue.py")
fetch_sources = load_script("fetch-locked-region-sources.py")


def encoded_payload(payload: bytes) -> str:
    return base64.urlsafe_b64encode(
        gzip.compress(payload, compresslevel=9, mtime=0)
    ).rstrip(b"=").decode("ascii")


class PayloadTests(unittest.TestCase):
    def setUp(self):
        self.proposal = {
            "baseMembershipSha256": "a" * 64,
            "changes": [{"DGUID": "2021S0512TEST0001", "from": "aaa", "to": "bbb"}],
            "reason": "Keep the lake with the city.",
            "schema": apply_issue.PROPOSAL_SCHEMA,
        }
        self.payload = apply_issue.canonical_bytes(self.proposal)
        self.digest = hashlib.sha256(self.payload).hexdigest()
        self.bots = {"meshcore-canada-submissions[bot]"}

    def test_extracts_hidden_and_legacy_inline_payloads(self):
        hidden = (
            "<!-- submission-payload-gzip-base64url:"
            + encoded_payload(self.payload)
            + " -->"
        )
        self.assertEqual(
            apply_issue.extract_payload(hidden, [], self.digest, self.bots),
            self.payload,
        )
        legacy = "### Canonical proposal JSON\n\n```json\n" + self.payload.decode() + "\n```\n"
        self.assertEqual(
            apply_issue.extract_payload(legacy, [], self.digest, self.bots),
            self.payload,
        )

    def test_extracts_hidden_chunk_payloads_from_the_submission_bot(self):
        encoded = encoded_payload(self.payload)
        midpoint = len(encoded) // 2
        body = "<!-- submission-payload-chunks:2 -->"
        comments = [
            {
                "user": {"login": "meshcore-canada-submissions[bot]"},
                "body": (
                    f"<!-- mcc-submission-chunk:{self.digest}:1/2 -->\n"
                    f"<!-- submission-payload-chunk-gzip-base64url:{encoded[:midpoint]} -->"
                ),
            },
            {
                "user": {"login": "meshcore-canada-submissions[bot]"},
                "body": (
                    f"<!-- mcc-submission-chunk:{self.digest}:2/2 -->\n"
                    f"<!-- submission-payload-chunk-gzip-base64url:{encoded[midpoint:]} -->"
                ),
            },
        ]
        self.assertEqual(
            apply_issue.extract_payload(body, comments, self.digest, self.bots),
            self.payload,
        )
        comments[1]["user"]["login"] = "attacker"
        with self.assertRaisesRegex(ValueError, "submission App"):
            apply_issue.extract_payload(body, comments, self.digest, self.bots)

    def test_signature_verification_fails_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            key = Path(temporary) / "public.pem"
            key.write_text("public", encoding="ascii")
            with mock.patch.object(apply_issue.shutil, "which", return_value="openssl"), mock.patch.object(
                apply_issue.subprocess,
                "run",
                return_value=mock.Mock(returncode=1),
            ):
                with self.assertRaisesRegex(ValueError, "verification failed"):
                    apply_issue.verify_signature(key, b"message", b"signature")


class ApprovalTests(unittest.TestCase):
    def setUp(self):
        self.config = {
            "schema": apply_issue.AUTOMATION_SCHEMA,
            "label": "boundary-update",
            "repository": "MeshCore-ca/MeshCore-Canada",
            "approvers": ["MrAlders0n", "n30nex"],
            "submissionBots": ["meshcore-canada-submissions[bot]"],
        }
        self.issue = {
            "number": 47,
            "html_url": "https://github.com/MeshCore-ca/MeshCore-Canada/issues/47",
            "state": "closed",
            "state_reason": "completed",
            "closed_at": "2026-07-16T17:20:00Z",
            "closed_by": {"login": "MrAlders0n"},
            "user": {"login": "meshcore-canada-submissions[bot]"},
            "labels": [{"name": "boundary-update"}],
        }
        self.event = {
            "action": "closed",
            "sender": {"login": "MrAlders0n"},
            "issue": self.issue,
        }

    def test_completed_boundary_issue_from_approver_is_accepted(self):
        _, number, url, date = apply_issue.validate_event(self.event, self.config)
        self.assertEqual((number, url, date), (47, self.issue["html_url"], "2026-07-16"))

    def test_rejection_and_unapproved_closer_are_ignored_fail_closed(self):
        self.issue["state_reason"] = "not_planned"
        with self.assertRaisesRegex(ValueError, "not closed as completed"):
            apply_issue.validate_event(self.event, self.config)
        self.issue["state_reason"] = "completed"
        self.event["sender"]["login"] = "random-user"
        with self.assertRaisesRegex(ValueError, "approved maintainer"):
            apply_issue.validate_event(self.event, self.config)


class ProposalValidationTests(unittest.TestCase):
    def test_current_anchor_cannot_be_moved(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            membership = root / "membership.csv"
            membership.write_text(
                "DGUID,PRUID,CSDUID,leaf_tag\n"
                "d1,35,3500001,aaa\n"
                "d2,35,3500002,bbb\n"
                "d3,35,3500001,aaa\n",
                encoding="utf-8",
            )
            catalog = root / "catalog.json"
            catalog.write_text(
                """{
  "hierarchy": {
    "can": {"parent": null},
    "on": {"parent": "can"},
    "aaa": {"parent": "on"},
    "bbb": {"parent": "on"}
  }
}
""",
                encoding="utf-8",
            )
            cells = root / "cells"
            cells.mkdir()
            (cells / "cells-35.topo.json").write_text(
                """{
  "type": "Topology",
  "objects": {
    "cells": {
      "geometries": [
        {"properties": {"DGUID": "d1", "PRUID": "35", "leaf_tag": "aaa", "seed_tag": "aaa"}},
        {"properties": {"DGUID": "d2", "PRUID": "35", "leaf_tag": "bbb", "seed_tag": "bbb"}},
        {"properties": {"DGUID": "d3", "PRUID": "35", "leaf_tag": "aaa", "seed_tag": ""}}
      ]
    }
  }
}
""",
                encoding="utf-8",
            )

            proposal = {
                "schema": apply_issue.PROPOSAL_SCHEMA,
                "baseMembershipSha256": apply_issue.file_sha256(membership),
                "reason": "Keep the municipality intact.",
                "changes": [{"DGUID": "d1", "from": "aaa", "to": "bbb"}],
            }
            payload = apply_issue.canonical_bytes(proposal)
            with self.assertRaisesRegex(ValueError, "current region anchor"):
                apply_issue.validate_proposal(
                    proposal,
                    payload,
                    hashlib.sha256(payload).hexdigest(),
                    membership,
                    catalog,
                    cells,
                )

            proposal["changes"] = [{"DGUID": "d3", "from": "aaa", "to": "bbb"}]
            payload = apply_issue.canonical_bytes(proposal)
            _, changes, requested = apply_issue.validate_proposal(
                proposal,
                payload,
                hashlib.sha256(payload).hexdigest(),
                membership,
                catalog,
                cells,
            )
            self.assertEqual(changes[0]["DGUID"], "d3")
            self.assertEqual(requested, {"d3": "bbb"})


class DecisionTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"DGUID": "d1", "PRUID": "35", "CSDUID": "3500001", "leaf_tag": "aaa"},
            {"DGUID": "d2", "PRUID": "35", "CSDUID": "3500001", "leaf_tag": "aaa"},
            {"DGUID": "d3", "PRUID": "35", "CSDUID": "3500001", "leaf_tag": "aaa"},
        ]

    @staticmethod
    def overrides():
        return {
            "schema": apply_issue.OVERRIDES_SCHEMA,
            "censusVintage": 2021,
            "cohortOverrides": [],
            "splitExceptions": [],
        }

    def test_partial_csd_change_becomes_complete_split_exception(self):
        overrides = self.overrides()
        touched = apply_issue.record_decision(
            overrides,
            self.rows,
            {"d1": "bbb"},
            "The shoreline belongs with the neighbouring city.",
            47,
            "https://github.com/MeshCore-ca/MeshCore-Canada/issues/47",
            "2026-07-16",
            "MrAlders0n",
        )
        self.assertEqual(touched, ["3500001"])
        split = overrides["splitExceptions"][0]
        self.assertEqual(
            split["members"],
            [
                {"dguid": "d1", "leafTag": "bbb"},
                {"dguid": "d2", "leafTag": "aaa"},
                {"dguid": "d3", "leafTag": "aaa"},
            ],
        )
        self.assertEqual(split["sourceIssue"].rsplit("/", 1)[-1], "47")

    def test_whole_csd_change_becomes_csd_override(self):
        overrides = self.overrides()
        apply_issue.record_decision(
            overrides,
            self.rows,
            {"d1": "bbb", "d2": "bbb", "d3": "bbb"},
            "Keep the municipality together.",
            48,
            "https://github.com/MeshCore-ca/MeshCore-Canada/issues/48",
            "2026-07-16",
            "n30nex",
        )
        self.assertEqual(overrides["splitExceptions"], [])
        self.assertEqual(
            {key: overrides["cohortOverrides"][0][key] for key in ("level", "id", "leafTag")},
            {"level": "CSD", "id": "3500001", "leafTag": "bbb"},
        )

    def test_source_lock_tracks_new_override_bytes(self):
        lock = {"sources": [{"id": apply_issue.SOURCE_ID, "bytes": 0, "sha256": "0" * 64}]}
        payload = b"updated overrides\n"
        apply_issue.update_source_lock(lock, payload)
        self.assertEqual(lock["sources"][0]["bytes"], len(payload))
        self.assertEqual(lock["sources"][0]["sha256"], hashlib.sha256(payload).hexdigest())


class SourceFetchTests(unittest.TestCase):
    def test_locked_archive_download_and_safe_extract(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source_archive = root / "source.zip"
            with zipfile.ZipFile(source_archive, "w") as archive:
                archive.writestr("shape/test.shp", b"shape")
                archive.writestr("shape/test.dbf", b"table")
            source = {
                "id": "test",
                "url": source_archive.as_uri(),
                "bytes": source_archive.stat().st_size,
                "sha256": fetch_sources.file_sha256(source_archive),
            }
            cached = root / "cache" / "source.zip"
            fetch_sources.download(source, cached)
            self.assertEqual(fetch_sources.file_sha256(cached), source["sha256"])
            shapefile = fetch_sources.safe_extract(cached, root / "extracted", source["sha256"])
            self.assertEqual(shapefile.read_bytes(), b"shape")

    def test_download_retries_same_size_sha_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            expected = b"good archive bytes"
            corrupted = b"bad! archive bytes"
            source = {
                "id": "test",
                "url": "https://example.invalid/source.zip",
                "bytes": len(expected),
                "sha256": hashlib.sha256(expected).hexdigest(),
            }
            destination = root / "cache" / "source.zip"
            responses = [io.BytesIO(corrupted), io.BytesIO(expected)]
            with mock.patch.object(
                fetch_sources.urllib.request,
                "urlopen",
                side_effect=responses,
            ) as urlopen:
                fetch_sources.download(
                    source,
                    destination,
                    retry_delay_seconds=0,
                )
            self.assertEqual(urlopen.call_count, 2)
            self.assertEqual(destination.read_bytes(), expected)

    def test_download_fails_closed_after_persistent_sha_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            expected = b"good archive bytes"
            corrupted = b"bad! archive bytes"
            source = {
                "id": "test",
                "url": "https://example.invalid/source.zip",
                "bytes": len(expected),
                "sha256": hashlib.sha256(expected).hexdigest(),
            }
            destination = root / "cache" / "source.zip"

            def corrupt_response(*_args, **_kwargs):
                return io.BytesIO(corrupted)

            with mock.patch.object(
                fetch_sources.urllib.request,
                "urlopen",
                side_effect=corrupt_response,
            ) as urlopen:
                with self.assertRaisesRegex(RuntimeError, "after 3 attempts"):
                    fetch_sources.download(
                        source,
                        destination,
                        retry_delay_seconds=0,
                    )
            self.assertEqual(urlopen.call_count, 3)
            self.assertFalse(destination.exists())
            self.assertFalse((destination.parent / ".source.zip.tmp").exists())

    def test_zip_traversal_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive_path = root / "bad.zip"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("../outside.shp", b"bad")
            with self.assertRaisesRegex(ValueError, "unsafe ZIP"):
                fetch_sources.safe_extract(archive_path, root / "extract", "a" * 64)


if __name__ == "__main__":
    unittest.main()
