import assert from "node:assert/strict";
import test from "node:test";
import { canadianZones, zoneFeature } from "../../scripts/fetch-meshmapper-regions.mjs";

const yow = { code: "YOW", name: "Ottawa–Gatineau, CA", lat: 45.41, lon: -75.7 };

test("the MeshMapper importer selects Canada and rejects incomplete directories", () => {
  const html = `var zones = ${JSON.stringify([{ code: "BUF", name: "Buffalo, US" }, yow])};`;
  assert.deepEqual(canadianZones(html), [yow]);
  assert.throws(() => canadianZones("<p>Unavailable</p>"));
  assert.throws(() => canadianZones("var zones = [];"));
  assert.throws(() => canadianZones(`var zones = ${JSON.stringify([yow, yow])};`));
  assert.throws(() => canadianZones(`var zones = ${JSON.stringify([{ ...yow, code: "../bad" }])};`));
});

test("published MeshMapper rings retain coordinates and never become guessed circles", () => {
  const boundary = { code: "YOW", polygon: "[[45,-76],[46,-76],[46,-75]]" };
  const feature = zoneFeature(yow, [boundary]);
  assert.equal(feature.properties.tag, "yow");
  assert.equal(feature.properties.name, "Ottawa–Gatineau");
  assert.deepEqual(feature.geometry.coordinates, [[[-76, 45], [-76, 46], [-75, 46], [-76, 45]]]);
  assert.throws(() => zoneFeature(yow, [{ code: "YOW", polygon_withheld: true }]));
  assert.throws(() => zoneFeature(yow, [{ code: "YOW", radius_km: 100 }]));
  assert.throws(() => zoneFeature(yow, [{ code: "YOW", polygon: "[[91,0],[0,0],[1,1]]" }]));
  assert.throws(() => zoneFeature(yow, []));
});
