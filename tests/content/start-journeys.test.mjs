import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const docsRoot = resolve(repoRoot, "docs");

const ownedMarkdown = [
  "index.md",
  "start/index.md",
  "start/choose-a-goal.md",
  "start/companion.md",
  "start/repeater.md",
  "start/room-server.md",
  "start/observer.md",
  "start/verify.md",
  "start/get-help.md",
];

const rolePages = {
  companion: "start/companion.md",
  repeater: "start/repeater.md",
  "room-server": "start/room-server.md",
  observer: "start/observer.md",
};

const readDoc = (relativePath) =>
  readFileSync(resolve(docsRoot, relativePath), "utf8");

const frontMatter = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, "page must start with YAML front matter");
  return match[1];
};

test("owned Start pages have required, unique page metadata", () => {
  const titles = new Set();
  const descriptions = new Set();
  const required = [
    "title",
    "description",
    "audience",
    "task",
    "scope",
    "status",
    "owner",
    "last_reviewed",
    "review_by",
  ];

  for (const relativePath of ownedMarkdown) {
    const metadata = frontMatter(readDoc(relativePath));

    for (const key of required) {
      assert.match(
        metadata,
        new RegExp(`^${key}:`, "m"),
        `${relativePath} must declare ${key}`
      );
    }

    const title = metadata.match(/^title:\s*(.+)$/m)?.[1];
    const description = metadata.match(/^description:\s*(.+)$/m)?.[1];
    assert.ok(title, `${relativePath} needs a title`);
    assert.ok(description, `${relativePath} needs a description`);
    assert.ok(!titles.has(title), `duplicate title: ${title}`);
    assert.ok(!descriptions.has(description), `duplicate description: ${description}`);
    titles.add(title);
    descriptions.add(description);
  }
});

test("homepage is task-first and exposes the required decisions", () => {
  const homepage = readDoc("index.md");

  assert.match(homepage, /Welcome! We're improving this site/);
  assert.match(homepage, /Open a GitHub issue/);
  assert.match(homepage, /## What are you looking for\? \{ #start-with-your-goal \}/);
  assert.match(homepage, /## What kind of device are you setting up\? \{ #choose-a-role \}/);
  assert.match(homepage, /## Canada Default Radio Settings \{ #canada-baseline \}/);
  assert.match(homepage, /Set up your LoRa radio and join a Canadian mesh/);
  assert.match(homepage, /Start the guided setup\]\(start\/index\.md\)/);
  assert.match(homepage, /Find a community\]\(provinces\/index\.md\)/);
  assert.match(homepage, /name="place"/);
  assert.doesNotMatch(homepage, /name="lookup"|mc-home-online-lookup|Look this place up online/);
  assert.match(homepage, /Set up an observer\]\(start\/observer\.md\)\{ \.mc-observer-link \}/);

  for (const role of [
    "Personal companion",
    "Repeater",
    "Room server",
    "Observer",
  ]) {
    assert.match(homepage, new RegExp(role));
  }
});

test("Start offers all roles, an unsure path, and the local-settings handoff", () => {
  const start = readDoc("start/index.md");

  for (const link of [
    "companion.md",
    "repeater.md",
    "room-server.md",
    "observer.md",
    "choose-a-goal.md",
  ]) {
    assert.match(start, new RegExp(`\\]\\(${link.replace(".", "\\.")}\\)`));
  }

  assert.match(start, /Not sure which one fits/);
  assert.match(start, /community directory/);
  assert.match(start, /Canada defaults/);
  assert.match(start, /preparation, configuration, and a quick working check/);
});

test("each role guide is direct and reaches verification and support", () => {
  for (const [role, relativePath] of Object.entries(rolePages)) {
    const page = readDoc(relativePath);

    for (const heading of [
      "## Before you start",
      "## Make sure it works",
      "## What's next",
    ]) {
      assert.ok(page.includes(heading), `${relativePath} is missing ${heading}`);
    }

    assert.doesNotMatch(page, /\bOutcome:|Your setup path|path is complete/);
    assert.match(page, /<h2[^>]*>Setup checklist<\/h2>/);
    assert.match(page, new RegExp(`data-mc-progress-page="${role}"`));
    assert.match(page, /id="[^"]+" type="checkbox" data-mc-progress/);
    assert.match(page, /\]\(verify\.md#[^)]+\)/);
    assert.match(page, /\]\(get-help\.md\)/);
    assert.match(page, /community lists different settings|community\s+publishes different settings/i);
  }
});

test("progress inputs use stable, unique ids and contain no values", () => {
  const ids = new Set();

  for (const relativePath of Object.values(rolePages)) {
    const page = readDoc(relativePath);
    const inputs = [...page.matchAll(/<input\s+([^>]*data-mc-progress[^>]*)>/g)];
    assert.ok(inputs.length >= 6 && inputs.length <= 7, `${relativePath} must expose six or seven useful progress checks`);

    for (const [, attributes] of inputs) {
      const id = attributes.match(/\bid="([^"]+)"/)?.[1];
      assert.ok(id, `${relativePath} progress input needs an id`);
      assert.ok(!ids.has(id), `duplicate progress id: ${id}`);
      assert.doesNotMatch(attributes, /\bvalue=/i);
      ids.add(id);
    }
  }
});

test("retired visitor pages use canonical redirects instead of searchable bridge copy", () => {
  const config = readFileSync(resolve(repoRoot, "mkdocs.yml"), "utf8");

  for (const [oldPath, currentPath] of [
    ["resources/getting-started.md", "start/index.md"],
    ["meshcore/firmware-rak-custom-display.md", "meshcore/flash-companion.md"],
    ["meshcore/firmware-heltec-v3-wifi.md", "meshcore/flash-companion.md"],
    ["hardware/wire-connector-types.md", "hardware/recommended-repeaters.md"],
    ["hardware/repeater-solar-batteries.md", "hardware/recommended-repeaters.md"],
  ]) {
    assert.match(config, new RegExp(`${oldPath.replaceAll("/", "\\/")}: ${currentPath.replaceAll("/", "\\/")}`));
    assert.equal(existsSync(resolve(docsRoot, oldPath)), false, `${oldPath} must not remain searchable`);
  }
});

test("all relative Markdown links in owned pages resolve to source files", () => {
  for (const relativePath of ownedMarkdown) {
    const source = readDoc(relativePath);
    const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

    for (const match of source.matchAll(linkPattern)) {
      const destination = match[1].split("#", 1)[0].split("?", 1)[0];
      if (
        !destination ||
        destination.startsWith("http://") ||
        destination.startsWith("https://") ||
        destination.startsWith("mailto:")
      ) {
        continue;
      }

      const target = resolve(dirname(resolve(docsRoot, relativePath)), destination);
      assert.ok(
        existsSync(target),
        `${relativePath} links to missing source ${destination}`
      );
    }
  }
});
