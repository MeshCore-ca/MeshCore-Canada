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

    def test_overdue_review_is_only_a_warning(self) -> None:
        self.write("index.md", VALID)
        problems = MODULE.validate_tree(self.docs, dt.date(2026, 10, 20))
        self.assertEqual(["index.md: warning: verified page is due for review since 2026-10-19"], problems)
        self.assertTrue(all(MODULE.is_warning(problem) for problem in problems))

    def test_an_error_that_quotes_the_warning_text_still_fails(self) -> None:
        page = VALID.replace("scope: canada-baseline", "scope: \"warning: verified page is due for review\"")
        self.write("index.md", page)
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertEqual(1, len(problems))
        self.assertIn("unsupported scope", problems[0])
        self.assertFalse(MODULE.is_warning(problems[0]))

    def test_cache_busted_local_asset_passes(self) -> None:
        self.write("assets/app.js", "console.log('fixture');\n")
        page = VALID.replace(
            "evidence: fixture-review",
            "evidence: fixture-review\npage_scripts:\n  - assets/app.js?v=20260722-2",
        )
        self.write("index.md", page)
        self.assertEqual([], MODULE.validate_tree(self.docs, self.today))

    def test_page_preloads_must_be_local_assets_that_exist(self) -> None:
        self.write("assets/lib.js", "console.log('fixture');\n")
        page = VALID.replace(
            "evidence: fixture-review",
            "evidence: fixture-review\npage_preloads:\n  - assets/lib.js\n  - assets/missing.css",
        )
        self.write("index.md", page)
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertEqual(["index.md: page_preloads asset does not exist: assets/missing.css"], problems)

    def test_page_preconnects_must_be_https_origins(self) -> None:
        page = VALID.replace(
            "evidence: fixture-review",
            "evidence: fixture-review\npage_preconnects:\n  - https://tile.openstreetmap.org\n"
            "  - http://insecure.example\n  - https://example.org/path",
        )
        self.write("index.md", page)
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertEqual([
            "index.md: page_preconnects must be HTTPS origins: http://insecure.example",
            "index.md: page_preconnects must be HTTPS origins: https://example.org/path",
        ], problems)

    def test_missing_front_matter_fails(self) -> None:
        self.write("index.md", "# Missing metadata\n\nThis page has content but no lifecycle contract.")
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertTrue(any("missing YAML front matter" in item for item in problems))

    def test_duplicate_title_and_description_fail(self) -> None:
        self.write("one.md", VALID)
        self.write("two.md", VALID)
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertTrue(any("duplicate en title" in item for item in problems))
        self.assertTrue(any("duplicate en description" in item for item in problems))

    def test_destructive_page_requires_recovery_sections(self) -> None:
        self.write("flash.md", VALID.replace("evidence: fixture-review", "evidence: fixture-review\ndestructive: true"))
        problems = MODULE.validate_tree(self.docs, self.today)
        self.assertTrue(any("preflight or backup" in item for item in problems))
        self.assertTrue(any("verification" in item for item in problems))
        self.assertTrue(any("recovery" in item for item in problems))

    def test_destructive_page_accepts_plain_language_verification_headings(self) -> None:
        for heading in ("Check the flash", "Make sure the update worked"):
            with self.subTest(heading=heading):
                page = VALID.replace(
                    "evidence: fixture-review",
                    "evidence: fixture-review\ndestructive: true",
                )
                page += f"""

## Before you begin

Back up the current settings and prepare the exact recovery file before changing the device.

## {heading}

Confirm that the device starts, reports the intended version, and keeps its saved settings.

## Recovery

Restore the saved settings or reflash the exact device target if the check does not pass.
"""
                self.write("flash.md", page)
                self.assertEqual([], MODULE.validate_tree(self.docs, self.today))


    def test_destructive_page_accepts_french_safety_headings(self) -> None:
        page = VALID.replace(
            "evidence: fixture-review",
            "evidence: fixture-review\ndestructive: true",
        )
        page += """

## Avant de commencer

Sauvegardez les réglages actuels et préparez le fichier de récupération avant de modifier l’appareil.

## Vérifier le résultat

Confirmez que l’appareil démarre, affiche la bonne version et conserve ses réglages.

## Récupération

Restaurez les réglages sauvegardés ou réinstallez le micrologiciel exact si la vérification échoue.
"""
        self.write("flash.fr.md", page)
        self.assertEqual([], MODULE.validate_tree(self.docs, self.today))

    def test_same_title_and_description_are_allowed_across_locales(self) -> None:
        self.write("index.md", VALID)
        self.write("index.fr.md", VALID)
        self.assertEqual([], MODULE.validate_tree(self.docs, self.today))


if __name__ == "__main__":
    unittest.main()
