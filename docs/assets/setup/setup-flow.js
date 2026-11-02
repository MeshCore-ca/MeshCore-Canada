// Step flow for the guided repeater setup tool: which questions apply, whether
// each one is answered, how a "ver" reply is read, and the share-link format.
// Pure logic only. No DOM, no network, no text shown to people (see setup-text.js).
(function () {
  "use strict";

  // Boards in the official MeshCore web flasher (flasher.meshcore.io, shown at
  // flasher.meshcore.co.uk) for repeaters. `observerFlasher` is true only for
  // boards the MQTT Observer Firmware flasher (observer.gessaman.com) lists, which
  // is ESP32 only. Board names are proper nouns and are not translated; only the
  // "not listed" entries carry a French name.
  var BOARDS = [
    { id: "rak4631", name: "RAK4631 (WisBlock)", chip: "nrf52", observerFlasher: false },
    { id: "heltec-t114", name: "Heltec T114", chip: "nrf52", observerFlasher: false },
    { id: "xiao-nrf52840", name: "Seeed XIAO nRF52840", chip: "nrf52", observerFlasher: false },
    { id: "t-echo", name: "LilyGO T-Echo", chip: "nrf52", observerFlasher: false },
    { id: "heltec-mesh-solar", name: "Heltec MeshSolar / MeshTower", chip: "nrf52", observerFlasher: false },
    { id: "sensecap-solar-p1", name: "Seeed SenseCAP Solar Node P1", chip: "nrf52", observerFlasher: false },
    { id: "other-nrf52", name: "My board isn't listed", nameFr: "Ma carte n’est pas dans la liste", chip: "nrf52", observerFlasher: false },
    { id: "heltec-v3", name: "Heltec V3", chip: "esp32", observerFlasher: true },
    { id: "heltec-v4", name: "Heltec V4", chip: "esp32", observerFlasher: true },
    { id: "heltec-wireless-tracker", name: "Heltec Wireless Tracker", chip: "esp32", observerFlasher: true },
    { id: "t-beam", name: "LilyGO T-Beam", chip: "esp32", observerFlasher: true },
    { id: "t-beam-supreme", name: "LilyGO T-Beam Supreme", chip: "esp32", observerFlasher: true },
    { id: "rak3112", name: "RAK WisBlock 3112", chip: "esp32", observerFlasher: true },
    { id: "xiao-esp32s3", name: "Seeed XIAO ESP32-S3", chip: "esp32", observerFlasher: true },
    { id: "other-esp32", name: "My board isn't listed", nameFr: "Ma carte n’est pas dans la liste", chip: "esp32", observerFlasher: false }
  ];

  var VERSIONS = ["1.14", "1.15", "1.16"];
  var TYPES = ["repeater", "observer"];
  var REPEAT = ["both", "listen"];
  var STATUS = ["new", "running"];
  var YES_NO = ["yes", "no"];
  var ROLES = ["city", "edge"];

  var TAG_RE = /^[a-z0-9-]{2,12}$/;      // region and province codes
  var ID_RE = /^[a-z0-9-]{2,32}$/;       // radio profiles, neighbouring regions, cross-border networks
  var NAME_RE = /^[A-Za-z0-9_-]+$/;      // letters, digits, _ and -; no spaces or accents
  var MAX_NAME = 31;                     // keeps the name inside MeshCore's 32-byte name field
  var MAX_LIST = 32;                     // a device holds at most 32 regions

  function board(id) {
    for (var i = 0; i < BOARDS.length; i += 1) if (BOARDS[i].id === id) return BOARDS[i];
    return null;
  }

  function chip(answers) {
    var found = board(answers.board);
    return found ? found.chip : null;
  }

  function isText(value, pattern) { return typeof value === "string" && pattern.test(value); }
  function isName(value) { return isText(value, NAME_RE) && value.length <= MAX_NAME; }
  function oneOf(list, value) { return list.indexOf(value) !== -1; }

  function listenOnly(answers) { return answers.type === "observer" && answers.repeat === "listen"; }

  // "phone" when the board already runs the right firmware and is left as it is;
  // everything else, including questions not yet answered, flashes.
  function route(answers) {
    var a = answers || {};
    if (a.status !== "running") return "flash";
    if (a.type === "repeater" && a.reflash === false) return "phone";
    if (a.type === "observer" && a.observerFirmware === "yes") return "phone";
    return "flash";
  }

  function stepIds(answers, context) {
    var a = answers || {};
    var flashing = route(a) === "flash";
    var steps = ["type"];
    if (a.type === "observer") steps.push("repeat");
    steps.push("board", "status");
    if (a.status === "running" && a.type === "repeater") steps.push("reflash");
    if (a.status === "running" && a.type === "observer") steps.push("observerFirmware");
    if (flashing && a.type === "repeater" && chip(a) === "nrf52") steps.push("bootloader");
    if (flashing) steps.push("flash");
    steps.push("version", "town");
    // The radio settings are only written when flashing; a running repeater keeps its own.
    if (flashing && context && context.radioOptions > 1) steps.push("radio");
    if (!listenOnly(a)) {
      steps.push("role");
      if (a.role === "edge") steps.push("neighbours");
    }
    steps.push("name", "commands", "check");
    return steps;
  }

  function isComplete(stepId, answers) {
    var a = answers || {};
    switch (stepId) {
      case "type": return oneOf(TYPES, a.type);
      case "repeat": return oneOf(REPEAT, a.repeat);
      case "board": {
        var found = board(a.board);
        if (!found || !oneOf(TYPES, a.type)) return false;
        return a.type !== "observer" || found.chip === "esp32";
      }
      case "status": return oneOf(STATUS, a.status);
      case "reflash": return typeof a.reflash === "boolean";
      case "observerFirmware": return oneOf(YES_NO, a.observerFirmware);
      case "bootloader": return a.bootloader === true;
      case "flash": return a.flashed === true;
      case "version": return oneOf(VERSIONS, a.firmware);
      case "town": return isText(a.tag, TAG_RE) && isText(a.province, TAG_RE);
      case "radio": return isText(a.radio, ID_RE);
      case "role": return oneOf(ROLES, a.role);
      // An empty list is a deliberate "none"; the screen sets it when the person says so.
      case "neighbours": return Array.isArray(a.neighbours);
      case "name": return isName(a.name);
      // These two screens hold no answers. The screen decides when to move on.
      case "commands":
      case "check": return true;
      default: return false;
    }
  }

  // Reads a reply to the `ver` command (or just a version someone typed).
  function parseVersion(text) {
    var found = /(\d+)\.(\d+)/.exec(String(text == null ? "" : text));
    if (!found) return { firmware: null, tooOld: false };
    var major = parseInt(found[1], 10);
    var minor = parseInt(found[2], 10);
    if (major < 1 || (major === 1 && minor < 14)) return { firmware: null, tooOld: true };
    if (major > 1 || minor > 16) return { firmware: "1.16", tooOld: false };
    return { firmware: "1." + minor, tooOld: false };
  }

  // What each answer feeds. Changing the key clears the answers listed against it.
  // "name" is cleared only while it is still the suggested name, not one the person typed.
  var DEPENDENTS = {
    type: ["repeat", "reflash", "observerFirmware", "bootloader", "flashed", "firmware", "regionReply", "name"],
    board: ["bootloader", "flashed", "firmware", "regionReply"],
    status: ["reflash", "observerFirmware", "bootloader", "flashed", "firmware", "regionReply", "name"],
    reflash: ["bootloader", "flashed", "firmware"],
    observerFirmware: ["flashed", "firmware"],
    place: ["tag", "province", "radio", "neighbours", "external", "name"],
    tag: ["radio", "neighbours", "external"],
    role: ["neighbours", "external"]
  };

  function resetDependents(answers, changedKey) {
    var next = Object.assign({}, answers);
    (DEPENDENTS[changedKey] || []).forEach(function (key) {
      if (key === "name" && next.nameEdited) return;
      delete next[key];
    });
    if (changedKey === "repeat" && next.repeat === "listen") {
      delete next.role;
      delete next.neighbours;
      delete next.external;
    }
    // A repeater observer is ESP32 only, so an nRF52 board can't stay selected.
    if (next.type === "observer" && chip(next) === "nrf52") delete next.board;
    return next;
  }

  var ACCENTED = { "œ": "oe", "Œ": "OE", "æ": "ae", "Æ": "AE" };

  // A name for a new board, from its town. A board that is already running has a name
  // people know it by, so nothing is suggested: the person types it to keep it, or a new one.
  function suggestName(answers) {
    var a = answers || {};
    if (a.status === "running") return "";
    var town = a.place && typeof a.place.name === "string" ? a.place.name : "";
    var letters = town
      .replace(/[ŒœÆæ]/g, function (ch) { return ACCENTED[ch]; })
      .normalize("NFD")
      .replace(/[^A-Za-z]/g, "");
    if (!letters) return "";
    var suffix = a.type === "observer" ? "_Obs1" : "_R1";
    return letters.slice(0, MAX_NAME - suffix.length) + suffix;
  }

  // Share links: the non-secret answers, plus the picked town (as town, lat and lon).
  // Never carried: pasted device replies, and the "I flashed it" / "I updated the
  // bootloader" ticks, which a shared link must not pre-tick for someone else.
  // Each field knows how to write and read itself.
  function enumField(key, values) {
    return {
      key: key,
      write: function (value) { return oneOf(values, value) ? value : null; },
      read: function (text) { text = text.toLowerCase(); return oneOf(values, text) ? text : undefined; }
    };
  }

  function flagField(key) {
    return {
      key: key,
      write: function (value) { return typeof value === "boolean" ? (value ? "1" : "0") : null; },
      read: function (text) { return text === "1" ? true : text === "0" ? false : undefined; }
    };
  }

  function codeField(key, pattern) {
    return {
      key: key,
      write: function (value) { return isText(value, pattern) ? value : null; },
      read: function (text) { text = text.toLowerCase(); return pattern.test(text) ? text : undefined; }
    };
  }

  function listField(key) {
    return {
      key: key,
      write: function (value) {
        if (!Array.isArray(value)) return null;
        return value.filter(function (item) { return isText(item, ID_RE); }).slice(0, MAX_LIST).join(",");
      },
      read: function (text) {
        return text.toLowerCase().split(",").filter(function (item) { return ID_RE.test(item); }).slice(0, MAX_LIST);
      }
    };
  }

  var FIELDS = [
    enumField("type", TYPES),
    enumField("repeat", REPEAT),
    enumField("board", BOARDS.map(function (item) { return item.id; })),
    enumField("status", STATUS),
    flagField("reflash"),
    enumField("observerFirmware", YES_NO),
    enumField("firmware", VERSIONS),
    codeField("tag", TAG_RE),
    codeField("province", TAG_RE),
    codeField("radio", ID_RE),
    enumField("role", ROLES),
    listField("neighbours"),
    listField("external"),
    { key: "name",
      write: function (value) { return isName(value) ? value : null; },
      read: function (text) { return isName(text) ? text : undefined; } },
    flagField("nameEdited"),
    flagField("shareLocation")
  ];

  // The picked town travels as town, lat and lon (4 decimals, about 10 m) so a reload or a
  // language switch needs no new search. It is not called "place": `?place=<text>` is the
  // deep link that starts the town search. The place's province is the `province` answer.
  var MAX_TOWN = 80;
  var CANADA = { latMin: 41, latMax: 84, lonMin: -142, lonMax: -52 };
  var DECIMAL_RE = /^-?\d+(\.\d+)?$/;

  function round4(value) { return Math.round(value * 10000) / 10000; }

  function validTown(name) {
    return typeof name === "string" && name.trim().length > 0 && name.length <= MAX_TOWN;
  }

  function inCanada(lat, lon) {
    return isFinite(lat) && isFinite(lon) &&
      lat >= CANADA.latMin && lat <= CANADA.latMax && lon >= CANADA.lonMin && lon <= CANADA.lonMax;
  }

  function placeParts(place) {
    if (!place || typeof place.lat !== "number" || typeof place.lon !== "number" || !validTown(place.name)) return [];
    var lat = round4(place.lat);
    var lon = round4(place.lon);
    if (!inCanada(lat, lon)) return [];
    return ["town=" + encodeURIComponent(place.name), "lat=" + lat, "lon=" + lon];
  }

  function readPlace(params, province) {
    var name = params.get("town");
    var lat = params.get("lat");
    var lon = params.get("lon");
    if (!validTown(name) || !DECIMAL_RE.test(lat || "") || !DECIMAL_RE.test(lon || "")) return undefined;
    lat = parseFloat(lat);
    lon = parseFloat(lon);
    if (!inCanada(lat, lon)) return undefined;
    var place = { name: name };
    if (province !== undefined) place.province = province;
    place.lat = lat;
    place.lon = lon;
    return place;
  }

  function toQuery(answers) {
    var a = answers || {};
    var parts = [];
    FIELDS.forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(a, field.key)) return;
      var text = field.write(a[field.key]);
      if (text !== null) parts.push(field.key + "=" + text);
    });
    return parts.concat(placeParts(a.place)).join("&");
  }

  function fromQuery(search) {
    var params = new URLSearchParams(String(search == null ? "" : search).replace(/^\?/, ""));
    var answers = {};
    FIELDS.forEach(function (field) {
      if (!params.has(field.key)) return;
      var value = field.read(params.get(field.key));
      if (value !== undefined) answers[field.key] = value;
    });
    var place = readPlace(params, answers.province);
    if (place) answers.place = place;
    return answers;
  }

  globalThis.MeshCoreSetupFlow = {
    BOARDS: BOARDS,
    stepIds: stepIds,
    isComplete: isComplete,
    route: route,
    parseVersion: parseVersion,
    resetDependents: resetDependents,
    suggestName: suggestName,
    toQuery: toQuery,
    fromQuery: fromQuery
  };
}());
