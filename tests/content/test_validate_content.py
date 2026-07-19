from __future__ import annotations

import datetime as dt
import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "validate-content.py"
SPEC = importlib.util.spec_from_file_location("validate_content", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


VALID = """---
title: Test companion setup
description: A complete and distinct description for a test setup page.
audience:
  - first-time-user
task: test-companion
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2026-10-19
evidence: fixture-review
---
# Test companion setup

This fixture has enough useful body content to represent a real public page and pass the material-content floor.
"""


class ContentValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.docs = Path(self.temporary.name) / "docs"
        self.docs.mkdir()
        self.today = dt.date(2026, 7, 19)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write(self, name: str, content: str) -> None:
        path = self.docs / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def test_valid_page_passes(self) -> None:
        self.write("index.md", VALID)
        self.assertEqual([], MODULE.validate_tree(self.docs, self.today))

    def test_missing_front_matter_fails(self) -> None:
        self.write("index.md", "# Missing metadata\n\nThis page has content but no lifecycle contract.")
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertTrue(any("missing YAML front matter" in item for item in problems))

    def test_duplicate_title_and_description_fail(self) -> None:
        self.write("one.md", VALID)
        self.write("two.md", VALID)
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertTrue(any("duplicate title" in item for item in problems))
        self.assertTrue(any("duplicate description" in item for item in problems))

    def test_destructive_page_requires_recovery_sections(self) -> None:
        self.write("flash.md", VALID.replace("evidence: fixture-review", "evidence: fixture-review\ndestructive: true"))
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertTrue(any("preflight or backup" in item for item in problems))
        self.assertTrue(any("verification" in item for item in problems))
        self.assertTrue(any("recovery" in item for item in problems))


if __name__ == "__main__":
    unittest.main()
