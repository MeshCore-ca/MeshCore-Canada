import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

// The script is a classic browser script: run it in this realm so it sets its global.
vm.runInThisContext(readFileSync("docs/assets/setup/setup-flow.js", "utf8"), { filename: "setup-flow.js" });
const flow = globalThis.MeshCoreSetupFlow;

test("a new nRF52 repeater gets the bootloader and flash steps, and no version question", () => {
  assert.deepEqual(flow.stepIds({ type: "repeater", board: "nrf52", status: "new" }),
    ["type","board","status","bootloader","flash","town","role","name","location","commands","check"]);
});

test("a listen-only repeater observer skips scopes questions", () => {
  assert.deepEqual(flow.stepIds({ type: "observer", repeat: "listen", board: "esp32", status: "new" }),
    ["type","repeat","board","status","flash","town","name","location","commands","check"]);
});

test("a running repeater that isn't reflashed takes the phone route", () => {
  const a = { type: "repeater", board: "esp32", status: "running", reflash: false };
  assert.deepEqual(flow.stepIds(a), ["type","board","status","reflash","version","town","role","name","location","commands","check"]);
  assert.equal(flow.route(a), "phone");
});

test("a running board becoming a repeater observer must be flashed", () => {
  const a = { type: "observer", repeat: "both", board: "esp32", status: "running", observerFirmware: "no" };
  assert.deepEqual(flow.stepIds(a), ["type","repeat","board","status","observerFirmware","flash","town","role","name","location","commands","check"]);
  assert.equal(flow.route(a), "flash");
});

test("edge adds neighbours; a region with two radio setups adds the radio question", () => {
  assert.ok(flow.stepIds({ type: "repeater", board: "esp32", status: "new", role: "edge" }).includes("neighbours"));
  assert.deepEqual(flow.stepIds({ type: "repeater", board: "esp32", status: "new" }, { radioOptions: 2 }).slice(4, 6), ["town", "radio"]);
});

test("an nRF52 board can't complete the board step for a repeater observer", () => {
  assert.equal(flow.isComplete("board", { type: "observer", board: "nrf52" }), false);
  assert.equal(flow.isComplete("board", { type: "repeater", board: "nrf52" }), true);
});

test("names are suggested from the town; a region from the map answers the town step", () => {
  assert.equal(flow.suggestName({ type: "repeater", place: { name: "Belleville" } }), "Belleville_R1");
  assert.equal(flow.suggestName({ type: "observer", place: { name: "Montréal" } }), "Montreal_Obs1");
  assert.equal(flow.isComplete("town", { tag: "yow", province: "qc" }), true);
  assert.equal(flow.isComplete("name", { name: "Belleville R1" }), true);    // the firmware takes spaces (Ruling 31)
  assert.equal(flow.isComplete("name", { name: "Belleville_R1" }), true);
});

test("a running board gets no suggested name: the person types its current name to keep it, or a new one", () => {
  for (const type of ["repeater", "observer"]) {
    assert.equal(flow.suggestName({ type, status: "running", place: { name: "Kingston" } }), "", type);
  }
  assert.equal(flow.suggestName({ type: "repeater", status: "new", place: { name: "Kingston" } }), "Kingston_R1");
  // Switching to running drops a name suggested for a new board, but keeps one the person typed.
  assert.equal(flow.resetDependents({ status: "running", name: "Kingston_R1" }, "status").name, undefined);
  assert.equal(flow.resetDependents({ status: "running", name: "Hilltop", nameEdited: true }, "status").name, "Hilltop");
  assert.equal(flow.isComplete("name", { status: "running" }), false);
});

// The firmware's rule for `set name <rest of line>` (CommonCLI isValidName, char node_name[32]).
test("a name can be anything the firmware accepts: spaces and accents too", () => {
  for (const name of ["Café Hilltop", "Belleville R1", "Mont-Tremblant (QC) #2", "Tour d’eau", "<b>", "x", "📡 Ridge"]) {
    assert.equal(flow.isComplete("name", { name }), true, name);
    assert.equal(flow.nameProblem(name), null, name);
  }
});

test("a name can't use [ ] \\ : , ? * or control characters", () => {
  for (const bad of ["[", "]", "\\", ":", ",", "?", "*", "\t", "\n", "\r", "\u0000", "\u001f", "\u007f", "\u0085"]) {
    const name = "Hill" + bad + "Top";
    assert.equal(flow.isComplete("name", { name }), false, JSON.stringify(bad));
    assert.equal(flow.nameProblem(name), "characters", JSON.stringify(bad));
  }
});

test("a name fits in 31 bytes, so an accented letter counts as two", () => {
  assert.equal(flow.nameProblem("A".repeat(31)), null);
  assert.equal(flow.nameProblem("A".repeat(32)), "long");
  assert.equal(flow.nameProblem("é".repeat(15) + "A"), null);            // 31 bytes
  assert.equal(flow.nameProblem("é".repeat(16)), "long");                // 16 letters, 32 bytes
  assert.equal(flow.nameProblem("Château Hilltop Saint-Rémi R1"), null);  // 29 letters, 31 bytes
  assert.equal(flow.nameProblem("Château Hilltop Saint-Rémi R12"), "long");
  assert.equal(flow.nameProblem("📡".repeat(7) + "abc"), null);            // 4 bytes each
  assert.equal(flow.nameProblem("📡".repeat(8)), "long");
  assert.equal(flow.isComplete("name", { name: "é".repeat(16) }), false);
});

test("names are trimmed, and an empty one is not a name", () => {
  assert.equal(flow.cleanName("  Café Hilltop  "), "Café Hilltop");
  assert.equal(flow.cleanName("\tHill Top\n"), "Hill Top");
  assert.equal(flow.cleanName(undefined), "");
  for (const empty of ["", "   ", "\t"]) assert.equal(flow.nameProblem(empty), "empty", JSON.stringify(empty));
  assert.equal(flow.isComplete("name", { name: "" }), false);
  assert.equal(flow.isComplete("name", { name: "   " }), false);
  // Only a trimmed name is complete: the page trims before it stores one.
  assert.equal(flow.isComplete("name", { name: " Hilltop " }), false);
  // Spaces at the ends don't count toward the length.
  assert.equal(flow.nameProblem("  " + "A".repeat(31) + "  "), null);
  assert.equal(flow.isComplete("name", { name: 7 }), false);
});

test("share links carry names with spaces, accents and symbols, and drop ones the firmware refuses", () => {
  for (const name of ["Café Hilltop", "R&D Hill #2", "50% Ridge=1", "Tour d’eau"]) {
    const q = flow.toQuery({ name });
    assert.match(q, /^name=[^ &#=]+$/, name);              // one field, every special character encoded
    assert.deepEqual(flow.fromQuery(q), { name }, name);
  }
  assert.equal(flow.toQuery({ name: "Café Hilltop" }), "name=Caf%C3%A9%20Hilltop");
  assert.equal(flow.toQuery({ name: "Hill:Top" }), "");
  assert.equal(flow.toQuery({ name: "é".repeat(16) }), "");
  assert.deepEqual(flow.fromQuery("name=Hill%3ATop"), {});
  assert.deepEqual(flow.fromQuery("name=" + encodeURIComponent("é".repeat(16))), {});
  // A hand-written link with spaces round the name is read trimmed.
  assert.deepEqual(flow.fromQuery("name=%20%20Hilltop%20"), { name: "Hilltop" });
  assert.deepEqual(flow.fromQuery("name=Caf%C3%A9+Hilltop"), { name: "Café Hilltop" });
});

test("only a board that is reconfigured is asked which firmware it runs", () => {
  const flashing = [
    { type: "repeater", board: "esp32", status: "new" },
    { type: "repeater", board: "nrf52", status: "running", reflash: true },
    { type: "observer", repeat: "both", board: "esp32", status: "running", observerFirmware: "no" },
    { type: "repeater" }
  ];
  for (const a of flashing) {
    assert.equal(flow.route(a), "flash");
    assert.ok(!flow.stepIds(a).includes("version"), JSON.stringify(a));
  }
  const phone = [
    { type: "repeater", board: "esp32", status: "running", reflash: false },
    { type: "observer", repeat: "both", board: "esp32", status: "running", observerFirmware: "yes" }
  ];
  for (const a of phone) {
    assert.equal(flow.route(a), "phone");
    const ids = flow.stepIds(a);
    assert.ok(ids.includes("version"), JSON.stringify(a));
    assert.equal(ids[ids.indexOf("version") + 1], "town");
  }
});

test("firmwareFor assumes the newest firmware when flashing and uses the chosen one on the phone route", () => {
  assert.equal(flow.firmwareFor({ type: "repeater", board: "esp32", status: "new" }), "1.16");
  // A leftover answer from the phone route doesn't count once the board is flashed.
  assert.equal(flow.firmwareFor({ type: "repeater", board: "esp32", status: "running", reflash: true, firmware: "1.14" }), "1.16");
  assert.equal(flow.firmwareFor({}), "1.16");
  assert.equal(flow.firmwareFor(), "1.16");
  const phone = { type: "repeater", board: "esp32", status: "running", reflash: false };
  for (const firmware of flow.VERSIONS) assert.equal(flow.firmwareFor({ ...phone, firmware }), firmware);
  assert.equal(flow.firmwareFor(phone), undefined);
  assert.equal(flow.parseVersion, undefined, "the ver reply is no longer typed in");
});

test("changing an earlier answer resets what depended on it", () => {
  const a = { type: "observer", board: "nrf52", place: { name: "Belleville" }, tag: "ytr", province: "on",
    radio: "canada", role: "edge", neighbours: ["ygk"], external: ["western-new-york"], name: "Belleville_R1" };
  assert.equal(flow.resetDependents(a, "type").board, undefined);           // nRF52 invalid for observer
  const town = flow.resetDependents(a, "place");
  for (const key of ["tag","province","radio","neighbours","external","name"]) assert.equal(town[key], undefined);
  assert.deepEqual(flow.resetDependents({ ...a, role: "city" }, "role").neighbours, undefined);
  assert.equal(flow.resetDependents({ ...a, nameEdited: true }, "place").name, "Belleville_R1"); // keep a typed name
});

test("share links round-trip answers and never carry pasted replies", () => {
  const a = { type: "repeater", board: "esp32", status: "new", tag: "ytr", province: "on", role: "edge", neighbours: ["ygk"], name: "Belleville_R1", regionReply: "*^ F" };
  const q = flow.toQuery(a);
  assert.doesNotMatch(q, /regionReply|%5E/);
  assert.deepEqual(flow.fromQuery(q), { type: "repeater", board: "esp32", status: "new", tag: "ytr", province: "on", role: "edge", neighbours: ["ygk"], name: "Belleville_R1" });
  assert.deepEqual(flow.fromQuery("?tag=YOW&province=qc&step=3"), { tag: "yow", province: "qc" }); // map links; old params ignored
});

// Beyond the brief: the board list, route edge cases, purity and hostile links.

test("the board answer is the kind of board: nrf52 or esp32, and nothing else", () => {
  assert.deepEqual(flow.KINDS, ["nrf52", "esp32"]);
  assert.equal(flow.BOARDS, undefined, "the per-board list is gone");
  assert.equal(flow.toQuery({ board: "nrf52" }), "board=nrf52");
  assert.equal(flow.toQuery({ board: "esp32" }), "board=esp32");
  assert.equal(flow.toQuery({ board: "rak4631" }), "", "a board's name is not an answer any more");
  assert.deepEqual(flow.fromQuery("board=NRF52"), { board: "nrf52" });
  assert.deepEqual(flow.fromQuery("board=esp32"), { board: "esp32" });
});

test("a link made before the kind question maps each old board id to its kind", () => {
  const nrf52 = ["rak4631", "heltec-t114", "xiao-nrf52840", "t-echo", "heltec-mesh-solar", "sensecap-solar-p1", "other-nrf52"];
  const esp32 = ["heltec-v3", "heltec-v4", "heltec-wireless-tracker", "t-beam", "t-beam-supreme", "rak3112", "xiao-esp32s3", "other-esp32"];
  for (const id of nrf52) assert.deepEqual(flow.fromQuery(`type=repeater&board=${id}&status=new`), { type: "repeater", board: "nrf52", status: "new" }, id);
  for (const id of esp32) assert.deepEqual(flow.fromQuery(`type=repeater&board=${id}&status=new`), { type: "repeater", board: "esp32", status: "new" }, id);
  // The old link steers the same steps as the kind does, and writes the kind back out.
  assert.ok(flow.stepIds(flow.fromQuery("type=repeater&board=rak4631&status=new")).includes("bootloader"));
  assert.ok(!flow.stepIds(flow.fromQuery("type=repeater&board=heltec-v3&status=new")).includes("bootloader"));
  assert.equal(flow.toQuery(flow.fromQuery("type=observer&board=heltec-v4")), "type=observer&board=esp32");
  assert.equal(flow.isComplete("board", flow.fromQuery("type=observer&board=rak4631")), false, "an old nRF52 observer link is still blocked");
  assert.equal(flow.isComplete("board", flow.fromQuery("type=observer&board=heltec-v4")), true);
  // Anything else, including names that exist on every object, is dropped.
  for (const id of ["nope", "constructor", "__proto__", "toString", ""]) assert.deepEqual(flow.fromQuery(`board=${id}`), {}, id);
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
  const a = { type: "repeater", board: "nrf52", status: "running", reflash: false };
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
  assert.equal(flow.isComplete("board", { type: "observer", board: "esp32" }), true);
  assert.equal(flow.isComplete("board", { type: "observer", board: "nrf52" }), false);
  assert.equal(flow.isComplete("board", { type: "repeater", board: "rak4631" }), false);      // a board's name is not a kind
  assert.equal(flow.isComplete("board", { board: "nrf52" }), false);                      // type comes first
  assert.equal(flow.isComplete("status", { status: "running" }), true);
  assert.equal(flow.isComplete("reflash", { reflash: false }), true);
  assert.equal(flow.isComplete("reflash", {}), false);
  assert.equal(flow.isComplete("observerFirmware", { observerFirmware: "no" }), true);
  assert.equal(flow.isComplete("bootloader", { bootloader: true }), true);
  assert.equal(flow.isComplete("bootloader", { bootloader: false }), false);
  assert.equal(flow.isComplete("flash", { flashed: true }), true);
  for (const firmware of ["1.14", "1.15", "1.16"]) assert.equal(flow.isComplete("version", { firmware }), true, firmware);
  for (const firmware of ["1.13", "older", "v1.16.0", undefined]) assert.equal(flow.isComplete("version", { firmware }), false, String(firmware));
  assert.equal(flow.isComplete("town", { tag: "ytr" }), false);
  assert.equal(flow.isComplete("radio", { radio: "bc-mesh" }), true);
  assert.equal(flow.isComplete("role", { role: "edge" }), true);
  assert.equal(flow.isComplete("neighbours", { neighbours: [] }), true);                    // a deliberate "none"
  assert.equal(flow.isComplete("neighbours", {}), false);
  assert.equal(flow.isComplete("name", { name: "A".repeat(32) }), false);
  assert.equal(flow.isComplete("name", { name: "Café_R1" }), true);
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
  const a = { type: "repeater", board: "nrf52", status: "running", reflash: true, bootloader: true, flashed: true, firmware: "1.15", regionReply: "*^ F" };
  const copy = JSON.parse(JSON.stringify(a));
  const next = flow.resetDependents(a, "reflash");
  assert.deepEqual(a, copy);
  assert.notEqual(next, a);
  for (const key of ["bootloader", "flashed", "firmware"]) assert.equal(next[key], undefined, key);
  assert.equal(next.board, "nrf52");
  assert.equal(next.reflash, true);
  const other = flow.resetDependents(a, "board");
  for (const key of ["bootloader", "flashed", "firmware", "regionReply"]) assert.equal(other[key], undefined, key);
  const listen = flow.resetDependents({ type: "observer", repeat: "listen", role: "edge", neighbours: ["ygk"], external: ["washington"] }, "repeat");
  for (const key of ["role", "neighbours", "external"]) assert.equal(listen[key], undefined, key);
  const both = flow.resetDependents({ type: "observer", repeat: "both", role: "edge", neighbours: ["ygk"] }, "repeat");
  assert.deepEqual(both.neighbours, ["ygk"]);
});

test("a changed type or board keeps what still applies", () => {
  const a = { type: "repeater", repeat: "both", board: "esp32", status: "running", reflash: false, observerFirmware: "yes", name: "Belleville_R1" };
  const next = flow.resetDependents(a, "type");
  for (const key of ["repeat", "reflash", "observerFirmware", "name"]) assert.equal(next[key], undefined, key);
  assert.equal(next.board, "esp32");
  assert.equal(next.status, "running");
  assert.equal(flow.resetDependents({ type: "observer", board: "esp32" }, "type").board, "esp32");
  assert.equal(flow.resetDependents({ type: "repeater", board: "nrf52" }, "type").board, "nrf52");
  assert.equal(flow.resetDependents({ type: "observer", board: "nrf52" }, "type").board, undefined);   // an observer can't keep nRF52
});

test("share links leave out the firmware version, so whoever opens a phone-route one is asked which it is", () => {
  const q = flow.toQuery({ type: "repeater", board: "esp32", status: "running", reflash: false, firmware: "1.16" });
  assert.equal(q, "type=repeater&board=esp32&status=running&reflash=0");
  // Older links that still carry it are read without it.
  assert.deepEqual(flow.fromQuery("type=repeater&firmware=1.16"), { type: "repeater" });
  assert.equal(flow.isComplete("version", flow.fromQuery("firmware=1.15")), false);
});

test("share links keep only valid, known answers", () => {
  const a = { type: "observer", repeat: "both", board: "esp32", status: "running", observerFirmware: "yes",
    tag: "yvr", province: "bc", radio: "bc-mesh", role: "edge", neighbours: ["yxx", "yyj"], external: ["washington"],
    name: "Vancouver_Obs1", nameEdited: true, shareLocation: true, reflash: false,
    place: { name: "Vancouver", province: "bc", lat: 49.28, lon: -123.12 } };
  const q = flow.toQuery({ ...a, regionReply: "*^ F", firmware: "1.15" });
  assert.doesNotMatch(q, /^\?|place=|regionReply|firmware/);
  const back = flow.fromQuery(q);
  assert.deepEqual(back, a);
  assert.deepEqual(flow.fromQuery("?" + q), a);
  assert.equal(flow.toQuery({}), "");
  assert.deepEqual(flow.fromQuery(""), {});
  assert.deepEqual(flow.fromQuery(flow.toQuery({ role: "edge", neighbours: [] })), { role: "edge", neighbours: [] });

  const hostile = flow.fromQuery("type=wizard&board=nope&tag=a&province=%3Cb%3E&name=a%3Ab&neighbours=ygk,%3Cx%3E,,ytr&external=WESTERN-new-york&radio=x&firmware=1.9&reflash=maybe&__proto__=1&place=Belleville&regionReply=x&password=secret");
  assert.deepEqual(hostile, { neighbours: ["ygk", "ytr"], external: ["western-new-york"] });
  assert.equal(Object.getPrototypeOf(hostile), Object.prototype);
  assert.doesNotMatch(flow.toQuery({ name: "has:colon", tag: "<b>", password: "secret" }), /secret|colon|<b>|password/);
});

test("the chosen town survives a reload: accents kept, coordinates rounded to 4 decimals", () => {
  const a = { type: "repeater", board: "esp32", status: "new", tag: "yul", province: "qc",
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

test("coordinates typed into the location box are read here, in either decimal style", () => {
  const belleville = { lat: 44.1628, lon: -77.3832, inCanada: true };
  for (const typed of ["44.1628, -77.3832", "44.1628,-77.3832", "  44.1628 ,  -77.3832  ", "44.1628; -77.3832", "44.1628;-77.3832",
    "44,1628; -77,3832", "44.1628 -77.3832", "+44.1628, -77.3832"]) {
    assert.deepEqual(flow.parseCoordinates(typed), belleville, typed);
  }
  // More decimals than a map needs are kept here; the commands and the link round them to 4.
  assert.deepEqual(flow.parseCoordinates("44.162812, -77.383241"), { lat: 44.162812, lon: -77.383241, inCanada: true });
  assert.deepEqual(flow.parseCoordinates("45, -75"), { lat: 45, lon: -75, inCanada: true });
});

test("coordinates outside Canada are read, but flagged, so the page can say so plainly", () => {
  for (const typed of ["48.8566, 2.3522", "44.1628, 77.3832", "-77.3832, 44.1628", "40.9, -77", "84.1, -77", "44, -142.1", "44, -51.9", "91, -77"]) {
    const point = flow.parseCoordinates(typed);
    assert.ok(point, typed);
    assert.equal(point.inCanada, false, typed);
  }
  // The edges of the box are in.
  assert.equal(flow.parseCoordinates("41, -142").inCanada, true);
  assert.equal(flow.parseCoordinates("84, -52").inCanada, true);
});

test("anything that isn't two numbers is not coordinates: a town, an address or a postal code is searched instead", () => {
  for (const typed of ["", "   ", "Belleville", "111 Wellington Street, Ottawa", "100 Mile House", "K1A 0A9", "44.1628", "44.1628, -77.3832, 12",
    "44.1.2, -77", "1e3, -77", "44.1628, -77.3832 Ontario", "0x2C, -77", "44.1628,,-77.3832", null, undefined, 44]) {
    assert.equal(flow.parseCoordinates(typed), null, String(typed));
  }
});

// Belleville is 44.1628, -77.3832: 44°09'46.1"N 77°22'59.5"W.
const near = (point, lat, lon) => point && point.inCanada && Math.abs(point.lat - lat) < 0.00005 && Math.abs(point.lon - lon) < 0.00005;

test("coordinates are read in the other forms people copy: comma decimals, N/S/E/W (or O), degrees, brackets, a real minus sign", () => {
  for (const typed of [
    "44,1628 -77,3832", "44,1628, -77,3832", "44,1628,-77,3832",
    "N44.1628 W77.3832", "N 44.1628, W 77.3832", "44.1628N 77.3832W", "44.1628 N 77.3832 W",
    "44.1628° N, 77.3832° W", "44.1628°N 77.3832°O", "44,1628° N; 77,3832° O", "n44.1628 w77.3832",
    "W77.3832 N44.1628",                                       // longitude first, but the letters say which is which
    "44.1628°, -77.3832°", "(44.1628, -77.3832)", "[44.1628, -77.3832]",
    "44.1628, \u221277.3832", "44.1628, \u201377.3832",
    "44°09'46.1\"N 77°22'59.5\"W", "44° 9′ 46.1″ N, 77° 22′ 59.5″ W", "N 44°09.768' W 77°22.992'",
  ]) {
    assert.ok(near(flow.parseCoordinates(typed), 44.1628, -77.3832), `${typed} -> ${JSON.stringify(flow.parseCoordinates(typed))}`);
  }
  // South and East are read too, and land outside Canada.
  assert.equal(flow.parseCoordinates("33.86 S, 151.21 E").inCanada, false);
  assert.ok(flow.parseCoordinates("33.86 S, 151.21 E").lat < 0);
});

test("coordinate-looking text that can't be read is not coordinates, and is never searched", () => {
  for (const typed of ["N44.1628 N77.3832", "W44 W77", "44°61'N 77°W", "44°09'75\"N 77°22'W", "N44.1628 -77.3832 W 12"]) {
    assert.equal(flow.parseCoordinates(typed), null, typed);
    assert.equal(flow.looksLikeCoordinates(typed), true, typed);
  }
  // Text with no letters but N, S, E, W or O and degree or minute marks stays on the page.
  for (const typed of ["44.1628", "44.1628, -77.3832, 12", "44,1628, -77", "44°09'46\"", "N44", "(44.16)", "44 / -77", "-77.3832 W", "44.1.2, -77"]) {
    assert.equal(flow.looksLikeCoordinates(typed), true, typed);
  }
  for (const typed of ["Belleville", "111 Wellington Street, Ottawa", "100 Mile House", "K1A 0A9", "ytr", "Nord", "", "   ", null]) {
    assert.equal(flow.looksLikeCoordinates(typed), false, String(typed));
  }
});

test("names are suggested from a street address's municipality, and from the region for coordinates", () => {
  const address = { name: "111 Wellington Street, Ottawa", province: "on", lat: 45.4231, lon: -75.6988, kind: "address" };
  assert.equal(flow.suggestName({ type: "repeater", place: address }), "Ottawa_R1");
  assert.equal(flow.suggestName({ type: "observer", place: { ...address, name: "1 Rue Notre-Dame Est, Montréal" } }), "Montreal_Obs1");
  const point = { name: "44.1628, -77.3832", province: "on", lat: 44.1628, lon: -77.3832, kind: "coordinates" };
  assert.equal(flow.suggestName({ type: "repeater", place: point }, "Quinte West"), "QuinteWest_R1");
  assert.equal(flow.suggestName({ type: "repeater", place: point }), "");             // no region label, no suggestion
  assert.equal(flow.suggestName({ type: "repeater", place: point, status: "running" }, "Quinte West"), "");
  // A town still gives its own name, whatever region label comes with it.
  assert.equal(flow.suggestName({ type: "repeater", place: { name: "Belleville" } }, "Quinte West"), "Belleville_R1");
});

test("a place from an address or coordinates keeps its kind in a share link, and never the typed search", () => {
  const address = { name: "111 Wellington Street, Ottawa", province: "on", lat: 45.42312333, lon: -75.69876476, kind: "address" };
  const q = flow.toQuery({ tag: "yow", province: "on", place: address });
  assert.match(q, /(?:^|&)town=111%20Wellington%20Street%2C%20Ottawa(?:&|$)/);
  assert.match(q, /(?:^|&)kind=address(?:&|$)/);
  assert.match(q, /(?:^|&)lat=45\.4231&lon=-75\.6988(?:&|$)/);
  assert.doesNotMatch(q, /(?:^|&)place=/);
  assert.deepEqual(flow.fromQuery(q).place, { ...address, lat: 45.4231, lon: -75.6988 });
  const point = { name: "44.1628, -77.3832", province: "on", lat: 44.1628, lon: -77.3832, kind: "coordinates" };
  assert.deepEqual(flow.fromQuery(flow.toQuery({ tag: "ytr", province: "on", place: point })).place, point);
  // A town has no kind, as before; an unknown kind is dropped and the place read as a town.
  assert.doesNotMatch(flow.toQuery({ place: { name: "Belleville", lat: 44.1628, lon: -77.3832 } }), /kind=/);
  assert.doesNotMatch(flow.toQuery({ place: { name: "Belleville", lat: 44.1628, lon: -77.3832, kind: "nonsense" } }), /kind=/);
  assert.deepEqual(flow.fromQuery("town=Belleville&kind=wizard&lat=44.1628&lon=-77.3832").place, { name: "Belleville", lat: 44.1628, lon: -77.3832 });
  // A kind on its own, with no place, is nothing.
  assert.deepEqual(flow.fromQuery("kind=address"), {});
});

test("with location disabled, the spot stays out of the link for every kind of place; the region still comes back", () => {
  const town = { name: "Belleville", province: "on", lat: 44.1628, lon: -77.3832 };
  const address = { name: "111 Wellington Street, Ottawa", province: "on", lat: 45.4231, lon: -75.6988, kind: "address" };
  const point = { name: "44.1628, -77.3832", province: "on", lat: 44.1628, lon: -77.3832, kind: "coordinates" };
  // A pin can be dragged to the exact spot whatever was searched, so a town is left out too.
  for (const place of [town, address, point]) {
    const label = place.kind || "town";
    const q = flow.toQuery({ tag: "yow", province: "on", place, shareLocation: false });
    assert.doesNotMatch(q, /(?:^|&)(?:town|kind|lat|lon)=/, label);
    assert.doesNotMatch(q, /Belleville|Wellington|44\.1628|77\.3832|45\.4231/, label);
    assert.deepEqual(flow.fromQuery(q), { tag: "yow", province: "on", shareLocation: false }, label);
    // Not disabled (the default), the spot is in the link.
    assert.match(flow.toQuery({ tag: "yow", province: "on", place, shareLocation: true }), /(?:^|&)lat=/, label);
    assert.match(flow.toQuery({ tag: "yow", province: "on", place }), /(?:^|&)lat=/, label);
  }
});

test("the pin's coordinates travel in the link, rounded to 4 decimals, with the town and kind as before", () => {
  // The person dragged the pin away from where the search put it: the link holds the pin.
  for (const place of [{ name: "Belleville", province: "on", lat: 44.21234, lon: -77.45678 },
    { name: "111 Wellington Street, Ottawa", province: "on", lat: 45.42001, lon: -75.70049, kind: "address" },
    { name: "44.2123, -77.4568", province: "on", lat: 44.2123, lon: -77.4568, kind: "coordinates" }]) {
    const label = place.kind || "town";
    const q = flow.toQuery({ tag: "ytr", province: "on", place });
    const back = flow.fromQuery(q).place;
    assert.equal(back.name, place.name, label);
    assert.equal(back.kind, place.kind, label);
    assert.equal(back.lat, Math.round(place.lat * 10000) / 10000, label);
    assert.equal(back.lon, Math.round(place.lon * 10000) / 10000, label);
    // Read back and written again, it is the same link.
    assert.equal(flow.toQuery({ tag: "ytr", province: "on", place: back }), q, label);
  }
});

test("the map location step is done once the pin is in Canada, or location is disabled", () => {
  const pin = { name: "Belleville", province: "on", lat: 44.1628, lon: -77.3832 };
  assert.equal(flow.isComplete("location", { place: pin }), true);
  assert.equal(flow.isComplete("location", { place: pin, shareLocation: true }), true);
  assert.equal(flow.isComplete("location", { place: { ...pin, kind: "address" } }), true);
  // No pin yet: location is on by default, so it waits.
  assert.equal(flow.isComplete("location", {}), false);
  assert.equal(flow.isComplete("location", { tag: "ytr", province: "on" }), false);
  // Disabled, nothing more is needed, with or without a pin.
  assert.equal(flow.isComplete("location", { shareLocation: false }), true);
  assert.equal(flow.isComplete("location", { place: pin, shareLocation: false }), true);
  // A pin outside Canada, or one that isn't two numbers, is not a pin.
  for (const bad of [{ ...pin, lat: 12 }, { ...pin, lon: -20 }, { ...pin, lat: NaN }, { ...pin, lat: "44.1" }, { name: "Belleville" }]) {
    assert.equal(flow.isComplete("location", { place: bad }), false, JSON.stringify(bad));
  }
});

test("a new town or place resets the pin; other answers leave it where the person put it", () => {
  const moved = { type: "repeater", board: "esp32", status: "new", tag: "ytr", province: "on", role: "city", name: "Belleville_R1",
    place: { name: "Belleville", province: "on", lat: 44.2123, lon: -77.4568 } };
  // The town step stores the new place whole, so its point replaces the dragged pin.
  const kingston = { name: "Kingston", province: "on", lat: 44.22976, lon: -76.48098 };
  assert.deepEqual(flow.resetDependents({ ...moved, place: kingston }, "place").place, kingston);
  // A disabled location stays disabled: the person said not to show it.
  assert.equal(flow.resetDependents({ ...moved, place: kingston, shareLocation: false }, "place").shareLocation, false);
  for (const key of ["type", "board", "status", "tag", "role", "name"]) {
    assert.deepEqual(flow.resetDependents(moved, key).place, moved.place, key);
  }
});

test("typed pin coordinates are read in either decimal style, and only inside Canada", () => {
  assert.deepEqual(flow.readPin("44.1628", "-77.3832"), { lat: 44.1628, lon: -77.3832 });
  assert.deepEqual(flow.readPin(" 44,1628 ", "-77,3832"), { lat: 44.1628, lon: -77.3832 });   // French decimal commas
  assert.deepEqual(flow.readPin("+44.1628", "−77.3832"), { lat: 44.1628, lon: -77.3832 }); // a real minus sign
  assert.deepEqual(flow.readPin("44", "-77"), { lat: 44, lon: -77 });
  // Outside the box the tool uses for Canada: the longitude's minus sign forgotten, or a latitude too far south.
  for (const [lat, lon] of [["44.1628", "77.3832"], ["12", "-77"], ["90", "-77"], ["44", "-170"]]) {
    assert.equal(flow.readPin(lat, lon), null, `${lat}, ${lon}`);
  }
  // Anything that isn't one plain number in each box.
  for (const [lat, lon] of [["", "-77"], ["44.16", ""], ["abc", "-77"], ["44.1628, -77.3832", "-77"], ["0x2C", "-77"], ["1e1", "-77"],
    ["44.", "-77"], ["44..1", "-77"], [undefined, "-77"], [44.1, -77]]) {
    assert.equal(flow.readPin(lat, lon), null, `${lat}, ${lon}`);
  }
});

test("the 'I did this' ticks never go into a share link", () => {
  assert.equal(flow.toQuery({ bootloader: true, flashed: true }), "");
  const q = flow.toQuery({ type: "repeater", board: "nrf52", status: "new", bootloader: true, flashed: true });
  assert.doesNotMatch(q, /bootloader|flashed/);
  assert.deepEqual(flow.fromQuery(q), { type: "repeater", board: "nrf52", status: "new" });
  assert.deepEqual(flow.fromQuery("bootloader=1&flashed=1&type=repeater"), { type: "repeater" });
});

// A scope the person and a network across the border agreed between themselves. It is one flat tag,
// checked with the generator's own rule (/^[a-z0-9-]{1,29}$/), and stored already trimmed and lower-case.

test("a custom scope is lower-cased and trimmed, and held to the generator's rule", () => {
  assert.equal(flow.cleanCustom("  QCNY2 "), "qcny2");
  assert.equal(flow.cleanCustom(undefined), "");
  assert.equal(flow.cleanCustom(7), "");
  for (const good of ["qcny2", "a", "on", "a-b-c", "0", "x".repeat(29)]) {
    assert.equal(flow.customProblem(good), null, good);
    assert.equal(flow.isCustom(good), true, good);
  }
  assert.equal(flow.customProblem("  QCNY2 "), null, "typed text is cleaned before it is judged");
  assert.equal(flow.customProblem(""), "empty");
  assert.equal(flow.customProblem("   "), "empty");
  assert.equal(flow.customProblem(undefined), "empty");
  for (const bad of ["two words", "qc_ny", "québec", "#qcny", "qc.ny", "qc/ny", "<b>", "x".repeat(30), "qc\nny", "*"]) {
    assert.equal(flow.customProblem(bad), "characters", bad);
    assert.equal(flow.isCustom(bad), false, bad);
  }
  // A stored answer is already clean: untidy text is not an answer.
  for (const untidy of ["QCNY2", " qcny2", "qcny2 ", "", undefined, null, 7, ["qcny2"]]) assert.equal(flow.isCustom(untidy), false, String(untidy));
});

test("the role and neighbours steps wait for a ticked custom scope to be valid", () => {
  const city = { role: "city" };
  assert.equal(flow.isComplete("role", city), true);
  assert.equal(flow.isComplete("role", { ...city, custom: "qcny2" }), true);
  assert.equal(flow.isComplete("role", { ...city, custom: "" }), false, "ticked but empty");
  assert.equal(flow.isComplete("role", { ...city, custom: "bad name" }), false, "ticked but invalid");
  assert.equal(flow.isComplete("role", { ...city, custom: "QCNY2" }), false, "stored text is already lower-case");
  // An edge repeater types it on the neighbours step, so the role step doesn't hold it back.
  assert.equal(flow.isComplete("role", { role: "edge", custom: "" }), true);
  assert.equal(flow.isComplete("neighbours", { neighbours: [] }), true);
  assert.equal(flow.isComplete("neighbours", { neighbours: ["ygk"], custom: "qcny2" }), true);
  assert.equal(flow.isComplete("neighbours", { neighbours: [], custom: "" }), false);
  assert.equal(flow.isComplete("neighbours", { neighbours: [], custom: "bad name" }), false);
  assert.equal(flow.isComplete("neighbours", { custom: "qcny2" }), false, "still needs the neighbours answer");
  // Other steps don't care.
  assert.equal(flow.isComplete("name", { name: "Belleville_R1", custom: "" }), true);
});

test("a custom scope is cleared when the region or role changes, like the cross-border networks", () => {
  const a = { place: { name: "Belleville" }, tag: "ytr", province: "on", role: "edge", neighbours: ["ygk"], external: ["western-new-york"], custom: "qcny2", name: "Belleville_R1" };
  for (const key of ["place", "tag", "role"]) assert.equal(flow.resetDependents(a, key).custom, undefined, key);
  assert.equal(flow.resetDependents(a, "role").external, undefined);
  // A listen-only repeater observer has no scopes at all.
  assert.equal(flow.resetDependents({ type: "observer", repeat: "listen", custom: "qcny2" }, "repeat").custom, undefined);
  assert.equal(flow.resetDependents({ type: "observer", repeat: "both", custom: "qcny2" }, "repeat").custom, "qcny2");
  // Other answers leave it be.
  assert.equal(flow.resetDependents(a, "type").custom, "qcny2");
  assert.equal(flow.resetDependents(a, "board").custom, "qcny2");
});

test("a custom scope travels in the share link as custom=<tag>, and a bad one is dropped", () => {
  const a = { type: "repeater", board: "esp32", status: "new", tag: "ytr", province: "on", role: "city", external: ["ontario-new-york"], custom: "qcny2", name: "Belleville_R1" };
  const q = flow.toQuery(a);
  assert.match(q, /(?:^|&)custom=qcny2(?:&|$)/);
  assert.deepEqual(flow.fromQuery(q), a);
  assert.deepEqual(flow.fromQuery("custom=a-b-9"), { custom: "a-b-9" });
  // Written links never hold an empty (ticked but not typed) or invalid one.
  for (const bad of ["", "bad name", "QCNY2", "x".repeat(30), "québec", undefined, null, 7]) assert.doesNotMatch(flow.toQuery({ role: "city", custom: bad }), /custom/, String(bad));
  // Read links are cleaned the way typing is, then judged by the same rule.
  assert.deepEqual(flow.fromQuery("custom=QCNY2"), { custom: "qcny2" });
  assert.deepEqual(flow.fromQuery("custom=%20qcny2%20"), { custom: "qcny2" });
  for (const bad of ["custom=", "custom=bad%20name", "custom=" + "x".repeat(30), "custom=qu%C3%A9bec", "custom=%3Cb%3E", "custom=a,b", "custom=*"]) {
    assert.deepEqual(flow.fromQuery(bad), {}, bad);
  }
});
