import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildRegionProposalIssue,
  MAX_GITHUB_ISSUE_URL_LENGTH
} from "../../docs/config/editor/issue.js";

function proposal(changes) {
  return {
    schema: "mcc-region-editor-proposal/v1",
    baseMembershipSha256: "a".repeat(64),
    submittedBy: "Local operator",
    reason: "These census cells belong with the neighbouring radio community.",
    changes
  };
}

test("builds a complete prefilled region proposal issue", () => {
  const result = buildRegionProposalIssue(proposal([
    { DGUID: "2021S05120001", from: "wat", to: "wel" },
    { DGUID: "2021S05120002", from: "wat", to: "wel" }
  ]), {
    labelForTag: (tag) => ({ wat: "Waterloo", wel: "Wellington" })[tag]
  });

  assert.equal(result.requiresAttachment, false);
  assert.ok(result.url.length <= MAX_GITHUB_ISSUE_URL_LENGTH);
  const url = new URL(result.url);
  assert.equal(url.origin, "https://github.com");
  assert.equal(url.pathname, "/MeshCore-ca/MeshCore-Canada/issues/new");
  assert.equal(url.searchParams.get("template"), "region_boundary_proposal.yml");
  assert.equal(url.searchParams.get("affected_regions"), "Waterloo (wat) → Wellington (wel)");
  assert.equal(url.searchParams.get("change_count"), "2");
  assert.equal(url.searchParams.get("submitted_by"), "Local operator");
  const proposalField = url.searchParams.get("proposal");
  assert.match(proposalField, /^```json\n/);
  assert.match(proposalField, /\n```\n$/);
  assert.deepEqual(JSON.parse(proposalField.slice(8, -5)), proposal([
    { DGUID: "2021S05120001", from: "wat", to: "wel" },
    { DGUID: "2021S05120002", from: "wat", to: "wel" }
  ]));
  assert.equal(url.searchParams.has("labels"), false);
});

test("falls back to an attachment workflow when the prefill URL is too large", () => {
  const result = buildRegionProposalIssue(proposal([
    { DGUID: "2021S05120001", from: "wat", to: "wel" }
  ]), { maxUrlLength: 800 });

  assert.equal(result.requiresAttachment, true);
  const url = new URL(result.url);
  assert.equal(url.searchParams.get("template"), "region_boundary_proposal.yml");
  assert.equal(url.searchParams.has("proposal"), false);
  assert.equal(url.searchParams.get("reason"), proposal([
    { DGUID: "2021S05120001", from: "wat", to: "wel" }
  ]).reason);
  assert.match(result.proposalJson, /2021S05120001/);
});

test("rejects an empty unvalidated proposal", () => {
  assert.throws(() => buildRegionProposalIssue(proposal([])), /must contain changes/);
});

test("keeps the real oversized fallback below the conservative URL budget", () => {
  const large = proposal([
    { DGUID: "2021S05120001", from: "wat", to: "wel" }
  ]);
  large.reason = "地".repeat(1000);
  const result = buildRegionProposalIssue(large);

  assert.equal(result.requiresAttachment, true);
  assert.ok(result.url.length <= MAX_GITHUB_ISSUE_URL_LENGTH);
  assert.equal(
    new URL(result.url).searchParams.get("reason"),
    "See the attached canonical proposal JSON."
  );
});
