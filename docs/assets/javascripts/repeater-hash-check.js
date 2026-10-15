(function (root, factory) {
  "use strict";
  var checker = factory();
  root.MeshCoreRepeaterHashCheck = checker;
  if (typeof document !== "undefined") checker.start();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var API_BASE = "https://dev.meshcore.ca/api/v1";
  var STORAGE_KEY = "meshcore-ca-repeater-iata";
  var REQUEST_TIMEOUT_MS = 15000;
  var instanceCount = 0;
  var iataPromise = null;

  var copy = {
    en: {
      eyebrow: "Optional live check",
      summary: "Duplicate repeater ID check (optional)",
      title: "Check for a duplicate repeater ID",
      intro: "Paste the repeater's public key and choose the closest Beacon region.",
      publicKey: "Repeater public key",
      keyHint: "Run get public.key in the repeater console. Never paste a private key or the result of get prv.key.",
      keyPlaceholder: "64 hexadecimal characters",
      region: "Closest Beacon region",
      regionHint: "Use the three-letter area code used by nearby Canadian observers.",
      mode: "Path ID size",
      oneByte: "1 byte",
      twoBytes: "2 bytes",
      threeBytes: "3 bytes (Canada default)",
      check: "Check this ID",
      checking: "Checking Beacon…",
      privacy: "Beacon receives only the first byte of the public key. The full key stays in this browser.",
      loadingRegions: "Loading current region names…",
      regionsUnavailable: "Region names could not load. You can still enter a three-letter code.",
      invalidKey: "Enter only hexadecimal characters from the repeater's public key.",
      oddKey: "The public key must contain complete bytes (two hexadecimal characters per byte).",
      longKey: "A MeshCore public key cannot be longer than 64 hexadecimal characters.",
      shortKey: "Enter at least {count} hexadecimal characters for the selected ID size.",
      invalidRegion: "Enter a valid three-letter Beacon region code, such as YOW, YYZ, or YVR.",
      requestFailed: "Beacon could not complete the check. Try again or search the ID in CoreScope.",
      localConflict: "{prefix} is also used by {count} repeater{s} in {region}",
      networkConflict: "No duplicate in {region}; {prefix} is used by {count} other repeater{s} elsewhere in Beacon",
      clearSeen: "No duplicate found for {prefix}. This repeater is already visible in Beacon.",
      clear: "No duplicate found for {prefix} in the current Beacon data.",
      caveat: "Beacon only includes repeaters heard by participating observers. Confirm the ID with local operators before deployment.",
      comparison: "Compare path ID sizes",
      modeColumn: "Path ID size",
      idColumn: "Hash ID",
      localColumn: "Selected region",
      networkColumn: "Beacon network",
      selected: "selected",
      matching: "Repeaters matching {prefix}",
      repeaterColumn: "Repeater",
      areaColumn: "Heard in",
      matchColumn: "Match",
      heardColumn: "Last heard",
      thisRepeater: "This repeater",
      localDuplicate: "Duplicate in {region}",
      otherDuplicate: "Duplicate elsewhere",
      active: "Current",
      stale: "Stale",
      unknown: "Unknown",
      noName: "Unnamed repeater",
      source: "Data from Beacon",
      openCoreScope: "Search this ID in CoreScope",
      partialKey: "A partial public-key prefix is being checked. Paste all 64 characters to identify this repeater separately from other matches."
    },
    fr: {
      eyebrow: "Vérification facultative",
      summary: "Vérifier l’identifiant du répéteur (facultatif)",
      title: "Vérifier si l’identifiant est déjà utilisé",
      intro: "Collez la clé publique du répéteur et choisissez la région Beacon la plus proche.",
      publicKey: "Clé publique du répéteur",
      keyHint: "Exécutez get public.key dans la console du répéteur. Ne collez jamais une clé privée ni le résultat de get prv.key.",
      keyPlaceholder: "64 caractères hexadécimaux",
      region: "Région Beacon la plus proche",
      regionHint: "Utilisez le code régional de trois lettres des observateurs canadiens à proximité.",
      mode: "Taille de l’identifiant de parcours",
      oneByte: "1 octet",
      twoBytes: "2 octets",
      threeBytes: "3 octets (réglage canadien)",
      check: "Vérifier cet identifiant",
      checking: "Vérification dans Beacon…",
      privacy: "Beacon reçoit seulement le premier octet de la clé publique. La clé complète reste dans ce navigateur.",
      loadingRegions: "Chargement des noms de régions…",
      regionsUnavailable: "Impossible de charger les noms de régions. Vous pouvez tout de même saisir un code de trois lettres.",
      invalidKey: "Saisissez uniquement les caractères hexadécimaux de la clé publique du répéteur.",
      oddKey: "La clé publique doit contenir des octets complets, soit deux caractères hexadécimaux par octet.",
      longKey: "Une clé publique MeshCore ne peut pas dépasser 64 caractères hexadécimaux.",
      shortKey: "Saisissez au moins {count} caractères hexadécimaux pour la taille choisie.",
      invalidRegion: "Saisissez un code de région Beacon valide de trois lettres, comme YOW, YYZ ou YVR.",
      requestFailed: "Beacon n’a pas pu terminer la vérification. Réessayez ou recherchez l’identifiant dans CoreScope.",
      localConflict: "{count} autre{s} répéteur{s} utilise{nt} {prefix} dans {region}",
      networkConflict: "Aucun doublon dans {region}; {count} autre{s} répéteur{s} utilise{nt} {prefix} ailleurs dans Beacon",
      clearSeen: "Aucun doublon trouvé pour {prefix}. Ce répéteur est déjà visible dans Beacon.",
      clear: "Aucun doublon trouvé pour {prefix} dans les données Beacon actuelles.",
      caveat: "Beacon connaît seulement les répéteurs entendus par ses observateurs. Confirmez l’identifiant auprès des responsables locaux avant l’installation.",
      comparison: "Comparer les tailles d’identifiant",
      modeColumn: "Taille",
      idColumn: "Identifiant",
      localColumn: "Région choisie",
      networkColumn: "Réseau Beacon",
      selected: "choisie",
      matching: "Répéteurs correspondant à {prefix}",
      repeaterColumn: "Répéteur",
      areaColumn: "Entendu dans",
      matchColumn: "Correspondance",
      heardColumn: "Dernière réception",
      thisRepeater: "Ce répéteur",
      localDuplicate: "Doublon dans {region}",
      otherDuplicate: "Doublon ailleurs",
      active: "Actuel",
      stale: "Ancien",
      unknown: "Inconnue",
      noName: "Répéteur sans nom",
      source: "Données fournies par Beacon",
      openCoreScope: "Rechercher cet identifiant dans CoreScope",
      partialKey: "Vous vérifiez un préfixe partiel. Collez les 64 caractères pour distinguer ce répéteur des autres résultats."
    }
  };

  function languageFor(node) {
    var language = (node.getAttribute("lang") || document.documentElement.lang || "en").toLowerCase();
    return language.indexOf("fr") === 0 ? "fr" : "en";
  }

  function message(language, key, values) {
    var text = (copy[language] && copy[language][key]) || copy.en[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      text = text.replace(new RegExp("\\{" + name + "\\}", "g"), String(values[name]));
    });
    return text;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeKey(value) {
    var text = String(value == null ? "" : value).trim();
    if (/^0x/i.test(text)) text = text.slice(2);
    if (!/^[0-9a-f\s:-]+$/i.test(text)) return { error: "invalidKey", hex: "" };
    var hex = text.replace(/[\s:-]/g, "").toUpperCase();
    if (!hex || !/^[0-9A-F]+$/.test(hex)) return { error: "invalidKey", hex: "" };
    if (hex.length % 2 !== 0) return { error: "oddKey", hex: hex };
    if (hex.length > 64) return { error: "longKey", hex: hex };
    return { error: "", hex: hex, full: hex.length === 64 };
  }

  function validateKey(value, bytes) {
    var parsed = normalizeKey(value);
    if (parsed.error) return parsed;
    if (parsed.hex.length < bytes * 2) {
      parsed.error = "shortKey";
      parsed.minimum = bytes * 2;
      return parsed;
    }
    parsed.prefix = parsed.hex.slice(0, bytes * 2);
    return parsed;
  }

  function normalizeIata(value) {
    var iata = String(value == null ? "" : value).trim().toUpperCase();
    return /^[A-Z0-9]{3}$/.test(iata) ? iata : "";
  }

  function publicKeyFor(node) {
    return String(node && (node.publicKey || node.public_key) || "").toUpperCase();
  }

  function nodeIatas(node) {
    return Array.isArray(node && node.iatas) ? node.iatas : [];
  }

  function heardIn(node, iata) {
    return nodeIatas(node).some(function (item) {
      return normalizeIata(item && (item.iata || item.code)) === iata;
    });
  }

  function lastHeard(node, preferredIata) {
    var values = nodeIatas(node).map(function (item) {
      return {
        iata: normalizeIata(item && (item.iata || item.code)),
        value: Number(item && (item.lastHeard || item.last_heard || item.lastSeen || item.last_seen))
      };
    }).filter(function (item) { return Number.isFinite(item.value) && item.value > 0; });
    var preferred = values.find(function (item) { return item.iata === preferredIata; });
    if (preferred) return preferred.value;
    return values.reduce(function (latest, item) { return Math.max(latest, item.value); }, 0);
  }

  function uniqueNodes(nodes) {
    var seen = {};
    return (Array.isArray(nodes) ? nodes : []).filter(function (node) {
      var key = publicKeyFor(node);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function summarize(nodes, enteredKey, selectedIata) {
    var key = String(enteredKey || "").toUpperCase();
    var fullKey = key.length === 64 ? key : "";
    return [1, 2, 3].filter(function (bytes) {
      return key.length >= bytes * 2;
    }).map(function (bytes) {
      var prefix = key.slice(0, bytes * 2);
      var matches = uniqueNodes(nodes).filter(function (node) {
        return publicKeyFor(node).indexOf(prefix) === 0;
      });
      var own = fullKey ? matches.filter(function (node) { return publicKeyFor(node) === fullKey; }) : [];
      var conflicts = matches.filter(function (node) { return !fullKey || publicKeyFor(node) !== fullKey; });
      var local = conflicts.filter(function (node) { return heardIn(node, selectedIata); });
      return {
        bytes: bytes,
        prefix: prefix,
        own: own,
        conflicts: conflicts,
        local: local,
        localCount: local.length,
        networkCount: conflicts.length
      };
    });
  }

  function nodesUrl(prefix, cursor) {
    var url = new URL(API_BASE + "/nodes");
    url.searchParams.set("typeName", "repeater");
    url.searchParams.set("pubkeyPrefix", prefix);
    url.searchParams.set("limit", "100");
    if (cursor != null && cursor !== "") url.searchParams.set("cursor", String(cursor));
    return url.toString();
  }

  async function fetchMatchingNodes(prefix, options) {
    var fetchImpl = options && options.fetchImpl || fetch;
    var signal = options && options.signal;
    var nodes = [];
    var cursor = null;
    var pages = 0;
    var hasMore = false;
    do {
      var response = await fetchImpl(nodesUrl(prefix, cursor), {
        signal: signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Beacon HTTP " + response.status);
      var page = await response.json();
      if (!page || !Array.isArray(page.items)) throw new Error("Beacon returned an invalid node list");
      page.items.forEach(function (node) {
        if (publicKeyFor(node).indexOf(prefix) !== 0) {
          throw new Error("Beacon did not apply the public-key prefix filter");
        }
        nodes.push(node);
      });
      hasMore = page.hasMore === true;
      cursor = page.nextCursor;
      pages += 1;
    } while (hasMore && cursor != null && pages < 10);
    if (hasMore) throw new Error("Beacon returned too many matches to check safely");
    return uniqueNodes(nodes);
  }

  async function fetchIatas(options) {
    var fetchImpl = options && options.fetchImpl || fetch;
    var response = await fetchImpl(API_BASE + "/iatas", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Beacon HTTP " + response.status);
    var items = await response.json();
    if (!Array.isArray(items)) throw new Error("Beacon returned an invalid region list");
    return items.filter(function (item) { return normalizeIata(item && item.iata); });
  }

  function sharedIatas() {
    if (!iataPromise) {
      iataPromise = fetchIatas().catch(function (error) {
        iataPromise = null;
        throw error;
      });
    }
    return iataPromise;
  }

  function formatDate(value, language) {
    if (!value) return message(language, "unknown");
    try {
      return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-CA", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch (error) {
      return new Date(value).toISOString();
    }
  }

  function regionsFor(node, selectedIata) {
    var codes = nodeIatas(node).map(function (item) {
      return normalizeIata(item && (item.iata || item.code));
    }).filter(Boolean);
    codes.sort(function (left, right) {
      if (left === selectedIata) return -1;
      if (right === selectedIata) return 1;
      return left.localeCompare(right);
    });
    return codes.slice(0, 4).join(", ") || "—";
  }

  function comparisonTable(summaries, selectedBytes, selectedIata, language) {
    var rows = summaries.map(function (summary) {
      var selected = summary.bytes === selectedBytes;
      return '<tr' + (selected ? ' class="is-selected"' : '') + '>' +
        '<td data-label="' + escapeHtml(message(language, "modeColumn")) + '">' +
          escapeHtml(summary.bytes === 1 ? message(language, "oneByte") : message(language, summary.bytes === 2 ? "twoBytes" : "threeBytes")) +
          (selected ? ' <span class="mc-hash-selected">' + escapeHtml(message(language, "selected")) + '</span>' : '') + '</td>' +
        '<td data-label="' + escapeHtml(message(language, "idColumn")) + '"><code>' + escapeHtml(summary.prefix) + '</code></td>' +
        '<td data-label="' + escapeHtml(message(language, "localColumn")) + '">' + summary.localCount + ' <span class="mc-hash-region-code">' + escapeHtml(selectedIata) + '</span></td>' +
        '<td data-label="' + escapeHtml(message(language, "networkColumn")) + '">' + summary.networkCount + '</td>' +
        '</tr>';
    }).join("");
    return '<section class="mc-hash-table-section" aria-labelledby="mc-hash-comparison-title">' +
      '<h3 id="mc-hash-comparison-title">' + escapeHtml(message(language, "comparison")) + '</h3>' +
      '<div class="mc-hash-table-wrap"><table class="mc-hash-table mc-hash-comparison"><thead><tr>' +
      '<th scope="col">' + escapeHtml(message(language, "modeColumn")) + '</th>' +
      '<th scope="col">' + escapeHtml(message(language, "idColumn")) + '</th>' +
      '<th scope="col">' + escapeHtml(message(language, "localColumn")) + '</th>' +
      '<th scope="col">' + escapeHtml(message(language, "networkColumn")) + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }

  function detailTable(summary, fullKey, selectedIata, language) {
    var ownKeys = {};
    summary.own.forEach(function (node) { ownKeys[publicKeyFor(node)] = true; });
    var rows = summary.own.concat(summary.conflicts).sort(function (left, right) {
      var leftOwn = ownKeys[publicKeyFor(left)] ? 0 : 1;
      var rightOwn = ownKeys[publicKeyFor(right)] ? 0 : 1;
      if (leftOwn !== rightOwn) return leftOwn - rightOwn;
      var leftLocal = heardIn(left, selectedIata) ? 0 : 1;
      var rightLocal = heardIn(right, selectedIata) ? 0 : 1;
      if (leftLocal !== rightLocal) return leftLocal - rightLocal;
      return lastHeard(right, selectedIata) - lastHeard(left, selectedIata);
    }).map(function (node) {
      var key = publicKeyFor(node);
      var own = fullKey && key === fullKey;
      var local = heardIn(node, selectedIata);
      var label = own
        ? message(language, "thisRepeater")
        : local
          ? message(language, "localDuplicate", { region: selectedIata })
          : message(language, "otherDuplicate");
      var stale = node.stale === true;
      var heardAt = lastHeard(node, selectedIata);
      var heardMarkup = heardAt
        ? '<time datetime="' + escapeHtml(new Date(heardAt).toISOString()) + '">' + escapeHtml(formatDate(heardAt, language)) + '</time>'
        : '<span>' + escapeHtml(message(language, "unknown")) + '</span>';
      return '<tr>' +
        '<td data-label="' + escapeHtml(message(language, "repeaterColumn")) + '"><strong>' + escapeHtml(node.name || message(language, "noName")) + '</strong><code title="' + escapeHtml(key) + '">' + escapeHtml(key.slice(0, 12)) + '…</code></td>' +
        '<td data-label="' + escapeHtml(message(language, "areaColumn")) + '">' + escapeHtml(regionsFor(node, selectedIata)) + '</td>' +
        '<td data-label="' + escapeHtml(message(language, "matchColumn")) + '"><span class="mc-hash-match ' + (own ? "is-own" : local ? "is-local" : "") + '">' + escapeHtml(label) + '</span></td>' +
        '<td data-label="' + escapeHtml(message(language, "heardColumn")) + '"><span class="mc-hash-freshness ' + (stale ? "is-stale" : "") + '">' + escapeHtml(message(language, stale ? "stale" : "active")) + '</span>' + heardMarkup + '</td>' +
        '</tr>';
    }).join("");
    if (!rows) return "";
    return '<section class="mc-hash-table-section" aria-labelledby="mc-hash-details-title">' +
      '<h3 id="mc-hash-details-title">' + escapeHtml(message(language, "matching", { prefix: summary.prefix })) + '</h3>' +
      '<div class="mc-hash-table-wrap"><table class="mc-hash-table mc-hash-details"><thead><tr>' +
      '<th scope="col">' + escapeHtml(message(language, "repeaterColumn")) + '</th>' +
      '<th scope="col">' + escapeHtml(message(language, "areaColumn")) + '</th>' +
      '<th scope="col">' + escapeHtml(message(language, "matchColumn")) + '</th>' +
      '<th scope="col">' + escapeHtml(message(language, "heardColumn")) + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }

  function renderResult(host, parsed, selectedBytes, selectedIata, nodes, language) {
    var summaries = summarize(nodes, parsed.hex, selectedIata);
    var selected = summaries.find(function (summary) { return summary.bytes === selectedBytes; });
    var severity = selected.localCount ? "danger" : selected.networkCount ? "warning" : "success";
    var heading;
    if (selected.localCount) {
      heading = message(language, "localConflict", {
        count: selected.localCount,
        s: selected.localCount === 1 ? "" : "s",
        nt: selected.localCount === 1 ? "" : "nt",
        prefix: selected.prefix,
        region: selectedIata
      });
    } else if (selected.networkCount) {
      heading = message(language, "networkConflict", {
        count: selected.networkCount,
        s: selected.networkCount === 1 ? "" : "s",
        nt: selected.networkCount === 1 ? "" : "nt",
        prefix: selected.prefix,
        region: selectedIata
      });
    } else {
      heading = message(language, selected.own.length ? "clearSeen" : "clear", { prefix: selected.prefix });
    }
    var result = host.querySelector("[data-role='result']");
    result.innerHTML = '<div class="mc-hash-verdict is-' + severity + '" role="status">' +
      '<h3>' + escapeHtml(heading) + '</h3>' +
      '<p>' + escapeHtml(message(language, "caveat")) + '</p>' +
      (!parsed.full ? '<p class="mc-hash-partial">' + escapeHtml(message(language, "partialKey")) + '</p>' : '') +
      '</div>' + comparisonTable(summaries, selectedBytes, selectedIata, language) +
      detailTable(selected, parsed.full ? parsed.hex : "", selectedIata, language) +
      '<p class="mc-hash-source"><a href="https://dev.meshcore.ca/" target="_blank" rel="noopener noreferrer">' + escapeHtml(message(language, "source")) + '</a> · ' +
      '<a href="https://live.meshcore.ca/#/nodes?search=' + encodeURIComponent(selected.prefix) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(message(language, "openCoreScope")) + '</a></p>';
  }

  function renderShell(host, language) {
    instanceCount += 1;
    var listId = "mc-hash-iatas-" + instanceCount;
    host.innerHTML = '<details class="mc-hash-disclosure"><summary>' + escapeHtml(message(language, "summary")) + '</summary>' +
      '<section class="mc-hash-checker" aria-labelledby="mc-hash-title-' + instanceCount + '">' +
      '<p class="mc-eyebrow">' + escapeHtml(message(language, "eyebrow")) + '</p>' +
      '<h2 id="mc-hash-title-' + instanceCount + '">' + escapeHtml(message(language, "title")) + '</h2>' +
      '<p class="mc-hash-intro">' + escapeHtml(message(language, "intro")) + '</p>' +
      '<form class="mc-hash-form" novalidate>' +
      '<label class="mc-hash-field mc-hash-key"><span>' + escapeHtml(message(language, "publicKey")) + '</span>' +
      '<input data-role="public-key" type="text" inputmode="text" maxlength="96" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + escapeHtml(message(language, "keyPlaceholder")) + '" aria-describedby="mc-hash-key-hint-' + instanceCount + '"></label>' +
      '<p class="mc-hash-hint" id="mc-hash-key-hint-' + instanceCount + '">' + escapeHtml(message(language, "keyHint")) + '</p>' +
      '<div class="mc-hash-controls">' +
      '<label class="mc-hash-field"><span>' + escapeHtml(message(language, "region")) + '</span>' +
      '<input data-role="region" type="text" list="' + listId + '" maxlength="3" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="YOW" aria-describedby="mc-hash-region-hint-' + instanceCount + '">' +
      '<datalist id="' + listId + '"></datalist></label>' +
      '<fieldset class="mc-hash-modes"><legend>' + escapeHtml(message(language, "mode")) + '</legend>' +
      '<label><input type="radio" name="mc-hash-size-' + instanceCount + '" value="1"><span>' + escapeHtml(message(language, "oneByte")) + '</span></label>' +
      '<label><input type="radio" name="mc-hash-size-' + instanceCount + '" value="2"><span>' + escapeHtml(message(language, "twoBytes")) + '</span></label>' +
      '<label><input type="radio" name="mc-hash-size-' + instanceCount + '" value="3" checked><span>' + escapeHtml(message(language, "threeBytes")) + '</span></label>' +
      '</fieldset></div>' +
      '<p class="mc-hash-hint" id="mc-hash-region-hint-' + instanceCount + '">' + escapeHtml(message(language, "regionHint")) + '</p>' +
      '<div class="mc-hash-actions"><button type="submit" class="md-button md-button--primary">' + escapeHtml(message(language, "check")) + '</button></div>' +
      '<p class="mc-hash-privacy">' + escapeHtml(message(language, "privacy")) + '</p>' +
      '<div class="mc-hash-status" data-role="hash-status" aria-live="polite"></div>' +
      '</form><div data-role="result"></div></section></details>';
  }

  function storedIata() {
    try { return normalizeIata(window.localStorage.getItem(STORAGE_KEY)); } catch (error) { return ""; }
  }

  function storeIata(iata) {
    try { window.localStorage.setItem(STORAGE_KEY, iata); } catch (error) { /* Storage is optional. */ }
  }

  function init(host) {
    if (host.dataset.mcHashReady === "1") return;
    host.dataset.mcHashReady = "1";
    var language = languageFor(host);
    renderShell(host, language);
    var form = host.querySelector("form");
    var keyInput = host.querySelector("[data-role='public-key']");
    var regionInput = host.querySelector("[data-role='region']");
    var status = host.querySelector("[data-role='hash-status']");
    var datalist = host.querySelector("datalist");
    var submit = host.querySelector("button[type='submit']");
    var loadedIatas = null;
    var saved = storedIata();
    if (saved) regionInput.value = saved;
    var selectedRegion = new URLSearchParams(window.location.search).get("region");
    if (/^[a-z]{3}$/i.test(selectedRegion || "")) regionInput.value = selectedRegion.toUpperCase();

    function loadIatas() {
      if (loadedIatas) return Promise.resolve(loadedIatas);
      status.textContent = message(language, "loadingRegions");
      return sharedIatas().then(function (iatas) {
        loadedIatas = iatas.slice().sort(function (left, right) {
          return normalizeIata(left.iata).localeCompare(normalizeIata(right.iata));
        });
        datalist.innerHTML = loadedIatas.map(function (item) {
          return '<option value="' + escapeHtml(normalizeIata(item.iata)) + '">' + escapeHtml(item.displayName || "") + '</option>';
        }).join("");
        status.textContent = "";
        return loadedIatas;
      }).catch(function () {
        status.textContent = message(language, "regionsUnavailable");
        return [];
      });
    }

    regionInput.addEventListener("focus", loadIatas, { once: true });

    regionInput.addEventListener("input", function () {
      regionInput.value = regionInput.value.toUpperCase();
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var selectedMode = Number(form.querySelector("input[type='radio']:checked").value);
      var parsed = validateKey(keyInput.value, selectedMode);
      var iata = normalizeIata(regionInput.value);
      if (parsed.error) {
        status.textContent = message(language, parsed.error, { count: parsed.minimum || selectedMode * 2 });
        keyInput.focus();
        return;
      }
      if (!iata) {
        status.textContent = message(language, "invalidRegion");
        regionInput.focus();
        return;
      }
      storeIata(iata);
      if (host._mcHashAbort) host._mcHashAbort.abort();
      var controller = new AbortController();
      host._mcHashAbort = controller;
      var timeout = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
      submit.disabled = true;
      submit.textContent = message(language, "checking");
      status.textContent = message(language, "checking");
      host.querySelector("[data-role='result']").innerHTML = "";
      try {
        var nodes = await fetchMatchingNodes(parsed.hex.slice(0, 2), { signal: controller.signal });
        renderResult(host, parsed, selectedMode, iata, nodes, language);
        status.textContent = "";
      } catch (error) {
        status.textContent = message(language, "requestFailed");
        host.querySelector("[data-role='result']").innerHTML = '<p class="mc-hash-source"><a href="https://live.meshcore.ca/#/nodes?search=' + encodeURIComponent(parsed.prefix) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(message(language, "openCoreScope")) + '</a></p>';
      } finally {
        clearTimeout(timeout);
        if (host._mcHashAbort === controller) host._mcHashAbort = null;
        submit.disabled = false;
        submit.textContent = message(language, "check");
      }
    });
  }

  function start() {
    Array.prototype.slice.call(document.querySelectorAll("[data-mc-repeater-hash-check]")).forEach(init);
  }

  if (typeof document !== "undefined" && window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(start);
  }

  return {
    API_BASE: API_BASE,
    fetchMatchingNodes: fetchMatchingNodes,
    heardIn: heardIn,
    lastHeard: lastHeard,
    nodesUrl: nodesUrl,
    normalizeIata: normalizeIata,
    normalizeKey: normalizeKey,
    start: start,
    summarize: summarize,
    validateKey: validateKey
  };
}));
