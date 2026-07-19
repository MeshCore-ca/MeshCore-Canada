import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editorRoot = new URL("../../docs/config/editor/", import.meta.url);

async function source(name) {
  return readFile(new URL(name, editorRoot), "utf8");
}

test("proposal type is explicit before geography and new-region eligibility is visible", async () => {
  const html = await source("index.html");
  const typePosition = html.indexOf('id="proposal-type-panel"');
  const provincePosition = html.indexOf('id="province-select"');
  assert.ok(typePosition >= 0);
  assert.ok(typePosition < provincePosition);
  assert.match(html, /Advanced: propose a new region\/subregion/);
  assert.match(html, /Beta workflow/);
  assert.match(html, /Nothing changes when you submit/);
});

test("editor exposes a complete structured alternative to the optional map", async () => {
  const html = await source("index.html");
  assert.match(html, /id="municipality-select"/);
  assert.match(html, /id="move-municipality-button"/);
  assert.match(html, /id="changes-table-body"/);
  assert.match(html, /id="text-summary"/);
  assert.match(html, /Skip the map and choose a municipality/);
  assert.match(html, /id="editor-map" role="region"/);
  assert.doesNotMatch(html, /role="application"/);
});

test("anchor and readiness are available outside the map", async () => {
  const html = await source("index.html");
  assert.match(html, /id="anchor-select"/);
  assert.match(html, />Confirm this anchor</);
  assert.match(html, /id="derived-parent"/);
  assert.match(html, /id="hierarchy-path"/);
  assert.match(html, /id="readiness-list"/);
});

test("native confirms and automatic first-cell anchoring are absent", async () => {
  const app = await source("app.js");
  assert.doesNotMatch(app, /window\.confirm\s*\(/);
  assert.doesNotMatch(app, /anchorChange\s*=\s*changes\.find/);
  assert.match(app, /state\.newRegionAnchor = elements\.anchorSelect\.value/);
  assert.match(app, /No anchor is selected automatically/);
});

test("proposal undo is scoped away from editable controls", async () => {
  const app = await source("app.js");
  assert.match(app, /isEditableTarget\(event\.target\)/);
  assert.match(app, /key !== "z" && key !== "y"/);
});

test("local draft snapshot does not read contributor identity or coordinates", async () => {
  const app = await source("app.js");
  const start = app.indexOf("function draftSnapshot()");
  const end = app.indexOf("function draftHasContent()", start);
  const snapshot = app.slice(start, end);
  assert.doesNotMatch(snapshot, /submittedBy|latitude|longitude|coordinates/);
  assert.match(snapshot, /baseMembershipSha256/);
  assert.match(snapshot, /province/);
  assert.match(snapshot, /schema/);
});
