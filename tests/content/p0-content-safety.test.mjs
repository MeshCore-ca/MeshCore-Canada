import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function countH1(markdown) {
  return (markdown.match(/^# /gm) || []).length;
}

const assignedPages = [
  "docs/hardware/repeater-solar-batteries.md",
  "docs/hardware/wire-connector-types.md",
  "docs/hardware/repeater-mounting-options.md",
  "docs/meshcore/flash-companion.md",
  "docs/meshcore/flash-repeater.md",
  "docs/meshcore/flash-room-server.md",
  "docs/meshcore/update-repeater-ota.md",
  "docs/meshcore/generate-repeater-id.md",
  "docs/meshcore/firmware-rak-custom-display.md",
  "docs/meshcore/firmware-heltec-v3-wifi.md",
  "docs/meshcore/general-overview.md",
  "docs/provinces/index.md",
  "docs/provinces/saskatchewan.md",
  "docs/analyzer/builds/mctomqtt.md",
  "docs/analyzer/builds/mqtt-firmware.md",
];

test("every P0 content page has exactly one H1", () => {
  for (const file of assignedPages) {
    assert.equal(countH1(read(file)), 1, file);
  }
});

test("destructive flash actions are gated by backup warnings", () => {
  const cases = [
    ["docs/meshcore/flash-companion.md", "Click **Erase Flash**"],
    ["docs/meshcore/flash-repeater.md", "Click **Erase Flash**"],
    ["docs/meshcore/flash-room-server.md", "Click **Erase Flash**"],
    ["docs/analyzer/builds/mqtt-firmware.md", "enable **Erase device**"],
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

test("unsafe firmware recipes are archived without executable build steps", () => {
  const rak = read("docs/meshcore/firmware-rak-custom-display.md");
  const heltec = read("docs/meshcore/firmware-heltec-v3-wifi.md");

  for (const [name, text] of [["RAK", rak], ["Heltec", heltec]]) {
    assert.match(text, /Archived|archive/i, name);
    assert.match(text, /unverified|not supported/i, name);
    assert.doesNotMatch(text, /\.\/build\.sh|\[env:|set FIRMWARE_VERSION/, name);
    assert.match(text, /https:\/\/github\.com\/meshcore-dev\/MeshCore/, name);
  }
  assert.match(rak, /Historical upstream repository URL/);
  assert.match(heltec, /Historical upstream repository URL/);
});

test("draft hardware pages are visibly quarantined and mounting Markdown is repaired", () => {
  const solar = read("docs/hardware/repeater-solar-batteries.md");
  const connectors = read("docs/hardware/wire-connector-types.md");
  const mounting = read("docs/hardware/repeater-mounting-options.md");

  assert.match(solar, /Draft — not reviewed/);
  assert.match(solar, /Do not use it to choose/i);
  assert.match(connectors, /Draft reference/);
  assert.match(connectors, /verify before wiring/i);
  assert.doesNotMatch(mounting, /^\*\* \[/m);
  assert.doesNotMatch(mounting, /!\[\]\(/);
  assert.match(mounting, /Installation Checklist/);
});

test("Saskatchewan directory and generated listing agree on the local override", () => {
  const index = read("docs/provinces/index.md");
  const sk = read("docs/provinces/saskatchewan.md");

  assert.match(index, /StoonMesh/);
  assert.match(index, /Local override — Path hash mode: <strong>1-byte<\/strong>/);
  assert.match(index, /Path hash mode \| `3-byte`/);
  assert.match(sk, /Local setting differs from the Canada baseline/);
  assert.match(sk, /Path hash mode: <strong>1-byte<\/strong>/);
  assert.match(sk, /Confirm this setting with the community/i);
});

test("observer credential fields are empty, masked, revealable, and never persisted", () => {
  const page = read("docs/analyzer/builds/mqtt-firmware.md");
  const script = read("docs/assets/javascripts/analyzer-command-builder.js");
  const ssidInput = page.match(/<input id="observer-ssid"[^>]*>/)?.[0] || "";
  const passwordInput = page.match(/<input id="observer-password"[^>]*>/)?.[0] || "";

  assert.ok(ssidInput, "SSID input missing");
  assert.doesNotMatch(ssidInput, /\svalue=/);
  assert.match(passwordInput, /type="password"/);
  assert.doesNotMatch(passwordInput, /\svalue=/);
  assert.match(page, /id="observer-toggle-password"/);
  assert.match(script, /safeCliToken/);
  assert.match(script, /set wifi\.ssid \[hidden\]/);
  assert.match(script, /set wifi\.pwd \[hidden\]/);
  assert.match(script, /navigator\.clipboard\.writeText\(exactCommands\.join/);
  assert.match(script, /window\.addEventListener\("pagehide"/);
  assert.doesNotMatch(page, /YourWiFi(Network|Password)/);
  assert.doesNotMatch(page, /<script>/, "builder must be route-scoped");
  assert.doesNotThrow(() => new Function(script));
});

test("observer builder fails closed and redacts valid WiFi credentials", () => {
  const script = read("docs/assets/javascripts/analyzer-command-builder.js");

  class FakeElement {
    constructor(value = "", type = "text") {
      this.value = value;
      this.type = type;
      this.textContent = "";
      this.disabled = false;
      this.attributes = new Map();
      this.listeners = new Map();
      this.dataset = {};
      this.options = [];
      this.selectedIndex = 0;
      this.children = [];
    }
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }
    setAttribute(name, value) {
      this.attributes.set(name, value);
    }
    focus() {}
    appendChild(child) {
      this.children.push(child);
      return child;
    }
    replaceChildren(...children) {
      this.children = children;
    }
    dispatch(type) {
      this.listeners.get(type)?.({ type });
    }
  }

  const elements = new Map([
    ["observer-command-builder", new FakeElement()],
    ["observer-board", new FakeElement("heltec-v3")],
    ["observer-iata", new FakeElement()],
    ["observer-role", new FakeElement("Repeater")],
    ["observer-number", new FakeElement("01")],
    ["observer-ssid", new FakeElement()],
    ["observer-password", new FakeElement("", "password")],
    ["observer-repeat", new FakeElement("on")],
    ["observer-command-output", new FakeElement()],
    ["observer-copy-status", new FakeElement()],
    ["observer-command-errors", new FakeElement()],
    ["observer-command-summary", new FakeElement()],
    ["observer-copy-commands", new FakeElement()],
    ["observer-reveal-commands", new FakeElement()],
    ["observer-toggle-password", new FakeElement()],
    ["observer-clear-secrets", new FakeElement()],
    ["observer-iata-list", new FakeElement()],
    ["observer-location-status", new FakeElement()],
  ]);
  elements.get("observer-board").options = [{ text: "Heltec V3" }];
  const windowListeners = new Map();
  const fakeWindow = {
    TextEncoder,
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
  };
  const fakeDocument = {
    readyState: "complete",
    getElementById: (id) => elements.get(id) || null,
    createElement: () => new FakeElement(),
    createDocumentFragment: () => new FakeElement(),
  };
  const fakeNavigator = { clipboard: { writeText: async () => {} } };

  new Function("document", "window", "navigator", "TextEncoder", script)(
    fakeDocument,
    fakeWindow,
    fakeNavigator,
    TextEncoder,
  );

  const rootElement = elements.get("observer-command-builder");
  const output = elements.get("observer-command-output");
  const errors = elements.get("observer-command-errors");
  const copyButton = elements.get("observer-copy-commands");
  const revealButton = elements.get("observer-reveal-commands");

  assert.equal(copyButton.disabled, true);
  assert.match(output.textContent, /Complete the required fields/);

  elements.get("observer-iata").value = "YOW";
  elements.get("observer-ssid").value = "SafeNetwork";
  elements.get("observer-password").value = "SafePassword42!";
  rootElement.dispatch("input");

  assert.equal(errors.textContent, "");
  assert.equal(copyButton.disabled, true);
  assert.match(output.textContent, /set wifi\.ssid \[hidden\]/);
  assert.match(output.textContent, /set wifi\.pwd \[hidden\]/);
  assert.doesNotMatch(output.textContent, /SafeNetwork|SafePassword42/);

  revealButton.dispatch("click");
  assert.equal(copyButton.disabled, false);
  assert.match(output.textContent, /set wifi\.ssid SafeNetwork/);
  assert.match(output.textContent, /set wifi\.pwd SafePassword42!/);

  elements.get("observer-password").value = "bad\nreboot";
  rootElement.dispatch("input");
  assert.equal(copyButton.disabled, true);
  assert.match(errors.textContent, /safe CLI character set/);
  assert.doesNotMatch(output.textContent, /bad|reboot/);

  windowListeners.get("pagehide")();
  assert.equal(elements.get("observer-ssid").value, "");
  assert.equal(elements.get("observer-password").value, "");
  assert.equal(elements.get("observer-password").type, "password");
});

test("remote installer guidance explains impact, review, and rollback before one-liners", () => {
  const page = read("docs/analyzer/builds/mctomqtt.md");
  const reviewIndex = page.indexOf("### 1. Download and inspect the helper");
  const oneLinerIndex = page.indexOf("bash <(curl -fsSL");

  assert.match(page, /## What this changes/);
  assert.ok(reviewIndex >= 0, "review-first section missing");
  assert.ok(oneLinerIndex > reviewIndex, "remote one-liner appears before review-first guidance");
  assert.match(page, /## Recovery/);
  assert.match(page, /not pinned|not versioned/i);
  assert.match(page, /\.bak\.<timestamp>/);
  assert.match(page, /https:\/\/meshcore\.ca\/analyzer\/scripts\/add-meshcore-ca-broker\.sh/);
  assert.match(page, /https:\/\/meshcore\.ca\/analyzer\/scripts\/add-meshcore-ca-packetcapture-broker\.ps1/);
});

test("Canada baseline and local practice are explicitly separated", () => {
  const overview = read("docs/meshcore/general-overview.md");
  const companion = read("docs/meshcore/flash-companion.md");

  assert.match(overview, /Ottawa-specific.*local practice/i);
  assert.match(overview, /not proof of a Canada-wide standard/i);
  assert.match(companion, /Check the Mesh Directory|Check the \[Mesh Directory\]/i);
  assert.match(companion, /USA\/Canada \(Recommended\)/);
});
