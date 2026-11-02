(function () {
  "use strict";

  var scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("/assets/regions/regions.js", window.location.origin).href;
  var assetBase = new URL(".", scriptUrl);
  var catalogPromise = null;
  var displayPartitionPromise = null;
  var resolverPartitionPromise = null;
  var leafletPromise = null;
  var activeMaps = [];
  var configuratorSupport = window.MeshCoreRegionConfiguratorSupport || {};
  var iataScopes = window.MeshCoreIataScopes;
  var radioProfiles = window.MeshCoreRadioProfiles;
  var REQUEST_TIMEOUT_MS = 12000;
  var frenchRuntime = /^fr(?:-|$)/i.test(
    document.documentElement ? document.documentElement.lang || "" : ""
  );

  var FRENCH_RUNTIME_TEXT = {
    "Choose the place you mean:": "Choisissez le lieu recherché :",
    "Place lookup failed": "La recherche de lieux a échoué",
    "MeshCore Canada starter region": "Région initiale de MeshCore Canada",
    "MeshCore Canada planning extension": "Extension proposée par MeshCore Canada",
    "Planning extension": "Extension proposée",
    "Planning extensions": "Extensions proposées",
    "MeshCore Canada planning": "Planification MeshCore Canada",
    "Planning extension details": "Détails des extensions proposées",
    "This point is outside the published MeshMapper boundary. MeshCore Canada assigns the gap to this nearby IATA region for planning; confirm its use locally.": "Ce point est hors de la limite publiée par MeshMapper. MeshCore Canada attribue cet espace à cette région IATA voisine à des fins de planification; confirmez son utilisation localement.",
    "Starter regions": "Régions initiales",
    "Starter region details": "Détails des régions initiales",
    "This broad starter region is assigned by MeshCore Canada, not yet published by MeshMapper. Confirm its use with local operators; it does not promise radio coverage.": "Cette grande région initiale est attribuée par MeshCore Canada; elle n’est pas encore publiée dans MeshMapper. Confirmez son utilisation avec les opérateurs locaux; elle ne garantit pas la couverture radio.",
    "Published MeshMapper zones are unchanged. Labelled planning regions fill the remaining gaps across Canada.": "Les zones publiées par MeshMapper restent inchangées. Des régions proposées identifiées comblent les espaces restants partout au Canada.",
    "Planning regions follow provincial borders and nearby hubs. Newfoundland and Labrador are separate. Published MeshMapper zones take priority.": "Les régions proposées suivent les frontières provinciales et les pôles voisins. Terre-Neuve et le Labrador sont séparés. Les zones publiées par MeshMapper ont priorité.",
    "IATA boundaries SHA-256": "SHA-256 des limites IATA",
    "Download IATA boundaries": "Télécharger les limites IATA",
    "No IATA region contains this point. Browse the region list or check with your community.": "Aucune région IATA ne contient ce point. Consultez la liste ou votre communauté.",
    "Too many saved zones": "Trop de zones enregistrées",
    "The saved zone differs from this location. Choose the current IATA region.": "La zone enregistrée ne correspond pas à cet emplacement. Choisissez la région IATA actuelle.",
    "Published MeshMapper boundary": "Limite publiée par MeshMapper",
    "MeshMapper zone": "Zone MeshMapper",
    "Reserved": "Réservée",
    "Province scope": "Portée provinciale",
    "ON/QC scope": "Portée ON/QC",
    "More than one MeshMapper zone contains this point. Select your community's zone on the map.": "Plusieurs zones MeshMapper contiennent ce point. Sélectionnez celle de votre communauté sur la carte.",
    "The IATA scope catalog is unavailable or out of date.": "Le catalogue des portées IATA est indisponible ou périmé.",
    "These are published MeshMapper zones, not radio coverage or scope-enforcement boundaries.": "Ce sont les zones publiées par MeshMapper, pas des limites de couverture radio ou d’application des portées.",
    "Open this zone in MeshMapper": "Ouvrir cette zone dans MeshMapper",
    "Choose the repeater province in the setup tool": "Choisissez la province du répéteur dans l’outil de configuration",
    "MeshMapper snapshot": "Instantané MeshMapper",
    "Published zones": "Zones publiées",
    "Fetched": "Récupéré le",
    "Flat scopes": "Portées indépendantes",
    "City, province, mesh scope where defined, can, and na. Each scope is independent.": "Ville, province, réseau partagé s’il est défini, can et na. Chaque portée est indépendante.",
    "onqc is for Ontario and Québec. can and na are reserved for future use, not companion defaults or active cross-border routes.": "onqc couvre l’Ontario et le Québec. can et na sont réservés pour plus tard, pas comme portées par défaut d’un compagnon ni comme routes transfrontalières actives.",
    "Map limits": "Limites de la carte",
    "Source files": "Fichiers sources",
    "Download MeshMapper boundaries": "Télécharger les limites MeshMapper",
    "City zone": "Zone locale",
    "No MeshMapper zones are published here yet.": "Aucune zone MeshMapper n’est encore publiée ici.",
    "Select this city zone to see its scope options.": "Sélectionnez cette zone locale pour voir ses portées.",
    "Quebec City": "Québec",
    "Montreal": "Montréal",
    "Saguenay Lac-st-jean": "Saguenay–Lac-Saint-Jean",
    "Cape Breton Island": "Île du Cap-Breton",
    "Bas-St-Laurent-Gaspésie": "Bas-Saint-Laurent–Gaspésie",
    "Loading regional boundaries…": "Chargement des limites régionales…",
    "Choose the region you mean:": "Choisissez la région recherchée :",
    "This saved location is invalid or no longer available. Choose a region again.": "Cet emplacement est invalide ou n’est plus disponible. Choisissez une région à nouveau.",
    "Unable to load MeshCore Canada region data": "Impossible de charger les données régionales de MeshCore Canada",
    "Unable to load the Canadian map layer": "Impossible de charger la couche cartographique canadienne",
    "Unable to load the Canadian location layer": "Impossible de charger la couche canadienne de localisation",
    "The Canadian region catalog contains an invalid or duplicate local region": "Le catalogue des régions canadiennes contient une région locale invalide ou en double",
    "The Canadian region catalog contains an invalid shared repeater area": "Le catalogue des régions canadiennes contient une zone partagée de répéteurs invalide",
    "A shared repeater area must cross a province or territory": "Une zone partagée de répéteurs doit traverser une province ou un territoire",
    "The region catalog contains an invalid neighbouring network path": "Le catalogue des régions contient un chemin de réseau voisin invalide",
    "A neighbouring network tag collides with the Canadian hierarchy": "Un identifiant de réseau voisin entre en conflit avec la hiérarchie canadienne",
    "A neighbouring network tag has no label": "Un identifiant de réseau voisin n’a pas de libellé",
    "A neighbouring network tag has conflicting parents": "Un identifiant de réseau voisin a des parents incompatibles",
    "A neighbouring network tag has conflicting labels": "Un identifiant de réseau voisin a des libellés incompatibles",
    "Canadian map layer is invalid": "La couche cartographique canadienne est invalide",
    "Canadian map layer contains an invalid or duplicate region": "La couche cartographique canadienne contient une région invalide ou en double",
    "Canadian map layer does not match the region catalog": "La couche cartographique canadienne ne correspond pas au catalogue des régions",
    "Canadian location layer is invalid": "La couche canadienne de localisation est invalide",
    "Geocoding service error": "Erreur du service de géocodage",
    "No matching Canadian postal code found": "Aucun code postal canadien correspondant n’a été trouvé",
    "Online place lookup is unavailable. Enter coordinates or browse the region list.": "La recherche de lieux en ligne est indisponible. Entrez des coordonnées ou parcourez la liste des régions.",
    "Copy": "Copier",
    "Copied": "Copié",
    "Copy failed": "Échec de la copie",
    "Copied to clipboard.": "Copié dans le presse-papiers.",
    "Copy failed. Select and copy the command manually.": "La copie a échoué. Sélectionnez et copiez la commande manuellement.",
    "Needs review": "À vérifier",
    "Draft": "Brouillon",
    "Reviewed": "Vérifié",
    "Active": "Actif",
    "Deprecated": "Obsolète",
    "Unreviewed": "Non vérifié",
    "No seed": "Aucun point de départ",
    "Canadian regions": "Régions canadiennes",
    "Source": "Source",
    "City, airport code, postal code, or region name": "Ville, code d’aéroport, code postal ou nom de région",
    "Find": "Rechercher",
    "Latitude": "Latitude",
    "Longitude": "Longitude",
    "Use coordinates": "Utiliser les coordonnées",
    "Region found.": "Région trouvée.",
    "Checking the Canadian region data…": "Vérification des données régionales canadiennes…",
    "Unable to load the Canadian location data.": "Impossible de charger les données canadiennes de localisation.",
    "Enter a city, airport code, postal code, or region name.": "Entrez une ville, un code d’aéroport, un code postal ou un nom de région.",
    "Finding": "Recherche en cours",
    "Location lookup failed": "La recherche du lieu a échoué",
    "Enter a latitude from -90 to 90 and a longitude from -180 to 180.": "Entrez une latitude de -90 à 90 et une longitude de -180 à 180.",
    "Leaflet failed to load": "Leaflet n’a pas pu se charger",
    "Find a region": "Trouver une région",
    "Region data": "Données régionales",
    "Region map view": "Affichage de la carte des régions",
    "Browse by province or territory": "Parcourir par province ou territoire",
    "Can't use the map?": "La carte ne fonctionne pas?",
    "Browse all regions": "Parcourir toutes les régions",
    "Search the full region list.": "Recherchez dans la liste complète des régions.",
    "Region search and details": "Recherche et détails des régions",
    "Find a place": "Trouver un lieu",
    "Enter coordinates instead": "Entrer plutôt des coordonnées",
    "Selected region": "Région sélectionnée",
    "Skip the interactive map": "Passer la carte interactive",
    "Loading interactive map…": "Chargement de la carte interactive…",
    "Loading Canadian boundaries and OpenStreetMap tiles.": "Chargement des limites canadiennes et des tuiles OpenStreetMap.",
    "Retry map": "Réessayer la carte",
    "Interactive Canadian region map": "Carte interactive des régions canadiennes",
    "Map legend": "Légende de la carte",
    "Audit data loads when this view is opened.": "Les données de vérification se chargent à l’ouverture de cette vue.",
    "Status": "État",
    "Unavailable": "Indisponible",
    "Download catalog": "Télécharger le catalogue",
    "How repeaters work": "Comprendre les répéteurs",
    "Try again": "Réessayer",
    "Loading release evidence…": "Chargement des preuves de publication…",
    "Province or territory": "Province ou territoire",
    "resolves to": "correspond à",
    "Aliases": "Alias",
    "None recorded": "Aucun",
    "Repeater paths": "Chemins du répéteur",
    "Region details": "Détails de la région",
    "Find a community": "Trouver une communauté",
    "Set up a repeater here": "Configurer un répéteur ici",
    "Copy link": "Copier le lien",
    "This location is outside Canada.": "Cet emplacement se trouve à l’extérieur du Canada.",
    "Loading Canadian boundaries and map tools…": "Chargement des limites canadiennes et des outils cartographiques…",
    "Loading the interactive region map.": "Chargement de la carte interactive des régions.",
    "OpenStreetMap tiles did not load. Search and the region list still work.": "Les tuiles OpenStreetMap ne se sont pas chargées. La recherche et la liste des régions fonctionnent toujours.",
    "OpenStreetMap tiles could not load. Search and the region list still work.": "Impossible de charger les tuiles OpenStreetMap. La recherche et la liste des régions fonctionnent toujours.",
    "Interactive region map loaded.": "La carte interactive des régions est chargée.",
    "The map could not load. Search and the region list still work.": "La carte n’a pas pu se charger. La recherche et la liste des régions fonctionnent toujours.",
    "Search regions": "Rechercher des régions",
    "Filter by area": "Filtrer par zone",
    "All areas": "Toutes les zones",
    "Region directory table": "Tableau du répertoire des régions",
    "Setup": "Configuration",
    "Map": "Carte",
    "Regions": "Régions",
    "Local regions": "Régions locales",
    "Provinces & territories": "Provinces et territoires",
    "Region status summary": "Résumé de l’état des régions",
    "Loading Canadian regions…": "Chargement des régions canadiennes…",
    "Newfoundland and Labrador": "Terre-Neuve-et-Labrador",
    "Prince Edward Island": "Île-du-Prince-Édouard",
    "Nova Scotia": "Nouvelle-Écosse",
    "New Brunswick": "Nouveau-Brunswick",
    "Quebec": "Québec",
    "British Columbia": "Colombie-Britannique",
    "Northwest Territories": "Territoires du Nord-Ouest",
    "Zoom in": "Zoom avant",
    "Zoom out": "Zoom arrière",
    "Marker": "Marqueur",
    "contributors": "contributeurs",
    "Close popup": "Fermer la fenêtre",
    "A JavaScript library for interactive maps": "Une bibliothèque JavaScript pour les cartes interactives"
  };

  var FRENCH_RUNTIME_PATTERNS = [
    [/^(.+) \(request timed out\)$/, function (match, message) {
      return translateRuntimeText(message) + " (délai de la requête dépassé)";
    }],
    [/^(.+): ([^:]+)$/, function (match, prefix, value) {
      var translatedPrefix = FRENCH_RUNTIME_TEXT[prefix];
      return translatedPrefix ? translatedPrefix + " : " + translateRuntimeText(value) : match;
    }],
    [/^(.+) resolves to (.+)$/, function (match, place, region) {
      return place + " correspond à " + region;
    }],
    [/^(\d+) of (\d+) regions$/, function (match, shown, total) {
      return shown + " régions sur " + total;
    }],
    [/^(\d+) regions$/, function (match, count) {
      return count + " régions";
    }],
    [/^(.+) region$/, function (match, label) {
      return "Région de " + label;
    }]
  ];

  function translateRuntimeText(value) {
    var source = String(value == null ? "" : value);
    if (!frenchRuntime || !source) return source;
    var leading = (source.match(/^\s*/) || [""])[0];
    var trailing = (source.match(/\s*$/) || [""])[0];
    var text = source.slice(leading.length, source.length - trailing.length || source.length);
    if (!text) return source;
    if (Object.prototype.hasOwnProperty.call(FRENCH_RUNTIME_TEXT, text)) {
      var direct = FRENCH_RUNTIME_TEXT[text];
      var directTrailing = /[’']$/.test(direct) ? "" : trailing;
      return leading + direct + directTrailing;
    }
    for (var index = 0; index < FRENCH_RUNTIME_PATTERNS.length; index += 1) {
      if (FRENCH_RUNTIME_PATTERNS[index][0].test(text)) {
        return leading + text.replace(FRENCH_RUNTIME_PATTERNS[index][0], FRENCH_RUNTIME_PATTERNS[index][1]) + trailing;
      }
    }
    return source;
  }

  function localizeRuntimeNode(node) {
    if (!frenchRuntime || !node) return;
    if (node.nodeType === 3) {
      var parentName = node.parentElement && node.parentElement.tagName;
      var original = node.nodeValue;
      var trimmed = String(original || "").trim();
      if (parentName === "SCRIPT" || parentName === "STYLE" || parentName === "PRE") return;
      if (parentName === "CODE" && trimmed !== "Unavailable") return;
      var translated = translateRuntimeText(original);
      if (translated !== node.nodeValue) node.nodeValue = translated;
      return;
    }
    if (node.nodeType !== 1) return;
    ["aria-label", "placeholder", "title"].forEach(function (attribute) {
      if (!node.hasAttribute(attribute)) return;
      var current = node.getAttribute(attribute);
      var translated = translateRuntimeText(current);
      if (translated !== current) node.setAttribute(attribute, translated);
    });
    Array.prototype.slice.call(node.childNodes || []).forEach(localizeRuntimeNode);
  }

  function enableRuntimeLocalization(root) {
    if (!frenchRuntime || !root || root.dataset.mccLocaleReady === "1") return;
    root.dataset.mccLocaleReady = "1";
    localizeRuntimeNode(root);
    if (typeof MutationObserver === "undefined") return;
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "characterData") localizeRuntimeNode(record.target);
        if (record.type === "attributes") localizeRuntimeNode(record.target);
        Array.prototype.slice.call(record.addedNodes || []).forEach(localizeRuntimeNode);
      });
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "placeholder", "title"]
    });
    root.__mccLocaleObserver = observer;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var requestOptions = Object.assign({}, options || {});
    var upstreamSignal = requestOptions.signal;
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    var abortFromUpstream = function () {
      if (controller) controller.abort();
    };
    if (controller) {
      requestOptions.signal = controller.signal;
      timer = window.setTimeout(function () { controller.abort(); }, timeoutMs || REQUEST_TIMEOUT_MS);
      if (upstreamSignal) {
        if (upstreamSignal.aborted) controller.abort();
        else upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
      }
    }
    return fetch(url, requestOptions).finally(function () {
      if (timer) window.clearTimeout(timer);
      if (upstreamSignal) upstreamSignal.removeEventListener("abort", abortFromUpstream);
    });
  }

  function fetchJsonAsset(filename, errorMessage, retrying) {
    return fetchWithTimeout(new URL(filename, assetBase), { cache: filename === "iata-regions.json" ? "no-cache" : "default" }, REQUEST_TIMEOUT_MS).then(function (response) {
      if (!response.ok) throw new Error(errorMessage);
      return response.json();
    }).catch(function (error) {
      if (!retrying && error && error.name !== "AbortError") {
        return fetchJsonAsset(filename, errorMessage, true);
      }
      throw error && error.name === "AbortError" ? new Error(errorMessage + " (request timed out)") : error;
    });
  }

  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetchJsonAsset("iata-regions.json", "Unable to load MeshCore Canada region data")
        .then(prepareCatalog)
        .catch(function (error) {
          catalogPromise = null;
          throw error;
        });
    }
    return catalogPromise;
  }

  function loadDisplayPartition(data) {
    if (!displayPartitionPromise) {
      displayPartitionPromise = fetchJsonAsset(
        "iata-boundaries.geojson?v=" + data.source.boundarySha256,
        "Unable to load the Canadian map layer"
      ).catch(function (error) {
        displayPartitionPromise = null;
        throw error;
      });
    }
    return displayPartitionPromise;
  }

  function loadResolverPartition(data) {
    if (!resolverPartitionPromise) {
      resolverPartitionPromise = fetchJsonAsset(
        "scope-jurisdictions.geojson?v=" + data.source.jurisdictionSha256,
        "Unable to load the Canadian location layer"
      ).catch(function (error) {
        resolverPartitionPromise = null;
        throw error;
      });
    }
    return resolverPartitionPromise;
  }

  function ensureResolverData(data) {
    if (data.resolverRegions && data.jurisdictions) return Promise.resolve(data);
    return Promise.all([loadDisplayPartition(data), loadResolverPartition(data)]).then(function (layers) {
      return applyGeneratedPartition(data, layers[0], layers[1]);
    });
  }

  function prepareCatalog(data) {
    if (data.__mccPrepared) return data;
    if (!iataScopes || data.schema !== "meshcore-canada-iata-scopes/v1" || !Array.isArray(data.policy && data.policy.reservedScopes)) throw new Error("The IATA scope catalog is unavailable or out of date.");
    if (!/^[0-9a-f]{64}$/.test(data.source.boundarySha256) || !/^[0-9a-f]{64}$/.test(data.source.jurisdictionSha256)) throw new Error("The IATA scope catalog is unavailable or out of date.");
    var suppliedAliases = data.aliases || {};
    var previousAliases = data.regionAliases || {};
    var strategySeeds = (data.seeds || []).map(function (seed) {
      return Object.assign({}, seed, {
        tag: slug(seed.tag),
        sourceTier: seed.regionSource,
        boundaryType: seed.regionSource === "meshmapper" ? "meshmapper-zone" : "starter-region"
      });
    });
    var seedTags = {};
    strategySeeds.forEach(function (seed) {
      if (!seed.tag || seedTags[seed.tag] || !data.hierarchy[seed.tag]) {
        throw new Error("The Canadian region catalog contains an invalid or duplicate local region");
      }
      seedTags[seed.tag] = true;
    });
    data.regionAliases = {};
    Object.keys(data.hierarchy || {}).forEach(function (tag) {
      data.regionAliases[tag] = unique([tag, data.hierarchy[tag].label]
        .concat(suppliedAliases[tag] || [])
        .concat(previousAliases[tag] || [])
        .filter(Boolean));
    });
    Object.keys(data.legacyAliases || {}).forEach(function (oldTag) {
      data.legacyAliases[oldTag].forEach(function (tag) {
        if (seedTags[tag]) data.regionAliases[tag] = unique(data.regionAliases[tag].concat([oldTag]));
      });
    });
    var partitionTags = Object.keys(seedTags).sort();
    data.strategySeeds = strategySeeds;
    data.strategyFallbackSeeds = [];
    data.communityExtraSeeds = [];
    data.seeds = strategySeeds;
    data.consolidatedRegionTags = partitionTags;
    data.regionCounts = {
      total: partitionTags.length,
      meshmapper: strategySeeds.filter(function (seed) { return seed.regionSource === "meshmapper"; }).length,
      starters: strategySeeds.filter(function (seed) { return seed.regionSource === "meshcore-canada"; }).length,
      extensions: data.source.planningExtensionCount || 0,
      strategy: strategySeeds.length
    };
    data.metroGroups = (data.metroGroups || []).map(function (group) {
      return { label: group.label, tags: group.tags.filter(function (tag) { return Boolean(seedTags[tag]); }) };
    });
    data.sharedRepeaterAreas = Object.keys(data.searchGroups || {}).map(function (id) {
      var group = data.searchGroups[id];
      if (!group || !group.repeaterConfig || group.repeaterConfig.mode !== "shared-member-paths") return null;
      var members = unique((group.members || []).filter(function (tag) { return Boolean(seedTags[tag]); }));
      if (members.length !== (group.members || []).length || members.length < 2) {
        throw new Error("The Canadian region catalog contains an invalid shared repeater area: " + id);
      }
      members.sort(function (left, right) {
        return ancestryText(data, left).localeCompare(ancestryText(data, right));
      });
      if (unique(members.map(function (tag) { return provinceTagFor(data, tag); })).length < 2) {
        throw new Error("A shared repeater area must cross a province or territory: " + id);
      }
      return {
        id: id,
        label: group.label,
        members: members,
        defaultForMembers: group.repeaterConfig.defaultForMembers === true,
        basis: group.repeaterConfig.basis || ""
      };
    }).filter(Boolean);
    data.externalTagLabels = {};
    data.externalTagParents = {};
    data.externalRegionPathList = Object.keys(data.externalRegionPaths || {}).map(function (id) {
      var record = data.externalRegionPaths[id];
      var path = unique(((record && record.path) || []).map(slug).filter(Boolean));
      if (!record || record.geographic !== false || record.automatic !== false || !path.length ||
          path.length !== (record.path || []).length) {
        throw new Error("The region catalog contains an invalid neighbouring network path: " + id);
      }
      path.forEach(function (tag, index) {
        if (data.hierarchy[tag]) {
          throw new Error("A neighbouring network tag collides with the Canadian hierarchy: " + tag);
        }
        var label = record.tagLabels && record.tagLabels[tag];
        if (!label) {
          throw new Error("A neighbouring network tag has no label: " + tag);
        }
        var parent = index ? path[index - 1] : null;
        if (Object.prototype.hasOwnProperty.call(data.externalTagParents, tag) &&
            data.externalTagParents[tag] !== parent) {
          throw new Error("A neighbouring network tag has conflicting parents: " + tag);
        }
        if (data.externalTagLabels[tag] && data.externalTagLabels[tag] !== label) {
          throw new Error("A neighbouring network tag has conflicting labels: " + tag);
        }
        data.externalTagParents[tag] = parent;
        data.externalTagLabels[tag] = label;
      });
      return {
        id: id,
        label: (frenchRuntime && record.labelFr) || record.label,
        sharedScope: record.sharedScope === true,
        path: path,
        status: record.authority && record.authority.status || "provisional",
        source: record.authority && record.authority.source || "",
        sourceUrl: record.authority && record.authority.sourceUrl || "",
        eligibility: record.eligibility || "",
        trafficEvidence: record.trafficEvidence || null
      };
    }).sort(function (left, right) {
      return left.label.localeCompare(right.label);
    });
    Object.defineProperty(data, "__mccPrepared", { value: true });
    return data;
  }

  function applyGeneratedPartition(data, collection, resolverCollection) {
    data = prepareCatalog(data);
    var expected = {};
    (data.consolidatedRegionTags || []).forEach(function (tag) { expected[tag] = true; });

    if (collection) {
      if (collection.schema !== "meshcore-canada-iata-boundaries/v2" || !Array.isArray(collection.features) || !collection.features.length) {
        throw new Error("Canadian map layer is invalid");
      }
      var displaySeen = {};
      var partsSeen = {};
      var normalizedFeatures = collection.features.map(function (feature) {
        var tag = slug(feature.properties && feature.properties.tag);
        var source = feature.properties && feature.properties.regionSource;
        var partId = tag + ":" + source;
        if (!tag || partsSeen[partId] || !expected[tag] || ["meshmapper", "meshcore-canada"].indexOf(source) === -1) {
          throw new Error("Canadian map layer contains an invalid or duplicate region: " + (tag || "unknown"));
        }
        displaySeen[tag] = true;
        partsSeen[partId] = true;
        if (source === "meshcore-canada" && feature.properties.planningKind !== (data.status[tag].state === "published" ? "extension" : "starter")) throw new Error("Canadian map layer is invalid");
        return Object.assign({}, feature, {
          properties: Object.assign({}, feature.properties, {
            tag: tag,
            label: labelFor(data, tag),
            canonicalTag: tag,
            sourceTier: feature.properties.regionSource,
            boundaryType: feature.properties.planningKind === "extension" ? "planning-extension" : feature.properties.regionSource === "meshmapper" ? "meshmapper-zone" : "starter-region"
          })
        });
      });
      if (Object.keys(displaySeen).length !== Object.keys(expected).length) {
        throw new Error("Canadian map layer does not match the region catalog");
      }
      data.partitionRegions = Object.assign({}, collection, { features: normalizedFeatures });
      data.partitionByTag = {};
      normalizedFeatures.forEach(function (feature) {
        var tag = feature.properties.tag;
        if (!data.partitionByTag[tag] || feature.properties.regionSource === "meshmapper") data.partitionByTag[tag] = feature;
      });
      data.resolverRegions = data.partitionRegions;
      data.resolverByTag = data.partitionByTag;
    }

    if (resolverCollection) {
      if (!Array.isArray(resolverCollection.features) || !resolverCollection.features.length) {
        throw new Error("Canadian location layer is invalid");
      }
      var provinceTags = resolverCollection.features.map(function (feature) { return feature.properties.tag; });
      if (unique(provinceTags).length !== 13 || provinceTags.some(function (tag) { return !data.policy.provinces[tag]; })) {
        throw new Error("Canadian province lookup data is invalid");
      }
      data.jurisdictions = resolverCollection;
    }
    return data;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Lucide 0.547.0 SVG paths; ISC/Feather MIT notices are in vendor/lucide-LICENSE.
  // Include only the 5 icons used here, without downloading the full icon library.
  var ICONS = {
    "book-open-check": "<path d=\"M12 21V7\" /><path d=\"m16 12 2 2 4-4\" /><path d=\"M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3\" />",
    "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" /><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />",
    "list-checks": "<path d=\"M13 5h8\" /><path d=\"M13 12h8\" /><path d=\"M13 19h8\" /><path d=\"m3 17 2 2 4-4\" /><path d=\"m3 7 2 2 4-4\" />",
    "map": "<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\" /><path d=\"M15 5.764v15\" /><path d=\"M9 3.236v15\" />",
    "search": "<path d=\"m21 21-4.34-4.34\" /><circle cx=\"11\" cy=\"11\" r=\"8\" />"
  };

  function icon(name) {
    return '<svg class="mcc-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + '</svg>';
  }

  function copyText(text, button, resetLabel) {
    var feedback = function (copied) {
      if (!button) return;
      var host = button.closest ? button.closest("[data-mcc-regions]") : null;
      var live = host && host.querySelector("[data-mcc-copy-status]");
      var originalHtml = button.dataset.originalHtml || button.innerHTML || resetLabel || "Copy";
      button.dataset.originalHtml = originalHtml;
      button.classList.toggle("is-copied", copied);
      button.innerHTML = copied ? "Copied" : "Copy failed";
      if (live) {
        live.textContent = "";
        window.setTimeout(function () {
          live.textContent = copied ? "Copied to clipboard." : "Copy failed. Select and copy the command manually.";
        }, 10);
      }
      window.setTimeout(function () {
        button.classList.remove("is-copied");
        button.innerHTML = button.dataset.originalHtml || resetLabel || "Copy";
      }, 1400);
    };
    var fallback = function () {
      var field = document.createElement("textarea");
      var copied = false;
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      field.remove();
      feedback(copied);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { feedback(true); }).catch(fallback);
    } else {
      fallback();
    }
  }

  function slug(value) {
    return String(value || "").toLowerCase().trim();
  }

  function statusFor(data, tag) {
    if (data.status && data.status[tag]) return data.status[tag];
    return {
      state: "draft",
      reviewer: "Unreviewed",
      source: "Canada MeshCore Region Strategy draft v1.1.1"
    };
  }

  function statusLabel(state) {
    if (state === "starter") return "MeshCore Canada starter region";
    if (state === "published") return "MeshMapper zone";
    if (state === "reserved") return "Reserved";
    if (state === "scope") return "Province scope";
    if (state === "pilot") return "ON/QC scope";
    if (state === "draft") return "Needs review";
    if (state === "proposal") return "Draft";
    if (state === "reviewed") return "Reviewed";
    if (state === "active") return "Active";
    if (state === "deprecated") return "Deprecated";
    return state || "Needs review";
  }

  function labelFor(data, tag) {
    var label = tag;
    if (data.hierarchy[tag]) label = frenchRuntime && data.hierarchy[tag].labelFr ? data.hierarchy[tag].labelFr : data.hierarchy[tag].label;
    else if (data.externalTagLabels && data.externalTagLabels[tag]) label = data.externalTagLabels[tag];
    return translateRuntimeText(label);
  }

  function parentFor(data, tag) {
    return data.hierarchy[tag] ? data.hierarchy[tag].parent : null;
  }

  function childrenFor(data, tag) {
    if (data.policy.provinces[tag]) {
      return data.seeds.filter(function (seed) { return seed.provinces.indexOf(tag) !== -1; })
        .map(function (seed) { return seed.tag; }).sort(function (a, b) { return labelFor(data, a).localeCompare(labelFor(data, b)); });
    }
    return Object.keys(data.hierarchy || {}).filter(function (candidate) {
      return parentFor(data, candidate) === tag;
    }).sort(function (a, b) {
      return labelFor(data, a).localeCompare(labelFor(data, b));
    });
  }

  function leafDescendants(data, tag) {
    var children = childrenFor(data, tag);
    if (!children.length) return seedForTag(data, tag) ? [tag] : [];
    return unique([].concat.apply([], children.map(function (child) {
      return leafDescendants(data, child);
    })));
  }

  function featuresForNode(data, tag) {
    var leaves = leafDescendants(data, tag);
    return {
      type: "FeatureCollection",
      features: (data.partitionRegions && data.partitionRegions.features || []).filter(function (feature) { return leaves.indexOf(feature.properties.tag) !== -1; })
    };
  }

  function ancestryFor(data, tag, province) {
    if (data.hierarchy[tag] && data.hierarchy[tag].kind === "city" && data.policy.provinces[province]) return ["can", province, tag];
    var chain = [];
    var seen = {};
    var cur = tag;
    while (cur && !seen[cur]) {
      seen[cur] = true;
      chain.unshift(cur);
      cur = parentFor(data, cur);
    }
    return chain;
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function provinceTagFor(data, tag) {
    var chain = ancestryFor(data, tag);
    return chain.length > 1 ? chain[1] : tag;
  }

  function ancestryText(data, tag) {
    return ancestryFor(data, tag).join(" -> ");
  }

  function sharedRepeaterAreaForTag(data, tag) {
    return (data.sharedRepeaterAreas || []).find(function (area) {
      return area.members.indexOf(tag) !== -1;
    }) || null;
  }

  function canonicalLeafOrder(data, tags) {
    var seedTags = {};
    (data.seeds || []).forEach(function (seed) { seedTags[seed.tag] = true; });
    return unique(tags || []).filter(function (tag) {
      return Boolean(seedTags[tag]);
    }).sort(function (left, right) {
      return ancestryText(data, left).localeCompare(ancestryText(data, right));
    });
  }

  function expandSharedRepeaterLeaves(data, tags) {
    var expanded = canonicalLeafOrder(data, tags);
    expanded.slice().forEach(function (tag) {
      var area = sharedRepeaterAreaForTag(data, tag);
      if (area && area.defaultForMembers) {
        expanded = expanded.concat(area.members);
      }
    });
    return canonicalLeafOrder(data, expanded);
  }

  function selectedExternalRegionPaths(data, ids) {
    var selected = {};
    unique(ids || []).forEach(function (id) { selected[id] = true; });
    return (data.externalRegionPathList || []).filter(function (record) {
      return Boolean(selected[record.id]);
    }).sort(function (left, right) {
      return left.path.join("/").localeCompare(right.path.join("/"));
    });
  }

  function seedText(seed) {
    return seed
      ? seed.lat.toFixed(4) + ", " + seed.lon.toFixed(4) + " / r " + (seed.r || 0) + " km"
      : "No seed";
  }

  function provinceOptions(data) {
    var tags = Object.keys(data.policy.provinces);
    return tags.sort(function (a, b) {
      return labelFor(data, a).localeCompare(labelFor(data, b));
    });
  }

  function knownProvince(data, tag) {
    return typeof tag === "string" && Object.prototype.hasOwnProperty.call(data.policy.provinces, tag);
  }

  function migratedCitySelection(data, value) {
    var names = String(value || "").split(",").map(slug).filter(Boolean);
    if (names.length > 64) return { tags: [], unresolved: ["Too many saved zones"] };
    var tags = [], unresolved = [];
    names.forEach(function (name) {
      if (seedForTag(data, name)) tags.push(name);
      else {
        var aliases = data.legacyAliases[name];
        if (Array.isArray(aliases) && aliases.length === 1 && seedForTag(data, aliases[0])) tags.push(aliases[0]);
        else unresolved.push(name);
      }
    });
    return { tags: unique(tags), unresolved: unique(unresolved) };
  }

  function regionPageHref(page) {
    var host = document.querySelector("[data-mcc-regions][data-mcc-root]");
    if (!host && window.location.pathname.indexOf(".html") !== -1) {
      return (page === "config" ? "config" : page) + ".html";
    }
    var routes = { dashboard: "", config: "", setup: "", map: "map/", guide: "guide/" };
    var root = host ? host.getAttribute("data-mcc-root") : "./";
    return new URL(routes[page] || "", new URL(root, document.baseURI)).href;
  }

  function mapHrefForState(state) {
    var params = new URLSearchParams();
    if (!state.manualSelection && Number.isFinite(state.lat)) params.set("lat", state.lat.toFixed(6));
    if (!state.manualSelection && Number.isFinite(state.lon)) params.set("lon", state.lon.toFixed(6));
    if (state.name) params.set("name", state.name);
    if (state.resolution && state.resolution.primary) {
      params.set("tag", state.forcedTag || state.resolution.primary.seed.tag);
    }
    if (state.type === "high-site") params.set("type", "large");
    if (state.type === "unknown") params.set("type", "unknown");
    if (state.activation) params.set("activation", state.activation);
    var savedRegions = (state.selectedMetros || []).concat(state.unresolvedRegions || []);
    if (savedRegions.length) {
      params.set("regions", savedRegions.join(","));
    }
    if (state.selectedExternalPaths && state.selectedExternalPaths.length) {
      params.set("external", state.selectedExternalPaths.join(","));
    }
    if (state.firmware) params.set("firmware", state.firmware);
    if (state.radioProfile) params.set("radio", state.radioProfile);
    if (state.hashMode) params.set("hash", state.hashMode);
    if (state.jurisdictionTag) params.set("province", state.jurisdictionTag);
    if (state.standardDefaults) params.set("defaults", "onqc");
    if (state.deviceRole) params.set("role", state.deviceRole);
    if (state.finishPath) params.set("instructions", state.finishPath);
    return regionPageHref("map") + (params.toString() ? "?" + params.toString() : "");
  }

  function keepLanguageSelection(state) {
    document.querySelectorAll(".md-select__link[hreflang]").forEach(function (link) {
      // Transfer only the tool's public selections, never arbitrary URL fields or secrets.
      link.addEventListener("click", function () {
        var target = new URL(link.href);
        target.search = new URL(mapHrefForState(state)).search;
        link.href = target.href;
      });
    });
  }

  function initialLocation(data, params) {
    var originalTag = slug(params.get("tag") || "");
    var tag = originalTag;
    var legacy = Array.isArray(data.legacyAliases[tag]) ? data.legacyAliases[tag] : [];
    if (!seedForTag(data, tag) && legacy.length === 1) tag = legacy[0];
    var seed = tag && seedForTag(data, tag);
    var hasCoordinates = params.has("lat") || params.has("lon");
    if (!seed && !hasCoordinates) return null;
    if (!seed) tag = null;
    var point = hasCoordinates
      ? configuratorSupport.parseCoordinates(params.get("lat"), params.get("lon"))
      : seed;
    if (!point) return null;
    return { lat: point.lat, lon: point.lon, tag: tag || null, countryCode: "ca",
      source: hasCoordinates ? "coordinates" : "region",
      provinceTag: knownProvince(data, params.get("province")) ? params.get("province") : null,
      legacyTag: originalTag && originalTag !== tag ? originalTag : null,
      name: String(params.get("name") || (tag && labelFor(data, tag)) || "").slice(0, 160) };
  }

  // The setup tool at /config/ reads only the region and its province from a map link
  // (MeshCoreSetupFlow.fromQuery). The map's own fields, such as its default firmware,
  // would answer the tool's questions for the person, so they stay on the map.
  function configHrefForState(state) {
    var params = new URLSearchParams();
    var tag = state.forcedTag || (state.resolution && state.resolution.primary && state.resolution.primary.seed.tag);
    if (tag) params.set("tag", tag);
    if (state.jurisdictionTag) params.set("province", state.jurisdictionTag);
    return regionPageHref("config") + (params.toString() ? "?" + params.toString() : "");
  }
  function haversineKm(aLat, aLon, bLat, bLon) {
    var rad = function (d) { return d * Math.PI / 180; };
    var dLat = rad(bLat - aLat);
    var dLon = rad(bLon - aLon);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) *
      Math.cos(rad(aLat)) * Math.cos(rad(bLat));
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function rankSeeds(data, lat, lon, jurisdictionTag) {
    return data.seeds.filter(function (seed) {
      return seed.resolve !== false;
    }).map(function (seed) {
      var km = haversineKm(lat, lon, seed.lat, seed.lon);
      return {
        seed: seed,
        km: km,
        score: km,
        ancestry: ancestryFor(data, seed.tag, jurisdictionTag)
      };
    }).sort(function (a, b) {
      return a.score - b.score;
    });
  }

  function pointInRing(lon, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      var xi = Number(ring[i][0]);
      var yi = Number(ring[i][1]);
      var xj = Number(ring[j][0]);
      var yj = Number(ring[j][1]);
      var crosses = ((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function featureContainsPoint(feature, lat, lon) {
    if (!feature || !feature.geometry) return false;
    var geometry = feature.geometry;
    var polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    if (!Array.isArray(polygons)) return false;
    return polygons.some(function (polygon) {
      if (!polygon || !polygon.length || !pointInRing(lon, lat, polygon[0])) return false;
      return !polygon.slice(1).some(function (hole) { return pointInRing(lon, lat, hole); });
    });
  }

  function boundaryFeatureAt(data, lat, lon, forcedTag, jurisdictionTag) {
    var features = data.resolverRegions && data.resolverRegions.features ||
      data.partitionRegions && data.partitionRegions.features || [];
    features = features.filter(function (feature) { return featureContainsPoint(feature, lat, lon); });
    var published = features.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; });
    if (published.length) features = published;
    if (forcedTag) {
      var forced = features.find(function (feature) { return feature.properties.tag === slug(forcedTag); });
      return forced || null;
    }
    return features.length === 1 ? features[0] : null;
  }

  function resolveLocation(data, lat, lon, forcedTag, jurisdictionTag, manualSelection) {
    var ranked = rankSeeds(data, lat, lon, jurisdictionTag);
    var boundary = boundaryFeatureAt(data, lat, lon, forcedTag, jurisdictionTag);
    var boundaryTag = boundary ? String(boundary.properties.tag).toLowerCase() : null;
    var primary = boundaryTag
      ? ranked.find(function (entry) { return entry.seed.tag === boundaryTag; }) || null
      : null;
    var matches = data.resolverRegions ? iataScopes.matches(data.resolverRegions, lat, lon) : [];
    var physicalProvince = data.jurisdictions ? iataScopes.provinceAt(data.jurisdictions, lat, lon) : null;
    var province = !manualSelection && physicalProvince ? physicalProvince :
      knownProvince(data, jurisdictionTag) ? jurisdictionTag :
        manualSelection && forcedTag && primary && primary.seed.provinces.length > 1 ? null : physicalProvince;
    if (primary) {
      ranked = [primary].concat(ranked.filter(function (entry) { return entry.seed.tag !== primary.seed.tag; }));
    }
    var secondary = ranked.find(function (entry) {
      return !primary || entry.seed.tag !== primary.seed.tag;
    }) || null;

    return {
      primary: primary,
      secondary: secondary,
      top5: ranked.slice(0, 5),
      nearestKm: ranked[0] ? ranked[0].km : Infinity,
      boundary: boundary,
      displayBoundary: boundary,
      insideBoundary: Boolean(boundary),
      hasMatch: Boolean(primary),
      matches: matches,
      province: province,
      sourceTier: boundary ? boundary.properties.regionSource : null,
      planningKind: boundary ? boundary.properties.planningKind || null : null,
      coverageKm: 0
    };
  }

  function recommend(data, resolution, type, selectedMetros, selectedExternalPaths, activation) {
    if (!resolution || !resolution.primary || !resolution.province) return null;
    return iataScopes.profile(data, {
      home: resolution.primary.seed.tag,
      province: resolution.province,
      activation: activation,
      bridge: type === "high-site",
      cities: type === "high-site" ? selectedMetros || [] : [],
      external: selectedExternalPaths || []
    });
  }

  function hueForTag(tag) {
    var hash = 0;
    for (var i = 0; i < tag.length; i += 1) {
      hash = (hash * 31 + tag.charCodeAt(i)) % 360;
    }
    return hash;
  }

  function colorForTag(tag) {
    return "hsl(" + hueForTag(tag) + ", 55%, 45%)";
  }

  function parseCanadianPostalCode(query) {
    var compact = query.trim().replace(/[\s-]+/g, "").toUpperCase();
    return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)
      ? { compact: compact, formatted: compact.slice(0, 3) + " " + compact.slice(3) }
      : null;
  }

  function parseNominatimHit(hit) {
    var address = hit.address || {};
    var parts = String(hit.display_name || "").split(",").map(function (part) {
      return part.trim();
    }).filter(Boolean);
    return {
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      name: parts.slice(0, 4).join(", "),
      countryCode: slug(address.country_code),
      province: address.state || address.province || null
    };
  }

  function normalizeLocationSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  var CANADIAN_PROVINCE_CODES = {
    ab: "AB", alberta: "AB",
    bc: "BC", "british-columbia": "BC",
    mb: "MB", manitoba: "MB",
    nb: "NB", "new-brunswick": "NB",
    nl: "NL", nf: "NL", newfoundland: "NL", "newfoundland-and-labrador": "NL",
    ns: "NS", "nova-scotia": "NS",
    nt: "NT", nwt: "NT", "northwest-territories": "NT",
    nu: "NU", nunavut: "NU",
    on: "ON", ontario: "ON",
    pe: "PE", pei: "PE", "prince-edward-island": "PE",
    qc: "QC", pq: "QC", quebec: "QC",
    sk: "SK", saskatchewan: "SK",
    yt: "YT", yukon: "YT", "yukon-territory": "YT"
  };

  function jurisdictionTagFromGeo(geo) {
    var value = String(geo && geo.province || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    var code = CANADIAN_PROVINCE_CODES[value] || value;
    return slug(code);
  }

  function parseGeocoderCaHit(body, fallbackName) {
    var standard = body && body.standard || {};
    var lat = parseFloat(body && body.latt);
    var lon = parseFloat(body && body.longt);
    var province = CANADIAN_PROVINCE_CODES[slug(standard.prov || standard.province)];
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !province) return null;
    return {
      lat: lat,
      lon: lon,
      name: [standard.city, province].filter(Boolean).join(", ") || fallbackName,
      countryCode: "ca",
      province: province
    };
  }

  function localGeocode(data, query) {
    var needle = normalizeLocationSearch(query);
    if (needle.length < 2) return null;
    // Only codes identify a region. Town aliases must resolve their own location,
    // not the seed of a large zone (for example Gatineau, QC versus Ottawa, ON).
    if (!data.seeds.some(function (seed) { return seed.tag === needle; }) &&
        !Object.prototype.hasOwnProperty.call(data.legacyAliases || {}, needle)) return null;
    var matches = (data.seeds || []).filter(function (seed) {
      return seed.resolve !== false;
    }).map(function (seed) {
      var names = unique([seed.tag, labelFor(data, seed.tag)].concat(data.regionAliases[seed.tag] || []).filter(Boolean));
      var score = Infinity;
      names.forEach(function (name) {
        var normalized = normalizeLocationSearch(name);
        if (!normalized) return;
        if (normalized === needle) score = Math.min(score, normalized === normalizeLocationSearch(seed.tag) ? 0 : 1);
        else if (needle.length >= 3 && (normalized.indexOf(needle) !== -1 || needle.indexOf(normalized) !== -1)) score = Math.min(score, 2);
      });
      return { seed: seed, names: names, score: score };
    }).filter(function (item) {
      return Number.isFinite(item.score);
    }).sort(function (a, b) {
      return a.score - b.score;
    });
    if (!matches.length) return null;
    var best = matches[0];
    var tied = matches.filter(function (item) { return item.score === best.score; });
    if (tied.length > 1 && best.score > 1) return null;
    if (tied.length > 1) {
      return {
        ambiguous: true,
        choices: tied.map(function (item) {
          var province = provinceTagFor(data, item.seed.tag);
          return { tag: item.seed.tag, lat: item.seed.lat, lon: item.seed.lon, countryCode: "ca", source: "region",
            name: labelFor(data, item.seed.tag) + " (" + item.seed.provinces.map(function (value) { return value.toUpperCase(); }).join("/") + ")" };
        })
      };
    }
    var displayName = best.names.find(function (name) {
      return normalizeLocationSearch(name) === needle;
    }) || labelFor(data, best.seed.tag);
    if (normalizeLocationSearch(displayName) === normalizeLocationSearch(best.seed.tag)) displayName = best.seed.tag.toUpperCase() + " — " + labelFor(data, best.seed.tag);
    var provinceTag = provinceTagFor(data, best.seed.tag);
    return {
      lat: Number(best.seed.lat),
      lon: Number(best.seed.lon),
      name: [displayName, best.seed.provinces.length === 1 && provinceTag && labelFor(data, provinceTag)].filter(Boolean).join(", "),
      countryCode: "ca",
      province: best.seed.provinces.length === 1 && provinceTag ? labelFor(data, provinceTag) : null,
      tag: best.seed.tag,
      source: "region",
      exactLocalMatch: best.score <= 1
    };
  }

  function nominatimSearch(params, signal) {
    var url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams(Object.assign({
      format: "json",
      limit: "1",
      addressdetails: "1"
    }, params));
    return fetchWithTimeout(url, {
      headers: { "Accept-Language": frenchRuntime ? "fr-CA,fr,en" : "en-CA,en" },
      signal: signal
    }, REQUEST_TIMEOUT_MS)
      .then(function (res) {
        if (!res.ok) throw new Error("Geocoding service error");
        return res.json();
      })
      .then(function (rows) {
        return rows.length ? parseNominatimHit(rows[0]) : null;
      });
  }

  function geocodeCanadianPostal(postal, signal) {
    return nominatimSearch({ postalcode: postal.formatted, country: "ca" }, signal).then(function (hit) {
      if (hit) return hit;
      return nominatimSearch({ q: postal.formatted, countrycodes: "ca" }, signal);
    }).then(function (hit) {
      if (hit) return hit;
      return fetchWithTimeout(
        "https://geocoder.ca/?locate=" + encodeURIComponent(postal.compact) + "&json=1",
        { signal: signal },
        REQUEST_TIMEOUT_MS
      )
        .then(function (res) {
          if (!res.ok) throw new Error("Geocoding service error");
          return res.json();
        })
        .then(function (body) {
          var hit = parseGeocoderCaHit(body, postal.formatted);
          if (!hit) throw new Error("No matching Canadian postal code found");
          hit.name = [postal.formatted, hit.name].filter(Boolean).join(", ");
          return hit;
        });
    });
  }

  function showLocationChoices(target, choices, choose) {
    if (!choices) return;
    choices.forEach(function (geo) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "mcc-button mcc-button-secondary";
      button.textContent = geo.name + (geo.tag ? " (" + geo.tag.toUpperCase() + ")" : "");
      button.addEventListener("click", function () { choose(geo); });
      target.appendChild(button);
    });
  }

  function geocode(data, query, signal) {
    var localMatch = localGeocode(data, query);
    if (localMatch && localMatch.ambiguous) {
      var error = new Error("Choose the region you mean:");
      error.choices = localMatch.choices;
      return Promise.reject(error);
    }
    if (localMatch && localMatch.exactLocalMatch) return Promise.resolve(localMatch);
    var postal = parseCanadianPostalCode(query);
    if (postal) return geocodeCanadianPostal(postal, signal);
    var places = window.MeshCorePlaceSearch;
    return places.lookup(query, frenchRuntime ? "fr" : "en", function (url) {
      return fetchWithTimeout(url, { signal: signal, credentials: "omit" }, REQUEST_TIMEOUT_MS);
    }).then(function (results) {
        var choices = results.map(function (place) {
          return { lat: place.lat, lon: place.lon, name: place.name + ", " + place.province,
            countryCode: "ca", province: places.provinceCode(place.province).toLowerCase() };
        });
        if (choices.length === 1) return choices[0];
        if (!choices.length) throw new Error("Online place lookup is unavailable. Enter coordinates or browse the region list.");
        var error = new Error("Choose the place you mean:");
        error.choices = choices;
        throw error;
      });
  }

  function isCanada(geo) {
    return slug(geo.countryCode) === "ca";
  }

  function setStatus(target, message, type) {
    if (!target) return;
    target.setAttribute("role", type === "error" ? "alert" : "status");
    target.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    target.setAttribute("aria-atomic", "true");
    target.innerHTML = message
      ? '<div class="mcc-status mcc-status-' + esc(type || "info") + '">' + message + "</div>"
      : "";
  }

  function planningNotice(resolution) {
    if (resolution.sourceTier !== "meshcore-canada") return "";
    var extension = resolution.planningKind === "extension";
    return '<div class="mcc-note mcc-note-warning"><strong>' + (extension ? 'MeshCore Canada planning extension' : 'MeshCore Canada starter region') + '</strong><p>' +
      (extension ? 'This point is outside the published MeshMapper boundary. MeshCore Canada assigns the gap to this nearby IATA region for planning; confirm its use locally.' : 'This broad starter region is assigned by MeshCore Canada, not yet published by MeshMapper. Confirm its use with local operators; it does not promise radio coverage.') +
      '</p><a href="' + esc(regionPageHref("guide") + (extension ? '#planning-extensions' : '#starter-regions')) + '">' + (extension ? 'Planning extension details' : 'Starter region details') + '</a></div>';
  }

  function seedForTag(data, tag) {
    return data.seeds.find(function (seed) {
      return seed.tag === tag;
    }) || null;
  }

  function sourceUrlFor(data, tag) {
    var st = statusFor(data, tag);
    if (st.state === "starter") return regionPageHref("guide") + '#starter-regions';
    if (st.sourceUrl) return st.sourceUrl;
    var meshMapperSource = data.meshMapperSources && data.meshMapperSources[tag] && data.meshMapperSources[tag][0];
    if (meshMapperSource && meshMapperSource.sourceUrl) return meshMapperSource.sourceUrl;
    var seed = seedForTag(data, tag);
    if (seed && seed.pnwAligned && data.meta.attribution) return data.meta.attribution.url;
    if (data.source && data.source.forum) return data.source.forum;
    return null;
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = new URL("vendor/leaflet/leaflet.css", assetBase).href;
      document.head.appendChild(link);

      var script = document.createElement("script");
      script.src = new URL("vendor/leaflet/leaflet.js", assetBase).href;
      script.onload = function () { resolve(window.L); };
      script.onerror = function () {
        leafletPromise = null;
        reject(new Error("Leaflet failed to load"));
      };
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function initMap(el, data) {
    el.innerHTML = '' +
      '<div class="mcc-map-experience">' +
      '<div class="mcc-visually-hidden" data-mcc-copy-status role="status" aria-live="polite" aria-atomic="true"></div>' +
      '<div class="mcc-map-mode-switch" role="group" aria-label="Region map view">' +
      '<button type="button" data-map-mode="explore" aria-pressed="true" aria-controls="mcc-explore-panel">Find a region</button>' +
      '<button type="button" data-map-mode="audit" aria-pressed="false" aria-controls="mcc-audit-panel">Region data</button>' +
      '</div>' +
      '<section id="mcc-explore-panel" data-map-panel="explore">' +
      '<div class="mcc-map-shell">' +
      '<aside class="mcc-map-panel" aria-label="Region search and details">' +
      '<section class="mcc-card mcc-card-compact">' +
      '<h3>Find a place</h3>' +
      '<label class="mcc-label" for="mcc-map-location-input">City, airport code, postal code, or region name</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-map-location-input" data-role="map-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="map-locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '<details class="mcc-coordinate-entry"><summary>Enter coordinates instead</summary>' +
      '<div class="mcc-coordinate-grid">' +
      '<label><span>Latitude</span><input class="mcc-input" data-role="map-latitude" inputmode="decimal" autocomplete="off" placeholder="45.4215"></label>' +
      '<label><span>Longitude</span><input class="mcc-input" data-role="map-longitude" inputmode="decimal" autocomplete="off" placeholder="-75.6972"></label>' +
      '</div><button class="mcc-button mcc-button-secondary" type="button" data-action="map-use-coordinates">Use coordinates</button></details>' +
      '<div data-role="map-status"></div>' +
      '</section>' +
      '<details class="mcc-card mcc-card-compact" data-role="map-region-browser">' +
      '<summary>Browse by province or territory</summary>' +
      '<div class="mcc-region-breadcrumbs" data-role="region-breadcrumbs"></div>' +
      '<div class="mcc-region-children" data-role="region-children"></div>' +
      '</details>' +
      '<section class="mcc-card mcc-dynamic-card" data-role="map-result-section" hidden>' +
      '<h3>Selected region</h3><div data-role="map-text-result"></div>' +
      '</section>' +
      '</aside>' +
      '<div class="mcc-map-stage">' +
      '<a class="mcc-skip-map" href="#mcc-region-list">Skip the interactive map</a>' +
      '<div class="mcc-visually-hidden" data-role="map-ready-status" role="status" aria-live="polite" aria-atomic="true"></div>' +
      '<p class="mcc-map-progress" data-role="map-boundary-status" role="status" hidden>Loading regional boundaries…</p>' +
      '<div class="mcc-map-loading" data-role="map-loading">' +
      '<div>' + icon("map") + '<h3>Loading interactive map…</h3>' +
      '<p data-role="map-load-status" role="status" aria-live="polite">Loading Canadian boundaries and OpenStreetMap tiles.</p>' +
      '<button class="mcc-button" type="button" data-action="load-map" hidden>Retry map</button></div>' +
      '</div>' +
      '<div class="mcc-map-area" data-role="map-area" hidden>' +
      '<div class="mcc-map-canvas" data-role="map-canvas" role="region" aria-label="Interactive Canadian region map" tabindex="0"></div>' +
      '<details class="mcc-map-legend"><summary>Map legend</summary><p><span><i class="mcc-legend-published"></i>Published MeshMapper boundary</span><span><i class="mcc-legend-starter"></i>MeshCore Canada planning</span></p></details>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<details class="mcc-card mcc-map-list-card" id="mcc-region-list">' +
      '<summary>Browse all regions</summary>' +
      '<div class="mcc-section-head"><div><p class="mcc-eyebrow">Can\'t use the map?</p><p>Search the full region list.</p></div></div>' +
      '<div data-role="map-region-table"></div>' +
      '</details>' +
      '</section>' +
      '<section id="mcc-audit-panel" class="mcc-audit-panel" data-map-panel="audit" hidden>' +
      '<div class="mcc-status mcc-status-info" data-role="audit-status" role="status">Audit data loads when this view is opened.</div>' +
      '<div data-role="audit-content"></div>' +
      '</section>' +
      '</div>';

    var mapParams = new URLSearchParams(window.location.search);
    var requestedLargeCoverage = mapParams.get("type") === "large";
    var requestedCitySelection = migratedCitySelection(data, mapParams.get("regions"));
    var requestedCanadianRegions = requestedCitySelection.tags;
    var requestedExternalPaths = selectedExternalRegionPaths(
      data,
      String(mapParams.get("external") || "").split(",").map(slug).filter(Boolean)
    ).map(function (record) { return record.id; });
    requestedCitySelection.unresolved = requestedCitySelection.unresolved.concat(String(mapParams.get("external") || "").split(",").map(slug).filter(function (id) { return id && requestedExternalPaths.indexOf(id) === -1; }).map(function (id) { return "external:" + id; }));
    var state = {
      lat: null,
      lon: null,
      name: "",
      forcedTag: null,
      jurisdictionTag: null,
      type: requestedLargeCoverage ? "high-site" : mapParams.get("type") === "unknown" ? "unknown" : "residential",
      activation: mapParams.get("activation") === "activate" ? "activate" : "prepare",
      firmware: data.meta.defaultFirmware || "1.16",
      radioProfile: "keep",
      hashMode: ["0", "1", "2"].indexOf(mapParams.get("hash")) !== -1 ? mapParams.get("hash") : "keep",
      standardDefaults: mapParams.get("defaults") === "onqc",
      manualSelection: false,
      selectedMetros: requestedLargeCoverage ? requestedCanadianRegions : [],
      unresolvedRegions: requestedLargeCoverage ? requestedCitySelection.unresolved : [],
      selectedExternalPaths: requestedLargeCoverage ? requestedExternalPaths : requestedExternalPaths.filter(function (id) { return data.externalRegionPaths[id].sharedScope === true; }),
      canGenerate: false,
      resolution: null,
      detailTag: null,
      browseTag: data.meta.rootTag || "can"
    };
    var els = {
      input: el.querySelector("[data-role='map-input']"),
      locate: el.querySelector("[data-action='map-locate']"),
      latitude: el.querySelector("[data-role='map-latitude']"),
      longitude: el.querySelector("[data-role='map-longitude']"),
      coordinates: el.querySelector("[data-action='map-use-coordinates']"),
      status: el.querySelector("[data-role='map-status']"),
      breadcrumbs: el.querySelector("[data-role='region-breadcrumbs']"),
      children: el.querySelector("[data-role='region-children']"),
      resultSection: el.querySelector("[data-role='map-result-section']"),
      textResult: el.querySelector("[data-role='map-text-result']"),
      table: el.querySelector("[data-role='map-region-table']"),
      loadMap: el.querySelector("[data-action='load-map']"),
      mapStage: el.querySelector(".mcc-map-stage"),
      mapLoading: el.querySelector("[data-role='map-loading']"),
      mapLoadStatus: el.querySelector("[data-role='map-load-status']"),
      mapReadyStatus: el.querySelector("[data-role='map-ready-status']"),
      boundaryStatus: el.querySelector("[data-role='map-boundary-status']"),
      mapArea: el.querySelector("[data-role='map-area']"),
      canvas: el.querySelector("[data-role='map-canvas']"),
      auditStatus: el.querySelector("[data-role='audit-status']"),
      auditContent: el.querySelector("[data-role='audit-content']")
    };
    var map = null;
    var marker = null;
    var browseLayer = null;
    var selectedLayer = null;
    var activeGeocodeController = null;
    var locationRequestId = 0;
    var auditLoaded = false;
    var mapIsLoading = false;

    function setMapMode(mode) {
      var next = mode === "audit" ? "audit" : "explore";
      el.querySelectorAll("[data-map-mode]").forEach(function (button) {
        var active = button.getAttribute("data-map-mode") === next;
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      el.querySelectorAll("[data-map-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-map-panel") !== next;
      });
      if (next === "audit") loadAudit();
      if (next === "explore" && map) window.setTimeout(function () { map.invalidateSize(); }, 0);
    }

    function renderAudit() {
        els.auditStatus.hidden = true;
        els.auditContent.innerHTML =
          '<div class="mcc-audit-grid">' +
          '<section class="mcc-card"><h3>MeshMapper snapshot</h3><p>' + esc(data.version) + '</p>' +
          '<dl class="mcc-audit-list"><div><dt>Published zones</dt><dd>' + data.regionCounts.meshmapper + '</dd></div>' +
          '<div><dt>Starter regions</dt><dd>' + data.regionCounts.starters + '</dd></div>' +
          '<div><dt>Planning extensions</dt><dd>' + data.regionCounts.extensions + '</dd></div>' +
          '<div><dt>Fetched</dt><dd>' + esc(data.source.fetchedAt) + '</dd></div></dl>' +
          '<p><a href="https://meshmapper.net/" target="_blank" rel="noopener noreferrer">Open MeshMapper</a></p></section>' +
          '<section class="mcc-card"><h3>Flat scopes</h3><p>City, province, mesh scope where defined, can, and na. Each scope is independent.</p>' +
          '<p>onqc is for Ontario and Québec. can and na are reserved for future use, not companion defaults or active cross-border routes.</p></section>' +
          '<section class="mcc-card"><h3>Map limits</h3><p>Published MeshMapper zones are unchanged. Labelled planning regions fill the remaining gaps across Canada.</p>' +
          '<p>Planning regions follow provincial borders and nearby hubs. Newfoundland and Labrador are separate. Published MeshMapper zones take priority.</p></section>' +
          '</div>' +
          '<section class="mcc-card mcc-audit-artifacts"><h3>Source files</h3>' +
          '<dl class="mcc-hash-list"><div><dt>IATA boundaries SHA-256</dt><dd><code>' + esc(data.source.boundarySha256) + '</code></dd></div></dl>' +
          '<div class="mcc-detail-actions">' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(new URL("meshmapper-iata-boundaries.geojson", assetBase).href) + '" download>Download MeshMapper boundaries</a>' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(new URL("iata-boundaries.geojson", assetBase).href) + '" download>Download IATA boundaries</a>' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(new URL("iata-regions.json", assetBase).href) + '" download>Download catalog</a>' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(regionPageHref("guide")) + '">How repeaters work</a>' +
          '</div></section>';
        auditLoaded = true;
    }

    function loadAudit() {
      if (auditLoaded) return;
      els.auditStatus.textContent = "Loading release evidence…";
      renderAudit();
    }

    function renderRegionBrowser(tag, fitSelection) {
      if (!data.hierarchy[tag]) tag = data.meta.rootTag || "can";
      state.browseTag = tag;
      var path = ancestryFor(data, tag, state.jurisdictionTag);
      els.breadcrumbs.innerHTML = path.map(function (item, index) {
        var current = index === path.length - 1;
        return '<button type="button" class="mcc-region-crumb' + (current ? ' is-current' : '') + '" data-region-node="' + esc(item) + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(labelFor(data, item)) + '</button>';
      }).join('<span aria-hidden="true">›</span>');
      var children = childrenFor(data, tag);
      els.children.innerHTML = children.length ? children.map(function (child) {
        var nested = Boolean(data.policy.provinces[child]) || childrenFor(data, child).length > 0;
        var leafCount = leafDescendants(data, child).length;
        return '<button type="button" class="mcc-region-child" data-region-node="' + esc(child) + '">' +
          '<span><strong>' + esc(labelFor(data, child)) + '</strong><small>' +
          (nested ? leafCount + ' zones' : child.toUpperCase() + ' · zone') +
          '</small></span><span aria-hidden="true">' + (nested ? '›' : '✓') + '</span></button>';
      }).join("") : '<p class="mcc-help">' + (data.policy.provinces[tag] ? 'No MeshMapper zones are published here yet.' : 'Select this city zone to see its scope options.') + '</p>';
      if (!map || !browseLayer) return;
      browseLayer.clearLayers();
      if (tag !== (data.meta.rootTag || "can") && data.partitionByTag) {
        browseLayer.addData(featuresForNode(data, tag));
        browseLayer.bringToFront();
        if (selectedLayer) selectedLayer.bringToFront();
        if (fitSelection && browseLayer.getBounds().isValid()) {
          map.fitBounds(browseLayer.getBounds(), { padding: [28, 28], maxZoom: children.length ? 6 : 8 });
        }
      } else if (fitSelection) {
        map.fitBounds(data.meta.map.bounds || [[41.5, -141.5], [83.5, -52]], { padding: [24, 24], maxZoom: 4 });
      }
    }

    function updateMapVisuals(recenter) {
      if (!map || !selectedLayer) return;
      selectedLayer.clearLayers();
      if (state.canGenerate) {
        var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths, state.activation);
        if (data.partitionByTag) {
          var selectedTags = rec ? rec.leaves : [state.resolution.primary.seed.tag];
          selectedLayer.addData({
            type: "FeatureCollection",
            features: data.partitionRegions.features.filter(function (feature) { return selectedTags.indexOf(feature.properties.tag) !== -1; })
          });
          selectedLayer.bringToFront();
          if (recenter && selectedLayer.getBounds().isValid()) {
            map.fitBounds(selectedLayer.getBounds(), { padding: [28, 28], maxZoom: 9 });
          }
        }
        if (marker) marker.setLatLng([state.lat, state.lon]);
        else marker = window.L.marker([state.lat, state.lon]).addTo(map);
      }
    }

    function renderTextResult() {
      if (!state.canGenerate || !state.resolution) {
        els.resultSection.hidden = true;
        els.textResult.innerHTML = "";
        return;
      }
      var tag = state.resolution.primary.seed.tag;
      var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths, state.activation);
      var aliases = (data.regionAliases[tag] || []).filter(function (alias) {
        return normalizeLocationSearch(alias) !== normalizeLocationSearch(tag) &&
          normalizeLocationSearch(alias) !== normalizeLocationSearch(labelFor(data, tag));
      });
      aliases = aliases.filter(function (alias, index) {
        return aliases.findIndex(function (item) { return normalizeLocationSearch(item) === normalizeLocationSearch(alias); }) === index;
      });
      var communityUrl = new URL("../provinces/", regionPageHref("config"));
      communityUrl.searchParams.set("region", tag);
      els.resultSection.hidden = false;
      els.textResult.innerHTML =
        '<p class="mcc-deterministic-result"><strong>' + esc(state.name) + '</strong> resolves to <strong>' +
        esc(labelFor(data, tag)) + '</strong> (<code>' + esc(tag) + '</code>).</p>' +
        '<p class="mcc-region-path">' + esc(data.hierarchy[tag].provinces.map(function (province) { return labelFor(data, province); }).join(" / ")) + '</p>' +
        (state.resolution.sourceTier === "meshcore-canada"
          ? planningNotice(state.resolution)
          : '<p>These are published MeshMapper zones, not radio coverage or scope-enforcement boundaries.</p><p><a href="' + esc(seedForTag(data, tag).sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open this zone in MeshMapper</a></p>') +
        (window.MeshCoreRegionProfile ? window.MeshCoreRegionProfile.render(data, tag, state.jurisdictionTag, new URL("../", regionPageHref("config")), state.resolution) : '') +
        '<p><a href="' + esc(communityUrl.href) + '">Find a community</a></p>' +
        '<details><summary>Region details</summary><dl class="mcc-review-list"><div><dt>Province or territory</dt><dd>' + esc(state.jurisdictionTag ? labelFor(data, state.jurisdictionTag) : "Choose the repeater province in the setup tool") + '</dd></div>' +
        '<div><dt>Status</dt><dd>' + esc(state.resolution.planningKind === "extension" ? "Planning extension" : statusLabel(statusFor(data, tag).state || "draft")) + '</dd></div>' +
        '<div><dt>Aliases</dt><dd>' + esc(aliases.length ? aliases.join(", ") : "None recorded") + '</dd></div>' +
        '<div><dt>Repeater paths</dt><dd>' + esc(rec ? rec.paths.length : 1) + '</dd></div></dl></details>' +
        '<div class="mcc-detail-actions"><a class="mcc-button" href="' + esc(configHrefForState(state)) + '">Set up a repeater here</a>' +
        '<button type="button" class="mcc-button mcc-button-secondary" data-action="copy-region-link">' + icon("link") + 'Copy link</button></div>';
      var copyLink = els.textResult.querySelector("[data-action='copy-region-link']");
      if (copyLink) copyLink.addEventListener("click", function () {
        copyText(mapHrefForState(state), copyLink, "Copy link");
      });
    }

    function finishGeo(geo, forcedTag, recenter, requestId) {
      if (requestId !== locationRequestId) return;
      state.lat = Number(geo.lat);
      state.lon = Number(geo.lon);
      state.name = geo.name || (state.lat.toFixed(4) + ", " + state.lon.toFixed(4));
      state.forcedTag = forcedTag || geo.tag || null;
      state.manualSelection = geo.source === "region";
      state.jurisdictionTag = geo.provinceTag || jurisdictionTagFromGeo(geo);
      if (!isCanada(geo)) {
        state.canGenerate = false;
        state.resolution = null;
        setStatus(els.status, "This location is outside Canada.", "warning");
        renderTextResult();
        return;
      }
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag, state.manualSelection);
      state.jurisdictionTag = state.resolution.province;
      state.canGenerate = state.resolution.hasMatch;
      state.detailTag = state.canGenerate ? state.resolution.primary.seed.tag : null;
      if (!state.canGenerate) {
        setStatus(els.status, state.resolution.matches.length > 1
          ? "More than one MeshMapper zone contains this point. Select your community's zone on the map."
          : state.resolution.matches.length
            ? "The saved zone differs from this location. Choose the current IATA region."
            : "No IATA region contains this point. Browse the region list or check with your community.", "warning");
      } else {
        setStatus(els.status, "Region found.", "info");
        renderRegionBrowser(state.detailTag, false);
      }
      renderTextResult();
      updateMapVisuals(recenter);
    }

    function useGeo(geo, recenter, forcedTag) {
      var requestId = ++locationRequestId;
      state.canGenerate = false;
      renderTextResult();
      setStatus(els.status, "Checking the Canadian region data…", "info");
      return ensureResolverData(data).then(function () {
        finishGeo(geo, forcedTag, recenter, requestId);
      }).catch(function (error) {
        if (requestId !== locationRequestId) return;
        setStatus(els.status, esc(error.message || "Unable to load the Canadian location data."), "error");
      });
    }

    function chooseRegionNode(tag) {
      var children = childrenFor(data, tag);
      var province = data.policy.provinces[state.browseTag] ? state.browseTag : null;
      renderRegionBrowser(tag, true);
      if (!children.length) {
        var seed = seedForTag(data, tag);
        if (seed) useGeo({ lat: seed.lat, lon: seed.lon, name: labelFor(data, tag), countryCode: "ca", tag: tag, source: "region", provinceTag: province }, true, tag);
      }
    }

    function locate() {
      var query = els.input.value.trim();
      if (!query) {
        setStatus(els.status, "Enter a city, airport code, postal code, or region name.", "error");
        return;
      }
      if (activeGeocodeController) activeGeocodeController.abort();
      activeGeocodeController = typeof AbortController !== "undefined" ? new AbortController() : null;
      var thisController = activeGeocodeController;
      els.locate.disabled = true;
      els.locate.textContent = "Finding";
      geocode(data, query, thisController && thisController.signal)
        .then(function (geo) { return useGeo(geo, true, geo.tag); })
        .catch(function (error) {
          if (error && error.name === "AbortError") return;
          state.canGenerate = false;
          renderTextResult();
          setStatus(els.status, esc(error.message || "Location lookup failed"), "error");
          showLocationChoices(els.status, error.choices, function (geo) { return useGeo(geo, true, geo.tag); });
        }).finally(function () {
          if (activeGeocodeController !== thisController) return;
          els.locate.disabled = false;
          els.locate.innerHTML = icon("search") + "Find";
        });
    }

    function useCoordinates() {
      var coordinates = configuratorSupport.parseCoordinates
        ? configuratorSupport.parseCoordinates(els.latitude.value, els.longitude.value)
        : null;
      if (!coordinates) {
        setStatus(els.status, "Enter a latitude from -90 to 90 and a longitude from -180 to 180.", "error");
        return;
      }
      useGeo({
        lat: coordinates.lat,
        lon: coordinates.lon,
        name: coordinates.lat.toFixed(4) + ", " + coordinates.lon.toFixed(4),
        countryCode: "ca"
      }, true, null);
    }

    function loadInteractiveMap() {
      if (map || mapIsLoading) return;
      mapIsLoading = true;
      els.loadMap.hidden = true;
      els.mapStage.setAttribute("aria-busy", "true");
      els.boundaryStatus.hidden = false;
      els.mapLoadStatus.textContent = "Loading Canadian boundaries and map tools…";
      els.mapReadyStatus.textContent = "Loading the interactive region map.";
      loadLeaflet().then(function (L) {
        L.Icon.Default.imagePath = new URL("vendor/leaflet/images/", assetBase).href;
        els.mapArea.hidden = false;
        map = L.map(els.canvas, { minZoom: 1, maxZoom: 13 });
        var loadingMap = map;
        activeMaps.push({ container: el, map: map });
        var initialRec = state.canGenerate && recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths, state.activation);
        var initialFeatures = initialRec && data.partitionRegions
          ? data.partitionRegions.features.filter(function (feature) { return initialRec.leaves.indexOf(feature.properties.tag) !== -1; }) : [];
        var initialBounds = initialFeatures.length ? L.geoJSON(initialFeatures).getBounds() : null;
        map.fitBounds(initialBounds && initialBounds.isValid() ? initialBounds : data.meta.map.bounds || [[41.5, -141.5], [83.5, -52]],
          { padding: [28, 28], maxZoom: initialFeatures.length ? 9 : 4, animate: false });
        var tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);
        browseLayer = L.geoJSON(null, { interactive: false, style: function (feature) {
          return { color: "#ffd166", opacity: 1, weight: 3, fillOpacity: 0, dashArray: feature.properties.regionSource === "meshcore-canada" ? "8 5" : null };
        } }).addTo(map);
        selectedLayer = L.geoJSON(null, { interactive: false, style: function (feature) {
          var planning = feature.properties.regionSource === "meshcore-canada";
          return { color: "#ffffff", opacity: 1, weight: 4, dashArray: planning ? "8 5" : null, fillColor: "#4287ff", fillOpacity: 0.3 };
        } }).addTo(map);
        updateMapVisuals(false);
        // Paint tiles first; the much larger boundary overlay can arrive independently.
        var boundariesReady = loadDisplayPartition(data).then(function (partition) {
          if (map !== loadingMap) return;
          applyGeneratedPartition(data, partition, null);
          L.geoJSON(data.partitionRegions, {
            bubblingMouseEvents: false,
            style: function (feature) {
              var starter = feature.properties.regionSource === "meshcore-canada";
              return { color: starter ? "#ffd166" : "#aeb8ff", opacity: 0.8, weight: starter ? 2 : 1,
                dashArray: starter ? "6 4" : null, fillColor: colorForTag(feature.properties.tag), fillOpacity: 0.2 };
            },
            onEachFeature: function (feature, layer) {
              var label = (frenchRuntime && feature.properties.nameFr) || feature.properties.label || feature.properties.name || feature.properties.tag.toUpperCase();
              layer.bindTooltip('<strong>' + esc(feature.properties.tag.toUpperCase()) + '</strong> - ' + esc(label) + (feature.properties.regionSource === "meshcore-canada" ? '<br>' + (frenchRuntime ? 'Planification MeshCore Canada' : 'MeshCore Canada planning') : ''));
              layer.on("click", function (event) {
                if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
                useGeo({ lat: event.latlng.lat, lon: event.latlng.lng, name: label, countryCode: "ca", tag: feature.properties.tag }, false, feature.properties.tag);
              });
            }
          }).addTo(map);
          renderRegionBrowser(state.browseTag, false);
          updateMapVisuals(false);
        });
        map.on("click", function (event) {
          useGeo({
            lat: event.latlng.lat,
            lon: event.latlng.lng,
            name: event.latlng.lat.toFixed(4) + ", " + event.latlng.lng.toFixed(4),
            countryCode: "ca"
          }, false, null);
        });
        window.setTimeout(function () { if (map === loadingMap) map.invalidateSize(); }, 0);
        var tilesReady = new Promise(function (resolve, reject) {
          var settled = false;
          var timeout = window.setTimeout(function () {
            if (settled) return;
            settled = true;
            reject(new Error("OpenStreetMap tiles did not load. Search and the region list still work."));
          }, 10000);
          tileLayer.once("tileload", function () {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            if (map === loadingMap) els.mapLoading.hidden = true;
            resolve();
          });
          tileLayer.once("load", function () {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            reject(new Error("OpenStreetMap tiles could not load. Search and the region list still work."));
          });
        });
        return Promise.all([tilesReady, boundariesReady]);
      }).then(function () {
        els.mapLoading.hidden = true;
        els.boundaryStatus.hidden = true;
        els.mapLoadStatus.textContent = "";
        els.mapStage.setAttribute("aria-busy", "false");
        els.mapReadyStatus.textContent = "Interactive region map loaded.";
        mapIsLoading = false;
      }).catch(function (error) {
        if (map) {
          var failedMap = map;
          try { map.remove(); } catch (cleanupError) { /* Leaflet may have failed during setup. */ }
          activeMaps = activeMaps.filter(function (entry) { return entry.map !== failedMap; });
          map = null;
          marker = null;
          browseLayer = null;
          selectedLayer = null;
        }
        els.mapArea.hidden = true;
        els.mapLoading.hidden = false;
        els.boundaryStatus.hidden = true;
        els.loadMap.hidden = false;
        mapIsLoading = false;
        els.mapLoadStatus.textContent = error.message || "The map could not load. Search and the region list still work.";
        els.mapStage.setAttribute("aria-busy", "false");
        els.mapReadyStatus.textContent = els.mapLoadStatus.textContent;
      });
    }

    el.querySelectorAll("[data-map-mode]").forEach(function (button) {
      button.addEventListener("click", function () { setMapMode(button.getAttribute("data-map-mode")); });
    });
    els.breadcrumbs.addEventListener("click", function (event) {
      var button = event.target.closest("[data-region-node]");
      if (button) chooseRegionNode(button.getAttribute("data-region-node"));
    });
    els.children.addEventListener("click", function (event) {
      var button = event.target.closest("[data-region-node]");
      if (button) chooseRegionNode(button.getAttribute("data-region-node"));
    });
    els.locate.addEventListener("click", locate);
    els.input.addEventListener("keydown", function (event) { if (event.key === "Enter") locate(); });
    els.coordinates.addEventListener("click", useCoordinates);
    els.loadMap.addEventListener("click", loadInteractiveMap);
    renderRegionBrowser(state.browseTag, false);
    var regionList = el.querySelector("#mcc-region-list");
    function ensureRegionTable() {
      if (!els.table.firstChild) renderRegionTable(els.table, data);
    }
    regionList.addEventListener("toggle", function () {
      if (regionList.open) ensureRegionTable();
    });
    el.querySelector(".mcc-skip-map").addEventListener("click", function () {
      regionList.open = true;
      ensureRegionTable();
    });
    function observeInteractiveMap() {
      // Text lookup is useful on its own; download the display layer only when it is visible.
      if ("IntersectionObserver" in window) {
        var mapObserver = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) {
            mapObserver.disconnect();
            loadInteractiveMap();
          }
        });
        mapObserver.observe(els.mapStage);
      } else {
        window.setTimeout(loadInteractiveMap, 0);
      }
    }

    keepLanguageSelection(state);
    // Check a carried radio choice against the validated profile list before keeping it in the map's links.
    if (radioProfiles) radioProfiles.populate(document.createElement("select")).then(function () {
      try {
        radioProfiles.commands(mapParams.get("radio"), "keep");
        state.radioProfile = mapParams.get("radio") || "keep";
      } catch (_) { state.radioProfile = "keep"; }
      renderTextResult();
    });
    if (mapParams.has("firmware")) state.firmware = ["1.14", "1.15", "1.16"].indexOf(mapParams.get("firmware")) !== -1 ? mapParams.get("firmware") : "unsupported";
    if (["repeater", "room", "advanced"].indexOf(mapParams.get("role")) !== -1) state.deviceRole = mapParams.get("role");
    if (["guided", "technical"].indexOf(mapParams.get("instructions")) !== -1) state.finishPath = mapParams.get("instructions");
    var initialGeo = initialLocation(data, mapParams);
    if (initialGeo) {
      els.input.value = initialGeo.name;
      // Text lookup and visible map tiles must not wait on each other's data.
      useGeo(initialGeo, true, initialGeo.tag);
      observeInteractiveMap();
    } else {
      if (mapParams.has("tag") || mapParams.has("lat") || mapParams.has("lon")) {
        setStatus(els.status, "This saved location is invalid or no longer available. Choose a region again.", "warning");
      }
      observeInteractiveMap();
    }
    setMapMode(mapParams.get("view") === "audit" ? "audit" : "explore");
  }

  function regionRows(data) {
    return (data.consolidatedRegionTags || Object.keys(data.hierarchy)).map(function (tag) {
      var item = data.hierarchy[tag];
      var st = statusFor(data, tag);
      var seed = seedForTag(data, tag);
      var hasGeneratedBoundary = Boolean(seed);
      return {
        tag: tag,
        label: labelFor(data, tag),
        parent: item.parent || "",
        ancestry: ancestryText(data, tag),
        province: provinceTagFor(data, tag),
        provinces: item.provinces || [],
        state: st.state || "draft",
        statusLabel: statusLabel(st.state || "draft"),
        source: st.source || "",
        reviewer: st.reviewer || "",
        seed: seedText(seed),
        sourceTier: seed.regionSource,
        boundaryType: seed.regionSource === "meshmapper" ? "meshmapper-zone" : "starter-region",
        planningExtension: st.planningExtension === true,
        sourceUrl: sourceUrlFor(data, tag),
        basis: st.basis || item.basis || "proposed"
      };
    });
  }

  function renderRegionTable(el, data) {
    var provinces = provinceOptions(data);
    el.innerHTML =
      '<div class="mcc-table-console">' +
      '<div class="mcc-table-controls">' +
      '<label class="mcc-search-field">' + icon("search") + '<input class="mcc-input mcc-table-filter" data-role="table-filter" type="search" placeholder="Search regions" aria-label="Search regions"></label>' +
      '<select class="mcc-select" data-role="table-province" aria-label="Filter by area">' +
      '<option value="">All areas</option>' +
      provinces.map(function (tag) {
        return '<option value="' + esc(tag) + '">' + esc(labelFor(data, tag)) + '</option>';
      }).join("") +
      '</select>' +
      '<span class="mcc-table-count" data-role="table-count" role="status" aria-live="polite"></span>' +
      '</div>' +
      '<div class="mcc-table-layout">' +
      '<div class="mcc-region-table-wrap" role="region" aria-label="Region directory table" tabindex="0"><table class="mcc-region-table"><thead><tr><th scope="col">City zone</th><th scope="col">Province or territory</th><th scope="col">Source</th></tr></thead><tbody></tbody></table></div>' +
      '</div>' +
      '</div>';
    var input = el.querySelector("[data-role='table-filter']");
    var province = el.querySelector("[data-role='table-province']");
    var count = el.querySelector("[data-role='table-count']");
    var body = el.querySelector("tbody");
    var rows = regionRows(data);

    function draw() {
      var filter = slug(input.value);
      var provinceFilter = province.value;
      var shown = rows.filter(function (row) {
        var haystack = slug([row.tag, row.label, row.parent, row.ancestry].join(" "));
        if (filter && haystack.indexOf(filter) === -1) return false;
        if (provinceFilter && row.provinces.indexOf(provinceFilter) === -1) return false;
        return true;
      });
      count.textContent = shown.length === rows.length ? rows.length + " regions" : shown.length + " of " + rows.length + " regions";
      body.innerHTML = shown.map(function (row) {
        return "<tr>" +
          '<td><code>' + esc(row.tag) + "</code> " + esc(row.label) + "</td>" +
          "<td>" + esc(row.provinces.map(function (province) { return labelFor(data, province); }).join(" / ")) + "</td>" +
          '<td><a href="' + esc(row.sourceUrl) + '">' + esc(row.sourceTier === "meshmapper" ? "MeshMapper" : "MeshCore Canada starter region") + '</a>' +
          (row.planningExtension ? '<br><a href="' + esc(regionPageHref("guide") + '#planning-extensions') + '">Planning extension</a>' : '') + '</td>' +
          "</tr>";
      }).join("");
    }
    input.addEventListener("input", draw);
    province.addEventListener("change", draw);
    draw();
  }

  function renderDashboard(el, data) {
    el.innerHTML =
      '<div class="mcc-dashboard">' +
      '<section class="mcc-console-header mcc-dashboard-header">' +
      '<h2>Canadian regions</h2>' +
      '<div class="mcc-dashboard-actions">' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("config")) + '">' + icon("list-checks") + '<span><strong>Setup</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("map")) + '">' + icon("map") + '<span><strong>Map</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("guide")) + '">' + icon("book-open-check") + '<span><strong>How repeaters work</strong></span></a>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-stat-grid" aria-label="Region status summary">' +
      '<div class="mcc-stat"><span>Regions</span><strong>' + data.regionCounts.total + '</strong></div>' +
      '<div class="mcc-stat"><span>Local regions</span><strong>' + data.regionCounts.meshmapper + '</strong></div>' +
      '<div class="mcc-stat"><span>Provinces &amp; territories</span><strong>' + provinceOptions(data).length + '</strong></div>' +
      '</section>' +
      '<section class="mcc-card mcc-dashboard-table">' +
      '<div class="mcc-section-head"><div><h2>Regions</h2></div></div>' +
      '<div data-role="dashboard-table"></div>' +
      '</section>' +
      '</div>';
    renderRegionTable(el.querySelector("[data-role='dashboard-table']"), data);
  }

  function initRegions() {
    frenchRuntime = /^fr(?:-|$)/i.test(document.documentElement.lang || "");
    activeMaps = activeMaps.filter(function (entry) {
      if (entry.container.isConnected) return true;
      try { entry.map.remove(); } catch (error) { /* The old document is already gone. */ }
      return false;
    });
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-mcc-regions]"));
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      if (!node.isConnected || node.dataset.mccReady === "1" || node.dataset.mccLoading === "1") return;
      var mode = node.getAttribute("data-mcc-regions");
      node.dataset.mccLoading = "1";
      enableRuntimeLocalization(node);
      node.innerHTML = '<div class="mcc-status mcc-status-info" role="status">Loading Canadian regions…</div>';
      loadCatalog().then(function (data) {
        if (!node.isConnected) return;
        delete node.dataset.mccLoading;
        node.dataset.mccReady = "1";
        if (mode === "map") initMap(node, data);
        if (mode === "dashboard") renderDashboard(node, data);
        if (mode === "table") renderRegionTable(node, data);
      }).catch(function (err) {
        if (!node.isConnected) return;
        delete node.dataset.mccLoading;
        delete node.dataset.mccReady;
        node.innerHTML = '<div class="mcc-status mcc-status-error" role="alert"><p>' + esc(err.message) + '</p><button type="button" class="mcc-button mcc-button-secondary" data-action="retry-regions">Try again</button></div>';
        var retry = node.querySelector("[data-action='retry-regions']");
        if (retry) retry.addEventListener("click", initRegions, { once: true });
      });
    });
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(initRegions);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegions);
  } else {
    initRegions();
  }
}());
