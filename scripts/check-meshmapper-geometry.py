#!/usr/bin/env python3
"""Report candidate geometry problems without altering or publishing coordinates."""
import hashlib
import json
import sys
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.validation import explain_validity


def inspect_geometry(data):
    issues = []
    for feature in data["features"]:
        properties = feature["properties"]
        tag = properties["tag"]
        if feature["geometry"] is None:
            if properties.get("hasBoundary"):
                issues.append({"tag": tag, "kind": "unusable-stored-boundary"})
            continue
        geometry = shape(feature["geometry"])
        if not geometry.is_valid or geometry.is_empty:
            issues.append({"tag": tag, "kind": "invalid-boundary", "detail": explain_validity(geometry)})
        elif not geometry.covers(Point(*properties["center"])):
            issues.append({"tag": tag, "kind": "center-outside-boundary"})
    return issues


if __name__ == "__main__":
    source = Path(sys.argv[1]).read_bytes()
    issues = inspect_geometry(json.loads(source))
    report = {"candidateSha256": hashlib.sha256(source).hexdigest(), "issues": issues}
    target = Path(sys.argv[2])
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Geometry review: {len(issues)} issue(s); coordinates unchanged. See {target}")
