// The guided repeater setup tool at /config/: one question per screen (layout A),
// ending with the commands to paste and the checks that show it worked.
//
// The other setup scripts do the thinking: MeshCoreSetupFlow decides which steps
// apply, MeshCoreSetupPlace finds regions, MeshCoreSetupCommands builds the command
// list and MeshCoreSetupText holds every word. This file draws them.
//
// Sections: helpers · state · answers and the address bar · region data · screen
// frame · step screens · town search · commands screen · copy helper · mount.
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
    versionText: "",   // what was typed at the version step
    town: freshTown()
  };

  function freshTown() {
    return {
      query: "",
      status: "idle",    // idle | searching | places | regions | province | mismatch | none | no-match | outside | failed
      places: [],
      options: [],
      place: null,       // the place picked from the search (a town, an address or coordinates), while its region is still open
      mismatch: null,
      code: "",
      codeUnknown: false,
      deepLink: null,    // ?place=<text>, searched when the person reaches the town step
      linkInvalid: false,
      token: 0
    };
  }

  // How long a town search may take before the tool offers the region code box instead.
  var SEARCH_TIMEOUT = 10000;

  // Steps whose screen shows region data, so it is drawn again when the data arrives.
  var DATA_STEPS = ["town", "radio", "role", "neighbours", "commands", "check"];
  // Answers whose change also clears the version that was typed.
  var CLEARS_VERSION = ["type", "board", "status", "reflash", "observerFirmware"];

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
    if (id === "town" || id === "commands") return !!state.data;
    if (id === "radio") return radioOptions().some(function (option) { return option.id === state.answers.radio; });
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
    // Shared cross-border labels (onny) suit city and edge repeaters alike, so a role change keeps them.
    if (key === "role" && Array.isArray(before.external)) {
      var shared = Place.crossBorder(before.province).shared;
      var kept = before.external.filter(function (id) { return shared.indexOf(id) !== -1; });
      if (kept.length) next.external = kept;
    }
    if (CLEARS_VERSION.indexOf(key) !== -1) state.versionText = "";
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
  // goes in an address (the flashed and bootloader ticks, the firmware version and the
  // `ver` reply, the pasted `region` reply), the Done ticks and the current step go in
  // this tab's sessionStorage, for that one load only.
  var HANDOFF_KEY = "meshcore-setup:language-switch";

  function saveForLanguageSwitch() {
    var a = state.answers;
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
        query: Flow.toQuery(a), step: state.step, at: Date.now(),
        bootloader: a.bootloader === true, flashed: a.flashed === true,
        firmware: typeof a.firmware === "string" ? a.firmware : "", version: state.versionText,
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
    if (typeof saved.version === "string") state.versionText = saved.version.slice(0, 200);
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
      if (Array.isArray(next.neighbours)) {
        var offered = Place.neighbours(next.tag, data);
        next.neighbours = next.neighbours.filter(function (tag) { return offered.indexOf(tag) !== -1; });
      }
      if (Array.isArray(next.external)) {
        var networks = Place.crossBorder(next.province);
        var allowed = networks.shared.concat(next.role === "edge" ? networks.edgeOnly : []);
        next.external = next.external.filter(function (id) { return allowed.indexOf(id) !== -1; });
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
    else if (DATA_STEPS.indexOf(state.step) !== -1) renderStep({});
    updateActions();
  }

  function boardOf(a) {
    return Flow.BOARDS.filter(function (item) { return item.id === a.board; })[0] || null;
  }

  function boardName(item) { return (isFrench && item.nameFr) || item.name; }

  function boardLabel(a) {
    var item = boardOf(a);
    return item && !/^other-/.test(item.id) ? boardName(item) : t("board.your-board");
  }

  function regionName(tag) {
    var entry = state.data && has(state.data.catalog.hierarchy, tag) ? state.data.catalog.hierarchy[tag] : null;
    return entry ? (isFrench && entry.labelFr) || entry.label : String(tag || "").toUpperCase();
  }

  function provinceName(code) {
    var entry = state.data && code && has(state.data.catalog.hierarchy, code) ? state.data.catalog.hierarchy[code] : null;
    return entry ? (isFrench && entry.labelFr) || entry.label : String(code || "").toUpperCase();
  }

  function networkName(id) {
    var paths = state.data && state.data.catalog.externalRegionPaths;
    var entry = paths && has(paths, id) ? paths[id] : null;
    var french = isFrench && (entry && entry.labelFr || (has(Text.networkLabelsFr, id) && Text.networkLabelsFr[id]));
    return french || (entry ? entry.label : id);
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
  var FOCUS_KEYS = ["data-setup-choice", "data-setup-help", "data-setup-neighbour", "data-setup-external", "data-done", "data-copy"];

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
    if (id === "town" || id === "commands" || id === "check") loadData();
    if (id === "name" && a.name === undefined) {
      var suggested = Flow.suggestName(a, a.tag ? regionName(a.tag) : "");
      if (suggested) setAnswers(Object.assign({}, a, { name: suggested }));
    }
    if (id === "neighbours" && !Array.isArray(a.neighbours) && state.data && !Place.neighbours(a.tag, state.data).length) {
      setAnswers(Object.assign({}, a, { neighbours: [] }));
    }
  }

  function restart() {
    state.answers = {};
    state.ticks = {};
    state.help = {};
    state.versionText = "";
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
  // whole area (see setup.css); the longer description is linked to it, so the
  // button stays a normal size and screen readers still hear both.
  function choice(value, title, detail, options) {
    options = options || {};
    var disabled = !!options.disabled;
    var detailId = detail ? "setup-choice-detail-" + (detailCount += 1) : null;
    var button = el("button", { type: "button", class: "setup-choice__button", "data-setup-choice": value,
      "aria-pressed": options.pressed ? "true" : "false", "aria-disabled": disabled ? "true" : null, "aria-describedby": detailId,
      on: { click: function () { if (!disabled) options.pick(); } } }, title);
    return el("div", { class: "setup-choice" + (options.pressed ? " is-picked" : "") + (disabled ? " is-disabled" : ""), "data-setup-card": value },
      [button, detail ? el("span", { class: "setup-choice__detail", id: detailId, text: detail }) : null]);
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
  function phoneSteps(withVersion) {
    var shots = [
      ["commands.phone.step1", "repeater-01-contacts.webp", "phone.img.contacts"],
      ["commands.phone.step2", "repeater-02-login.webp", "phone.img.login"],
      ["commands.phone.step3", "repeater-03-admin.webp", "phone.img.admin"]
    ];
    if (withVersion) shots.push(["version.phone.step4", "repeater-05-ver.webp", "phone.img.ver"]);
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
        var picked = boardOf(a);
        body.appendChild(para(t("board.hint"), { class: "setup-hint" }));
        // A repeater observer can only use ESP32 boards, so those come first for it.
        (observer ? ["esp32", "nrf52"] : ["nrf52", "esp32"]).forEach(function (chip) {
          var labelId = "setup-board-" + chip;
          // Said right above the greyed-out boards, so they make sense.
          if (observer && chip === "nrf52") {
            body.appendChild(note("warn", [para(t("board.observer-nrf52")),
              el("button", { type: "button", class: "setup-button setup-button--secondary setup-button--small", "data-setup-as-repeater": "",
                on: { click: function () { choose("type", "repeater"); renderStep({ heading: true }); } } }, t("board.as-repeater"))]));
          }
          body.appendChild(para(t("board.group." + chip), { class: "setup-group-label", id: labelId }));
          body.appendChild(choiceGroup(Flow.BOARDS.filter(function (item) { return item.chip === chip; }).map(function (item) {
            var blocked = observer && chip === "nrf52";
            var detail = blocked ? t("board.no-wifi.detail") : t("board." + chip + ".detail");
            return choice(item.id, boardName(item), detail, { disabled: blocked, pressed: a.board === item.id && !blocked, pick: function () {
              if (choose("board", item.id)) renderStep({ focus: '[data-setup-choice="' + item.id + '"]' });
            } });
          }), labelId));
          // What the picked board means, right under its group.
          if (!picked || picked.chip !== chip) return;
          if (picked.id === "other-esp32" && observer) body.appendChild(note("info", t("board.other-observer")));
          else if (/^other-/.test(picked.id)) body.appendChild(note("info", t("board.other")));
          if (chip === "nrf52" && !observer) body.appendChild(note("ok", t("board.nrf52-next")));
        });
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
        body.appendChild(steps([["bootloader.step1", { board: boardLabel(state.answers) }, LINKS.otafix],
          "bootloader.step2", "bootloader.step3", "bootloader.step4"]));
        body.appendChild(para(rich("bootloader.mismatch"), { class: "setup-hint" }));
        body.appendChild(confirmBox("bootloader", "bootloader.confirm"));
      }
    },

    flash: {
      question: function () { return t(state.answers.type === "observer" ? "flash.question.observer" : "flash.question.repeater"); },
      body: function (body) {
        var a = state.answers;
        var kind = a.type === "observer" ? "observer" : "repeater";
        var item = boardOf(a);
        var erase = t("flash.erase." + (item && item.chip === "nrf52" ? "nrf52" : "esp32") + "-" + (a.status === "running" ? "running" : "new"));
        body.appendChild(steps([["flash." + kind + ".step1", null, kind === "observer" ? LINKS.observerFlasher : LINKS.flasher],
          ["flash." + kind + ".step2", { board: boardLabel(a) }], ["flash.step3", { erase: erase }], "flash.step4"]));
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

    commands: {
      question: function () { return t(Flow.route(state.answers) === "phone" ? "commands.question.phone" : "commands.question.console"); },
      body: commandsBody
    },

    check: {
      body: checkBody
    }
  };

  // Firmware version: read from the `ver` reply, or picked when the reply can't be read.
  function versionBody(body) {
    var phone = Flow.route(state.answers) === "phone";
    body.appendChild(para(rich(phone ? "version.how.phone" : "version.how.console")));
    if (phone) body.appendChild(phoneSteps(true));
    var input = el("input", { type: "text", id: "setup-version", class: "setup-input", "data-setup-version": "", value: state.versionText,
      placeholder: t("version.placeholder"), autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    var message = el("div", { class: "setup-message", "data-setup-version-message": "", "aria-live": "polite" });
    body.appendChild(el("div", { class: "setup-field" }, [el("label", { for: "setup-version" }, rich("version.label")), input]));
    body.appendChild(message);
    input.addEventListener("input", function () {
      state.versionText = input.value;
      var next = Object.assign({}, state.answers);
      var read = Flow.parseVersion(input.value);
      if (read.firmware) next.firmware = read.firmware; else if (input.value.trim()) delete next.firmware;
      setAnswers(next);
      versionMessage(message);
      updateActions();
    });
    versionMessage(message);
  }

  function versionMessage(box) {
    var text = state.versionText.trim();
    var firmware = state.answers.firmware;
    box.textContent = "";
    if (!text) {
      if (firmware) box.appendChild(note("ok", t("version.found", { version: firmware })));
      return;
    }
    var read = Flow.parseVersion(text);
    if (read.firmware) {
      var shown = /\d+\.\d+(?:\.\d+)?/.exec(text);
      box.appendChild(note("ok", t("version.found", { version: shown ? shown[0] : read.firmware })));
    } else if (read.tooOld) {
      box.appendChild(note("warn", [para(t("version.too-old")),
        el("button", { type: "button", class: "setup-button setup-button--small", "data-setup-update": "", on: { click: updateFirst } }, t("version.update"))]));
    } else {
      box.appendChild(para(t("version.unreadable")));
      box.appendChild(choiceGroup(["1.14", "1.15", "1.16"].map(function (version) {
        return choice(version, t("version.v" + version), null, { pressed: firmware === version, pick: function () {
          setAnswers(Object.assign({}, state.answers, { firmware: version }));
          versionMessage(box);
          updateActions();
          var again = box.querySelector('[data-setup-choice="' + version + '"]');
          if (again) again.focus();
        } });
      })));
    }
  }

  // Firmware older than 1.14: flash the latest first.
  function updateFirst() {
    var a = state.answers;
    if (Flow.route(a) === "phone") {
      if (a.type === "observer") choose("observerFirmware", "no"); else choose("reflash", true);
    } else {
      var next = Object.assign({}, a);
      delete next.flashed;
      delete next.firmware;
      setAnswers(next);
    }
    state.versionText = "";
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
    // A city repeater can carry a shared cross-border label; an edge repeater picks networks on the next screen.
    var shared = Place.crossBorder(a.province).shared;
    if (a.role === "city" && shared.length) {
      body.appendChild(networkBoxes(shared, t("role.shared.question"), t("role.shared.hint")));
    }
  }

  function checkboxRow(attrs, label, checked, onChange, boxAttrs) {
    var box = el("input", Object.assign({ type: "checkbox", checked: checked, on: { change: function () { onChange(box.checked); } } }, boxAttrs || {}));
    return el("label", Object.assign({ class: "setup-check" }, attrs), [box, el("span", null, label)]);
  }

  function networkBoxes(ids, legend, hint) {
    var set = el("fieldset", { class: "setup-fieldset" }, [el("legend", { text: legend }), para(hint, { class: "setup-hint" })]);
    ids.forEach(function (id) {
      set.appendChild(checkboxRow({ "data-setup-external": id }, networkName(id), (state.answers.external || []).indexOf(id) !== -1, function (checked) {
        var list = (state.answers.external || []).filter(function (item) { return item !== id; });
        if (checked) list.push(id);
        var next = Object.assign({}, state.answers);
        if (list.length) next.external = ids.filter(function (item) { return list.indexOf(item) !== -1; }).concat(list.filter(function (item) { return ids.indexOf(item) === -1; }));
        else delete next.external;
        setAnswers(next);
        updateActions();
      }));
    });
    return set;
  }

  function neighboursBody(body) {
    if (!state.data) return loading(body);
    var a = state.answers;
    var offered = Place.neighbours(a.tag, state.data);
    body.appendChild(para(t("neighbours.hint"), { class: "setup-hint" }));
    if (!offered.length) body.appendChild(para(t("neighbours.empty", { region: regionName(a.tag) + " (" + a.tag + ")" })));
    var set = el("fieldset", { class: "setup-fieldset setup-fieldset--plain" }, el("legend", { class: "setup-sr", text: t("neighbours.question") }));
    var boxes = {};
    function sync() {
      var list = state.answers.neighbours;
      offered.forEach(function (tag) { boxes[tag].checked = Array.isArray(list) && list.indexOf(tag) !== -1; });
      boxes.none.checked = Array.isArray(list) && !list.length;
    }
    function toggle(tag, checked) {
      var next = Object.assign({}, state.answers);
      if (tag === "none") {
        if (checked) next.neighbours = []; else delete next.neighbours;
      } else {
        var list = (Array.isArray(next.neighbours) ? next.neighbours : []).filter(function (item) { return item !== tag; });
        if (checked) list.push(tag);
        list = offered.filter(function (item) { return list.indexOf(item) !== -1; });
        if (list.length) next.neighbours = list; else delete next.neighbours;
      }
      setAnswers(next);
      sync();
      updateActions();
    }
    offered.concat("none").forEach(function (tag) {
      var label = tag === "none" ? t("neighbours.none") : regionName(tag) + " (" + tag + ")";
      var row = checkboxRow({ "data-setup-neighbour": tag }, label, false, function (checked) { toggle(tag, checked); });
      boxes[tag] = row.querySelector("input");
      set.appendChild(row);
    });
    body.appendChild(set);
    sync();
    body.appendChild(para(link(t("neighbours.meshmapper"), LINKS.meshmapper)));
    var networks = Place.crossBorder(a.province);
    var all = networks.shared.concat(networks.edgeOnly);
    if (all.length) body.appendChild(networkBoxes(all, t("crossborder.title"), t("crossborder.hint")));
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
    if (a.place && a.place.name) {
      var where = exactSpot(a.place) ? "name.location-spot" : "name.location";
      body.appendChild(checkboxRow({}, t(where, { town: a.place.name }), a.shareLocation !== false, function (checked) {
        setAnswers(Object.assign({}, state.answers, { shareLocation: checked }));
      }, { "data-setup-location": "" }));
    }
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
    if (town.status === "searching") {
      box.appendChild(para(t("town.searching"), { class: "setup-hint", role: "status" }));
      return;
    }
    if (town.status === "places") {
      box.appendChild(townMessage(t(town.places[0].kind === "address" ? "town.addresses" : "town.places")));
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
    } else if (town.status === "outside") {
      box.appendChild(townMessage(rich("town.outside")));
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
    clearPlace();
    showTown("searching");
    loadData().then(function (data) {
      if (token !== town.token) return;
      // Coordinates are read here and never sent to a search.
      var point = Flow.parseCoordinates(query);
      if (point) return point.inCanada ? pickPlace(coordinatesPlace(point)) : showTown("outside");
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
        if (places.length === 1) return pickPlace(places[0]);
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

  // ------------------------------------------------------------------ commands screen

  function tickKey(item) { return item.id + "\n" + item.command; }

  function commandsBody(body) {
    state.scopes = null;
    if (!state.data) return loading(body);
    var a = state.answers;
    var phone = Flow.route(a) === "phone";
    if (phone) {
      body.appendChild(para(rich("commands.where.phone")));
      body.appendChild(phoneSteps(false));
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
