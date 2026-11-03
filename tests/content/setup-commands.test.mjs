import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { before, test } from "node:test";
import "../../docs/assets/regions/modules/iata-scopes.js";

// Classic browser scripts: run them in this realm so they set their globals.
for (const file of ["docs/assets/regions/modules/scope-migration.js", "docs/assets/setup/setup-flow.js",
  "docs/assets/setup/setup-place.js", "docs/assets/setup/setup-text.js", "docs/assets/setup/setup-commands.js"]) {
  vm.runInThisContext(readFileSync(file, "utf8"), { filename: file });
}
const cmds = globalThis.MeshCoreSetupCommands;
const text = globalThis.MeshCoreSetupText;

// Maps the site's /assets/... URLs to docs/assets/... on disk; the ?v= cache key is ignored.
async function fileFetcher(url) {
  const address = new URL(String(url));
  try {
    const body = await readFile("docs" + address.pathname, "utf8");
    return { ok: true, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, json: async () => { throw new Error("not found"); } };
  }
}

let data;
before(async () => {
  data = await globalThis.MeshCoreSetupPlace.loadData(new URL("https://meshcore.test/assets/setup/setup-commands.js"), fileFetcher);
});

const flat = groups => groups.flatMap(g => g.items.map(i => i.command));
const belleville = { type: "repeater", board: "nrf52", status: "new", place: { name: "Belleville", lat: 44.16281, lon: -77.38324 },
  tag: "ytr", province: "on", radio: "canada", role: "city", name: "Belleville_R1", shareLocation: true };
test("a new Belleville city repeater gets the full rollup", () => {
  assert.deepEqual(flat(cmds.rollup(belleville, data, "en")), ["set radio 910.525,62.5,7,5","set name Belleville_R1","set lat 44.1628","set lon -77.3832",
    "password <your new admin password>","set path.hash.mode 2","set advert.interval 240","set flood.advert.interval 47","set flood.max 16",
    "region def ytr|* on|* onqc|* can|* na","region allowf *","region default ytr","region save","reboot"]);
});
test("a running repeater keeps the name the person typed", () => {
  const running = { ...belleville, status: "running", reflash: false, firmware: "1.16", name: "Hilltop-Kingston", nameEdited: true };
  assert.ok(flat(cmds.rollup(running, data, "en")).includes("set name Hilltop-Kingston"));
  assert.equal(cmds.checks(running, data, "en").find((c) => c.id === "name").expect, "Should answer Hilltop-Kingston.");
});
test("a name with spaces and accents goes into set name as typed, with no quotes", () => {
  // The firmware takes the rest of the line as the name.
  const running = { ...belleville, status: "running", reflash: false, firmware: "1.16", name: "Café Hilltop", nameEdited: true };
  assert.ok(flat(cmds.rollup(running, data, "en")).includes("set name Café Hilltop"));
  assert.equal(cmds.checks(running, data, "en").find((c) => c.id === "name").expect, "Should answer Café Hilltop.");
  assert.equal(cmds.checks(running, data, "fr").find((c) => c.id === "name").expect, "Doit répondre Café Hilltop.");
});
test("edge, cross-border and onny follow the generator", () => {
  const edge = flat(cmds.rollup({ ...belleville, role: "edge", neighbours: ["ygk"], external: ["western-new-york"] }, data, "en"));
  assert.ok(edge.includes("region def ytr|* ygk|* on|* onqc|* can|* na|* us us-ny") && edge.includes("region denyf *"));
  assert.ok(flat(cmds.rollup({ ...belleville, external: ["ontario-new-york"] }, data, "en")).includes("region def ytr|* on|* onqc|* can|* na|* onny"));
});
test("the phone route leaves out the radio and clears old regions deepest first", () => {
  const out = flat(cmds.rollup({ ...belleville, status: "running", reflash: false, firmware: "1.15", regionReply: "*^ F\n can F\n  on F\n   ott F" }, data, "en"));
  assert.ok(!out.some(c => c.startsWith("set radio")));
  assert.deepEqual(out.slice(out.indexOf("region"), out.indexOf("region save") + 1), ["region","region remove ott","region remove on","region remove can",
    "region put ytr","region put on","region put onqc","region put can","region put na","region allowf *","region default ytr","region save"]);
});
test("a listen-only repeater observer gets observer lines and no scopes", () => {
  const out = flat(cmds.rollup({ ...belleville, type: "observer", repeat: "listen", board: "esp32", role: undefined, name: "Belleville_Obs1" }, data, "en"));
  assert.ok(!out.some(c => c.startsWith("region")));
  for (const c of ["set mqtt.iata YTR","set mqtt1.preset meshcore-ca-1","set mqtt2.preset meshcore-ca-2","set mqtt.raw off","set mqtt.tx advert","set repeat off","set wifi.pwd <your Wi-Fi password>"]) assert.ok(out.includes(c), c);
});
test("BC Mesh radio settings when chosen", () => {
  assert.equal(flat(cmds.rollup({ ...belleville, tag: "yvr", province: "bc", radio: "bc-mesh" }, data, "en"))[0], "set radio 910.425,62.5,7,5");
});
test("the final checks match the device and role", () => {
  const ids = (a) => cmds.checks(a, data, "en").map(c => c.command);
  assert.deepEqual(ids(belleville), ["ver", "get name", "region", "clock", "advert"]);
  assert.ok(ids({ ...belleville, type: "observer", repeat: "both", board: "esp32" }).includes("get mqtt.status"));
  assert.ok(!ids({ ...belleville, type: "observer", repeat: "listen", board: "esp32", role: undefined }).includes("region"));
  assert.match(cmds.checks({ ...belleville, role: "edge", neighbours: ["ygk"] }, data, "en").find(c => c.command === "region").expect, /without F|no F/);
});
test("region replies are read safely", () => {
  assert.deepEqual(cmds.regionRemovals("region\r\n*^ F \r\n\tcan F\r\n  on F\r\nOK\r\n"), { names: ["on","can"], readable: true });
  assert.deepEqual(cmds.regionRemovals("*^ F"), { names: [], readable: true });
  assert.deepEqual(cmds.regionRemovals("nonsense here"), { names: [], readable: false });
});
test("every item explains itself in both languages; only manual items hold placeholders", () => {
  for (const lang of ["en","fr"]) for (const item of cmds.rollup({ ...belleville, type: "observer", repeat: "both", board: "esp32" }, data, lang).flatMap(g => g.items)) {
    assert.ok(item.why.length > 10, item.id);
    assert.equal(/</.test(item.command), item.manual, item.id);
  }
  for (const key of text.keys()) assert.ok(text.t(key, "fr").length && text.t(key, "en").length, key);
});

// Beyond the brief: the controller's decisions and the review focus.

const items = (groups) => groups.flatMap((g) => g.items);
const observer = { ...belleville, type: "observer", repeat: "both", board: "esp32", name: "Belleville_Obs1" };

test("groups come in a fixed order and leave out what doesn't apply", () => {
  assert.deepEqual(cmds.rollup(belleville, data, "en").map((g) => g.id), ["basics", "canada", "scopes", "finish"]);
  assert.deepEqual(cmds.rollup(observer, data, "en").map((g) => g.id), ["basics", "canada", "scopes", "observer", "finish"]);
  assert.deepEqual(cmds.rollup({ ...observer, repeat: "listen", role: undefined }, data, "en").map((g) => g.id), ["basics", "canada", "observer", "finish"]);
});

test("the observer lines follow the MQTT page's order, typed Wi-Fi lines last", () => {
  const group = cmds.rollup(observer, data, "en").find((g) => g.id === "observer");
  assert.deepEqual(group.items.map((i) => i.command), ["set mqtt.iata YTR", "set wifi.powersave none", "set mqtt1.preset meshcore-ca-1",
    "set mqtt2.preset meshcore-ca-2", "set mqtt.status on", "set mqtt.packets on", "set mqtt.raw off", "set mqtt.rx on", "set mqtt.tx advert",
    "set bridge.enabled on", "set repeat on", "advert", "set wifi.ssid <your Wi-Fi name>", "set wifi.pwd <your Wi-Fi password>"]);
  assert.deepEqual(group.items.filter((i) => i.manual).map((i) => i.id), ["ssid", "wifi-pwd"]);
  // The MQTT page's warning: these replace slots 1 and 2.
  assert.match(group.items.find((i) => i.id === "mqtt1").why, /slot 1/);
  assert.match(group.items.find((i) => i.id === "mqtt2").why, /slot 2/);
  assert.match(text.t("note.mqtt-slots", "en"), /slots 1 and 2/);
});

test("answers that don't apply are ignored, not trusted (hand-edited share links)", () => {
  // A listen-only repeater observer carrying role, neighbours and cross-border networks.
  const listen = flat(cmds.rollup({ ...observer, repeat: "listen", role: "edge", neighbours: ["ygk"], external: ["western-new-york"] }, data, "en"));
  assert.ok(!listen.some((c) => c.startsWith("region")));
  assert.ok(listen.includes("set repeat off"));
  // A city repeater carrying neighbours and an edge-only network: neither applies, the shared onny does.
  const city = flat(cmds.rollup({ ...belleville, neighbours: ["ygk"], external: ["western-new-york", "ontario-new-york"] }, data, "en"));
  assert.ok(city.includes("region def ytr|* on|* onqc|* can|* na|* onny"));
  assert.ok(city.includes("region allowf *"));
  // A cross-border network offered in another province is dropped; unknown neighbours are dropped.
  assert.ok(flat(cmds.rollup({ ...belleville, role: "edge", neighbours: ["nope", "ygk"], external: ["washington"] }, data, "en"))
    .includes("region def ytr|* ygk|* on|* onqc|* can|* na"));
  // A radio choice the region doesn't offer falls back to the Canada settings.
  assert.equal(flat(cmds.rollup({ ...belleville, radio: "bc-mesh" }, data, "en"))[0], "set radio 910.525,62.5,7,5");
  // Old regions are only cleared on a board that was already running.
  assert.ok(!flat(cmds.rollup({ ...belleville, regionReply: "*^ F\n ott F" }, data, "en")).includes("region"));
});

test("a running repeater that is reflashed keeps the radio line and still clears old regions (Ruling 3)", () => {
  const reflashed = { ...belleville, status: "running", reflash: true, regionReply: "*^ F\n ott F\n on F" };
  const out = flat(cmds.rollup(reflashed, data, "en"));
  assert.equal(out[0], "set radio 910.525,62.5,7,5");
  assert.deepEqual(out.slice(out.indexOf("region"), out.indexOf("region def ytr|* on|* onqc|* can|* na")),
    ["region", "region remove ott", "region remove on"]);
  // Running, nothing pasted yet: the show line is there, no removals.
  const waiting = flat(cmds.rollup({ ...reflashed, regionReply: undefined }, data, "en"));
  assert.ok(waiting.includes("region") && !waiting.some((c) => c.startsWith("region remove")));
  // A running repeater observer on the observer firmware takes the phone route: no radio, old regions cleared.
  const phoneObserver = flat(cmds.rollup({ ...observer, status: "running", observerFirmware: "yes", firmware: "1.16", regionReply: "*^ F\n ott F" }, data, "en"));
  assert.ok(!phoneObserver.some((c) => c.startsWith("set radio")));
  assert.ok(phoneObserver.includes("region remove ott"));
});

test("the phone route explains why the radio line is missing", () => {
  assert.match(text.t("note.radio-phone", "en"), /USB/);
  assert.match(text.t("note.radio-phone", "fr"), /USB/);
});

test("every command line gets its own id, and the explanations use why. keys", () => {
  for (const answers of [observer, { ...belleville, role: "edge", neighbours: ["ygk"], external: ["western-new-york"], status: "running", reflash: false,
    firmware: "1.14", regionReply: "*^ F\n can F\n  on F" }]) {
    const ids = items(cmds.rollup(answers, data, "en")).map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, ids.join(","));
  }
  const whyKeys = text.keys().filter((key) => key.startsWith("why."));
  for (const key of ["why.radio", "why.name", "why.lat", "why.lon", "why.password", "why.hash", "why.advert", "why.flood-advert", "why.flood-max",
    "why.region-show", "why.remove", "why.def", "why.allow", "why.deny", "why.default", "why.save", "why.ssid", "why.wifi-pwd", "why.reboot"]) {
    assert.ok(whyKeys.includes(key), key);
  }
  // Every explanation in a rollup is one of those strings, filled in.
  const templates = whyKeys.map((key) => new RegExp("^" + text.t(key, "en").replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{[\w-]+\}/g, ".+") + "$"));
  for (const item of items(cmds.rollup({ ...observer, role: "edge", neighbours: ["ygk"], status: "running", reflash: true, regionReply: "*^ F\n ott F" }, data, "en"))) {
    assert.ok(templates.some((pattern) => pattern.test(item.why)), item.id + ": " + item.why);
  }
});

test("explanations name the regions and the town in plain words", () => {
  const why = (answers, id, lang = "en") => items(cmds.rollup(answers, data, lang)).find((i) => i.id === id).why;
  assert.equal(why(belleville, "def"), "Pass on messages labelled for Quinte West (ytr), Ontario (on), Ontario + Québec (onqc), Canada (can) and North America (na).");
  assert.equal(why(belleville, "allow"), "Also pass on messages with no label, as a city repeater does.");
  assert.equal(why({ ...belleville, role: "edge", neighbours: ["ygk"] }, "deny"),
    "Don't pass on messages with no label, so they stay in their own region. That's what makes it an edge repeater.");
  assert.equal(why(belleville, "default"), "Label this repeater's own announcements with ytr.");
  // The town search's point can be several km from the town's middle, so the map position is only "near" it.
  assert.equal(why(belleville, "lat"), "Show it on maps near Belleville (not its exact spot). This line sets the latitude.");
  assert.equal(why(belleville, "lon"), "This line sets the longitude, so maps show it near Belleville.");
  assert.equal(why(belleville, "lat", "fr"), "Place le répéteur sur les cartes près de la localité (Belleville), pas à son endroit exact. Cette ligne règle la latitude.");
  assert.doesNotMatch(text.t("name.location", "en") + text.t("name.location", "fr"), /centre/);
  // A street address or coordinates are the spot itself, so the map shows it there, rounded to 4 decimals (about 10 m).
  for (const place of [{ name: "111 Wellington Street, Ottawa", lat: 45.42312333800001, lon: -75.698764764, kind: "address" },
    { name: "45.4231, -75.6988", lat: 45.42312333, lon: -75.69876476, kind: "coordinates" }]) {
    const spot = { ...belleville, tag: "yow", place };
    const lines = items(cmds.rollup(spot, data, "en"));
    assert.deepEqual(lines.filter((i) => i.id === "lat" || i.id === "lon").map((i) => i.command), ["set lat 45.4231", "set lon -75.6988"], place.kind);
    assert.equal(why(spot, "lat"), "Show it on maps at the spot you entered. This line sets the latitude.", place.kind);
    assert.equal(why(spot, "lon"), "This line sets the longitude, so maps show it at the spot you entered.", place.kind);
    assert.equal(why(spot, "lat", "fr"), text.t("why.lat-spot", "fr"), place.kind);
    assert.equal(why(spot, "lon", "fr"), text.t("why.lon-spot", "fr"), place.kind);
    assert.ok(!items(cmds.rollup({ ...spot, shareLocation: false }, data, "en")).some((i) => i.id === "lat" || i.id === "lon"), place.kind);
  }
  assert.equal(why({ ...belleville, status: "running", reflash: false, firmware: "1.14" }, "put-ytr"),
    "Add Quinte West (ytr) to its list of regions. It doesn't pass those messages on until its `region allowf` line.");
  assert.equal(why(belleville, "default", "fr"), "Ajoute l’étiquette ytr aux annonces de ce répéteur.");
  assert.match(why({ ...belleville, role: "edge", neighbours: ["ygk"], external: ["western-new-york"] }, "def"), /Kingston \(ygk\).*United States \(us\) and New York \(us-ny\)\.$/);
  assert.equal(why({ ...belleville, status: "running", reflash: false, firmware: "1.16", regionReply: "*^ F\n ott F" }, "remove-ott"), "Remove the old region ott.");
  assert.equal(why({ ...belleville, tag: "yvr", province: "bc", radio: "bc-mesh" }, "radio"),
    "Use the BC Mesh radio settings: 910.425 MHz, 62.5 kHz, spreading factor 7, coding rate 5. Every device nearby has to match.");
});

test("the Canada radio explanation matches the published profile", () => {
  const canada = JSON.parse(readFileSync("docs/assets/radio-profiles.json", "utf8")).find((p) => p.id === "canada").radio;
  const values = { mhz: canada.frequency_mhz, khz: canada.bandwidth_khz, sf: canada.spreading_factor, cr: canada.coding_rate };
  assert.ok(text.t("why.radio", "en").includes(text.t("radio.settings", "en", values)));
  const comma = (n) => String(n).replace(".", ",");
  assert.ok(text.t("why.radio", "fr").includes(text.t("radio.settings", "fr", { mhz: comma(values.mhz), khz: comma(values.khz), sf: values.sf, cr: values.cr })));
});

test("French output is French, placeholders included", () => {
  const fr = items(cmds.rollup({ ...observer, role: "edge", neighbours: ["ygk"], external: ["western-new-york"] }, data, "fr"));
  const why = (id) => fr.find((i) => i.id === id).why;
  assert.match(why("def"), /^Relaie les messages .*Amérique du Nord \(na\), États-Unis \(us\) et New York \(us-ny\)\.$/);
  assert.match(why("deny"), /répéteur de bordure/);
  assert.match(why("radio"), /910,525 MHz, 62,5 kHz/);
  assert.match(why("lat"), /Belleville/);
  assert.equal(fr.find((i) => i.id === "password").command, "password <votre nouveau mot de passe administrateur>");
  assert.equal(fr.find((i) => i.id === "ssid").command, "set wifi.ssid <nom de votre Wi-Fi>");
  assert.equal(fr.find((i) => i.id === "wifi-pwd").command, "set wifi.pwd <mot de passe de votre Wi-Fi>");
  // Commands themselves never change with the language.
  const en = items(cmds.rollup({ ...observer, role: "edge", neighbours: ["ygk"], external: ["western-new-york"] }, data, "en"));
  assert.deepEqual(fr.filter((i) => !i.manual).map((i) => i.command), en.filter((i) => !i.manual).map((i) => i.command));
  for (const check of cmds.checks(observer, data, "fr")) assert.ok(check.expect.length > 10, check.id);
  assert.notEqual(cmds.checks(observer, data, "fr")[0].expect, cmds.checks(observer, data, "en")[0].expect);
});

test("firmware 1.14 gets one line per region, each explained", () => {
  const out = items(cmds.rollup({ ...belleville, status: "running", reflash: false, firmware: "1.14" }, data, "en"));
  const scopes = out.filter((i) => i.command.startsWith("region"));
  assert.deepEqual(scopes.map((i) => i.command), ["region", "region put ytr", "region allowf ytr", "region put on", "region allowf on", "region put onqc",
    "region allowf onqc", "region put can", "region allowf can", "region put na", "region allowf na", "region allowf *", "region save"]);
  assert.ok(!scopes.some((i) => i.command.startsWith("region default")), "1.14 has no region default");
  assert.match(scopes[1].why, /Quinte West \(ytr\)/);
  assert.match(scopes[2].why, /^Pass on messages labelled for Quinte West \(ytr\)\.$/);
});

test("the firmware comes from the flash route's newest, or from the phone route's choice", () => {
  const scopes = (answers) => flat(cmds.rollup(answers, data, "en")).filter((c) => c.startsWith("region") && c !== "region");
  const one = ["region def ytr|* on|* onqc|* can|* na", "region allowf *", "region default ytr", "region save"];
  // Flashing: nothing was asked, so the newest firmware's single `region def` line.
  assert.deepEqual(scopes(belleville), one);
  assert.deepEqual(scopes({ ...belleville, status: "running", reflash: true }), one);
  assert.deepEqual(scopes({ ...observer, status: "running", observerFirmware: "no" }), one);
  // A phone-route answer left over from before the board was reflashed does not count.
  assert.deepEqual(scopes({ ...belleville, status: "running", reflash: true, firmware: "1.14" }), one);
  const phone = { ...belleville, status: "running", reflash: false };
  assert.deepEqual(scopes({ ...phone, firmware: "1.16" }), one);
  // 1.15 adds one region per line and sets the default.
  assert.deepEqual(scopes({ ...phone, firmware: "1.15" }), ["region put ytr", "region put on", "region put onqc", "region put can", "region put na",
    "region allowf *", "region default ytr", "region save"]);
  // 1.14 allows each region on its own line and has no default.
  assert.deepEqual(scopes({ ...phone, firmware: "1.14" }), ["region put ytr", "region allowf ytr", "region put on", "region allowf on", "region put onqc",
    "region allowf onqc", "region put can", "region allowf can", "region put na", "region allowf na", "region allowf *", "region save"]);
});

test("an admin password is only optional on a board that already has one", () => {
  const why = (answers) => items(cmds.rollup(answers, data, "en")).find((i) => i.id === "password").why;
  assert.equal(why(belleville), "Set the admin password you'll use to manage it from the app. Keep it in your password manager.");
  assert.match(why({ ...belleville, status: "running", reflash: false, firmware: "1.16" }), /skip this line/);
});

test("no location lines unless the person asked to show it on maps", () => {
  assert.ok(!flat(cmds.rollup({ ...belleville, shareLocation: false }, data, "en")).some((c) => /^set (lat|lon) /.test(c)));
  assert.ok(!flat(cmds.rollup({ ...belleville, place: undefined }, data, "en")).some((c) => /^set (lat|lon) /.test(c)));
});

test("checks say what to expect for this repeater", () => {
  const find = (answers, command, lang = "en") => cmds.checks(answers, data, lang).find((c) => c.command === command);
  assert.match(find(belleville, "get name").expect, /Belleville_R1/);
  const city = find(belleville, "region").expect;
  assert.match(city, /ytr, on, onqc, can and na/);
  assert.doesNotMatch(city, /without F|no F/);
  assert.doesNotMatch(city, /\^/);
  assert.match(find({ ...belleville, role: "edge", neighbours: ["ygk"] }, "region").expect, /ytr, ygk, on, onqc, can and na/);
  assert.notEqual(find(belleville, "ver").expect, find({ ...belleville, status: "running", reflash: false, firmware: "1.16" }, "ver").expect);
  assert.deepEqual(cmds.checks(observer, data, "en").map((c) => c.id), ["ver", "name", "region", "mqtt", "clock", "advert"]);
});

// The one plain sentence about the clock, used by the tool and by the start pages (start-journeys.test.mjs).
const CLOCK = {
  en: "After a restart its clock is often wrong, and phones may ignore its announcements until it's set.",
  fr: "Après un redémarrage, son horloge est souvent fausse, et les téléphones peuvent ignorer ses annonces tant qu’elle n’est pas réglée."
};

test("the checks remind people to set the clock after a restart, before the advert, in plain words", () => {
  const running = { ...belleville, status: "running", reflash: false, firmware: "1.16" };
  // Over USB the Console has no phone to take the time from: it shows the clock and says how to set it from the app.
  // `clock sync` always fails there (serial passes no sender time; the firmware answers "clock cannot go backwards"),
  // so the line says so. From the app the repeater takes the time from the phone, so there the check is the sync itself.
  const cases = [
    [belleville, "clock", {
      en: /^Shows its clock, in UTC\. .* If it's wrong, set it from your phone: in the MeshCore app, open Contacts, tap the repeater, log in as admin, then tap Command Line and send `clock sync`\. It doesn't work from the Console\.$/,
      fr: /^Affiche son horloge, en UTC\. .* Si elle est fausse, réglez-la depuis votre téléphone : dans l’application MeshCore, ouvrez Contacts, touchez le répéteur, connectez-vous comme administrateur, puis touchez Command Line et envoyez `clock sync`\. Cette commande ne fonctionne pas depuis la Console\.$/
    }],
    [running, "clock sync", { en: /^Sets its clock from your phone\. /, fr: /^Règle son horloge d’après votre téléphone\. / }],
  ];
  for (const [answers, command, expected] of cases) {
    for (const lang of ["en", "fr"]) {
      const list = cmds.checks(answers, data, lang);
      const clock = list.find((c) => c.id === "clock");
      assert.equal(clock.command, command, `${lang} ${command}`);
      assert.match(clock.expect, expected[lang], `${lang} ${command}`);
      assert.ok(clock.expect.includes(CLOCK[lang]), `${lang} ${command}: the plain clock sentence`);
      assert.doesNotMatch(clock.expect, /stale|advert timing|routing|acheminement|périmée/, `${lang} ${command}: no jargon`);
      assert.ok(list.findIndex((c) => c.id === "clock") < list.findIndex((c) => c.id === "advert"), `${lang}: the clock comes before the advert`);
    }
  }
});

test("the checks' introduction says what they change", () => {
  for (const lang of ["en", "fr"]) {
    for (const key of ["check.hint.console", "check.hint.phone"]) {
      assert.doesNotMatch(text.t(key, lang), /Nothing here changes|Aucune ne change/, `${lang} ${key}`);
    }
    // From the app, `clock sync` is the one line that changes something.
    assert.match(text.t("check.hint.phone", lang), lang === "en" ? /change nothing, except `clock sync`/ : /ne changent rien, sauf `clock sync`/);
    // Over USB nothing in the list changes anything: the clock is set from the app, and `clock sync` is never offered for the Console.
    assert.match(text.t("check.hint.console", lang), lang === "en"
      ? /They change nothing\. If its clock is wrong, set it from the app\.$/
      : /Elles ne changent rien\. Si son horloge est fausse, réglez-la depuis l’application\.$/, lang);
    assert.doesNotMatch(text.t("check.hint.console", lang), /clock sync|except|sauf/, lang);
  }
});

test("cross-border notes are translated, and only where the generator warns", () => {
  assert.deepEqual(cmds.notes(belleville, data, "en"), []);
  assert.deepEqual(cmds.notes({ ...belleville, role: "edge", neighbours: ["ygk"], external: ["western-new-york"] }, data, "en"), []);
  const onny = cmds.notes({ ...belleville, external: ["ontario-new-york"] }, data, "fr");
  assert.equal(onny.length, 1);
  assert.match(onny[0], /Ontario–New York/);
  assert.equal(cmds.notes({ ...belleville, role: "edge", external: ["pennsylvania", "ohio"] }, data, "en").length, 2);
  assert.equal(cmds.notes({ ...belleville, tag: "ytr", province: "qc" }, data, "en").length, 1);
  // Nothing is cross-border for a listen-only repeater observer.
  assert.deepEqual(cmds.notes({ ...observer, repeat: "listen", external: ["ontario-new-york"] }, data, "en"), []);
});

test("pasted region replies: console prefixes, odd spacing, and never *", () => {
  // The flasher console echoes the command and starts the reply with "  -> ".
  assert.deepEqual(cmds.regionRemovals("region\n  -> *^ F\n can F\n  on F\n   ott F\n on-alg F\n"), { names: ["ott", "on", "can", "on-alg"], readable: true });
  // Copied from a web page: non-breaking spaces and a CR-only line ending.
  assert.deepEqual(cmds.regionRemovals("*^ F\r yow F\r  old F"), { names: ["old", "yow"], readable: true });
  // An edge repeater's * has no F; a home marker can sit on another region.
  assert.deepEqual(cmds.regionRemovals("*\n ott^ F\n can"), { names: ["ott", "can"], readable: true });
  // Two replies pasted together, a jump in indentation, a repeated name or no reply at all can't be read safely.
  for (const reply of ["*^ F\n ott F\n*^ F\n ott F", "*^ F\n   ott F", "*^ F\n ott F\n ott F", "", "   ", "OK", "Err - unknown region", undefined, null, 42]) {
    assert.deepEqual(cmds.regionRemovals(reply), { names: [], readable: false }, JSON.stringify(reply));
  }
  assert.deepEqual(cmds.regionRemovals("x".repeat(5000)), { names: [], readable: false });
  // Indents lost: an unindented name inside the list, with or without F, would leave old regions behind.
  for (const reply of ["*^ F\ncan\non", "*^\ncan\non", "*^ F\ncan F", "*^ F\n can F\non"]) {
    assert.deepEqual(cmds.regionRemovals(reply), { names: [], readable: false }, JSON.stringify(reply));
  }
  // Only an echoed `region` or `OK`, in any case, is ignored inside the list; other console output before it is too.
  assert.deepEqual(cmds.regionRemovals("ver\nregion\n*^ F\n ott F\nok\nRegion\nOK"), { names: ["ott"], readable: true });
});

test("an old home region that gets removed is replaced, as the migration planner does", () => {
  const running = { ...belleville, status: "running", reflash: false, firmware: "1.16" };
  const out = flat(cmds.rollup({ ...running, regionReply: "*\n ott^ F\n on F" }, data, "en"));
  assert.deepEqual(out.slice(out.indexOf("region remove ott")), ["region remove ott", "region remove on", "region def ytr|* on|* onqc|* can|* na",
    "region allowf *", "region default ytr", "region home ytr", "region save", "reboot"]);
  // The site's migration planner adds the same line for the same reply.
  const migration = globalThis.MeshCoreScopeMigration;
  const desired = globalThis.MeshCoreIataScopes.profile(data.catalog, { activation: "activate", home: "ytr", province: "on", bridge: false });
  assert.ok(migration.plan(migration.parse("*\n ott^ F\n on F"), desired, "1.16").commands.includes("region home ytr"));
  for (const lang of ["en", "fr"]) {
    const home = items(cmds.rollup({ ...running, regionReply: "*\n ott^ F" }, data, lang)).find((i) => i.id === "home");
    assert.equal(home.command, "region home ytr");
    assert.equal(home.why, text.t("why.home", lang, { tag: "ytr" }));
  }
  // Home on *, no home marker, an unreadable reply or nothing pasted: no region home line.
  for (const reply of ["*^ F\n ott F", "* F\n ott F", "*^ F\nott^ F", undefined]) {
    assert.ok(!flat(cmds.rollup({ ...running, regionReply: reply }, data, "en")).some((c) => c.startsWith("region home")), String(reply));
  }
  // The checks still don't promise a ^ marker.
  assert.doesNotMatch(cmds.checks({ ...running, regionReply: "*\n ott^ F" }, data, "en").find((c) => c.id === "region").expect, /\^/);
});

test("the firmware question is four choices, with the same version labels in both languages", () => {
  for (const lang of ["en", "fr"]) {
    assert.deepEqual(["1.16", "1.15", "1.14"].map((value) => text.t(`version.${value}`, lang)), ["1.16.0+", "1.15.x", "1.14.x"], lang);
    for (const value of ["1.16", "1.15", "1.14", "older"]) assert.ok(text.t(`version.${value}.detail`, lang).length > 20, `${lang} ${value}`);
    assert.match(text.t("version.hint", lang), /`ver`.*v1\.15\.0/, lang);
  }
  assert.equal(text.t("version.older", "en"), "Older than 1.14");
  assert.equal(text.t("version.older", "fr"), "Plus ancienne que 1.14");
  assert.equal(text.t("version.1.16.detail", "en"), "Sets the whole region list with one line.");
  assert.equal(text.t("version.1.15.detail", "en"), "Adds one region per line.");
  // The words for typing in a `ver` reply are gone.
  for (const key of ["version.how.console", "version.how.phone", "version.label", "version.placeholder", "version.found", "version.unreadable",
    "version.v1.14", "version.v1.15", "version.v1.16", "version.phone.step4", "phone.img.ver"]) {
    assert.ok(!text.keys().includes(key), key);
  }
});

test("text lookups fail loudly and fill in placeholders", () => {
  assert.throws(() => text.t("no.such.key", "en"), /no\.such\.key/);
  assert.equal(text.t("nav.progress", "en", { n: 3, total: 11, label: "Board" }), "Step 3 of 11 · Board");
  assert.equal(text.t("nav.progress", "fr", { n: 3, total: 11, label: "Carte" }), "Étape 3 sur 11 · Carte");
  // A placeholder without a value stays as written, so a page can show the template.
  assert.equal(text.t("why.remove", "en"), "Remove the old region {name}.");
  assert.deepEqual(Object.keys(text.text.en).sort(), Object.keys(text.text.fr).sort());
  for (const lang of ["en", "fr"]) {
    for (const key of text.keys()) {
      const value = text.t(key, lang);
      assert.equal(value, value.trim(), key);
      // `<saved key>` inside a code span is a command placeholder, shown as text; HTML anywhere else is a mistake.
      // An unpaired backtick would let a "<" hide in a code span that never closes, so the backticks must pair up.
      assert.equal((value.match(/`/g) || []).length % 2, 0, key + " has an unpaired backtick");
      assert.doesNotMatch(value.replace(/`[^`]*`/g, ""), /<[a-z/]/i, key + " holds HTML");
      // Multi-line examples (a pasted region reply) keep their indentation.
      if (!value.includes("\n")) assert.doesNotMatch(value, /  /, key + " has a double space");
    }
  }
  // French uses typographic apostrophes, like the rest of the site.
  for (const key of text.keys()) assert.doesNotMatch(text.t(key, "fr"), /'/, key);
});

test("flash steps use each flasher's own button names", () => {
  for (const lang of ["en", "fr"]) {
    assert.match(text.t("flash.repeater.step3", lang, { erase: "" }), /Flash!/, lang);
    assert.doesNotMatch(text.t("flash.observer.step3", lang, { erase: "" }), /Flash!/, lang);
    assert.match(text.t("flash.nrf52.dfu", lang), /Enter DFU mode/, lang);
    assert.match(text.t("flash.nrf52.port", lang), /COM/, lang);
    assert.match(text.t("flash.nrf52.flash", lang), /Flash!/, lang);
    assert.match(text.t("flash.erase.nrf52-new", lang), /Erase Flash/, lang);
    assert.match(text.t("flash.erase.esp32-new", lang), /Erase device/, lang);
    assert.match(text.t("flash.erase.nrf52-running", lang), /Erase Flash/, lang);
  }
  assert.throws(() => text.t("flash.step3", "en"));
});
