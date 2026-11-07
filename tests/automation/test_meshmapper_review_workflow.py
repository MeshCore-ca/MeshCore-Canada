import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = yaml.safe_load((ROOT / ".github/workflows/meshmapper-review.yml").read_text())
REVIEW_STEP = next(step["run"] for step in WORKFLOW["jobs"]["check"]["steps"]
                   if step.get("name") == "Find the last map a person approved")
BOT = "41898282+github-actions[bot]@users.noreply.github.com"
MAP = "docs/assets/regions/iata-boundaries.geojson"


class MeshMapperReviewWorkflowTests(unittest.TestCase):
    def run_step(self, history, failure=""):
        # Exercise the actual workflow block without credentials or publishing.
        # A large stream makes an early-exiting consumer break the producer pipe.
        git_stub = """
git() {
  case "$1" in
    log) cat history.txt || return $?; if [ "$MCC_TEST_GIT_FAILURE" = log ]; then return 23; fi ;;
    show) if [ "$MCC_TEST_GIT_FAILURE" = show ]; then return 42; fi
          printf '%s\\n' "$2" ;;
    *) return 99 ;;
  esac
}
"""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "history.txt").write_text(history, encoding="utf-8")
            output = root / ".tmp/meshmapper-review/reviewed-map.geojson"
            output.parent.mkdir(parents=True)
            result = subprocess.run(
                [shutil.which("bash") or "bash", "--noprofile", "--norc", "-c", git_stub + REVIEW_STEP],
                cwd=root, env={**os.environ, "MCC_TEST_GIT_FAILURE": failure},
                capture_output=True, text=True, timeout=20,
            )
            return result, output.read_text() if output.exists() else None

    def test_large_history_is_drained_after_the_first_human_commit(self):
        history = f"{'a' * 40} {BOT}\n{'b' * 40} reviewer@example.invalid\n"
        history += f"{'c' * 40} older@example.invalid\n" * 50000
        result, output = self.run_step(history)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, f"{'b' * 40}:{MAP}\n")

    def test_a_human_head_is_used_instead_of_an_older_commit(self):
        result, output = self.run_step("newest reviewer@example.invalid\nolder other@example.invalid\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, f"newest:{MAP}\n")

    def test_no_human_baseline_fails_without_reading_the_index(self):
        for history in ("", f"bot {BOT}\n"):
            with self.subTest(history=history):
                result, output = self.run_step(history)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("No human-reviewed map commit found", result.stderr)
                self.assertIsNone(output)

    def test_git_log_errors_are_not_hidden_by_a_matching_commit(self):
        result, output = self.run_step("newest reviewer@example.invalid\n", failure="log")
        self.assertEqual(result.returncode, 23, result.stderr)
        self.assertIsNone(output)

    def test_git_show_errors_still_fail_the_step(self):
        result, _ = self.run_step("newest reviewer@example.invalid\n", failure="show")
        self.assertEqual(result.returncode, 42, result.stderr)
