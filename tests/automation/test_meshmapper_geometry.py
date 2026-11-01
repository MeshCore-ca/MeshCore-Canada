import copy
import runpy
import unittest
from pathlib import Path

inspect_geometry = runpy.run_path(str(Path(__file__).resolve().parents[2] / "scripts/check-meshmapper-geometry.py"))["inspect_geometry"]


class MeshMapperGeometryTests(unittest.TestCase):
    def test_reports_invalid_and_missing_shapes_without_changing_them(self):
        data = {"features": [
            {"properties": {"tag": "yqb", "center": [0, 0]}, "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]}},
            {"properties": {"tag": "yow", "center": [0, 0], "hasBoundary": True}, "geometry": None},
            {"properties": {"tag": "ykf", "center": [0, 0], "hasBoundary": False}, "geometry": None},
        ]}
        before = copy.deepcopy(data)
        issues = inspect_geometry(data)
        self.assertEqual([item["kind"] for item in issues], ["invalid-boundary", "unusable-stored-boundary"])
        self.assertEqual(data, before)

    def test_valid_boundary_and_outside_display_center_are_distinct(self):
        feature = {"properties": {"tag": "ykf", "center": [1, 1]}, "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]}}
        self.assertEqual(inspect_geometry({"features": [feature]}), [])
        feature["properties"]["center"] = [3, 3]
        self.assertEqual(inspect_geometry({"features": [feature]})[0]["kind"], "center-outside-boundary")


compare_maps = runpy.run_path(str(Path(__file__).resolve().parents[2] / "scripts/compare-region-maps.py"))["compare_maps"]


class RegionMapComparisonTests(unittest.TestCase):
    @staticmethod
    def region(tag, source, east):
        return {"properties": {"tag": tag, "regionSource": source},
                "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [east, 0], [east, 1], [0, 1], [0, 0]]]}}

    def test_reports_how_far_each_region_moved(self):
        before = {"features": [self.region("yow", "meshmapper", 10), self.region("yow", "meshcore-canada", 5), self.region("ykf", "meshmapper", 4)]}
        after = {"features": [self.region("yow", "meshmapper", 10.05), self.region("yow", "meshcore-canada", 5), self.region("yxu", "meshmapper", 4)]}
        report = compare_maps(before, after)
        self.assertEqual([(c["tag"], c["source"], c["percent"]) for c in report["changes"]], [("yow", "meshmapper", 0.5)])
        self.assertGreater(report["changes"][0]["shiftKm"], 1)
        self.assertEqual(report["added"], ["yxu (meshmapper)"])
        self.assertEqual(report["removed"], ["ykf (meshmapper)"])

    def test_a_thin_spike_moves_an_edge_far_but_adds_little_area(self):
        square = [[-80, 45], [-79, 45], [-79, 46], [-80, 46], [-80, 45]]
        spiked = [[-80, 45], [-79, 45], [-79, 45.5], [-78.5, 45.5005], [-79, 45.501], [-79, 46], [-80, 46], [-80, 45]]
        feature = lambda ring: {"properties": {"tag": "yow", "regionSource": "meshmapper"}, "geometry": {"type": "Polygon", "coordinates": [ring]}}
        change = compare_maps({"features": [feature(square)]}, {"features": [feature(spiked)]})["changes"][0]
        self.assertLess(change["percent"], 0.1)
        self.assertGreater(change["shiftKm"], 30)

    def test_tiny_rebuild_slivers_do_not_count_as_reach(self):
        square = [[-80, 45], [-79, 45], [-79, 46], [-80, 46], [-80, 45]]
        sliver = [[-76, 45], [-75.999, 45], [-75.999, 45.0001], [-76, 45]]
        before = {"features": [{"properties": {"tag": "yqa", "regionSource": "meshcore-canada"}, "geometry": {"type": "Polygon", "coordinates": [square]}}]}
        after = {"features": [{"properties": {"tag": "yqa", "regionSource": "meshcore-canada"}, "geometry": {"type": "MultiPolygon", "coordinates": [[square], [sliver]]}}]}
        change = compare_maps(before, after)["changes"][0]
        self.assertEqual(change["shiftKm"], 0)
