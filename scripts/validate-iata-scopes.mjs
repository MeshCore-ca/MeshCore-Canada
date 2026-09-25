import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const load = path => JSON.parse(read(path));
const data = load("docs/assets/regions/iata-regions.json");
const zones = load("docs/assets/regions/meshmapper-iata-boundaries.geojson");
const provinces = load("docs/assets/regions/scope-jurisdictions.geojson");
assert.equal(data.schema, "meshcore-canada-iata-scopes/v1");
assert.equal(data.policy.scopeModel, "flat");
assert.deepEqual(data.policy.meshScopes, { onqc: ["on", "qc"] });
assert.equal(data.policy.reservedScope, "can");
assert.equal(data.policy.minimumFirmware, "1.14");
assert.equal(data.policy.scopedAdvertFirmware, "1.15");
assert.equal(data.policy.bulkDefinitionFirmware, "1.16");
assert.equal(data.policy.minimumApp, "1.43");
assert.equal(zones.type, "FeatureCollection");
assert.equal(zones.featureCount, zones.features.length);
assert.equal(new Set(zones.features.map(feature => feature.properties.tag)).size, zones.features.length);
assert.deepEqual(zones.features.map(feature => feature.properties.tag).sort(), data.seeds.map(seed => seed.tag).sort());
assert.equal(provinces.features.length, 13);
assert.deepEqual(provinces.features.map(feature => feature.properties.tag).sort(), Object.keys(data.policy.provinces).sort());
assert.equal(data.source.boundarySha256, createHash("sha256").update(read("docs/assets/regions/meshmapper-iata-boundaries.geojson")).digest("hex"));
assert.equal(provinces.sourceSha256, createHash("sha256").update(read("docs/assets/regions/canada-region-partition-digital.geojson")).digest("hex"));
assert.equal(zones.source.endpoint, "https://meshmapper.net/?ajax=zones_bbox");
assert.ok(Number.isFinite(Date.parse(zones.fetchedAt)));
for (const feature of zones.features) {
  const { tag, code, country, name, center, sourceUrl } = feature.properties;
  assert.match(tag, /^[a-z]{3}$/);
  assert.equal(code, tag.toUpperCase());
  assert.equal(country, "CA");
  assert.ok(typeof name === "string" && name.trim());
  assert.equal(sourceUrl, `https://${tag}.meshmapper.net/`);
  assert.equal(center.length, 2);
  assert.ok(center.every(Number.isFinite));
  assert.equal(feature.geometry.type, "Polygon");
  const ring = feature.geometry.coordinates[0];
  assert.ok(ring.length >= 4);
  assert.deepEqual(ring[0], ring.at(-1));
  assert.ok(ring.every(point => point.length === 2 && point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90));
}
const context = vm.createContext({ TextEncoder });
vm.runInContext(read("docs/assets/regions/modules/iata-scopes.js"), context);
const api = context.MeshCoreIataScopes;
for (const seed of data.seeds) {
  for (const province of seed.provinces) {
    const result = api.profile(data, { home: seed.tag, province });
    assert.ok(result.tags.every(tag => result.parentOverrides[tag] === null));
    assert.ok(api.commands(result).every(line => Buffer.byteLength(line) <= 160));
    assert.ok(result.budget.tagCount <= 32 && result.budget.responseBytes <= 160);
    assert.equal(result.tags.includes("onqc"), ["on", "qc"].includes(province));
  }
}
const source = read("docs/assets/regions/regions.js");
assert.ok(source.includes('fetchJsonAsset("iata-regions.json"'));
assert.ok(source.includes('"meshmapper-iata-boundaries.geojson?v="'));
assert.ok(!source.includes("canada-region-partition"), "The public app must not load the former partition");
assert.ok(!source.includes('fetchJsonAsset("canada-regions.json"'));
for (const page of ["index.md", "index.fr.md", "map.md", "map.fr.md"]) {
  const text = read("docs/config/" + page);
  assert.ok(text.indexOf("modules/iata-scopes.js") < text.indexOf("assets/regions/regions.js"));
}
assert.ok(!existsSync(new URL("docs/config/editor/index.html", root)), "The old static editor must not overwrite the replacement landing pages");
for (const page of ["index.md", "index.fr.md"]) assert.match(read("docs/config/editor/" + page), /https:\/\/meshmapper\.net\//);
const workflow = read(".github/workflows/apply-approved-boundary.yml");
assert.match(workflow, /workflow_dispatch:/);
assert.doesNotMatch(workflow, /MCC_BOUNDARY_PUSH_TOKEN|git push|types: \[closed\]/);
execFileSync(process.execPath, [fileURLToPath(new URL("scripts/build-iata-catalog.mjs", root)), "--check"], { stdio: "inherit" });
console.log(`MeshMapper IATA scope validation passed: ${data.seeds.length} zones, 13 jurisdictions, flat Canadian scopes.`);
