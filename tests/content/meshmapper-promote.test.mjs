import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { planPromotion } from "../../scripts/promote-meshmapper-snapshot.mjs";
import { directoryUrl } from "../../scripts/fetch-meshmapper-regions.mjs";

const load = path => JSON.parse(readFileSync(path, "utf8"));
const approved = load("docs/assets/regions/meshmapper-iata-boundaries.geojson");
const policy = load("data/iata-scope-policy.json");
const starterTags = load("data/iata-starter-regions.json").regions.map(region => region.tag);
const jurisdictions = load("docs/assets/regions/scope-jurisdictions.geojson");

// The approved boundaries, as the zones API would return them.
function apiCandidate() {
  const candidate = structuredClone(approved);
  candidate.schema = "meshcore-canada-meshmapper-zones/v2";
  candidate.source = { ...candidate.source, endpoint: directoryUrl };
  for (const feature of candidate.features) {
    Object.assign(feature.properties, { hasBoundary: feature.geometry !== null, group: feature.properties.group ?? null });
  }
  return candidate;
}

function plan(candidate, overrides = {}) {
  return planPromotion({ approved, candidate, report: { candidateSha256: "same", issues: [] }, candidateSha256: "same",
    policy, starterTags, profileTags: [], jurisdictions, ...overrides });
}

const region = (tag, center, geometry) => ({ type: "Feature", geometry,
  properties: { code: tag.toUpperCase(), tag, name: "Test " + tag, country: "CA", center, sourceUrl: `https://${tag}.meshmapper.net/`, hasBoundary: geometry !== null, group: null } });

test("an API pull matching the approved boundaries is ready to promote", () => {
  const result = plan(apiCandidate());
  assert.deepEqual(result.stops, []);
  assert.equal(result.result.needsReview, false);
});

test("only files from the zones API can be promoted", () => {
  const old = apiCandidate();
  old.schema = "meshcore-canada-meshmapper-zones/v1";
  assert.match(plan(old).stops[0], /did not come from the MeshMapper zones API/);
  const scraped = apiCandidate();
  scraped.source.endpoint = "https://meshmapper.net/?ajax=zones_bbox";
  assert.match(plan(scraped).stops[0], /did not come from the MeshMapper zones API/);
});

test("broken MeshMapper boundaries stop promotion with the region to fix", () => {
  const { stops } = plan(apiCandidate(), { report: { candidateSha256: "same", issues: [{ tag: "yqb", kind: "invalid-boundary", detail: "Self-intersection[-72.08 47.99]" }] } });
  assert.deepEqual(stops, ["yqb: invalid boundary (Self-intersection[-72.08 47.99]). Fix this boundary in MeshMapper, then fetch again."]);
  assert.match(plan(apiCandidate(), { report: { candidateSha256: "other", issues: [] } }).stops[0], /different file/);
});

test("a new region names the province line to add", () => {
  const candidate = apiCandidate();
  const yow = candidate.features.find(feature => feature.properties.tag === "yow");
  candidate.features.push(region("tsa", yow.properties.center, structuredClone(yow.geometry)));
  assert.deepEqual(plan(candidate).stops, ['tsa: new region. Add "tsa": ["on"] to zoneProvinces in data/iata-scope-policy.json (list every province it serves).']);
  assert.deepEqual(plan(candidate, { policy: { ...policy, zoneProvinces: { ...policy.zoneProvinces, tsa: ["on"] } } }).stops, []);
});

test("a region listed without a boundary stays off the map and needs no province", () => {
  const candidate = apiCandidate();
  candidate.features.push(region("tsu", [-63.9, 46.3], null));
  const result = plan(candidate);
  assert.deepEqual(result.stops, []);
  assert.deepEqual(result.result.unmapped, ["tsu"]);
});

test("removed regions, lost boundaries, starter clashes and stale profiles each stop promotion", () => {
  const removed = apiCandidate();
  removed.features = removed.features.filter(feature => feature.properties.tag !== "xcm");
  assert.deepEqual(plan(removed).stops, ['xcm: MeshMapper no longer lists this region. Remove "xcm" from zoneProvinces in data/iata-scope-policy.json.']);
  const lost = apiCandidate();
  Object.assign(lost.features.find(feature => feature.properties.tag === "xcm"), { geometry: null });
  lost.features.find(feature => feature.properties.tag === "xcm").properties.hasBoundary = false;
  assert.match(plan(lost).stops[0], /^xcm: no longer has a boundary in MeshMapper/);
  const clash = apiCandidate();
  clash.features.push(region(starterTags[0], [-63.1, 46.2], null));
  assert.match(plan(clash).stops[0], new RegExp("^" + starterTags[0] + ": MeshMapper now publishes this MeshCore Canada starter code"));
  assert.match(plan(removed, { profileTags: ["xcm"] }).stops.at(-1), /^xcm: remove its record from data\/iata-region-profiles\.json/);
});
