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
const zones = load("docs/assets/regions/iata-boundaries.geojson");
const published = load("docs/assets/regions/meshmapper-iata-boundaries.geojson");
const starters = load("data/iata-starter-regions.json");
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
assert.equal(zones.schema, "meshcore-canada-iata-boundaries/v2");
assert.equal(data.source.boundarySchema, zones.schema);
assert.equal(zones.featureCount, zones.features.length);
assert.equal(new Set(zones.features.map(feature => feature.properties.tag + ":" + feature.properties.regionSource)).size, zones.features.length, "Each region may have one published feature and one planning feature");
assert.deepEqual([...new Set(zones.features.map(feature => feature.properties.tag))].sort(), data.seeds.map(seed => seed.tag).sort());
assert.equal(provinces.features.length, 13);
assert.deepEqual(provinces.features.map(feature => feature.properties.tag).sort(), Object.keys(data.policy.provinces).sort());
assert.equal(data.source.boundarySha256, createHash("sha256").update(read("docs/assets/regions/iata-boundaries.geojson")).digest("hex"));
assert.equal(data.source.meshmapperBoundarySha256, createHash("sha256").update(read("docs/assets/regions/meshmapper-iata-boundaries.geojson")).digest("hex"));
assert.equal(provinces.sourceSha256, createHash("sha256").update(read("docs/assets/regions/canada-region-partition-digital.geojson")).digest("hex"));
assert.equal(published.source.endpoint, "https://meshmapper.net/?ajax=zones_bbox");
assert.ok(Number.isFinite(Date.parse(published.fetchedAt)));
assert.equal(zones.publishedCount, published.features.length);
assert.equal(zones.starterCount, starters.regions.length);
assert.deepEqual(zones.features.filter(feature => feature.properties.regionSource === "meshmapper").map(feature => feature.properties.tag).sort(), published.features.map(feature => feature.properties.tag).sort());
assert.deepEqual(zones.features.filter(feature => feature.properties.planningKind === "starter").map(feature => feature.properties.tag).sort(), starters.regions.map(region => region.tag).sort());
assert.equal(zones.features.filter(feature => feature.properties.planningKind === "extension").length, zones.planningExtensionCount);
assert.equal(data.source.planningExtensionCount, zones.planningExtensionCount);
for (const feature of published.features) {
  const merged = zones.features.find(item => item.properties.tag === feature.properties.tag);
  assert.deepEqual(merged, { ...feature, properties: { ...feature.properties, regionSource: "meshmapper" } }, "Never alter a published MeshMapper zone");
}
for (const [name, path] of Object.entries({ meshmapper: "docs/assets/regions/meshmapper-iata-boundaries.geojson", jurisdictions: "docs/assets/regions/scope-jurisdictions.geojson", starters: "data/iata-starter-regions.json", scopes: "data/iata-scope-policy.json", labrador: "data/iata-labrador-outline.geojson" })) {
  assert.equal(zones.sourceHashes[name], createHash("sha256").update(read(path)).digest("hex"), `Regenerate IATA boundaries after changing ${name}`);
}
for (const feature of zones.features) {
  const { tag, code, country, name, center, sourceUrl } = feature.properties;
  assert.match(tag, /^[a-z]{3}$/);
  assert.equal(code, tag.toUpperCase());
  assert.equal(country, "CA");
  assert.ok(typeof name === "string" && name.trim());
  if (feature.properties.regionSource === "meshmapper") assert.equal(sourceUrl, `https://${tag}.meshmapper.net/`);
  else {
    assert.equal(feature.properties.regionSource, "meshcore-canada");
    if (feature.properties.planningKind === "extension") {
      assert.ok(published.features.some(region => region.properties.tag === tag));
      assert.equal(data.status[tag].planningExtension, true);
    } else {
      assert.equal(feature.properties.planningKind, "starter");
      assert.ok(starters.regions.some(region => region.tag === tag));
      assert.equal(data.status[tag].state, "starter");
    }
    assert.match(feature.properties.codeSource, /^https:\/\//);
  }
  assert.equal(center.length, 2);
  assert.ok(center.every(Number.isFinite));
  assert.ok(["Polygon", "MultiPolygon"].includes(feature.geometry.type));
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const rings of polygons) for (const ring of rings) {
    assert.ok(ring.length >= 4);
    assert.deepEqual(ring[0], ring.at(-1));
    assert.ok(ring.every(point => point.length === 2 && point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90));
  }
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
assert.ok(source.includes('"iata-boundaries.geojson?v="'));
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
