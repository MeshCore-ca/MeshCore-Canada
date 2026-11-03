import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// The cross-border scopes (data/cross-border-scopes.yml, built into docs/assets/regions/cross-border-scopes.json)
// are labels on the air, so no region may share one's tag. scripts/build-cross-border-scopes.py refuses a scope
// that is already a region; this is the other direction, for a region that arrives later (a new MeshMapper zone,
// a starter region) and takes a scope's tag. The old region editor that reserved these tags is retired.
const load = (path) => JSON.parse(readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
const file = load("docs/assets/regions/cross-border-scopes.json");
const catalog = load("docs/assets/regions/iata-regions.json");
const starters = load("data/iata-starter-regions.json");
const published = load("docs/assets/regions/meshmapper-iata-boundaries.geojson");
const boundaries = load("docs/assets/regions/iata-boundaries.geojson");

// Every tag a region, province or wider scope already has. The catalogue's own cross-border networks (their
// path tags) are left out: onny is the same label there and in the file, on purpose.
function tagsInUse() {
  return new Set([
    ...Object.keys(catalog.hierarchy),
    ...Object.keys(catalog.status),
    ...catalog.seeds.map((seed) => seed.tag),
    ...starters.regions.map((region) => region.tag),
    ...published.features.map((feature) => feature.properties.tag),
    ...boundaries.features.map((feature) => feature.properties.tag),
    ...catalog.policy.reservedScopes,
    ...Object.keys(catalog.policy.meshScopes)
  ]);
}

test("no region, province or wider scope uses a tag that a cross-border scope has", () => {
  const taken = tagsInUse();
  assert.ok(taken.size > 60 && taken.has("ytr") && taken.has("on") && taken.has("onqc") && taken.has("na"), "the list of tags in use is the real one");
  for (const { scope } of file.scopes) assert.ok(!taken.has(scope), `${scope} is also a tag the region catalogue uses`);
  assert.ok(file.scopes.length >= 3, "the file lists the scopes the tool offers");
});

test("the file lists valid scopes for real provinces, once each", () => {
  const provinces = Object.keys(catalog.policy.provinces);
  assert.equal(new Set(file.scopes.map((item) => item.scope)).size, file.scopes.length);
  for (const item of file.scopes) {
    assert.match(item.scope, /^[a-z0-9-]{1,29}$/);
    assert.ok(item.provinces.length > 0 && item.provinces.every((code) => provinces.includes(code)), item.scope);
  }
});
