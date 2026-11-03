// Step flow for the guided repeater setup tool: which questions apply, whether
// each one is answered, which firmware the commands are for, and the share-link format.
// Pure logic only. No DOM, no network, no text shown to people (see setup-text.js).
(function () {
  "use strict";

  // The board step asks only what kind of board it is, because the kind is all the steps
  // depend on: an nRF52 repeater updates its bootloader first, and a repeater observer
  // needs Wi-Fi, so it is ESP32 only. The flasher itself asks for the exact board.
  var KINDS = ["nrf52", "esp32"];

  // Share links made while the step listed every board carry a board id; each one maps
  // to its kind, so those links keep working. Links written now carry the kind.
  var OLD_BOARDS = {
    "rak4631": "nrf52", "heltec-t114": "nrf52", "xiao-nrf52840": "nrf52", "t-echo": "nrf52",
    "heltec-mesh-solar": "nrf52", "sensecap-solar-p1": "nrf52", "other-nrf52": "nrf52",
    "heltec-v3": "esp32", "heltec-v4": "esp32", "heltec-wireless-tracker": "esp32", "t-beam": "esp32",
    "t-beam-supreme": "esp32", "rak3112": "esp32", "xiao-esp32s3": "esp32", "other-esp32": "esp32"
  };

  // The firmware versions the commands are written for. A flashed board gets the newest.
  var VERSIONS = ["1.14", "1.15", "1.16"];
  var NEWEST = "1.16";
  var TYPES = ["repeater", "observer"];
  var REPEAT = ["both", "listen"];
  var STATUS = ["new", "running"];
  var YES_NO = ["yes", "no"];
  var ROLES = ["city", "edge"];

  var TAG_RE = /^[a-z0-9-]{2,12}$/;      // region and province codes
  var ID_RE = /^[a-z0-9-]{2,32}$/;       // radio profiles, neighbouring regions, cross-border networks
  // A scope agreed with a network across the border, typed by hand. The same rule as the region
  // generator's own check of a scope name (MeshCoreIataScopes budget), so what is accepted here is
  // never refused there.
  var CUSTOM_RE = /^[a-z0-9-]{1,29}$/;
  // The firmware's own rule for `set name <rest of line>`: it refuses only these characters
  // (CommonCLI isValidName), and keeps at most 31 bytes in its 32-byte name field, so an
  // accented letter (2 bytes in UTF-8) counts as two. Control characters are refused here too.
  var NAME_REFUSED = /[\[\]\\:,?*\u0000-\u001f\u007f-\u009f]/;
  var MAX_NAME = 31;                     // bytes in UTF-8
  var MAX_LIST = 32;                     // a device holds at most 32 regions

  // The board answer is the kind itself: "nrf52", "esp32", or null while unanswered.
  function chip(answers) {
    return oneOf(KINDS, answers.board) ? answers.board : null;
  }

  function isText(value, pattern) { return typeof value === "string" && pattern.test(value); }

  // Leading and trailing spaces are dropped before a name is used.
  function cleanName(text) { return typeof text === "string" ? text.trim() : ""; }

  // What is wrong with a name: "empty", "characters" (one the firmware refuses) or "long"
  // (over 31 bytes). null when the firmware will take it.
  function nameProblem(value) {
    var name = cleanName(value);
    if (!name) return "empty";
    if (NAME_REFUSED.test(name)) return "characters";
    if (new TextEncoder().encode(name).length > MAX_NAME) return "long";
    return null;
  }

  // A custom scope as typed: spaces round it are dropped and capitals become lower case.
  function cleanCustom(text) { return typeof text === "string" ? text.trim().toLowerCase() : ""; }

  // What is wrong with a custom scope: "empty" or "characters" (anything the generator would refuse,
  // such as a space, an accent or more than 29 characters). null when it will do.
  function customProblem(value) {
    var tag = cleanCustom(value);
    if (!tag) return "empty";
    return CUSTOM_RE.test(tag) ? null : "characters";
  }

  // A custom scope as it is stored: already clean, and one the generator takes.
  function isCustom(value) { return typeof value === "string" && value === cleanCustom(value) && CUSTOM_RE.test(value); }

  // Whether a ticked custom scope is fine. No custom answer is fine too; an empty one is the box ticked
  // before anything is typed, which holds the step back.
  function customReady(answers) { return answers.custom === undefined || isCustom(answers.custom); }

  // A name as it is stored: already trimmed, and one the firmware takes.
  function isName(value) { return typeof value === "string" && value === cleanName(value) && nameProblem(value) === null; }
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

  // The firmware the commands are written for. A board being flashed gets the newest, so it
  // is never asked; a board left as it is runs whatever the person says it runs.
  function firmwareFor(answers) {
    var a = answers || {};
    return route(a) === "flash" ? NEWEST : a.firmware;
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
    // Only a board that is left as it is can run older firmware; a flashed one gets the newest.
    if (!flashing) steps.push("version");
    steps.push("town");
    // The radio settings are only written when flashing; a running repeater keeps its own.
    if (flashing && context && context.radioOptions > 1) steps.push("radio");
    if (!listenOnly(a)) {
      steps.push("role");
      if (a.role === "edge") steps.push("neighbours");
    }
    // Where maps show it gets its own screen after the name: one decision per screen, and the map needs the room.
    steps.push("name", "location", "commands", "check");
    return steps;
  }

  function isComplete(stepId, answers) {
    var a = answers || {};
    switch (stepId) {
      case "type": return oneOf(TYPES, a.type);
      case "repeat": return oneOf(REPEAT, a.repeat);
      case "board": {
        var kind = chip(a);
        if (!kind || !oneOf(TYPES, a.type)) return false;
        return a.type !== "observer" || kind === "esp32";
      }
      case "status": return oneOf(STATUS, a.status);
      case "reflash": return typeof a.reflash === "boolean";
      case "observerFirmware": return oneOf(YES_NO, a.observerFirmware);
      case "bootloader": return a.bootloader === true;
      case "flash": return a.flashed === true;
      case "version": return oneOf(VERSIONS, a.firmware);
      case "town": return isText(a.tag, TAG_RE) && isText(a.province, TAG_RE);
      case "radio": return isText(a.radio, ID_RE);
      // A city repeater picks its cross-border scope on this screen; an edge repeater does on the neighbours screen.
      case "role": return oneOf(ROLES, a.role) && (a.role !== "city" || customReady(a));
      // An empty list is a deliberate "none"; the screen sets it when the person says so.
      case "neighbours": return Array.isArray(a.neighbours) && customReady(a);
      case "name": return isName(a.name);
      // Location is on by default, so the pin has to be in Canada; with location disabled nothing more is asked.
      case "location": return a.shareLocation === false || hasPin(a.place);
      // These two screens hold no answers. The screen decides when to move on.
      case "commands":
      case "check": return true;
      default: return false;
    }
  }

  // Reads coordinates typed into the location box, in the forms people copy from maps:
  //   44.1628, -77.3832 · 44.1628 -77.3832 · 44,1628; -77,3832 · 44,1628 -77,3832 · (44.1628, -77.3832)
  //   N44.1628 W77.3832 · 44.1628° N, 77.3832° O · 44°09'46.1"N 77°22'59.5"W · N 44°09.768' W 77°22.992'
  // Latitude comes first unless N/S/E/W (O is French for west) say otherwise. A decimal comma
  // needs digits on both sides, so "44,1628, -77,3832" reads as two numbers.
  // Returns { lat, lon, inCanada }, or null when the text isn't two readable coordinates
  // (see looksLikeCoordinates for what is never sent to the search anyway).
  var DECIMAL = "\\d+(?:[.,]\\d+)?";
  // Degrees (never directly followed by another digit, so "44.1628" can't split in two),
  // then optional minutes and seconds with their marks.
  var BODY = "([+-]?" + DECIMAL + ")(?!\\d)\\s*(?:°\\s*)?(?:(" + DECIMAL + ")\\s*'\\s*(?:(" + DECIMAL + ")\\s*\"\\s*)?)?";
  var SEPARATOR = "\\s*[,;]?\\s*";
  // Either both letters come before their numbers (N44.16 W77.38) or both after (44.16 N, 77.38 W), or none.
  var LETTERS_FIRST = new RegExp("^([NSEWO])\\s*" + BODY + SEPARATOR + "([NSEWO])\\s*" + BODY + "$", "i");
  var LETTERS_AFTER = new RegExp("^" + BODY + "\\s*([NSEWO])?" + SEPARATOR + BODY + "\\s*([NSEWO])?$", "i");

  // Minus signs, degree, minute and second marks as maps and keyboards write them.
  function plainCoordinates(text) {
    var typed = String(text).trim()
      .replace(/[\u2212\u2012\u2013\u2014]/g, "-")             // minus sign and dashes
      .replace(/[\u00ba\u02da]/g, "°")                         // º and ˚ for the degree mark
      .replace(/[\u2032\u2019\u2018]/g, "'")                   // prime and curly quotes for minutes
      .replace(/[\u2033\u201c\u201d]|''/g, '"');               // double prime for seconds
    var wrapped = /^[(\[{]\s*([\s\S]*?)\s*[)\]}]$/.exec(typed);
    return wrapped ? wrapped[1] : typed;
  }

  function number(text) { return parseFloat(text.replace(",", ".")); }

  // One coordinate from its pieces: [letter before, degrees, minutes, seconds, letter after].
  // null if unreadable (60 minutes or more, or minutes after decimal degrees).
  function coordinate(pieces) {
    var degrees = number(pieces[1]);
    var minutes = pieces[2] ? number(pieces[2]) : 0;
    var seconds = pieces[3] ? number(pieces[3]) : 0;
    if (minutes >= 60 || seconds >= 60 || (pieces[2] && /[.,]/.test(pieces[1]))) return null;
    var size = Math.abs(degrees) + minutes / 60 + seconds / 3600;
    var hemisphere = (pieces[0] || pieces[4] || "").toUpperCase();
    var negative = hemisphere ? /[SWO]/.test(hemisphere) : /^-/.test(pieces[1]);
    return { value: negative ? -size : size, axis: hemisphere ? (/[NS]/.test(hemisphere) ? "lat" : "lon") : "" };
  }

  function parseCoordinates(text) {
    if (typeof text !== "string") return null;
    var plain = plainCoordinates(text);
    var first, second, found;
    if ((found = LETTERS_FIRST.exec(plain))) {
      first = coordinate([found[1], found[2], found[3], found[4], ""]);
      second = coordinate([found[5], found[6], found[7], found[8], ""]);
    } else if ((found = LETTERS_AFTER.exec(plain))) {
      first = coordinate(["", found[1], found[2], found[3], found[4]]);
      second = coordinate(["", found[5], found[6], found[7], found[8]]);
    }
    if (!first || !second) return null;
    if (first.axis === "lon" || second.axis === "lat") { var swap = first; first = second; second = swap; }
    if (first.axis === "lon" || second.axis === "lat") return null;   // both say the same axis
    return { lat: first.value, lon: second.value, inCanada: inCanada(first.value, second.value) };
  }

  // Text with a digit and no letters but N, S, E, W or O, only numbers and the marks around them,
  // is coordinates even when it can't be read. It is never sent to a place search.
  function looksLikeCoordinates(text) {
    if (typeof text !== "string" || !/\d/.test(text)) return false;
    return /^[NSEWO]*$/i.test(plainCoordinates(text).replace(/[\d\s.,;:+\-()[\]{}\/°'"]/g, ""));
  }

  // What each answer feeds. Changing the key clears the answers listed against it.
  // "name" is cleared only while it is still the suggested name, not one the person typed.
  var DEPENDENTS = {
    type: ["repeat", "reflash", "observerFirmware", "bootloader", "flashed", "firmware", "regionReply", "name"],
    board: ["bootloader", "flashed", "firmware", "regionReply"],
    status: ["reflash", "observerFirmware", "bootloader", "flashed", "firmware", "regionReply", "name"],
    reflash: ["bootloader", "flashed", "firmware"],
    observerFirmware: ["flashed", "firmware"],
    place: ["tag", "province", "radio", "neighbours", "external", "custom", "name"],
    tag: ["radio", "neighbours", "external", "custom"],
    role: ["neighbours", "external", "custom"]
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
      delete next.custom;
    }
    // A repeater observer is ESP32 only, so an nRF52 board can't stay selected.
    if (next.type === "observer" && chip(next) === "nrf52") delete next.board;
    return next;
  }

  var ACCENTED = { "œ": "oe", "Œ": "OE", "æ": "ae", "Æ": "AE" };

  // A name for a new board, from where it is: a town's own name, a street address's
  // municipality (the part after its last comma), or for coordinates the region's label,
  // which the page passes in. A board that is already running has a name people know it
  // by, so nothing is suggested: the person types it to keep it, or a new one.
  function suggestName(answers, regionLabel) {
    var a = answers || {};
    if (a.status === "running") return "";
    var place = a.place || {};
    var from = typeof place.name === "string" ? place.name : "";
    if (place.kind === "address") from = from.split(",").pop();
    if (place.kind === "coordinates") from = typeof regionLabel === "string" ? regionLabel : "";
    var letters = from
      .replace(/[ŒœÆæ]/g, function (ch) { return ACCENTED[ch]; })
      .normalize("NFD")
      .replace(/[^A-Za-z]/g, "");
    if (!letters) return "";
    var suffix = a.type === "observer" ? "_Obs1" : "_R1";
    return letters.slice(0, MAX_NAME - suffix.length) + suffix;
  }

  // Share links: the non-secret answers, plus the picked place and its pin (as town, lat and lon).
  // Never carried: pasted device replies; the "I flashed it" / "I updated the
  // bootloader" ticks, which a shared link must not pre-tick for someone else; and
  // the firmware version, which only the person with the board can say.
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

  // The kind of board, written as is. An older link's board id is read as its kind.
  var boardField = {
    key: "board",
    write: function (value) { return oneOf(KINDS, value) ? value : null; },
    read: function (text) {
      text = text.toLowerCase();
      if (oneOf(KINDS, text)) return text;
      return Object.prototype.hasOwnProperty.call(OLD_BOARDS, text) ? OLD_BOARDS[text] : undefined;
    }
  };

  // A scope agreed with a network across the border. Only a clean, valid one is written or read.
  var customField = {
    key: "custom",
    write: function (value) { return isCustom(value) ? value : null; },
    read: function (text) { text = cleanCustom(text); return CUSTOM_RE.test(text) ? text : undefined; }
  };

  var FIELDS = [
    enumField("type", TYPES),
    enumField("repeat", REPEAT),
    boardField,
    enumField("status", STATUS),
    flagField("reflash"),
    enumField("observerFirmware", YES_NO),
    codeField("tag", TAG_RE),
    codeField("province", TAG_RE),
    codeField("radio", ID_RE),
    enumField("role", ROLES),
    listField("neighbours"),
    listField("external"),
    customField,
    { key: "name",
      write: function (value) { return isName(value) ? encodeURIComponent(value) : null; },
      read: function (text) { text = cleanName(text); return isName(text) ? text : undefined; } },
    flagField("nameEdited"),
    flagField("shareLocation")
  ];

  // The picked place travels as town, lat and lon (4 decimals, about 10 m) so a reload or a
  // language switch needs no new search. lat and lon are the map pin: where the search put
  // it, or where the person moved it. It is not called "place": `?place=<text>` is the
  // deep link that starts the search. The place's province is the `province` answer.
  // `town` is the place's display name: a town, a street address as the geocoder wrote it,
  // or the rounded coordinates, never the text typed into the search. A place found from
  // a street address or coordinates also carries `kind`, which the name suggestion and the
  // map's starting zoom use. A town has no kind.
  var MAX_TOWN = 80;
  var PLACE_KINDS = ["address", "coordinates"];
  var CANADA = { latMin: 41, latMax: 84, lonMin: -142, lonMax: -52 };
  var DECIMAL_RE = /^-?\d+(\.\d+)?$/;

  function round4(value) { return Math.round(value * 10000) / 10000; }

  // The map pin is the place's lat and lon: the spot the search found, until the person moves it.
  function hasPin(place) {
    return !!place && typeof place.lat === "number" && typeof place.lon === "number" && inCanada(place.lat, place.lon);
  }

  // One number typed into the latitude or longitude box: a decimal comma is fine, and so is a real minus sign.
  var PIN_NUMBER = /^[+-]?\d+(?:\.\d+)?$/;

  function pinNumber(text) {
    if (typeof text !== "string") return NaN;
    var plain = text.trim().replace(/[\u2212\u2012\u2013\u2014]/g, "-").replace(",", ".");
    return PIN_NUMBER.test(plain) ? parseFloat(plain) : NaN;
  }

  // The two boxes under the map, read as a pin: { lat, lon }, or null unless both are plain numbers
  // and the spot is inside the box the tool uses for Canada.
  function readPin(latText, lonText) {
    var lat = pinNumber(latText);
    var lon = pinNumber(lonText);
    return inCanada(lat, lon) ? { lat: lat, lon: lon } : null;
  }

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
    var parts = ["town=" + encodeURIComponent(place.name)];
    if (oneOf(PLACE_KINDS, place.kind)) parts.push("kind=" + place.kind);
    return parts.concat("lat=" + lat, "lon=" + lon);
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
    if (oneOf(PLACE_KINDS, params.get("kind"))) place.kind = params.get("kind");
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
    // With location disabled the spot stays out of the link, whatever was searched: the pin can be
    // dragged to the exact spot even from a town. The region answers still bring the region back.
    return parts.concat(a.shareLocation === false ? [] : placeParts(a.place)).join("&");
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
    KINDS: KINDS,
    VERSIONS: VERSIONS,
    stepIds: stepIds,
    isComplete: isComplete,
    route: route,
    firmwareFor: firmwareFor,
    parseCoordinates: parseCoordinates,
    readPin: readPin,
    hasPin: hasPin,
    looksLikeCoordinates: looksLikeCoordinates,
    cleanName: cleanName,
    cleanCustom: cleanCustom,
    customProblem: customProblem,
    isCustom: isCustom,
    nameProblem: nameProblem,
    resetDependents: resetDependents,
    suggestName: suggestName,
    toQuery: toQuery,
    fromQuery: fromQuery
  };
}());
