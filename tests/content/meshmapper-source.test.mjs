import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canadianZones, directoryUrl, requestJson, verifyDirectoryCoverage, zoneFeature } from "../../scripts/fetch-meshmapper-regions.mjs";

function client(fetcher) {
  let clock = Date.now();
  return { apiKey: "fixture-integration-key-not-a-secret", fetcher, now: () => clock,
    sleep: async milliseconds => { clock += milliseconds; } };
}

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
  const unusable = boundary(); unusable.features[0].geometry = null;
  const stored = zoneFeature(yow, unusable);
  assert.equal(stored.geometry, null);
  assert.equal(stored.properties.hasBoundary, true);
});

test("authenticated API requests reuse private daily data and conditional 304 responses", async () => {
  const cache = {}, calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? new Response(JSON.stringify(directory()), { headers: { ETag: '"zones-v1"' } })
      : new Response(null, { status: 304 });
  };
  const options = client(fetcher);
  const first = await requestJson(directoryUrl, cache, options);
  assert.deepEqual(await requestJson(directoryUrl, cache, options), first);
  assert.equal(calls.length, 1);
  cache.responses[directoryUrl].checkedAt = options.now() - 3600_001;
  await requestJson(directoryUrl, cache, options);
  assert.equal(calls.length, 1);
  cache.responses[directoryUrl].checkedAt = options.now() - 86400_001;
  assert.deepEqual(await requestJson(directoryUrl, cache, options), first);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.options.headers["X-API-Key"] === options.apiKey));
  assert.equal(calls[1].options.headers["If-None-Match"], '"zones-v1"');
  assert.equal(calls[1].options.redirect, "error");
  assert.ok(!JSON.stringify(cache).includes(options.apiKey));
  await assert.rejects(requestJson(directoryUrl, {}, client(async () => new Response(null, { status: 304 }))), /without a cached response/);
});

test("HTTP failures preserve previous data and persist Retry-After across reruns", async () => {
  for (const status of [404, 429, 503]) {
    const cache = {}, options = client(async () => new Response(JSON.stringify(directory())));
    await requestJson(directoryUrl, cache, options);
    cache.responses[directoryUrl].checkedAt = 1;
    const previous = structuredClone(cache.responses);
    let calls = 0;
    options.fetcher = async () => { calls++; return new Response('{"error":"unavailable"}', { status, headers: { "Retry-After": "60" } }); };
    await assert.rejects(requestJson(directoryUrl, cache, options), new RegExp("HTTP " + status));
    assert.equal(cache.retryAt, options.now() + 60_000);
    await assert.rejects(requestJson(directoryUrl, cache, options), /retry deferred/);
    assert.equal(calls, 1);
    assert.deepEqual(cache.responses, previous);
  }
  const source = readFileSync("scripts/fetch-meshmapper-regions.mjs", "utf8");
  assert.doesNotMatch(source, /zones_bbox|var zones/);
});

test("request spacing includes the directory and every region and blocks key leakage", async () => {
  const starts = [], cache = {};
  const options = client(async () => { starts.push(options.now()); return new Response(JSON.stringify(directory())); });
  await requestJson(directoryUrl, cache, options);
  await requestJson("https://yow.meshmapper.net/get_geojson.php", cache, options);
  await requestJson("https://yul.meshmapper.net/get_geojson.php", cache, options);
  assert.ok(starts.slice(1).every((start, i) => start - starts[i] >= 2200));
  for (const url of ["https://evil.test/get_geojson.php", "http://yow.meshmapper.net/get_geojson.php", "https://yow.meshmapper.net/get_geojson.php?key=x", "https://user:pass@yow.meshmapper.net/get_geojson.php"]) {
    await assert.rejects(requestJson(url, cache, options), /Unexpected/);
  }
  await assert.rejects(requestJson(directoryUrl, {}, { ...options, apiKey: "" }), /Configure MESHMAPPER_API_KEY/);
  assert.equal(starts.length, 3);
});

test("credential rotation and access failures discard previously authorized data", async () => {
  const cache = {}, options = client(async () => new Response(JSON.stringify(directory())));
  await requestJson(directoryUrl, cache, options);
  const credential = cache.credential;
  options.apiKey = "another-fixture-integration-key";
  options.fetcher = async (url, request) => {
    assert.equal(request.headers["If-None-Match"], undefined);
    return new Response(JSON.stringify(directory()));
  };
  await requestJson(directoryUrl, cache, options);
  assert.notEqual(cache.credential, credential);
  cache.responses[directoryUrl].checkedAt = 1;
  options.fetcher = async () => new Response('{"error":"region_not_allowed"}', { status: 403 });
  await assert.rejects(requestJson(directoryUrl, cache, options), /HTTP 403 \(region_not_allowed\)/);
  assert.deepEqual(cache.responses, {});
  options.fetcher = async () => new Response("<html>Forbidden</html>", { status: 403 });
  await assert.rejects(requestJson(directoryUrl, cache, options), /HTTP 403: check the integration key/);
});

test("ambiguous timeouts and broken JSON never cause immediate retries or erase the last copy", async () => {
  for (const failure of [async () => { throw new Error("timeout"); }, async () => new Response('{"zones":')]) {
    const cache = {}, options = client(async () => new Response(JSON.stringify(directory())));
    await requestJson(directoryUrl, cache, options);
    cache.responses[directoryUrl].checkedAt = 1;
    const previous = structuredClone(cache.responses);
    let calls = 0;
    options.fetcher = async () => { calls++; return failure(); };
    await assert.rejects(requestJson(directoryUrl, cache, options), /24 hours/);
    await assert.rejects(requestJson(directoryUrl, cache, options), /retry deferred/);
    assert.equal(calls, 1);
    assert.deepEqual(cache.responses, previous);
  }
});

test("partial geographic authorization cannot masquerade as national region removals", () => {
  const approved = { features: [{ properties: { tag: "yow" } }, { properties: { tag: "ykf" } }] };
  assert.throws(() => verifyDirectoryCoverage([yow], approved), /Canada-wide key access/);
  assert.deepEqual(verifyDirectoryCoverage([yow], approved, true), ["ykf"]);
  assert.deepEqual(verifyDirectoryCoverage([yow, { ...yow, code: "YKF" }], approved), []);
  const workflow = readFileSync(".github/workflows/meshmapper-review.yml", "utf8");
  assert.match(workflow, /secrets\.MESHMAPPER_API_KEY/);
  assert.doesNotMatch(workflow, /uses: actions\/cache|allow-region-removals|pull_request_target/);
  // Nightly, publishing only what the promotion script's automatic mode allows.
  assert.match(workflow, /cron: '23 7 \* \* \*'/);
  assert.match(workflow, /promote-meshmapper-snapshot\.mjs \S+ --auto --baseline \S+reviewed-map\.geojson/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /if: steps\.decide\.outputs\.result == 'published'/);
});
