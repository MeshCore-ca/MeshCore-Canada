import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const script = readFileSync("docs/assets/javascripts/repeater-hash-check.js", "utf8");
const context = vm.createContext({
  AbortController,
  Intl,
  URL,
  clearTimeout,
  setTimeout
});
vm.runInContext(script, context);
const checker = context.MeshCoreRepeaterHashCheck;

const fullKey = "05DE00" + "11".repeat(29);
const node = (publicKey, iatas, extra = {}) => ({
  publicKey,
  name: extra.name || publicKey.slice(0, 6),
  nodeTypeName: "repeater",
  iatas: iatas.map(([iata, lastHeard]) => ({ iata, lastHeard })),
  ...extra
});

test("validates MeshCore public keys and the selected byte length", () => {
  assert.deepEqual(
    { ...checker.normalizeKey("0x05:de-00 11") },
    { error: "", hex: "05DE0011", full: false }
  );
  assert.equal(checker.validateKey("05DE", 3).error, "shortKey");
  assert.equal(checker.validateKey("05D", 1).error, "oddKey");
  assert.equal(checker.validateKey("not-a-key", 1).error, "invalidKey");
  assert.equal(checker.validateKey(fullKey, 3).prefix, "05DE00");
});

test("compares 1-, 2-, and 3-byte IDs without counting the entered full key as its own conflict", () => {
  const nodes = [
    node(fullKey, [["YYZ", 400]]),
    node("05AA00" + "22".repeat(29), [["YYZ", 300]]),
    node("05DEFF" + "33".repeat(29), [["YYZ", 200]]),
    node("05DE00" + "44".repeat(29), [["YVR", 100]])
  ];
  const summaries = checker.summarize(nodes, fullKey, "YYZ");
  assert.deepEqual(
    JSON.parse(JSON.stringify(summaries.map(({ bytes, prefix, localCount, networkCount }) => ({ bytes, prefix, localCount, networkCount })))),
    [
      { bytes: 1, prefix: "05", localCount: 2, networkCount: 3 },
      { bytes: 2, prefix: "05DE", localCount: 1, networkCount: 2 },
      { bytes: 3, prefix: "05DE00", localCount: 0, networkCount: 1 }
    ]
  );
  assert.equal(summaries[2].own.length, 1);
});

test("paginates the Beacon prefix lookup and rejects an unfiltered response", async () => {
  const urls = [];
  const matching = node("05AA" + "55".repeat(30), [["YYZ", 1]]);
  const fetched = await checker.fetchMatchingNodes("05", {
    fetchImpl: async (url) => {
      urls.push(new URL(url));
      return urls.length === 1
        ? { ok: true, json: async () => ({ items: [matching], hasMore: true, nextCursor: 123 }) }
        : { ok: true, json: async () => ({ items: [matching], hasMore: false }) };
    }
  });
  assert.equal(fetched.length, 1);
  assert.equal(urls[0].searchParams.get("typeName"), "repeater");
  assert.equal(urls[0].searchParams.get("pubkeyPrefix"), "05");
  assert.equal(urls[1].searchParams.get("cursor"), "123");

  await assert.rejects(checker.fetchMatchingNodes("05", {
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ items: [node("99AA" + "66".repeat(30), [["YYZ", 1]])], hasMore: false })
    })
  }), /did not apply/);
});

test("loads one shared checker only on English and French repeater ID workflows", () => {
  const pages = [
    "docs/start/repeater.md",
    "docs/start/repeater.fr.md",
    "docs/meshcore/generate-repeater-id.md",
    "docs/meshcore/generate-repeater-id.fr.md"
  ];
  pages.forEach((path) => {
    const markdown = readFileSync(path, "utf8");
    assert.match(markdown, /assets\/javascripts\/repeater-hash-check\.js/);
    assert.match(markdown, /assets\/styles\/repeater-hash-check\.css/);
    assert.match(markdown, /data-mc-repeater-hash-check/);
  });

  for (const path of ["docs/config/index.md", "docs/config/index.fr.md"]) {
    const markdown = readFileSync(path, "utf8");
    assert.doesNotMatch(markdown, /repeater-hash-check|data-mc-repeater-hash-check/);
  }

  const css = readFileSync("docs/assets/styles/repeater-hash-check.css", "utf8");
  assert.match(css, /@media \(max-width: 46rem\)/);
  assert.match(css, /content: attr\(data-label\)/);
  assert.match(css, /\[data-mc-repeater-hash-check\]:empty[\s\S]*min-height/);
  assert.match(script, /mc-hash-disclosure/);
  assert.match(script, /Duplicate repeater ID check \(optional\)/);
  assert.match(script, /regionInput\.addEventListener\("focus", loadIatas/);
  assert.doesNotMatch(script, /privateKey|prv\.key[^"']*fetch/i);
});
