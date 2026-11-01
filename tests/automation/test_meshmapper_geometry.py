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
