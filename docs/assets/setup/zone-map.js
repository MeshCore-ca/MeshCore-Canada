// The "Find your zone" page (/config/map/): type a town, a street address, coordinates or a zone code,
// or tap the map, and see which zone (IATA code) the place is in and whether that zone is a MeshMapper
// zone or a MeshCore Canada placeholder.
//
// The setup tool's own pieces do the thinking, unchanged: MeshCorePlaceSearch.find looks up towns and
// addresses (geo.ca), MeshCoreSetupFlow.parseCoordinates reads coordinates here (they are never sent),
// and MeshCoreSetupPlace loads the zone files and turns a spot or a typed code into a zone.
// This file holds the page's words, in English and French, and draws the page into <div data-zone-map>.
//
// Anything from the address bar or the place search is only ever set as text, never as HTML.
(function () {
  "use strict";

  var en = {
    "search.label": "Town, street address or coordinates",
    "search.placeholder": "For example Belleville",
    "search.button": "Find",
    "search.hint": "Or tap a zone on the map.",
    "status.loading": "Loading zones…",
    "status.searching": "Searching…",
    "status.places": "Several places match. Which one?",
    "status.many": "More than one zone covers that spot. Which one?",
    "status.mismatch": "The place search and the zone map disagree on the province. Which one?",
    "status.province": "This zone covers more than one province. Which one?",
    "status.nothing": "Nothing found. Try a nearby town, or tap the map.",
    "status.none": "No zone covers that spot.",
    "status.outside": "Those coordinates aren't in Canada. In Canada the longitude is negative: for example 44.1628, -77.3832.",
    "status.format": "Those numbers couldn't be read as coordinates. Type them like 44.1628, -77.3832.",
    "status.failed": "The place search didn't answer. Try again, or tap the map.",
    "status.load-failed": "The zones didn't load. Check your connection, then reload the page.",
    "map.label": "Map of zones",
    "map.failed": "The map didn't load. The search and the list by province still work.",
    "map.zoom-in": "Zoom in",
    "map.zoom-out": "Zoom out",
    "map.credit": "© {link} contributors",
    "map.credit.link": "OpenStreetMap",
    "legend.label": "Map legend",
    "legend.you": "Your zone",
    "legend.mesh": "MeshMapper zone",
    "legend.placeholder": "Placeholder",
    "card.title": "{code} · {name}",
    "card.where": "{place} · {province}",
    "badge.mesh": "MeshMapper zone",
    "badge.starter": "Placeholder",
    "badge.extension": "Placeholder · planning extension",
    "line.mesh": "A published MeshMapper zone. Repeaters and observers here use the code {code}.",
    "line.placeholder": "No MeshMapper zone here yet. MeshCore Canada uses this outline until local operators publish one on MeshMapper.",
    "action.setup": "Set up a repeater here",
    "action.meshmapper": "Open in MeshMapper",
    "tell": "Something wrong with this zone? {link}.",
    "tell.link": "Tell us",
    "more": "More about this region",
    "more.groups": "Local groups:",
    "more.no-groups": "No local group listed yet.",
    "more.source.mesh": "Outline from MeshMapper.",
    "more.source.placeholder": "Outline drawn by MeshCore Canada.",
    "more.extension": "Nearby places outside it use this code too, through a MeshCore Canada planning extension (dashed).",
    "more.maintainer": "Maintainer: {name}",
    "more.no-maintainer": "No maintainer listed. {link}",
    "more.no-maintainer.link": "Volunteer",
    "browse": "Browse by province or territory",
    "browse.zone": "{name} ({code})",
    "link.new-tab": "(opens in a new tab)"
  };

  var fr = {
    "search.label": "Ville, adresse ou coordonnées",
    "search.placeholder": "Par exemple Belleville",
    "search.button": "Trouver",
    "search.hint": "Ou touchez une zone sur la carte.",
    "status.loading": "Chargement des zones…",
    "status.searching": "Recherche…",
    "status.places": "Plusieurs endroits correspondent. Lequel?",
    "status.many": "Plus d’une zone couvre cet endroit. Laquelle?",
    "status.mismatch": "La recherche de lieux et la carte des zones ne s’entendent pas sur la province. Laquelle?",
    "status.province": "Cette zone couvre plus d’une province. Laquelle?",
    "status.nothing": "Aucun endroit trouvé. Essayez une ville voisine, ou touchez la carte.",
    "status.none": "Aucune zone ne couvre cet endroit.",
    "status.outside": "Ces coordonnées ne sont pas au Canada. Au Canada, la longitude est négative : par exemple 44.1628, -77.3832.",
    "status.format": "Ces nombres n’ont pas pu être lus comme des coordonnées. Tapez-les comme 44.1628, -77.3832 ou 44,1628; -77,3832.",
    "status.failed": "La recherche de lieux n’a pas répondu. Réessayez, ou touchez la carte.",
    "status.load-failed": "Les zones ne se sont pas chargées. Vérifiez votre connexion, puis rechargez la page.",
    "map.label": "Carte des zones",
    "map.failed": "La carte ne s’est pas chargée. La recherche et la liste par province fonctionnent quand même.",
    "map.zoom-in": "Zoom avant",
    "map.zoom-out": "Zoom arrière",
    "map.credit": "© les contributeurs d’{link}",
    "map.credit.link": "OpenStreetMap",
    "legend.label": "Légende de la carte",
    "legend.you": "Votre zone",
    "legend.mesh": "Zone MeshMapper",
    "legend.placeholder": "Zone provisoire",
    "card.title": "{code} · {name}",
    "card.where": "{place} · {province}",
    "badge.mesh": "Zone MeshMapper",
    "badge.starter": "Zone provisoire",
    "badge.extension": "Zone provisoire · extension proposée",
    "line.mesh": "Une zone MeshMapper publiée. Les répéteurs et les observateurs de cette zone utilisent le code {code}.",
    "line.placeholder": "Pas encore de zone MeshMapper ici. MeshCore Canada utilise ce tracé en attendant que les opérateurs locaux en publient une sur MeshMapper.",
    "action.setup": "Configurer un répéteur ici",
    "action.meshmapper": "Ouvrir dans MeshMapper",
    "tell": "Un problème avec cette zone? {link}.",
    "tell.link": "Dites-le-nous",
    "more": "En savoir plus sur cette région",
    "more.groups": "Groupes locaux :",
    "more.no-groups": "Aucun groupe local indiqué pour l’instant.",
    "more.source.mesh": "Tracé de MeshMapper.",
    "more.source.placeholder": "Tracé dessiné par MeshCore Canada.",
    "more.extension": "Des endroits voisins, hors de cette zone, utilisent aussi ce code grâce à une extension proposée par MeshCore Canada (en pointillés).",
    "more.maintainer": "Responsable : {name}",
    "more.no-maintainer": "Aucun responsable indiqué. {link}",
    "more.no-maintainer.link": "Devenir responsable",
    "browse": "Parcourir par province ou territoire",
    "browse.zone": "{name} ({code})",
    "link.new-tab": "(s’ouvre dans un nouvel onglet)"
  };

  var TEXT = { en: en, fr: fr };

  // How each kind of zone is drawn. zone-map.css gives the legend's swatches the same colours. The map's
  // tiles are light in both site themes, so one set of colours does for both.
  var STYLES = {
    you: { color: "#1f5fd1", weight: 3, opacity: 1, fillColor: "#4f8cff", fillOpacity: 0.38, dashArray: null },
    mesh: { color: "#b87800", weight: 2, opacity: 1, fillColor: "#f2b84b", fillOpacity: 0.16, dashArray: null },
    placeholder: { color: "#5f6b7a", weight: 1.5, opacity: 1, fillColor: "#8d97a6", fillOpacity: 0.06, dashArray: "6 5" }
  };

  function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  // A string in `lang`, its {names} filled from `vars`. A {name} with no value stays as written, which is
  // how {link} marks where a link goes. Throws on an unknown key or language, so a typo fails in tests.
  function t(key, lang, vars) {
    if (!has(TEXT, lang)) throw new Error("Unknown language: " + lang);
    if (!has(TEXT[lang], key)) throw new Error("Unknown text: " + key);
    return TEXT[lang][key].replace(/\{(\w+)\}/g, function (whole, name) {
      return vars && has(vars, name) && vars[name] != null ? String(vars[name]) : whole;
    });
  }

  function features(tag, data) {
    return data.boundaries.features.filter(function (feature) { return feature.properties && feature.properties.tag === tag; });
  }

  // A zone's MeshMapper outline, or null for a code MeshMapper has no zone for.
  function published(tag, data) {
    return features(tag, data).filter(function (feature) { return feature.properties.regionSource === "meshmapper"; })[0] || null;
  }

  // Whether MeshCore Canada gives this code a planning extension: places just outside its MeshMapper zone.
  function hasExtension(tag, data) {
    return features(tag, data).some(function (feature) { return feature.properties.planningKind === "extension"; });
  }

  // What a zone is, for its badge:
  //   "mesh"       a published MeshMapper zone
  //   "starter"    a MeshCore Canada starter region: MeshMapper has no zone for this code yet
  //   "extension"  the spot is outside the code's MeshMapper zone, in the gap MeshCore Canada gives it
  // A spot decides. With none (a typed code, the list, a link), a code with a MeshMapper zone is "mesh",
  // unless a link from the setup tool says its spot is in the extension (`part` is "extension") and the
  // code has one. Any other `part` is ignored.
  function kind(tag, point, data, part) {
    var planning = globalThis.MeshCoreSetupPlace.planning(tag, point || null, data);
    if (planning) return planning;
    if (!published(tag, data)) return "starter";
    return !point && part === "extension" && hasExtension(tag, data) ? "extension" : "mesh";
  }

  function nameOf(catalog, tag, lang) {
    var entry = has(catalog.hierarchy, tag) ? catalog.hierarchy[tag] : null;
    return entry ? (lang === "fr" && entry.labelFr) || entry.label || String(tag).toUpperCase() : String(tag || "").toUpperCase();
  }

  // The zones under each province or territory they span, west to east as in the catalogue, by name.
  // [{ province, name, zones: [{ tag, name }] }]
  function groups(data, lang) {
    var catalog = data.catalog;
    var tags = Object.keys(catalog.hierarchy);
    var result = [];
    tags.forEach(function (code) {
      if (catalog.hierarchy[code].kind !== "province") return;
      var zones = tags.filter(function (tag) {
        var entry = catalog.hierarchy[tag];
        return entry.kind === "city" && Array.isArray(entry.provinces) &&
          entry.provinces.some(function (province) { return String(province).toLowerCase() === code; });
      }).map(function (tag) { return { tag: tag, name: nameOf(catalog, tag, lang) }; });
      if (!zones.length) return;
      zones.sort(function (a, b) { return a.name.localeCompare(b.name, lang) || (a.tag < b.tag ? -1 : 1); });
      result.push({ province: code, name: nameOf(catalog, code, lang), zones: zones });
    });
    return result;
  }

  // Where the card's links go, relative to the page (/config/map/ or /fr/config/map/) so each language
  // keeps its own pages. The idea form fills in the zone from `region` and `request`.
  function links(tag, province, lang) {
    var source = "https://meshcore.ca/" + (lang === "fr" ? "fr/" : "") + "config/map/";
    function idea(request) {
      return "../../submit-idea/?" + new URLSearchParams({ region: tag, request: request, source_page: source });
    }
    return {
      setup: "../?" + new URLSearchParams(province ? { tag: tag, province: province } : { tag: tag }),
      boundary: idea("boundary"),
      maintainer: idea("maintainer")
    };
  }

  globalThis.MeshCoreZoneMap = {
    t: t,
    text: { en: Object.freeze(en), fr: Object.freeze(fr) },
    styles: STYLES,
    kind: kind,
    hasExtension: hasExtension,
    groups: groups,
    links: links
  };

  // ---- The page ----

  if (typeof document === "undefined") return;

  var lang = /^fr(?:-|$)/i.test(document.documentElement.lang || "") ? "fr" : "en";
  function say(key, vars) { return t(key, lang, vars); }

  var SCRIPT_URL = (function () {
    var script = document.currentScript || document.querySelector("script[src*='assets/setup/zone-map.js']");
    return new URL(script ? script.src : "assets/setup/zone-map.js", document.baseURI).href;
  }());

  // The site's own copy of Leaflet, loaded by this script so the page itself stays light.
  var LEAFLET = { script: "../regions/vendor/leaflet/leaflet.js", style: "../regions/vendor/leaflet/leaflet.css" };
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var TILE_TIMEOUT = 10000;     // how long the tiles may take before the map is called broken
  var SEARCH_TIMEOUT = 10000;   // how long the place search may take before it is called down
  var CANADA = [[41.7, -141], [70, -52.6]];
  var LABEL_ZOOM = 5;           // zone codes show from this zoom in
  var LINK_ZOOM = 8;            // a zone from the address bar, before its outline is in: most fit at this zoom
  var OUTLINE_WAIT = 2500;      // the outline files wait for the map's first tiles, but no longer than this
  var DRAW_SLICE = 8;           // milliseconds of drawing zones before the page gets a turn
  var PHONE = "(max-width: 44.9375em)";
  var ROUTE = /^\/[A-Za-z0-9/_.#-]*$/;

  var Place, Search, Flow;

  var state = {
    els: null,
    data: null,
    dataPromise: null,
    map: null,
    layers: {},       // tag -> [{ layer, feature }], placeholders first
    drawn: false,     // every zone is on the map
    zoomWaiting: false,
    linkView: false,  // the map opened at the zone in the address bar, from the catalogue's seed
    selected: null,   // { tag, province, point, place, part }
    token: 0,         // the latest search; older answers are dropped
    outlinesFree: false,
    outlinesWaiting: []
  };

  // The two outline files are by far the page's biggest. They wait until the map's first tiles are in, so
  // the map shows sooner on a slow connection, or OUTLINE_WAIT at most. Anything that needs them sooner (a
  // search, a link to a zone the catalogue can't place, a map that can't load) lets them go at once.
  function freeOutlines() {
    if (state.outlinesFree) return;
    state.outlinesFree = true;
    state.outlinesWaiting.splice(0).forEach(function (go) { go(); });
  }

  function outlinesFree() {
    return state.outlinesFree ? Promise.resolve() : new Promise(function (go) { state.outlinesWaiting.push(go); });
  }

  // ------------------------------------------------------------------ helpers

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      var value = attrs[name];
      if (value == null || value === false) return;
      if (name === "text") node.textContent = value;
      else if (name === "on") Object.keys(value).forEach(function (type) { node.addEventListener(type, value[type]); });
      else node.setAttribute(name, value === true ? "" : String(value));
    });
    return append(node, children);
  }

  function append(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child == null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  // A link that opens in a new tab, and says so to screen readers. The site's stylesheet adds the ↗.
  function newTab(words, href, attrs) {
    return el("a", Object.assign({ href: href, target: "_blank", rel: "noopener", "data-mc-external-ready": "true" }, attrs || {}),
      [words, el("span", { class: "mc-visually-hidden", text: " " + say("link.new-tab") })]);
  }

  // A string whose {link} becomes a link to `href`; the link's words are the key plus ".link".
  function withLink(key, href) {
    var out = document.createDocumentFragment();
    say(key).split("{link}").forEach(function (part, index) {
      if (index > 0) out.appendChild(el("a", { href: href, text: say(key + ".link") }));
      if (part) out.appendChild(document.createTextNode(part));
    });
    return out;
  }

  function phone() { return window.matchMedia && window.matchMedia(PHONE).matches; }

  function motion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function zoneName(tag) { return nameOf(state.data.catalog, tag, lang); }
  function provinceName(code) { return nameOf(state.data.catalog, code, lang); }

  function status(message) { state.els.status.textContent = message || ""; }

  // ------------------------------------------------------------------ the frame

  function legendItem(name, words) {
    return el("li", {}, [el("span", { class: "zm-swatch zm-swatch--" + name, "aria-hidden": "true" }), words]);
  }

  function build(root) {
    var input = el("input", { type: "search", id: "zm-search", class: "zm-search__input", "data-zone-search": "",
      placeholder: say("search.placeholder"), autocomplete: "off", enterkeyhint: "search", spellcheck: "false" });
    var form = el("form", { class: "zm-search", role: "search", "data-zone-form": "", on: { submit: function (event) {
      event.preventDefault();
      search(input.value);
    } } }, [
      el("label", { for: "zm-search", class: "zm-search__label", text: say("search.label") }),
      el("div", { class: "zm-search__row" }, [input, el("button", { type: "submit", class: "md-button md-button--primary zm-search__button", text: say("search.button") })])
    ]);
    var els = {
      status: el("p", { class: "zm-status", role: "status", "data-zone-status": "" }),
      choices: el("div", { class: "zm-choices", "data-zone-choices": "" }),
      canvas: el("div", { class: "zm-map__canvas zm-map--far", "data-zone-canvas": "" }),
      legend: el("ul", { class: "zm-legend", "aria-label": say("legend.label"), "data-zone-legend": "" }, [
        legendItem("you", say("legend.you")),
        legendItem("mesh", say("legend.mesh")),
        legendItem("placeholder", say("legend.placeholder"))
      ]),
      // Always in the page, so a new card is read out when it arrives.
      result: el("div", { class: "zm-result", "aria-live": "polite", "data-zone-result": "" }),
      browseList: el("div", { class: "zm-browse__list" }),
      browse: null
    };
    els.mapBox = el("div", { class: "zm-map", role: "group", "aria-label": say("map.label"), "data-zone-map-box": "" }, els.canvas);
    els.browse = el("details", { class: "zm-browse zm-fold", "data-zone-browse": "" }, [el("summary", { text: say("browse") }), els.browseList]);
    state.els = els;
    root.textContent = "";
    append(root, [form, el("p", { class: "zm-hint", text: say("search.hint") }), els.status, els.choices, els.mapBox, els.legend, els.result, els.browse]);
  }

  // ------------------------------------------------------------------ choices

  function clearChoices() { state.els.choices.textContent = ""; }

  // A question with one button per answer: [{ value, title, detail, pick }].
  function offer(list) {
    clearChoices();
    list.forEach(function (item) {
      state.els.choices.appendChild(el("button", { type: "button", class: "zm-choice", "data-zone-choice": item.value, on: { click: function () {
        clearChoices();
        status("");
        item.pick();
      } } }, [el("span", { class: "zm-choice__title", text: item.title }), item.detail ? el("span", { class: "zm-choice__detail", text: item.detail }) : null]));
    });
  }

  function zoneChoice(option, pick) {
    return {
      value: option.tag + ":" + option.province,
      title: say("card.title", { code: option.tag.toUpperCase(), name: zoneName(option.tag) }),
      detail: provinceName(option.province),
      pick: function () { pick(option); }
    };
  }

  // ------------------------------------------------------------------ search

  function whenData(token, then) {
    state.dataPromise.then(function (data) {
      if (token === state.token) then(data);
    }, function () {
      // Nothing to search with: say so again, rather than leave "Loading zones…" there.
      if (token === state.token) status(say("status.load-failed"));
    });
  }

  // Coordinates typed into the box, as a place named by the rounded spot. It has no province: the zone
  // map decides which one it is in.
  function coordinatesPlace(point) {
    var lat = Math.round(point.lat * 10000) / 10000;
    var lon = Math.round(point.lon * 10000) / 10000;
    return { name: lat + ", " + lon, province: "", lat: point.lat, lon: point.lon };
  }

  function search(raw) {
    var query = String(raw || "").trim();
    if (!query) return;
    var token = state.token += 1;
    freeOutlines();
    clearChoices();
    unselect();
    // Coordinates are read here and never sent to a search, even when they can't be read.
    var point = Flow.parseCoordinates(query);
    if (point && !point.inCanada) return status(say("status.outside"));
    if (!point && Flow.looksLikeCoordinates(query)) return status(say("status.format"));
    status(say(state.data ? "status.searching" : "status.loading"));
    whenData(token, function (data) {
      if (point) return placeFound(coordinatesPlace(point), "search");
      // A zone code needs no search.
      var codes = Place.fromCode(query, data);
      if (codes.length) return codesFound(codes);
      status(say("status.searching"));
      // A search that hangs is stopped, so the person gets a message instead of waiting forever.
      var controller = typeof AbortController === "function" ? new AbortController() : null;
      var timer = controller && window.setTimeout(function () { controller.abort(); }, SEARCH_TIMEOUT);
      Search.find(query, lang, function (url) {
        return window.fetch(url, controller ? { signal: controller.signal } : undefined);
      }).then(function (places) {
        window.clearTimeout(timer);
        if (token !== state.token) return;
        if (!places.length) return status(say("status.nothing"));
        if (places.length === 1) return placeFound(places[0], "search");
        status(say("status.places"));
        offer(places.map(function (place, index) {
          return { value: "place:" + index, title: place.name, detail: place.province, pick: function () { placeFound(place, "search"); } };
        }));
      }, function () {
        window.clearTimeout(timer);
        if (token === state.token) status(say("status.failed"));
      });
    });
  }

  function codesFound(options) {
    if (options.length === 1) return select({ tag: options[0].tag, province: options[0].province }, "search");
    status(say("status.province"));
    offer(options.map(function (option) {
      return zoneChoice(option, function (picked) { select({ tag: picked.tag, province: picked.province }, "search"); });
    }));
  }

  // A place from the search, typed coordinates, or a tap (`how` is "search" or "tap"). One zone is shown at
  // once; several, or a province the place search and the map disagree on, are asked about.
  function placeFound(place, how, tapped) {
    var data = state.data;
    var result = Place.resolve(place, data);
    var spot = { lat: place.lat, lon: place.lon };
    function pick(option) { select({ tag: option.tag, province: option.province, point: spot, place: place.name || null }, how); }
    if (result.status === "one") return pick(result.options[0]);
    if (result.status === "none") {
      // A tap on a zone's very edge: the zone tapped, in the province at that spot if it spans it.
      if (tapped) {
        var options = Place.fromCode(tapped, data);
        var here = globalThis.MeshCoreIataScopes.provinceAt(data.jurisdictions, place.lat, place.lon);
        if (options.length) return pick(options.filter(function (option) { return option.province === here; })[0] || options[0]);
      }
      return status(say("status.none"));
    }
    var list = result.options.slice();
    if (result.status === "province-mismatch") {
      // Offer the same zones in the province the place search gave, too.
      var claimed = Search.provinceCode(place.province).toLowerCase();
      result.options.forEach(function (option) {
        Place.fromCode(option.tag, data).forEach(function (other) {
          var known = list.some(function (item) { return item.tag === other.tag && item.province === other.province; });
          if (other.province === claimed && !known) list.push(other);
        });
      });
      if (list.length === 1) return pick(list[0]);
    }
    // One zone on both sides of a provincial line (Bas-St-Laurent-Gaspésie across Chaleur Bay): only the
    // province is in question.
    var oneZone = list.every(function (option) { return option.tag === list[0].tag; });
    status(say(result.status === "province-mismatch" ? "status.mismatch" : oneZone ? "status.province" : "status.many"));
    offer(list.map(function (option) { return zoneChoice(option, pick); }));
  }

  // ------------------------------------------------------------------ the card

  function card(choice) {
    var data = state.data;
    var tag = choice.tag;
    var code = tag.toUpperCase();
    var what = kind(tag, choice.point, data, choice.part);
    var mesh = what === "mesh";
    var outline = published(tag, data);
    var meshmapper = mesh && outline && /^https:\/\//.test(outline.properties.sourceUrl || "") ? outline.properties.sourceUrl : null;
    var to = links(tag, choice.province, lang);
    var province = provinceName(choice.province);
    var profile = has(data.catalog.profiles, tag) ? data.catalog.profiles[tag] : {};

    var groupsLine;
    var communities = Array.isArray(profile.communities) ? profile.communities : [];
    if (communities.length) {
      groupsLine = el("li", {}, say("more.groups") + " ");
      communities.forEach(function (community, index) {
        if (index) groupsLine.appendChild(document.createTextNode(", "));
        var words = (lang === "fr" && community.nameFr) || community.name || community.id;
        groupsLine.appendChild(ROUTE.test(community.route || "") ? el("a", { href: "../.." + community.route, text: words }) : document.createTextNode(words));
      });
    } else {
      groupsLine = el("li", { text: say("more.no-groups") });
    }
    var maintainer = profile.maintainer && profile.maintainer.name;

    return el("section", { class: "zm-card", "aria-labelledby": "zm-card-title", "data-zone-card": tag, "data-zone-kind": what }, [
      el("h2", { id: "zm-card-title", class: "zm-card__title", tabindex: "-1", text: say("card.title", { code: code, name: zoneName(tag) }) }),
      el("p", { class: "zm-card__where", "data-zone-where": "", text: choice.place ? say("card.where", { place: choice.place, province: province }) : province }),
      el("p", { class: "zm-card__badge" }, el("span", { class: "zm-badge zm-badge--" + (mesh ? "mesh" : "placeholder"), "data-zone-badge": what, text: say("badge." + what) })),
      el("p", { class: "zm-card__line", "data-zone-line": "", text: mesh ? say("line.mesh", { code: code }) : say("line.placeholder") }),
      el("p", { class: "zm-card__actions" }, [
        el("a", { class: "md-button md-button--primary", href: to.setup, "data-zone-setup": "", text: say("action.setup") }),
        meshmapper ? newTab(say("action.meshmapper"), meshmapper, { class: "md-button", "data-zone-meshmapper": "" }) : null
      ]),
      el("p", { class: "zm-card__tell" }, withLink("tell", to.boundary)),
      el("details", { class: "zm-card__more zm-fold", "data-zone-more": "" }, [
        el("summary", { text: say("more") }),
        el("ul", {}, [
          groupsLine,
          el("li", { text: say(mesh ? "more.source.mesh" : "more.source.placeholder") }),
          hasExtension(tag, data) ? el("li", { "data-zone-extension": "", text: say("more.extension") }) : null,
          maintainer ? el("li", { text: say("more.maintainer", { name: maintainer }) }) : el("li", {}, withLink("more.no-maintainer", to.maintainer))
        ])
      ])
    ]);
  }

  // ------------------------------------------------------------------ selecting a zone

  // `how`: "search" (the search box or one of its choices), "tap", "browse" or "link" (the address bar).
  function select(choice, how) {
    var before = state.selected && state.selected.tag;
    var chose = state.els.choices.contains(document.activeElement) || document.activeElement === document.body;
    // Only the address bar's zone keeps the view the map opened at.
    if (how !== "link") state.linkView = false;
    state.selected = choice;
    status("");
    state.els.result.textContent = "";
    var box = card(choice);
    state.els.result.appendChild(box);
    restyle(before);
    if (how !== "tap") zoomTo(choice.tag);
    remember(choice, box.getAttribute("data-zone-kind") === "extension");
    var heading = box.querySelector("h2");
    if (how === "browse") {
      state.els.mapBox.scrollIntoView({ behavior: motion(), block: "start" });
      heading.focus({ preventScroll: true });
    } else if (how === "search") {
      // A choice button has gone: carry on from the card.
      if (chose) heading.focus({ preventScroll: true });
      box.scrollIntoView({ behavior: motion(), block: phone() ? "start" : "nearest" });
    } else if (how === "tap" && phone()) {
      box.scrollIntoView({ behavior: motion(), block: "start" });
    }
  }

  function unselect() {
    var before = state.selected && state.selected.tag;
    if (!before) return;
    state.selected = null;
    state.els.result.textContent = "";
    restyle(before);
    remember(null);
  }

  // The address bar holds the zone, so the page can be shared or reloaded, and part=extension when the card
  // says the spot is in the zone's planning extension. Nothing else is kept.
  function remember(choice, extension) {
    if (!window.history || typeof window.history.replaceState !== "function") return;
    var url = new URL(window.location.href);
    var params = choice ? { tag: choice.tag, province: choice.province } : null;
    if (params && extension) params.part = "extension";
    url.search = params ? "?" + new URLSearchParams(params) : "";
    window.history.replaceState(window.history.state, "", url.href);
  }

  // A zone from the address bar (?tag=ytr&province=on). Unknown or old codes and parameters are ignored;
  // a province the zone isn't in gives way to one it is in.
  function fromAddress(data) {
    var params = new URLSearchParams(window.location.search);
    var options = Place.fromCode(params.get("tag") || "", data);
    if (!options.length) return;
    var wanted = String(params.get("province") || "").toLowerCase();
    var option = options.filter(function (item) { return item.province === wanted; })[0] || options[0];
    // The setup tool says when its spot is in the planning extension. kind() checks the code has one.
    select({ tag: option.tag, province: option.province, part: params.get("part") === "extension" ? "extension" : null }, "link");
  }

  // ------------------------------------------------------------------ the browse list

  function buildBrowse(data) {
    var list = el("ul", { class: "zm-browse__provinces" });
    groups(data, lang).forEach(function (group) {
      var zones = el("ul", { class: "zm-browse__zones" });
      group.zones.forEach(function (zone) {
        zones.appendChild(el("li", {}, el("button", { type: "button", class: "zm-browse__zone", "data-zone-pick": zone.tag + ":" + group.province,
          text: say("browse.zone", { name: zone.name, code: zone.tag }),
          on: { click: function () {
            state.token += 1;
            clearChoices();
            status("");
            select({ tag: zone.tag, province: group.province }, "browse");
          } } })));
      });
      list.appendChild(el("li", { class: "zm-browse__province" }, [el("strong", { text: group.name }), zones]));
    });
    state.els.browseList.textContent = "";
    state.els.browseList.appendChild(list);
  }

  // ------------------------------------------------------------------ the map

  var leafletPromise = null;

  // Resolves with Leaflet once its script and its stylesheet have both loaded.
  function loadLeaflet() {
    if (window.L && typeof window.L.map === "function") return Promise.resolve(window.L);
    if (!leafletPromise) {
      leafletPromise = new Promise(function (resolve, reject) {
        var waiting = 2;
        function loaded() {
          waiting -= 1;
          if (!waiting) resolve(window.L);
        }
        function failed() {
          leafletPromise = null;
          reject(new Error("Leaflet didn't load"));
        }
        document.head.appendChild(el("link", { rel: "stylesheet", href: new URL(LEAFLET.style, SCRIPT_URL).href, on: { load: loaded, error: failed } }));
        document.head.appendChild(el("script", { src: new URL(LEAFLET.script, SCRIPT_URL).href, on: { load: loaded, error: failed } }));
      });
    }
    return leafletPromise;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; });
  }

  // Leaflet takes its credit lines as HTML. Only this file's own words go in, escaped.
  function creditLink(words, href) {
    return '<a href="' + href + '" target="_blank" rel="noopener" data-mc-external-ready="true">' + escapeHtml(words) +
      '<span class="mc-visually-hidden"> ' + escapeHtml(say("link.new-tab")) + "</span></a>";
  }

  function tileCredit() {
    return say("map.credit").split("{link}").map(escapeHtml).join(creditLink(say("map.credit.link"), "https://www.openstreetmap.org/copyright"));
  }

  function styleFor(feature) {
    var properties = feature.properties;
    var meshmapper = properties.regionSource === "meshmapper";
    // The chosen zone is blue; its placeholder parts stay dashed, so the published part stands out.
    if (state.selected && properties.tag === state.selected.tag) {
      return meshmapper ? STYLES.you : Object.assign({}, STYLES.you, { dashArray: STYLES.placeholder.dashArray });
    }
    return meshmapper ? STYLES.mesh : STYLES.placeholder;
  }

  // Redraws the zone that was selected and the one that is now, and puts the new one on top, its
  // MeshMapper outline over its placeholder.
  function restyle(before) {
    var now = state.selected && state.selected.tag;
    [before, now].forEach(function (tag) {
      (state.layers[tag] || []).forEach(function (entry) { entry.layer.setStyle(styleFor(entry.feature)); });
    });
    (state.layers[now] || []).forEach(function (entry) { entry.layer.bringToFront(); });
  }

  function zoomTo(tag) {
    var entries = state.layers[tag] || [];
    if (!state.map || !state.drawn || !entries.length) {
      state.zoomWaiting = true;
      return;
    }
    state.zoomWaiting = false;
    var bounds = entries[0].layer.getBounds();
    entries.slice(1).forEach(function (entry) { bounds.extend(entry.layer.getBounds()); });
    // The map opened at this zone already: keep that view when the whole zone is in it, rather than load
    // a second set of tiles.
    var linked = state.linkView;
    state.linkView = false;
    if (linked && state.map.getBounds().contains(bounds)) return;
    state.map.stop();
    state.map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9, animate: false });
  }

  function mapFailed() {
    // No tiles to wait for: the search and the list need the outlines now.
    freeOutlines();
    var map = state.map;
    state.map = null;
    state.drawn = false;
    if (map) {
      try { map.remove(); } catch (error) { /* it was half built; it goes anyway */ }
    }
    if (!state.els.mapBox.isConnected) return;
    state.els.legend.remove();
    state.els.mapBox.replaceWith(el("p", { class: "zm-map-failed", role: "status", "data-zone-map-failed": "", text: say("map.failed") }));
  }

  function tapped(tag, latlng) {
    if (!state.data) return;
    state.token += 1;
    clearChoices();
    status("");
    var point = latlng.wrap();
    placeFound({ name: "", province: "", lat: point.lat, lon: point.lng }, "tap", tag);
  }

  // Draws every zone, placeholders first so MeshMapper outlines sit on top, then the codes. It goes a few
  // zones at a time so the page keeps answering while the big outlines are built.
  function drawZones(L, map, data) {
    var order = data.boundaries.features.filter(function (feature) { return feature.properties && feature.properties.tag; });
    order = order.filter(function (feature) { return feature.properties.regionSource !== "meshmapper"; })
      .concat(order.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; }));
    var index = 0;
    return new Promise(function (resolve) {
      (function step() {
        if (state.map !== map) return resolve();
        var started = Date.now();
        while (index < order.length && Date.now() - started < DRAW_SLICE) addZone(L, map, order[index++]);
        if (index < order.length) return window.setTimeout(step, 0);
        addLabels(L, map, data);
        resolve();
      }());
    });
  }

  function addZone(L, map, feature) {
    var tag = feature.properties.tag;
    var layer = L.geoJSON(feature, { style: styleFor, bubblingMouseEvents: false });
    layer.on("click", function (event) { tapped(tag, event.latlng); });
    layer.addTo(map);
    layer.eachLayer(function (path) {
      var node = typeof path.getElement === "function" ? path.getElement() : null;
      if (!node) return;
      node.setAttribute("data-zone", tag);
      node.setAttribute("data-zone-source", feature.properties.regionSource === "meshmapper" ? "meshmapper" : "meshcore-canada");
    });
    (state.layers[tag] = state.layers[tag] || []).push({ layer: layer, feature: feature });
  }

  // Each zone's code at its middle, shown once the map is zoomed in. They repeat the zones, so screen
  // readers skip them; the card and the list say the same in words.
  function addLabels(L, map, data) {
    Object.keys(state.layers).forEach(function (tag) {
      var middle = Place.centre(tag, data);
      if (!middle) return;
      var label = el("span", { text: tag });
      var marker = L.marker([middle.lat, middle.lon], { icon: L.divIcon({ className: "zm-label", html: label, iconSize: null }), interactive: false, keyboard: false }).addTo(map);
      var node = marker.getElement();
      if (node) node.setAttribute("aria-hidden", "true");
    });
  }

  // The zone in the address bar and its middle ({ tag, lat, lon }), from the catalogue's seeds, or null. The catalogue is small and
  // comes first, so a link from the setup tool shows its zone at once; the outlines can take a while longer.
  function linkedSpot(catalog) {
    if (!catalog || !catalog.hierarchy || !Array.isArray(catalog.seeds)) return null;
    var tag = String(new URLSearchParams(window.location.search).get("tag") || "").toLowerCase();
    if (!Place.fromCode(tag, { catalog: catalog }).length) return null;
    var seed = catalog.seeds.filter(function (item) { return item && item.tag === tag; })[0];
    if (seed && isFinite(seed.lat) && isFinite(seed.lon)) return { tag: tag, lat: Number(seed.lat), lon: Number(seed.lon) };
    // A zone the catalogue can't place: only its outline can show where it is, so don't make that wait.
    freeOutlines();
    return null;
  }

  function startMap(catalogPromise) {
    var canvas = state.els.canvas;
    Promise.all([loadLeaflet(), catalogPromise]).then(function (loaded) {
      var L = loaded[0];
      if (!canvas.isConnected) return;
      // Keyboard users have the search and the list, so the map isn't a tab stop (its zoom buttons are). The
      // wheel scrolls the page, as on the setup tool's map; the + and - buttons, a double-click or a pinch zoom.
      // Whole zoom levels only: tiles scaled to a fraction leave thin seams between them.
      var map = L.map(canvas, { zoomControl: false, keyboard: false, scrollWheelZoom: false });
      state.map = map;
      map.attributionControl.setPrefix(creditLink("Leaflet", "https://leafletjs.com"));
      L.control.zoom({ zoomInTitle: say("map.zoom-in"), zoomOutTitle: say("map.zoom-out") }).addTo(map);
      var tiles = L.tileLayer(TILES, { maxZoom: 18, attribution: tileCredit() }).addTo(map);
      var spot = linkedSpot(loaded[1]);
      // Unless something else was picked before the map was ready.
      if (spot && (!state.selected || state.selected.tag === spot.tag)) {
        map.setView([spot.lat, spot.lon], LINK_ZOOM, { animate: false });
        state.linkView = true;
      } else {
        map.fitBounds(CANADA, { animate: false });
      }
      function labels() { canvas.classList.toggle("zm-map--far", map.getZoom() < LABEL_ZOOM); }
      map.on("zoomend", labels);
      labels();
      window.setTimeout(function () { if (state.map === map) map.invalidateSize(); }, 0);
      // As on the setup tool's map: the first tile in means the map works; every tile failing, or none in time, means it doesn't.
      var settled = false;
      var timer = window.setTimeout(function () { settle(false); }, TILE_TIMEOUT);
      function settle(ok) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (state.map === map && !ok) mapFailed();
      }
      tiles.once("tileload", function () { settle(true); });
      tiles.once("load", function () { settle(false); });
      // The first screen of tiles is in (or failed): the outlines can come now.
      tiles.once("load", freeOutlines);
      state.dataPromise.then(function (data) {
        return drawZones(L, map, data);
      }).then(function () {
        if (state.map !== map) return;
        state.drawn = true;
        restyle(null);
        if (state.selected && state.zoomWaiting) zoomTo(state.selected.tag);
      }, function () { /* the load failure is already on the page */ });
    }).catch(function () {
      mapFailed();
    });
  }

  // ------------------------------------------------------------------ mount

  function mount(root) {
    Place = globalThis.MeshCoreSetupPlace;
    Search = globalThis.MeshCorePlaceSearch;
    Flow = globalThis.MeshCoreSetupFlow;
    build(root);
    if (!Place || !Search || !Flow || !globalThis.MeshCoreIataScopes) {
      state.dataPromise = Promise.reject(new Error("A page script didn't load"));
      state.dataPromise.catch(function () {});
      // Nothing here can work: one line, not an empty map, a legend and an empty list.
      [state.els.mapBox, state.els.legend, state.els.browse].forEach(function (node) { node.remove(); });
      status(say("status.load-failed"));
      return;
    }
    status(say("status.loading"));
    // The catalogue is read as it arrives too (a copy of loadData's own answer, not a second request), so the
    // map can open at a linked zone before the outlines are in.
    var catalogPromise = null;
    state.dataPromise = Place.loadData(SCRIPT_URL, function (url, init) {
      var path = new URL(String(url), window.location.href).pathname;
      if (/\.geojson$/.test(path)) return outlinesFree().then(function () { return window.fetch(url, init); });
      var request = window.fetch(url, init);
      if (!catalogPromise && /\/iata-regions\.json$/.test(path)) {
        catalogPromise = request.then(function (response) { return response.ok ? response.clone().json() : null; }).catch(function () { return null; });
      }
      return request;
    });
    window.setTimeout(freeOutlines, OUTLINE_WAIT);
    startMap(catalogPromise || Promise.resolve(null));
    state.dataPromise.then(function (data) {
      state.data = data;
      if (state.els.status.textContent === say("status.loading")) status("");
      buildBrowse(data);
      fromAddress(data);
    }, function () {
      status(say("status.load-failed"));
      state.els.browse.remove();
    });
  }

  function init() {
    var root = document.querySelector("[data-zone-map]");
    if (!root || root.getAttribute("data-zone-map-ready") === "1") return;
    root.setAttribute("data-zone-map-ready", "1");
    mount(root);
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
