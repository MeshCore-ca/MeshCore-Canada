import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { before, test } from "node:test";
import "../../docs/assets/regions/modules/iata-scopes.js";

// Classic browser scripts: run them in this realm so they set their globals.
vm.runInThisContext(readFileSync("docs/assets/javascripts/place-search.js", "utf8"), { filename: "place-search.js" });
vm.runInThisContext(readFileSync("docs/assets/setup/setup-place.js", "utf8"), { filename: "setup-place.js" });
const place = globalThis.MeshCoreSetupPlace;

const base = new URL("https://meshcore.test/assets/setup/setup-place.js");
const requested = [];
// Maps the site's /assets/... URLs to docs/assets/... on disk; the ?v= cache key is ignored.
async function fileFetcher(url) {
  const address = new URL(String(url));
  requested.push(address.href);
  try {
    const text = await readFile("docs" + address.pathname, "utf8");
    return { ok: true, json: async () => JSON.parse(text) };
  } catch {
    return { ok: false, json: async () => { throw new Error("not found"); } };
  }
}

const catalog = JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8"));
const where = (lat, lon, province) => ({ lat, lon, province });
const pairs = (result) => result.options.map((o) => [o.tag, o.province]);
let data;

before(async () => {
  data = await place.loadData(base, fileFetcher);
});

test("loadData asks for the catalogue, hashed boundaries and jurisdictions, and radio profiles", () => {
  const urls = requested.filter((href) => href.includes("/assets/"));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/iata-regions.json"));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/iata-boundaries.geojson?v=" + catalog.source.boundarySha256));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/scope-jurisdictions.geojson?v=" + catalog.source.jurisdictionSha256));
  assert.ok(urls.includes("https://meshcore.test/assets/radio-profiles.json"));
  assert.deepEqual(Object.keys(data).sort(), ["boundaries", "catalog", "jurisdictions", "profiles"]);
  assert.equal(data.boundaries.type, "FeatureCollection");
  assert.equal(data.jurisdictions.type, "FeatureCollection");
  assert.ok(data.profiles.some((profile) => profile.id === "canada"));
});

test("loadData fails clearly when a file is missing or is not a boundary collection", async () => {
  const missing = async (url) => (String(url).includes("iata-boundaries") ? { ok: false } : fileFetcher(url));
  await assert.rejects(place.loadData(base, missing), /unavailable/i);
  const wrong = async (url) => (String(url).includes("scope-jurisdictions")
    ? { ok: true, json: async () => ({ type: "Feature" }) }
    : fileFetcher(url));
  await assert.rejects(place.loadData(base, wrong), /invalid/i);
});

test("towns resolve to their region and province", () => {
  assert.deepEqual(pairs(place.resolve(where(44.1628, -77.3832, "Ontario"), data)), [["ytr", "on"]]);
  assert.deepEqual(pairs(place.resolve(where(45.4765, -75.7013, "QC"), data)), [["yow", "qc"]]);
  assert.equal(place.resolve(where(45.4215, -75.6972, "Québec"), data).status, "province-mismatch");
  assert.deepEqual(place.resolve(where(49.2827, -123.1207, "BC"), data).options.map((o) => o.tag), ["yvr"]);
  assert.deepEqual(pairs(place.resolve(where(44.2312, -76.486, "Ontario"), data)), [["ygk", "on"]]);
  assert.deepEqual(pairs(place.resolve(where(45.5019, -73.5674, "Québec"), data)), [["yul", "qc"]]);
  assert.deepEqual(pairs(place.resolve(where(43.6532, -79.3832, "Ontario"), data)), [["yyz", "on"]]);
});

test("a single region is status one, with its English and French names", () => {
  const result = place.resolve(where(49.2827, -123.1207, "British Columbia"), data);
  assert.equal(result.status, "one");
  // nameFr appears only where the catalogue has a French label.
  assert.equal(catalog.hierarchy.yvr.labelFr, undefined);
  assert.deepEqual(result.options, [{ tag: "yvr", province: "bc", name: "Vancouver" }]);
  const charlottetown = place.resolve(where(46.2382, -63.1311, "Île-du-Prince-Édouard"), data);
  assert.equal(charlottetown.status, "one");
  assert.deepEqual(charlottetown.options, [{ tag: "yyg", province: "pe", name: "Prince Edward Island", nameFr: "Île-du-Prince-Édouard" }]);
});

test("the province can be given as a name or a code, in either language, with or without accents", () => {
  for (const province of ["QC", "qc", "Quebec", "Québec", "quebec"]) {
    assert.deepEqual(pairs(place.resolve(where(45.4765, -75.7013, province), data)), [["yow", "qc"]], province);
  }
  for (const province of ["Colombie-Britannique", "British Columbia", "bc"]) {
    assert.deepEqual(pairs(place.resolve(where(49.2827, -123.1207, province), data)), [["yvr", "bc"]], province);
  }
});

test("places covered by several regions are status many, never silently picked", () => {
  const kingstonOttawa = place.resolve(where(44.55, -76.85, "Ontario"), data);
  assert.equal(kingstonOttawa.status, "many");
  assert.deepEqual(pairs(kingstonOttawa), [["ygk", "on"], ["yow", "on"]]);
  const laurentians = place.resolve(where(45.95, -74.8, "Québec"), data);
  assert.equal(laurentians.status, "many");
  assert.deepEqual(pairs(laurentians), [["yow", "qc"], ["yul", "qc"]]);
  // Regions that share a stretch of boundary are listed once each, not once per outline.
  const fraserValley = place.resolve(where(49.023309, -122.368297, "BC"), data);
  assert.equal(fraserValley.status, "many");
  assert.deepEqual(pairs(fraserValley), [["yvr", "bc"], ["yxx", "bc"]]);
});

test("a place that no region covers is status none", () => {
  // The listed regions cover all of Canada's settled land, so use a place outside it.
  const seattle = place.resolve(where(47.6062, -122.3321, "Washington"), data);
  assert.equal(seattle.status, "none");
  assert.deepEqual(seattle.options, []);
  assert.equal(place.resolve(where(Number.NaN, -68.5, "Nunavut"), data).status, "none");
  const unlisted = { ...data, boundaries: { type: "FeatureCollection", features: [] } };
  const rural = place.resolve(where(45.4215, -75.6972, "Ontario"), unlisted);
  assert.equal(rural.status, "none");
  assert.deepEqual(rural.options, []);
  // With no region to offer, a wrong province is not worth a mismatch message either.
  assert.equal(place.resolve(where(45.4215, -75.6972, "Québec"), unlisted).status, "none");
});

test("a geocoder province that disagrees with the boundary is a mismatch that offers the boundary's region", () => {
  const ottawaAsQuebec = place.resolve(where(45.4215, -75.6972, "Québec"), data);
  assert.equal(ottawaAsQuebec.status, "province-mismatch");
  assert.deepEqual(pairs(ottawaAsQuebec), [["yow", "on"]]);
  const gatineauAsOntario = place.resolve(where(45.4765, -75.7013, "Ontario"), data);
  assert.equal(gatineauAsOntario.status, "province-mismatch");
  assert.deepEqual(pairs(gatineauAsOntario), [["yow", "qc"]]);
  // Provinces outside Ontario and Quebec are checked too.
  assert.equal(place.resolve(where(49.2827, -123.1207, "Alberta"), data).status, "province-mismatch");
  // A place name the province list does not know is not trusted either.
  assert.equal(place.resolve(where(49.2827, -123.1207, "Washington"), data).status, "province-mismatch");
});

test("an empty province follows the boundary; a region that spans two provinces then asks which", () => {
  assert.deepEqual(pairs(place.resolve(where(45.4765, -75.7013, ""), data)), [["yow", "qc"]]);
  const noJurisdictions = { ...data, jurisdictions: { type: "FeatureCollection", features: [] } };
  assert.deepEqual(pairs(place.resolve(where(49.2827, -123.1207, ""), noJurisdictions)), [["yvr", "bc"]]);
  const either = place.resolve(where(45.4765, -75.7013, ""), noJurisdictions);
  assert.equal(either.status, "many");
  assert.deepEqual(pairs(either), [["yow", "on"], ["yow", "qc"]]);
  // The geocoder's province still decides when the boundary cannot, as long as the region spans it.
  assert.deepEqual(pairs(place.resolve(where(45.4765, -75.7013, "QC"), noJurisdictions)), [["yow", "qc"]]);
  assert.equal(place.resolve(where(45.4765, -75.7013, "Alberta"), noJurisdictions).status, "province-mismatch");
});

test("every region's own centre resolves back to that region", () => {
  for (const feature of data.boundaries.features) {
    const [lon, lat] = feature.properties.center;
    const result = place.resolve(where(lat, lon, ""), data);
    assert.ok(result.options.some((o) => o.tag === feature.properties.tag), feature.properties.tag);
    // Every option is a province its region really spans.
    assert.ok(result.options.every((o) => catalog.hierarchy[o.tag].provinces.includes(o.province)), feature.properties.tag);
  }
});

test("codes spanning two provinces offer both; aliases work offline", () => {
  assert.deepEqual(place.fromCode("YOW", data).map((o) => o.province).sort(), ["on", "qc"]);
  assert.deepEqual(place.fromCode(" ytr ", data).map((o) => [o.tag, o.province, o.name]), [["ytr", "on", "Quinte West"]]);
  assert.deepEqual(place.fromCode("yyy", data).map((o) => o.province).sort(), ["nb", "qc"]);
  assert.ok(place.fromAlias("quinte", data).some((o) => o.tag === "ytr"));
});

test("codes that are not region codes find nothing", () => {
  for (const code of ["", "zzz", "on", "can", "na", "__proto__", "constructor"]) {
    assert.deepEqual(place.fromCode(code, data), [], code);
  }
});

test("aliases ignore case and accents, and a name shared by two provinces lists both", () => {
  assert.ok(place.fromAlias("BELLEVILLE", data).some((o) => o.tag === "ytr"));
  assert.ok(place.fromAlias("  Quinte   West ", data).some((o) => o.tag === "ytr"));
  const accented = Object.entries(catalog.aliases).flatMap(([tag, names]) => names.filter((n) => n !== n.normalize("NFKD").replace(/[̀-ͯ]/g, "")).map((n) => [tag, n]));
  assert.ok(accented.length > 0);
  for (const [tag, name] of accented) {
    const plain = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toUpperCase();
    assert.ok(place.fromAlias(plain, data).some((o) => o.tag === tag), name);
    assert.ok(place.fromAlias(name.toUpperCase(), data).some((o) => o.tag === tag), name);
  }
  assert.deepEqual(place.fromAlias("Ottawa", data).map((o) => [o.tag, o.province]), [["yow", "on"], ["yow", "qc"]]);
  assert.deepEqual(place.fromAlias("nowhere-at-all", data), []);
  assert.deepEqual(place.fromAlias("", data), []);
});

test("neighbours come from shared boundaries", () => {
  assert.ok(place.neighbours("ytr", data).includes("ygk"));
  assert.ok(!place.neighbours("ytr", data).includes("ytr"));
  for (const tag of ["xph", "yow", "ygk", "yqa"]) assert.ok(place.neighbours("ytr", data).includes(tag), tag);
});

test("neighbours are sorted, two-way, and exclude regions that only touch at one point", () => {
  const list = place.neighbours("ytr", data);
  assert.deepEqual(list, [...list].sort());
  assert.equal(new Set(list).size, list.length);
  for (const other of list) assert.ok(place.neighbours(other, data).includes("ytr"), other);
  assert.ok(!list.includes("yvr"));
  assert.deepEqual(place.neighbours("nope", data), []);
  assert.deepEqual(place.neighbours("YTR", data), list);
});

test("neighbours need at least two shared vertices", () => {
  const square = (x, y) => ({ type: "Polygon", coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]] });
  const feature = (tag, geometry) => ({ type: "Feature", properties: { tag }, geometry });
  const synthetic = {
    ...data,
    boundaries: {
      type: "FeatureCollection",
      features: [
        feature("aaa", square(0, 0)),
        feature("bbb", square(1, 0)),   // shares a whole side (2 vertices) with aaa
        feature("ccc", square(1, 1)),   // touches aaa at one corner only
        feature("ddd", square(5, 5))
      ]
    }
  };
  assert.deepEqual(place.neighbours("aaa", synthetic), ["bbb"]);
  assert.deepEqual(place.neighbours("ccc", synthetic), ["bbb"]);
  assert.deepEqual(place.neighbours("ddd", synthetic), []);
});

test("regions whose groups use different radio settings offer a choice", () => {
  assert.deepEqual(place.radioOptions("yvr", data).map((o) => o.id), ["canada", "bc-mesh"]);
  assert.deepEqual(place.radioOptions("ytr", data).map((o) => o.id), ["canada"]);
});

test("each radio choice lists the groups that use it, in English and French", () => {
  const [canada, bc] = place.radioOptions("yvr", data);
  assert.deepEqual(canada.communities, ["Salish Mesh"]);
  assert.deepEqual(canada.communitiesFr, ["Salish Mesh"]);
  assert.deepEqual(bc.communities, ["BC Mesh"]);
  assert.deepEqual(place.radioOptions("ytr", data)[0].communities, ["Quinte Mesh Network"]);
  assert.deepEqual(place.radioOptions("nope", data), [{ id: "canada", communities: [], communitiesFr: [] }]);
});

test("every radio choice is a real radio profile", () => {
  const ids = new Set(data.profiles.map((profile) => profile.id));
  for (const tag of Object.keys(catalog.hierarchy)) {
    const options = place.radioOptions(tag, data);
    assert.equal(options[0].id, "canada", tag);
    assert.equal(new Set(options.map((o) => o.id)).size, options.length, tag);
    for (const option of options) assert.ok(ids.has(option.id), tag + " " + option.id);
  }
});

test("a group with radio settings that match no profile is left out, never mapped to the Canada settings", () => {
  const radio = { frequency_mhz: 915, bandwidth_khz: 125, spreading_factor: 9, coding_rate: 5 };
  const synthetic = {
    ...data,
    catalog: { ...catalog, profiles: { zzz: { communities: [
      { id: "odd", name: "Odd Mesh", settings: { overrides: { raw_radio: radio } } },
      { id: "plain", name: "Plain Mesh", settings: { overrides: {} } }
    ] } } }
  };
  assert.deepEqual(place.radioOptions("zzz", synthetic), [{ id: "canada", communities: ["Plain Mesh"], communitiesFr: ["Plain Mesh"] }]);
});

test("cross-border options depend on the province", () => {
  assert.deepEqual(place.crossBorder("on"), { shared: ["ontario-new-york"], edgeOnly: ["ohio", "pennsylvania", "western-new-york"] });
  assert.deepEqual(place.crossBorder("ns"), { shared: [], edgeOnly: [] });
  assert.deepEqual(place.crossBorder("bc"), { shared: [], edgeOnly: ["oregon", "washington"] });
  assert.deepEqual(place.crossBorder("ON"), place.crossBorder("on"));
  assert.deepEqual(place.crossBorder(""), { shared: [], edgeOnly: [] });
  assert.deepEqual(place.crossBorder("toString"), { shared: [], edgeOnly: [] });
});

test("cross-border networks all exist in the catalogue, and callers cannot change the table", () => {
  for (const code of ["on", "bc"]) {
    const { shared, edgeOnly } = place.crossBorder(code);
    for (const id of [...shared, ...edgeOnly]) assert.ok(catalog.externalRegionPaths[id], id);
  }
  place.crossBorder("on").shared.push("changed");
  assert.deepEqual(place.crossBorder("on").shared, ["ontario-new-york"]);
});

test("planning tells starter regions and planning extensions apart from MeshMapper zones, as the map does", () => {
  // A starter region is MeshCore Canada's own, wherever the spot is.
  assert.equal(place.planning("yyg", null, data), "starter");
  assert.equal(place.planning("yyg", where(46.2382, -63.1311), data), "starter");
  // Wingham is outside Waterloo's MeshMapper zone, in the gap MeshCore Canada gives to ykf.
  assert.equal(place.planning("ykf", where(43.8678, -81.2619), data), "extension");
  // Inside a MeshMapper zone, or with no spot to check (a region code typed by hand), there is nothing to say.
  assert.equal(place.planning("ykf", where(43.4643, -80.5204), data), null);
  assert.equal(place.planning("ytr", where(44.16281, -77.38324), data), null);
  assert.equal(place.planning("ykf", null, data), null);
  assert.equal(place.planning("ykf", { name: "Wingham" }, data), null);
});

test("the script loads without the place search and region scripts; only resolve needs them", async () => {
  const sandbox = { URL };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("docs/assets/setup/setup-place.js", "utf8"), sandbox, { filename: "setup-place.js" });
  const alone = sandbox.MeshCoreSetupPlace;
  const loaded = await alone.loadData(base, fileFetcher);
  assert.equal(JSON.stringify(alone.neighbours("ytr", loaded)), JSON.stringify(place.neighbours("ytr", data)));
  assert.equal(JSON.stringify(alone.radioOptions("yvr", loaded)), JSON.stringify(place.radioOptions("yvr", data)));
  assert.equal(JSON.stringify(alone.crossBorder("on")), JSON.stringify(place.crossBorder("on")));
  assert.throws(() => alone.resolve(where(49.2827, -123.1207, "BC"), loaded), /must be loaded/);
});
