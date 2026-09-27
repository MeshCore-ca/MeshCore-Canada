import assert from "node:assert/strict";
import test from "node:test";
import { collectLegacyDrafts } from "../../docs/assets/regions/modules/legacy-draft-export.js";
import { saveDraft } from "../../docs/config/editor/infrastructure/draft-store.js";

test("retired editor drafts remain exportable without reading other data or deleting anything", () => {
  const entries = new Map([["unrelated-private-setting", "must not be read"]]);
  const read = [];
  const storage = {
    get length() { return entries.size; },
    key(index) { return [...entries.keys()][index]; },
    getItem(key) { read.push(key); return entries.get(key); },
    setItem(key, value) { entries.set(key, value); },
    removeItem() { throw new Error("Export must not delete drafts"); },
  };
  const draft = { schema: "mcc-region-editor-proposal/v1", baseMembershipSha256: "a".repeat(64), province: "35", target: "ott", reason: "Saved before migration", changes: [{ DGUID: "2021S051235060001", to: "ott" }], savedAt: 1 };
  assert.equal(saveDraft(storage, draft).ok, true);
  const before = [...entries];
  const result = collectLegacyDrafts(storage);
  assert.equal(result.length, 1);
  assert.equal(result[0].reason, draft.reason);
  assert.deepEqual([...entries], before);
  assert.ok(!read.includes("unrelated-private-setting"));
});
