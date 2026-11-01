import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editorRoot = new URL("../../docs/config/editor/", import.meta.url);

async function source(name) {
  return readFile(new URL(name, editorRoot), "utf8");
}

test("the retired editor directs both languages to MeshMapper without an editing form", async () => {
  for (const page of ["index.md", "index.fr.md"]) {
    const markdown = await source(page);
    assert.match(markdown, /https:\/\/meshmapper\.net\//);
    assert.doesNotMatch(markdown, /<form|proposal-type|editor-map|app\.js/);
    assert.match(markdown, /\.\.\/map\.md/);
  }
});

test("retirement landing loads no census map or anti-spam widget", async () => {
  const markdown = await source("index.md");
  assert.doesNotMatch(markdown, /leaflet|turnstile|app\.js|cells/);
  assert.match(markdown, /legacy-draft-export\.js/);
});

test("saved drafts have a native export button and an accessible status", async () => {
  for (const page of ["index.md", "index.fr.md"]) {
    const markdown = await source(page);
    assert.match(markdown, /<button type="button"[^>]+data-legacy-draft-export/);
    assert.match(markdown, /data-legacy-draft-status role="status" aria-live="polite"/);
  }
});

test("community listing updates remain linked from the retired editor", async () => {
  for (const page of ["index.md", "index.fr.md"]) {
    assert.match(await source(page), /\.\.\/\.\.\/submit-idea\.md/);
  }
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
