import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const hardwarePages = [
  "docs/hardware/overview.md",
  "docs/hardware/recommended-antenna.md",
  "docs/hardware/recommended-companions.md",
  "docs/hardware/recommended-repeaters.md",
  "docs/hardware/repeater-mounting-options.md",
  "docs/hardware/repeater-solar-1w-diy-build.md",
  "docs/hardware/repeater-solar-300mw-diy-build.md",
  "docs/hardware/repeater-solar-batteries.md",
  "docs/hardware/wire-connector-types.md",
];

const firmwarePages = [
  "docs/meshcore/firmware-heltec-v3-wifi.md",
  "docs/meshcore/firmware-rak-custom-display.md",
  "docs/meshcore/flash-companion.md",
  "docs/meshcore/flash-repeater.md",
  "docs/meshcore/flash-room-server.md",
  "docs/meshcore/general-overview.md",
  "docs/meshcore/generate-repeater-id.md",
  "docs/meshcore/update-repeater-ota.md",
];

const pages = [...hardwarePages, ...firmwarePages];

function frontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "page must start with YAML front matter");
  return match[1];
}

test("every Devices & Builds page has lifecycle metadata and scoped styles", () => {
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

  assert.ok(
    existsSync(resolve(root, "docs/assets/styles/devices-builds.css")),
    "route stylesheet must exist",
  );

  for (const path of pages) {
    const source = read(path);
    const metadata = frontMatter(source);
    for (const key of required) {
      assert.match(metadata, new RegExp(`^${key}:`, "m"), `${path} missing ${key}`);
    }
    assert.match(
      metadata,
      /page_styles:\n  - assets\/styles\/devices-builds\.css/,
      `${path} must load only the Devices & Builds stylesheet`,
    );
    assert.equal((source.match(/^# /gm) || []).length, 1, `${path} needs one H1`);

    const title = metadata.match(/^title:\s*(.+)$/m)?.[1];
    const description = metadata.match(/^description:\s*(.+)$/m)?.[1];
    assert.ok(!titles.has(title), `duplicate Devices & Builds title: ${title}`);
    assert.ok(!descriptions.has(description), `duplicate Devices & Builds description: ${description}`);
    titles.add(title);
    descriptions.add(description);
  }
});

test("recommendation pages state evidence, compatibility, accessories, and price limits", () => {
  for (const path of [
    "docs/hardware/recommended-antenna.md",
    "docs/hardware/recommended-companions.md",
    "docs/hardware/recommended-repeaters.md",
  ]) {
    const source = read(path);
    assert.match(frontMatter(source), /^status: draft$/m, path);
    assert.match(source, /evidence/i, `${path} must describe its evidence`);
    assert.match(source, /verify/i, `${path} must define verification`);
    assert.match(source, /price.*date|date.*price/i, `${path} must date-limit prices`);
    assert.match(source, /connector|accessor/i, `${path} must cover compatibility or accessories`);
    assert.match(source, /Human review required/i, `${path} must retain reviewer gate`);
  }
});

test("build guides provide staged, printable safety and commissioning records", () => {
  for (const path of [
    "docs/hardware/repeater-solar-300mw-diy-build.md",
    "docs/hardware/repeater-solar-1w-diy-build.md",
  ]) {
    const source = read(path);
    for (const phrase of [
      "Before you start",
      "What this build changes",
      "Bill of materials",
      "Tools",
      "Assembly stages",
      "Expected readings and stop conditions",
      "Bench test and commissioning",
      "Recovery and undo",
      "Maintenance",
      "Sources and change log",
    ]) {
      assert.match(source, new RegExp(phrase, "i"), `${path} missing ${phrase}`);
    }
    assert.match(source, /class="mc-stage-list"/);
    assert.match(source, /class="mc-checklist"/);
    assert.match(source, /No numeric .*peer-reviewed/i);
    assert.match(source, /physical USB|USB recovery/i);
  }
});

test("archived firmware pages remain non-executable and outside beginner guidance", () => {
  for (const path of [
    "docs/meshcore/firmware-heltec-v3-wifi.md",
    "docs/meshcore/firmware-rak-custom-display.md",
  ]) {
    const source = read(path);
    assert.match(frontMatter(source), /^status: archived$/m);
    assert.match(source, /Archived route/);
    assert.match(source, /Human review required/);
    assert.doesNotMatch(source, /\.\/build\.sh|\[env:|set FIRMWARE_VERSION/);
    assert.match(source, /https:\/\/github\.com\/meshcore-dev\/MeshCore/);
  }
});

test("destructive firmware flows expose preflight, backup, verification, and recovery", () => {
  const destructivePages = [
    "docs/meshcore/flash-companion.md",
    "docs/meshcore/flash-repeater.md",
    "docs/meshcore/flash-room-server.md",
    "docs/meshcore/generate-repeater-id.md",
    "docs/meshcore/update-repeater-ota.md",
  ];

  for (const path of destructivePages) {
    const source = read(path);
    const metadata = frontMatter(source);
    assert.match(metadata, /^destructive: true$/m, path);
    assert.doesNotMatch(metadata, /^status: verified$/m, path);
    assert.match(source, /^## .*(Before|Prerequisites|backup)/im, `${path} missing preflight`);
    assert.match(source, /^## .*Verif/im, `${path} missing verification`);
    assert.match(source, /^## .*(Recovery|restore)/im, `${path} missing recovery`);
    assert.match(source, /private key|identity/i, `${path} must protect identity`);
  }

  for (const path of [
    "docs/meshcore/flash-companion.md",
    "docs/meshcore/flash-repeater.md",
    "docs/meshcore/flash-room-server.md",
  ]) {
    const source = read(path);
    assert.ok(
      source.search(/back up|backup/i) < source.indexOf("Click **Erase Flash**"),
      `${path} backup must precede erase`,
    );
  }
});

test("hardware images have useful alternative text", () => {
  for (const path of hardwarePages) {
    const source = read(path);
    assert.doesNotMatch(source, /!\[\]\(/, `${path} contains empty Markdown alt text`);
    assert.doesNotMatch(source, /<img(?![^>]*\balt="[^"]+")[^>]*>/i, `${path} contains an image without alt`);
  }
});

test("relative Markdown links in owned pages resolve in the source tree", () => {
  for (const path of pages) {
    const source = read(path);
    const base = dirname(resolve(root, path));
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const href = match[1].split(/[?#]/, 1)[0];
      if (!href || /^(?:https?:|mailto:|tel:)/.test(href)) continue;
      const destination = resolve(base, href);
      assert.ok(existsSync(destination), `${path} has missing link target ${href}`);
    }
  }
});
