// The "Which towns does this label reach?" example on the explainer page
// (/config/guide/). Pick a label and see which example towns' city repeaters pass
// a message with that label on.
//
// reach() is the logic: it asks MeshCoreIataScopes for each town's city-repeater
// profile, the same one the setup tool uses, so the example can't drift from the
// real lists. It needs only the region catalogue, not the boundary files.
// The rest of this file draws the example into <div data-scope-demo>.
(function () {
  "use strict";

  // Each example town and the region and province its city repeater is set up in.
  // Ottawa and Gatineau share a region but not a province, which is the point.
  var TOWNS = [
    { town: "Belleville", home: "ytr", province: "on" },
    { town: "Kingston", home: "ygk", province: "on" },
    { town: "Ottawa", home: "yow", province: "on" },
    { town: "Gatineau", home: "yow", province: "qc" },
    { town: "Montréal", home: "yul", province: "qc" },
    { town: "Toronto", home: "yyz", province: "on" }
  ];
  var PROVINCE_NAMES = { on: "Ontario", qc: "Québec" };

  // The labels offered, smallest area first. "*" is a message with no label.
  var LABELS = ["ytr", "on", "onqc", "can", "*"];
  var FIRST_LABEL = "ytr";

  var en = {
    "legend": "Label on the message",
    "label.ytr": "Quinte West (around Belleville)",
    "label.on": "Ontario",
    "label.onqc": "Ontario + Québec",
    "label.can": "Canada (not used yet)",
    "label.*": "No label (older apps, or no default scope)",
    "verdict.yes": "Passes it on",
    "verdict.no": "Doesn't pass it on",
    "town.detail": "Region `{tag}`, {province}",
    "reason.ytr": "Only Quinte West's repeaters have `ytr` on their list, so a message labelled `ytr` stays around Belleville.",
    "reason.on": "Every Ontario repeater has `on` on its list, so a message labelled `on` crosses Ontario, but the repeaters in Québec (Gatineau and Montréal) don't have it.",
    "reason.onqc": "Every repeater in Ontario and Québec has `onqc` on its list, so a message labelled `onqc` crosses both provinces.",
    "reason.can": "`can` is on every repeater's list, so all of these pass on a message labelled `can`, though nobody uses it yet.",
    "reason.*": "A message with no label counts as `*`. City repeaters pass those on, so all of these do; edge repeaters don't.",
    "note": "Each town has a city repeater set up with the tool. This shows what each repeater's list allows, not radio coverage.",
    "failed": "The example didn't load. The tables above show the same idea."
  };

  var fr = {
    "legend": "Étiquette du message",
    "label.ytr": "Quinte West (autour de Belleville)",
    "label.on": "Ontario",
    "label.onqc": "Ontario + Québec",
    "label.can": "Canada (pas encore utilisée)",
    "label.*": "Aucune étiquette (anciennes applications, ou pas de portée par défaut)",
    "verdict.yes": "Le relaie",
    "verdict.no": "Ne le relaie pas",
    "town.detail": "Région `{tag}`, {province}",
    "reason.ytr": "Seuls les répéteurs de Quinte West ont `ytr` dans leur liste : un message étiqueté `ytr` reste donc autour de Belleville.",
    "reason.on": "Tous les répéteurs de l’Ontario ont `on` dans leur liste : un message étiqueté `on` traverse donc l’Ontario, mais les répéteurs du Québec (Gatineau et Montréal) ne l’ont pas.",
    "reason.onqc": "Tous les répéteurs de l’Ontario et du Québec ont `onqc` dans leur liste : un message étiqueté `onqc` traverse donc les deux provinces.",
    "reason.can": "`can` est dans la liste de chaque répéteur : tous ceux-ci relaient donc un message étiqueté `can`, même si personne ne l’utilise encore.",
    "reason.*": "Un message sans étiquette compte comme `*`. Les répéteurs de ville le relaient, donc tous ceux-ci le font; les répéteurs de bordure, non.",
    "note": "Chaque ville a un répéteur de ville configuré avec l’outil. On voit ce que permet la liste de chaque répéteur, pas la couverture radio.",
    "failed": "L’exemple ne s’est pas chargé. Les tableaux ci-dessus montrent la même chose."
  };

  function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  // For each example town: does its city repeater pass on a message with this label?
  // `data` is { catalog }, the region catalogue (iata-regions.json) and nothing else.
  function reach(label, data) {
    var scopes = globalThis.MeshCoreIataScopes;
    if (!scopes) throw new Error("The scope generator (iata-scopes.js) is not loaded.");
    var catalog = data && data.catalog;
    if (!catalog || !catalog.hierarchy || !catalog.policy) throw new Error("The region catalogue is missing.");
    var wanted = String(label == null ? "" : label).trim().toLowerCase();
    return TOWNS.map(function (entry) {
      var profile = scopes.profile(catalog, { activation: "activate", home: entry.home, province: entry.province });
      return { town: entry.town, tag: entry.home, passes: scopes.forwards(profile, wanted) === true };
    });
  }

  globalThis.MeshCoreScopeDemo = {
    reach: reach,
    labels: LABELS.slice(),
    text: { en: Object.freeze(en), fr: Object.freeze(fr) }
  };

  // ---- The page ----

  if (typeof document === "undefined") return;

  // The script element can be found by its address even when currentScript is not set.
  function scriptUrl() {
    var element = document.querySelector("script[src*='scope-demo.js']") || document.currentScript;
    return element && element.src ? element.src : new URL("/assets/setup/scope-demo.js", window.location.origin).href;
  }

  function loadCatalog() {
    var url = new URL("../regions/iata-regions.json", scriptUrl());
    return fetch(url, { cache: "no-cache" }).then(function (response) {
      if (!response.ok) throw new Error("Region catalogue unavailable");
      return response.json();
    });
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Text between backticks is code. Everything is set with textContent, never as markup.
  function richText(parent, value) {
    value.split("`").forEach(function (part, index) {
      if (!part) return;
      parent.appendChild(index % 2 ? element("code", "", part) : document.createTextNode(part));
    });
    return parent;
  }

  function fill(value, vars) {
    return value.replace(/\{(\w+)\}/g, function (whole, name) { return has(vars, name) ? vars[name] : whole; });
  }

  var mounted = 0;

  function mount(node, catalog) {
    var french = /^fr(?:-|$)/i.test(document.documentElement.lang || "");
    var words = french ? fr : en;
    var data = { catalog: catalog };
    var group = "scope-demo-" + (mounted += 1);

    var root = element("div", "scope-demo");
    var fieldset = element("fieldset", "scope-demo__labels");
    fieldset.appendChild(element("legend", "", words.legend));

    var radios = {};
    LABELS.forEach(function (label) {
      var option = element("label", "scope-demo__option");
      var input = element("input");
      input.type = "radio";
      input.name = group;
      input.value = label;
      radios[label] = input;
      var text = element("span", "scope-demo__option-text");
      if (label !== "*") {
        text.appendChild(element("code", "", label));
        text.appendChild(document.createTextNode(" — "));
      }
      text.appendChild(document.createTextNode(words["label." + label]));
      option.appendChild(input);
      option.appendChild(text);
      fieldset.appendChild(option);
    });

    // Everything inside the live region is rewritten when the label changes, and read out as a whole.
    var result = element("div", "scope-demo__result");
    result.setAttribute("aria-live", "polite");
    result.setAttribute("aria-atomic", "true");
    var reason = element("p", "scope-demo__reason");
    var list = element("ul", "scope-demo__towns");
    var rows = TOWNS.map(function (entry) {
      var row = element("li", "scope-demo__town");
      var name = element("span", "scope-demo__name", entry.town);
      var detail = richText(element("span", "scope-demo__detail"), fill(words["town.detail"], {
        tag: entry.home,
        province: PROVINCE_NAMES[entry.province]
      }));
      var verdict = element("span", "scope-demo__verdict");
      row.appendChild(name);
      row.appendChild(detail);
      row.appendChild(verdict);
      list.appendChild(row);
      return { row: row, verdict: verdict };
    });
    result.appendChild(reason);
    result.appendChild(list);

    function show(label) {
      reason.textContent = "";
      richText(reason, words["reason." + label]);
      reach(label, data).forEach(function (entry, index) {
        rows[index].row.setAttribute("data-passes", entry.passes ? "true" : "false");
        // A tick or a cross for sighted readers; the words carry the meaning for everyone.
        rows[index].verdict.textContent = "";
        var mark = element("span", "scope-demo__mark", entry.passes ? "✓" : "✗");
        mark.setAttribute("aria-hidden", "true");
        rows[index].verdict.appendChild(mark);
        rows[index].verdict.appendChild(document.createTextNode(" " + words[entry.passes ? "verdict.yes" : "verdict.no"]));
      });
    }

    fieldset.addEventListener("change", function (event) {
      if (event.target && event.target.name === group) show(event.target.value);
    });

    root.appendChild(fieldset);
    root.appendChild(result);
    root.appendChild(element("p", "scope-demo__note", words.note));

    radios[FIRST_LABEL].checked = true;
    show(FIRST_LABEL);
    node.textContent = "";
    node.appendChild(root);
  }

  function fail(node) {
    var french = /^fr(?:-|$)/i.test(document.documentElement.lang || "");
    var message = element("p", "scope-demo__failed", (french ? fr : en).failed);
    message.setAttribute("role", "alert");
    node.textContent = "";
    node.appendChild(message);
  }

  var catalogPromise = null;

  function init() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-scope-demo]"));
    nodes = nodes.filter(function (node) { return node.isConnected && node.dataset.scopeDemoReady !== "1"; });
    if (!nodes.length) return;
    if (!catalogPromise) catalogPromise = loadCatalog();
    catalogPromise.then(function (catalog) {
      nodes.forEach(function (node) {
        if (!node.isConnected) return;
        node.dataset.scopeDemoReady = "1";
        try { mount(node, catalog); } catch (error) { fail(node); }
      });
    }).catch(function () {
      catalogPromise = null;
      nodes.forEach(function (node) { if (node.isConnected) fail(node); });
    });
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
