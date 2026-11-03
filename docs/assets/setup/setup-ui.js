// The guided repeater setup tool at /config/: one question per screen (layout A),
// ending with the commands to paste and the checks that show it worked.
//
// The other setup scripts do the thinking: MeshCoreSetupFlow decides which steps
// apply, MeshCoreSetupPlace finds regions, MeshCoreSetupCommands builds the command
// list and MeshCoreSetupText holds every word. This file draws them.
//
// Sections: helpers · state · answers and the address bar · region data · screen
// frame · step screens · town search · map location · commands screen · copy helper · mount.
//
// Anything from the address bar or the town search (a town's name, for one) is only
// ever set as text (textContent, text nodes), never as HTML.
(function () {
  "use strict";

  // ------------------------------------------------------------------ helpers

  var isFrench = /^fr(?:-|$)/i.test(document.documentElement.lang || "");
  var lang = isFrench ? "fr" : "en";

  var SCRIPT_URL = (function () {
    var script = document.currentScript || document.querySelector('script[src*="assets/setup/setup-ui.js"]');
    return new URL(script ? script.src : "assets/setup/setup-ui.js", document.baseURI).href;
  }());

  // Site links, relative to the page so each language keeps its own pages.
  var LINKS = {
    guide: "../config/guide/",
    idea: "../submit-idea/",
    map: "../config/map/",
    mounting: "../hardware/repeater-mounting-options/",
    flasher: "https://flasher.meshcore.io/",
    observerFlasher: "https://observer.gessaman.com/",
    otafix: "https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases",
    meshmapper: "https://meshmapper.net/",
    live: "https://live.meshcore.ca/?tab=Observers"
  };

  var Flow, Place, Commands, Search, Text;

  function t(key, vars) { return Text.t(key, lang, vars); }

  function has(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      var value = attrs[name];
      if (value == null || value === false) return;
      if (name === "text") node.textContent = value;
      else if (name === "on") Object.keys(value).forEach(function (type) { node.addEventListener(type, value[type]); });
      else if (name === "value" || name === "checked") node[name] = value;
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

  var PLACEHOLDER = /\{([A-Za-z][\w-]*)\}/g;

  function fill(text, vars) {
    return text.replace(PLACEHOLDER, function (whole, name) {
      return vars && has(vars, name) && vars[name] != null ? String(vars[name]) : whole;
    });
  }

  // Text with `code` shown as <code>. Used for strings that are already filled in.
  function codeText(value) {
    var out = document.createDocumentFragment();
    String(value).split("`").forEach(function (piece, index) {
      if (piece) out.appendChild(index % 2 ? el("code", { text: piece }) : document.createTextNode(piece));
    });
    return out;
  }

  // A setup-text.js string as nodes: `code` as <code>, {link} as a link to `href`
  // (its words are the key plus ".link"), other {names} filled from `vars`. The
  // template is split before it is filled, so a value can't add code or a link.
  function rich(key, vars, href) {
    var out = document.createDocumentFragment();
    t(key).split("{link}").forEach(function (part, index) {
      if (index > 0) out.appendChild(link(t(key + ".link"), href));
      part.split("`").forEach(function (piece, i) {
        if (!piece) return;
        var filled = fill(piece, vars);
        out.appendChild(i % 2 ? el("code", { text: filled }) : document.createTextNode(filled));
      });
    });
    return out;
  }

  // Every link opens in a new tab, so the tool keeps its place.
  function link(words, href, attrs) {
    return el("a", Object.assign({ href: href, target: "_blank", rel: "noopener", "data-mc-external-ready": "true" }, attrs || {}),
      [words, el("span", { class: "setup-sr", text: " " + t("link.new-tab") })]);
  }

  function para(content, attrs) { return el("p", attrs, content); }

  function round4(value) { return Math.round(value * 10000) / 10000; }

  function note(kind, content, attrs) {
    var box = el("div", Object.assign({ class: "setup-note setup-note--" + kind }, attrs || {}));
    return append(box, content);
  }

  function imageUrl(name) { return new URL("../images/onqc-scopes/" + name, SCRIPT_URL).href; }

  function announce(message) {
    var live = state.frame && state.frame.live;
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = message; }, 30);
  }

  // ------------------------------------------------------------------ state

  var state = {
    root: null,
    frame: null,
    answers: {},
    step: "type",
    data: null,
    dataPromise: null,
    dataFailed: false,
    help: {},          // open "?" answers, by step
    ticks: {},         // Done ticks, by command id and text; in memory only
    olderFirmware: false,   // "Older than 1.14" was picked at the version step
    map: null,              // the map location step's Leaflet map, while that screen is drawn
    pinTyped: false,        // the latitude and longitude boxes hold something that isn't a spot in Canada
    town: freshTown()
  };

  function freshTown() {
    return {
      query: "",
      status: "idle",    // idle | searching | places | regions | province | mismatch | none | no-match | outside | format | failed
      places: [],
      options: [],
      place: null,       // the place picked from the search (a town, an address or coordinates), while its region is still open
      mismatch: null,
      code: "",
      codeUnknown: false,
      deepLink: null,    // ?place=<text>, searched when the person reaches the town step
      fellBack: false,   // a typed street address wasn't found, so its town was searched instead
      linkInvalid: false,
      token: 0
    };
  }

  // How long a town search may take before the tool offers the region code box instead.
  var SEARCH_TIMEOUT = 10000;

  // Steps whose screen shows region data, so it is drawn again when the data arrives.
  var DATA_STEPS = ["town", "radio", "role", "neighbours", "commands", "check"];
  // Answers whose change also clears an "Older than 1.14" pick at the version step.
  var CLEARS_OLDER = ["type", "board", "status", "reflash", "observerFirmware"];

  // ------------------------------------------------- answers and the address bar

  function stepList() {
    return Flow.stepIds(state.answers, { radioOptions: radioOptions().length });
  }

  function radioOptions() {
    return state.data && state.answers.tag ? Place.radioOptions(state.answers.tag, state.data) : [{ id: "canada", communities: [], communitiesFr: [] }];
  }

  function firstOpen(ids) {
    for (var i = 0; i < ids.length; i += 1) if (!Flow.isComplete(ids[i], state.answers)) return ids[i];
    return "commands";
  }

  function canContinue(id) {
    if (!Flow.isComplete(id, state.answers)) return false;
    if (id === "town") return !!state.data;
    // A list too long for the repeater has no commands to move on from.
    if (id === "commands") return !!state.data && Commands.fits(state.answers, state.data);
    if (id === "radio") return radioOptions().some(function (option) { return option.id === state.answers.radio; });
    // What is typed in the boxes has to be a spot too, not just the pin from before.
    if (id === "location") return state.answers.shareLocation === false || !state.pinTyped;
    return true;
  }

  function setAnswers(next) {
    state.answers = next;
    syncUrl();
  }

  // Picks an answer and clears what depended on the old one. Returns false if nothing changed.
  function choose(key, value) {
    var before = state.answers;
    if (before[key] === value) return false;
    var next = Object.assign({}, before);
    next[key] = value;
    next = Flow.resetDependents(next, key);
    // The cross-border scopes the tool lists suit city and edge repeaters alike, so a role change keeps them.
    // So does a scope the person agreed with a network across the border.
    if (key === "role" && before.external !== undefined) next.external = before.external;
    if (key === "role" && before.custom !== undefined) next.custom = before.custom;
    if (CLEARS_OLDER.indexOf(key) !== -1) state.olderFirmware = false;
    setAnswers(next);
    return true;
  }

  // Mirrors the answers into the address bar, so a reload, a shared link or the
  // language switch keeps them. The ?place= search link stays until it has run.
  function syncUrl() {
    var query = Flow.toQuery(state.answers);
    if (state.town.deepLink) query += (query ? "&" : "") + "place=" + encodeURIComponent(state.town.deepLink);
    try {
      history.replaceState(history.state, "", location.pathname + (query ? "?" + query : "") + location.hash);
    } catch (error) { /* a sandboxed page can refuse; the tool still works */ }
    document.querySelectorAll(".md-select__link[hreflang]").forEach(function (anchor) {
      if (!anchor.dataset.setupBase) {
        anchor.dataset.setupBase = anchor.href.split(/[?#]/)[0];
        anchor.addEventListener("click", saveForLanguageSwitch);
      }
      anchor.href = anchor.dataset.setupBase + (query ? "?" + query : "");
    });
  }

  // A language switch loads the other page with the answers in its address. What never
  // goes in an address (the flashed and bootloader ticks, the firmware version, the
  // pasted `region` reply), the Done ticks and the current step go in this tab's
  // sessionStorage, for that one load only.
  var HANDOFF_KEY = "meshcore-setup:language-switch";

  function saveForLanguageSwitch() {
    var a = state.answers;
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
        query: Flow.toQuery(a), step: state.step, at: Date.now(),
        bootloader: a.bootloader === true, flashed: a.flashed === true,
        firmware: typeof a.firmware === "string" ? a.firmware : "",
        reply: typeof a.regionReply === "string" ? a.regionReply : "",
        ticks: Object.keys(state.ticks).filter(function (key) { return state.ticks[key]; })
      }));
    } catch (error) { /* storage blocked: the answers in the address still carry over */ }
  }

  // Takes back what the other language's page saved, if it is for these same answers.
  // Returns the step it was on, or null.
  function takeLanguageSwitch() {
    var saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) || "null");
      sessionStorage.removeItem(HANDOFF_KEY);
    } catch (error) {
      return null;
    }
    if (!saved || typeof saved !== "object" || saved.query !== Flow.toQuery(state.answers) || !(Date.now() - saved.at < 600000)) return null;
    if (saved.bootloader === true) state.answers.bootloader = true;
    if (saved.flashed === true) state.answers.flashed = true;
    if (Flow.VERSIONS.indexOf(saved.firmware) !== -1) state.answers.firmware = saved.firmware;
    if (typeof saved.reply === "string" && saved.reply) state.answers.regionReply = saved.reply.slice(0, 4000);
    (Array.isArray(saved.ticks) ? saved.ticks : []).forEach(function (key) { if (typeof key === "string") state.ticks[key] = true; });
    return typeof saved.step === "string" ? saved.step : null;
  }

  // ------------------------------------------------------------------ region data

  // The boundaries are large, so they load only once a screen needs them: the town
  // step, or a link that already holds a town or a region. A failed load is tried
  // once more by itself, then the screen offers "Try again".
  function loadData() {
    if (!state.dataPromise) {
      var fetcher = function (url, init) { return window.fetch(url, init); };
      state.dataFailed = false;
      state.dataPromise = Place.loadData(SCRIPT_URL, fetcher).catch(function () {
        return new Promise(function (resolve) { window.setTimeout(resolve, 1000); }).then(function () { return Place.loadData(SCRIPT_URL, fetcher); });
      }).then(function (data) {
        state.data = data;
        adoptData();
        return data;
      }, function (error) {
        state.dataFailed = true;
        state.dataPromise = null;
        dataArrived();
        throw error;
      });
      state.dataPromise.catch(function () { /* shown on the screen */ });
    }
    return state.dataPromise;
  }

  function retryData() {
    state.dataFailed = false;
    dataArrived();
    loadData().catch(function () { /* shown on the screen */ });
  }

  // Checks what a link said against the region data: an old region code moves to its
  // new one, a region the map doesn't have is dropped, and choices the region doesn't
  // offer are cleared. Then the screen catches up.
  function adoptData() {
    var a = state.answers;
    var data = state.data;
    var next = Object.assign({}, a);
    if (a.tag) {
      var options = Place.fromCode(a.tag, data);
      var legacy = data.catalog.legacyAliases && data.catalog.legacyAliases[a.tag];
      if (!options.length && Array.isArray(legacy) && legacy.length === 1) options = Place.fromCode(legacy[0], data);
      var match = options.filter(function (option) { return option.province === a.province; })[0];
      if (!match && !a.province && options.length === 1) match = options[0];
      if (match) {
        next.tag = match.tag;
        next.province = match.province;
      } else if (options.length && !a.province) {
        // A link with a region but no province: ask which side it is on.
        next = Flow.resetDependents(next, "place");
        delete next.place;
        state.town.options = options;
        state.town.status = "province";
      } else {
        next = Flow.resetDependents(next, "place");
        delete next.place;
        state.town.linkInvalid = true;
      }
    }
    if (next.tag) {
      var radios = Place.radioOptions(next.tag, data);
      if (next.radio && !radios.some(function (option) { return option.id === next.radio; })) delete next.radio;
      // Any other region can be ticked, not only the nearest ones: keep what the catalogue knows as a region.
      if (Array.isArray(next.neighbours)) {
        next.neighbours = next.neighbours.filter(function (tag) {
          return tag !== next.tag && has(data.catalog.hierarchy, tag) && data.catalog.hierarchy[tag].kind === "city";
        });
      }
      // Only the scopes the tool lists for the province stay: an old link's US network, or a scope from
      // another province, is dropped without a word.
      if (Array.isArray(next.external)) {
        var offeredScopes = Place.crossBorder(next.province, data).map(function (item) { return item.scope; });
        next.external = next.external.filter(function (tag) { return offeredScopes.indexOf(tag) !== -1; });
        if (!next.external.length) delete next.external;
      }
    }
    if (Flow.toQuery(next) === Flow.toQuery(a)) {
      state.answers = next;
      return dataArrived();
    }
    setAnswers(next);
    // An answer the link held was dropped: go back to the first open question.
    var ids = stepList();
    var open = firstOpen(ids);
    if (ids.indexOf(open) >= ids.indexOf(state.step)) return dataArrived();
    state.step = open;
    renderStep({});
  }

  function dataArrived() {
    if (!state.frame) return;
    if (state.step === "town") renderTownResults();
    else if (state.step === "location") locationData();
    else if (DATA_STEPS.indexOf(state.step) !== -1) renderStep({});
    updateActions();
  }

  function regionName(tag) {
    var entry = state.data && has(state.data.catalog.hierarchy, tag) ? state.data.catalog.hierarchy[tag] : null;
    return entry ? (isFrench && entry.labelFr) || entry.label : String(tag || "").toUpperCase();
  }

  function provinceName(code) {
    var entry = state.data && code && has(state.data.catalog.hierarchy, code) ? state.data.catalog.hierarchy[code] : null;
    return entry ? (isFrench && entry.labelFr) || entry.label : String(code || "").toUpperCase();
  }

  function sayList(values) {
    if (values.length < 2) return values.join("");
    return values.slice(0, -1).join(", ") + " " + t("list.and") + " " + values[values.length - 1];
  }

  // ------------------------------------------------------------------ screen frame

  function buildFrame(root) {
    var progress = el("p", { class: "setup-progress", id: "setup-progress", "data-setup-progress": "" });
    var fill = el("div", { class: "setup-bar__fill" });
    var panel = el("section", { class: "setup-panel" });
    var share = el("button", { type: "button", class: "setup-link-button", "data-setup-share": "", on: { click: shareLink } }, t("nav.share"));
    var live = el("p", { class: "setup-sr", role: "status", "aria-live": "polite", "data-setup-live": "" });
    root.textContent = "";
    append(root, [progress, el("div", { class: "setup-bar", "aria-hidden": "true" }, fill), panel,
      el("p", { class: "setup-share" }, share), live]);
    state.frame = { progress: progress, fill: fill, panel: panel, share: share, live: live };
  }

  function renderProgress() {
    var ids = stepList();
    var index = Math.max(0, ids.indexOf(state.step));
    state.frame.progress.textContent = t("nav.progress", { n: index + 1, total: ids.length, label: t("step." + state.step) });
    state.frame.fill.style.width = Math.round(((index + 1) / ids.length) * 100) + "%";
  }

  // The element to give focus back to after a screen is drawn again.
  var FOCUS_KEYS = ["data-setup-choice", "data-setup-help", "data-setup-neighbour", "data-setup-external", "data-setup-custom-toggle",
    "data-setup-pin", "data-setup-location-off", "data-done", "data-copy"];

  function focusSelector(element) {
    if (!element || !state.frame.panel.contains(element)) return null;
    for (var i = 0; i < FOCUS_KEYS.length; i += 1) {
      var holder = element.closest("[" + FOCUS_KEYS[i] + "]");
      if (holder) return "[" + FOCUS_KEYS[i] + '="' + holder.getAttribute(FOCUS_KEYS[i]) + '"]';
    }
    return null;
  }

  // Draws the current step. `options.heading` moves focus to its question (after Next
  // or Back); `options.focus` is a selector to focus; otherwise focus stays put.
  function renderStep(options) {
    options = options || {};
    var ids = stepList();
    if (ids.indexOf(state.step) === -1) state.step = firstOpen(ids);
    var id = state.step;
    var screen = SCREENS[id];
    var keep = options.focus || (!options.heading && focusSelector(document.activeElement));
    dropMap();

    var heading = el("h2", { class: "setup-question", id: "setup-question", tabindex: "-1", "aria-describedby": "setup-progress" },
      screen.question ? screen.question() : t(id + ".question"));
    var row = el("div", { class: "setup-question-row" }, heading);
    var panel = el("section", { class: "setup-panel", "data-setup-step": id, "aria-labelledby": "setup-question" }, row);
    if (screen.help) {
      var help = helpParts(id, screen.help());
      row.appendChild(help.button);
      panel.appendChild(help.panel);
    }
    var body = el("div", { class: "setup-body" });
    panel.appendChild(body);
    screen.body(body);
    panel.appendChild(actions(id, ids));

    state.frame.panel.replaceWith(panel);
    state.frame.panel = panel;
    renderProgress();

    if (options.heading) {
      // Bring the new question into view below the site's sticky header.
      var cover = 0;
      document.querySelectorAll(".md-header, .md-tabs").forEach(function (bar) { cover = Math.max(cover, bar.getBoundingClientRect().bottom); });
      if (state.root.getBoundingClientRect().top < cover) state.root.scrollIntoView({ block: "start" });
      heading.focus({ preventScroll: true });
    } else if (keep) {
      var target = panel.querySelector(keep);
      if (target) (target.matches("input, button, textarea") ? target : target.querySelector("input") || target).focus();
    }
  }

  function actions(id, ids) {
    var index = ids.indexOf(id);
    var back = el("button", { type: "button", class: "setup-button setup-button--secondary", "data-setup-back": "", disabled: index <= 0,
      on: { click: function () { move(-1); } } }, t("nav.back"));
    // The last screen has no Next; Start over is a small link further up, and asks first.
    var forward = id === "check" ? null : el("button", { type: "button", class: "setup-button", "data-setup-next": "", disabled: !canContinue(id),
      on: { click: function () { move(1); } } }, t(id === "commands" ? "nav.to-check" : "nav.next"));
    return el("div", { class: "setup-actions" }, [back, forward]);
  }

  function updateActions() {
    var forward = state.frame.panel.querySelector("[data-setup-next]");
    if (forward) forward.disabled = !canContinue(state.step);
    renderProgress();
  }

  function move(delta) {
    var ids = stepList();
    var index = ids.indexOf(state.step);
    if (delta > 0 && !canContinue(state.step)) return;
    go(ids[Math.max(0, Math.min(ids.length - 1, index + delta))]);
  }

  function go(id) {
    state.step = id;
    arrive(id);
    renderStep({ heading: true });
  }

  // What a step sets up when the person reaches it.
  function arrive(id) {
    var a = state.answers;
    if (id === "town" || id === "location" || id === "commands" || id === "check") loadData();
    if (id === "name" && a.name === undefined) {
      var suggested = Flow.suggestName(a, a.tag ? regionName(a.tag) : "");
      if (suggested) setAnswers(Object.assign({}, a, { name: suggested }));
    }
  }

  function restart() {
    state.answers = {};
    state.ticks = {};
    state.help = {};
    state.olderFirmware = false;
    state.pinTyped = false;
    state.town = freshTown();
    syncUrl();
    go("type");
  }

  // The "?" next to a question: an in-place answer and, where the guide covers it, one link there.
  function helpParts(id, help) {
    var open = !!state.help[id];
    var panelId = "setup-help-" + id;
    var panel = el("div", { class: "setup-help", id: panelId, "data-setup-help-text": "", hidden: !open });
    append(panel, para(rich(help.key)));
    var links = (help.extra || []).concat(help.anchor ? [link(t(help.linkKey || "help.more"), LINKS.guide + "#" + help.anchor)] : []);
    var line = el("p", { class: "setup-help__links" });
    links.forEach(function (item, index) {
      if (index) line.appendChild(document.createTextNode(" · "));
      line.appendChild(item);
    });
    if (links.length) panel.appendChild(line);
    var button = el("button", { type: "button", class: "setup-help-toggle", "data-setup-help": id, "aria-expanded": open ? "true" : "false",
      "aria-controls": panelId, "aria-label": t("help.toggle"), title: t("help.toggle"), on: { click: function () {
        state.help[id] = !state.help[id];
        button.setAttribute("aria-expanded", state.help[id] ? "true" : "false");
        panel.hidden = !state.help[id];
      } } }, el("span", { class: "setup-help-toggle__mark", "aria-hidden": "true", text: "?" }));
    return { button: button, panel: panel };
  }

  // ------------------------------------------------------------------ step screens

  var detailCount = 0;

  // One answer, drawn as a card. The button holds the answer's name and the card's
  // whole area (see setup.css); the longer description (one line, or a list of lines)
  // is linked to it, so the button stays a normal size and screen readers still hear all of it.
  function choice(value, title, detail, options) {
    options = options || {};
    var disabled = !!options.disabled;
    var lines = (Array.isArray(detail) ? detail : [detail]).filter(Boolean).map(function (line) {
      return el("span", { class: "setup-choice__detail", id: "setup-choice-detail-" + (detailCount += 1), text: line });
    });
    var button = el("button", { type: "button", class: "setup-choice__button", "data-setup-choice": value,
      "aria-pressed": options.pressed ? "true" : "false", "aria-disabled": disabled ? "true" : null,
      "aria-describedby": lines.map(function (line) { return line.id; }).join(" ") || null,
      on: { click: function () { if (!disabled) options.pick(); } } }, title);
    return el("div", { class: "setup-choice" + (options.pressed ? " is-picked" : "") + (disabled ? " is-disabled" : ""), "data-setup-card": value },
      [button].concat(lines));
  }

  function choiceGroup(buttons, labelId) {
    return el("div", { class: "setup-choices", role: "group", "aria-labelledby": labelId || "setup-question" }, buttons);
  }

  // A choice that sets one answer and draws the screen again.
  function answerChoice(key, value, answer, title, detail) {
    return choice(value, title, detail, {
      pressed: state.answers[key] === answer,
      pick: function () { if (choose(key, answer)) renderStep({ focus: '[data-setup-choice="' + value + '"]' }); }
    });
  }

  function confirmBox(key, words) {
    var box = el("input", { type: "checkbox", "data-setup-confirm": "", checked: state.answers[key] === true, on: { change: function () {
      var next = Object.assign({}, state.answers);
      if (box.checked) next[key] = true; else delete next[key];
      setAnswers(next);
      updateActions();
    } } });
    return el("label", { class: "setup-check" }, [box, el("span", null, rich(words))]);
  }

  function steps(keys) {
    return el("ol", { class: "setup-steps" }, keys.map(function (item) {
      return el("li", null, Array.isArray(item) ? rich(item[0], item[1], item[2]) : rich(item));
    }));
  }

  // The MeshCore app's way to Command Line, with its screenshots.
  function phoneSteps() {
    var shots = [
      ["commands.phone.step1", "repeater-01-contacts.webp", "phone.img.contacts"],
      ["commands.phone.step2", "repeater-02-login.webp", "phone.img.login"],
      ["commands.phone.step3", "repeater-03-admin.webp", "phone.img.admin"]
    ];
    return el("ol", { class: "setup-phone-steps", "data-setup-phone-steps": "" }, shots.map(function (shot) {
      return el("li", null, el("div", { class: "setup-shot" }, [
        el("p", null, rich(shot[0])),
        el("img", { src: imageUrl(shot[1]), alt: t(shot[2]), width: "600", height: "1304", loading: "lazy", decoding: "async" })
      ]));
    }));
  }

  function loading(body) {
    if (!state.dataFailed) return body.appendChild(para(t("tool.loading"), { class: "setup-hint", role: "status" }));
    body.appendChild(para(t("tool.load-failed"), { class: "setup-note setup-note--warn", role: "alert" }));
    body.appendChild(el("button", { type: "button", class: "setup-button setup-button--secondary setup-button--small", "data-setup-retry": "",
      on: { click: retryData } }, t("tool.retry")));
  }

  // A screen with two answers. Each option is [value on the page, answer stored]; its
  // words are the keys "<step>.<value>" and "<step>.<value>.detail". `after` adds notes.
  function pair(key, help, options, after) {
    return {
      help: help && function () { return help; },
      body: function (body) {
        body.appendChild(choiceGroup(options.map(function (option) {
          return answerChoice(key, option[0], option[1], t(key + "." + option[0]), t(key + "." + option[0] + ".detail"));
        })));
        if (after) after(body);
      }
    };
  }

  // Each step: its question (the "<step>.question" text unless given), its "?" help, and its body.
  var SCREENS = {
    type: pair("type", { key: "type.help", anchor: "what-a-repeater-is" }, [["repeater", "repeater"], ["observer", "observer"]]),

    repeat: pair("repeat", { key: "repeat.help", anchor: "repeater-observers" }, [["both", "both"], ["listen", "listen"]]),

    board: {
      help: function () { return { key: "board.help", anchor: "repeater-observers" }; },
      body: function (body) {
        var a = state.answers;
        var observer = a.type === "observer";
        // A repeater observer needs Wi-Fi, so only ESP32 is open to it; that card comes first.
        body.appendChild(choiceGroup((observer ? ["esp32", "nrf52"] : ["nrf52", "esp32"]).map(function (kind) {
          var blocked = observer && kind === "nrf52";
          // A greyed-out card says why, then still shows the examples that tell the kinds apart.
          return choice(kind, t("board." + kind), [t(blocked ? "board.no-wifi.detail" : "board." + kind + ".detail"), t("board." + kind + ".examples")],
            { disabled: blocked, pressed: a.board === kind && !blocked, pick: function () {
              if (choose("board", kind)) renderStep({ focus: '[data-setup-choice="' + kind + '"]' });
            } });
        })));
        body.appendChild(para(t("board.hint"), { class: "setup-hint" }));
        // Then the note that fits the pick. An observer is warned about nRF52 until it picks ESP32.
        if (observer && a.board !== "esp32") {
          body.appendChild(note("warn", [para(t("board.observer-nrf52")),
            el("button", { type: "button", class: "setup-button setup-button--secondary setup-button--small", "data-setup-as-repeater": "",
              on: { click: function () { choose("type", "repeater"); renderStep({ heading: true }); } } }, t("board.as-repeater"))]));
        }
        if (a.board === "esp32" && observer) body.appendChild(note("info", t("board.other-observer")));
        if (a.board === "nrf52" && !observer) body.appendChild(note("ok", t("board.nrf52-next")));
      }
    },

    status: pair("status", { key: "status.help", anchor: "back-up" }, [["new", "new"], ["running", "running"]], function (body) {
      if (state.answers.status === "running") body.appendChild(note("warn", para(rich("status.backup", null, LINKS.flasher))));
    }),

    reflash: pair("reflash", { key: "reflash.help" }, [["yes", true], ["no", false]]),

    observerFirmware: pair("observerFirmware", { key: "observerFirmware.help", anchor: "repeater-observers" }, [["yes", "yes"], ["no", "no"]], function (body) {
      if (state.answers.observerFirmware === "no") body.appendChild(note("warn", para(rich("observerFirmware.switch"))));
    }),

    bootloader: {
      help: function () { return { key: "bootloader.help" }; },
      body: function (body) {
        body.appendChild(steps([["bootloader.step1", null, LINKS.otafix], "bootloader.step2", "bootloader.step3", "bootloader.step4"]));
        body.appendChild(para(rich("bootloader.mismatch"), { class: "setup-hint" }));
        body.appendChild(confirmBox("bootloader", "bootloader.confirm"));
      }
    },

    flash: {
      question: function () { return t(state.answers.type === "observer" ? "flash.question.observer" : "flash.question.repeater"); },
      body: function (body) {
        var a = state.answers;
        var kind = a.type === "observer" ? "observer" : "repeater";
        var erase = t("flash.erase." + (a.board === "nrf52" ? "nrf52" : "esp32") + "-" + (a.status === "running" ? "running" : "new"));
        var open = ["flash." + kind + ".step1", null, kind === "observer" ? LINKS.observerFlasher : LINKS.flasher];
        // nRF52 boards go through DFU mode and a port choice, and Erase Flash is its own button.
        body.appendChild(steps(a.board === "nrf52"
          ? [open, "flash." + kind + ".step2", "flash.nrf52.dfu", "flash.nrf52.port", "flash.erase.nrf52-" + (a.status === "running" ? "running" : "new"), "flash.nrf52.flash", "flash.step4"]
          : [open, "flash." + kind + ".step2", ["flash." + kind + ".step3", { erase: erase }], "flash.step4"]));
        body.appendChild(para(t("flash.failed"), { class: "setup-hint" }));
        body.appendChild(confirmBox("flashed", "flash.confirm"));
      }
    },

    version: {
      help: function () { return { key: "version.help", anchor: "older-firmware" }; },
      body: versionBody
    },

    town: {
      help: function () { return { key: "town.help", anchor: "scopes-and-regions" }; },
      body: townBody
    },

    radio: {
      help: function () { return { key: "radio.help", anchor: "settings" }; },
      body: radioBody
    },

    role: {
      help: function () { return { key: "role.help", anchor: "city-or-edge", extra: [link(t("role.meshmapper"), LINKS.meshmapper)] }; },
      body: roleBody
    },

    neighbours: {
      help: function () { return { key: "neighbours.help", anchor: "city-or-edge" }; },
      body: neighboursBody
    },

    name: {
      help: function () { return { key: "name.help", anchor: "settings" }; },
      body: nameBody
    },

    location: {
      help: function () { return { key: "location.help", anchor: "settings" }; },
      body: locationBody
    },

    commands: {
      question: function () { return t(Flow.route(state.answers) === "phone" ? "commands.question.phone" : "commands.question.console"); },
      body: commandsBody
    },

    check: {
      body: checkBody
    }
  };

  // Firmware version: asked only for a board that is left as it is, since a flashed one
  // gets the newest. "Older than 1.14" can't be set up, so it offers the update instead.
  var FIRMWARE_CHOICES = ["1.16", "1.15", "1.14", "older"];

  function versionBody(body) {
    body.appendChild(choiceGroup(FIRMWARE_CHOICES.map(function (value) {
      return choice(value, t("version." + value), t("version." + value + ".detail"), {
        pressed: value === "older" ? state.olderFirmware : state.answers.firmware === value,
        pick: function () {
          var next = Object.assign({}, state.answers);
          if (value === "older") delete next.firmware; else next.firmware = value;
          state.olderFirmware = value === "older";
          setAnswers(next);
          renderStep({ focus: '[data-setup-choice="' + value + '"]' });
          // The update button appears below the choices; say so for screen readers.
          if (value === "older") announce(t("version.older.detail") + " " + t("version.update"));
        }
      });
    })));
    body.appendChild(para(rich("version.hint"), { class: "setup-hint" }));
    // The card already says to update first, so all that is left is the way to do it.
    if (state.olderFirmware) {
      body.appendChild(para(el("button", { type: "button", class: "setup-button setup-button--small", "data-setup-update": "", on: { click: updateFirst } }, t("version.update"))));
    }
  }

  // Firmware older than 1.14: flash the latest first. The board is flashed from here on,
  // so the version question goes away and the newest firmware is assumed.
  function updateFirst() {
    if (state.answers.type === "observer") choose("observerFirmware", "no"); else choose("reflash", true);
    go(stepList().indexOf("bootloader") !== -1 ? "bootloader" : "flash");
  }

  function radioBody(body) {
    body.appendChild(para(t("radio.hint"), { class: "setup-hint" }));
    body.appendChild(choiceGroup(radioOptions().map(function (option) {
      var profile = state.data.profiles.filter(function (item) { return item.id === option.id; })[0];
      var groups = isFrench ? option.communitiesFr : option.communities;
      var usedBy = groups.length ? t("radio.used-by", { list: sayList(groups) }) : "";
      if (option.id === "canada") {
        return answerChoice("radio", "canada", "canada", t("radio.canada"), [t("radio.canada.detail"), usedBy].filter(Boolean).join(" "));
      }
      var radio = profile.radio;
      var number = function (value) { return isFrench ? String(value).replace(".", ",") : String(value); };
      var settings = t("radio.settings", { mhz: number(radio.frequency_mhz), khz: number(radio.bandwidth_khz), sf: radio.spreading_factor, cr: radio.coding_rate });
      var name = (isFrench && profile.name_fr) || profile.name;
      return answerChoice("radio", option.id, option.id, t("radio.community", { profile: name }), [settings + ".", usedBy].filter(Boolean).join(" "));
    })));
    body.appendChild(para(t("radio.not-in-group"), { class: "setup-hint" }));
  }

  function roleBody(body) {
    var a = state.answers;
    var region = regionName(a.tag) + " (" + a.tag + ")";
    body.appendChild(choiceGroup([
      answerChoice("role", "city", "city", t("role.city"), t("role.city.detail", { region: region })),
      answerChoice("role", "edge", "edge", t("role.edge"), t("role.edge.detail", { region: region }))
    ]));
    // A city repeater can carry a cross-border scope the tool lists for its province, or one it agreed with a
    // network across the border (offered in every province); an edge repeater picks them on the next screen.
    if (a.role === "city") {
      body.appendChild(scopeBoxes(Place.crossBorder(a.province, state.data), t("role.shared.question"), t("role.shared.hint")));
    }
  }

  function checkboxRow(attrs, label, checked, onChange, boxAttrs) {
    var box = el("input", Object.assign({ type: "checkbox", checked: checked, on: { change: function () { onChange(box.checked); } } }, boxAttrs || {}));
    return el("label", Object.assign({ class: "setup-check" }, attrs), [box, el("span", null, label)]);
  }

  // The cross-border scopes the tool lists for the province, each with its name and what it is for, then the
  // box for one the person agreed by hand. Ticked scopes are kept in the list's order.
  function scopeBoxes(scopes, legend, hint) {
    var tags = scopes.map(function (item) { return item.scope; });
    var set = el("fieldset", { class: "setup-fieldset" }, [el("legend", { text: legend }), para(hint, { class: "setup-hint" })]);
    scopes.forEach(function (item) {
      var label = [el("span", { class: "setup-check__name", text: isFrench ? item.nameFr : item.name }), " ",
        el("span", { class: "setup-check__why", text: isFrench ? item.descriptionFr : item.description })];
      set.appendChild(checkboxRow({ "data-setup-external": item.scope }, label, (state.answers.external || []).indexOf(item.scope) !== -1, function (checked) {
        var list = (state.answers.external || []).filter(function (tag) { return tag !== item.scope; });
        if (checked) list.push(item.scope);
        var next = Object.assign({}, state.answers);
        if (list.length) next.external = tags.filter(function (tag) { return list.indexOf(tag) !== -1; }).concat(list.filter(function (tag) { return tags.indexOf(tag) === -1; }));
        else delete next.external;
        setAnswers(next);
        updateActions();
      }));
    });
    set.appendChild(customBox());
    set.appendChild(para(rich("custom.share", null, LINKS.idea), { class: "setup-hint", "data-setup-custom-share": "" }));
    return set;
  }

  // "Another scope we've agreed with a network across the border": a tick, and once it is ticked the
  // name to type. A name is stored clean (trimmed, lower case); one the generator would refuse is shown
  // with a plain message, and the Next button waits (see MeshCoreSetupFlow.isComplete).
  function customBox() {
    var ticked = state.answers.custom !== undefined;
    var input = el("input", { type: "text", id: "setup-custom", class: "setup-input", "data-setup-custom": "", value: state.answers.custom || "",
      autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-describedby": "setup-custom-hint setup-custom-message" });
    var message = el("div", { id: "setup-custom-message", class: "setup-message", "data-setup-custom-message": "", "aria-live": "polite" });
    var field = el("div", { class: "setup-custom", "data-setup-custom-field": "", hidden: !ticked }, [
      el("div", { class: "setup-field" }, [el("label", { for: "setup-custom", text: t("custom.name") }),
        para(t("custom.hint"), { class: "setup-hint", id: "setup-custom-hint" }), input]),
      message
    ]);
    // Says what is wrong once something is typed; an empty box needs no message, the hint says what to type.
    function check() {
      message.textContent = "";
      if (Flow.customProblem(input.value) === "characters") message.appendChild(note("warn", t("custom.invalid")));
    }
    function store() {
      var next = Object.assign({}, state.answers);
      next.custom = Flow.cleanCustom(input.value);
      setAnswers(next);
      check();
      updateActions();
    }
    input.addEventListener("input", store);
    check();
    var row = checkboxRow({}, t("custom.label"), ticked, function (checked) {
      field.hidden = !checked;
      if (checked) {
        store();
        input.focus();
      } else {
        var next = Object.assign({}, state.answers);
        delete next.custom;
        setAnswers(next);
        updateActions();
      }
    }, { "data-setup-custom-toggle": "" });
    return el("div", { class: "setup-custom-box" }, [row, field]);
  }

  // How many of the nearest regions are listed before the person searches, and how many search results.
  var NEAREST = 5;
  var FOUND = 8;

  // Where the nearest regions are measured from: the place the person searched for (or moved the pin to),
  // else the middle of the home region, as after a link from the region map.
  function neighbourSpot() {
    var a = state.answers;
    return Flow.hasPin(a.place) ? a.place : Place.centre(a.tag, state.data);
  }

  // "about 40 km": the nearest kilometre, or the nearest ten from 100 km on.
  function kmWords(km) {
    var rounded = km >= 100 ? Math.round(km / 10) * 10 : Math.round(km);
    return rounded.toLocaleString(isFrench ? "fr-CA" : "en-CA");
  }

  function neighboursBody(body) {
    if (!state.data) return loading(body);
    var a = state.answers;
    var away = {};
    var nearest = Place.nearest(neighbourSpot(), state.data, { exclude: [a.tag] });
    nearest.forEach(function (item) { away[item.tag] = item.km; });
    // The nearest five, then every other region already ticked (by distance), as they stay in the list.
    var shown = nearest.slice(0, NEAREST).map(function (item) { return item.tag; });
    (Array.isArray(a.neighbours) ? a.neighbours : []).filter(function (tag) { return shown.indexOf(tag) === -1; })
      .sort(function (x, y) { return (has(away, x) ? away[x] : Infinity) - (has(away, y) ? away[y] : Infinity); })
      .forEach(function (tag) { shown.push(tag); });

    function label(tag) {
      var region = regionName(tag);
      if (!has(away, tag)) return region + " (" + tag + ")";
      return away[tag] < 1 ? t("neighbours.region.near", { region: region, tag: tag }) : t("neighbours.region", { region: region, tag: tag, km: kmWords(away[tag]) });
    }
    function ticked(tag) {
      return Array.isArray(state.answers.neighbours) && state.answers.neighbours.indexOf(tag) !== -1;
    }

    var set = el("fieldset", { class: "setup-fieldset setup-fieldset--plain" }, el("legend", { class: "setup-sr", text: t("neighbours.question") }));
    var boxes = {};
    var foundBoxes = {};
    var noneBox = null;
    // Every box shows what is ticked: the list, the search results, and "None of these".
    function sync() {
      var list = state.answers.neighbours;
      Object.keys(boxes).forEach(function (tag) { boxes[tag].checked = ticked(tag); });
      Object.keys(foundBoxes).forEach(function (tag) { foundBoxes[tag].checked = ticked(tag); });
      noneBox.checked = Array.isArray(list) && !list.length;
    }
    function toggle(tag, checked) {
      var next = Object.assign({}, state.answers);
      var list = (Array.isArray(next.neighbours) ? next.neighbours : []).filter(function (item) { return item !== tag; });
      if (checked) list.push(tag);
      if (list.length) next.neighbours = list.sort(); else delete next.neighbours;
      setAnswers(next);
      sync();
      updateActions();
    }
    var noneRow = checkboxRow({ "data-setup-neighbour": "none" }, t("neighbours.none"), false, function (checked) {
      var next = Object.assign({}, state.answers);
      if (checked) next.neighbours = []; else delete next.neighbours;
      setAnswers(next);
      sync();
      updateActions();
    });
    noneBox = noneRow.querySelector("input");
    set.appendChild(noneRow);
    // A region is added above "None of these", and stays for as long as this screen does, ticked or not.
    function addRow(tag) {
      if (has(boxes, tag)) return;
      var row = checkboxRow({ "data-setup-neighbour": tag }, label(tag), ticked(tag), function (checked) { toggle(tag, checked); });
      boxes[tag] = row.querySelector("input");
      set.insertBefore(row, noneRow);
    }
    shown.forEach(addRow);
    body.appendChild(para(t("neighbours.hint"), { class: "setup-hint" }));
    body.appendChild(set);
    sync();

    // Any other region: a search of the catalogue's names, aliases and codes. Nothing is sent anywhere.
    var input = el("input", { type: "text", id: "setup-find", class: "setup-input", "data-setup-find": "", autocomplete: "off",
      autocapitalize: "off", spellcheck: "false", "aria-describedby": "setup-find-hint setup-find-status" });
    var status = el("p", { id: "setup-find-status", class: "setup-message", "data-setup-find-status": "", role: "status" });
    var found = el("div", { "data-setup-found-list": "", role: "group", "aria-labelledby": "setup-find-label" });
    input.addEventListener("input", function () {
      found.textContent = "";
      foundBoxes = {};
      status.textContent = "";
      if (input.value.trim().length < 2) return;
      var hits = Place.search(input.value, state.data, { exclude: [a.tag], limit: FOUND + 1 });
      if (!hits.length) {
        status.textContent = t("neighbours.find.none");
        return;
      }
      hits.slice(0, FOUND).forEach(function (hit) {
        var row = checkboxRow({ "data-setup-found": hit.tag }, label(hit.tag), ticked(hit.tag), function (checked) {
          var added = checked && !has(boxes, hit.tag);
          if (added) {
            // Added to the list first; the tick below then shows in the list and in the results.
            addRow(hit.tag);
            announce(t("neighbours.added", { region: regionName(hit.tag), tag: hit.tag }));
          }
          toggle(hit.tag, checked);
        });
        foundBoxes[hit.tag] = row.querySelector("input");
        found.appendChild(row);
      });
      status.textContent = hits.length > FOUND ? t("neighbours.find.more", { n: FOUND }) : t("neighbours.find.found", { n: hits.length });
    });
    body.appendChild(el("div", { class: "setup-field" }, [
      el("label", { for: "setup-find", id: "setup-find-label", text: t("neighbours.find") }),
      para(t("neighbours.find.hint"), { class: "setup-hint", id: "setup-find-hint" }),
      input, status, found
    ]));

    body.appendChild(para(link(t("neighbours.meshmapper"), LINKS.meshmapper)));
    body.appendChild(scopeBoxes(Place.crossBorder(a.province, state.data), t("crossborder.title"), t("crossborder.hint")));
  }

  function nameBody(body) {
    var a = state.answers;
    var input = el("input", { type: "text", id: "setup-name", class: "setup-input", "data-setup-name": "", value: a.name || "",
      maxlength: "31", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-describedby": "setup-name-hint setup-name-message" });
    var message = el("div", { id: "setup-name-message", class: "setup-message", "data-setup-name-message": "", "aria-live": "polite" });
    body.appendChild(para(rich(a.status === "running" ? "name.hint.running" : "name.hint"), { class: "setup-hint", id: "setup-name-hint" }));
    body.appendChild(el("div", { class: "setup-field" }, [el("label", { for: "setup-name", text: t("name.label") }), input]));
    body.appendChild(message);
    // Says what's wrong as soon as there is something to say; spaces alone need no message.
    function check() {
      message.textContent = "";
      var problem = Flow.nameProblem(input.value);
      if (problem === "characters") message.appendChild(note("warn", rich("name.invalid-characters")));
      if (problem === "long") message.appendChild(note("warn", rich("name.too-long")));
    }
    input.addEventListener("input", function () {
      var next = Object.assign({}, state.answers, { nameEdited: true });
      var name = Flow.cleanName(input.value);
      if (name) next.name = name; else delete next.name;
      setAnswers(next);
      check();
      updateActions();
    });
    check();
  }

  // ------------------------------------------------------------------ town search

  function townBody(body) {
    var input = el("input", { type: "text", id: "setup-town", class: "setup-input", "data-setup-town": "", value: state.town.query,
      placeholder: t("town.placeholder"), autocomplete: "off", enterkeyhint: "search", spellcheck: "false" });
    var form = el("form", { class: "setup-search", "data-setup-town-form": "", on: { submit: function (event) {
      event.preventDefault();
      searchTown(input.value);
    } } }, [
      el("label", { for: "setup-town", text: t("town.label") }),
      el("div", { class: "setup-search__row" }, [input, el("button", { type: "submit", class: "setup-button" }, t("town.search"))])
    ]);
    body.appendChild(para(rich("town.hint"), { class: "setup-hint" }));
    body.appendChild(form);
    var hint = para(rich("town.map-hint", null, LINKS.map), { class: "setup-hint setup-map-link" });
    hint.querySelector("a").setAttribute("data-setup-map", "");
    body.appendChild(hint);
    var results = el("div", { class: "setup-town-results", "data-setup-town-results": "" });
    body.appendChild(results);
    renderTownResults(results);
    if (state.town.deepLink) {
      var query = state.town.deepLink;
      state.town.deepLink = null;
      window.setTimeout(function () { searchTown(query); }, 0);
    }
  }

  function townMessage(content) {
    return para(content, { class: "setup-message", "data-setup-town-message": "" });
  }

  // Draws what the search found. Focus that was inside the results moves to what
  // replaced it: the next choice, the code box, or Next once a region is picked.
  function renderTownResults(target) {
    var box = target || state.frame.panel.querySelector("[data-setup-town-results]");
    if (!box) return;
    var hadFocus = box.contains(document.activeElement);
    drawTownResults(box);
    if (!hadFocus) return;
    var focus = (state.town.codeUnknown && box.querySelector("[data-setup-code]")) || box.querySelector("[data-setup-choice]") ||
      state.frame.panel.querySelector("[data-setup-next]:not([disabled])") || box.querySelector("[data-setup-code]");
    if (focus) focus.focus();
  }

  function drawTownResults(box) {
    var town = state.town;
    var a = state.answers;
    box.textContent = "";
    if (!state.data) return loading(box);
    if (town.linkInvalid) box.appendChild(note("info", t("town.link-invalid")));
    if (town.fellBack && town.status !== "searching") box.appendChild(note("info", t("town.address-fallback"), { "data-setup-address-fallback": "" }));
    if (town.status === "searching") {
      box.appendChild(para(t("town.searching"), { class: "setup-hint", role: "status" }));
      return;
    }
    if (town.status === "places") {
      var addresses = town.places[0].kind === "address";
      box.appendChild(townMessage(t(!addresses ? "town.places" : town.places.length > 1 ? "town.addresses" : "town.address-confirm")));
      box.appendChild(choiceGroup(town.places.map(function (place, index) {
        return choice("place:" + index, place.name, placeDetail(place), { pick: function () { pickPlace(place); } });
      })));
    } else if (town.status === "regions" || town.status === "province" || town.status === "mismatch") {
      if (town.status === "mismatch") box.appendChild(townMessage(t("town.mismatch", town.mismatch)));
      else if (town.status === "province") {
        box.appendChild(townMessage(t("town.province")));
        box.appendChild(para(t("town.province.hint"), { class: "setup-hint" }));
      } else box.appendChild(townMessage(t("town.regions")));
      box.appendChild(choiceGroup(town.options.map(function (option) {
        var title = town.status === "province" ? provinceName(option.province) : regionName(option.tag) + " (" + option.tag + ")";
        var detail = town.status === "province" ? regionName(option.tag) + " (" + option.tag + ")" : provinceName(option.province);
        return choice(option.tag + ":" + option.province, title, detail, { pick: function () { setRegion(option, town.place); } });
      })));
    } else if (town.status === "outside" || town.status === "format") {
      box.appendChild(townMessage(rich(town.status === "outside" ? "town.outside" : "town.coordinates-format")));
    } else if (town.status === "none" || town.status === "no-match" || town.status === "failed") {
      if (town.status === "none") box.appendChild(townMessage(rich("town.none", null, LINKS.map)));
      else if (town.status === "failed") box.appendChild(townMessage(rich("town.search-failed", null, LINKS.map)));
      else box.appendChild(townMessage(t(Search.isAddress(town.query) ? "town.no-address" : "town.no-match")));
      box.appendChild(codeForm());
    } else if (a.tag && a.province) {
      box.appendChild(regionCard());
      // A starter region or a planning extension isn't a MeshMapper zone: say so, as the map does.
      var kind = Place.planning(a.tag, a.place, state.data);
      var href = kind === "starter" ? LINKS.guide + "#starter-regions" : LINKS.guide + "#planning-extensions";
      if (kind) box.appendChild(note("info", para(rich("town." + kind, null, href)), { "data-setup-planning": kind }));
    }
  }

  // "Québec · Montreal (yul)": the province, and the region(s) the map puts the place in,
  // so two places with the same name can be told apart.
  function placeDetail(place) {
    var regions = [];
    Place.resolve(place, state.data).options.forEach(function (option) {
      var name = regionName(option.tag) + " (" + option.tag + ")";
      if (regions.indexOf(name) === -1) regions.push(name);
    });
    return regions.length ? place.province + " · " + sayList(regions) : place.province;
  }

  function regionCard() {
    var a = state.answers;
    var where = a.place && a.place.name ? t("town.region-detail", { town: a.place.name, province: provinceName(a.province) }) : provinceName(a.province);
    return el("div", { class: "setup-region", "data-setup-region": "" }, [
      el("span", { class: "setup-region__tag", text: a.tag }),
      el("span", { class: "setup-region__text" }, [el("strong", { text: t("town.region", { name: regionName(a.tag) }) }), el("span", { text: where })])
    ]);
  }

  // When the search can't help: a region code, or a name the region list knows.
  function codeForm() {
    var input = el("input", { type: "text", id: "setup-code", class: "setup-input", "data-setup-code": "", value: state.town.code,
      placeholder: t("town.code-placeholder"), autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    var form = el("form", { class: "setup-search", on: { submit: function (event) {
      event.preventDefault();
      useCode(input.value);
    } } }, [
      el("label", { for: "setup-code", text: t("town.code-label") }),
      el("div", { class: "setup-search__row" }, [input, el("button", { type: "submit", class: "setup-button setup-button--secondary" }, t("town.code-use"))])
    ]);
    if (state.town.codeUnknown) form.appendChild(para(rich("town.code-unknown", null, LINKS.map), { class: "setup-message", "data-setup-code-message": "", role: "alert" }));
    return form;
  }

  // A new search starts a new place: the old region and what came with it go.
  function clearPlace() {
    var next = Flow.resetDependents(state.answers, "place");
    delete next.place;
    setAnswers(next);
  }

  function showTown(status) {
    state.town.status = status;
    updateActions();
    renderTownResults();
    var message = state.frame.panel.querySelector("[data-setup-town-message]");
    if (message) announce(message.textContent);
  }

  function searchTown(raw) {
    var query = String(raw || "").trim();
    if (!query) return;
    var town = state.town;
    var token = town.token += 1;
    town.query = query;
    town.places = [];
    town.options = [];
    town.place = null;
    town.code = "";
    town.codeUnknown = false;
    town.linkInvalid = false;
    town.fellBack = false;
    clearPlace();
    showTown("searching");
    loadData().then(function (data) {
      if (token !== town.token) return;
      // Coordinates are read here and never sent to a search, even when they can't be read.
      var point = Flow.parseCoordinates(query);
      if (point) return point.inCanada ? pickPlace(coordinatesPlace(point)) : showTown("outside");
      if (Flow.looksLikeCoordinates(query)) return showTown("format");
      // A region code needs no search.
      var code = Place.fromCode(query, data);
      if (code.length) return offerRegions(code);
      // A search that hangs is stopped, so the person gets the code box instead of waiting forever.
      var controller = typeof AbortController === "function" ? new AbortController() : null;
      var timer = controller && window.setTimeout(function () { controller.abort(); }, SEARCH_TIMEOUT);
      // A town, or a street address (a number with words), which falls back to the town search.
      return Search.find(query, lang, function (url) {
        return window.fetch(url, controller ? { signal: controller.signal } : undefined);
      }).then(function (places) {
        window.clearTimeout(timer);
        if (token !== town.token) return;
        if (!places.length) return showTown("no-match");
        // A street address that wasn't found was searched as its town: say so.
        var typed = Search.addressQuery(query);
        town.fellBack = !!(typed && typed.town) && !places[0].kind;
        // An address is never used without asking: the geocoder's nearest match can be another street or town.
        if (places.length === 1 && places[0].kind !== "address") return pickPlace(places[0]);
        town.places = places;
        showTown("places");
      }, function () {
        window.clearTimeout(timer);
        if (token === town.token) showTown("failed");
      });
    }, function () {
      if (token === town.token) showTown("idle");
    });
  }

  // Coordinates typed into the box, as a place. Its name is the rounded point, which is what the
  // commands and the link use. It has no province: the region map decides which one it is in.
  function coordinatesPlace(point) {
    var lat = Math.round(point.lat * 10000) / 10000;
    var lon = Math.round(point.lon * 10000) / 10000;
    return { name: lat + ", " + lon, province: "", lat: point.lat, lon: point.lon, kind: "coordinates" };
  }

  // A street address or coordinates are the spot itself; a town's point is only near the town.
  // It decides the kind a place keeps, which the name suggestion and the map's starting zoom use.
  function exactSpot(place) {
    return !!place && (place.kind === "address" || place.kind === "coordinates");
  }

  function offerRegions(options) {
    if (options.length === 1) return setRegion(options[0], state.town.place);
    state.town.options = options;
    var oneRegion = options.every(function (option) { return option.tag === options[0].tag; });
    showTown(oneRegion ? "province" : "regions");
  }

  function pickPlace(place) {
    var town = state.town;
    var result = Place.resolve(place, state.data);
    town.place = place;
    if (result.status === "one") return setRegion(result.options[0], place);
    if (result.status === "many") return offerRegions(result.options);
    if (result.status === "none") return showTown("none");
    // The search's province and the region map disagree: show both sides and let the person choose.
    var claimed = Search.provinceCode(place.province).toLowerCase();
    var options = result.options.slice();
    result.options.forEach(function (option) {
      Place.fromCode(option.tag, state.data).forEach(function (other) {
        var known = options.some(function (item) { return item.tag === other.tag && item.province === other.province; });
        if (other.province === claimed && !known) options.push(other);
      });
    });
    var found = [];
    result.options.forEach(function (option) {
      var name = provinceName(option.province);
      if (found.indexOf(name) === -1) found.push(name);
    });
    town.options = options;
    town.mismatch = { searched: claimed ? provinceName(claimed) : place.province, found: sayList(found) };
    showTown("mismatch");
  }

  function useCode(raw) {
    var text = String(raw || "").trim();
    state.town.code = text;
    state.town.fellBack = false;
    if (!text) return;
    var options = Place.fromCode(text, state.data);
    if (!options.length) options = Place.fromAlias(text, state.data);
    if (!options.length) {
      state.town.codeUnknown = true;
      renderTownResults();
      return;
    }
    state.town.codeUnknown = false;
    offerRegions(options);
  }

  function setRegion(option, place) {
    var next = Flow.resetDependents(state.answers, "place");
    delete next.place;
    if (place) {
      next.place = { name: place.name, province: option.province, lat: place.lat, lon: place.lon };
      if (exactSpot(place)) next.place.kind = place.kind;
    }
    next.tag = option.tag;
    next.province = option.province;
    // A new place brings its own pin; with no place, the map step asks for one.
    setAnswers(next);
    state.town.status = "idle";
    state.town.options = [];
    state.town.places = [];
    state.town.linkInvalid = false;
    updateActions();
    renderTownResults();
    var card = state.frame.panel.querySelector("[data-setup-region]");
    if (card) announce(card.textContent);
  }

  // ------------------------------------------------------------------ map location

  // The site's own copy of Leaflet, the one the region map uses. It loads only when the map
  // location step opens, so the page itself stays light.
  var LEAFLET = {
    script: "../regions/vendor/leaflet/leaflet.js",
    style: "../regions/vendor/leaflet/leaflet.css",
    images: "../regions/vendor/leaflet/images/"
  };
  var TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  // How long the map's tiles may take before the step says the map couldn't load.
  var TILE_TIMEOUT = 10000;
  // The whole country, for a map with no pin on it yet.
  var CANADA_VIEW = [[41.7, -141], [70, -52.6]];
  var leafletPromise = null;

  // Resolves with Leaflet once its script and its stylesheet have both loaded. A failure is
  // forgotten, so coming back to the step tries again.
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

  function dropMap() {
    var map = state.map;
    state.map = null;
    if (!map) return;
    try { map.remove(); } catch (error) { /* it was half built; the screen goes anyway */ }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; });
  }

  // Leaflet takes its credit lines as HTML. Only this file's own words go in, escaped, and the
  // links open in a new tab like every other link in the tool.
  function creditLink(words, href) {
    return '<a href="' + href + '" target="_blank" rel="noopener" data-mc-external-ready="true">' + escapeHtml(words) +
      '<span class="setup-sr"> ' + escapeHtml(t("link.new-tab")) + "</span></a>";
  }

  function tileCredit() {
    return t("location.attribution").split("{link}").map(escapeHtml)
      .join(creditLink(t("location.attribution.link"), "https://www.openstreetmap.org/copyright"));
  }

  // The place with its pin moved to lat, lon (4 decimals, about 10 m). A town or an address
  // keeps its name and kind; a place given as coordinates is named by them, so it keeps saying
  // where it is. With no place yet, the pin becomes one, given as coordinates.
  function pinPlace(place, lat, lon) {
    lat = round4(lat);
    lon = round4(lon);
    var next = Object.assign({}, place || { province: state.answers.province, kind: "coordinates" }, { lat: lat, lon: lon });
    if (next.kind === "coordinates") next.name = lat + ", " + lon;
    return next;
  }

  // The data arrived while the map step was showing: a screen still waiting for the region's
  // middle is drawn again; otherwise the map stays as it is and only the region check catches up.
  function locationData() {
    var panel = state.frame.panel;
    if (panel.querySelector("[data-setup-location-wait]")) return renderStep({});
    var box = panel.querySelector("[data-setup-pin-region]");
    if (box) regionNote(box);
  }

  // A pin dragged into another region, or across a provincial line inside one (Ottawa to Gatineau, both
  // yow), says where it is and where to change it: the province changes the scopes too. Nothing is
  // changed for the person.
  function regionNote(box) {
    var a = state.answers;
    box.textContent = "";
    if (!state.data || !a.tag || a.shareLocation === false || !Flow.hasPin(a.place)) return;
    var found = Place.resolve({ lat: a.place.lat, lon: a.place.lon, province: "" }, state.data).options;
    if (!found.length || found.some(function (option) { return option.tag === a.tag && option.province === a.province; })) return;
    var names = [];
    found.forEach(function (option) {
      var name = regionName(option.tag) + " (" + option.tag + "), " + provinceName(option.province);
      if (names.indexOf(name) === -1) names.push(name);
    });
    box.appendChild(note("info", t("location.other-region", { region: sayList(names) }), { "data-setup-other-region": "" }));
  }

  // A town's point is somewhere in town; a street address or coordinates are close to the spot. A region's
  // middle (zoom 10) is only where the pin waits.
  function startZoom(place) {
    return exactSpot(place) ? 17 : 13;
  }

  function locationBody(body) {
    var a = state.answers;
    var off = a.shareLocation === false;
    state.pinTyped = false;
    body.appendChild(para(t("location.hint"), { class: "setup-hint" }));
    if (!off && !Flow.hasPin(a.place) && !state.data) {
      // Only a region is known, and its middle comes with the region data.
      var wait = el("div", { "data-setup-location-wait": "" });
      loading(wait);
      body.appendChild(wait);
    } else if (!off) {
      pinPicker(body);
    }
    body.appendChild(checkboxRow({}, t("location.off"), off, function (checked) {
      var next = Object.assign({}, state.answers);
      if (checked) next.shareLocation = false; else delete next.shareLocation;
      setAnswers(next);
      renderStep({ focus: "[data-setup-location-off]" });
      // The warning appears after the tick; say it for screen readers.
      if (checked) announce(t("location.off-warning"));
    }, { "data-setup-location-off": "" }));
    if (off) body.appendChild(note("warn", para(t("location.off-warning")), { "data-setup-location-warning": "" }));
  }

  // The map with its pin, and the latitude and longitude boxes, which are the way to set it by
  // keyboard or screen reader. Each follows the other. If the map can't load, the boxes still work.
  // With no place (only a region is known), the pin waits in the region's middle and nothing is kept
  // until the person moves it, taps the map or types: a region's middle on a public map would mislead.
  function pinPicker(body) {
    var a = state.answers;
    var view = { L: null, map: null, marker: null };
    var waiting = !Flow.hasPin(a.place);
    var middle = waiting && state.data && a.tag ? Place.centre(a.tag, state.data) : null;
    var start = waiting ? note("info", t("location.start"), { "data-setup-pin-start": "" }) : null;
    var how = para(t("location.how"), { class: "setup-hint", id: "setup-pin-how" });
    var canvas = el("div", { class: "setup-map__canvas", "data-setup-map": "" });
    var status = para(t("location.loading"), { class: "setup-map__status", role: "status", "data-setup-map-status": "" });
    var mapBox = el("div", { class: "setup-map", role: "group", "aria-label": t("location.map"), "aria-describedby": "setup-pin-how" }, [canvas, status]);
    function box(axis) {
      return el("input", { type: "text", id: "setup-pin-" + axis, class: "setup-input", "data-setup-pin": axis,
        value: Flow.hasPin(a.place) ? String(round4(a.place[axis])) : "", autocomplete: "off", autocapitalize: "off", spellcheck: "false",
        "aria-describedby": "setup-pin-message" });
    }
    var latBox = box("lat");
    var lonBox = box("lon");
    var message = el("div", { id: "setup-pin-message", class: "setup-message", "data-setup-pin-message": "", "aria-live": "polite" });
    var region = el("div", { "data-setup-pin-region": "", "aria-live": "polite" });
    append(body, [start, how, mapBox, el("fieldset", { class: "setup-fieldset setup-fieldset--plain setup-pin" }, [
      el("legend", { text: t("location.typed") }),
      el("div", { class: "setup-pin__fields" }, [
        el("div", { class: "setup-field" }, [el("label", { for: "setup-pin-lat", text: t("location.lat") }), latBox]),
        el("div", { class: "setup-field" }, [el("label", { for: "setup-pin-lon", text: t("location.lon") }), lonBox])
      ]),
      message
    ]), region]);
    regionNote(region);

    function problem(show) {
      message.textContent = "";
      [latBox, lonBox].forEach(function (input) { if (show) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid"); });
      if (show) message.appendChild(note("warn", rich("location.invalid")));
    }

    // The pin is somewhere new: keep it, and put the boxes in step unless they are where it came from.
    function moved(spot, typed) {
      state.pinTyped = false;
      if (start) {
        start.remove();
        start = null;
      }
      setAnswers(Object.assign({}, state.answers, { place: pinPlace(state.answers.place, spot.lat, spot.lon) }));
      if (!typed) {
        latBox.value = String(round4(spot.lat));
        lonBox.value = String(round4(spot.lon));
      }
      problem(false);
      updateActions();
    }

    function setMarker(spot) {
      if (!view.map) return;
      if (view.marker) return view.marker.setLatLng([spot.lat, spot.lon]);
      var marker = view.L.marker([spot.lat, spot.lon], { draggable: true, keyboard: false, alt: t("location.pin"), autoPan: true }).addTo(view.map);
      marker.on("dragend", function () { fromMap(marker.getLatLng()); });
      view.marker = marker;
    }

    // A tap, a click or a drag. Off the edge of Canada, the pin goes back where it was.
    function fromMap(latlng) {
      var point = latlng.wrap();
      var spot = Flow.readPin(String(round4(point.lat)), String(round4(point.lng)));
      if (!spot) {
        var back = Flow.hasPin(state.answers.place) ? state.answers.place : middle;
        if (back) setMarker(back);
        return problem(true);
      }
      setMarker(spot);
      moved(spot, false);
      regionNote(region);
    }

    // Typing moves the pin as soon as both boxes hold a spot in Canada. What's wrong is said once
    // the person leaves the box or presses Enter, not at every key.
    function fromBoxes(done) {
      var spot = Flow.readPin(latBox.value, lonBox.value);
      if (!spot) {
        state.pinTyped = true;
        if (done) problem(true);
        return updateActions();
      }
      setMarker(spot);
      if (view.map) view.map.panTo([spot.lat, spot.lon]);
      moved(spot, true);
      if (done) regionNote(region);
    }
    [latBox, lonBox].forEach(function (input) {
      input.addEventListener("input", function () { fromBoxes(false); });
      input.addEventListener("change", function () { fromBoxes(true); });
    });

    function mapFailed(map) {
      if (map && state.map === map) dropMap();
      view.map = null;
      view.marker = null;
      if (!mapBox.isConnected) return;
      how.remove();
      // No pin to move any more: the failure line says to type the spot.
      if (start) {
        start.remove();
        start = null;
      }
      mapBox.replaceWith(note("warn", para(t("location.map-failed")), { "data-setup-map-failed": "", role: "status" }));
    }

    loadLeaflet().then(function (L) {
      // The screen was drawn again or left before Leaflet arrived.
      if (!mapBox.isConnected) return;
      L.Icon.Default.imagePath = new URL(LEAFLET.images, SCRIPT_URL).href;
      // The keyboard way is the boxes, so the map and its pin aren't tab stops; the wheel scrolls the page.
      var map = L.map(canvas, { zoomControl: false, keyboard: false, scrollWheelZoom: false });
      dropMap();
      state.map = map;
      view.L = L;
      view.map = map;
      map.attributionControl.setPrefix(creditLink("Leaflet", "https://leafletjs.com"));
      L.control.zoom({ zoomInTitle: t("location.zoom-in"), zoomOutTitle: t("location.zoom-out") }).addTo(map);
      var tiles = L.tileLayer(TILES, { maxZoom: 19, attribution: tileCredit() }).addTo(map);
      var here = state.answers.place;
      if (Flow.hasPin(here)) {
        map.setView([here.lat, here.lon], startZoom(here));
        setMarker(here);
      } else if (middle) {
        // Shown, not kept: a drag, a tap or the boxes make it the answer.
        map.setView([middle.lat, middle.lon], 10);
        setMarker(middle);
      } else {
        map.fitBounds(CANADA_VIEW);
      }
      map.on("click", function (event) { fromMap(event.latlng); });
      window.setTimeout(function () { if (state.map === map) map.invalidateSize(); }, 0);
      // As on the region map: the first tile in means the map works; every tile failing, or none in time, means it doesn't.
      var settled = false;
      var timer = window.setTimeout(function () { settle(false); }, TILE_TIMEOUT);
      function settle(ok) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (state.map !== map) return;
        if (ok) status.remove(); else mapFailed(map);
      }
      tiles.once("tileload", function () { settle(true); });
      tiles.once("load", function () { settle(false); });
    }).catch(function () {
      mapFailed(view.map);
    });
  }

  // ------------------------------------------------------------------ commands screen

  function tickKey(item) { return item.id + "\n" + item.command; }

  function commandsBody(body) {
    state.scopes = null;
    if (!state.data) return loading(body);
    var a = state.answers;
    if (!Commands.fits(a, state.data)) return body.appendChild(note("warn", t("commands.too-many"), { "data-setup-too-many": "" }));
    var phone = Flow.route(a) === "phone";
    if (phone) {
      body.appendChild(para(rich("commands.where.phone")));
      body.appendChild(phoneSteps());
      body.appendChild(para(rich("commands.phone.tip"), { class: "setup-hint" }));
    } else {
      body.appendChild(para(rich("commands.where.console", { flasher: t(a.type === "observer" ? "commands.flasher.observer" : "commands.flasher.repeater") })));
    }
    var notes = el("div", { "data-setup-notes": "" });
    if (phone) notes.appendChild(note("info", t("note.radio-phone"), { "data-setup-note": "radio-phone" }));
    Commands.notes(a, state.data, lang).forEach(function (text) { notes.appendChild(note("warn", text)); });
    if (notes.childNodes.length) body.appendChild(notes);
    body.appendChild(para("", { class: "setup-done-count", "data-setup-done-count": "", "aria-live": "polite" }));
    var groups = el("div", { class: "setup-groups" });
    body.appendChild(groups);
    Commands.rollup(a, state.data, lang).forEach(function (group) {
      if (group.id === "observer") groups.appendChild(note("info", t("note.mqtt-slots"), { "data-setup-note": "mqtt-slots" }));
      groups.appendChild(commandGroup(group));
    });
    updateDoneCount(body);
  }

  function commandGroup(group) {
    var headingId = "setup-group-" + group.id;
    var heading = el("h3", { class: "setup-group__title", id: headingId, text: t("group." + group.id) });
    var section = el("section", { class: "setup-group", "aria-labelledby": headingId });
    if (group.id === "scopes") {
      var help = helpParts("scopes", { key: "group.scopes.help", anchor: "scopes-and-regions", linkKey: "group.scopes.link" });
      section.appendChild(el("div", { class: "setup-question-row setup-group__head" }, [heading, help.button]));
      section.appendChild(help.panel);
    } else {
      section.appendChild(heading);
    }
    var list = el("ol", { class: "setup-commands" });
    section.appendChild(list);
    group.items.forEach(function (item) {
      list.appendChild(commandItem(item));
      // A board that was running: its old regions are pasted here, and the lines after it clear them.
      if (item.id === "region-show") {
        section.appendChild(replyBox());
        list = el("ol", { class: "setup-commands" });
        section.appendChild(list);
        state.scopes = { list: list, status: section.querySelector("[data-setup-reply-status]") };
      }
    });
    return section;
  }

  function commandItem(item) {
    var key = tickKey(item);
    var done = !!state.ticks[key];
    var row = el("li", { class: "setup-command" + (item.manual ? " setup-command--manual" : "") + (done ? " is-done" : ""), "data-setup-command": item.id });
    var why = el("p", { class: "setup-command__why" }, codeText(item.why));
    if (item.manual) why.appendChild(el("span", { class: "setup-badge", text: t("commands.type-yourself") }));
    var code = el("code", { class: "setup-command__code", text: item.command });
    var buttons = el("div", { class: "setup-command__actions" });
    if (!item.manual) buttons.appendChild(copyButton(item.id, item.command, code));
    var doneLabel = el("span", { text: t(done ? "commands.done-ticked" : "commands.done") });
    var tick = el("button", { type: "button", class: "setup-small setup-small--done", "data-done": item.id, "aria-pressed": done ? "true" : "false", on: { click: function () {
      state.ticks[key] = !state.ticks[key];
      tick.setAttribute("aria-pressed", state.ticks[key] ? "true" : "false");
      doneLabel.textContent = t(state.ticks[key] ? "commands.done-ticked" : "commands.done");
      row.classList.toggle("is-done", !!state.ticks[key]);
      updateDoneCount();
    } } }, [doneLabel, el("span", { class: "setup-sr", text: " " + item.command })]);
    buttons.appendChild(tick);
    return append(row, [why, code, buttons]);
  }

  function replyBox() {
    var area = el("textarea", { id: "setup-reply", class: "setup-textarea", "data-setup-reply": "", rows: "6", spellcheck: "false", autocapitalize: "off",
      placeholder: t("region.paste-placeholder"), value: state.answers.regionReply || "" });
    var status = el("div", { class: "setup-message", "data-setup-reply-status": "", "aria-live": "polite" });
    area.addEventListener("input", function () {
      var next = Object.assign({}, state.answers);
      if (area.value) next.regionReply = area.value; else delete next.regionReply;
      setAnswers(next);
      refreshScopes();
    });
    replyStatus(status);
    // From the app the reply comes back over the radio, which can cut a long one short.
    var cut = Flow.route(state.answers) === "phone" ? para(rich("region.phone-cut"), { class: "setup-hint", "data-setup-reply-cut": "" }) : null;
    return el("div", { class: "setup-reply" }, [el("label", { for: "setup-reply" }, rich("region.paste-label")), area, cut, status]);
  }

  function replyStatus(status) {
    var reply = state.answers.regionReply || "";
    status.textContent = "";
    if (!reply.trim()) return;
    var read = Commands.regionRemovals(reply);
    if (!read.readable) status.appendChild(para(rich("region.unreadable"), { class: "setup-note setup-note--warn" }));
    else if (!read.names.length) status.appendChild(para(t("region.clean"), { class: "setup-note setup-note--ok" }));
    else status.appendChild(para(rich("region.errors"), { class: "setup-note setup-note--info" }));
  }

  // The pasted reply changed: redraw the scope lines after the paste box.
  function refreshScopes() {
    var scopes = state.scopes;
    if (!scopes || !scopes.list.isConnected) return;
    var group = Commands.rollup(state.answers, state.data, lang).filter(function (item) { return item.id === "scopes"; })[0];
    scopes.list.textContent = "";
    group.items.slice(group.items.findIndex(function (item) { return item.id === "region-show"; }) + 1).forEach(function (item) {
      scopes.list.appendChild(commandItem(item));
    });
    replyStatus(scopes.status);
    updateDoneCount();
  }

  function updateDoneCount(scope) {
    var counter = (scope || state.frame.panel).querySelector("[data-setup-done-count]");
    if (!counter) return;
    var items = Commands.rollup(state.answers, state.data, lang).reduce(function (all, group) { return all.concat(group.items); }, []);
    var done = items.filter(function (item) { return state.ticks[tickKey(item)]; }).length;
    counter.textContent = t("commands.progress", { done: done, total: items.length });
  }

  function checkBody(body) {
    if (!state.data) return loading(body);
    var a = state.answers;
    if (!Commands.fits(a, state.data)) return body.appendChild(note("warn", t("commands.too-many"), { "data-setup-too-many": "" }));
    var phone = Flow.route(a) === "phone";
    body.appendChild(para(rich(phone ? "check.hint.phone" : "check.hint.console"), { class: "setup-hint" }));
    body.appendChild(el("ol", { class: "setup-commands" }, Commands.checks(a, state.data, lang).map(function (item) {
      var code = el("code", { class: "setup-command__code", text: item.command });
      return el("li", { class: "setup-command", "data-setup-check": item.id }, [code, el("p", { class: "setup-command__expect" }, codeText(item.expect)),
        el("div", { class: "setup-command__actions" }, copyButton("check-" + item.id, item.command, code))]);
    })));
    if (a.type === "observer") body.appendChild(note("ok", rich("check.live", null, LINKS.live)));
    body.appendChild(note("ok", rich("check.next", null, LINKS.mounting)));
    body.appendChild(para(t(phone ? "check.recovery.phone" : "check.recovery"), { class: "setup-hint" }));
    body.appendChild(restartBox());
  }

  // "Start over", then a plain question before anything is cleared.
  function restartBox() {
    var box = el("div", { class: "setup-restart" });
    function offer(focus) {
      box.textContent = "";
      var button = el("button", { type: "button", class: "setup-link-button", "data-setup-restart": "", on: { click: ask } }, t("nav.start-over"));
      box.appendChild(button);
      if (focus) button.focus();
    }
    function ask() {
      box.textContent = "";
      var keep = el("button", { type: "button", class: "setup-button setup-button--secondary setup-button--small", "data-setup-restart-no": "",
        on: { click: function () { offer(true); } } }, t("restart.no"));
      var yes = el("button", { type: "button", class: "setup-button setup-button--small", "data-setup-restart-yes": "", on: { click: restart } }, t("restart.yes"));
      box.appendChild(note("warn", [para(t("restart.confirm"), { id: "setup-restart-question" }),
        el("div", { class: "setup-restart__buttons", role: "group", "aria-labelledby": "setup-restart-question" }, [keep, yes])]));
      keep.focus();
    }
    offer(false);
    return box;
  }

  // ------------------------------------------------------------------ copy helper

  // Copies text. Plain-HTTP previews have no clipboard API, so this falls back to a
  // hidden <textarea> and execCommand. Resolves to whether it worked.
  // `button` gets focus back afterwards when nothing else had it (Safari doesn't focus a clicked button).
  function copyText(value, button) {
    var clipboard = navigator.clipboard;
    if (clipboard && window.isSecureContext && typeof clipboard.writeText === "function") {
      return clipboard.writeText(value).then(function () { return true; }, function () { return fallbackCopy(value, button); });
    }
    return Promise.resolve(fallbackCopy(value, button));
  }

  function fallbackCopy(value, button) {
    var active = document.activeElement && document.activeElement !== document.body ? document.activeElement : button;
    var area = el("textarea", { class: "setup-copy-buffer", readonly: true, "aria-hidden": "true", tabindex: "-1" });
    area.value = value;
    document.body.appendChild(area);
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, value.length);
    var copied = false;
    try { copied = document.execCommand("copy"); } catch (error) { copied = false; }
    area.remove();
    if (active && typeof active.focus === "function") active.focus({ preventScroll: true });
    return copied;
  }

  // A Copy button that says "Copied" for a moment. If copying fails, the command is
  // selected so the person can copy it themselves.
  function copyButton(id, command, code) {
    var words = el("span", { text: t("commands.copy") });
    var button = el("button", { type: "button", class: "setup-small", "data-copy": id, on: { click: function () {
      copyText(command, button).then(function (ok) {
        if (!ok) {
          selectText(code);
          announce(t("commands.copy-failed"));
          return;
        }
        words.textContent = t("commands.copied");
        announce(t("commands.copied"));
        window.setTimeout(function () { words.textContent = t("commands.copy"); }, 2000);
      });
    } } }, [words, el("span", { class: "setup-sr", text: " " + command })]);
    return button;
  }

  // Selects a command's text.
  function selectText(node) {
    var range = document.createRange();
    range.selectNodeContents(node);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function shareLink() {
    var button = state.frame.share;
    copyText(location.href, button).then(function (ok) {
      if (!ok) { announce(t("commands.copy-failed")); return; }
      button.textContent = t("nav.share-done");
      announce(t("nav.share-done"));
      window.setTimeout(function () { button.textContent = t("nav.share"); }, 2500);
    });
  }

  // ------------------------------------------------------------------ mount

  // Shown when a setup script didn't load. setup-text.js may be the missing one, so
  // these words live here. The pages carry the same sentence for when this file is missing.
  var FAILED = {
    en: "The setup tool didn't load. Reload the page.",
    fr: "L’outil de configuration n’a pas pu se charger. Rechargez la page."
  };

  function fail(root) {
    state.root = null;
    root.removeAttribute("data-setup-ready");
    root.setAttribute("data-setup-failed", "");
    root.textContent = "";
    root.appendChild(el("p", { class: "setup-fallback", role: "alert", text: FAILED[lang] }));
  }

  function mount(root) {
    Flow = globalThis.MeshCoreSetupFlow;
    Place = globalThis.MeshCoreSetupPlace;
    Commands = globalThis.MeshCoreSetupCommands;
    Search = globalThis.MeshCorePlaceSearch;
    Text = globalThis.MeshCoreSetupText;
    if (!root || root.dataset.setupReady === "1" || state.root) return;
    if (!Flow || !Place || !Commands || !Search || !Text || !globalThis.MeshCoreIataScopes || !globalThis.MeshCoreScopeMigration) return fail(root);
    try {
      start(root);
    } catch (error) {
      // Say what broke in the console; the page shows the plain message.
      console.error(error);
      fail(root);
    }
  }

  function start(root) {
    root.dataset.setupReady = "1";
    // Every word here is already in the page's language.
    root.setAttribute("data-i18n-ignore", "");
    root.classList.add("setup-tool");
    state.root = root;

    var params = new URLSearchParams(location.search);
    state.answers = Flow.fromQuery(location.search);
    var place = (params.get("place") || "").trim().slice(0, 120);
    if (place) {
      state.town.deepLink = place;
      state.town.query = place;
    }
    var resumed = takeLanguageSwitch();
    buildFrame(root);
    var ids = stepList();
    var open = firstOpen(ids);
    // After a language switch, the step the person was on, if every step before it is still answered.
    var reachable = Flow.isComplete(open, state.answers) ? ids.length - 1 : ids.indexOf(open);
    state.step = resumed && ids.indexOf(resumed) !== -1 && ids.indexOf(resumed) <= reachable ? resumed : open;
    arrive(state.step);
    renderStep({});
    // A link that already names a town or region needs the region data now.
    if (state.answers.tag || state.answers.place || place) loadData();
    syncUrl();
  }

  globalThis.MeshCoreSetupUi = { mount: mount };

  function init() {
    var root = document.querySelector("[data-setup-tool]");
    if (root) mount(root);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
