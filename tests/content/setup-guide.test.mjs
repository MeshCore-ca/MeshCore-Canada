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

test("the guide says `clock sync` is sent from the app and doesn't work from the Console", () => {
  // Serial passes no sender time, so the firmware always answers "clock cannot go backwards" over USB.
  const words = {
    en: /`clock sync`[^.]*\. Send it from the MeshCore app\. It doesn't work from the Console/,
    fr: /`clock sync`[^.]*\. Envoyez-la depuis l’application MeshCore\. Elle ne fonctionne pas depuis la Console/,
  };
  for (const [lang, path] of Object.entries(pages)) {
    const page = flat(read(path));
    // The paragraph after `reboot`, before the loop detection section.
    const finish = page.slice(page.indexOf("`reboot`"), page.search(/\{ ?#loop-detection ?\}/));
    assert.ok(finish.length > 100, path);
    assert.match(finish, words[lang], path);
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

test("the board step asks what kind of board it is, with examples and a way to check, in both languages", () => {
  const words = {
    en: {
      question: "What kind of board is it?",
      nrf52: ["nRF52", "Low power, good for solar.", "For example RAK4631 (WisBlock), Heltec T114, LilyGO T-Echo, Seeed XIAO nRF52840."],
      esp32: ["ESP32", "Has Wi-Fi. A repeater observer needs one.", "For example Heltec V3 or V4, LilyGO T-Beam, Seeed XIAO ESP32-S3."],
      hint: "Not sure? Find your board in the {link}: its list shows which kind it is.",
    },
    fr: {
      question: "Quel type de carte est-ce?",
      nrf52: ["nRF52", "Faible consommation, idéale pour l’énergie solaire.", "Par exemple RAK4631 (WisBlock), Heltec T114, LilyGO T-Echo, Seeed XIAO nRF52840."],
      esp32: ["ESP32", "Dispose du Wi-Fi. Un répéteur observateur en a besoin.", "Par exemple Heltec V3 ou V4, LilyGO T-Beam, Seeed XIAO ESP32-S3."],
      hint: "Un doute? Cherchez votre carte dans l’{link} : sa liste indique de quel type elle est.",
    },
  };
  for (const lang of ["en", "fr"]) {
    const expected = words[lang];
    assert.equal(text.t("board.question", lang), expected.question, lang);
    for (const kind of ["nrf52", "esp32"]) {
      const [name, detail, examples] = expected[kind];
      assert.equal(text.t(`board.${kind}`, lang), name, `${lang} ${kind}`);
      assert.equal(text.t(`board.${kind}.detail`, lang), detail, `${lang} ${kind}`);
      assert.equal(text.t(`board.${kind}.examples`, lang), examples, `${lang} ${kind}`);
    }
    assert.equal(text.t("board.hint", lang), expected.hint, lang);
    assert.ok(text.t("board.hint.link", lang).length > 0, `${lang}: the hint's link has words`);
    // The "?" help and the observer notes stay.
    for (const key of ["board.help", "board.observer-nrf52", "board.as-repeater", "board.no-wifi.detail", "board.other-observer", "board.nrf52-next"]) {
      assert.ok(text.t(key, lang).length > 0, `${lang} ${key}`);
    }
  }
  // The grouped list of boards is gone, and no step names a board any more.
  for (const key of ["board.group.nrf52", "board.group.esp32", "board.other", "board.your-board"]) {
    assert.throws(() => text.t(key, "en"), /Missing setup text/, key);
    assert.throws(() => text.t(key, "fr"), /Missing setup text/, key);
  }
  for (const lang of ["en", "fr"]) {
    for (const key of ["bootloader.step1", "flash.repeater.step2", "flash.observer.step2"]) {
      assert.doesNotMatch(text.t(key, lang), /\{board\}/, `${lang} ${key} needs no board name`);
    }
    assert.match(text.t("flash.repeater.step2", lang), lang === "en" ? /^Choose your board, role Repeater, and the newest version\.$/ : /^Choisissez votre carte, le rôle Repeater et la version la plus récente\.$/);
    assert.match(text.t("flash.observer.step2", lang), lang === "en" ? /^Under MQTT Observer Firmware, choose your board and role Repeater\.$/ : /^Sous MQTT Observer Firmware, choisissez votre carte et le rôle Repeater\.$/);
    assert.match(text.t("bootloader.step1", lang), lang === "en" ? /^Download the `update-…uf2` file for your board from the \{link\}\. Its name includes the board's name\.$/ : /^Téléchargez, depuis les \{link\}, le fichier `update-…uf2` de votre carte\. Son nom contient le nom de la carte\.$/);
    assert.ok(text.t("bootloader.mismatch", lang).length > 0);
  }
  const ui = read("docs/assets/setup/setup-ui.js");
  assert.doesNotMatch(ui, /Flow\.BOARDS|boardLabel|boardName|setup-group-label|board\.group/, "the screen draws two cards, not a list of boards");
  assert.doesNotMatch(read("docs/assets/setup/setup.css"), /setup-group-label/);
  assert.match(ui, /"board\.hint", null, LINKS\.flasher/, "the hint links to the flasher the tool already uses");
  // Pages that sent people to the old "My board isn't listed" choice now name the ESP32 choice.
  for (const [path, words] of [["docs/hardware/station-g3.md", "choose **ESP32** when it asks what kind of board it is"], ["docs/hardware/station-g3.fr.md", "choisissez **ESP32** quand il demande le type de carte"]]) {
    assert.ok(read(path).includes(words), path);
    assert.doesNotMatch(read(path), /My board isn't listed|Ma carte n’est pas dans la liste/, path);
  }
});

test("under the tool there is only the region data credit, linked to the notice", () => {
  const credit = { "docs/config/index.md": "Region data: sources and licences", "docs/config/index.fr.md": "Données des régions : sources et licences" };
  for (const [path, words] of Object.entries(credit)) {
    const small = read(path).match(/<small>[\s\S]*?<\/small>/g);
    assert.deepEqual(small, [`<small>[${words}](../assets/regions/NOTICE.txt)</small>`], path);
    // The guide is in the nav and every "?" links to it; the page's feedback block follows the tool.
    assert.doesNotMatch(read(path).replace(/<noscript>[\s\S]*?<\/noscript>/, ""), /\]\(guide\.md\)|forum\.meshcore\.ca/, path);
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

test("the glossary points at the setup tool and defines the scope terms in the explainer's words", () => {
  const glossaries = { en: "docs/resources/glossary.md", fr: "docs/resources/glossary.fr.md" };
  // The new entries (term, then the explainer section the entry links to), Scope and Region first.
  const entries = {
    en: [
      ["Scope", "scopes-and-regions"],
      ["Region", "scopes-and-regions"],
      ["Repeater observer", "repeater-observers"],
      ["City repeater", "city-or-edge"],
      ["Edge repeater", "city-or-edge"],
    ],
    fr: [
      ["Portée", "scopes-and-regions"],
      ["Région", "scopes-and-regions"],
      ["Répéteur observateur", "repeater-observers"],
      ["Répéteur de ville", "city-or-edge"],
      ["Répéteur de bordure", "city-or-edge"],
    ],
  };
  // What each new entry says before its "See ..." link, pinned so a wording change is deliberate.
  const wording = {
    en: {
      "Scope": "A scope is a label on a message saying how far it should travel. You set a default on your companion, and a channel can have its own.",
      "Region": "The area a repeater serves, named after the nearest airport code. A region list is the labels a repeater agrees to pass on.",
      "Repeater observer": "A repeater that also reports what it hears to live.meshcore.ca, so everyone can see how the mesh is doing. It needs Wi-Fi, so it needs an ESP32 board.",
      "City repeater": "A repeater that passes on messages with no label, so people nearby who haven't set a scope are still heard. Every repeater that isn't an edge repeater is a city repeater.",
      "Edge repeater": "A repeater that regularly hears repeaters in another region, for example one between Belleville and Kingston. It doesn't pass on messages with no label, so they don't spill into the next region.",
    },
    fr: {
      "Portée": "Une portée est une étiquette sur un message qui indique jusqu’où il doit aller. Vous réglez une portée par défaut sur votre appareil compagnon, et chaque canal peut avoir la sienne.",
      "Région": "Le secteur que dessert un répéteur, nommé d’après le code d’aéroport le plus proche. Une liste de régions, ce sont les étiquettes qu’un répéteur accepte de relayer.",
      "Répéteur observateur": "Un répéteur qui rapporte aussi ce qu’il entend à live.meshcore.ca, pour que tout le monde puisse voir l’état du réseau. Il lui faut le Wi-Fi, donc une carte ESP32.",
      "Répéteur de ville": "Un répéteur qui relaie les messages sans étiquette, pour que les gens des environs qui n’ont pas réglé de portée soient quand même entendus. Tout répéteur qui n’est pas de bordure est un répéteur de ville.",
      "Répéteur de bordure": "Un répéteur qui entend régulièrement des répéteurs d’une autre région, par exemple entre Belleville et Kingston. Il ne relaie pas les messages sans étiquette, pour qu’ils ne débordent pas dans la région voisine.",
    },
  };
  // A definition-list entry: the bold term (with an optional English name in brackets), then its indented lines.
  const entryOf = (source, term) => source.match(new RegExp(`^\\*\\*${term}(?: \\([^)]*\\))?\\*\\*\n((?::   .*\n?|    .*\n?)+)`, "m"))?.[1];
  for (const [lang, path] of Object.entries(glossaries)) {
    const source = read(path);
    assert.doesNotMatch(source, /configurator|configurateur/i, `${path} should name the setup tool`);
    assert.match(source, /\]\(\.\.\/config\/index\.md\)/, `${path} links to the setup tool`);
    for (const [term, anchor] of entries[lang]) {
      const entry = entryOf(source, term);
      assert.ok(entry, `${path} needs an entry for ${term}`);
      assert.ok(entry.includes(`](../config/guide.md#${anchor})`), `${path}: ${term} links to #${anchor}`);
      assert.ok(flat(entry).replace(/^:\s*/, "").startsWith(`${wording[lang][term]} ${lang === "en" ? "See" : "Voir"} [`), `${path}: ${term} says "${wording[lang][term]}"`);
    }
    // Scope carries the explainer's first sentence and Region its second, word for word.
    const [scopeSentence, regionSentence] = sentences(coreSentence[lang]);
    assert.ok(flat(entryOf(source, entries[lang][0][0])).includes(scopeSentence), `${path}: Scope says "${scopeSentence}"`);
    assert.ok(flat(entryOf(source, entries[lang][1][0])).includes(regionSentence), `${path}: Region says "${regionSentence}"`);
  }
});

// The "scope a channel" steps in the companion section, in the order the steps use them.
const channelShots = [
  "companion-07-channels.webp",
  "companion-13-testing-menu.webp",
  "companion-15-add-yow.webp",
  "companion-16-yow-added.webp",
  "companion-17-testing-scoped.webp",
];

test("the channel scope steps show each screenshot on both pages, as a link to the full-size file", () => {
  const alts = {};
  for (const [lang, path] of Object.entries(pages)) {
    const source = read(path);
    const section = source.slice(source.search(/\{ ?#companions ?\}/), source.search(/\{ ?#bots-and-meshmapper ?\}/));
    assert.ok(section.length > 500, `${path} needs the companion section before the bots section`);
    const shots = [...section.matchAll(/\[!\[([^\]]+)\]\(\.\.\/assets\/images\/onqc-scopes\/([^)\s]+)\)\{ loading=lazy width="300" height="652" \}\]\(\.\.\/assets\/images\/onqc-scopes\/([^)\s]+)\)/g)];
    assert.deepEqual(shots.map((shot) => shot[2]), channelShots, `${path}: the steps use these screenshots, in this order`);
    for (const [, alt, file, link] of shots) {
      assert.ok(alt.trim().length > 15, `${path}: ${file} needs alt text that says what it shows`);
      assert.equal(link, file, `${path}: ${file} links to its own full-size file`);
    }
    alts[lang] = shots.map((shot) => shot[1]);
  }
  // Each screenshot has its own French alt text, not the English one left in place.
  channelShots.forEach((file, index) => {
    assert.notEqual(alts.fr[index], alts.en[index], `${file}: the French alt text differs from the English`);
  });
});

test("every image the explainer pages show exists", () => {
  for (const path of Object.values(pages)) {
    const source = read(path);
    const images = [...source.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]);
    assert.ok(images.length >= channelShots.length, `${path} should show its screenshots`);
    for (const image of images) {
      assert.ok(!/^[a-z]+:/i.test(image), `${path}: ${image} should be a file on this site`);
      assert.ok(existsSync(resolve(root, dirname(path), image)), `${path}: ${image} is missing`);
    }
    // The links to full-size files point at real files too.
    for (const [, link] of source.matchAll(/\]\((\.\.\/assets\/images\/[^)\s]+)\)/g)) {
      assert.ok(existsSync(resolve(root, dirname(path), link)), `${path}: ${link} is missing`);
    }
  }
});

test("the privacy pages match the setup tool: one name for the place search, the real 10 minutes, no downloads", () => {
  const ui = read("docs/assets/setup/setup-ui.js");
  const minutes = Number(ui.match(/Date\.now\(\) - saved\.at < (\d+)\)/)?.[1]) / 60000;
  assert.equal(minutes, 10, "the language-switch hand-off is read for 10 minutes");
  const host = read("docs/assets/javascripts/place-search.js").match(/https:\/\/([a-z.]+)\/\?/)?.[1];
  assert.equal(host, "geolocator.api.geo.ca");
  const privacy = {
    en: { path: "docs/privacy.md", place: "Government of Canada’s place search (geo.ca)", old: /Downloaded setup summaries|Natural Resources Canada/ },
    fr: { path: "docs/privacy.fr.md", place: "outil de recherche de lieux du gouvernement du Canada (geo.ca)", old: /résumés téléchargés|Ressources naturelles Canada/ },
  };
  for (const [lang, { path, place, old }] of Object.entries(privacy)) {
    const source = read(path);
    assert.doesNotMatch(source, old, `${path}: the sentence about downloads and the other geocoder name are gone`);
    assert.ok(flat(source).includes(`${place}: \`${host}\``) || flat(source).includes(`${place} : \`${host}\``), `${path}: the setup tool row names the place search and ${host}`);
    // Every row that sends a place name to the geocoder uses the same name.
    const rows = source.split("\n").filter((line) => line.startsWith("|") && /geo\.ca|Géolocalisateur|Geolocator/.test(line));
    assert.equal(rows.length, 3, `${path}: three rows send a place to the geocoder`);
    for (const row of rows) assert.ok(row.includes(place), `${path}: ${row.slice(0, 50)} uses the tool's name for it`);
    assert.ok(flat(source).includes(`${minutes} minutes`), `${path}: says ${minutes} minutes`);
    // Expiry is checked only when the other page reads the entry, so the page must not say it is removed at 10 minutes.
    assert.doesNotMatch(flat(source), /(after|après) 10 minutes/, `${path}: the entry is ignored, not removed, after ${minutes} minutes`);
  }
});
