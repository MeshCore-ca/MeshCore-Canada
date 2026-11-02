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

// indexOf is -1 for a missing script, which would sort before everything: require both to be present.
function loadsBefore(markdown, first, second) {
  const a = markdown.indexOf(first);
  const b = markdown.indexOf(second);
  return a !== -1 && b !== -1 && a < b;
}

test("the map loads the pure support helper before the region application", () => {
  for (const page of ["docs/config/map.md", "docs/config/map.fr.md"]) {
    assert.ok(
      loadsBefore(read(page), "assets/regions/modules/configurator-support.js", "assets/regions/regions.js"),
      page,
    );
  }
});

test("the setup tool page loads the scope generator before its commands, and not the region application", () => {
  for (const page of ["docs/config/index.md", "docs/config/index.fr.md"]) {
    const markdown = read(page);
    assert.ok(loadsBefore(markdown, "assets/regions/modules/iata-scopes.js", "assets/setup/setup-commands.js"), page);
    assert.ok(loadsBefore(markdown, "assets/setup/setup-commands.js", "assets/setup/setup-ui.js"), page);
    assert.ok(!markdown.includes("assets/regions/regions.js"), page);
  }
});

test("the region map script no longer carries the old configurator, and the map page still loads it", () => {
  for (const name of ["initConfig", "toolUi", "buildCommands", "renderResult", "refreshTool"]) {
    assert.doesNotMatch(regionsSource, new RegExp("\\b" + name + "\\b"), name);
  }
  assert.doesNotMatch(regionsSource, /mode === "config"/, "initRegions must not dispatch the old config mode");
  assert.doesNotMatch(regionsSource, /mcc-wizard/);
  assert.doesNotMatch(read("docs/assets/regions/regions.css"), /mcc-wizard|data-mcc-regions="config"/);
  // The dashboard names the explainer the way the site nav does.
  assert.match(regionsSource, /regionPageHref\("guide"\)\) \+ '">' \+ icon\("book-open-check"\) \+ '<span><strong>How repeaters work<\/strong>/);
  assert.match(regionsSource, /"How repeaters work": "Comprendre les répéteurs"/);
  assert.doesNotMatch(regionsSource, /<strong>Guide<\/strong>/);
  for (const mode of ["map", "dashboard", "table"]) {
    assert.match(regionsSource, new RegExp('mode === "' + mode + '"'), mode);
  }
  for (const page of ["docs/config/map.md", "docs/config/map.fr.md"]) {
    const markdown = read(page);
    assert.match(markdown, /assets\/regions\/regions\.js\?v=/, page);
    assert.match(markdown, /<div data-mcc-regions="map"/, page);
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
  assert.equal(support.parseCoordinates("", "-75"), null);
  assert.equal(support.parseCoordinates("45", "   "), null);
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

test("place searches run on submission and visible maps load without consent", () => {
  assert.doesNotMatch(regionsSource, /allowExternal/);
  assert.doesNotMatch(regionsSource, /online-search-consent|map-online-search-consent/);
  assert.match(regionsSource, /els\.locate\.addEventListener\("click", locate\)/);
  assert.match(regionsSource, /geocode\(data, query, thisController && thisController\.signal\)/);
  assert.doesNotMatch(regionsSource, /tile-consent|Allow OpenStreetMap tiles before loading/);
  assert.match(regionsSource, /window\.setTimeout\(loadInteractiveMap, 0\)/);
  assert.match(regionsSource, /mapObserver\.observe\(els\.mapStage\)/);
  assert.match(regionsSource, /tile\.openstreetmap\.org/);
  assert.match(regionsSource, /Browse by province or territory/);
  assert.match(regionsSource, /Browse all regions/);
});

test("region icons are inline SVGs matching the vendored source", () => {
  const names = [...new Set([...regionsSource.matchAll(/icon\("([^"]+)"\)/g)].map(match => match[1]))].sort();
  const icons = JSON.parse(regionsSource.match(/var ICONS = (\{[\s\S]*?\n  \});/)[1]);
  assert.deepEqual(Object.keys(icons).sort(), names);
  const context = vm.createContext({});
  vm.runInContext(read("docs/assets/regions/vendor/lucide.js"), context);
  for (const name of names) {
    const key = name.replace(/(^|-)([a-z])/g, (_, dash, letter) => letter.toUpperCase());
    const expected = context.lucide.icons[key].map(([tag, attrs]) =>
      '<' + tag + ' ' + Object.entries(attrs).map(([key, value]) => key + '=' + JSON.stringify(value)).join(' ') + ' />'
    ).join('');
    assert.equal(icons[name], expected);
  }
  assert.doesNotMatch(regionsSource, /loadLucide|refreshIcons|data-lucide/);
});
