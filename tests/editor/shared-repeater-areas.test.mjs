import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const catalog = JSON.parse(read("docs/assets/regions/iata-regions.json"));
const boundaries = JSON.parse(read("docs/assets/regions/meshmapper-iata-boundaries.geojson"));
const provinces = JSON.parse(read("docs/assets/regions/scope-jurisdictions.geojson"));
const script = read("docs/assets/regions/regions.js");
const plain = value => JSON.parse(JSON.stringify(value));

function internals() {
  const context = {
    URL, URLSearchParams, TextEncoder, console,
    fetch() { throw new Error("Unexpected network request"); },
    window: { location: { origin: "https://meshcore.ca", pathname: "/config/", search: "" }, setTimeout },
    document: {
      currentScript: { src: "https://meshcore.ca/assets/regions/regions.js" },
      baseURI: "https://meshcore.ca/config/",
      readyState: "loading",
      addEventListener() {},
      querySelector() { return { getAttribute() { return "./"; } }; }
    }
  };
  runInNewContext(read("docs/assets/regions/modules/iata-scopes.js"), context);
  context.window.MeshCoreIataScopes = context.MeshCoreIataScopes;
  runInNewContext(read("docs/assets/regions/modules/configurator-support.js"), context);
  context.window.MeshCoreRegionConfiguratorSupport = context.MeshCoreRegionConfiguratorSupport;
  const marker = "  if (window.document$";
  assert.ok(script.includes(marker));
  runInNewContext(script.replace(marker,
    "  globalThis.api = { prepareCatalog, applyGeneratedPartition, expandSharedRepeaterLeaves, recommend, resolveLocation, initialLocation, mapHrefForState, localGeocode };\n" + marker), context);
  const data = context.api.prepareCatalog(structuredClone(catalog));
  context.api.applyGeneratedPartition(data, structuredClone(boundaries), structuredClone(provinces));
  return { api: context.api, scopes: context.MeshCoreIataScopes, data };
}

test("the active configurator refuses the former census catalogue", () => {
  const { api } = internals();
  assert.throws(() => api.prepareCatalog(JSON.parse(read("maintenance/legacy-regions/canada-regions.json"))), /out of date/);
});

test("Ottawa and Gatineau use the same city zone without automatically carrying both provinces", () => {
  const { api, data } = internals();
  for (const [lat, lon, province] of [[45.4215, -75.6972, "on"], [45.4765, -75.7013, "qc"]]) {
    const result = api.resolveLocation(data, lat, lon);
    assert.equal(result.primary.seed.tag, "yow");
    assert.equal(result.province, province);
    const profile = api.recommend(data, result, "residential", [], []);
    assert.deepEqual(plain(profile.tags), ["yow", province, "onqc", "can"]);
    assert.deepEqual(plain(api.expandSharedRepeaterLeaves(data, ["yow"])), ["yow"]);
  }
});

test("overlapping published zones need an explicit choice and gaps never use a nearest-zone fallback", () => {
  const { api, data } = internals();
  const altered = structuredClone(boundaries);
  altered.features.find(feature => feature.properties.tag === "yul").geometry =
    structuredClone(altered.features.find(feature => feature.properties.tag === "yow").geometry);
  api.applyGeneratedPartition(data, altered, provinces);
  const ambiguous = api.resolveLocation(data, 45.4215, -75.6972);
  assert.equal(ambiguous.primary, null);
  assert.equal(ambiguous.matches.length, 2);
  assert.equal(api.resolveLocation(data, 45.4215, -75.6972, "yow").primary.seed.tag, "yow");
  assert.equal(api.resolveLocation(data, 80, -100).hasMatch, false);
});

test("old links migrate only unique aliases and retain exact saved locations for a fresh lookup", () => {
  const { api, data } = internals();
  const ottawa = api.initialLocation(data, new URLSearchParams("tag=ott&province=on"));
  assert.equal(ottawa.tag, "yow");
  assert.equal(ottawa.legacyTag, "ott");
  assert.equal(ottawa.provinceTag, "on");
  assert.equal(api.initialLocation(data, new URLSearchParams("tag=capnat")), null);
  const location = api.initialLocation(data, new URLSearchParams("tag=capnat&lat=46.89&lon=-71.41"));
  assert.equal(location.tag, null);
  assert.equal(location.lat, 46.89);
  assert.equal(api.initialLocation(data, new URLSearchParams("tag=missing&lat=&lon=-71")), null);
});

test("shared-zone place labels never invent an Ontario location for Gatineau", () => {
  const { api, data } = internals();
  const hit = api.localGeocode(data, "Gatineau");
  assert.equal(hit.tag, "yow");
  assert.equal(hit.province, null);
  assert.doesNotMatch(hit.name, /Ontario/);
});

test("neighbouring network paths remain explicit and do not become Canadian geometry", () => {
  const { api, data, scopes } = internals();
  const entries = Object.entries(data.externalRegionPaths);
  assert.ok(entries.length > 0);
  for (const [, record] of entries) {
    assert.equal(record.automatic, false);
    assert.equal(record.geographic, false);
    assert.ok(record.trafficEvidence);
  }
  const [wny] = entries.find(([, record]) => record.path.join(" ") === "us us-ny");
  const result = api.resolveLocation(data, 43.6532, -79.3832);
  const local = api.recommend(data, result, "residential", [], []);
  assert.ok(!local.tags.includes("us"));
  const bridge = api.recommend(data, result, "high-site", ["yyz", "ykf"], [wny]);
  assert.equal(scopes.commands(bridge)[0], "region def yyz|* ykf|* on|* onqc|* can|* us us-ny");
  assert.equal(scopes.commands(bridge)[1], "region denyf *");
  assert.ok(bridge.notes.every(note => !note.includes("before applying")));
  assert.equal(data.partitionByTag["us-ny"], undefined);
});

test("extra Canadian city zones never add their provinces automatically", () => {
  const { api, data } = internals();
  const result = api.resolveLocation(data, 43.6532, -79.3832);
  const bridge = api.recommend(data, result, "high-site", ["yyz", "yul"], []);
  assert.deepEqual(plain(bridge.tags), ["yyz", "yul", "on", "onqc", "can"]);
});

test("config-to-map handoff preserves IATA choices, province, and opt-in settings without unrelated fields", () => {
  const { api, data } = internals();
  const resolution = api.resolveLocation(data, 45.4765, -75.7013);
  const url = new URL(api.mapHrefForState({
    lat: 45.4765, lon: -75.7013, name: "Gatineau", forcedTag: "yow", resolution,
    jurisdictionTag: "qc", type: "high-site", selectedMetros: ["yow", "yul"],
    selectedExternalPaths: [], firmware: "1.16", radioProfile: "keep", hashMode: "2",
    standardDefaults: true, privateKey: "never-forward"
  }));
  assert.equal(url.searchParams.get("tag"), "yow");
  assert.equal(url.searchParams.get("province"), "qc");
  assert.equal(url.searchParams.get("regions"), "yow,yul");
  assert.equal(url.searchParams.get("defaults"), "onqc");
  assert.equal(url.searchParams.get("hash"), "2");
  assert.ok(!url.href.includes("never-forward"));
});
