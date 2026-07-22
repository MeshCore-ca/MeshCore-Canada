import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const pages = [
  "docs/analyzer/intro.md",
  "docs/analyzer/data-collection-access.md",
  "docs/analyzer/verify.md",
  "docs/analyzer/troubleshooting.md",
  "docs/analyzer/broker-reference.md",
  "docs/analyzer/iata-codes.md",
  "docs/analyzer/remoteterm.md",
  "docs/analyzer/builds/mctomqtt.md",
  "docs/analyzer/builds/meshcore-ha.md",
  "docs/analyzer/builds/mqtt-firmware.md",
  "docs/analyzer/builds/pymc.md",
];

const methodPages = [
  "docs/analyzer/remoteterm.md",
  "docs/analyzer/builds/mctomqtt.md",
  "docs/analyzer/builds/meshcore-ha.md",
  "docs/analyzer/builds/mqtt-firmware.md",
  "docs/analyzer/builds/pymc.md",
];

function frontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "page must start with YAML front matter");
  return match[1];
}

test("every Analyzer page has required, unique metadata and route-scoped styles", () => {
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

  for (const path of pages) {
    const source = read(path);
    const metadata = frontMatter(source);
    for (const key of required) {
      assert.match(metadata, new RegExp(`^${key}:`, "m"), `${path} missing ${key}`);
    }
    assert.match(metadata, /page_styles:\n  - assets\/styles\/analyzer\.css/);
    const title = metadata.match(/^title:\s*(.+)$/m)?.[1];
    const description = metadata.match(/^description:\s*(.+)$/m)?.[1];
    assert.ok(!titles.has(title), `duplicate Analyzer title: ${title}`);
    assert.ok(!descriptions.has(description), `duplicate Analyzer description: ${description}`);
    titles.add(title);
    descriptions.add(description);
    assert.equal((source.match(/^# /gm) || []).length, 1, `${path} needs one H1`);
  }
});

test("intro explains the path before MQTT details and recommends every method", () => {
  const source = read("docs/analyzer/intro.md");
  const chooser = read("docs/assets/javascripts/analyzer-method-chooser.js");
  const radio = source.indexOf("<strong>Radio</strong>");
  const observer = source.indexOf("<strong>Observer</strong>");
  const infrastructure = source.indexOf("<strong>MeshCore Canada</strong>");
  const viewer = source.indexOf("<strong>Live tools</strong>");

  assert.ok(radio >= 0 && radio < observer && observer < infrastructure && infrastructure < viewer);
  assert.ok(source.indexOf("The shared endpoints use MQTT") > viewer);
  assert.match(source, /id="observer-method-chooser"/);
  assert.match(source, /assets\/javascripts\/analyzer-method-chooser\.js/);
  for (const method of ["RemoteTerm", "Home Assistant", "PyMC", "MCtoMQTT", "Standalone MQTT firmware"]) {
    assert.match(source, new RegExp(method));
  }
  for (const path of ["../remoteterm/", "../builds/meshcore-ha/", "../builds/pymc/", "../builds/mctomqtt/", "../builds/mqtt-firmware/"]) {
    assert.ok(chooser.includes(`href: "${path}"`), `chooser must resolve ${path} from /analyzer/intro/`);
  }
  assert.match(source, /broker connection.*not.*finish|Setup is not finished.*connected/is);
});

test("all observer method guides follow one lifecycle and end in live verification", () => {
  const headings = [
    "## Is this method right for you?",
    "## Before you start",
    "## What this changes",
    "## Set up",
    "## What you should see",
    "## Verify in CoreScope",
    "## Recovery",
    "## If verification fails",
  ];

  for (const path of methodPages) {
    const source = read(path);
    for (const heading of headings) {
      assert.ok(source.includes(heading), `${path} missing ${heading}`);
    }
    assert.match(source, /https:\/\/live\.meshcore\.ca\/#\/observers/);
    assert.match(source, /https:\/\/live\.meshcore\.ca\/#\/packets/);
    assert.match(source, /\]\((?:\.\.\/)?verify\.md\)/);
    assert.match(source, /\]\((?:\.\.\/)?troubleshooting\.md/);
    assert.match(source, /not.*proof|not enough|not end-to-end proof|without a recent packet is not complete/i);
  }
});

test("privacy page states ownership, access, and the unknown retention boundary", () => {
  const source = read("docs/analyzer/data-collection-access.md");
  for (const phrase of [
    "Policy summary",
    "MeshCore Canada infrastructure administrators",
    "Collection, access, and retention",
    "public retention period has not yet been published",
    "Never include in public diagnostics",
  ]) {
    assert.match(source, new RegExp(phrase, "i"));
  }
});

test("verification distinguishes connectivity from an observed packet", () => {
  const source = read("docs/analyzer/verify.md");
  assert.match(source, /broker connection proves only/i);
  assert.match(source, /Follow a packet through four stages/);
  for (const stage of ["Radio:", "Observer:", "Observer view:", "Packet view:"]) {
    assert.match(source, new RegExp(stage));
  }
  assert.match(source, /first thing that failed/i);
});

test("troubleshooting starts with symptoms and defines a safe support note", () => {
  const source = read("docs/analyzer/troubleshooting.md");
  for (const symptom of [
    "Observer never appears",
    "Observer appears but no packets arrive",
    "Only the backup connection fails",
    "Observer appears in the wrong place",
    "Observer connects and disconnects repeatedly",
  ]) {
    assert.match(source, new RegExp(`## ${symptom}`));
  }
  assert.match(source, /What to share when asking for help/);
  for (const secret of ["Wi-Fi SSID and password", "JWTs", "private keys", "authorization headers"]) {
    assert.match(source, new RegExp(secret, "i"));
  }
});

test("canonical observer configuration is redundant, encrypted, and self-consistent", () => {
  const config = JSON.parse(read("docs/analyzer/observer-config.json"));
  assert.equal(config.schema_version, 1);
  assert.equal(config.brokers.length, 2);
  assert.deepEqual(config.brokers.map((broker) => broker.id), ["primary", "backup"]);
  for (const broker of config.brokers) {
    assert.equal(broker.port, 443);
    assert.equal(broker.transport, "websockets");
    assert.equal(broker.tls, true);
    assert.equal(broker.verify_tls, true);
    assert.equal(broker.token_audience, broker.host);
  }
  assert.equal(config.network.path_hash_bytes, 3);
  assert.equal(config.location_codes, "location-codes.json");
});

test("location-code UI, builder, and host helpers share one validated quick list", () => {
  const data = JSON.parse(read("docs/analyzer/location-codes.json"));
  const codes = data.locations.map((location) => location.code);
  assert.equal(new Set(codes).size, codes.length, "location codes must be unique");
  assert.ok(codes.length >= 80);
  for (const code of codes) assert.match(code, /^[A-Z]{3}$/);
  assert.deepEqual(
    data.locations.find((location) => location.code === "YBC"),
    {code: "YBC", name: "Baie-Comeau", province: "Quebec", province_code: "QC"},
  );

  const bash = read("docs/analyzer/scripts/add-meshcore-ca-broker.sh");
  const bashCodes = [...bash.matchAll(/^[^|\r\n]+\|([A-Z]{3})\|/gm)].map((match) => match[1]);
  assert.deepEqual(new Set(bashCodes), new Set(codes));
  assert.match(bash, /\[ "\$IATA" = "CAN" \]/);

  const powershell = read("docs/analyzer/scripts/add-meshcore-ca-packetcapture-broker.ps1");
  const block = powershell.match(/\$KnownIataCodes = @\(([\s\S]*?)\n\)/)?.[1] || "";
  const powershellCodes = [...block.matchAll(/"([A-Z]{3})"/g)].map((match) => match[1]);
  assert.deepEqual(new Set(powershellCodes), new Set(codes));
  assert.match(powershell, /\$candidate -eq "CAN"/);

  const locationPage = read("docs/analyzer/iata-codes.md");
  assert.match(locationPage, /data-source="\.\.\/location-codes\.json"/);
  assert.match(locationPage, /analyzer-location-codes\.js/);

  const firmwarePage = read("docs/analyzer/builds/mqtt-firmware.md");
  assert.match(firmwarePage, /data-location-source="\.\.\/\.\.\/location-codes\.json"/);
});

test("standalone builder is external, fail-closed, redacted, and non-persistent", () => {
  const page = read("docs/analyzer/builds/mqtt-firmware.md");
  const script = read("docs/assets/javascripts/analyzer-command-builder.js");

  assert.doesNotMatch(page, /<style>|<script>/);
  assert.match(page, /page_scripts:\n  - assets\/javascripts\/analyzer-command-builder\.js/);
  assert.match(page, /type="password"/);
  assert.doesNotMatch(page.match(/<input id="observer-ssid"[^>]*>/)?.[0] || "", /\svalue=/);
  assert.match(script, /safeCliToken/);
  assert.match(script, /set wifi\.ssid \[hidden\]/);
  assert.match(script, /set wifi\.pwd \[hidden\]/);
  assert.match(script, /window\.addEventListener\("pagehide"/);
  assert.match(script, /navigator\.clipboard\.writeText\(exactCommands\.join/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotThrow(() => new Function(script));
});

test("review-first host setup precedes remote execution and includes rollback", () => {
  const source = read("docs/analyzer/builds/mctomqtt.md");
  const review = source.indexOf("### 1. Download and inspect the helper");
  const oneLiner = source.indexOf("bash <(curl -fsSL");
  assert.ok(review >= 0 && oneLiner > review);
  assert.match(source, /not pinned|pinned release checksum/i);
  assert.match(source, /--no-restart.*not a dry run/i);
  assert.match(source, /\.bak\.<timestamp>/);
  assert.match(source, /## Recovery/);
});

test("relative Markdown links in Analyzer pages resolve to source files", () => {
  for (const path of pages) {
    const source = read(path);
    const directory = dirname(resolve(root, path));
    const pattern = /\[[^\]]+\]\(([^)]+)\)/g;

    for (const match of source.matchAll(pattern)) {
      const destination = match[1].split("#", 1)[0].split("?", 1)[0];
      if (
        !destination ||
        destination.startsWith("http://") ||
        destination.startsWith("https://") ||
        destination.startsWith("mailto:")
      ) {
        continue;
      }

      assert.ok(
        existsSync(resolve(directory, destination)),
        `${path} links to missing source ${destination}`,
      );
    }
  }
});
