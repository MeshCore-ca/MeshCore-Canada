#!/usr/bin/env node
// Refresh a reviewed snapshot; browsers never depend on a live MeshMapper request.
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const origin = "https://meshmapper.net/";

export function canadianZones(html) {
  const match = html.match(/\bvar zones\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("MeshMapper's published zone directory was not found");
  const zones = JSON.parse(match[1]);
  if (!Array.isArray(zones)) throw new Error("Invalid MeshMapper directory");
  const canadian = zones.filter(zone => typeof zone.name === "string" && /, CA$/.test(zone.name));
  const seen = new Set();
  for (const zone of canadian) {
    if (!/^[A-Z]{3}$/.test(zone.code) || seen.has(zone.code) ||
        !Number.isFinite(zone.lat) || !Number.isFinite(zone.lon) ||
        zone.lat < 41 || zone.lat > 84 || zone.lon < -142 || zone.lon > -52) {
      throw new Error(`Invalid or duplicate Canadian MeshMapper zone: ${zone.code}`);
    }
    seen.add(zone.code);
  }
  if (!canadian.length) throw new Error("MeshMapper returned no Canadian zones");
  return canadian.sort((a, b) => a.code.localeCompare(b.code));
}

export function zoneFeature(zone, records) {
  if (!Array.isArray(records)) throw new Error(`Invalid boundary response for ${zone.code}`);
  const matches = records.filter(record => record.code?.toUpperCase() === zone.code);
  if (matches.length !== 1) throw new Error(`Expected one boundary record for ${zone.code}`);
  const record = matches[0];
  if (record.polygon_withheld) throw new Error(`MeshMapper withheld the boundary for ${zone.code}; retry a smaller viewport`);
  if (!record.polygon) throw new Error(`No published polygon for ${zone.code}; do not invent a boundary`);
  const points = JSON.parse(record.polygon);
  if (!Array.isArray(points) || points.length < 3 || points.some(point =>
    !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) ||
    Math.abs(point[0]) > 90 || Math.abs(point[1]) > 180)) {
    throw new Error(`Invalid boundary coordinates for ${zone.code}`);
  }
  const ring = points.map(([lat, lon]) => [lon, lat]);
  if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) ring.push([...ring[0]]);
  return {
    type: "Feature",
    properties: {
      code: zone.code,
      tag: zone.code.toLowerCase(),
      name: zone.name.replace(/, CA$/, ""),
      country: "CA",
      center: [zone.lon, zone.lat],
      sourceUrl: `https://${zone.code.toLowerCase()}.meshmapper.net/`,
    },
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

async function request(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "MeshCore-Canada region snapshot (+https://github.com/MeshCore-ca/MeshCore-Canada)" },
  });
  if (!response.ok) throw new Error(`MeshMapper returned HTTP ${response.status}: ${url}`);
  return response;
}

async function main() {
  const output = resolve(process.argv[2] || ".tmp/meshmapper-canada-current.geojson");
  const zones = canadianZones(await (await request(origin)).text());
  const features = [];
  for (const zone of zones) {
    const url = new URL(origin);
    url.search = new URLSearchParams({
      ajax: "zones_bbox",
      minLat: String(zone.lat - 0.02), maxLat: String(zone.lat + 0.02),
      minLon: String(zone.lon - 0.02), maxLon: String(zone.lon + 0.02),
    }).toString();
    features.push(zoneFeature(zone, await (await request(url)).json()));
    console.log(`${zone.code}: published boundary verified`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const snapshot = {
    type: "FeatureCollection",
    schema: "meshcore-canada-meshmapper-zones/v1",
    fetchedAt: new Date().toISOString(),
    source: {
      label: "MeshMapper Canadian zones",
      url: origin,
      endpoint: `${origin}?ajax=zones_bbox`,
      boundaryAttribution: "MeshMapper zone owners; OpenStreetMap contributors (ODbL) and geoBoundaries (CC BY 4.0) where used by MeshMapper.",
      conversion: "Published [latitude, longitude] rings converted to GeoJSON [longitude, latitude]. No clipping, simplification, or radius-based replacement.",
    },
    featureCount: features.length,
    features,
  };
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(snapshot) + "\n");
  await rename(temporary, output);
  console.log(`Wrote ${features.length} Canadian zones to ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
