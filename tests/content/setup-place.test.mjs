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
const scopeFile = JSON.parse(readFileSync("docs/assets/regions/cross-border-scopes.json", "utf8"));
const where = (lat, lon, province) => ({ lat, lon, province });
const pairs = (result) => result.options.map((o) => [o.tag, o.province]);
let data;

before(async () => {
  data = await place.loadData(base, fileFetcher);
});

test("loadData asks for the catalogue, hashed boundaries and jurisdictions, radio profiles and the cross-border scopes", () => {
  const urls = requested.filter((href) => href.includes("/assets/"));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/iata-regions.json"));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/iata-boundaries.geojson?v=" + catalog.source.boundarySha256));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/scope-jurisdictions.geojson?v=" + catalog.source.jurisdictionSha256));
  assert.ok(urls.includes("https://meshcore.test/assets/radio-profiles.json"));
  assert.ok(urls.includes("https://meshcore.test/assets/regions/cross-border-scopes.json"));
  assert.deepEqual(Object.keys(data).sort(), ["boundaries", "catalog", "crossBorder", "jurisdictions", "profiles"]);
  assert.deepEqual(data.crossBorder, scopeFile);
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

test("loadData fails clearly when the cross-border scopes are missing or are not a list of scopes", async () => {
  const without = async (url) => (String(url).includes("cross-border-scopes") ? { ok: false } : fileFetcher(url));
  await assert.rejects(place.loadData(base, without), /cross-border scopes unavailable/i);
  const reply = (value) => async (url) => (String(url).includes("cross-border-scopes") ? { ok: true, json: async () => value } : fileFetcher(url));
  for (const bad of [null, [], {}, { scopes: "onny" }, { scopes: [null] }, { scopes: [{ scope: "onny" }] },
    { scopes: [{ ...scopeFile.scopes[0], provinces: "on" }] }, { scopes: [{ ...scopeFile.scopes[0], scope: "ONNY" }] }]) {
    await assert.rejects(place.loadData(base, reply(bad)), /invalid cross-border scopes/i, JSON.stringify(bad));
  }
  // An empty list is a valid file: nothing is offered.
  const none = await place.loadData(base, reply({ scopes: [] }));
  assert.deepEqual(place.crossBorder("on", none), []);
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

test("a region's centre is where the map pin starts when only the region is known", () => {
  // The boundary's own centre ([lon, lat]), as the region map uses it.
  assert.deepEqual(place.centre("ytr", data), { lat: 44.157979, lon: -77.368694 });
  assert.deepEqual(place.centre("YTR", data), place.centre("ytr", data));
  // Every region the tool can pick has one, and it is inside that region.
  for (const [tag, entry] of Object.entries(catalog.hierarchy)) {
    if (entry.kind !== "city") continue;
    const middle = place.centre(tag, data);
    assert.ok(middle && Number.isFinite(middle.lat) && Number.isFinite(middle.lon), tag);
    assert.ok(place.resolve(where(middle.lat, middle.lon, ""), data).options.some((o) => o.tag === tag), tag);
  }
  // A region's middle is no answer by itself: the flow waits for a pin.
  vm.runInThisContext(readFileSync("docs/assets/setup/setup-flow.js", "utf8"), { filename: "setup-flow.js" });
  assert.equal(globalThis.MeshCoreSetupFlow.isComplete("location", { tag: "ytr", province: "on" }), false);
  // No region, no centre.
  for (const tag of ["nope", "", undefined, "on", "can"]) assert.equal(place.centre(tag, data), null, String(tag));
  // An outline with no centre given uses the middle of its outline.
  const square = { boundaries: { type: "FeatureCollection", features: [{ type: "Feature", properties: { tag: "zzz" },
    geometry: { type: "Polygon", coordinates: [[[-80, 44], [-78, 44], [-78, 46], [-80, 46], [-80, 44]]] } }] } };
  assert.deepEqual(place.centre("zzz", square), { lat: 45, lon: -79 });
});

test("a spot with no province claimed gets its province from the boundary, so the map step can tell Ottawa from Gatineau", () => {
  // Both are in yow; the province (and so the scopes) differs.
  assert.deepEqual(pairs(place.resolve(where(45.4215, -75.6972, ""), data)), [["yow", "on"]]);
  assert.deepEqual(pairs(place.resolve(where(45.4765, -75.7013, ""), data)), [["yow", "qc"]]);
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

// ------------------------------------------------------------ the nearest regions, and finding any other

const BELLEVILLE = { lat: 44.16281, lon: -77.38324 };
const near = (point, options) => place.nearest(point, data, options);

test("the nearest regions to Belleville include Kingston, leave out Quinte West itself, and run closest first", () => {
  const list = near(BELLEVILLE, { exclude: ["ytr"], limit: 5 });
  assert.equal(list.length, 5);
  assert.ok(list.some((item) => item.tag === "ygk"), "Kingston is close to Belleville");
  assert.ok(!list.some((item) => item.tag === "ytr"), "the home region is left out");
  assert.deepEqual(list.map((item) => item.km), list.map((item) => item.km).sort((a, b) => a - b));
  for (const item of list) {
    assert.equal(typeof item.name, "string", item.tag);
    assert.ok(Number.isFinite(item.km) && item.km >= 0, item.tag);
    assert.ok(item.km < 250, `${item.tag} should be near, not ${item.km} km away`);
  }
  assert.equal(new Set(list.map((item) => item.tag)).size, 5, "one entry for each region");
  // Without a limit every other region is listed, still closest first.
  const all = near(BELLEVILLE, { exclude: ["ytr"] });
  assert.ok(all.length > 40);
  assert.deepEqual(all.slice(0, 5), list);
  assert.deepEqual(all.map((item) => item.km), all.map((item) => item.km).sort((a, b) => a - b));
});

test("a spot inside another region is 0 km from it, and the French name comes with the English one", () => {
  const kingston = near({ lat: 44.2312, lon: -76.486 }, { exclude: ["ytr"], limit: 3 });
  assert.deepEqual([kingston[0].tag, kingston[0].km], ["ygk", 0]);
  assert.deepEqual(near(BELLEVILLE, { limit: 1 }).map((item) => [item.tag, item.km]), [["ytr", 0]], "with nothing left out, the region the spot is in comes first");
  // The English name always comes; the French one only where the catalogue has it.
  const all = near(BELLEVILLE, {});
  assert.equal(all.find((item) => item.tag === "yow").name, "Ottawa–Gatineau");
  assert.equal(all.find((item) => item.tag === "yow").nameFr, undefined);
  assert.deepEqual(all.find((item) => item.tag === "yyt"), { tag: "yyt", name: "Newfoundland", nameFr: "Terre-Neuve", km: all.find((item) => item.tag === "yyt").km });
});

test("the tags to leave out are matched in any case, and a spot that is no spot has no neighbours", () => {
  assert.ok(!near(BELLEVILLE, { exclude: ["YTR", "Ygk"] }).some((item) => ["ytr", "ygk"].includes(item.tag)));
  for (const bad of [null, undefined, {}, { lat: "44", lon: "-77" }, { lat: NaN, lon: -77 }, { lat: 44, lon: Infinity }]) {
    assert.deepEqual(near(bad, { limit: 5 }), [], JSON.stringify(bad));
  }
});

test("distance is measured to the outline, a MeshMapper zone beats a planning extension, and one entry is kept for each region", () => {
  const square = (west, south, east, north) => ({ type: "Polygon", coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] });
  const feature = (tag, geometry, properties = {}) => ({ type: "Feature", properties: { tag, ...properties }, geometry });
  const label = (name) => ({ label: name, kind: "city", provinces: ["on"] });
  const synthetic = {
    ...data,
    catalog: { ...data.catalog, hierarchy: { aaa: label("Aaa"), bbb: label("Bbb"), ccc: label("Ccc"), ddd: label("Ddd"), on: { label: "Ontario", kind: "province" } } },
    boundaries: {
      type: "FeatureCollection",
      features: [
        feature("aaa", square(1, 44, 2, 46), { regionSource: "meshmapper" }),                  // one degree of longitude east of the spot
        feature("aaa", square(0.1, 44.9, 0.2, 45.1), { regionSource: "planning", planningKind: "extension" }),   // much closer, but not the zone
        feature("bbb", square(-3, 44, -2, 46), { regionSource: "meshmapper" }),                // two degrees west
        feature("ccc", square(-0.5, 47, 0.5, 48), {}),                                         // two degrees north, no source recorded
        feature("ddd", square(0, 0, 0.5, 0.5), { regionSource: "meshmapper" }),                 // far south
        feature("on", square(-1, 44.9, 1, 45.1), { regionSource: "meshmapper" })                // a province, not a region
      ]
    }
  };
  const list = place.nearest({ lat: 45, lon: 0 }, synthetic, {});
  assert.deepEqual(list.map((item) => item.tag), ["aaa", "bbb", "ccc", "ddd"]);
  // One degree of longitude at 45 degrees north is 111.32 * cos(45) = 78.7 km.
  assert.ok(Math.abs(list[0].km - 78.7) < 1.5, String(list[0].km));
  assert.ok(Math.abs(list[1].km - 157.4) < 3, String(list[1].km));
  // Two degrees of latitude is 222 km.
  assert.ok(Math.abs(list[2].km - 222) < 4, String(list[2].km));
  assert.deepEqual(list.map((item) => item.name), ["Aaa", "Bbb", "Ccc", "Ddd"]);
  // Inside the outline is 0.
  assert.equal(place.nearest({ lat: 45, lon: 1.5 }, synthetic, {})[0].km, 0);
});

test("the nearest regions are told apart from the catalogue's other entries, and read the data the page loaded", () => {
  const tags = near(BELLEVILLE, {}).map((item) => item.tag);
  for (const tag of tags) assert.equal(data.catalog.hierarchy[tag].kind, "city", tag);
  for (const tag of ["on", "qc", "can", "na", "onqc"]) assert.ok(!tags.includes(tag), tag);
});

test("searching finds a region by its name, its French name, an alias or its code, ignoring case and accents", () => {
  const tagsOf = (text, options) => place.search(text, data, options).map((item) => item.tag);
  assert.deepEqual(tagsOf("Muskoka"), ["yqa"]);
  assert.equal(tagsOf("muskoka")[0], "yqa");
  assert.equal(tagsOf("YQA")[0], "yqa");
  assert.equal(tagsOf("  yqa  ")[0], "yqa");
  // An alias: Belleville is part of Quinte West.
  assert.equal(tagsOf("belleville")[0], "ytr");
  assert.equal(tagsOf("BELLEVILLE")[0], "ytr");
  // Accent-insensitive in both directions.
  assert.equal(tagsOf("montreal")[0], "yul");
  assert.equal(tagsOf("Montréal")[0], "yul");
  assert.equal(tagsOf("TROIS-RIVIERES")[0], "yul");
  assert.ok(tagsOf("gatineau").includes("yow"));
  // The French name, with or without its accents and dashes.
  assert.equal(tagsOf("Terre-Neuve")[0], "yyt");
  assert.equal(tagsOf("terre neuve")[0], "yyt");
  assert.equal(tagsOf("Île du Prince Édouard")[0], "yyg");
  assert.equal(tagsOf("ile-du-prince-edouard")[0], "yyg");
  // Dots, dashes and apostrophes don't get in the way.
  assert.equal(tagsOf("sault ste marie")[0], "yam");
  assert.equal(tagsOf("Sault Ste. Marie")[0], "yam");
  assert.equal(tagsOf("val d'or")[0], "yvo");
  // A part of a name is enough.
  assert.ok(tagsOf("sault").includes("yam"));
  assert.deepEqual(place.search("muskoka", data)[0], { tag: "yqa", name: "Muskoka" });
  assert.deepEqual(place.search("terre-neuve", data)[0], { tag: "yyt", name: "Newfoundland", nameFr: "Terre-Neuve" });
  // Nothing found, or too little typed to search on.
  assert.deepEqual(place.search("zzzzzz-nowhere", data), []);
  for (const little of ["", " ", "y", null, undefined]) assert.deepEqual(place.search(little, data), [], String(little));
});

test("a search lists regions only, never the home region, best matches first, up to the limit", () => {
  const tagsOf = (text, options) => place.search(text, data, options).map((item) => item.tag);
  assert.deepEqual(tagsOf("belleville", { exclude: ["ytr"] }), []);
  assert.deepEqual(tagsOf("belleville", { exclude: ["YTR"] }), []);
  // Provinces and the wider scopes are not regions to hear.
  const ontario = tagsOf("ontario");
  for (const tag of ["on", "can", "na", "onqc"]) assert.ok(!ontario.includes(tag), tag);
  assert.ok(!tagsOf("canada").includes("can"));
  // An exact code comes before a name that merely contains the letters.
  assert.equal(tagsOf("yow")[0], "yow");
  // The limit caps the list; the same text gives the same order each time.
  const many = tagsOf("on");
  assert.ok(many.length > 8, "a short text matches a lot");
  assert.equal(tagsOf("on", { limit: 8 }).length, 8);
  assert.deepEqual(tagsOf("on", { limit: 8 }), many.slice(0, 8));
  assert.deepEqual(tagsOf("on"), many);
  assert.equal(new Set(many).size, many.length);
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

test("cross-border scopes come from the file the page loaded, by province", () => {
  const scopesFor = (province, from = data) => place.crossBorder(province, from).map((item) => item.scope);
  assert.deepEqual(scopesFor("on"), ["onny"]);
  assert.deepEqual(scopesFor("qc"), ["qcny", "qcvt"]);
  for (const province of ["bc", "ab", "sk", "mb", "nb", "ns", "pe", "nl", "yt", "nt", "nu"]) assert.deepEqual(scopesFor(province), [], province);
  assert.deepEqual(scopesFor("QC"), scopesFor("qc"));
  assert.deepEqual(scopesFor(" On "), scopesFor("on"));
  for (const odd of ["", "toString", "__proto__", undefined, null, 5, "xx"]) assert.deepEqual(scopesFor(odd), [], String(odd));
  // No US network is offered: only what the file lists.
  const all = new Set(["on", "qc", "bc", "ab", "ns"].flatMap((province) => scopesFor(province)));
  assert.deepEqual([...all].sort(), ["onny", "qcny", "qcvt"]);
  // What it hands over is the whole entry, in both languages, in the file's order.
  assert.deepEqual(place.crossBorder("qc", data), scopeFile.scopes.filter((item) => item.provinces.includes("qc")));
  const [onny] = place.crossBorder("on", data);
  assert.equal(onny.name, "Ontario–New York");
  assert.match(onny.description, /New York and Ontario/);
  assert.match(onny.descriptionFr, /l’Ontario/);
  // A scope offered in two provinces is offered in both; a different file gives a different list.
  const both = { ...data, crossBorder: { scopes: [{ ...onny, provinces: ["on", "qc"] }, { ...onny, scope: "xx1", provinces: ["qc"] }] } };
  assert.deepEqual(scopesFor("on", both), ["onny"]);
  assert.deepEqual(scopesFor("qc", both), ["onny", "xx1"]);
  assert.deepEqual(scopesFor("bc", both), []);
  // Without the data there is nothing to offer, and nothing goes wrong.
  assert.deepEqual(place.crossBorder("on"), []);
  assert.deepEqual(place.crossBorder("on", {}), []);
});

test("callers cannot change the scopes the page loaded", () => {
  place.crossBorder("qc", data)[0].scope = "changed";
  place.crossBorder("qc", data)[0].provinces.push("bc");
  place.crossBorder("qc", data).push({ scope: "extra" });
  assert.deepEqual(place.crossBorder("qc", data).map((item) => item.scope), ["qcny", "qcvt"]);
  assert.deepEqual(place.crossBorder("bc", data), []);
});

test("the catalogue no longer carries a second source for the Québec–New York scope", () => {
  assert.equal(catalog.policy.optionalNetworks["quebec-new-york"], undefined);
  assert.equal(catalog.externalRegionPaths["quebec-new-york"], undefined);
  // Ontario–New York and the US networks stay in the catalogue: the region map and its validators still read them.
  assert.ok(catalog.externalRegionPaths["ontario-new-york"]);
  assert.ok(catalog.externalRegionPaths["western-new-york"]);
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

// ------------------------------------------------------------ street addresses (place-search.js)

const search = globalThis.MeshCorePlaceSearch;
// Rows in the shape https://geolocator.api.geo.ca/?keys=locate sends (trimmed). A civic address is
// tagged INTERPOLATED_POSITION; the same reply also carries towns, lakes, intersections and street centroids.
const locate = (name, province, lat, lng, category = "Street", tag = "INTERPOLATED_POSITION") => ({ key: "locate", name, province, category, lat, lng, bbox: null, tag: [tag] });
const WELLINGTON = [
  locate("111 Wellington Street, City Of Ottawa, Ontario", "Ontario", 45.42312333800001, -75.698764764),
  locate("Guelph, Wellington, Ontario (City)", "Ontario", 43.5339991, -80.2316544, "City", "LOCATION"),
  locate("Footner Lake, 5,8-111-19-W5, Alberta (Unincorporated area)", "Alberta", 58.6133333, -117.1633333, "Unincorporated area", "LOCATION"),
  locate("Route 111 & Route 111 Nord & Rue Principale, Dupuy, Quebec", "Quebec", 48.8206757, -79.3584753, "Intersection", "LOCATION"),
  locate("Wellington Street, City Of Ottawa, Ontario", "Ontario", 45.42, -75.70, "Street", "INTERPOLATED_CENTROID"),
];

test("a civic number then words is a street address; a town, a region code, a postal code or bare numbers are not", () => {
  for (const query of ["111 Wellington Street, Ottawa", "111, rue Wellington, Ottawa", "1 Rue Notre-Dame Est, Montréal", "100 Mile House", "22A Oak Street"]) {
    assert.equal(search.isAddress(query), true, query);
  }
  for (const query of ["Belleville", "Saint-Jean, QC", "ytr", "44.1628, -77.3832", "K1A 0A9", "Highway 7, Peterborough", "", "  "]) {
    assert.equal(search.isAddress(query), false, query);
  }
});

test("a typed address is read as its civic number, the first word of its street name, its town and its province", () => {
  assert.deepEqual(search.addressQuery("22 Oak Street, Picton"), { number: "22", street: "oak", town: "Picton", province: "" });
  // French style: a comma after the number, and the street type first.
  assert.deepEqual(search.addressQuery("111, rue Wellington, Ottawa"), { number: "111", street: "wellington", town: "Ottawa", province: "" });
  assert.deepEqual(search.addressQuery("8 Birch Street, Trenton, ON"), { number: "8", street: "birch", town: "Trenton", province: "ON" });
  assert.deepEqual(search.addressQuery("1 Rue de la Gauchetière Ouest, Montréal, Québec"), { number: "1", street: "gauchetiere", town: "Montréal", province: "QC" });
  assert.deepEqual(search.addressQuery("10 St. Paul Street, Kingston"), { number: "10", street: "paul", town: "Kingston", province: "" });
  // No town typed: the town part is empty, and the page asks even about a single match.
  assert.deepEqual(search.addressQuery("100 Mile House"), { number: "100", street: "mile", town: "", province: "" });
  for (const query of ["Belleville", "K1A 0A9", "44.1628, -77.3832", ""]) assert.equal(search.addressQuery(query), null, query);
});

test("only addresses that match what was typed are kept: number, street and town, and the province if typed", async () => {
  const asked = [];
  const reply = (rows) => ({ ok: true, json: async () => rows });
  const towns = {
    Picton: [{ key: "geonames", name: "Picton", province: "Ontario", category: "Community", lat: 44.0061111, lng: -77.1436111 }],
    Belleville: [{ key: "geonames", name: "Belleville", province: "Ontario", category: "City", lat: 44.2566666, lng: -77.3697222 }],
    // Live: the town search finds Trenton in Ontario and in Nova Scotia; a typed province keeps one.
    Trenton: [{ key: "geonames", name: "Trenton", province: "Ontario", category: "Community", lat: 44.11, lng: -77.5786111 },
      { key: "geonames", name: "Trenton", province: "Nova Scotia", category: "Town", lat: 45.61052, lng: -62.639371 }],
  };
  const addresses = {
    // Live replies, trimmed. The only civic address for "22 Oak Street, Picton" is in Winnipeg.
    "22 Oak Street, Picton": [locate("22 Picton Court, Winnipeg, Manitoba", "Manitoba", 49.83930382473434, -97.0846334605357)],
    "12 Elm Street, Belleville": [locate("12 Rue Elm, Danville, Quebec", "Quebec", 45.79, -72.01), locate("12 Elm Street, Grenville, Quebec", "Quebec", 45.63, -74.6)],
    "5 Maple Avenue, Belleville": [locate("5 Maple Drive, City Of Belleville, Ontario", "Ontario", 44.18, -77.4)],
    "8 Birch Street, Trenton": [locate("8 Birch Street, Trenton, Nova Scotia", "Nova Scotia", 45.61, -62.64), locate("8 Birch Street, Gore, Quebec", "Quebec", 45.77, -74.25)],
    "8 Birch Street, Trenton, ON": [locate("8 Birch Street, Trenton, Nova Scotia", "Nova Scotia", 45.61, -62.64)],
    "112 Wellington Street, Ottawa": WELLINGTON,
    "111, rue Wellington, Ottawa": [locate("111 Wellington Street, Ville Of Ottawa, Ontario", "Ontario", 45.4231, -75.6988, "Rue")],
  };
  const request = async (url) => {
    const params = new URL(url).searchParams;
    asked.push(params.get("keys") + ":" + params.get("q"));
    return reply((params.get("keys") === "locate" ? addresses : towns)[params.get("q")] || []);
  };
  const names = async (query) => { asked.length = 0; return (await search.find(query, "en", request)).map((place) => [place.name, place.province, place.kind]); };

  // A match in another town and province is never kept: the town that was typed is searched instead.
  assert.deepEqual(await names("22 Oak Street, Picton"), [["Picton", "Ontario", undefined]]);
  assert.deepEqual(asked, ["locate:22 Oak Street, Picton", "geonames:Picton"]);
  assert.deepEqual(await names("12 Elm Street, Belleville"), [["Belleville", "Ontario", undefined]]);
  // The wrong civic number is not the address either.
  assert.deepEqual(await names("112 Wellington Street, Ottawa"), []);
  assert.deepEqual(asked, ["locate:112 Wellington Street, Ottawa", "geonames:Ottawa"]);
  // Same number, street name and town: kept, for the page to confirm (Avenue and Drive differ, so it is never picked by itself).
  assert.deepEqual(await names("5 Maple Avenue, Belleville"), [["5 Maple Drive, Belleville", "Ontario", "address"]]);
  // Only the Trenton the person typed; a typed province narrows it further.
  assert.deepEqual(await names("8 Birch Street, Trenton"), [["8 Birch Street, Trenton", "Nova Scotia", "address"]]);
  assert.deepEqual(await names("8 Birch Street, Trenton, ON"), [["Trenton", "Ontario", undefined]]);
  assert.deepEqual(asked, ["locate:8 Birch Street, Trenton, ON", "geonames:Trenton"]);
  // French: "rue Wellington" is Wellington Street, and "Ville Of Ottawa" is Ottawa.
  assert.deepEqual(await names("111, rue Wellington, Ottawa"), [["111 Wellington Street, Ottawa", "Ontario", "address"]]);
});

test("address rows keep only civic addresses, named by street and municipality", () => {
  assert.deepEqual(search.addressCandidates(WELLINGTON), [
    { name: "111 Wellington Street, Ottawa", province: "Ontario", lat: 45.42312333800001, lon: -75.698764764, kind: "address" }
  ]);
  // The French reply says "Ville Of"; other places are a Town, County or plain name. The province ends the name.
  const french = [
    locate("111 Wellington Street, Ville Of Ottawa, Ontario", "Ontario", 45.4231, -75.6988, "Rue"),
    locate("10 Hastings Street South, Town Of Bancroft, Ontario", "Ontario", 45.0566, -77.8549),
    locate("50 Picton Main Street, County Of Prince Edward County, Ontario", "Ontario", 44.0072, -77.1405),
    locate("1 Rue Notre-Dame Est, Montréal, Québec", "Québec", 45.5065186, -73.5554019, "Rue"),
    locate("1 Rue Saint-Jean, Québec, Quebec", "Quebec", 46.8123, -71.2145),
  ];
  assert.deepEqual(search.addressCandidates(french).map((place) => [place.name, place.province]), [
    ["111 Wellington Street, Ottawa", "Ontario"],
    ["10 Hastings Street South, Bancroft", "Ontario"],
    ["50 Picton Main Street, Prince Edward County", "Ontario"],
    ["1 Rue Notre-Dame Est, Montréal", "Québec"],
    ["1 Rue Saint-Jean, Québec", "Quebec"],
  ]);
});

test("address rows outside Canada, with no province or municipality, or repeated, are left out; at most 5 stay", () => {
  const rows = [
    locate("1 Main Street, Seattle, Washington", "Washington", 47.6062, -122.3321),
    locate("1 Main Street, Nowhere, Ontario", "Ontario", 12, -77),
    locate("1 Main Street, Ontario", "Ontario", 44.1, -77.1),
    locate("K1A", null, 45.4236, -75.7008, "PostalCode", "INTERPOLATED_CENTROID"),
    locate("1 Main Street, Belleville, Ontario", "Ontario", 44.16, -77.38),
    locate("1 Main Street, Belleville, Ontario", "Ontario", 44.16, -77.38),
    { key: "geonames", name: "1 Main Street, Picton, Ontario", province: "Ontario", lat: 44.0, lng: -77.1, category: "Street", tag: ["INTERPOLATED_POSITION"] },
    ...Array.from({ length: 8 }, (_, index) => locate(`${index + 2} Main Street, Kingston, Ontario`, "Ontario", 44.23 + index / 1000, -76.48)),
  ];
  const found = search.addressCandidates(rows);
  assert.equal(found.length, 5);
  assert.deepEqual(found.slice(0, 2).map((place) => place.name), ["1 Main Street, Belleville", "2 Main Street, Kingston"]);
  assert.throws(() => search.addressCandidates({}), /Invalid place response/);
});

test("find asks the street-address search for an address and the town search for a town", async () => {
  const asked = [];
  const reply = (rows) => ({ ok: true, json: async () => rows });
  const request = async (url) => {
    const params = new URL(url).searchParams;
    asked.push([params.get("keys"), params.get("q"), params.get("lang")]);
    if (params.get("keys") === "locate") return reply(params.get("q") === "111 Wellington Street, Ottawa" ? WELLINGTON : [locate("Unsigned, 100 Mile House, British Columbia", "British Columbia", 51.71, -121.44, "Street", "INTERPOLATED_CENTROID")]);
    return reply(params.get("q") === "Belleville" || params.get("q") === "100 Mile House"
      ? [{ key: "geonames", name: params.get("q"), province: params.get("q") === "Belleville" ? "Ontario" : "British Columbia", category: "City", lat: params.get("q") === "Belleville" ? 44.1628 : 51.6428, lng: params.get("q") === "Belleville" ? -77.3832 : -121.2956 }]
      : []);
  };
  const address = await search.find("111 Wellington Street, Ottawa", "en", request);
  assert.deepEqual(address.map((place) => [place.name, place.kind]), [["111 Wellington Street, Ottawa", "address"]]);
  assert.deepEqual(asked, [["locate", "111 Wellington Street, Ottawa", "en"]]);

  // No civic address matches (a town with a number in its name): the town search is tried next.
  asked.length = 0;
  const town = await search.find("100 Mile House", "fr", request);
  assert.deepEqual(town.map((place) => [place.name, place.kind]), [["100 Mile House", undefined]]);
  assert.deepEqual(asked, [["locate", "100 Mile House", "fr"], ["geonames", "100 Mile House", "fr"]]);

  // A town goes straight to the town search, exactly as lookup() does.
  asked.length = 0;
  assert.deepEqual(await search.find("Belleville", "en", request), await search.lookup("Belleville", "en", request));
  assert.deepEqual(asked.map((call) => call[0]), ["geonames", "geonames"]);

  // A search that fails says so; the page then offers the region code box.
  await assert.rejects(search.find("111 Wellington Street, Ottawa", "en", async () => ({ ok: false })), /Place lookup failed/);
  await assert.rejects(search.find("111 Wellington Street, Ottawa", "en", async () => reply({})), /Invalid place response/);
});

test("the script loads without the place search and region scripts; only resolve, planning and nearest need them", async () => {
  const sandbox = { URL };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync("docs/assets/setup/setup-place.js", "utf8"), sandbox, { filename: "setup-place.js" });
  const alone = sandbox.MeshCoreSetupPlace;
  const loaded = await alone.loadData(base, fileFetcher);
  assert.equal(JSON.stringify(alone.search("muskoka", loaded)), JSON.stringify(place.search("muskoka", data)));
  assert.equal(JSON.stringify(alone.radioOptions("yvr", loaded)), JSON.stringify(place.radioOptions("yvr", data)));
  assert.equal(JSON.stringify(alone.crossBorder("qc", loaded)), JSON.stringify(place.crossBorder("qc", data)));
  assert.equal(JSON.stringify(alone.centre("ytr", loaded)), JSON.stringify(place.centre("ytr", data)));
  assert.throws(() => alone.resolve(where(49.2827, -123.1207, "BC"), loaded), /must be loaded/);
});
