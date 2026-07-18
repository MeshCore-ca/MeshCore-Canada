from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

import geopandas as gpd
from shapely.geometry import Point


ROOT = Path(__file__).resolve().parents[2]


def load_script(name: str):
    path = ROOT / "scripts" / name
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


apply_issue = load_script("apply-approved-region-issue.py")
materialize_regions = load_script("materialize-approved-new-regions.py")
generate_partition = load_script("generate-region-partition.py")


class NewRegionAutomationTests(unittest.TestCase):
    def test_v2_proposal_records_and_materializes_one_new_leaf(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            membership = root / "membership.csv"
            membership.write_text(
                "DGUID,PRUID,CSDUID,leaf_tag\n"
                "2021S0512TEST0001,35,3500001,aaa\n"
                "2021S0512TEST0002,35,3500002,bbb\n"
                "2021S0512TEST0003,35,3500003,aaa\n",
                encoding="utf-8",
            )
            catalog_value = {
                "strategy": {
                    "hierarchyNodes": 5,
                    "sourceSelectableRegions": 2,
                    "generatedLeafRegions": 2,
                },
                "hierarchy": {
                    "can": {"label": "Canada", "parent": None},
                    "on": {"label": "Ontario", "parent": "can"},
                    "on-local": {"label": "Ontario Local", "parent": "on"},
                    "aaa": {"label": "Alpha", "parent": "on-local"},
                    "bbb": {"label": "Beta", "parent": "on-local"},
                },
                "status": {"can": {}, "on": {}, "on-local": {}, "aaa": {}, "bbb": {}},
                "seeds": [
                    {"tag": "aaa", "lat": 43.0, "lon": -80.0},
                    {"tag": "bbb", "lat": 44.0, "lon": -79.0},
                ],
                "aliases": {"aaa": ["aaa", "Alpha"], "bbb": ["bbb", "Beta"]},
                "metroGroups": [{"label": "Ontario", "tags": ["aaa", "bbb"]}],
                "externalRegionPaths": {},
                "retiredCanonicalTags": [],
            }
            catalog = root / "catalog.json"
            catalog.write_text(json.dumps(catalog_value), encoding="utf-8")
            cells = root / "cells"
            cells.mkdir()
            (cells / "cells-35.topo.json").write_text(
                json.dumps({
                    "type": "Topology",
                    "objects": {"cells": {"geometries": [
                        {"properties": {"DGUID": "2021S0512TEST0001", "PRUID": "35", "leaf_tag": "aaa", "seed_tag": "aaa"}},
                        {"properties": {"DGUID": "2021S0512TEST0002", "PRUID": "35", "leaf_tag": "bbb", "seed_tag": "bbb"}},
                        {"properties": {"DGUID": "2021S0512TEST0003", "PRUID": "35", "leaf_tag": "aaa", "seed_tag": ""}},
                    ]}},
                }),
                encoding="utf-8",
            )
            proposal = {
                "schema": apply_issue.NEW_REGION_PROPOSAL_SCHEMA,
                "baseMembershipSha256": apply_issue.file_sha256(membership),
                "newRegion": {
                    "tag": "delta",
                    "label": "Delta County",
                    "parent": "on-local",
                    "anchorDguid": "2021S0512TEST0003",
                },
                "reason": "This radio community needs its own local region.",
                "changes": [
                    {"DGUID": "2021S0512TEST0003", "from": "aaa", "to": "delta"}
                ],
            }
            payload = apply_issue.canonical_bytes(proposal)
            rows, changes, requested, matched, new_region = apply_issue.validate_proposal(
                proposal,
                payload,
                hashlib.sha256(payload).hexdigest(),
                membership,
                catalog,
                cells,
            )
            self.assertTrue(matched)
            self.assertEqual(new_region, proposal["newRegion"])
            self.assertEqual(requested, {"2021S0512TEST0003": "delta"})

            overrides = {
                "schema": apply_issue.OVERRIDES_SCHEMA,
                "censusVintage": 2021,
                "cohortOverrides": [],
                "splitExceptions": [],
                "newRegions": [],
            }
            issue_url = "https://github.com/MeshCore-ca/MeshCore-Canada/issues/99"
            apply_issue.record_decision(
                overrides, rows, requested, proposal["reason"], 99, issue_url,
                "2026-07-18", "n30nex",
            )
            apply_issue.record_new_region(
                overrides, new_region, proposal["reason"], 99, issue_url,
                "2026-07-18", "n30nex",
            )
            self.assertEqual(overrides["newRegions"][0]["tag"], "delta")

            digital = gpd.GeoDataFrame(
                [{"DGUID": "2021S0512TEST0003", "PRUID": "35", "geometry": Point(-79.5, 43.5)}],
                crs="EPSG:4326",
            )
            added = materialize_regions.materialize(catalog_value, overrides, digital)
            self.assertEqual(added, ["delta"])
            self.assertEqual(catalog_value["hierarchy"]["delta"]["parent"], "on-local")
            self.assertEqual(catalog_value["strategy"]["hierarchyNodes"], 6)
            self.assertEqual(catalog_value["strategy"]["generatedLeafRegions"], 3)
            self.assertEqual(catalog_value["strategy"]["sourceSelectableRegions"], 3)
            self.assertEqual(materialize_regions.materialize(catalog_value, overrides, digital), [])
            self.assertEqual(catalog_value["strategy"]["sourceSelectableRegions"], 3)


    def test_community_approved_seed_stays_out_of_frozen_provisional_basis(self):
        hierarchy = {
            "aaa": {"basis": "established"},
            "delta": {"basis": "community-approved"},
        }
        self.assertEqual(
            generate_partition.provisional_seed_tags(hierarchy, ["aaa", "delta"]),
            ["aaa"],
        )

    def test_approved_split_allows_old_and_new_anchors_in_one_municipality(self):
        digital = gpd.GeoDataFrame(
            [
                {"DGUID": "d1", "CSDUID": "3500001", "CDUID": "35001", "geometry": Point(0, 0)},
                {"DGUID": "d2", "CSDUID": "3500001", "CDUID": "35001", "geometry": Point(1, 0)},
            ],
            crs="EPSG:3347",
        )
        representatives = digital.geometry.copy()
        seeds = gpd.GeoDataFrame(
            [
                {"tag": "aaa", "CSDUID": "3500001", "CDUID": "35001", "geometry": Point(0, 0)},
                {"tag": "delta", "CSDUID": "3500001", "CDUID": "35001", "geometry": Point(1, 0)},
            ],
            crs=digital.crs,
        )
        provisional = {"d1": "aaa", "d2": "aaa"}
        jurisdictions = {"aaa": "on", "delta": "on"}
        registry_ids = {"aaa": "mcc:aaa", "delta": "mcc:delta"}
        without_review = {"cohortOverrides": [], "splitExceptions": []}
        with self.assertRaisesRegex(ValueError, "reviewed split exception"):
            generate_partition.apply_census_coherence(
                digital, representatives, seeds, provisional, jurisdictions,
                registry_ids, without_review, None,
            )
        reviewed = {
            "cohortOverrides": [],
            "splitExceptions": [{
                "csduid": "3500001",
                "status": "approved",
                "members": [
                    {"dguid": "d1", "leafTag": "aaa"},
                    {"dguid": "d2", "leafTag": "delta"},
                ],
            }],
        }
        owners, assignments, stats = generate_partition.apply_census_coherence(
            digital, representatives, seeds, provisional, jurisdictions,
            registry_ids, reviewed, None,
        )
        self.assertEqual(owners, {"d1": "aaa", "d2": "delta"})
        self.assertEqual(assignments["d2"], "approved-csd-split:3500001")
        self.assertEqual(stats["approvedSplitExceptions"], 1)
if __name__ == "__main__":
    unittest.main()
