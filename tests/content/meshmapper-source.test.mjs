import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canadianZones, directoryUrl, requestJson, zoneFeature } from "../../scripts/fetch-meshmapper-regions.mjs";

const yow = { code: "YOW", name: "Ottawa–Gatineau, CA", short_name: "Ottawa–Gatineau", country: "CA",
  lat: 45.41, lon: -75.7, url: "https://yow.meshmapper.net/", has_boundary: true, group: "ONQC" };
const directory = (zones = [yow]) => ({ country: "CA", count: zones.length, zones });
const boundary = () => ({ type: "FeatureCollection", features: [{
  type: "Feature", properties: { ...yow, center: [yow.lon, yow.lat] },
  geometry: { type: "Polygon", coordinates: [[[-76,45],[-75,45],[-75,46],[-76,45]]] },
}] });

test("official API directory supports 2–6-character codes, digits and returned URLs", () => {
  const zones = [yow, { ...yow, code: "AB12", url: "https://ab12.meshmapper.net/", has_boundary: false }, { ...yow, code: "AB" }, { ...yow, code: "ABC123" }];
  assert.deepEqual(canadianZones(directory(zones)).map(zone => zone.code), ["AB", "AB12", "ABC123", "YOW"]);
  assert.throws(() => canadianZones("<p>Unavailable</p>"));
  assert.throws(() => canadianZones(directory([])));
  assert.throws(() => canadianZones({ ...directory(), count: 2 }));
  assert.throws(() => canadianZones(directory([yow, yow])));
  for (const code of ["X", "ABCDEFG", "../bad", "a123", "A-B"]) {
    assert.throws(() => canadianZones(directory([{ ...yow, code }])));
  }
  for (const url of ["http://yow.meshmapper.net/", "https://yow.meshmapper.net.evil.test/", "https://user:password@yow.meshmapper.net/", "https://127.0.0.1/", "https://yow.meshmapper.net/path/", "https://yow.meshmapper.net/?ajax=private"]) {
    assert.throws(() => canadianZones(directory([{ ...yow, url }])));
  }
  assert.throws(() => canadianZones(directory([{ ...yow, country: "US" }])));
});

test("API GeoJSON is preserved without reversing, closing or simplifying coordinates", () => {
  const data = boundary();
  data.features[0].geometry.coordinates.push([[-75.8,45.1],[-75.7,45.2],[-75.6,45.1],[-75.8,45.1]]);
  const feature = zoneFeature(yow, data);
  assert.equal(feature.properties.tag, "yow");
  assert.equal(feature.properties.name, yow.short_name);
  assert.equal(feature.properties.group, "ONQC");
  assert.equal(feature.properties.sourceUrl, yow.url);
  assert.deepEqual(feature.geometry, data.features[0].geometry);
  const open = boundary(); open.features[0].geometry.coordinates[0].pop();
  assert.throws(() => zoneFeature(yow, open));
  const invalid = boundary(); invalid.features[0].geometry.coordinates[0][1][1] = 91;
  assert.throws(() => zoneFeature(yow, invalid));
  assert.throws(() => zoneFeature(yow, { type: "FeatureCollection", features: [] }));
  const mismatch = boundary(); mismatch.features[0].properties.code = "YUL";
  assert.throws(() => zoneFeature(yow, mismatch));
});

test("an enabled undrawn region keeps null geometry and never becomes a guessed circle", () => {
  const zone = { ...yow, has_boundary: false };
  const data = boundary();
  data.features[0].geometry = null;
  data.features[0].properties.has_boundary = false;
  data.features[0].properties.radius_km = 100;
  const feature = zoneFeature(zone, data);
  assert.equal(feature.geometry, null);
  assert.equal(feature.properties.hasBoundary, false);
  assert.throws(() => zoneFeature(yow, data));
  assert.throws(() => zoneFeature(zone, boundary()));
});

test("API requests reuse the one-hour cache and conditional 304 responses", async () => {
  const cache = {}, calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? new Response(JSON.stringify(directory()), { headers: { ETag: '"zones-v1"' } })
      : new Response(null, { status: 304 });
  };
  const first = await requestJson(directoryUrl, cache, fetcher);
  assert.deepEqual(await requestJson(directoryUrl, cache, fetcher), first);
  assert.equal(calls.length, 1);
  cache[directoryUrl].checkedAt = Date.now() - 3600_001;
  assert.deepEqual(await requestJson(directoryUrl, cache, fetcher), first);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.headers["If-None-Match"], '"zones-v1"');
  assert.equal(calls[1].options.redirect, "error");
  await assert.rejects(requestJson(directoryUrl, {}, async () => new Response(null, { status: 304 })), /without a cached response/);
});

test("API failures preserve cached data and do not retry through a rate limit", async () => {
  for (const status of [404, 429, 503]) {
    const cache = { [directoryUrl]: { checkedAt: 1, etag: '"old"', data: directory() } };
    const previous = structuredClone(cache);
    let calls = 0;
    await assert.rejects(requestJson(directoryUrl, cache, async () => {
      calls++;
      return new Response('{"error":"unavailable"}', { status, headers: { "Retry-After": "60" } });
    }), status === 429 ? /retry after 60 seconds/ : new RegExp("HTTP " + status));
    assert.equal(calls, 1);
    assert.deepEqual(cache, previous);
  }
  const source = readFileSync("scripts/fetch-meshmapper-regions.mjs", "utf8");
  assert.doesNotMatch(source, /zones_bbox|var zones/);
});
