import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

// The script is a classic browser script: run it in this realm so it sets its global.
vm.runInThisContext(readFileSync("docs/assets/setup/setup-flow.js", "utf8"), { filename: "setup-flow.js" });
const flow = globalThis.MeshCoreSetupFlow;

test("a new nRF52 repeater gets the bootloader, flash and version steps", () => {
  assert.deepEqual(flow.stepIds({ type: "repeater", board: "rak4631", status: "new" }),
    ["type","board","status","bootloader","flash","version","town","role","name","commands","check"]);
});

test("a listen-only repeater observer skips scopes questions", () => {
  assert.deepEqual(flow.stepIds({ type: "observer", repeat: "listen", board: "heltec-v3", status: "new" }),
    ["type","repeat","board","status","flash","version","town","name","commands","check"]);
});

test("a running repeater that isn't reflashed takes the phone route", () => {
  const a = { type: "repeater", board: "heltec-v3", status: "running", reflash: false };
  assert.deepEqual(flow.stepIds(a), ["type","board","status","reflash","version","town","role","name","commands","check"]);
  assert.equal(flow.route(a), "phone");
});

test("a running board becoming a repeater observer must be flashed", () => {
  const a = { type: "observer", repeat: "both", board: "heltec-v3", status: "running", observerFirmware: "no" };
  assert.deepEqual(flow.stepIds(a), ["type","repeat","board","status","observerFirmware","flash","version","town","role","name","commands","check"]);
  assert.equal(flow.route(a), "flash");
});

test("edge adds neighbours; a region with two radio setups adds the radio question", () => {
  assert.ok(flow.stepIds({ type: "repeater", board: "heltec-v3", status: "new", role: "edge" }).includes("neighbours"));
  assert.deepEqual(flow.stepIds({ type: "repeater", board: "heltec-v3", status: "new" }, { radioOptions: 2 }).slice(5, 7), ["town", "radio"]);
});

test("an nRF52 board can't complete the board step for a repeater observer", () => {
  assert.equal(flow.isComplete("board", { type: "observer", board: "rak4631" }), false);
  assert.equal(flow.isComplete("board", { type: "repeater", board: "rak4631" }), true);
});

test("names are suggested from the town; a region from the map answers the town step", () => {
  assert.equal(flow.suggestName({ type: "repeater", place: { name: "Belleville" } }), "Belleville_R1");
  assert.equal(flow.suggestName({ type: "observer", place: { name: "Montréal" } }), "Montreal_Obs1");
  assert.equal(flow.isComplete("town", { tag: "yow", province: "qc" }), true);
  assert.equal(flow.isComplete("name", { name: "Belleville R1" }), false);   // spaces not allowed
  assert.equal(flow.isComplete("name", { name: "Belleville_R1" }), true);
});

test("ver replies are read leniently", () => {
  assert.deepEqual(flow.parseVersion("v1.15.0"), { firmware: "1.15", tooOld: false });
  assert.deepEqual(flow.parseVersion("MeshCore v1.16.2 (Build: 12-Oct-2026)"), { firmware: "1.16", tooOld: false });
  assert.deepEqual(flow.parseVersion("v1.17.0"), { firmware: "1.16", tooOld: false });
  assert.deepEqual(flow.parseVersion("1.14"), { firmware: "1.14", tooOld: false });
  assert.deepEqual(flow.parseVersion("v1.13.1"), { firmware: null, tooOld: true });
  assert.deepEqual(flow.parseVersion("hello"), { firmware: null, tooOld: false });
});

test("changing an earlier answer resets what depended on it", () => {
  const a = { type: "observer", board: "rak4631", place: { name: "Belleville" }, tag: "ytr", province: "on",
    radio: "canada", role: "edge", neighbours: ["ygk"], external: ["western-new-york"], name: "Belleville_R1" };
  assert.equal(flow.resetDependents(a, "type").board, undefined);           // nRF52 invalid for observer
  const town = flow.resetDependents(a, "place");
  for (const key of ["tag","province","radio","neighbours","external","name"]) assert.equal(town[key], undefined);
  assert.deepEqual(flow.resetDependents({ ...a, role: "city" }, "role").neighbours, undefined);
  assert.equal(flow.resetDependents({ ...a, nameEdited: true }, "place").name, "Belleville_R1"); // keep a typed name
});

test("share links round-trip answers and never carry pasted replies", () => {
  const a = { type: "repeater", board: "heltec-v3", status: "new", tag: "ytr", province: "on", role: "edge", neighbours: ["ygk"], name: "Belleville_R1", regionReply: "*^ F" };
  const q = flow.toQuery(a);
  assert.doesNotMatch(q, /regionReply|%5E/);
  assert.deepEqual(flow.fromQuery(q), { type: "repeater", board: "heltec-v3", status: "new", tag: "ytr", province: "on", role: "edge", neighbours: ["ygk"], name: "Belleville_R1" });
  assert.deepEqual(flow.fromQuery("?tag=YOW&province=qc&step=3"), { tag: "yow", province: "qc" }); // map links; old params ignored
});

// Beyond the brief: the board list, route edge cases, purity and hostile links.

test("the board list is well formed and matches the flashers' boards", () => {
  const ids = flow.BOARDS.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const b of flow.BOARDS) {
    assert.ok(b.name && ["nrf52", "esp32"].includes(b.chip), b.id);
    assert.equal(typeof b.observerFlasher, "boolean", b.id);
    if (b.chip === "nrf52") assert.equal(b.observerFlasher, false, `${b.id}: the observer firmware is ESP32 only`);
  }
  for (const id of ["rak4631", "heltec-t114", "xiao-nrf52840", "t-echo", "heltec-v3", "heltec-v4", "t-beam", "xiao-esp32s3", "other-nrf52", "other-esp32"]) {
    assert.ok(ids.includes(id), id);
  }
  const board = id => flow.BOARDS.find(b => b.id === id);
  assert.equal(board("rak4631").name, "RAK4631 (WisBlock)");
  assert.equal(board("heltec-v3").observerFlasher, true);
  assert.equal(board("heltec-v4").observerFlasher, true);
  assert.equal(board("heltec-t114").observerFlasher, false);
  assert.equal(board("other-nrf52").chip, "nrf52");
  assert.equal(board("other-esp32").chip, "esp32");
  assert.ok(board("other-nrf52").nameFr && board("other-esp32").nameFr);
});

test("the route is the phone only for a running board that is not being flashed", () => {
  assert.equal(flow.route({ type: "repeater", status: "new" }), "flash");
  assert.equal(flow.route({ type: "repeater", status: "running" }), "flash");              // reflash not answered yet
  assert.equal(flow.route({ type: "repeater", status: "running", reflash: true }), "flash");
  assert.equal(flow.route({ type: "observer", status: "running", observerFirmware: "yes" }), "phone");
  assert.equal(flow.route({ type: "observer", status: "running", observerFirmware: "no" }), "flash");
  assert.equal(flow.route({ type: "observer", status: "new", observerFirmware: "yes" }), "flash");
});

test("the phone route skips the flashing and radio questions", () => {
  const a = { type: "repeater", board: "rak4631", status: "running", reflash: false };
  const ids = flow.stepIds(a, { radioOptions: 2 });
  for (const id of ["bootloader", "flash", "radio"]) assert.ok(!ids.includes(id), id);
  const reflash = flow.stepIds({ ...a, reflash: true }, { radioOptions: 2 });
  for (const id of ["bootloader", "flash", "radio"]) assert.ok(reflash.includes(id), id);
});

test("steps are complete once their own answer is valid", () => {
  assert.equal(flow.isComplete("type", { type: "observer" }), true);
  assert.equal(flow.isComplete("type", {}), false);
  assert.equal(flow.isComplete("repeat", { repeat: "listen" }), true);
  assert.equal(flow.isComplete("repeat", { repeat: "maybe" }), false);
  assert.equal(flow.isComplete("board", { type: "observer", board: "other-esp32" }), true);
  assert.equal(flow.isComplete("board", { type: "observer", board: "other-nrf52" }), false);
  assert.equal(flow.isComplete("board", { board: "rak4631" }), false);                      // type comes first
  assert.equal(flow.isComplete("status", { status: "running" }), true);
  assert.equal(flow.isComplete("reflash", { reflash: false }), true);
  assert.equal(flow.isComplete("reflash", {}), false);
  assert.equal(flow.isComplete("observerFirmware", { observerFirmware: "no" }), true);
  assert.equal(flow.isComplete("bootloader", { bootloader: true }), true);
  assert.equal(flow.isComplete("bootloader", { bootloader: false }), false);
  assert.equal(flow.isComplete("flash", { flashed: true }), true);
  assert.equal(flow.isComplete("version", { firmware: "1.15" }), true);
  assert.equal(flow.isComplete("version", { firmware: "1.13" }), false);
  assert.equal(flow.isComplete("town", { tag: "ytr" }), false);
  assert.equal(flow.isComplete("radio", { radio: "bc-mesh" }), true);
  assert.equal(flow.isComplete("role", { role: "edge" }), true);
  assert.equal(flow.isComplete("neighbours", { neighbours: [] }), true);                    // a deliberate "none"
  assert.equal(flow.isComplete("neighbours", {}), false);
  assert.equal(flow.isComplete("name", { name: "A".repeat(32) }), false);
  assert.equal(flow.isComplete("name", { name: "Café_R1" }), false);
  assert.equal(flow.isComplete("name", {}), false);
  assert.equal(flow.isComplete("nonsense", { type: "repeater" }), false);
});

test("names drop accents, spaces and punctuation", () => {
  assert.equal(flow.suggestName({ type: "repeater", place: { name: "Trois-Rivières" } }), "TroisRivieres_R1");
  assert.equal(flow.suggestName({ type: "observer", place: { name: "Saint-Jean-sur-Richelieu" } }), "SaintJeansurRichelieu_Obs1");
  assert.equal(flow.suggestName({ type: "repeater", place: { name: "Rivière-du-Loup (QC)" } }), "RiviereduLoupQC_R1");
  assert.equal(flow.suggestName({ type: "repeater" }), "");
  assert.equal(flow.suggestName({ type: "repeater", place: { name: "123" } }), "");
  assert.ok(flow.isComplete("name", { name: flow.suggestName({ type: "observer", place: { name: "A".repeat(80) } }) }));
});

test("resetDependents returns a new object and clears the flashing confirmations when the route changes", () => {
  const a = { type: "repeater", board: "rak4631", status: "running", reflash: true, bootloader: true, flashed: true, firmware: "1.15", regionReply: "*^ F" };
  const copy = JSON.parse(JSON.stringify(a));
  const next = flow.resetDependents(a, "reflash");
  assert.deepEqual(a, copy);
  assert.notEqual(next, a);
  for (const key of ["bootloader", "flashed", "firmware"]) assert.equal(next[key], undefined, key);
  assert.equal(next.board, "rak4631");
  assert.equal(next.reflash, true);
  const other = flow.resetDependents(a, "board");
  for (const key of ["bootloader", "flashed", "firmware", "regionReply"]) assert.equal(other[key], undefined, key);
  const listen = flow.resetDependents({ type: "observer", repeat: "listen", role: "edge", neighbours: ["ygk"], external: ["washington"] }, "repeat");
  for (const key of ["role", "neighbours", "external"]) assert.equal(listen[key], undefined, key);
  const both = flow.resetDependents({ type: "observer", repeat: "both", role: "edge", neighbours: ["ygk"] }, "repeat");
  assert.deepEqual(both.neighbours, ["ygk"]);
});

test("a changed type or board keeps what still applies", () => {
  const a = { type: "repeater", repeat: "both", board: "heltec-v3", status: "running", reflash: false, observerFirmware: "yes", name: "Belleville_R1" };
  const next = flow.resetDependents(a, "type");
  for (const key of ["repeat", "reflash", "observerFirmware", "name"]) assert.equal(next[key], undefined, key);
  assert.equal(next.board, "heltec-v3");
  assert.equal(next.status, "running");
  assert.equal(flow.resetDependents({ type: "observer", board: "other-esp32" }, "type").board, "other-esp32");
});

test("share links keep only valid, known answers", () => {
  const a = { type: "observer", repeat: "both", board: "heltec-v4", status: "running", observerFirmware: "yes", firmware: "1.15",
    tag: "yvr", province: "bc", radio: "bc-mesh", role: "edge", neighbours: ["yxx", "yyj"], external: ["washington"],
    name: "Vancouver_Obs1", nameEdited: true, shareLocation: false, reflash: false,
    place: { name: "Vancouver", province: "bc", lat: 49.28, lon: -123.12 } };
  const q = flow.toQuery({ ...a, regionReply: "*^ F" });
  assert.doesNotMatch(q, /^\?|place=|regionReply/);
  const back = flow.fromQuery(q);
  assert.deepEqual(back, a);
  assert.deepEqual(flow.fromQuery("?" + q), a);
  assert.equal(flow.toQuery({}), "");
  assert.deepEqual(flow.fromQuery(""), {});
  assert.deepEqual(flow.fromQuery(flow.toQuery({ role: "edge", neighbours: [] })), { role: "edge", neighbours: [] });

  const hostile = flow.fromQuery("type=wizard&board=nope&tag=a&province=%3Cb%3E&name=a%20b&neighbours=ygk,%3Cx%3E,,ytr&external=WESTERN-new-york&radio=x&firmware=1.9&reflash=maybe&__proto__=1&place=Belleville&regionReply=x&password=secret");
  assert.deepEqual(hostile, { neighbours: ["ygk", "ytr"], external: ["western-new-york"] });
  assert.equal(Object.getPrototypeOf(hostile), Object.prototype);
  assert.doesNotMatch(flow.toQuery({ name: "has space", tag: "<b>", password: "secret" }), /secret|space|<b>|password/);
});

test("the chosen town survives a reload: accents kept, coordinates rounded to 4 decimals", () => {
  const a = { type: "repeater", board: "heltec-v3", status: "new", tag: "yul", province: "qc",
    place: { name: "Montréal", province: "qc", lat: 45.501689, lon: -73.567256 } };
  const q = flow.toQuery(a);
  assert.match(q, /(?:^|&)town=Montr%C3%A9al(?:&|$)/);
  assert.match(q, /(?:^|&)lat=45\.5017(?:&|$)/);
  assert.match(q, /(?:^|&)lon=-73\.5673(?:&|$)/);
  assert.doesNotMatch(q, /(?:^|&)place=/);
  assert.deepEqual(flow.fromQuery(q), { ...a, place: { name: "Montréal", province: "qc", lat: 45.5017, lon: -73.5673 } });
  // a name with spaces and punctuation, and a link that arrives with a leading "?"
  const spaced = flow.fromQuery("?" + flow.toQuery({ tag: "yow", province: "qc", place: { name: "Saint-Jean-sur-Richelieu (QC) & co", province: "qc", lat: 45.3, lon: -73.26 } }));
  assert.deepEqual(spaced.place, { name: "Saint-Jean-sur-Richelieu (QC) & co", province: "qc", lat: 45.3, lon: -73.26 });
  // the province comes from the province answer; without one the place has none
  assert.deepEqual(flow.fromQuery("town=Ottawa&lat=45.4215&lon=-75.6972"), { place: { name: "Ottawa", lat: 45.4215, lon: -75.6972 } });
});

test("a town that is missing, oversized or outside Canada is dropped whole", () => {
  const ok = { name: "Belleville", province: "on", lat: 44.1628, lon: -77.3832 };
  const only = place => flow.fromQuery(flow.toQuery({ tag: "ytr", province: "on", place }));
  assert.deepEqual(only(ok), { tag: "ytr", province: "on", place: ok });
  for (const bad of [{ ...ok, lat: 12 }, { ...ok, lat: 90 }, { ...ok, lon: -20 }, { ...ok, lon: -170 }, { ...ok, lat: NaN },
    { ...ok, lat: "44.1" }, { ...ok, name: "" }, { ...ok, name: "   " }, { ...ok, name: "x".repeat(81) }, { ...ok, name: 7 }]) {
    assert.equal(flow.toQuery({ place: bad }), "", JSON.stringify(bad));
  }
  assert.equal(only({ ...ok, name: "x".repeat(80) }).place.name.length, 80);
  // the same checks apply to links written by hand
  const read = query => flow.fromQuery("tag=ytr&province=on&" + query);
  const kept = { tag: "ytr", province: "on" };
  assert.deepEqual(read("town=Belleville&lat=12&lon=-77.38"), kept);
  assert.deepEqual(read("town=Belleville&lat=44.16&lon=-20"), kept);
  assert.deepEqual(read("town=Belleville&lat=abc&lon=-77.38"), kept);
  assert.deepEqual(read("town=Belleville&lat=&lon=-77.38"), kept);
  assert.deepEqual(read("town=Belleville&lat=0x2C&lon=-77.38"), kept);
  assert.deepEqual(read("town=&lat=44.16&lon=-77.38"), kept);
  assert.deepEqual(read("town=Belleville&lat=44.16"), kept);
  assert.deepEqual(read("town=" + "x".repeat(81) + "&lat=44.16&lon=-77.38"), kept);
  // `place` stays the town-search deep link and is never read as a place
  assert.deepEqual(flow.fromQuery("place=Belleville"), {});
  assert.deepEqual(flow.fromQuery("place=Belleville&town=Kingston&lat=44.23&lon=-76.49").place.name, "Kingston");
});

test("the 'I did this' ticks never go into a share link", () => {
  assert.equal(flow.toQuery({ bootloader: true, flashed: true }), "");
  const q = flow.toQuery({ type: "repeater", board: "rak4631", status: "new", bootloader: true, flashed: true });
  assert.doesNotMatch(q, /bootloader|flashed/);
  assert.deepEqual(flow.fromQuery(q), { type: "repeater", board: "rak4631", status: "new" });
  assert.deepEqual(flow.fromQuery("bootloader=1&flashed=1&type=repeater"), { type: "repeater" });
});
