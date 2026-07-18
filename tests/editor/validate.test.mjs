import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { validateProposal } from "../../docs/config/editor/validate.js";

const raw = JSON.parse(readFileSync(new URL("./fixtures/context.json", import.meta.url)));
function buildContext() {
  return {
    baseMembershipSha256: raw.baseMembershipSha256,
    membership: new Map(Object.entries(raw.membership)),
    leafTags: new Set(raw.leafTags),
    leafProvinces: new Map(Object.entries(raw.leafProvinces).map(([k, v]) => [k, new Set(v)])),
    seedTags: new Map(Object.entries(raw.seedTags)),
    hierarchyTags: new Set(["can", "on", "bc", "on-local", ...raw.leafTags]),
    hierarchyParents: new Map([
      ["can", null], ["on", "can"], ["bc", "can"], ["on-local", "on"],
      ["aaa", "on-local"], ["bbb", "on-local"]
    ]),
    reservedTags: new Set(["can", "on", "bc", "on-local", ...raw.leafTags, "us", "ykf"]),
    regionLabels: new Set([...raw.leafTags, "shared corridor"]),
    jurisdictionTag: "on"
  };
}

const casesDir = new URL("./fixtures/cases/", import.meta.url);
for (const file of readdirSync(casesDir).sort()) {
  const fixture = JSON.parse(readFileSync(new URL(file, casesDir)));
  test(fixture.name, () => {
    const result = validateProposal(fixture.proposal, buildContext());
    if (fixture.expect === "ok") {
      assert.equal(result.ok, true, JSON.stringify(result.errors));
      assert.deepEqual(result.canonical, fixture.canonical);
      // deepEqual ignores key order; pin canonical key ordering explicitly.
      assert.equal(JSON.stringify(result.canonical), JSON.stringify(fixture.canonical));
    } else {
      assert.equal(result.ok, false);
      assert.equal(result.errors[0].code, fixture.expect);
    }
  });
}

test("validates a new region with one changed unprotected anchor cell", () => {
  const proposal = {
    schema: "mcc-region-editor-proposal/v2",
    baseMembershipSha256: raw.baseMembershipSha256,
    newRegion: {
      tag: "delta",
      label: "Delta County",
      parent: "on-local",
      anchorDguid: "2021S0512TEST0001"
    },
    reason: "This radio community needs its own local region.",
    changes: [
      { DGUID: "2021S0512TEST0001", from: "aaa", to: "delta" },
      { DGUID: "2021S0512TEST0002", from: "aaa", to: "delta" }
    ]
  };
  const result = validateProposal(proposal, buildContext());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.canonical, proposal);
});

test("new region validation rejects duplicate names, tags, and protected anchors", () => {
  const base = {
    schema: "mcc-region-editor-proposal/v2",
    baseMembershipSha256: raw.baseMembershipSha256,
    newRegion: {
      tag: "delta",
      label: "Delta County",
      parent: "on-local",
      anchorDguid: "2021S0512TEST0001"
    },
    reason: "Create a reviewed local region.",
    changes: [{ DGUID: "2021S0512TEST0001", from: "aaa", to: "delta" }]
  };
  const duplicateTag = structuredClone(base);
  duplicateTag.newRegion.tag = "aaa";
  duplicateTag.changes[0].to = "aaa";
  assert.equal(validateProposal(duplicateTag, buildContext()).errors[0].code, "region-tag-exists");
  const aliasTag = structuredClone(base);
  aliasTag.newRegion.tag = "ykf";
  aliasTag.changes[0].to = "ykf";
  assert.equal(validateProposal(aliasTag, buildContext()).errors[0].code, "region-tag-exists");
  const duplicateName = structuredClone(base);
  duplicateName.newRegion.label = "AAA";
  assert.equal(validateProposal(duplicateName, buildContext()).errors[0].code, "region-name-exists");
  const groupName = structuredClone(base);
  groupName.newRegion.label = "Shared Corridor";
  assert.equal(validateProposal(groupName, buildContext()).errors[0].code, "region-name-exists");
  const protectedAnchor = structuredClone(base);
  protectedAnchor.newRegion.anchorDguid = "2021S0512TEST0003";
  protectedAnchor.changes = [{ DGUID: "2021S0512TEST0003", from: "bbb", to: "delta" }];
  assert.equal(validateProposal(protectedAnchor, buildContext()).errors[0].code, "bad-new-region-anchor");
});
