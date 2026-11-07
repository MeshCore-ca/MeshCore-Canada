import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

vm.runInThisContext(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../docs/assets/setup/setup-text.js"), "utf8"), { filename: "setup-text.js" });
const setupText = globalThis.MeshCoreSetupText;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function countH1(markdown) {
  return (markdown.match(/^# /gm) || []).length;
}

const assignedPages = [
  "docs/hardware/repeater-mounting-options.md",
  "docs/start/companion.md",
  "docs/start/room-server.md",
  "docs/meshcore/update-repeater-ota.md",
  "docs/meshcore/generate-repeater-id.md",
  "docs/meshcore/general-overview.md",
  "docs/provinces/index.md",
  "docs/provinces/saskatchewan.md",
  "docs/analyzer/builds/mctomqtt.md",
];

test("every P0 content page has exactly one H1", () => {
  for (const file of assignedPages) {
    assert.equal(countH1(read(file)), 1, file);
  }
});

test("destructive flash actions on the guide pages are gated by backup warnings", () => {
  const cases = [
    ["docs/start/companion.md", "click **Erase Flash**"],
    ["docs/start/room-server.md", "click **Erase Flash**"],
  ];

  for (const [file, destructiveAction] of cases) {
    const text = read(file);
    const actionIndex = text.indexOf(destructiveAction);
    const dangerIndex = text.indexOf("!!! danger");
    const backupIndex = text.slice(0, actionIndex).search(/back up|backup/i);
    assert.ok(actionIndex >= 0, `${file}: missing destructive action fixture`);
    assert.ok(dangerIndex >= 0, `${file}: missing backup danger gate`);
    assert.ok(dangerIndex < actionIndex, `${file}: backup gate must precede erase`);
    assert.ok(backupIndex >= 0, `${file}: backup instructions must precede erase`);
    assert.match(text.slice(0, actionIndex), /private key|identity/i, file);
  }
});

test("the setup tool erases only new boards and warns to back up a running one first", () => {
  const warn = {
    en: /Back it up first\. .*save its private key.*`get prv\.key`.*Never erase it in the flasher: that deletes its identity/,
    fr: /Sauvegardez-la d’abord\. .*sauvegarder sa clé privée.*`get prv\.key`.*Ne l’effacez jamais dans l’outil de programmation : ça supprime son identité/,
  };
  const eraseNew = {
    en: { esp32: /^Tick Erase device, since it's a new board\./, nrf52: /^Click Erase Flash, since it's a new board\./ },
    fr: { esp32: /^Cochez Erase device, puisque c’est une carte neuve\./, nrf52: /^Cliquez sur Erase Flash, puisque c’est une carte neuve\./ },
  };
  const eraseRunning = {
    en: { esp32: /^Leave Erase device unticked\./, nrf52: /^Don't click Erase Flash\./ },
    fr: { esp32: /^Laissez Erase device décoché\./, nrf52: /^Ne cliquez pas sur Erase Flash\./ },
  };
  const backUpFirstOnSwitch = { en: /Save its private key first/, fr: /Sauvegardez d’abord sa clé privée/ };

  for (const lang of ["en", "fr"]) {
    assert.match(setupText.t("status.backup", lang), warn[lang], `${lang}: a running board is backed up before anything else`);
    assert.match(setupText.t("observerFirmware.switch", lang), backUpFirstOnSwitch[lang], `${lang}: switching firmware warns to back up`);
    for (const chip of ["esp32", "nrf52"]) {
      assert.match(setupText.t(`flash.erase.${chip}-new`, lang), eraseNew[lang][chip], `${lang} ${chip}: new boards only`);
      assert.match(setupText.t(`flash.erase.${chip}-running`, lang), eraseRunning[lang][chip], `${lang} ${chip}: a running board is never erased`);
    }
  }

  // The warning shows on the "new or running" screen, which comes before the flash step; the flash step then picks its erase line by that same answer.
  const ui = read("docs/assets/setup/setup-ui.js");
  assert.match(ui, /status === "running"\) body\.appendChild\(note\("warn", para\(rich\("status\.backup", null, LINKS\.flasher\)\)\)\)/);
  assert.match(ui, /t\("flash\.erase\." \+ [^;]*"-" \+ \(a\.status === "running" \? "running" : "new"\)\)/);
  const flow = read("docs/assets/setup/setup-flow.js");
  const askedStatus = flow.indexOf('steps.push("board", "status")');
  assert.ok(askedStatus >= 0 && askedStatus < flow.indexOf('steps.push("flash")'), "the status question comes before the flash step");
});

test("unsafe and incomplete legacy pages are removed from the content tree", () => {
  for (const path of [
    "docs/meshcore/firmware-rak-custom-display.md",
    "docs/meshcore/firmware-heltec-v3-wifi.md",
    "docs/hardware/repeater-solar-batteries.md",
  ]) {
    assert.equal(existsSync(resolve(root, path)), false, `${path} must not remain searchable`);
  }
});

test("header and favicon use small, separate vector assets", () => {
  const config = read("mkdocs.yml");
  const assets = [
    "docs/assets/MeshCore-Canada-Mark.svg",
    "docs/assets/MeshCore-Canada-Favicon.svg",
  ];

  assert.match(config, /logo: assets\/MeshCore-Canada-Mark\.svg/);
  assert.match(config, /favicon: assets\/MeshCore-Canada-Favicon\.svg/);
  assert.doesNotMatch(config, /MeshCore-Canada-Favicon\.png/);
  for (const asset of assets) {
    assert.ok(statSync(resolve(root, asset)).size < 3_000, `${asset} should stay lightweight`);
  }
});

test("mounting Markdown remains repaired", () => {
  const mounting = read("docs/hardware/repeater-mounting-options.md");

  assert.doesNotMatch(mounting, /^\*\* \[/m);
  assert.doesNotMatch(mounting, /!\[\]\(/);
  assert.match(mounting, /Installation checklist/);
});

test("Saskatchewan directory and generated listing agree on the national baseline", () => {
  const index = read("docs/provinces/index.md");
  const sk = read("docs/provinces/saskatchewan.md");

  const card = (id) => index.slice(index.indexOf(`id="directory-${id}"`), index.indexOf("</article>", index.indexOf(`id="directory-${id}"`)));
  // Directory cards only mention radio settings when a community differs from the Canada defaults.
  assert.doesNotMatch(card("stoonmesh"), /Radio settings/);
  assert.match(card("bc-mesh"), /<strong>Radio settings:<\/strong> Different local settings/);
  assert.match(sk, /<h3>StoonMesh<\/h3>/);
  assert.match(sk, /<h3>YQRMesh<\/h3>/);
  assert.doesNotMatch(sk, /<dt>Radio settings<\/dt>/);
  assert.doesNotMatch(sk, /1-byte|Local setting differs/);
});
test("remote installer guidance explains impact, review, and rollback before one-liners", () => {
  const page = read("docs/analyzer/builds/mctomqtt.md");
  const reviewIndex = page.indexOf("### 1. Download and inspect the helper");
  const oneLinerIndex = page.indexOf("bash add-meshcore-ca-broker.sh");

  assert.match(page, /## What this changes/);
  assert.ok(reviewIndex >= 0, "review-first section missing");
  assert.ok(oneLinerIndex > reviewIndex, "execution appears before review-first guidance");
  assert.doesNotMatch(page, /bash <\(curl/);
  assert.match(page, /## Recovery/);
  assert.match(page, /not pinned|not versioned/i);
  assert.match(page, /\.bak\.<timestamp>/);
  assert.match(page, /https:\/\/meshcore\.ca\/analyzer\/scripts\/add-meshcore-ca-broker\.sh/);
  assert.match(page, /https:\/\/meshcore\.ca\/analyzer\/scripts\/add-meshcore-ca-packetcapture-broker\.ps1/);
});

test("Canada baseline and local practice are explicitly separated", () => {
  const overview = read("docs/meshcore/general-overview.md");
  const companion = read("docs/start/companion.md");

  assert.match(overview, /community directory/i);
  assert.match(overview, /Canada defaults/i);
  assert.match(overview, /Official MeshCore resources/i);
  assert.match(companion, /Check the\s+\[community directory\]/i);
  assert.match(companion, /choose \*\*Canada\*\*/);
  assert.match(companion, /\*\*3-byte\*\* paths/);
});
