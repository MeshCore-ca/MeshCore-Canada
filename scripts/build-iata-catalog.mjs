#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import "../docs/assets/regions/modules/iata-scopes.js";

const root = new URL("../", import.meta.url);
const load = path => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const policy = load("data/iata-scope-policy.json");
const published = load("docs/assets/regions/meshmapper-iata-boundaries.geojson");
const zones = load("docs/assets/regions/iata-boundaries.geojson");
const starters = load("data/iata-starter-regions.json");
const legacy = load("maintenance/legacy-regions/canada-regions.json");
const profileRecords = load("data/iata-region-profiles.json");
const communities = load("data/communities.json");
const communityFr = load("data/communities.fr.json").communities;
const anchors = load("data/community-search-anchors.json").communities;
assert.equal(policy.scopeModel, "flat");
const tags = zones.features.map(feature => feature.properties.tag);
assert.equal(profileRecords.schema, "meshcore-canada-iata-profiles/v1");
assert.ok(Object.keys(profileRecords.regions).every(tag => tags.includes(tag)), "Profile references unknown region");
const profiles = Object.fromEntries(zones.features.map(feature => {
  const tag = feature.properties.tag;
  const record = profileRecords.regions[tag] || {};
  assert.ok(Object.keys(record).every(key => ["maintainer", "settingsReview"].includes(key)), `Unknown profile field: ${tag}`);
  const maintainer = record.maintainer || null;
  const safeUrl = value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } };
  if (maintainer) {
    assert.ok(typeof maintainer.name === "string" && maintainer.name.length <= 100 && maintainer.name.trim());
    assert.ok(safeUrl(maintainer.contact) && safeUrl(maintainer.evidence), "Maintainer needs public contact and consent evidence");
  }
  const settingsReview = record.settingsReview || { status: "unconfirmed", checkedAt: null, evidence: null };
  assert.ok(["unconfirmed", "confirmed"].includes(settingsReview.status));
  if (settingsReview.status === "confirmed") {
    assert.match(settingsReview.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(settingsReview.checkedAt).toISOString().slice(0, 10), settingsReview.checkedAt, "Invalid settings review date");
    assert.ok(Date.parse(settingsReview.checkedAt) <= Date.now(), "Settings review date is in the future");
    assert.ok(safeUrl(settingsReview.evidence), "Settings confirmation needs its own public evidence");
  } else {
    assert.ok(!settingsReview.checkedAt && !settingsReview.evidence, "An unconfirmed record must not imply a completed review");
  }
  const local = communities.communities.filter(community => {
    const points = Number.isFinite(community.location?.latitude) && Number.isFinite(community.location?.longitude) ? [{ lat: community.location.latitude, lon: community.location.longitude }] : anchors[community.id];
    return points.some(point => globalThis.MeshCoreIataScopes.contains(feature, point.lat, point.lon));
  }).map(community => ({ id: community.id, name: community.name, nameFr: communityFr[community.id]?.name || community.name,
    route: community.canonical_route, override: !community.settings.inherit_national,
    settings: community.settings, listingReviewed: community.verified_at }));
  return [tag, { maintainer, settingsReview, communities: local }];
}));
assert.deepEqual([...tags].sort(), Object.keys(policy.zoneProvinces).sort(), "Review province metadata for every IATA region");
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
  const { tag, name, nameFr, center, regionSource, codeSource } = feature.properties;
  const starter = regionSource === "meshcore-canada";
  const sourceUrl = starter ? codeSource : feature.properties.sourceUrl;
  const provinces = policy.zoneProvinces[tag];
  assert.ok(provinces.length && provinces.every(province => policy.provinces[province]));
  hierarchy[tag] = { label: name, ...(nameFr ? { labelFr: nameFr } : {}), parent: provinces[0], provinces, kind: "city" };
  status[tag] = { state: starter ? "starter" : "published", source: starter ? "MeshCore Canada" : "MeshMapper", sourceUrl };
  return { tag, lat: center[1], lon: center[0], r: 0, provinces, sourceUrl, regionSource };
});
const aliases = Object.fromEntries(tags.map(tag => [tag, [tag, hierarchy[tag].label, hierarchy[tag].labelFr,
  ...(policy.searchAliases[tag] || []), ...(starters.regions.find(region => region.tag === tag)?.aliases || [])].filter(Boolean)]));
const legacyAliases = structuredClone(policy.additionalLegacyAliases);
for (const [iata, oldTag] of Object.entries(legacy.meshMapperTagMap)) {
  if (!tags.includes(iata) || iata === oldTag) continue;
  legacyAliases[oldTag] = [...new Set([...(legacyAliases[oldTag] || []), iata])].sort();
}
for (const starter of starters.regions.filter(region => region.area === "province")) {
  for (const [tag, entry] of Object.entries(legacy.hierarchy)) {
    if (Object.values(legacy.hierarchy).some(child => child.parent === tag)) continue;
    let parent = entry.parent;
    while (parent && parent !== starter.province) parent = legacy.hierarchy[parent]?.parent;
    if (parent === starter.province) legacyAliases[tag] = [starter.tag];
  }
}
const catalog = {
  schema: "meshcore-canada-iata-scopes/v1",
  version: `meshmapper-iata-${published.fetchedAt.slice(0, 10)}-starters-${starters.reviewedAt}`,
  policy,
  source: { ...published.source, fetchedAt: published.fetchedAt, starterReviewedAt: starters.reviewedAt,
    publishedCount: published.features.length, starterCount: starters.regions.length,
    boundarySha256: createHash("sha256").update(readFileSync(new URL("docs/assets/regions/iata-boundaries.geojson", root))).digest("hex"),
    meshmapperBoundarySha256: createHash("sha256").update(readFileSync(new URL("docs/assets/regions/meshmapper-iata-boundaries.geojson", root))).digest("hex"),
    jurisdictionSha256: createHash("sha256").update(readFileSync(new URL("docs/assets/regions/scope-jurisdictions.geojson", root))).digest("hex") },
  meta: { name: "MeshCore Canada IATA scopes", rootTag: "can", defaultFirmware: "1.16", map: legacy.meta.map },
  hierarchy, status, seeds, aliases, legacyAliases, profiles,
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
