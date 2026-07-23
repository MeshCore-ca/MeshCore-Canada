import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pages = [
  "docs/meshcore/general-overview.md",
  "docs/meshcore/general-howto.md",
  "docs/meshcore/general-faq.md",
  "docs/resources/glossary.md",
  "docs/resources/links.md",
];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function body(markdown) {
  const closing = markdown.indexOf("\n---\n", 4);
  assert.ok(closing > 0, "front matter must be closed");
  return markdown.slice(closing + 5);
}

function metadataValue(markdown, key) {
  return markdown.match(new RegExp(`^${key}: (.+)$`, "m"))?.[1]?.trim();
}

test("Learn pages have complete lifecycle metadata and one H1", () => {
  for (const relativePath of pages) {
    const markdown = read(relativePath);
    assert.ok(markdown.startsWith("---\n"), `${relativePath}: front matter`);
    for (const key of [
      "title",
      "description",
      "task",
      "scope",
      "status",
      "owner",
      "last_reviewed",
      "review_by",
    ]) {
      assert.ok(metadataValue(markdown, key), `${relativePath}: ${key}`);
    }
    assert.match(markdown, /^audience:\n  - [a-z0-9-]+/m, relativePath);
    assert.match(metadataValue(markdown, "last_reviewed"), /^\d{4}-\d{2}-\d{2}$/);
    assert.match(metadataValue(markdown, "review_by"), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal((body(markdown).match(/^# /gm) || []).length, 1, relativePath);
  }
});

test("MeshCore overview explains all four roles and routes users forward", () => {
  const markdown = read(pages[0]);

  for (const role of ["companion", "repeater", "room server", "observer"]) {
    assert.match(markdown, new RegExp(`\\*\\*${role}\\*\\*`, "i"), role);
  }
  assert.match(markdown, /\[Compare device roles\]\(\.\.\/start\/choose-a-goal\.md\)/);
  assert.match(markdown, /\[Choose a role and start setup\]\(\.\.\/start\/index\.md\)/);
  assert.doesNotMatch(markdown, /project has split|legacy|Ottawa/i);
});

test("FAQ is deep-linkable and refers changing settings to canonical sources", () => {
  const markdown = read(pages[2]);

  for (const heading of [
    "Settings and range",
    "Hardware",
    "Joining or starting a mesh",
    "Observers and troubleshooting",
  ]) {
    assert.match(markdown, new RegExp(`^## ${heading}$`, "m"), heading);
  }
  assert.ok((markdown.match(/^### /gm) || []).length >= 9, "FAQ questions need headings");
  assert.match(markdown, /\[repeater configurator\]\(\.\.\/config\/index\.md\)/);
  assert.match(markdown, /\[community directory\]\(\.\.\/provinces\/index\.md\)/);
  assert.doesNotMatch(markdown, /910\.525|set radio|set path\.hash\.mode/);
});

test("app task index keeps accessible images and explicit results", () => {
  const markdown = read(pages[1]);

  for (const anchor of [
    "#share-your-contact-link",
    "#import-a-contact-link",
    "#trace-a-path",
    "#check-heard-repeats",
  ]) {
    assert.ok(markdown.includes(`](${anchor})`), anchor);
  }
  const images = [...markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g)];
  assert.ok(images.length >= 15, "existing task screenshots must be retained");
  for (const [, alt, imagePath, attributes] of images) {
    assert.ok(alt.trim(), `${imagePath}: alt text`);
    assert.match(attributes, /loading=lazy/, imagePath);
    assert.ok(existsSync(resolve(root, "docs/meshcore", imagePath)), imagePath);
  }
  assert.doesNotMatch(markdown, /!\[\]\(/);
  assert.ok((markdown.match(/class="mc-result"/g) || []).length >= 2);
});

test("glossary is grouped, scannable, and expands data acronyms", () => {
  const markdown = read(pages[3]);

  for (const heading of ["A-D", "F-M", "N-R", "S-W"]) {
    assert.match(markdown, new RegExp(`^## ${heading}$`, "m"), heading);
  }
  assert.match(markdown, /Message Queuing Telemetry Transport \(MQTT\)/);
  assert.match(markdown, /JSON Web Token \(JWT\)/);
  assert.match(markdown, /Signal-to-noise ratio \(SNR\)/);
  assert.match(markdown, /Spreading factor \(SF\)/);
  assert.doesNotMatch(markdown, /910\.525|mqtt1\.meshcore\.ca|mqtt2\.meshcore\.ca/);
});

test("external resources are labelled and carry a review date", () => {
  const markdown = read(pages[4]);
  const content = body(markdown);
  const links = [...content.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)\{([^}]+)\}/g)];

  assert.equal(metadataValue(markdown, "link_checked"), "2026-07-19");
  assert.ok(links.length >= 10, "reviewed external-link inventory is unexpectedly small");
  for (const [url, label, , attributes] of links) {
    assert.match(label, /\(external\)$/i, url);
    assert.match(attributes, /target="_blank"/, url);
    assert.match(attributes, /rel="noopener"/, url);
  }
  assert.doesNotMatch(content, /<https:\/\//, "bare external links are not labelled");
});

test("local Learn links point to source pages", () => {
  for (const relativePath of pages) {
    const source = resolve(root, relativePath);
    const markdown = body(read(relativePath));
    for (const match of markdown.matchAll(/\]\((?!https?:|#)([^)#?]+\.md)(?:#[^)]+)?\)/g)) {
      const target = resolve(dirname(source), match[1]);
      assert.ok(existsSync(target), `${relativePath}: missing ${match[1]}`);
    }
  }
});
