import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

function api(path, name) {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(path, "utf8"), context);
  return context[name];
}
const community = api("docs/assets/javascripts/communities.js", "MeshCoreCommunitySearch");
const network = api("docs/assets/javascripts/network-status.js", "MeshCoreNetworkStatus");

test("city lookup prefers Cambridge Ontario to Cambridge Bay and rejects non-Canadian coordinates", () => {
  const rows = [
    { key: "geonames", name: "Cambridge Bay", province: "Nunavut", category: "Hamlet", lat: 69.113889, lng: -105.05278 },
    { key: "geonames", name: "Cambridge", province: "Ontario", category: "City", lat: 43.397222, lng: -80.311389 },
    { key: "geonames", name: "Cambridge", province: "Nova Scotia", category: "Community", lat: 45.20094, lng: -64.092892 },
    { key: "geonames", name: "Cambridge", province: "Ontario", category: "City", lat: 99, lng: -80 }
  ];
  assert.equal(community.placeCandidates(rows, "Cambridge")[0].province, "Ontario");
  assert.equal(community.placeCandidates(rows, "Cambridge,NS")[0].province, "Nova Scotia");
  assert.equal(community.placeCandidates(rows, "Cambridge, BC").length, 0);
  assert.equal(community.placeCandidates(rows, "Cambridge").length, 1);
});

test("Canadian city names accept French accents and province suffixes", () => {
  assert.equal(community.splitPlaceQuery("Québec, Québec").name, "Québec");
  assert.equal(community.splitPlaceQuery("Québec, Québec").province, "QC");
  assert.equal(community.splitPlaceQuery("Cambridge ON").name, "Cambridge");
  const rows = [{ key: "geonames", name: "Montr\\u00e9al", province: "Qu\\u00e9bec", category: "Ville", lat: 45.5, lng: -73.57 }];
  assert.equal(community.placeCandidates(rows, "Montréal, QC")[0].name, "Montréal");
});

test("community distance is symmetric, bounded, and ranks Toronto closer than Ottawa to Cambridge", () => {
  const city = { lat: 43.397222, lon: -80.311389 };
  const toronto = { lat: 43.6532, lon: -79.3832 };
  const ottawa = { lat: 45.4215, lon: -75.6972 };
  assert.equal(community.distanceKm(city, city), 0);
  assert.equal(community.distanceKm(city, toronto), community.distanceKm(toronto, city));
  assert.ok(community.distanceKm(city, toronto) < community.distanceKm(city, ottawa));
  assert.ok(Number.isFinite(community.distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 180 })));
});

test("Beacon totals distinguish known devices from the overview time window", () => {
  const overview = { activeObservers: 12, activeIatas: 4, totalPackets: 900, windowHours: 24 };
  const types = [{ nodeType: 2, count: 50 }, { nodeType: 1, count: 20 }, { nodeType: 3, count: 3 }, { nodeType: 4, count: 2 }, { nodeType: 0, count: 1 }];
  const stats = network.parseStats(overview, types);
  assert.equal(stats.total, 76);
  assert.equal(stats.repeaters, 50);
  assert.equal(stats.other, 1);
  assert.equal(stats.observers, 12);
  assert.equal(stats.hours, 24);
  for (const bad of [-1, null, "900", Infinity]) assert.throws(() => network.parseStats({ ...overview, totalPackets: bad }, types));
  assert.throws(() => network.parseStats(overview, [types[0], types[0]]));
  assert.throws(() => network.parseStats({ ...overview, windowHours: 0 }, types));
});

test("all listings have finite geographic search references without changing their source locations", () => {
  const directory = JSON.parse(readFileSync("data/communities.json", "utf8"));
  const anchors = JSON.parse(readFileSync("data/community-search-anchors.json", "utf8"));
  assert.deepEqual(Object.keys(anchors.communities).sort(), directory.communities.map(item => item.id).sort());
  for (const locale of ["index.md", "index.fr.md"]) {
    const page = readFileSync(`docs/provinces/${locale}`, "utf8");
    assert.match(page, /status_notice: false/);
    const points = [...page.matchAll(/data-community-points="([^"]+)"/g)];
    assert.equal(points.length, directory.communities.length);
    for (const [, encoded] of points) {
      const list = JSON.parse(encoded.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&"));
      assert.ok(list.length > 0);
      assert.ok(list.every(point => Number.isFinite(point.lat) && Number.isFinite(point.lon)));
    }
  }
});
