import test from "node:test";
import assert from "node:assert/strict";

import {
  PROPOSAL_SCHEMA_V1,
  PROPOSAL_SCHEMA_V2,
  PROPOSAL_TYPE_BOUNDARY,
  PROPOSAL_TYPE_NEW_REGION,
  buildEditorProposal,
  hierarchyPath,
  isEditableTarget,
  schemaForProposalType
} from "../../docs/config/editor/domain/proposal-types.js";
import {
  draftKey,
  hasStaleDraft,
  loadDraft,
  removeDraft,
  saveDraft,
  serializableDraft
} from "../../docs/config/editor/infrastructure/draft-store.js";

const HASH = "a".repeat(64);

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return Array.from(values.keys())[index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("explicit proposal types map to the frozen v1 and v2 schema strings", () => {
  assert.equal(schemaForProposalType(PROPOSAL_TYPE_BOUNDARY), PROPOSAL_SCHEMA_V1);
  assert.equal(schemaForProposalType(PROPOSAL_TYPE_NEW_REGION), PROPOSAL_SCHEMA_V2);
  assert.equal(schemaForProposalType(""), "");
});

test("proposal builder preserves the exact v1 payload contract", () => {
  const changes = [{ DGUID: "2021S0512TEST0001", from: "aaa", to: "bbb" }];
  assert.deepEqual(buildEditorProposal({
    schema: PROPOSAL_SCHEMA_V1,
    baseMembershipSha256: HASH,
    changes,
    newRegion: {
      tag: "ignored",
      label: "Ignored",
      parent: "on",
      anchorDguid: "2021S0512TEST0001"
    },
    submittedBy: "  Contributor  ",
    reason: "  Move the municipality.  "
  }), {
    schema: PROPOSAL_SCHEMA_V1,
    baseMembershipSha256: HASH,
    changes,
    submittedBy: "Contributor",
    reason: "Move the municipality."
  });
});

test("proposal builder preserves the exact v2 payload contract and key order", () => {
  const changes = [{ DGUID: "2021S0512TEST0001", from: "aaa", to: "new-leaf" }];
  const proposal = buildEditorProposal({
    schema: PROPOSAL_SCHEMA_V2,
    baseMembershipSha256: HASH,
    changes,
    newRegion: {
      tag: "new-leaf",
      label: "New Leaf",
      parent: "on-local",
      anchorDguid: "2021S0512TEST0001"
    },
    submittedBy: "",
    reason: "Community proposal"
  });
  assert.deepEqual(Object.keys(proposal), [
    "schema",
    "baseMembershipSha256",
    "changes",
    "newRegion",
    "reason"
  ]);
  assert.deepEqual(proposal.newRegion, {
    tag: "new-leaf",
    label: "New Leaf",
    parent: "on-local",
    anchorDguid: "2021S0512TEST0001"
  });
});

test("editor undo shortcuts never claim editable controls", () => {
  for (const tagName of ["INPUT", "TEXTAREA", "SELECT", "OPTION"]) {
    assert.equal(isEditableTarget({ tagName }), true);
  }
  assert.equal(isEditableTarget({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: "BUTTON", closest() { return null; } }), false);
});

test("hierarchy path is human-labelled and deduplicated", () => {
  assert.deepEqual(hierarchyPath({
    jurisdictionLabel: "Ontario",
    parentLabels: ["Ontario", "Southern Ontario"],
    leafLabel: "New Leaf"
  }), ["Canada", "Ontario", "Southern Ontario", "New Leaf"]);
});

test("draft key is scoped to schema, authority hash, and province", () => {
  assert.equal(
    draftKey(PROPOSAL_SCHEMA_V2, HASH, "35"),
    `mcc-region-editor-draft:v2:${HASH}:35`
  );
  assert.equal(draftKey(PROPOSAL_SCHEMA_V2, "bad", "35"), "");
});

test("local draft excludes contributor identity and coordinates", () => {
  const draft = serializableDraft({
    schema: PROPOSAL_SCHEMA_V2,
    baseMembershipSha256: HASH,
    province: "35",
    target: "new-leaf",
    reason: "Keep these official cells together",
    submittedBy: "Must not persist",
    latitude: 43.4,
    longitude: -80.3,
    changes: [{ DGUID: "2021S0512TEST0001", to: "new-leaf" }],
    newRegion: {
      label: "New Leaf",
      tag: "new-leaf",
      anchorDguid: "2021S0512TEST0001"
    },
    savedAt: 123
  });
  assert.equal("submittedBy" in draft, false);
  assert.equal("latitude" in draft, false);
  assert.equal("longitude" in draft, false);
  assert.deepEqual(draft.changes, [{ DGUID: "2021S0512TEST0001", to: "new-leaf" }]);
});

test("draft round trip is exact for its scoped key and stale hashes stay isolated", () => {
  const storage = memoryStorage();
  const value = {
    schema: PROPOSAL_SCHEMA_V1,
    baseMembershipSha256: HASH,
    province: "35",
    target: "bbb",
    reason: "Move one area",
    changes: [{ DGUID: "2021S0512TEST0001", to: "bbb" }],
    savedAt: 456
  };
  assert.equal(saveDraft(storage, value).ok, true);
  assert.deepEqual(loadDraft(storage, PROPOSAL_SCHEMA_V1, HASH, "35"), {
    version: 1,
    ...value
  });
  const newHash = "b".repeat(64);
  assert.equal(loadDraft(storage, PROPOSAL_SCHEMA_V1, newHash, "35"), null);
  assert.equal(hasStaleDraft(storage, PROPOSAL_SCHEMA_V1, newHash, "35"), true);
  assert.equal(removeDraft(storage, PROPOSAL_SCHEMA_V1, HASH, "35"), true);
  assert.equal(storage.length, 0);
});
