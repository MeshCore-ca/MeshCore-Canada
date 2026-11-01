#!/usr/bin/env node
// Replace the approved MeshMapper snapshot with a reviewed API candidate, then rebuild the map.
// Nothing is written unless every check passes. Use --check to report without writing.
// --auto (the nightly job) publishes only simple changes and records its decision.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "./check-meshmapper-changes.mjs";
import { directoryUrl } from "./fetch-meshmapper-regions.mjs";
import "../docs/assets/regions/modules/iata-scopes.js";

const approvedPath = "docs/assets/regions/meshmapper-iata-boundaries.geojson";
const builtPaths = ["docs/assets/regions/iata-boundaries.geojson", "docs/assets/regions/iata-regions.json", "docs/assets/regions/canada-regions.json"];
// Rounding and routine edits change a zone by well under 1% and reach under 1 km
// beyond its outline; the redrawn YQB and YUL reached 21 and 111 km.
export const simpleChangePercent = 1;
export const simpleShiftKm = 5;

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

// Only these may change without a person. Names are text shown on the site and come
// from zone owners; other fields (URL, boundary availability) need a look too.
const automaticFields = new Set(["boundary", "centre", "group"]);

// Why the nightly job may not publish this on its own. No reasons means it may.
export function reviewReasons(result, map) {
  const reasons = [];
  if (result.added.length) reasons.push("New zones need their provinces checked: " + result.added.join(", "));
  if (result.removed.length) reasons.push("Zones no longer listed by MeshMapper: " + result.removed.join(", "));
  for (const item of result.changed) {
    const fields = item.fields.filter(field => !automaticFields.has(field));
    if (fields.length) reasons.push(`${item.tag}: ${fields.join(", ")} changed; only boundary, centre and group changes publish automatically`);
  }
  if (!map) return reasons;
  for (const region of [...map.added, ...map.removed]) reasons.push("Map region appeared or disappeared: " + region);
  for (const change of map.changes) {
    const kind = change.source === "meshmapper" ? "MeshMapper zone" : "planning area";
    if (change.percent >= simpleChangePercent) {
      reasons.push(`${change.tag} ${kind} changed by ${change.percent.toFixed(1)}% of its area, above the ${simpleChangePercent}% automatic limit`);
    }
    if (change.shiftKm >= simpleShiftKm) {
      reasons.push(`${change.tag} ${kind} reaches ${change.shiftKm.toFixed(1)} km beyond its old outline, above the ${simpleShiftKm} km automatic limit`);
    }
  }
  return reasons;
}

function commitMessage(result, map) {
  const moved = new Map(map.changes.filter(change => change.source === "meshmapper").map(change => [change.tag, change.percent]));
  const percent = value => value < 0.001 ? "under 0.001%" : value.toFixed(3) + "%";
  const lines = result.changed.map(item => `- ${item.tag}: ${item.fields.join(", ")}` + (moved.has(item.tag) ? ` (${percent(moved.get(item.tag))})` : ""));
  return "Update MeshMapper boundaries from the zones API\n\n" +
    `Nightly check. Since the last map a person approved, every region changed by less than ${simpleChangePercent}% ` +
    `of its area and reached less than ${simpleShiftKm} km beyond its outline, so this was published automatically.\n\n` + lines.join("\n") + "\n";
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
  const auto = args.includes("--auto");
  // The map as of the last change a person approved, so small nightly changes cannot add up unseen.
  const baselinePath = args.includes("--baseline") ? args[args.indexOf("--baseline") + 1] : null;
  const positional = args.filter((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--baseline");
  const candidatePath = resolve(positional[0] || ".tmp/meshmapper-review/candidate.geojson");
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
  const decide = (result, reasons = []) => {
    writeFileSync(".tmp/meshmapper-review/auto.json", JSON.stringify({ result, reasons }, null, 2) + "\n");
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${result}\n`);
    console.log(`Nightly decision: ${result}` + reasons.map(reason => "\n- " + reason).join(""));
  };
  if (plan.stops.length) {
    if (auto) return decide("review", plan.stops);
    console.error("Not promoted. Fix these, then run this again:\n" + plan.stops.map(stop => "- " + stop).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(summary(plan));
  if (auto && !plan.result.needsReview) return decide("unchanged");
  if (auto && reviewReasons(plan.result).length) return decide("review", reviewReasons(plan.result));
  if (check) {
    console.log("\nReady to promote. Run again without --check to update the map.");
    return;
  }
  const originals = Object.fromEntries([approvedPath, ...builtPaths].map(path => [path, readFileSync(path, "utf8")]));
  writeFileSync(approvedPath, JSON.stringify(JSON.parse(candidateText)) + "\n");
  execFileSync(python, ["scripts/build-iata-boundaries.py"], { stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/build-iata-catalog.mjs"], { stdio: "inherit" });
  if (auto) {
    writeFileSync(".tmp/meshmapper-review/previous-map.geojson", originals[builtPaths[0]]);
    execFileSync(python, ["scripts/compare-region-maps.py", baselinePath || ".tmp/meshmapper-review/previous-map.geojson", builtPaths[0],
      ".tmp/meshmapper-review/map-changes.json"], { stdio: "inherit" });
    const map = load(".tmp/meshmapper-review/map-changes.json");
    const reasons = reviewReasons(plan.result, map);
    if (reasons.length) {
      for (const [path, text] of Object.entries(originals)) writeFileSync(path, text);
      return decide("review", reasons);
    }
    writeFileSync(".tmp/meshmapper-review/commit-message.txt", commitMessage(plan.result, map));
    return decide("published");
  }
  console.log("\nPromoted. Check the map, then run:\n  node scripts/validate-regions.cjs\n  " + python +
    " scripts/verify-iata-geometry.py\n  npm run test:content\nand commit docs/assets/regions/ and data/.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
