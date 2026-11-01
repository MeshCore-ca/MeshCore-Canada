#!/usr/bin/env node
// Replace the approved MeshMapper snapshot with a reviewed API candidate, then rebuild the map.
// Nothing is written unless every check passes. Use --check to report without writing.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "./check-meshmapper-changes.mjs";
import { directoryUrl } from "./fetch-meshmapper-regions.mjs";
import "../docs/assets/regions/modules/iata-scopes.js";

const approvedPath = "docs/assets/regions/meshmapper-iata-boundaries.geojson";

export function planPromotion({ approved, candidate, report, candidateSha256, policy, starterTags, profileTags, jurisdictions }) {
  const stops = [];
  if (candidate.schema !== "meshcore-canada-meshmapper-zones/v2" || candidate.source?.endpoint !== directoryUrl) {
    stops.push("This file did not come from the MeshMapper zones API. Fetch it with scripts/fetch-meshmapper-regions.mjs.");
    return { stops };
  }
  if (report.candidateSha256 !== candidateSha256) stops.push("The geometry report belongs to a different file.");
  for (const issue of report.issues) {
    stops.push(`${issue.tag}: ${issue.kind.replaceAll("-", " ")}${issue.detail ? " (" + issue.detail + ")" : ""}. Fix this boundary in MeshMapper, then fetch again.`);
  }
  const result = compareSnapshots(approved, candidate, starterTags);
  for (const tag of result.collisions) {
    stops.push(`${tag}: MeshMapper now publishes this MeshCore Canada starter code. Retire the starter in data/iata-starter-regions.json first.`);
  }
  const listed = new Map(candidate.features.map(feature => [feature.properties.tag, feature]));
  const mapped = new Set([...listed].filter(([, feature]) => feature.geometry !== null).map(([tag]) => tag));
  for (const tag of mapped) {
    if (policy.zoneProvinces[tag]) continue;
    const [lon, lat] = listed.get(tag).properties.center;
    const guess = jurisdictions.features.filter(province => globalThis.MeshCoreIataScopes.contains(province, lat, lon)).map(province => province.properties.tag);
    stops.push(`${tag}: new region. Add "${tag}": ${JSON.stringify(guess.length ? guess : ["??"])} to zoneProvinces in data/iata-scope-policy.json` +
      " (list every province it serves).");
  }
  for (const tag of Object.keys(policy.zoneProvinces)) {
    if (mapped.has(tag) || starterTags.includes(tag)) continue;
    stops.push(listed.has(tag)
      ? `${tag}: no longer has a boundary in MeshMapper. Redraw it there, or remove "${tag}" from zoneProvinces in data/iata-scope-policy.json to take it off the map.`
      : `${tag}: MeshMapper no longer lists this region. Remove "${tag}" from zoneProvinces in data/iata-scope-policy.json.`);
  }
  for (const tag of profileTags) {
    if (!mapped.has(tag) && !starterTags.includes(tag)) {
      stops.push(`${tag}: remove its record from data/iata-region-profiles.json; the region is no longer on the map.`);
    }
  }
  return { stops, result };
}

function summary({ result }) {
  const list = values => values.length ? values.join(", ") : "none";
  return [
    "Added: " + list(result.added),
    "Changed: " + list(result.changed.map(item => `${item.tag} (${item.fields.join(", ")})`)),
    "Removed: " + list(result.removed),
    "Listed without a boundary, not on the map: " + list(result.unmapped),
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const candidatePath = resolve(args.find(arg => !arg.startsWith("--")) || ".tmp/meshmapper-review/candidate.geojson");
  const python = process.env.PYTHON || "python3";
  const load = path => JSON.parse(readFileSync(path, "utf8"));
  const candidateText = readFileSync(candidatePath, "utf8");
  const reportPath = resolve(".tmp/meshmapper-review/promote-geometry.json");
  try {
    execFileSync(python, ["scripts/check-meshmapper-geometry.py", candidatePath, reportPath], { stdio: "inherit" });
  } catch {
    throw new Error(`The geometry check could not run. Install the region tools with: ${python} -m pip install -r scripts/requirements-regions.txt`);
  }
  const plan = planPromotion({
    approved: load(approvedPath), candidate: JSON.parse(candidateText), report: load(reportPath),
    candidateSha256: createHash("sha256").update(candidateText).digest("hex"),
    policy: load("data/iata-scope-policy.json"),
    starterTags: load("data/iata-starter-regions.json").regions.map(region => region.tag),
    profileTags: Object.keys(load("data/iata-region-profiles.json").regions),
    jurisdictions: load("docs/assets/regions/scope-jurisdictions.geojson"),
  });
  if (plan.stops.length) {
    console.error("Not promoted. Fix these, then run this again:\n" + plan.stops.map(stop => "- " + stop).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(summary(plan));
  if (check) {
    console.log("\nReady to promote. Run again without --check to update the map.");
    return;
  }
  writeFileSync(approvedPath, JSON.stringify(JSON.parse(candidateText)) + "\n");
  execFileSync(python, ["scripts/build-iata-boundaries.py"], { stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/build-iata-catalog.mjs"], { stdio: "inherit" });
  console.log("\nPromoted. Check the map, then run:\n  node scripts/validate-regions.cjs\n  " + python +
    " scripts/verify-iata-geometry.py\n  npm run test:content\nand commit docs/assets/regions/ and data/.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
