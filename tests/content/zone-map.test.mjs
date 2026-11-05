import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import { before, test } from "node:test";
import "../../docs/assets/regions/modules/iata-scopes.js";

// The "Find your zone" page (/config/map/). Its script is a classic browser script: run it in this realm so
// it sets its global. There is no document here, so it must not try to draw anything.
vm.runInThisContext(readFileSync("docs/assets/javascripts/place-search.js", "utf8"), { filename: "place-search.js" });
vm.runInThisContext(readFileSync("docs/assets/setup/setup-place.js", "utf8"), { filename: "setup-place.js" });
vm.runInThisContext(readFileSync("docs/assets/setup/zone-map.js", "utf8"), { filename: "zone-map.js" });
const zones = globalThis.MeshCoreZoneMap;

const read = (path) => readFileSync(path, "utf8");
const PAGES = { en: "docs/config/map.md", fr: "docs/config/map.fr.md" };
const SCRIPTS = [
  "assets/regions/modules/iata-scopes.js",
  "assets/javascripts/place-search.js",
  "assets/setup/setup-flow.js",
  "assets/setup/setup-place.js",
  "assets/setup/zone-map.js"
];

function frontMatter(markdown) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  assert.ok(match, "front matter");
  return match[1];
}

// The entries of a front matter list, in order.
function list(header, key) {
  const block = new RegExp(`^${key}:\\n((?:  - .+\\n?)+)`, "m").exec(header + "\n");
  return block ? block[1].trim().split("\n").map((line) => line.replace(/^\s*-\s*/, "")) : [];
}

let data;
before(async () => {
  const catalog = JSON.parse(read("docs/assets/regions/iata-regions.json"));
  data = {
    catalog,
    boundaries: JSON.parse(read("docs/assets/regions/iata-boundaries.geojson")),
    jurisdictions: JSON.parse(read("docs/assets/regions/scope-jurisdictions.geojson"))
  };
});

test("the map page is the zone finder: title, one-line intro, verified with its browser spec", () => {
  const expected = {
    en: { title: "Find your zone", intro: "See which zone (IATA code) a place is in, and whether it's a MeshMapper zone or a placeholder." },
    fr: { title: "Trouver votre zone", intro: "Découvrez dans quelle zone (code IATA) se trouve un endroit, et s’il s’agit d’une zone MeshMapper ou d’une zone provisoire." }
  };
  for (const [lang, path] of Object.entries(PAGES)) {
    const markdown = read(path);
    const header = frontMatter(markdown);
    assert.match(header, new RegExp(`^title: ${expected[lang].title}$`, "m"), path);
    assert.match(header, /^status: verified$/m, path);
    assert.match(header, /^evidence: tests\/browser\/zone-map\.spec\.mjs$/m, path);
    assert.ok(existsSync("tests/browser/zone-map.spec.mjs"), "the evidence exists");
    const body = markdown.slice(markdown.indexOf("\n---\n", 4) + 5);
    assert.match(body, new RegExp(`^# ${expected[lang].title}$`, "m"), path);
    assert.ok(body.includes(`\n${expected[lang].intro}\n`), `${path}: the one-line intro`);
    assert.match(body, /<div data-zone-map><\/div>/, path);
  }
});

test("the map page loads the setup tool's pieces, then the zone finder, and nothing of the old region map", () => {
  for (const path of Object.values(PAGES)) {
    const header = frontMatter(read(path));
    // In this order, each with a cache key.
    const scripts = list(header, "page_scripts");
    assert.deepEqual(scripts.map((entry) => entry.replace(/\?v=\d{8}-\d+$/, "")), SCRIPTS, path);
    for (const entry of scripts) assert.match(entry, /\?v=\d{8}-\d+$/, entry);
    assert.deepEqual(list(header, "page_styles").map((entry) => entry.replace(/\?v=\d{8}-\d+$/, "")), ["assets/setup/zone-map.css"], path);
    // The tiles' server is greeted, and Leaflet fetched, while the page is still being read: the same
    // files at the same addresses the script asks for, so nothing is downloaded twice.
    assert.deepEqual(list(header, "page_preconnects"), ["https://tile.openstreetmap.org"], path);
    assert.deepEqual(list(header, "page_preloads"), ["assets/regions/vendor/leaflet/leaflet.js", "assets/regions/vendor/leaflet/leaflet.css"], path);
    for (const old of ["regions.js", "regions.css", "configurator-support.js", "radio-profiles.js", "data-mcc-regions"]) {
      assert.ok(!read(path).includes(old), `${path} must not load ${old}`);
    }
    // Leaflet is run by the script; the page only hints that it will be wanted.
    const leaflet = read(path).split("\n").filter((entry) => /leaflet/i.test(entry));
    assert.deepEqual(leaflet, ["  - assets/regions/vendor/leaflet/leaflet.js", "  - assets/regions/vendor/leaflet/leaflet.css"], path);
  }
  const script = read("docs/assets/setup/zone-map.js");
  assert.match(script, /"\.\.\/regions\/vendor\/leaflet\/leaflet\.js"/, "the site's vendored Leaflet");
  assert.match(script, /"\.\.\/regions\/vendor\/leaflet\/leaflet\.css"/, "and its stylesheet");
  // The theme template turns those two lists into link hints.
  const template = read("overrides/main.html");
  assert.match(template, /page\.meta\.page_preconnects[\s\S]*rel="preconnect"/);
  assert.match(template, /page\.meta\.page_preloads[\s\S]*rel="preload"/);
  assert.match(script, /https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/, "OpenStreetMap tiles");
  assert.doesNotMatch(script, /innerHTML/, "text from the address bar or the search is never set as HTML");
});

test("without JavaScript the page says so and points at How repeaters work; the footer has its three links", () => {
  const footers = {
    en: ["[How zones work](guide.md#scopes-and-regions)", "[Download zone outlines](../assets/regions/iata-boundaries.geojson)", "[Data sources](../assets/regions/NOTICE.txt)"],
    fr: ["[Comprendre les zones](guide.md#scopes-and-regions)", "[Télécharger les tracés des zones](../assets/regions/iata-boundaries.geojson)", "[Sources de données](../assets/regions/NOTICE.txt)"]
  };
  const guide = { en: "[How repeaters work](guide.md#scopes-and-regions)", fr: "[Comprendre les répéteurs](guide.md#scopes-and-regions)" };
  for (const [lang, path] of Object.entries(PAGES)) {
    const markdown = read(path);
    const noscript = /<noscript[^>]*>(.*)<\/noscript>/.exec(markdown);
    assert.ok(noscript && noscript[1].includes(guide[lang]), `${path}: noscript line`);
    for (const link of footers[lang]) assert.ok(markdown.includes(link), `${path}: ${link}`);
  }
});

test("the nav calls it Find your zone, in both languages", () => {
  const config = read("mkdocs.yml");
  assert.match(config, /^ {6}- Find your zone: config\/map\.md$/m);
  assert.match(config, /^ {12}Find your zone: Trouver votre zone$/m);
  assert.doesNotMatch(config, /Find your region/);
});

test("the Lighthouse map routes open a zone that still exists", () => {
  const runner = read("scripts/run-lighthouse.mjs");
  for (const [name, route] of [["map-result", "/config/map/?tag=ytr&province=on"], ["mobile-map-result", "/config/map/?tag=ytr&province=on"], ["mobile-fr-map-result", "/fr/config/map/?tag=ytr&province=on"]]) {
    assert.ok(runner.includes(`["${name}", "${route}"`), name);
  }
  assert.doesNotMatch(runner, /tag=ott/);
});

test("the two string tables have the same keys, every string filled, and the same placeholders", () => {
  const { en, fr } = zones.text;
  assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
  const holes = (value) => (value.match(/\{\w+\}/g) || []).sort();
  for (const key of Object.keys(en)) {
    assert.ok(en[key].trim() && fr[key].trim(), key);
    assert.deepEqual(holes(fr[key]), holes(en[key]), key);
    if (holes(en[key]).includes("{link}")) assert.ok(en[`${key}.link`] && fr[`${key}.link`], `${key}.link`);
  }
  assert.throws(() => zones.t("no.such.key", "en"), /Unknown/);
  assert.throws(() => zones.t("legend.you", "de"), /Unknown/);
  assert.equal(zones.t("line.mesh", "en", { code: "YTR" }), "A published MeshMapper zone. Repeaters and observers here use the code YTR.");
});

test("the approved wording, word for word", () => {
  const t = zones.t;
  assert.deepEqual(["legend.you", "legend.mesh", "legend.placeholder"].map((key) => t(key, "en")), ["Your zone", "MeshMapper zone", "Placeholder"]);
  assert.deepEqual(["badge.mesh", "badge.starter", "badge.extension"].map((key) => t(key, "en")), ["MeshMapper zone", "Placeholder", "Placeholder · planning extension"]);
  assert.equal(t("line.placeholder", "en"), "No MeshMapper zone here yet. MeshCore Canada uses this outline until local operators publish one on MeshMapper.");
  assert.equal(t("action.setup", "en"), "Set up a repeater here");
  assert.equal(t("action.meshmapper", "en"), "Open in MeshMapper");
  assert.equal(t("tell", "en"), "Something wrong with this zone? {link}.");
  assert.equal(t("tell.link", "en"), "Tell us");
  assert.equal(t("more", "en"), "More about this region");
  assert.equal(t("more.no-maintainer", "en"), "No maintainer listed. {link}");
  assert.equal(t("more.no-maintainer.link", "en"), "Volunteer");
  assert.equal(t("browse", "en"), "Browse by province or territory");
  assert.equal(t("card.title", "en", { code: "YTR", name: "Quinte West" }), "YTR · Quinte West");
});

test("kind(): a MeshMapper zone, a starter region, and a spot in a planning extension", () => {
  assert.equal(zones.kind("ytr", null, data), "mesh");
  assert.equal(zones.kind("ytr", { lat: 44.1628, lon: -77.3832 }, data), "mesh");
  // Charlottetown's region is a MeshCore Canada starter region.
  assert.equal(zones.kind("yyg", null, data), "starter");
  assert.equal(zones.kind("yyg", { lat: 46.2382, lon: -63.1311 }, data), "starter");
  // The Wingham-area point is just outside Waterloo's MeshMapper zone.
  assert.equal(zones.kind("ykf", { lat: 43.8678, lon: -81.2619 }, data), "extension");
  assert.equal(zones.kind("ykf", null, data), "mesh");
});

test("kind(): a link's part=extension shows the extension badge, only for a code that has one", () => {
  assert.equal(zones.kind("ykf", null, data, "extension"), "extension");
  assert.equal(zones.kind("ytr", null, data, "extension"), "extension");
  // A starter region has no extension: the part is ignored.
  assert.equal(zones.kind("yyg", null, data, "extension"), "starter");
  // Anything else is ignored too.
  assert.equal(zones.kind("ytr", null, data, "bogus"), "mesh");
  assert.equal(zones.kind("ytr", null, data, "EXTENSION"), "mesh");
  // A spot decides on its own: inside Waterloo's MeshMapper zone it's the zone, whatever the link says.
  assert.equal(zones.kind("ykf", { lat: 43.4643, lon: -80.5204 }, data, "extension"), "mesh");
  assert.equal(zones.hasExtension("ytr", data), true);
  assert.equal(zones.hasExtension("yyg", data), false);
});

test("the extension sentence and the reviewed French wording", () => {
  const t = zones.t;
  assert.equal(t("more.extension", "en"), "Nearby places outside it use this code too, through a MeshCore Canada planning extension (dashed).");
  assert.match(t("more.extension", "fr"), /extension proposée/);
  assert.match(t("more.extension", "fr"), /pointillés/);
  assert.equal(t("status.nothing", "fr"), "Aucun endroit trouvé. Essayez une ville voisine, ou touchez la carte.");
  assert.match(t("status.format", "fr"), /44,1628; -77,3832/);
  assert.equal(t("line.mesh", "fr", { code: "YTR" }), "Une zone MeshMapper publiée. Les répéteurs et les observateurs de cette zone utilisent le code YTR.");
  assert.equal(t("more", "fr"), "En savoir plus sur cette région");
});

test("groups(): every zone under each province or territory it spans, west to east, names in order", () => {
  const groups = zones.groups(data, "en");
  assert.deepEqual(groups.map((group) => group.province), ["bc", "ab", "sk", "mb", "on", "qc", "nb", "ns", "pe", "nl", "yt", "nt", "nu"]);
  const ontario = groups.find((group) => group.province === "on");
  assert.equal(ontario.name, "Ontario");
  assert.ok(ontario.zones.some((zone) => zone.tag === "ytr" && zone.name === "Quinte West"));
  const names = ontario.zones.map((zone) => zone.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en")));
  // Ottawa–Gatineau spans the river, so it is listed in both provinces.
  assert.ok(groups.find((group) => group.province === "qc").zones.some((zone) => zone.tag === "yow"));
  assert.ok(ontario.zones.some((zone) => zone.tag === "yow"));
  const cities = Object.values(data.catalog.hierarchy).filter((entry) => entry.kind === "city");
  const listed = new Set(groups.flatMap((group) => group.zones.map((zone) => zone.tag)));
  assert.equal(listed.size, cities.length, "every zone is listed");
  // French names where the catalogue has them.
  const frGroups = zones.groups(data, "fr");
  assert.equal(frGroups.find((group) => group.province === "pe").name, "Île-du-Prince-Édouard");
  assert.ok(frGroups.find((group) => group.province === "pe").zones.some((zone) => zone.name === "Île-du-Prince-Édouard"));
});

test("links(): the setup tool, and the idea form with the zone filled in, relative to the page", () => {
  const en = zones.links("ytr", "on", "en");
  assert.equal(en.setup, "../?tag=ytr&province=on");
  const idea = new URL(en.boundary, "https://meshcore.ca/config/map/");
  assert.equal(idea.pathname, "/submit-idea/");
  assert.deepEqual(Object.fromEntries(idea.searchParams), { region: "ytr", request: "boundary", source_page: "https://meshcore.ca/config/map/" });
  assert.equal(new URL(en.maintainer, "https://meshcore.ca/config/map/").searchParams.get("request"), "maintainer");
  const fr = zones.links("yow", "qc", "fr");
  assert.equal(new URL(fr.setup, "https://meshcore.ca/fr/config/map/").href, "https://meshcore.ca/fr/config/?tag=yow&province=qc");
  assert.equal(new URL(fr.boundary, "https://meshcore.ca/fr/config/map/").searchParams.get("source_page"), "https://meshcore.ca/fr/config/map/");
});

test("the idea form reads the region and request the zone finder sends", () => {
  // The form fills in the zone only for a three-letter region and a known request.
  const form = read("docs/javascripts/submission-form.js");
  assert.match(form, /params\.get\("region"\)/);
  assert.match(form, /\/\^\[a-z\]\{3\}\$\/\.test\(region/);
  for (const request of ["boundary", "maintainer"]) assert.match(form, new RegExp(`${request}: "`), request);
  for (const tag of Object.keys(data.catalog.hierarchy).filter((key) => data.catalog.hierarchy[key].kind === "city")) {
    assert.match(tag, /^[a-z]{3}$/, `${tag} fits the form's region check`);
  }
});

test("the map's zone colours and the legend's swatches are the same colours", () => {
  const css = read("docs/assets/setup/zone-map.css");
  for (const [name, style] of Object.entries(zones.styles)) {
    assert.match(css, new RegExp(`--zm-${name}-line: ${style.color};`, "i"), `${name} line`);
    assert.match(css, new RegExp(`--zm-${name}-fill: ${style.fillColor};`, "i"), `${name} fill`);
  }
  assert.equal(zones.styles.placeholder.dashArray && typeof zones.styles.placeholder.dashArray, "string", "placeholders are dashed");
  assert.equal(zones.styles.mesh.dashArray, null, "MeshMapper zones are solid");
});

test("the setup tool's town step links to its zone on the map, with words in both languages", () => {
  const text = read("docs/assets/setup/setup-text.js");
  assert.match(text, /"town\.view-map": "View on map"/);
  assert.match(text, /"town\.view-map": "Voir sur la carte"/);
  const ui = read("docs/assets/setup/setup-ui.js");
  assert.match(ui, /data-setup-view-map/);
});
