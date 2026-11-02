import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import "../../docs/assets/regions/modules/iata-scopes.js";

// A classic browser script: run it in this realm so it sets its global. There is no document here,
// so the script must not try to draw anything.
vm.runInThisContext(readFileSync("docs/assets/setup/scope-demo.js", "utf8"), { filename: "scope-demo.js" });
const demo = globalThis.MeshCoreScopeDemo;

// The demo is given only the catalogue, the same shape as the setup tool's data minus the boundaries.
const data = { catalog: JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8")) };

const passing = (label) => demo.reach(label, data).filter((row) => row.passes).map((row) => row.town);
const ALL = ["Belleville", "Kingston", "Ottawa", "Gatineau", "Montréal", "Toronto"];

test("reach() covers the six example towns, each with its city repeater's region", () => {
  assert.deepEqual(
    demo.reach("ytr", data).map((row) => [row.town, row.tag]),
    [["Belleville", "ytr"], ["Kingston", "ygk"], ["Ottawa", "yow"], ["Gatineau", "yow"], ["Montréal", "yul"], ["Toronto", "yyz"]]
  );
  for (const row of demo.reach("ytr", data)) {
    assert.deepEqual(Object.keys(row).sort(), ["passes", "tag", "town"]);
    assert.equal(typeof row.passes, "boolean");
  }
});

test("a region label is passed on only in its own region", () => {
  assert.deepEqual(passing("ytr"), ["Belleville"]);
  assert.deepEqual(passing("ygk"), ["Kingston"]);
  // yow crosses the Ottawa River, so both towns have it.
  assert.deepEqual(passing("yow"), ["Ottawa", "Gatineau"]);
});

test("a province label is passed on by that province's towns only", () => {
  assert.deepEqual(passing("on"), ["Belleville", "Kingston", "Ottawa", "Toronto"]);
  assert.deepEqual(passing("qc"), ["Gatineau", "Montréal"]);
});

test("onqc, can and no label reach every town", () => {
  assert.deepEqual(passing("onqc"), ALL);
  assert.deepEqual(passing("can"), ALL);
  assert.deepEqual(passing("*"), ALL, "city repeaters pass on messages with no label");
});

test("a label nobody has is passed on by no one, and labels are read case-insensitively", () => {
  assert.deepEqual(passing("zzz"), []);
  assert.deepEqual(passing(" YTR "), ["Belleville"]);
});

test("reach() says plainly when it has no catalogue to work from", () => {
  assert.throws(() => demo.reach("ytr"), /catalogue/i);
  assert.throws(() => demo.reach("ytr", {}), /catalogue/i);
});

test("the demo's English and French strings cover the same keys, with the labels it offers", () => {
  const { en, fr } = demo.text;
  assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en)) {
    assert.ok(en[key].trim() && fr[key].trim(), key);
    // A French sentence that is word for word the English one was almost certainly not translated.
    // The short region and province names, which are the same in both languages, are the exception.
    if (!key.startsWith("label.")) assert.notEqual(fr[key], en[key], key);
  }
  assert.deepEqual(demo.labels, ["ytr", "on", "onqc", "can", "*"]);
  for (const label of demo.labels) {
    for (const lang of ["en", "fr"]) {
      assert.ok(demo.text[lang]["label." + label], `${lang} needs a description for ${label}`);
      assert.ok(demo.text[lang]["reason." + label], `${lang} needs a sentence for ${label}`);
    }
  }
  assert.match(en["verdict.yes"], /passes it on/i);
  assert.match(en["verdict.no"], /doesn.t pass it on/i);
  assert.match(fr["verdict.yes"], /le relaie/i);
  assert.match(fr["verdict.no"], /ne le relaie pas/i);
});

test("the page says label and pass it on, in French étiquette and relayer", () => {
  const { en, fr } = demo.text;
  const joined = (table) => Object.values(table).join(" ");
  assert.match(joined(en), /\blabel/i);
  assert.match(joined(fr), /étiquette/i);
  assert.match(joined(fr), /relai/i);
  assert.doesNotMatch(joined(fr), /\bscope\b|\bforward/i);
  assert.doesNotMatch(joined(en), /\bforward/i);
});

// ---- The guide pages ----

const pages = { en: "docs/config/guide.md", fr: "docs/config/guide.fr.md" };
const read = (path) => readFileSync(path, "utf8");
const section = (source) => {
  const start = source.search(/^## .*\{ ?#scopes-and-regions ?\}$/m);
  assert.ok(start >= 0, "scopes section");
  const rest = source.slice(start + 1);
  const end = rest.search(/^## /m);
  return rest.slice(0, end < 0 ? undefined : end);
};
const frontMatter = (source) => source.match(/^---\n([\s\S]*?)\n---\n/)[1];

test("both guide pages mount the demo once, inside the scopes section", () => {
  for (const path of Object.values(pages)) {
    const source = read(path);
    assert.equal((source.match(/<div data-scope-demo><\/div>/g) || []).length, 1, path);
    assert.ok(section(source).includes("<div data-scope-demo></div>"), `${path}: the mount belongs in #scopes-and-regions`);
    assert.match(section(source), /<noscript>/, `${path}: say what is missing without JavaScript`);
  }
});

test("both guide pages load only the scripts the demo needs, in order, with cache keys", () => {
  for (const path of Object.values(pages)) {
    const meta = frontMatter(read(path));
    const scripts = [...meta.matchAll(/^ {2}- (assets\/\S+\.js\?v=\d{8}-\d+)$/gm)].map((match) => match[1]);
    assert.ok(/^page_scripts:$/m.test(meta), path);
    assert.deepEqual(
      scripts.map((src) => src.replace(/\?v=.*/, "")),
      ["assets/regions/modules/iata-scopes.js", "assets/setup/scope-demo.js"],
      `${path}: no setup-place.js, which would download the boundaries too`
    );
    assert.match(meta, /^page_styles:\n {2}- assets\/setup\/scope-demo\.css\?v=\d{8}-\d+$/m, path);
  }
});

test("the demo fetches the catalogue only, relative to its own script", () => {
  const source = read("docs/assets/setup/scope-demo.js");
  assert.match(source, /iata-regions\.json/);
  assert.doesNotMatch(source, /geojson|loadData|MeshCoreSetupPlace|radio-profiles/);
  assert.doesNotMatch(source, /<script|innerHTML/, "no markup built from strings");
});
