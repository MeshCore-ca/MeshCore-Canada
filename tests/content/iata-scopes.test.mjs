import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const load = name => JSON.parse(readFileSync(`docs/assets/regions/${name}`, "utf8"));
const catalog = load("iata-regions.json");
const zones = load("meshmapper-iata-boundaries.geojson");
const combined = load("iata-boundaries.geojson");
const provinces = load("scope-jurisdictions.geojson");
const context = vm.createContext({ TextEncoder });
vm.runInContext(readFileSync("docs/assets/regions/modules/iata-scopes.js", "utf8"), context);
const api = context.MeshCoreIataScopes;
const plain = value => JSON.parse(JSON.stringify(value));

test("six starter regions cover the missing jurisdictions with honest source labels and flat scopes", () => {
  for (const [tag, province, lat, lon] of [
    ["yyg", "pe", 46.2382, -63.1311], ["yyt", "nl", 47.5605, -52.7128],
    ["yyr", "nl", 53.303, -60.326], ["yxy", "yt", 60.7212, -135.0568],
    ["yzf", "nt", 62.454, -114.3774], ["yfb", "nu", 63.7467, -68.517],
  ]) {
    const found = plain(api.matches(combined, lat, lon));
    assert.deepEqual(found.map(feature => feature.properties.tag), [tag]);
    assert.equal(found[0].properties.regionSource, "meshcore-canada");
    assert.equal(catalog.status[tag].state, "starter");
    assert.ok(!catalog.seeds.find(seed => seed.tag === tag).sourceUrl.includes("meshmapper.net"));
    const result = api.profile(catalog, { home: tag, province });
    assert.deepEqual(plain(api.commands(result)), [`region def ${tag}|* ${province}|* can`, "region allowf *", `region default ${tag}`]);
  }
  for (const feature of zones.features) {
    assert.deepEqual(combined.features.find(item => item.properties.tag === feature.properties.tag).geometry, feature.geometry);
  }
});

test("Ottawa and Gatineau share yow but retain the repeater's physical province", () => {
  for (const province of ["on", "qc"]) {
    const result = api.profile(catalog, { home: "yow", province });
    assert.deepEqual(plain(result.tags), ["yow", province, "onqc", "can"]);
    assert.deepEqual(plain(api.commands(result)), [`region def yow|* ${province}|* onqc|* can`, "region allowf *", "region default yow"]);
    assert.equal(result.companionDefault, "onqc");
  }
  assert.equal(api.provinceAt(provinces, 45.4215, -75.6972), "on");
  assert.equal(api.provinceAt(provinces, 45.4765, -75.7013), "qc");
  for (const [lat, lon] of [[45.4215, -75.6972], [45.4765, -75.7013]]) {
    assert.ok(api.matches(zones, lat, lon).some(feature => feature.properties.tag === "yow"));
  }
});

test("Rigaud bridge carries both cities, drops unscoped floods, and keeps local adverts", () => {
  const result = api.profile(catalog, { home: "yow", province: "qc", bridge: true, cities: ["yul", "yow", "yul"] });
  assert.deepEqual(plain(api.commands(result)), ["region def yow|* yul|* qc|* onqc|* can", "region denyf *", "region default yow"]);
  assert.deepEqual(plain(result.jurisdictions), ["qc"]);
  assert.throws(() => api.profile(catalog, { home: "yow", province: "on", cities: ["yul"] }));
});

test("Canada-wide IATA codes do not invent an ON/QC mesh scope in other provinces", () => {
  const result = api.profile(catalog, { home: "yyc", province: "ab" });
  assert.deepEqual(plain(result.tags), ["yyc", "ab", "can"]);
  assert.equal(result.companionDefault, null);
  assert.equal(result.reservedScope, "can");
  assert.throws(() => api.profile(catalog, { home: "ott", province: "on" }));
  assert.throws(() => api.profile(catalog, { home: "yow" }));
  assert.throws(() => api.profile(catalog, { home: "yow", province: "invalid" }));
  assert.throws(() => api.profile(catalog, { home: "yow", province: "constructor" }));
  assert.throws(() => api.profile(catalog, { home: "yow", province: "__proto__" }));
  assert.throws(() => api.profile(catalog, { home: "yow", province: "on", bridge: true, cities: ["x;erase"] }));
});

test("older supported firmware uses put and explicit allow flags only where required", () => {
  const result = api.profile(catalog, { home: "yow", province: "on" });
  assert.deepEqual(plain(api.commands(result, "1.15")), ["region put yow", "region put on", "region put onqc", "region put can", "region allowf *", "region default yow"]);
  const legacy = plain(api.commands(result, "1.14"));
  assert.deepEqual(legacy, ["region put yow", "region allowf yow", "region put on", "region allowf on", "region put onqc", "region allowf onqc", "region put can", "region allowf can", "region allowf *"]);
  assert.ok(!legacy.some(command => command.startsWith("region default") || command.startsWith("region def ")));
  assert.throws(() => api.commands(result, "1.13"));
});

test("every published city generates a flat, bounded profile with explicit wildcard behavior", () => {
  for (const seed of catalog.seeds) {
    for (const province of seed.provinces) {
      const result = api.profile(catalog, { home: seed.tag, province });
      const commands = plain(api.commands(result));
      assert.ok(result.tags.every(tag => result.parentOverrides[tag] === null));
      assert.ok(commands.every(command => Buffer.byteLength(command) <= 160));
      assert.ok(result.budget.responseBytes <= 160);
      assert.equal(commands[1], "region allowf *");
    }
  }
  const oversized = api.profile(catalog, { home: "yow", province: "on", bridge: true, cities: catalog.seeds.map(seed => seed.tag) });
  assert.throws(() => api.commands(oversized));
  assert.throws(() => api.budget(["a", "b"], { a: "b", b: "a" }));
});

test("published boundaries, holes, gaps, and province lookup are not replaced by proximity", () => {
  assert.equal(api.matches(zones, 80, -100).length, 0);
  assert.equal(api.provinceAt(provinces, 40.7128, -74.006), null);
  const donut = { geometry: { type: "Polygon", coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]], [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]] } };
  assert.equal(api.contains(donut, 0.5, 0.5), true);
  assert.equal(api.contains(donut, 2, 2), false);
  assert.equal(api.contains(donut, NaN, 0), false);
});
