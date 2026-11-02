import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

vm.runInThisContext(read("docs/assets/setup/setup-text.js"), { filename: "setup-text.js" });
const text = globalThis.MeshCoreSetupText;

const pages = { en: "docs/config/guide.md", fr: "docs/config/guide.fr.md" };

// The sections the setup tool's "?" help and the region map link to. Both languages keep these ids.
const anchors = [
  "what-a-repeater-is",
  "repeater-observers",
  "scopes-and-regions",
  "settings",
  "city-or-edge",
  "companions",
  "starter-regions",
  "planning-extensions",
  "back-up",
  "old-regions",
  "older-firmware",
];

// The values the page's "What each setting does" examples use: a Belleville repeater in ytr (Quinte West),
// with BC Mesh as the example of a local group's own radio settings.
const examples = {
  en: {
    town: "Belleville",
    tag: "ytr",
    name: "Quinte West (ytr)",
    list: "Quinte West (ytr), Ontario (on), Ontario + Québec (onqc), Canada (can) and North America (na)",
    profile: "BC Mesh",
    settings: text.t("radio.settings", "en", { mhz: "910.425", khz: "62.5", sf: 7, cr: 5 }),
  },
  fr: {
    town: "Belleville",
    tag: "ytr",
    name: "Quinte West (ytr)",
    list: "Quinte West (ytr), Ontario (on), Ontario + Québec (onqc), Canada (can) et Amérique du Nord (na)",
    profile: "BC Mesh",
    settings: text.t("radio.settings", "fr", { mhz: "910,425", khz: "62,5", sf: 7, cr: 5 }),
  },
};
// why.remove names an old region from a pasted `region` reply (the tool's example reply ends in ott).
const exampleOverrides = { "why.remove": { name: "ott" } };

const coreSentence = {
  en: "A scope is a label on a message saying how far it should travel. A region list is the labels a repeater agrees to pass on.",
  fr: "Une portée est une étiquette sur un message qui indique jusqu’où il doit aller. Une liste de régions, ce sont les étiquettes qu’un répéteur accepte de relayer.",
};

function frontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "page must start with YAML front matter");
  return match[1];
}

// Page text with its front matter removed and every run of whitespace made one space, so wrapped lines still match.
function flat(source) {
  return source.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/\s+/g, " ");
}

const sentences = (value) => value.split(/(?<=[.!?])\s+/).filter(Boolean);

test("both explainer pages exist with verified front matter", () => {
  for (const [lang, path] of Object.entries(pages)) {
    assert.ok(existsSync(resolve(root, path)), `${path} must exist`);
    const metadata = frontMatter(read(path));
    assert.match(metadata, /^status: verified$/m, path);
    assert.match(metadata, /^evidence: tests\/content\/setup-guide\.test\.mjs$/m, path);
    assert.match(metadata, lang === "en" ? /^title: How repeaters work$/m : /^title: Comprendre les répéteurs$/m, path);
    assert.equal((read(path).match(/^# /gm) || []).length, 1, `${path} has one H1`);
  }
});

test("every section the tool links to is on both pages, with the same ids", () => {
  for (const path of Object.values(pages)) {
    const source = read(path);
    for (const id of anchors) {
      assert.match(source, new RegExp(`^#{2,3} .+\\{ ?#${id} ?\\}$`, "m"), `${path} needs #${id}`);
    }
  }
});

test("every guide link in the tool points at a section both pages have", () => {
  const ui = read("docs/assets/setup/setup-ui.js");
  const used = [...ui.matchAll(/anchor: "([a-z-]+)"|LINKS\.guide \+ "#([a-z-]+)"/g)].map((match) => match[1] || match[2]);
  assert.ok(used.length >= 12, `expected the tool's guide links, found ${used.length}`);
  for (const id of used) assert.ok(anchors.includes(id), `#${id} belongs in the list of sections the tool links to`);
});

test("the back-up advice says how to save the private key (app or USB) and put it back, in the tool and on the guide", () => {
  // The key comes off and goes back two ways: the app's Command Line after an admin login, or USB (the flasher's Console).
  const app = { en: /MeshCore app[^.]*log in[^.]*Command Line[^.]*`get prv\.key`/, fr: /application MeshCore[^.]*connectez-vous[^.]*Command Line[^.]*`get prv\.key`/ };
  const keep = { en: /password manager and never paste it anywhere shared/, fr: /gestionnaire de mots de passe et ne la collez jamais dans un endroit partagé/ };
  // The restore advice starts here; the tool and the guide carry it word for word.
  const restoreStart = { en: "Right after flashing", fr: "Juste après la programmation" };
  const putBack = {
    en: /^Right after flashing, while it's still plugged in, send `set prv\.key <saved key>` in the flasher's Console, then `reboot`\. Put the key you saved in place of `<saved key>`\. You can also do it later from the app's Command Line if you can log in as admin; if you can't, plug it in by USB and use the flasher's Console\./,
    fr: /^Juste après la programmation, tant qu’il est encore branché, envoyez `set prv\.key <clé sauvegardée>` dans la Console de l’outil de programmation, puis `reboot`\. Remplacez `<clé sauvegardée>` par la clé que vous avez sauvegardée\. Vous pouvez aussi le faire plus tard dans la Command Line de l’application si vous pouvez vous connecter comme administrateur ; sinon, branchez-le par USB et utilisez la Console de l’outil de programmation\./,
  };
  const restoreOf = (string, lang) => string.slice(string.indexOf(restoreStart[lang]));
  for (const lang of ["en", "fr"]) {
    for (const key of ["status.backup", "observerFirmware.switch"]) {
      const string = text.t(key, lang);
      assert.match(string, app[lang], `${lang} ${key}: save the key from the app`);
      assert.match(string, /USB/, `${lang} ${key}: save the key over USB`);
      assert.match(string, /Console/, `${lang} ${key}: ...in the flasher's Console`);
      assert.match(string, keep[lang], `${lang} ${key}: where to keep it, and not where to paste it`);
    }
    const restore = text.t("observerFirmware.switch", lang);
    assert.ok(restore.includes(restoreStart[lang]), `${lang} observerFirmware.switch says how to put the key back`);
    assert.match(restoreOf(restore, lang), putBack[lang], `${lang} observerFirmware.switch: the key goes back from the Console, or later from the app`);
  }
  for (const [lang, path] of Object.entries(pages)) {
    const source = read(path);
    // The page wraps its lines; the tool's strings don't.
    const section = source.slice(source.search(/\{ ?#back-up ?\}/), source.search(/\{ ?#old-regions ?\}/)).replace(/\s+/g, " ");
    assert.ok(section.length > 200, `${path} needs a back-up section before the old regions`);
    assert.match(section, /`get prv\.key`/, path);
    // Step 2 itself carries both ways, so the restore paragraph can't stand in for it.
    const step2 = section.slice(section.indexOf("2. "), section.indexOf("3. "));
    assert.match(step2, app[lang], `${path}: step 2 saves the key from the app`);
    assert.match(step2, /USB/, `${path}: step 2 saves the key over USB`);
    assert.match(step2, /Console/, `${path}: step 2 names the flasher's Console`);
    assert.match(step2, keep[lang], `${path}: same keep-it-safe advice as the tool`);
    const restore = restoreOf(text.t("observerFirmware.switch", lang), lang);
    assert.ok(section.includes(restore), `${path}: the restore advice is the tool's, word for word`);
    assert.match(section, /docs\.meshcore\.io\/cli_commands\/#view-or-change-this-nodes-identity-private-key/, path);
  }
});

test("the pages say what a scope and a region list are in the same words", () => {
  for (const [lang, path] of Object.entries(pages)) {
    assert.ok(flat(read(path)).includes(coreSentence[lang]), `${path} needs the core sentence`);
  }
});

test("every command explanation in the tool appears on the page, word for word", () => {
  const keys = text.keys().filter((key) => key.startsWith("why."));
  assert.ok(keys.length >= 38, `expected the tool's command explanations, found ${keys.length}`);
  for (const [lang, path] of Object.entries(pages)) {
    const page = flat(read(path));
    for (const key of keys) {
      const expected = text.t(key, lang, { ...examples[lang], ...exampleOverrides[key] });
      assert.doesNotMatch(expected, /\{[A-Za-z][\w-]*\}/, `${key} has a placeholder with no example value`);
      assert.ok(page.includes(expected), `${path} is missing ${key}: ${expected}`);
    }
  }
});

test("the page answers the tool's questions in the tool's own words", () => {
  for (const [lang, path] of Object.entries(pages)) {
    const page = flat(read(path));
    for (const key of ["type.help", "repeat.help", "role.help", "crossborder.hint", "region.errors", "region.phone-cut"]) {
      for (const sentence of sentences(text.t(key, lang))) {
        assert.ok(page.includes(sentence), `${path} is missing ${key}: ${sentence}`);
      }
    }
  }
});

test("the pages set scopes now: no phase, preparation or activation wording", () => {
  for (const path of Object.values(pages)) {
    const source = read(path);
    assert.doesNotMatch(source, /phase/i, path);
    assert.doesNotMatch(source, /pr[ée]par/i, path);
    assert.doesNotMatch(source, /activat/i, path);
    assert.doesNotMatch(source, /January 2027|janvier 2027|proposals\/onqc-scopes/, path);
  }
});

test("the region standard page is gone and its old addresses lead to the explainer", () => {
  for (const path of ["docs/config/standard.md", "docs/config/standard.fr.md"]) {
    assert.equal(existsSync(resolve(root, path)), false, `${path} must be removed`);
  }
  const config = read("mkdocs.yml");
  assert.match(config, /^ {8}config\/standard\.md: config\/guide\.md$/m);
  assert.match(config, /^ {8}regions\/standard\.md: config\/guide\.md$/m, "the old regions link must not chain through a redirect");
  assert.doesNotMatch(config, /: config\/standard(\.fr)?\.md$/m, "no redirect may point at the removed page");
  assert.match(config, /^ {6}- How repeaters work: config\/guide\.md$/m);
  assert.match(config, /^ {12}How repeaters work: Comprendre les répéteurs$/m);
});

test("no page or script still links to the region standard", () => {
  const sources = [
    "docs/config/index.md", "docs/config/index.fr.md", "docs/config/map.md", "docs/config/map.fr.md",
    "docs/config/editor/index.md", "docs/config/editor/index.fr.md", "docs/meshcore/general-faq.md",
    "docs/meshcore/general-faq.fr.md", "docs/resources/glossary.md", "docs/resources/glossary.fr.md",
    "docs/start/companion.md", "docs/start/companion.fr.md", "docs/start/repeater.md", "docs/start/repeater.fr.md",
    "docs/assets/regions/regions.js",
  ];
  for (const path of sources) {
    const source = read(path);
    assert.doesNotMatch(source, /standard\.md|"standard\/"|regionPageHref\("standard"\)/, path);
    assert.doesNotMatch(source, /[Rr]egion standard|[Nn]orme (sur les|des) régions/, path);
  }
});

test("the observer settings heading uses the tool's device name, never just Observer", () => {
  for (const [lang, path] of Object.entries(pages)) {
    const heading = text.t("group.observer", lang);
    assert.equal(heading, text.t("type.observer", lang), "the tool's group and its device choice use one name");
    assert.match(read(path), new RegExp(`^### ${heading}$`, "m"), `${path} needs the ${heading} heading`);
    assert.doesNotMatch(read(path), /^### (Observer|Observateur)$/m, path);
  }
});

test("MeshMapper is explained where the page first mentions it", () => {
  const explained = { en: /community map/, fr: /carte communautaire/ };
  for (const [lang, path] of Object.entries(pages)) {
    const body = flat(read(path));
    const first = body.indexOf("MeshMapper");
    assert.ok(first >= 0, path);
    assert.match(body.slice(first, first + 160), explained[lang], `${path}: explain MeshMapper at its first use`);
  }
});

test("the French page avoids the phrasings the review flagged", () => {
  const source = read(pages.fr);
  for (const bad of ["Il n’y a ni accent ni majuscule", "La plupart du Canada", "à part entière", "Quelques détails piègent", "Données des régions"]) {
    assert.ok(!flat(source).includes(bad), `guide.fr.md should not say: ${bad}`);
  }
});
