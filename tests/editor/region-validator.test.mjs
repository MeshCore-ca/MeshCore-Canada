import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { newRegionParentJurisdiction } = require("../../scripts/validate-regions.js");

const data = {
  hierarchy: {
    can: { parent: null },
    on: { parent: "can" },
    "on-local": { parent: "on" },
    aaa: { parent: "on-local" }
  }
};
const leaves = new Set(["aaa"]);

test("new-region validation accepts jurisdiction and nested group parents", () => {
  assert.equal(newRegionParentJurisdiction(data, "on", leaves), "on");
  assert.equal(newRegionParentJurisdiction(data, "on-local", leaves), "on");
});

test("new-region validation rejects national, leaf, and unknown parents", () => {
  assert.equal(newRegionParentJurisdiction(data, "can", leaves), null);
  assert.equal(newRegionParentJurisdiction(data, "aaa", leaves), null);
  assert.equal(newRegionParentJurisdiction(data, "missing", leaves), null);
});
