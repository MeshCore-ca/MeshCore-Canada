import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const supportSource = read("docs/assets/regions/modules/configurator-support.js");
const regionsSource = read("docs/assets/regions/regions.js");

function loadSupport() {
  const context = vm.createContext({});
  context.globalThis = context;
  vm.runInContext(supportSource, context);
  return context.MeshCoreRegionConfiguratorSupport;
}

test("config and map load the pure support helper before the region application", () => {
  for (const page of ["docs/config/index.md", "docs/config/map.md"]) {
    const markdown = read(page);
    assert.ok(
      markdown.indexOf("assets/regions/modules/configurator-support.js") <
        markdown.indexOf("assets/regions/regions.js"),
    );
  }
});

test("manual coordinates fail closed", () => {
  const support = loadSupport();
  assert.deepEqual(
    JSON.parse(JSON.stringify(support.parseCoordinates("45.4215", "-75.6972"))),
    { lat: 45.4215, lon: -75.6972 },
  );
  assert.equal(support.parseCoordinates("91", "-75"), null);
  assert.equal(support.parseCoordinates("45", "not-a-number"), null);
});

test("commissioning records omit sensitive and exact location fields", () => {
  const support = loadSupport();
  const record = support.commissioningRecord({
    generatedAt: "2026-07-19T00:00:00.000Z",
    locationLabel: "Ottawa",
    homeRegion: "Canada > Ontario > Ottawa",
    firmware: "v1.16+",
    budget: "4 / 32 tags",
    paths: ["Canada > Ontario > Ottawa"],
    commands: ["region def can on ott"],
    password: "must-not-appear",
    coordinates: "45.4215,-75.6972",
  });
  assert.match(record, /region def can on ott/);
  assert.doesNotMatch(record, /must-not-appear|45\.4215|-75\.6972/);
});

test("place searches and map tiles load automatically", () => {
  assert.doesNotMatch(regionsSource, /allowExternal/);
  assert.doesNotMatch(regionsSource, /online-search-consent|map-online-search-consent/);
  assert.match(regionsSource, /setTimeout\(locate, 0\)/);
  assert.match(regionsSource, /geocode\(data, query, thisController && thisController\.signal\)/);
  assert.doesNotMatch(regionsSource, /tile-consent|Allow OpenStreetMap tiles before loading/);
  assert.match(regionsSource, /window\.setTimeout\(loadInteractiveMap, 0\)/);
  assert.match(regionsSource, /tile\.openstreetmap\.org/);
  assert.match(regionsSource, /Browse regions without search or a map/);
});
