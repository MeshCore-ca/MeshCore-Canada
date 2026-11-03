from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "build-cross-border-scopes.py"
SPEC = importlib.util.spec_from_file_location("build_cross_border_scopes", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


ENTRY = """\
  - scope: onny
    name: Ontario–New York
    nameFr: Ontario–New York
    description: Applied to repeaters that connect New York and Ontario.
    descriptionFr: Pour les répéteurs qui relient l’État de New York et l’Ontario.
    provinces: [on]
"""

CATALOG = {"hierarchy": {
    "ytr": {"label": "Quinte West", "kind": "city"},
    "yow": {"label": "Ottawa–Gatineau", "kind": "city"},
    "on": {"label": "Ontario", "kind": "province"},
    "onqc": {"label": "Ontario + Québec", "kind": "mesh-scope"},
}}

POLICY = {
    "provinces": {code: {"label": code.upper()} for code in ["bc", "ab", "on", "qc", "ns"]},
    "meshScopes": {"onqc": ["on", "qc"]},
    "reservedScopes": ["can", "na"],
}


class CrossBorderScopesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.dir = Path(self.temporary.name)
        self.source = self.dir / "scopes.yml"
        self.policy = self.dir / "policy.json"
        self.catalog = self.dir / "catalog.json"
        self.output = self.dir / "out" / "cross-border-scopes.json"
        self.policy.write_text(json.dumps(POLICY), encoding="utf-8")
        self.catalog.write_text(json.dumps(CATALOG), encoding="utf-8")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write(self, body: str) -> None:
        self.source.write_text(body, encoding="utf-8")

    def scopes(self, *entries: str) -> str:
        return "scopes:\n" + "".join(entries)

    def run_main(self, *extra: str) -> tuple[int, str]:
        err = io.StringIO()
        with contextlib.redirect_stderr(err), contextlib.redirect_stdout(io.StringIO()):
            code = MODULE.main(["--source", str(self.source), "--policy", str(self.policy), "--catalog", str(self.catalog), "--output", str(self.output), *extra])
        return code, err.getvalue()

    def problems(self, body: str) -> list[str]:
        self.write(body)
        with self.assertRaises(MODULE.ScopeError) as caught:
            MODULE.load_scopes(self.source, self.policy, self.catalog)
        return caught.exception.problems

    def entry(self, **changes: str) -> str:
        """The valid entry with some of its lines swapped for others, keyed by field name."""
        lines = []
        dash_lost = False
        for line in ENTRY.splitlines():
            key = line.strip().removeprefix("- ").split(":", 1)[0]
            if dash_lost:
                # The line that held the list dash is gone: the next one takes it over.
                line = "  - " + line.lstrip()
                dash_lost = False
            if key in changes:
                if changes[key] is None:
                    dash_lost = line.lstrip().startswith("- ")
                    continue
                prefix = line[: line.index(key)]
                line = f"{prefix}{key}: {changes[key]}"
            lines.append(line)
        return "\n".join(lines) + "\n"

    # ------------------------------------------------------------------ a valid file

    def test_a_valid_file_becomes_the_json_the_tool_reads(self) -> None:
        self.write(self.scopes(ENTRY, ENTRY.replace("onny", "qcny").replace("[on]", "[qc]")))
        code, err = self.run_main()
        self.assertEqual((code, err), (0, ""))
        written = self.output.read_text(encoding="utf-8")
        self.assertTrue(written.endswith("}\n"))
        data = json.loads(written)
        self.assertEqual(data["schema"], "meshcore-canada-cross-border-scopes/v1")
        self.assertEqual([item["scope"] for item in data["scopes"]], ["onny", "qcny"])
        self.assertEqual(data["scopes"][0], {
            "scope": "onny",
            "name": "Ontario–New York",
            "nameFr": "Ontario–New York",
            "description": "Applied to repeaters that connect New York and Ontario.",
            "descriptionFr": "Pour les répéteurs qui relient l’État de New York et l’Ontario.",
            "provinces": ["on"],
        })
        # Accents are written as they are, not as \u escapes, so the file can be read and reviewed.
        self.assertIn("répéteurs", written)
        self.assertNotIn("\\u", written)

    def test_on_is_a_province_not_a_yes(self) -> None:
        # YAML 1.1 reads an unquoted on as true; the file is written the way people write it.
        self.write(self.scopes(self.entry(provinces="[on, qc]")))
        self.assertEqual(MODULE.load_scopes(self.source, self.policy, self.catalog)[0]["provinces"], ["on", "qc"])
        self.write(self.scopes(self.entry(provinces='["on"]')))
        self.assertEqual(MODULE.load_scopes(self.source, self.policy, self.catalog)[0]["provinces"], ["on"])
        # A real yes or no is still not a province.
        self.assertTrue(any("provinces" in problem for problem in self.problems(self.scopes(self.entry(provinces="[true]")))))

    def test_the_same_file_always_gives_the_same_bytes(self) -> None:
        self.write(self.scopes(ENTRY))
        self.run_main()
        first = self.output.read_bytes()
        self.run_main()
        self.assertEqual(self.output.read_bytes(), first)

    def test_an_empty_list_is_fine_and_means_no_scopes_are_offered(self) -> None:
        self.write("scopes: []\n")
        self.assertEqual(self.run_main()[0], 0)
        self.assertEqual(json.loads(self.output.read_text(encoding="utf-8"))["scopes"], [])

    # ------------------------------------------------------------------ what is refused

    def test_the_scope_must_be_a_label_the_generator_takes(self) -> None:
        for bad in ["ONNY", "on ny", "onñy", "x" * 30, "on_ny", "'*'", "''"]:
            found = self.problems(self.scopes(self.entry(scope=bad)))
            self.assertTrue(any("scope" in problem and "lowercase" in problem for problem in found), f"{bad}: {found}")
        for good in ["a", "x" * 29, "a-b-9"]:
            self.write(self.scopes(self.entry(scope=good)))
            self.assertEqual(MODULE.load_scopes(self.source, self.policy, self.catalog)[0]["scope"], good)

    def test_the_scope_may_not_be_a_label_the_tool_already_uses(self) -> None:
        for taken in ["on", "qc", "onqc", "can", "na"]:
            found = self.problems(self.scopes(self.entry(scope=taken)))
            self.assertTrue(any("already used" in problem for problem in found), f"{taken}: {found}")

    def test_the_scope_may_not_be_the_code_of_a_region(self) -> None:
        # A region and a scope with the same tag would be one label on the air: the region's code is taken.
        for region in ["ytr", "yow"]:
            found = self.problems(self.scopes(self.entry(scope=region)))
            self.assertTrue(any("already used" in problem and "region" in problem for problem in found), f"{region}: {found}")
        self.write(self.scopes(self.entry(scope="onny")))
        self.assertEqual(MODULE.load_scopes(self.source, self.policy, self.catalog)[0]["scope"], "onny")

    def test_a_catalogue_that_cannot_be_read_is_said_plainly(self) -> None:
        self.write(self.scopes(ENTRY))
        for body in [None, "not json", "{}", '{"hierarchy": []}']:
            if body is None:
                self.catalog.unlink()
            else:
                self.catalog.write_text(body, encoding="utf-8")
            code, err = self.run_main()
            self.assertEqual(code, 1, str(body))
            self.assertIn("region catalogue", err)
            self.assertFalse(self.output.exists())

    def test_names_and_descriptions_are_needed_in_both_languages(self) -> None:
        for field in ["name", "nameFr", "description", "descriptionFr"]:
            for empty in [None, '""', "'   '"]:
                found = self.problems(self.scopes(self.entry(**{field: empty})))
                self.assertTrue(any(field in problem for problem in found), f"{field} {empty}: {found}")
        found = self.problems(self.scopes(self.entry(name="12")))
        self.assertTrue(any("name" in problem and "text" in problem for problem in found), found)

    def test_provinces_must_be_real_codes_from_the_catalogue_policy(self) -> None:
        for bad in ["[]", "[xx]", "[ON]", "on", "[on, on]", "[[on]]", "[5]"]:
            found = self.problems(self.scopes(self.entry(provinces=bad)))
            self.assertTrue(any("provinces" in problem for problem in found), f"{bad}: {found}")
        self.problems(self.scopes(self.entry(provinces=None)))
        found = self.problems(self.scopes(self.entry(provinces="[xx]")))
        self.assertTrue(any("xx" in problem and "ab, bc, ns, on, qc" in problem for problem in found), found)

    def test_a_scope_may_be_listed_once(self) -> None:
        found = self.problems(self.scopes(ENTRY, ENTRY))
        self.assertTrue(any("onny" in problem and "twice" in problem for problem in found), found)

    def test_a_missing_or_misspelled_field_is_named(self) -> None:
        for field in ["scope", "name", "nameFr", "description", "descriptionFr", "provinces"]:
            found = self.problems(self.scopes(self.entry(**{field: None})))
            self.assertTrue(any(field in problem and "missing" in problem for problem in found), f"{field}: {found}")
        found = self.problems(self.scopes(ENTRY + "    descripton: oops\n"))
        self.assertTrue(any("descripton" in problem for problem in found), found)

    def test_the_file_must_be_a_list_of_entries(self) -> None:
        for body in ["", "scopes:\n", "scopes: onny\n", "other: []\n", "- scope: onny\n", "scopes:\n  - onny\n", "scopes: {a: b}\n"]:
            self.assertTrue(self.problems(body), body)
        found = self.problems("scopes: [\n")
        self.assertTrue(any("YAML" in problem for problem in found), found)

    def test_every_problem_is_reported_at_once_with_the_entry_it_is_in(self) -> None:
        bad = self.entry(scope="ONNY", nameFr='""', provinces="[xx]")
        found = self.problems(self.scopes(bad, ENTRY.replace("onny", "qcny")))
        self.assertGreaterEqual(len(found), 3)
        self.assertTrue(all("entry 1" in problem for problem in found), found)

    # ------------------------------------------------------------------ the command line

    def test_nothing_is_written_when_the_file_is_wrong(self) -> None:
        self.write(self.scopes(self.entry(scope="ONNY")))
        code, err = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("scope", err)
        self.assertFalse(self.output.exists())

    def test_check_passes_when_the_json_matches_and_changes_nothing(self) -> None:
        self.write(self.scopes(ENTRY))
        self.run_main()
        before = self.output.read_bytes()
        self.assertEqual(self.run_main("--check"), (0, ""))
        self.assertEqual(self.output.read_bytes(), before)

    def test_check_fails_when_the_json_has_drifted_from_the_yaml(self) -> None:
        self.write(self.scopes(ENTRY))
        self.run_main()
        # The file was edited and the JSON not rebuilt.
        self.write(self.scopes(ENTRY.replace("Applied to", "Used by")))
        before = self.output.read_bytes()
        code, err = self.run_main("--check")
        self.assertEqual(code, 1)
        self.assertIn("out of date", err)
        self.assertIn("python scripts/build-cross-border-scopes.py", err)
        self.assertEqual(self.output.read_bytes(), before, "check never rewrites the file")
        # The JSON was edited by hand.
        self.write(self.scopes(ENTRY))
        self.run_main()
        self.output.write_text(self.output.read_text(encoding="utf-8").replace("onny", "onxx"), encoding="utf-8")
        self.assertEqual(self.run_main("--check")[0], 1)

    def test_check_fails_when_the_json_is_missing_or_the_yaml_is_wrong(self) -> None:
        self.write(self.scopes(ENTRY))
        code, err = self.run_main("--check")
        self.assertEqual(code, 1)
        self.assertIn("out of date", err)
        self.assertFalse(self.output.exists(), "check never creates the file")
        self.run_main()
        self.write(self.scopes(self.entry(scope="ONNY")))
        code, err = self.run_main("--check")
        self.assertEqual(code, 1)
        self.assertIn("lowercase", err)

    def test_a_missing_yaml_file_is_said_plainly(self) -> None:
        code, err = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn(str(self.source), err)

    # ------------------------------------------------------------------ the real files

    def test_the_real_json_matches_the_real_yaml(self) -> None:
        result = subprocess.run([sys.executable, str(SCRIPT), "--check"], cwd=self.dir, capture_output=True, text=True)
        self.assertEqual((result.returncode, result.stderr), (0, ""))

    def test_the_real_file_offers_onny_qcny_and_qcvt_to_the_right_provinces(self) -> None:
        data = json.loads((ROOT / "docs/assets/regions/cross-border-scopes.json").read_text(encoding="utf-8"))
        offered = {item["scope"]: item["provinces"] for item in data["scopes"]}
        self.assertEqual(offered, {"onny": ["on"], "qcny": ["qc"], "qcvt": ["qc"]})
        for item in data["scopes"]:
            for field in ["name", "nameFr", "description", "descriptionFr"]:
                self.assertTrue(item[field].strip(), f"{item['scope']} {field}")

    def test_the_real_yaml_tells_people_how_to_add_a_scope(self) -> None:
        lines = (ROOT / "data/cross-border-scopes.yml").read_text(encoding="utf-8").splitlines()
        header = "\n".join(line for line in lines[: next(i for i, line in enumerate(lines) if line.startswith("scopes:"))])
        self.assertIn("agreed", header)
        self.assertIn("python scripts/build-cross-border-scopes.py", header)


if __name__ == "__main__":
    unittest.main()
