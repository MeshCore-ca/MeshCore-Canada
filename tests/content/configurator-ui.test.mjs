import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

// indexOf is -1 for a missing script, which would sort before everything: require both to be present.
function loadsBefore(markdown, first, second) {
  const a = markdown.indexOf(first);
  const b = markdown.indexOf(second);
  return a !== -1 && b !== -1 && a < b;
}

test("the setup tool page loads the scope generator before its commands, and not the zone finder", () => {
  for (const page of ["docs/config/index.md", "docs/config/index.fr.md"]) {
    const markdown = read(page);
    assert.ok(loadsBefore(markdown, "assets/regions/modules/iata-scopes.js", "assets/setup/setup-commands.js"), page);
    assert.ok(loadsBefore(markdown, "assets/setup/setup-commands.js", "assets/setup/setup-ui.js"), page);
    assert.ok(!markdown.includes("assets/setup/zone-map"), page);
    // The map step loads Leaflet itself, only when it opens, so the page stays light.
    assert.doesNotMatch(markdown, /leaflet/i, page);
  }
  const ui = read("docs/assets/setup/setup-ui.js");
  assert.match(ui, /"\.\.\/regions\/vendor\/leaflet\/leaflet\.js"/, "the map step reuses the site's vendored Leaflet");
  assert.match(ui, /https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/, "with OpenStreetMap tiles");
});

test("the zone finder puts no consent gate in front of the OpenStreetMap tiles or the place search", () => {
  // Its scripts and their order are checked in zone-map.test.mjs.
  const source = read("docs/assets/setup/zone-map.js");
  assert.doesNotMatch(source, /allowExternal|tile-consent|online-search-consent|Allow OpenStreetMap tiles/);
  assert.match(source, /Search\.find\(/, "a search runs when it is submitted");
});
