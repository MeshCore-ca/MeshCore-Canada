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
    seedTags: new Map(Object.entries(raw.seedTags))
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
