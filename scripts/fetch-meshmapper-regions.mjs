#!/usr/bin/env node
// Fetch a review candidate, never replace the website's approved boundaries.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const directoryUrl = "https://meshmapper.net/get_zones.php?country=CA";
const maxAge = 24 * 3600_000;
const requestSpacing = 2200; // Below the shared 30-reads/minute budget.
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const codePattern = /^[A-Z0-9]{2,6}$/;
const validCenter = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) &&
  point[0] >= -142 && point[0] <= -52 && point[1] >= 41 && point[1] <= 84;

function siteUrl(value) {
  const url = new URL(value);
  assert.ok(url.protocol === "https:" && /^[a-z0-9-]+\.meshmapper\.net$/.test(url.hostname) &&
    !url.port && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash,
  "Unexpected MeshMapper region URL");
  return url.href;
}

export function canadianZones(data) {
  assert.equal(data.country, "CA", "Expected a Canadian API directory");
  assert.ok(Array.isArray(data.zones) && data.zones.length > 0 && data.zones.length <= 500);
  assert.equal(data.count, data.zones.length, "Incomplete MeshMapper directory");
  const seen = new Set();
  for (const zone of data.zones) {
    assert.match(zone.code, codePattern);
    assert.ok(!seen.has(zone.code), "Duplicate MeshMapper code: " + zone.code);
    assert.equal(zone.country, "CA");
    assert.ok(typeof zone.short_name === "string" && zone.short_name.trim() && zone.short_name.length < 200);
    assert.ok(validCenter([zone.lon, zone.lat]), "Invalid Canadian region centre");
    assert.equal(typeof zone.has_boundary, "boolean");
    assert.ok(zone.group === null || (typeof zone.group === "string" && /^[A-Z0-9_-]{1,32}$/.test(zone.group)));
    siteUrl(zone.url);
    seen.add(zone.code);
  }
  return [...data.zones].sort((a, b) => a.code.localeCompare(b.code));
}

export function zoneFeature(zone, data) {
  assert.equal(data.type, "FeatureCollection");
  assert.ok(Array.isArray(data.features) && data.features.length === 1, "Expected one region boundary");
  const feature = data.features[0], properties = feature.properties;
  assert.equal(feature.type, "Feature");
  assert.equal(properties.code, zone.code);
  assert.equal(properties.country, "CA");
  assert.equal(properties.short_name, zone.short_name);
  assert.equal(siteUrl(properties.url), siteUrl(zone.url));
  assert.ok(validCenter(properties.center));
  assert.equal(properties.has_boundary, zone.has_boundary, "Directory and boundary disagree; retry after the cache expires");
  if (!zone.has_boundary) assert.equal(feature.geometry, null, "An undrawn boundary must stay null");
  if (feature.geometry !== null) {
    assert.equal(feature.geometry?.type, "Polygon");
    assert.ok(Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length > 0);
    for (const ring of feature.geometry.coordinates) {
      assert.ok(Array.isArray(ring) && ring.length >= 4);
      assert.deepEqual(ring[0], ring.at(-1), "API boundary must already be closed");
      assert.ok(ring.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) &&
        Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90), "Invalid GeoJSON coordinates");
    }
  }
  return {
    type: "Feature",
    properties: { code: zone.code, tag: zone.code.toLowerCase(), name: properties.short_name,
      country: "CA", center: properties.center, sourceUrl: siteUrl(zone.url),
      hasBoundary: properties.has_boundary, group: zone.group },
    geometry: feature.geometry,
  };
}

export function verifyDirectoryCoverage(zones, approved, allowRemovals = false) {
  const returned = new Set(zones.map(zone => zone.code.toLowerCase()));
  const missing = approved.features.map(feature => feature.properties.tag).filter(tag => !returned.has(tag));
  assert.ok(allowRemovals || !missing.length,
    "Directory omits approved regions: " + missing.join(", ") +
    ". Confirm Canada-wide key access; use --allow-region-removals only after reviewing actual removals.");
  return missing;
}

export async function requestJson(url, cache, options = {}) {
  const { apiKey = process.env.MESHMAPPER_API_KEY, fetcher = fetch, now = Date.now, sleep = wait } = options;
  assert.ok(typeof apiKey === "string" && /^[^\s\r\n]{16,512}$/.test(apiKey),
    "Configure MESHMAPPER_API_KEY with Canada-wide integration access before fetching");
  const target = new URL(url);
  assert.ok(url === directoryUrl || (target.pathname === "/get_geojson.php" && !target.search && !target.hash &&
    new URL("get_geojson.php", siteUrl(target.origin + "/")).href === url), "Unexpected MeshMapper API target");
  // Parsed data is private to this credential and geographic assignment, never an HTTP/public cache.
  const credential = createHash("sha256").update(apiKey + "\0CA").digest("hex");
  if (cache.schema !== "meshmapper-private-cache/v2" || cache.credential !== credential) {
    for (const key of Object.keys(cache)) delete cache[key];
    Object.assign(cache, { schema: "meshmapper-private-cache/v2", credential, responses: {} });
  }
  if (Number.isFinite(cache.retryAt) && cache.retryAt > now()) {
    throw new Error("MeshMapper retry deferred until " + new Date(cache.retryAt).toISOString());
  }
  const previous = cache.responses[url];
  const age = now() - previous?.checkedAt;
  if (previous?.data && Number.isFinite(age) && age >= 0 && age < maxAge) return previous.data;
  const delay = Math.max(0, (cache.nextRequestAt || 0) - now());
  assert.ok(delay <= 10_000, "API cache clock is ahead; check the system clock");
  if (delay) await sleep(delay);
  cache.nextRequestAt = now() + requestSpacing;
  let response;
  try {
    response = await fetcher(url, {
      signal: AbortSignal.timeout(120_000), redirect: "error",
      headers: { "User-Agent": "MeshCore-Canada region review (+https://github.com/MeshCore-ca/MeshCore-Canada)",
        "X-API-Key": apiKey,
        ...(typeof previous?.etag === "string" ? { "If-None-Match": previous.etag } : {}) },
    });
  } catch {
    cache.retryAt = now() + maxAge; // A timeout/reset may already have consumed a read.
    throw new Error("MeshMapper request did not complete; retained the previous copy and deferred retries for 24 hours");
  }
  if (response.status === 304) {
    assert.ok(previous?.data, "Received 304 without a cached response");
    previous.checkedAt = now();
    return previous.data;
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      cache.responses = {}; // Access changed: discard parsed data. Auth failures do not consume the read quota.
      delete cache.retryAt;
      throw new Error("MeshMapper HTTP " + response.status + ": check the integration key and its geographic/API permissions");
    }
    const retry = response.headers.get("retry-after");
    const retryTime = retry && /^\d+$/.test(retry) ? now() + Number(retry) * 1000 : Date.parse(retry || "");
    cache.retryAt = Number.isFinite(retryTime) && retryTime > now() ? retryTime : now() + maxAge;
    throw new Error("MeshMapper HTTP " + response.status + ": " + url +
      "; retry deferred until " + new Date(cache.retryAt).toISOString());
  }
  let data;
  try { data = await response.json(); }
  catch {
    cache.retryAt = now() + maxAge;
    throw new Error("MeshMapper returned incomplete JSON; retained the previous copy and deferred retries for 24 hours");
  }
  cache.responses[url] = { checkedAt: now(), etag: response.headers.get("etag"), data };
  return data;
}

async function saveJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + "." + process.pid + ".tmp";
  await writeFile(temporary, JSON.stringify(data) + "\n", { mode: 0o600 });
  await rename(temporary, path);
}

async function main() {
  const output = resolve(process.argv[2] || ".tmp/meshmapper-canada-current.geojson");
  const cachePath = resolve(".tmp/meshmapper-api-cache.json");
  let cache = {};
  try { cache = JSON.parse(await readFile(cachePath, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  assert.ok(cache && typeof cache === "object" && !Array.isArray(cache), "Invalid API cache");
  try {
    const directory = await requestJson(directoryUrl, cache);
    const zones = canadianZones(directory), features = [];
    const approved = JSON.parse(await readFile("docs/assets/regions/meshmapper-iata-boundaries.geojson", "utf8"));
    verifyDirectoryCoverage(zones, approved, process.argv.includes("--allow-region-removals"));
    for (const zone of zones) {
      const url = new URL("get_geojson.php", siteUrl(zone.url)).href;
      features.push(zoneFeature(zone, await requestJson(url, cache)));
      console.log(zone.code + (features.at(-1).geometry ? ": API boundary verified" : ": boundary unavailable (kept as null)"));
    }
    await saveJson(output, {
      type: "FeatureCollection", schema: "meshcore-canada-meshmapper-zones/v2",
      fetchedAt: new Date().toISOString(),
      source: { label: "MeshMapper Canadian zones", url: "https://meshmapper.net/",
        endpoint: directoryUrl, boundaryEndpoint: "<region-url>get_geojson.php",
        documentation: "https://wiki.meshmapper.net/zones-api/",
        boundaryAttribution: "MeshMapper zone owners; OpenStreetMap contributors (ODbL) and geoBoundaries (CC BY 4.0) where used by MeshMapper.",
        conversion: "API GeoJSON preserved without clipping, simplification, coordinate conversion, or invented boundaries." },
      featureCount: features.length, features,
    });
    console.log("Wrote " + features.length + " Canadian regions to " + output);
  } finally {
    // Retain private parsed data and cooldowns even if a later endpoint fails. Never publish this cache.
    await saveJson(cachePath, cache);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
