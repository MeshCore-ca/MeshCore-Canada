import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const docsRoot = resolve(repoRoot, "docs");

const ownedMarkdown = [
  "index.md",
  "resources/getting-started.md",
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

  assert.match(homepage, /Welcome! We are actively updating our website/);
  assert.match(homepage, /submit a git issue!/);
  assert.match(homepage, /## What are you looking for\? \{ #start-with-your-goal \}/);
  assert.match(homepage, /## What kind of device are you setting up\? \{ #choose-a-role \}/);
  assert.match(homepage, /## Canada Default Radio Settings \{ #canada-baseline \}/);
  assert.match(homepage, /Newly purchased LoRa radio[\s\S]+local\s+Canadian\s+MeshCore region/);
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

test("Start offers all roles, an unsure path, and the baseline warning", () => {
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

  assert.match(start, /I am not sure/);
  assert.match(start, /USA\/Canada \(Recommended\)/);
  assert.match(start, /910\.525 MHz \/ 62\.5 kHz \/ SF7 \/ CR5/);
  assert.match(start, /Local settings take priority/);
});

test("each role journey reaches verification, support, and a useful next step", () => {
  for (const [role, relativePath] of Object.entries(rolePages)) {
    const page = readDoc(relativePath);

    for (const heading of [
      "## Understand the role",
      "## Before you start",
      "## What this path changes",
      "## Verify success",
      "## Operate and maintain",
      "## Next step",
    ]) {
      assert.ok(page.includes(heading), `${relativePath} is missing ${heading}`);
    }

    assert.match(page, new RegExp(`data-mc-progress-page="${role}"`));
    assert.match(page, /id="[^"]+" type="checkbox" data-mc-progress/);
    assert.match(page, /\]\(verify\.md#[^)]+\)/);
    assert.match(page, /\]\(get-help\.md\)/);
    assert.match(page, /local community publishes an override|local community publishes different settings/i);
  }
});

test("progress inputs use stable, unique ids and contain no values", () => {
  const ids = new Set();

  for (const relativePath of Object.values(rolePages)) {
    const page = readDoc(relativePath);
    const inputs = [...page.matchAll(/<input\s+([^>]*data-mc-progress[^>]*)>/g)];
    assert.equal(inputs.length, 7, `${relativePath} must expose seven progress checks`);

    for (const [, attributes] of inputs) {
      const id = attributes.match(/\bid="([^"]+)"/)?.[1];
      assert.ok(id, `${relativePath} progress input needs an id`);
      assert.ok(!ids.has(id), `duplicate progress id: ${id}`);
      assert.doesNotMatch(attributes, /\bvalue=/i);
      ids.add(id);
    }
  }
});

test("the legacy Getting Started URL is a useful canonical bridge", () => {
  const bridge = readDoc("resources/getting-started.md");

  assert.match(bridge, /Getting Started has moved/);
  assert.match(bridge, /\]\(\.\.\/start\/index\.md\)/);
  assert.match(bridge, /bookmarks and external links do not\s+break/);
  assert.doesNotMatch(bridge, /http-equiv=["']refresh/i);
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
