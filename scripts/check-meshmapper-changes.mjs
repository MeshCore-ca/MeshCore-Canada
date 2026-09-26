#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function compareSnapshots(before, after, starterTags = []) {
  function index(snapshot) {
    assert.ok(["meshcore-canada-meshmapper-zones/v1", "meshcore-canada-meshmapper-zones/v2"].includes(snapshot.schema));
    assert.ok(snapshot.features.length > 0 && snapshot.features.length <= 500);
    const entries = new Map();
    for (const feature of snapshot.features) {
      const { tag, name, center } = feature.properties;
      assert.match(tag, /^[a-z0-9]{2,6}$/);
      assert.ok(!entries.has(tag) && typeof name === "string" && name.length < 200);
      assert.ok(center.length === 2 && center.every(Number.isFinite));
      if (feature.geometry === null) assert.equal(feature.properties.hasBoundary, false);
      else assert.ok(["Polygon", "MultiPolygon"].includes(feature.geometry.type));
      entries.set(tag, feature);
    }
    return entries;
  }
  const old = index(before), current = index(after);
  const added = [], removed = [], changed = [];
  for (const [tag, feature] of current) {
    if (!old.has(tag)) added.push(tag);
    else {
      const previous = old.get(tag), fields = [];
      if (previous.properties.name !== feature.properties.name) fields.push("name");
      if (JSON.stringify(previous.properties.center) !== JSON.stringify(feature.properties.center)) fields.push("centre");
      if (JSON.stringify(previous.geometry) !== JSON.stringify(feature.geometry)) fields.push("boundary");
      if (previous.properties.sourceUrl !== feature.properties.sourceUrl) fields.push("URL");
      if ((previous.properties.group || null) !== (feature.properties.group || null)) fields.push("group");
      if (fields.length) changed.push({ tag, fields });
    }
  }
  for (const tag of old.keys()) if (!current.has(tag)) removed.push(tag);
  const collisions = [...current.keys()].filter(tag => starterTags.includes(tag)).sort();
  const unmapped = [...current].filter(([, feature]) => feature.geometry === null).map(([tag]) => tag).sort();
  const changes = { added: added.sort(), removed: removed.sort(), changed: changed.sort((a, b) => a.tag.localeCompare(b.tag)), collisions, unmapped };
  // Ignore fetch time and object ordering; include the candidate shapes in the digest.
  const digest = createHash("sha256").update(JSON.stringify([...current].sort(([a], [b]) => a.localeCompare(b)).map(([tag, feature]) => [tag, feature.properties.name, feature.properties.center, feature.geometry, feature.properties.sourceUrl, feature.properties.group || null]))).digest("hex");
  return { ...changes, digest, needsReview: added.length + removed.length + changed.length + collisions.length > 0 };
}

export function reviewText(result) {
  const list = values => values.map(tag => "`" + tag + "`").join(", ") || "None";
  return `<!-- meshmapper-review:start -->\n<!-- digest:${result.digest} -->\n## MeshMapper snapshot needs review\n\n` +
    `Added: ${list(result.added)}\n\nRemoved: ${list(result.removed)}\n\nChanged: ${result.changed.map(item => "`" + item.tag + "` (" + item.fields.join(", ") + ")").join(", ") || "None"}\n\n` +
    `Starter-code collisions: ${list(result.collisions)}\n\n` +
    `Enabled regions without a drawn boundary: ${list(result.unmapped)}\n\n` +
    "Download the candidate snapshot from this workflow's artifacts. Review its boundaries, province metadata, local contacts, and any starter replacements in a PR. Regenerate the combined map and catalogue, run the region and browser tests, and verify both languages on the preview. Nothing has been published automatically.\n<!-- meshmapper-review:end -->";
}

async function publish(report, result) {
  assert.match(process.env.GITHUB_REPOSITORY || "", /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.ok(process.env.GITHUB_TOKEN);
  const endpoint = "https://api.github.com/repos/" + process.env.GITHUB_REPOSITORY;
  async function request(path, method = "GET", body) {
    const response = await fetch(endpoint + path, { method, signal: AbortSignal.timeout(30000), headers: {
      Accept: "application/vnd.github+json", Authorization: "Bearer " + process.env.GITHUB_TOKEN,
      "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json"
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) throw new Error(`GitHub review issue request failed: ${response.status}`);
    return response.json();
  }
  let found;
  for (let page = 1; page <= 10; page++) {
    const issues = await request(`/issues?state=open&creator=github-actions%5Bbot%5D&per_page=100&page=${page}`);
    found = issues.find(issue => !issue.pull_request && issue.user?.login === "github-actions[bot]" && issue.title === "Review MeshMapper region changes" && issue.body?.includes("<!-- meshmapper-review:start -->") && issue.body?.includes("<!-- meshmapper-review:end -->"));
    if (found || issues.length < 100) break;
    if (page === 10) throw new Error("Too many review issues; refusing to create a duplicate");
  }
  if (found?.body.includes(`<!-- digest:${result.digest} -->`)) return;
  const run = `\n\n[Workflow evidence](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`;
  if (found) {
    const body = found.body.replace(/<!-- meshmapper-review:start -->[\s\S]*?<!-- meshmapper-review:end -->/, report);
    await request(`/issues/${found.number}`, "PATCH", { body });
    await request(`/issues/${found.number}/comments`, "POST", { body: "The candidate snapshot changed. The review summary above is updated." + run });
  } else await request("/issues", "POST", { title: "Review MeshMapper region changes", body: report + run });
}

async function main() {
  const load = async path => JSON.parse(await readFile(path, "utf8"));
  const result = compareSnapshots(await load("docs/assets/regions/meshmapper-iata-boundaries.geojson"), await load(process.argv[2]), (await load("data/iata-starter-regions.json")).regions.map(region => region.tag));
  await mkdir(".tmp/meshmapper-review", { recursive: true });
  await writeFile(".tmp/meshmapper-review/changes.json", JSON.stringify(result, null, 2) + "\n");
  const report = result.needsReview ? reviewText(result) : "No MeshMapper region changes.\n";
  await writeFile(".tmp/meshmapper-review/review.md", report);
  console.log(report);
  if (result.needsReview && process.argv.includes("--publish-issue")) await publish(report, result);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
