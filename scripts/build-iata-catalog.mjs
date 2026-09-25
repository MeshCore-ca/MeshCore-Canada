#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const load = path => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const policy = load("data/iata-scope-policy.json");
const zones = load("docs/assets/regions/meshmapper-iata-boundaries.geojson");
const legacy = load("maintenance/legacy-regions/canada-regions.json");
assert.equal(policy.scopeModel, "flat");
const tags = zones.features.map(feature => feature.properties.tag);
assert.deepEqual([...tags].sort(), Object.keys(policy.zoneProvinces).sort(), "Review province metadata for every published MeshMapper zone");
const hierarchy = { can: { label: "Canada", labelFr: "Canada", parent: null, kind: "country" } };
const status = { can: { state: "reserved", source: policy.proposal } };
for (const [tag, province] of Object.entries(policy.provinces)) {
  hierarchy[tag] = { ...province, parent: "can", kind: "province" };
  status[tag] = { state: "scope", source: policy.proposal };
}
for (const [tag] of Object.entries(policy.meshScopes)) {
  hierarchy[tag] = { label: "Ontario + Québec", labelFr: "Ontario + Québec", parent: null, kind: "mesh-scope" };
  status[tag] = { state: "pilot", source: policy.proposal };
}
const seeds = zones.features.map(feature => {
  const { tag, name, center, sourceUrl } = feature.properties;
  const provinces = policy.zoneProvinces[tag];
  assert.ok(provinces.length && provinces.every(province => policy.provinces[province]));
  hierarchy[tag] = { label: name, parent: provinces[0], provinces, kind: "city" };
  status[tag] = { state: "published", source: "MeshMapper", sourceUrl };
  return { tag, lat: center[1], lon: center[0], r: 0, provinces, sourceUrl };
});
const aliases = Object.fromEntries(tags.map(tag => [tag, [tag, hierarchy[tag].label, ...(policy.searchAliases[tag] || [])]]));
const legacyAliases = structuredClone(policy.additionalLegacyAliases);
for (const [iata, oldTag] of Object.entries(legacy.meshMapperTagMap)) {
  if (!tags.includes(iata) || iata === oldTag) continue;
  legacyAliases[oldTag] = [...new Set([...(legacyAliases[oldTag] || []), iata])].sort();
}
const catalog = {
  schema: "meshcore-canada-iata-scopes/v1",
  version: `meshmapper-iata-${zones.fetchedAt.slice(0, 10)}`,
  policy,
  source: { ...zones.source, fetchedAt: zones.fetchedAt,
    boundarySha256: createHash("sha256").update(readFileSync(new URL("docs/assets/regions/meshmapper-iata-boundaries.geojson", root))).digest("hex"),
    jurisdictionSha256: createHash("sha256").update(readFileSync(new URL("docs/assets/regions/scope-jurisdictions.geojson", root))).digest("hex") },
  meta: { name: "MeshCore Canada IATA scopes", rootTag: "can", defaultFirmware: "1.16", map: legacy.meta.map },
  hierarchy, status, seeds, aliases, legacyAliases,
  metroGroups: Object.entries(policy.provinces).map(([province, entry]) => ({ label: entry.label, tags: seeds.filter(seed => seed.provinces.includes(province)).map(seed => seed.tag) })),
  externalRegionPaths: legacy.externalRegionPaths,
};
const output = new URL("docs/assets/regions/iata-regions.json", root);
const compatibility = new URL("docs/assets/regions/canada-regions.json", root);
const text = JSON.stringify(catalog, null, 2) + "\n";
if (process.argv.includes("--check")) {
  assert.equal(readFileSync(output, "utf8"), text, "IATA catalog is stale; run node scripts/build-iata-catalog.mjs");
  assert.equal(readFileSync(compatibility, "utf8"), text, "The public catalogue alias must match the IATA catalogue");
} else {
  writeFileSync(output, text);
  writeFileSync(compatibility, text);
}
console.log(`${process.argv.includes("--check") ? "Verified" : "Generated"} ${seeds.length} IATA regions: ${fileURLToPath(output)}`);
