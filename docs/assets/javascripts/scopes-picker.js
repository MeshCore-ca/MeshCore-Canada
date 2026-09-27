// Repeater setup helper for the ON/QC scopes proposal: one set of answers
// ("Your repeater") drives the standard settings and region commands, and
// every command card gets a working copy button.
(function () {
  var catalogUrl = new URL("../regions/iata-regions.json", document.currentScript.src);
  var catalog;
  var scopeEngine = window.MeshCoreIataScopes;
  var root = document.documentElement;
  var picker = document.querySelector("[data-scp-picker]");
  var copyLabel = (picker && picker.getAttribute("data-copy-label")) || "Copy";
  var copiedLabel = (picker && picker.getAttribute("data-copied-label")) || "Copied";
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg>';

  root.classList.add("scp-js");

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(field);
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".scp-copy");
    if (!button) return;
    var code = button.parentNode.querySelector("code");
    if (!code) return;
    var command = code.textContent;
    copyText(command).then(function () {
      button.classList.add("is-copied");
      button.title = copiedLabel;
      button.setAttribute("aria-label", copiedLabel + ": " + command);
      window.setTimeout(function () {
        button.classList.remove("is-copied");
        button.title = copyLabel;
        button.setAttribute("aria-label", copyLabel + ": " + command);
      }, 1600);
    });
  });

  // "Any old regions?" question: show only the branch that matches the answer.
  var ask = document.querySelector("[data-scp-ask]");
  if (ask) {
    var choices = ask.querySelectorAll("[data-scp-choice]");
    var branches = document.querySelectorAll("[data-scp-branch]");
    branches.forEach(function (branch) {
      branch.hidden = true;
    });
    choices.forEach(function (choice) {
      choice.addEventListener("click", function () {
        var answer = choice.getAttribute("data-scp-choice");
        choices.forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === choice));
        });
        branches.forEach(function (branch) {
          branch.hidden = branch.getAttribute("data-scp-branch") !== answer;
        });
      });
    });
    ask.hidden = false;
    document.querySelectorAll("[data-scp-ask-nojs]").forEach(function (note) {
      note.hidden = true;
    });
  }

  if (!picker) return;

  var area = picker.querySelector("[data-scp-area]");
  var firmware = picker.querySelector("[data-scp-firmware]");
  var type = picker.querySelector("[data-scp-type]");
  var extra = picker.querySelector("[data-scp-extra]");
  var extraField = picker.querySelector("[data-scp-extra-field]");
  var role = picker.querySelector("[data-scp-role]");
  var activation = picker.querySelector("[data-scp-activation]");
  var confirmed = picker.querySelector("[data-scp-activate]");
  confirmed.checked = false;
  confirmed.autocomplete = "off";
  var messageScope = picker.querySelector("[data-scp-message]");
  var selectedProfile;
  var placeSearch = window.MeshCorePlaceSearch;
  var language = root.lang === "fr" ? "fr" : "en";
  var form = picker.querySelector("[data-scp-search]");
  var query = picker.querySelector("[data-scp-place]");
  var status = picker.querySelector("[data-scp-status]");
  var places = picker.querySelector("[data-scp-places]");
  var result = picker.querySelector("[data-scp-result]");
  var origin = null;
  var controller;
  var requestId = 0;
  var geometry;
  var detailsKey = "";
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) { confirmed.checked = false; if (catalog) update(); }
  });

  function t(en, fr) { return language === "fr" ? fr : en; }
  function name(tag) { var item = catalog.hierarchy[tag]; return language === "fr" && item.labelFr || item.label; }
  function provinceName(code) { var item = catalog.policy.provinces[code]; return language === "fr" ? item.labelFr : item.label; }
  function regionLabel(tag) {
    return name(tag) + " (" + tag.toUpperCase() + ")" + (catalog.status[tag].state === "starter" ? t(" — proposed", " — proposé") : "");
  }

  function populate() {
    var seeds = catalog.seeds.filter(function (seed) { return seed.provinces.some(function (p) { return catalog.policy.meshScopes.onqc.includes(p); }); });
    seeds.sort(function (a, b) { return name(a.tag).localeCompare(name(b.tag), language); });
    catalog.policy.meshScopes.onqc.forEach(function (province) {
      var group = document.createElement("optgroup");
      group.label = provinceName(province);
      seeds.filter(function (seed) { return seed.provinces.includes(province); }).forEach(function (seed) {
        var option = new Option(regionLabel(seed.tag) + " · " + province.toUpperCase(), seed.tag + ":" + province);
        option.dataset.city = seed.tag;
        option.dataset.province = province;
        group.appendChild(option);
      });
      area.appendChild(group);
    });
    seeds.forEach(function (seed) { extra.appendChild(new Option(regionLabel(seed.tag), seed.tag)); });
  }

  function standardCommands(version) {
    return scopeEngine.standardCommands(firmwareId(version));
  }

  function firmwareId(version) {
    return { "110": "1.10", "114": "1.14", "115": "1.15", "116": "1.16" }[version];
  }

  function regionCommands(version, city, province, neighbour, edge, stage) {
    var profile = scopeEngine.profile(catalog, {
      home: city, province: province, bridge: edge, cities: neighbour ? [neighbour] : [], activation: stage
    });
    return scopeEngine.commands(profile, firmwareId(version)).concat(["region save"]);
  }

  function render(list, commands) {
    list.textContent = "";
    commands.forEach(function (command) {
      var item = document.createElement("li");
      item.className = "scp-cmd";
      var code = document.createElement("code");
      code.textContent = command;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "scp-copy";
      button.title = copyLabel;
      button.setAttribute("aria-label", copyLabel + ": " + command);
      button.innerHTML = COPY_ICON; // fixed icon markup, no page or user input
      item.appendChild(code);
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  function shortText(select) {
    return select.options[select.selectedIndex].text;
  }

  function update() {
    var option = area.options[area.selectedIndex];
    var city = option.getAttribute("data-city");
    var province = option.getAttribute("data-province");
    var version = firmware.value;
    var edge = type.value === "edge";
    var operator = role.value === "repeater";
    var activating = activation.value === "activate";
    var canGenerate = Boolean(city && operator && (!activating || (confirmed.checked && type.value !== "unknown")));
    picker.querySelectorAll("[data-scp-operator]").forEach(function (field) { field.hidden = !operator; });
    picker.querySelector("[data-scp-confirm-field]").hidden = !operator || !activating;
    picker.querySelector("[data-scp-command-link]").hidden = !canGenerate;
    document.querySelectorAll("[data-scp-activation-only]").forEach(function (field) { field.hidden = !operator || !activating; });

    extraField.hidden = !operator || !edge;
    Array.prototype.forEach.call(extra.options, function (choice) {
      choice.disabled = choice.value === city;
    });
    if (extra.value === city) extra.value = "";
    var neighbour = edge ? extra.value : "";
    result.hidden = !city;

    var summary = canGenerate ? [shortText(area), shortText(firmware), shortText(type), shortText(activation)] : [t("Choose your area and role above. Activation also needs a confirmed repeater type and local cutover.", "Choisissez votre secteur et votre rôle ci-dessus. L’activation exige aussi un type de répéteur confirmé et une transition locale.")];
    if (neighbour) summary.push("+ " + neighbour);
    document.querySelectorAll("[data-scp-summary]").forEach(function (label) {
      label.textContent = summary.join(" · ");
    });

    document.querySelectorAll('[data-scp-output="standard"]').forEach(function (list) {
      render(list, canGenerate ? standardCommands(version) : []);
    });
    document.querySelectorAll('[data-scp-output="region"]').forEach(function (list) {
      render(list, canGenerate ? regionCommands(version, city, province, neighbour, edge, activation.value) : []);
    });
    var verification = document.querySelector("[data-scp-verification]");
    if (verification) verification.textContent = "";
    selectedProfile = null;
    picker.querySelector("[data-scp-simulator]").hidden = !city || !operator || (activating && type.value === "unknown");

    if (city) {
      picker.querySelector("[data-scp-region-name]").textContent = name(city) + " (" + city.toUpperCase() + ") · " + provinceName(province);
      var source;
      if (origin && origin.planningKind === "extension") source = t("Proposed extension outside the published MeshMapper zone. Confirm this area with local operators.", "Extension proposée hors de la zone publiée par MeshMapper. Confirmez ce secteur avec les opérateurs locaux.");
      else if (catalog.status[city].state === "starter") source = t("Proposed MeshCore Canada region, not a published MeshMapper zone. Confirm local use before applying.", "Région proposée par MeshCore Canada, non publiée par MeshMapper. Confirmez son utilisation locale avant de l’appliquer.");
      else source = t("Published MeshMapper zone. Check your repeater’s location on the map", "Zone publiée par MeshMapper. Vérifiez l’emplacement de votre répéteur sur la carte") + (!origin && catalog.status[city].planningExtension ? t("; proposed extensions are shown separately.", "; les extensions proposées sont indiquées séparément.") : ".");
      picker.querySelector("[data-scp-region-source]").textContent = source;
      var tags = picker.querySelector("[data-scp-tags]");
      tags.textContent = "";
      var profile = scopeEngine.profile(catalog, { home: city, province: province, bridge: edge, cities: neighbour ? [neighbour] : [], activation: activation.value });
      selectedProfile = profile;
      var roleText = role.value === "companion" ? t("Companion user: no changes yet. Leave your default scope and channels unscoped until Phase 2 is announced locally (January 2027 at the earliest).", "Utilisateur d’un compagnon : aucun changement pour l’instant. Laissez la portée par défaut et les canaux sans portée jusqu’à l’annonce locale de la phase 2 (janvier 2027 au plus tôt).") :
        role.value === "bot" ? t("Bot / MeshMapper: coordinate your local-region scope with operators near the end of preparation. Do not switch before the surrounding repeaters are ready.", "Robot / MeshMapper : coordonnez votre portée locale avec les opérateurs vers la fin de la préparation. Ne changez rien avant que les répéteurs voisins soient prêts.") :
        operator ? (activating ? t("Activation instructions: use only at the locally announced cutover. Confirm the regular cross-region links and the cutover below.", "Consignes d’activation : à utiliser seulement lors de la transition annoncée localement. Confirmez les liens interrégionaux réguliers et la transition ci-dessous.") :
          t("Prepare the scope names first. No scopes are removed; wildcard forwarding (*) and the default scope stay unchanged. Activate at the agreed local cutover.", "Préparez d’abord les portées nommées. Aucune portée n’est supprimée; le joker (*) et la portée par défaut restent inchangés. Activez lors de la transition locale convenue.")) :
        t("Choose your role to see what applies now.", "Choisissez votre rôle pour voir les consignes qui s’appliquent maintenant.");
      picker.querySelector("[data-scp-role-summary]").textContent = roleText;
      var nextDetailsKey = [city, province, origin && origin.regionSource, origin && origin.planningKind].join(":");
      if (window.MeshCoreRegionProfile && detailsKey !== nextDetailsKey) {
        picker.querySelector("[data-scp-readiness]").innerHTML = window.MeshCoreRegionProfile.readiness(catalog.profiles[city]);
        picker.querySelector("[data-scp-profile]").innerHTML = window.MeshCoreRegionProfile.render(catalog, city, province, new URL("../../", location.href), origin ? { sourceTier: origin.regionSource } : null);
        detailsKey = nextDetailsKey;
      }
      profile.tags.forEach(function (tag) {
        if (tag === profile.tags[0] || tag === catalog.policy.reservedScopes[0]) {
          var label = document.createElement("strong"); label.className = "scp-finder__tag-label";
          label.textContent = tag === profile.tags[0] ? t("Independent scope labels", "Étiquettes de portée indépendantes") : t("Reserved — do not use yet", "Réservées — ne pas utiliser pour l’instant");
          tags.appendChild(label);
        }
        var badge = document.createElement("span");
        badge.className = "scp-tag";
        badge.dataset.level = tag === province ? "prov" : tag === "onqc" ? "mesh" : catalog.policy.reservedScopes.includes(tag) ? "future" : "city";
        badge.textContent = tag;
        tags.appendChild(badge);
      });
      if (canGenerate && window.MeshCoreScopeMigration) window.MeshCoreScopeMigration.mountVerification(verification, profile, firmwareId(version));
      var previousMessage = messageScope.value;
      messageScope.textContent = "";
      messageScope.add(new Option(t("No scope (*)", "Sans portée (*)"), "*"));
      [city, province, "onqc"].concat(catalog.seeds.filter(function (seed) { return seed.provinces.some(function (p) { return catalog.policy.meshScopes.onqc.includes(p); }); }).map(function (seed) { return seed.tag; }))
        .filter(function (tag, index, all) { return all.indexOf(tag) === index; }).forEach(function (tag) { messageScope.add(new Option(tag + " — " + (catalog.hierarchy[tag].labelFr && language === "fr" ? catalog.hierarchy[tag].labelFr : catalog.hierarchy[tag].label), tag)); });
      if (Array.from(messageScope.options).some(function (o) { return o.value === previousMessage; })) messageScope.value = previousMessage;
      showDecision();
      var map = new URL("../../config/map/", location.href);
      map.search = new URLSearchParams({ tag: city, province: province });
      picker.querySelector("[data-scp-map]").href = map.href;
      var share = new URL(location.href);
      share.search = new URLSearchParams({ tag: city, province: province, role: role.value, firmware: version, type: type.value, activation: activation.value });
      if (neighbour) share.searchParams.set("neighbour", neighbour);
      share.hash = "your-region";
      picker.querySelector("[data-scp-share]").href = share.href;
      share.hash = location.hash;
      history.replaceState(history.state, "", share.href);
    } else {
      var address = new URL(location.href);
      ["tag", "province", "role", "firmware", "type", "neighbour", "activation"].forEach(function (key) { address.searchParams.delete(key); });
      history.replaceState(history.state, "", address.href);
    }

    var active = {
      "fw-116": version === "116",
      "fw-115": version === "115" && activating,
      "fw-put-allow": version === "114" || version === "110",
      "no-hash": version === "110",
      edge: edge && activating,
      extra: Boolean(neighbour)
    };
    document.querySelectorAll("[data-scp-note]").forEach(function (note) {
      note.hidden = !canGenerate || !active[note.getAttribute("data-scp-note")];
    });
  }

  function showDecision() {
    if (!selectedProfile) return;
    var forward = scopeEngine.forwards(selectedProfile, messageScope.value);
    picker.querySelector("[data-scp-decision]").textContent = forward === null ? (messageScope.value === "*" ? t("Unchanged during preparation: the current * flag decides whether unscoped floods pass. Check the actual region list.", "Inchangé pendant la préparation : le réglage actuel de * décide si les diffusions sans portée passent. Vérifiez la liste réelle.") : t("Unknown during preparation: this scope may already exist. Preparation does not remove it; check the current region list.", "Inconnu pendant la préparation : cette portée peut déjà exister. La préparation ne la supprime pas; vérifiez la liste actuelle.")) : forward ?
      t("Forwarded by this configuration. This does not guarantee delivery or a radio link.", "Relayé par cette configuration. Cela ne garantit ni la livraison ni une liaison radio.") :
      t("Not forwarded by this configuration: the matching scope is absent, or unscoped floods are blocked at activation.", "Non relayé par cette configuration : la portée correspondante est absente, ou les diffusions sans portée sont bloquées à l’activation.");
  }
  messageScope.addEventListener("change", showDecision);

  function cancel() {
    requestId++;
    if (controller) controller.abort();
    form.removeAttribute("aria-busy");
  }

  function clearSelection() {
    area.value = "";
    origin = null;
    extra.value = "";
    confirmed.checked = false;
    places.textContent = "";
    status.textContent = "";
    update();
  }

  function choose(value, source) {
    cancel();
    area.value = value;
    origin = source || null;
    places.textContent = "";
    status.textContent = shortText(area) + t(" selected. Check the settings below.", " sélectionné. Vérifiez les réglages ci-dessous.");
    update();
  }

  function offer(items, label, select, message) {
    status.textContent = message;
    places.textContent = "";
    items.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "scp-choice";
      button.textContent = label(item);
      button.addEventListener("click", function () { select(item); });
      places.appendChild(button);
    });
  }

  function optionsFor(tag, province) {
    return Array.from(area.options).filter(function (option) { return option.dataset.city === tag && (!province || option.dataset.province === province.toLowerCase()); });
  }

  function selectCode(tag, province) {
    var options = optionsFor(tag, province);
    if (options.length === 1) choose(options[0].value);
    else if (options.length) offer(options, function (o) { return o.text; }, function (o) { choose(o.value); }, t("Which province is the repeater in?", "Dans quelle province se trouve le répéteur?"));
    else status.textContent = t("This region is outside the ON/QC pilot. Use the full Canadian region map below.", "Cette région est hors du projet pilote ON/QC. Consultez la carte canadienne ci-dessous.");
  }

  // Aliases offer a manual zone choice, never pretend a town is at the zone centre.
  function offerAliases(text, message) {
    var requested = placeSearch.splitPlaceQuery(text);
    var tags = Object.keys(catalog.aliases).filter(function (tag) {
      return catalog.aliases[tag].some(function (alias) { return placeSearch.normalize(alias) === placeSearch.normalize(requested.name); });
    });
    var options = tags.flatMap(function (tag) { return optionsFor(tag, requested.province); });
    if (options.length) offer(options, function (o) { return o.text; }, function (o) { choose(o.value); }, message + " " + t("Listed region matches — choose only if this is your zone:", "Régions correspondantes — choisissez seulement s’il s’agit de votre zone :"));
    else status.textContent = message;
  }

  async function loadGeometry(signal) {
    if (!geometry) {
      var paths = [["iata-boundaries.geojson", catalog.source.boundarySha256], ["scope-jurisdictions.geojson", catalog.source.jurisdictionSha256]];
      var data = await Promise.all(paths.map(async function (item) {
        var url = new URL(item[0], catalogUrl);
        url.searchParams.set("v", item[1]);
        var response = await fetch(url, { signal: signal });
        if (!response.ok) throw new Error("Region boundaries unavailable");
        var collection = await response.json();
        if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) throw new Error("Invalid region boundaries");
        return collection;
      }));
      geometry = data;
    }
    return geometry;
  }

  function resolvePlace(place, data) {
    var province = scopeEngine.provinceAt(data[1], place.lat, place.lon);
    if (province && province !== placeSearch.provinceCode(place.province).toLowerCase()) province = null;
    if (!catalog.policy.meshScopes.onqc.includes(province)) {
      status.textContent = province ? t("This place is outside the ON/QC pilot. Use the full Canadian region map below.", "Ce lieu est hors du projet pilote ON/QC. Consultez la carte canadienne ci-dessous.") : t("The province is uncertain at this location. Choose your region and physical province manually.", "La province est incertaine à cet endroit. Choisissez votre région et la province du répéteur manuellement.");
      places.textContent = "";
      return;
    }
    var matches = scopeEngine.matches(data[0], place.lat, place.lon);
    var published = matches.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; });
    if (published.length) matches = published;
    var seen = new Set();
    matches = matches.filter(function (feature) {
      var tag = feature.properties.tag;
      if (seen.has(tag) || !optionsFor(tag, province).length) return false;
      seen.add(tag);
      return true;
    });
    if (matches.length === 1) choose(matches[0].properties.tag + ":" + province, matches[0].properties);
    else if (matches.length) offer(matches, function (feature) { return regionLabel(feature.properties.tag) + " · " + province.toUpperCase(); }, function (feature) { choose(feature.properties.tag + ":" + province, feature.properties); }, t("More than one zone covers this place. Choose the one your local operators use.", "Plusieurs zones couvrent ce lieu. Choisissez celle utilisée par les opérateurs locaux."));
    else {
      places.textContent = "";
      status.textContent = t("No listed region covers this place. Check the map or ask local operators; no region has been assigned.", "Aucune région répertoriée ne couvre ce lieu. Consultez la carte ou les opérateurs locaux; aucune région n’a été attribuée.");
    }
  }

  query.addEventListener("input", function () { cancel(); clearSelection(); });
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    cancel();
    clearSelection();
    var text = query.value.trim();
    if (!text) return;
    var requested = placeSearch.splitPlaceQuery(text);
    var code = requested.name.toLowerCase();
    if (catalog.seeds.some(function (seed) { return seed.tag === code; })) {
      selectCode(code, requested.province);
      return;
    }
    controller = new AbortController();
    var signal = controller.signal;
    var id = requestId;
    var requestController = controller;
    var timeout = window.setTimeout(function () { requestController.abort(); }, 12000);
    form.setAttribute("aria-busy", "true");
    status.textContent = t("Finding your region…", "Recherche de votre région…");
    try {
      var found = await placeSearch.lookup(text, language, function (url) {
        return fetch(url, { signal: signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
      });
      if (id !== requestId) return;
      if (!found.length) {
        offerAliases(text, t("No place found. Try a city and province, an IATA code, or the list below.", "Aucun lieu trouvé. Essayez une ville et une province, un code IATA ou la liste ci-dessous."));
        return;
      }
      var data = await loadGeometry(signal);
      if (id !== requestId) return;
      if (found.length === 1) resolvePlace(found[0], data);
      else offer(found, function (place) { return place.name + " · " + place.province; }, function (place) { resolvePlace(place, data); }, t("Which place do you mean?", "Quel lieu cherchez-vous?"));
    } catch (error) {
      if (id === requestId) offerAliases(text, t("Place lookup is unavailable. Choose a region below or try again.", "La recherche de lieux est indisponible. Choisissez une région ci-dessous ou réessayez."));
    } finally {
      window.clearTimeout(timeout);
      if (id === requestId) form.removeAttribute("aria-busy");
    }
  });

  area.addEventListener("change", function () { cancel(); confirmed.checked = false; origin = null; extra.value = ""; query.value = ""; places.textContent = ""; status.textContent = ""; update(); });
  [role, type, activation, extra].forEach(function (select) { select.addEventListener("change", function () { confirmed.checked = false; update(); }); });
  [firmware, confirmed].forEach(function (select) {
    select.addEventListener("change", update);
  });
  fetch(catalogUrl, { cache: "no-cache" }).then(function (response) {
    if (!response.ok) throw new Error("Region catalogue unavailable");
    return response.json();
  }).then(function (data) {
    if (!scopeEngine || !placeSearch || data.schema !== "meshcore-canada-iata-scopes/v1") throw new Error("Region catalogue unavailable");
    catalog = data;
    confirmed.checked = false;
    populate();
    var params = new URLSearchParams(location.search);
    if (["companion", "repeater", "bot"].includes(params.get("role"))) role.value = params.get("role");
    else if (!params.has("role") && (params.has("firmware") || params.has("type"))) role.value = "repeater";
    if (params.get("activation") === "activate") activation.value = "activate";
    if (firmwareId(params.get("firmware"))) firmware.value = params.get("firmware");
    if (["city", "edge"].includes(params.get("type"))) type.value = params.get("type");
    if (Array.from(extra.options).some(function (o) { return o.value === params.get("neighbour"); })) extra.value = params.get("neighbour");
    if (params.has("tag")) selectCode(params.get("tag").toLowerCase(), params.get("province"));
    update();
    picker.hidden = false;
    document.querySelectorAll("[data-scp-nojs]").forEach(function (note) { note.hidden = true; });
  }).catch(function () {
    // Keep the static examples available if the shared catalogue cannot load.
    root.classList.remove("scp-js");
  });
})();
