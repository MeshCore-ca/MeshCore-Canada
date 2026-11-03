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

test("share links leave out the firmware version, so whoever opens one is asked for the ver reply", () => {
  const q = flow.toQuery({ type: "repeater", board: "heltec-v3", status: "running", reflash: false, firmware: "1.16" });
  assert.equal(q, "type=repeater&board=heltec-v3&status=running&reflash=0");
  // Older links that still carry it are read without it.
  assert.deepEqual(flow.fromQuery("type=repeater&firmware=1.16"), { type: "repeater" });
  assert.equal(flow.isComplete("version", flow.fromQuery("firmware=1.15")), false);
});

test("share links keep only valid, known answers", () => {
  const a = { type: "observer", repeat: "both", board: "heltec-v4", status: "running", observerFirmware: "yes",
    tag: "yvr", province: "bc", radio: "bc-mesh", role: "edge", neighbours: ["yxx", "yyj"], external: ["washington"],
    name: "Vancouver_Obs1", nameEdited: true, shareLocation: false, reflash: false,
    place: { name: "Vancouver", province: "bc", lat: 49.28, lon: -123.12 } };
  const q = flow.toQuery({ ...a, regionReply: "*^ F", firmware: "1.15" });
  assert.doesNotMatch(q, /^\?|place=|regionReply|firmware/);
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
    "44.1.2, -77", "1e3, -77", "44,1628, -77,3832", "44.1628, -77.3832 Ontario", "0x2C, -77", "44.1628,,-77.3832", null, undefined, 44]) {
    assert.equal(flow.parseCoordinates(typed), null, String(typed));
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

test("the 'I did this' ticks never go into a share link", () => {
  assert.equal(flow.toQuery({ bootloader: true, flashed: true }), "");
  const q = flow.toQuery({ type: "repeater", board: "rak4631", status: "new", bootloader: true, flashed: true });
  assert.doesNotMatch(q, /bootloader|flashed/);
  assert.deepEqual(flow.fromQuery(q), { type: "repeater", board: "rak4631", status: "new" });
  assert.deepEqual(flow.fromQuery("bootloader=1&flashed=1&type=repeater"), { type: "repeater" });
});
