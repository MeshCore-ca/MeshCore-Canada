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
  "start/companion.md",
  "start/room-server.md",
  "start/get-help.md",
];

const rolePages = {
  companion: "start/companion.md",
  "room-server": "start/room-server.md",
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
  const frenchHomepage = readDoc("index.fr.md");

  for (const page of [homepage, frenchHomepage]) {
    assert.match(page, /discord\.gg\/GBCP4xdgNv/);
    assert.match(page, /\{ #canada-baseline \}/);
    assert.match(page, /\]\(start\/index\.md\)/);
    assert.match(page, /\]\(provinces\/index\.md\)/);
    assert.match(page, /\]\(config\/index\.md\)/);
    assert.match(page, /\]\(hardware\/index\.md\)/);
    assert.match(page, /live\.meshcore\.ca/);
    assert.doesNotMatch(page, /mc-place-search|GitHub issue|github\.com\/MeshCore-ca\/MeshCore-Canada\/issues/);
  }
  assert.match(homepage, /not affiliated with the official MeshCore project/);
  assert.match(frenchHomepage, /sans affiliation avec le projet MeshCore officiel/);
  assert.match(homepage, /Find my zone\]\(config\/map\.md\)/);
  assert.match(frenchHomepage, /Trouver ma zone\]\(config\/map\.md\)/);
});

test("Start offers all roles and the local-settings handoff", () => {
  const start = readDoc("start/index.md");

  for (const link of ["companion.md", "../config/index.md", "room-server.md", "../analyzer/intro.md", "get-help.md"]) {
    assert.match(start, new RegExp(`\\]\\(${link.replace(".", "\\.")}\\)`));
  }

  assert.match(start, /community directory/);
  assert.match(start, /Canada defaults/);
  assert.doesNotMatch(start, /Ottawa/);
});

test("each role guide is direct and reaches verification and support", () => {
  for (const [role, relativePath] of Object.entries(rolePages)) {
    const page = readDoc(relativePath);

    for (const heading of [
      "## Before you start",
      "## Test it",
      "## What's next",
    ]) {
      assert.ok(page.includes(heading), `${relativePath} is missing ${heading}`);
    }

    assert.doesNotMatch(page, /\bOutcome:|Your setup path|path is complete/);
    assert.match(page, /\]\(get-help\.md\)/);
    assert.match(page, /community lists different settings|community\s+publishes different settings/i);
  }
});

test("retired visitor pages use canonical redirects instead of searchable bridge copy", () => {
  const config = readFileSync(resolve(repoRoot, "mkdocs.yml"), "utf8");

  for (const [oldPath, currentPath] of [
    ["resources/getting-started.md", "start/index.md"],
    ["start/choose-a-goal.md", "start/index.md"],
    ["start/repeater.md", "config/index.md"],
    ["start/observer.md", "analyzer/intro.md"],
    ["start/verify.md", "start/get-help.md"],
    ["meshcore/firmware-rak-custom-display.md", "start/companion.md"],
    ["meshcore/firmware-heltec-v3-wifi.md", "start/companion.md"],
    ["meshcore/flash-companion.md", "start/companion.md"],
    ["meshcore/flash-room-server.md", "start/room-server.md"],
    ["hardware/repeater-solar-batteries.md", "hardware/recommended-repeaters.md"],
    // The flash guide, the MQTT observer page and the ON/QC proposal now live in the setup tool and its explainer.
    ["meshcore/flash-repeater.md", "config/index.md"],
    ["analyzer/builds/mqtt-firmware.md", "config/index.md"],
    ["proposals/onqc-scopes.md", "config/guide.md"],
  ]) {
    assert.match(config, new RegExp(`${oldPath.replaceAll("/", "\\/")}: ${currentPath.replaceAll("/", "\\/")}`));
    assert.equal(existsSync(resolve(docsRoot, oldPath)), false, `${oldPath} must not remain searchable`);
  }
});

test("the retired setup pages and their assets are gone, in both languages", () => {
  for (const retired of [
    "meshcore/flash-repeater", "analyzer/builds/mqtt-firmware", "proposals/onqc-scopes",
  ]) {
    for (const suffix of [".md", ".fr.md"]) {
      assert.equal(existsSync(resolve(docsRoot, retired + suffix)), false, `${retired}${suffix} must be removed`);
    }
  }
  for (const asset of [
    "assets/javascripts/scopes-picker.js", "assets/javascripts/analyzer-command-builder.js", "assets/styles/scopes-proposal.css",
  ]) {
    assert.equal(existsSync(resolve(docsRoot, asset)), false, `${asset} was only used by a retired page`);
  }
  const config = readFileSync(resolve(repoRoot, "mkdocs.yml"), "utf8");
  assert.doesNotMatch(config, /^ +- [^\n]*: (?:meshcore\/flash-repeater|analyzer\/builds\/mqtt-firmware)\.md$/m, "retired pages are out of the navigation");
  assert.doesNotMatch(config, /^ +(?:Flash a repeater|MQTT firmware): /m, "retired pages have no French navigation titles");
});

test("the repeater bench test says to set the clock after every reboot, and why, in the tool's words", () => {
  const flat = (source) => source.replace(/\s+/g, " ");
  // The same plain sentence as the setup tool's clock check (setup-commands.test.mjs).
  const why = {
    en: "After a restart its clock is often wrong, and phones may ignore its announcements until it's set.",
    fr: "Après un redémarrage, son horloge est souvent fausse, et les téléphones peuvent ignorer ses annonces tant qu’elle n’est pas réglée."
  };
  for (const [page, advice, lang] of [
    ["config/index.md", "Each time it reboots, set its clock again with `clock sync` from the MeshCore app.", "en"],
    ["config/index.fr.md", "Chaque fois qu’il redémarre, réglez de nouveau son horloge avec `clock sync` depuis l’application MeshCore.", "fr"],
  ]) {
    const source = readDoc(page);
    const section = flat(source);
    assert.ok(section.includes(`${advice} ${why[lang]}`), page);
    assert.doesNotMatch(section, /stale advert|advert timing|heure d’annonce périmée/, `${page}: no jargon`);
  }
});

test("repeater and observer setup open the tool and the method table directly", () => {
  for (const french of [false, true]) {
    const suffix = french ? ".fr" : "";
    const tool = readDoc(`config/index${suffix}.md`);
    const observer = readDoc(`analyzer/intro${suffix}.md`);
    assert.match(tool, /\]\(guide\.md#loop-detection\)/, "loop detection is explained in the guide");
    assert.match(tool, /`clock sync`/);
    assert.match(observer, /\]\(\.\.\/config\/index\.md\?type=observer\)/, "the method table links the repeater observer setup");
    assert.doesNotMatch(observer, /mqtt-firmware|observer-method-chooser/);
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
