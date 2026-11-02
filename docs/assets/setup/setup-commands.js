// The command list ("rollup") for the guided repeater setup tool, the read-only
// checks that end it, and reading a pasted `region` reply.
//
// Scope lines come only from MeshCoreIataScopes (profile, then commands); this file
// never builds a `region def` itself. Every word shown comes from MeshCoreSetupText.
// Answers that don't apply (a hand-edited share link can carry a role for a
// listen-only repeater observer) are ignored: what applies is decided from
// MeshCoreSetupFlow.stepIds and the type and repeat answers, not from which keys exist.
//
// The other setup scripts are looked up when a function runs, so load order
// between them doesn't matter as long as all are loaded before the first call.
(function () {
  "use strict";

  function lib(name) {
    var found = globalThis[name];
    if (!found) throw new Error(name + " must be loaded first");
    return found;
  }

  function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function say(key, lang, vars) {
    return lib("MeshCoreSetupText").t(key, lang, vars);
  }

  function item(id, command, why, manual) {
    return { id: id, command: command, why: why, manual: manual === true };
  }

  function round4(value) { return Math.round(value * 10000) / 10000; }

  // 910.525 reads 910,525 in French.
  function number(value, lang) {
    var text = String(value);
    return lang === "fr" ? text.replace(".", ",") : text;
  }

  // "a, b and c" / "a, b et c"
  function list(values, lang) {
    if (values.length < 2) return values.join("");
    return values.slice(0, -1).join(", ") + " " + say("list.and", lang) + " " + values[values.length - 1];
  }

  // What applies to these answers.
  function situation(answers, data) {
    var a = answers || {};
    var place = lib("MeshCoreSetupPlace");
    var options = place.radioOptions(a.tag, data);
    var steps = lib("MeshCoreSetupFlow").stepIds(a, { radioOptions: options.length });
    var route = lib("MeshCoreSetupFlow").route(a);
    var hierarchy = data.catalog.hierarchy;
    // Listen-only repeater observers have no scopes: stepIds leaves out the role step for them.
    var scoped = steps.indexOf("role") !== -1;
    var edge = scoped && a.role === "edge";
    var offered = place.crossBorder(a.province);
    var networks = scoped ? offered.shared.concat(edge ? offered.edgeOnly : []) : [];
    var radio = null;
    if (route === "flash") {
      var chosen = steps.indexOf("radio") !== -1 && options.some(function (option) { return option.id === a.radio; });
      radio = chosen ? a.radio : "canada";
    }
    return {
      answers: a,
      route: route,
      observer: a.type === "observer",
      scoped: scoped,
      edge: edge,
      running: a.status === "running",
      radio: radio,
      cities: edge && Array.isArray(a.neighbours) ? a.neighbours.filter(function (tag) {
        return typeof tag === "string" && tag !== a.tag && has(hierarchy, tag) && hierarchy[tag].kind === "city";
      }) : [],
      external: Array.isArray(a.external) ? a.external.filter(function (id) { return networks.indexOf(id) !== -1; }) : []
    };
  }

  function scopeProfile(s, data) {
    return lib("MeshCoreIataScopes").profile(data.catalog, {
      activation: "activate",
      home: s.answers.tag,
      province: s.answers.province,
      bridge: s.edge,
      cities: s.cities,
      external: s.external
    });
  }

  // "Quinte West (ytr)", "Amérique du Nord (na)", "États-Unis (us)"
  function tagName(tag, data, lang) {
    var catalog = data.catalog;
    var label = null;
    if (has(catalog.hierarchy, tag)) {
      var entry = catalog.hierarchy[tag];
      label = (lang === "fr" && entry.labelFr) || entry.label;
    } else {
      var french = lib("MeshCoreSetupText").tagLabelsFr;
      if (lang === "fr" && has(french, tag)) label = french[tag];
      var paths = catalog.externalRegionPaths || {};
      Object.keys(paths).forEach(function (id) {
        var labels = paths[id].tagLabels;
        if (!label && labels && has(labels, tag)) label = labels[tag];
      });
    }
    return label && label !== tag ? label + " (" + tag + ")" : tag;
  }

  function radioItem(id, data, lang) {
    var profile = null;
    data.profiles.forEach(function (candidate) { if (candidate.id === id) profile = candidate; });
    if (!profile) throw new Error("Unknown radio profile: " + id);
    var radio = profile.radio;
    var command = "set radio " + [radio.frequency_mhz, radio.bandwidth_khz, radio.spreading_factor, radio.coding_rate].join(",");
    if (id === "canada") return item("radio", command, say("why.radio", lang));
    var settings = say("radio.settings", lang, {
      mhz: number(radio.frequency_mhz, lang),
      khz: number(radio.bandwidth_khz, lang),
      sf: radio.spreading_factor,
      cr: radio.coding_rate
    });
    var name = (lang === "fr" && profile.name_fr) || profile.name;
    return item("radio", command, say("why.radio-community", lang, { profile: name, settings: settings }));
  }

  function basics(s, data, lang) {
    var a = s.answers;
    var out = [];
    // Flash route only: changing the radio from the phone would cut the link in use (note.radio-phone).
    if (s.radio) out.push(radioItem(s.radio, data, lang));
    out.push(item("name", "set name " + a.name, say("why.name", lang)));
    var place = a.place;
    var located = place && typeof place.name === "string" && place.name &&
      typeof place.lat === "number" && isFinite(place.lat) && typeof place.lon === "number" && isFinite(place.lon);
    if (a.shareLocation !== false && located) {
      out.push(item("lat", "set lat " + round4(place.lat), say("why.lat", lang, { town: place.name })));
      out.push(item("lon", "set lon " + round4(place.lon), say("why.lon", lang, { town: place.name })));
    }
    out.push(item("password", "password <" + say("ph.password", lang) + ">", say(s.running ? "why.password-keep" : "why.password", lang), true));
    return out;
  }

  var STANDARD = {
    "path.hash.mode": "hash",
    "advert.interval": "advert",
    "flood.advert.interval": "flood-advert",
    "flood.max": "flood-max"
  };

  function canada(s, lang) {
    return lib("MeshCoreIataScopes").standardCommands(s.answers.firmware).map(function (line) {
      var setting = /^set (\S+) /.exec(line);
      var id = setting && has(STANDARD, setting[1]) ? STANDARD[setting[1]] : null;
      if (!id) throw new Error("No explanation for the setting: " + line);
      return item(id, line, say("why." + id, lang));
    });
  }

  function scopeItem(line, lines, result, data, lang) {
    var match;
    if (/^region def /.test(line)) {
      var names = result.tags.map(function (tag) { return tagName(tag, data, lang); });
      return item("def", line, say("why.def", lang, { list: list(names, lang) }));
    }
    if ((match = /^region put (\S+)(?: \S+)?$/.exec(line))) {
      // Firmware 1.14 adds a region with forwarding off, and allows it on the next line.
      var separate = lines.indexOf("region allowf " + match[1]) !== -1;
      return item("put-" + match[1], line, say(separate ? "why.put-add" : "why.put", lang, { name: tagName(match[1], data, lang) }));
    }
    if (line === "region allowf *") return item("allow", line, say("why.allow", lang));
    if (line === "region denyf *") return item("deny", line, say("why.deny", lang));
    if ((match = /^region allowf (\S+)$/.exec(line))) {
      return item("allowf-" + match[1], line, say("why.allowf", lang, { name: tagName(match[1], data, lang) }));
    }
    if ((match = /^region default (\S+)$/.exec(line))) return item("default", line, say("why.default", lang, { tag: match[1] }));
    throw new Error("No explanation for the scope command: " + line);
  }

  function scopes(s, data, lang) {
    var out = [];
    // A board that was already running may carry old regions: show them, then clear them (Ruling 3).
    if (s.running) {
      out.push(item("region-show", "region", say("why.region-show", lang)));
      regionRemovals(s.answers.regionReply).names.forEach(function (name) {
        out.push(item("remove-" + name, "region remove " + name, say("why.remove", lang, { name: name })));
      });
    }
    var result = scopeProfile(s, data);
    var lines = lib("MeshCoreIataScopes").commands(result, s.answers.firmware);
    lines.forEach(function (line) { out.push(scopeItem(line, lines, result, data, lang)); });
    out.push(item("save", "region save", say("why.save", lang)));
    return out;
  }

  // The same settings as the MQTT observer page, Wi-Fi typed by hand last.
  function observerItems(s, lang) {
    var listen = !s.scoped;
    return [
      item("iata", "set mqtt.iata " + String(s.answers.tag).toUpperCase(), say("why.iata", lang)),
      item("powersave", "set wifi.powersave none", say("why.powersave", lang)),
      item("mqtt1", "set mqtt1.preset meshcore-ca-1", say("why.mqtt1", lang)),
      item("mqtt2", "set mqtt2.preset meshcore-ca-2", say("why.mqtt2", lang)),
      item("mqtt-status", "set mqtt.status on", say("why.mqtt-status", lang)),
      item("mqtt-packets", "set mqtt.packets on", say("why.mqtt-packets", lang)),
      item("mqtt-raw", "set mqtt.raw off", say("why.mqtt-raw", lang)),
      item("mqtt-rx", "set mqtt.rx on", say("why.mqtt-rx", lang)),
      item("mqtt-tx", "set mqtt.tx advert", say("why.mqtt-tx", lang)),
      item("bridge", "set bridge.enabled on", say("why.bridge", lang)),
      item("repeat", listen ? "set repeat off" : "set repeat on", say(listen ? "why.repeat-off" : "why.repeat-on", lang)),
      item("advert-now", "advert", say("why.advert-now", lang)),
      item("ssid", "set wifi.ssid <" + say("ph.ssid", lang) + ">", say("why.ssid", lang), true),
      item("wifi-pwd", "set wifi.pwd <" + say("ph.wifi-pwd", lang) + ">", say("why.wifi-pwd", lang), true)
    ];
  }

  // Groups in order: basics, canada, scopes (not for listen-only), observer
  // (repeater observers only), finish. Expects the answers up to the name step.
  function rollup(answers, data, lang) {
    say("group.basics", lang); // an unknown language fails here, before any work
    var s = situation(answers, data);
    var groups = [
      { id: "basics", items: basics(s, data, lang) },
      { id: "canada", items: canada(s, lang) }
    ];
    if (s.scoped) groups.push({ id: "scopes", items: scopes(s, data, lang) });
    if (s.observer) groups.push({ id: "observer", items: observerItems(s, lang) });
    groups.push({ id: "finish", items: [item("reboot", "reboot", say("why.reboot", lang))] });
    return groups;
  }

  // The generator's "confirm before applying" warnings, in the page's language.
  function notes(answers, data, lang) {
    say("note.network", lang); // an unknown language fails even when there is nothing to say
    var s = situation(answers, data);
    if (!s.scoped) return [];
    var result = scopeProfile(s, data);
    var out = [];
    if (data.catalog.hierarchy[result.home].provinces.indexOf(result.province) === -1) {
      out.push(say("note.province", lang, { region: tagName(result.home, data, lang) }));
    }
    result.externalPaths.forEach(function (record) {
      if (record.status !== "documented") out.push(say("note.network", lang, { network: (lang === "fr" && record.labelFr) || record.label }));
    });
    return out;
  }

  // The read-only "Check it worked" list.
  function checks(answers, data, lang) {
    var s = situation(answers, data);
    var out = [
      { id: "ver", command: "ver", expect: say(s.route === "phone" ? "check.ver.phone" : "check.ver", lang) },
      { id: "name", command: "get name", expect: say("check.name", lang, { name: s.answers.name }) }
    ];
    if (s.scoped) {
      // `region` shows every name the rollup set; never promise a ^ home marker (the generator sets none).
      var tags = scopeProfile(s, data).tags;
      out.push({ id: "region", command: "region", expect: say(s.edge ? "check.region.edge" : "check.region.city", lang, { tags: list(tags, lang) }) });
    }
    if (s.observer) out.push({ id: "mqtt", command: "get mqtt.status", expect: say("check.mqtt", lang) });
    out.push({ id: "advert", command: "advert", expect: say("check.advert", lang) });
    return out;
  }

  // One line of a `region` reply: indent (one space per level), name, ^ for home, F when it forwards.
  var REPLY_LINE = /^( *)(\*|[A-Za-z0-9][A-Za-z0-9_-]{0,30})(\^)?( F)?$/;

  // Which old regions to remove, deepest first, from a pasted `region` reply.
  // Tolerates CRLF, tabs, trailing spaces, non-breaking spaces, the console's "  -> "
  // prefix, an echoed `region` line and `OK`. `*` is never removed. Anything that
  // can't be read as one complete list (no `*` line, two lists, lost indents) is
  // readable: false, and nothing is removed.
  function regionRemovals(reply) {
    var unreadable = { names: [], readable: false };
    if (typeof reply !== "string") return unreadable;
    var kept = [];
    var lostIndents = false;
    reply.replace(/\r\n?/g, "\n").split("\n").forEach(function (raw) {
      var line = raw.replace(/ /g, " ").replace(/^[ \t]*->[ \t]*/, "");
      var indent = /^[ \t]*/.exec(line)[0];
      line = indent.replace(/\t/g, " ") + line.slice(indent.length).replace(/[ \t]+/g, " ").replace(/ $/, "");
      var match = REPLY_LINE.exec(line);
      if (!match) return;                                // blank lines, prompts, Err replies
      if (!match[1] && match[2] !== "*") {
        // An unindented word is an echoed command or a reply such as OK. One marked
        // like a region (F or ^) is a region whose indent was lost.
        if (match[3] || match[4]) lostIndents = true;
        return;
      }
      kept.push(line);
    });
    if (lostIndents || !kept.length) return unreadable;
    var parsed;
    try {
      parsed = lib("MeshCoreScopeMigration").parse(kept.join("\n"));
    } catch (error) {
      return unreadable;
    }
    var names = parsed.nodes
      .map(function (node, index) { return { name: node.name, depth: node.depth, index: index }; })
      .filter(function (node) { return node.name !== "*"; })
      .sort(function (a, b) { return b.depth - a.depth || a.index - b.index; })
      .map(function (node) { return node.name; });
    return { names: names, readable: true };
  }

  globalThis.MeshCoreSetupCommands = {
    rollup: rollup,
    checks: checks,
    notes: notes,
    regionRemovals: regionRemovals
  };
}());
