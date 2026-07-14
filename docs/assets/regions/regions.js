(function () {
  "use strict";

  var scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("/assets/regions/regions.js", window.location.origin).href;
  var assetBase = new URL(".", scriptUrl);
  var dataPromise = null;
  var leafletPromise = null;
  var lucidePromise = null;
  var activeMaps = [];
  var LUCIDE_SRC = "https://unpkg.com/lucide@0.547.0/dist/umd/lucide.js";

  function loadData() {
    if (!dataPromise) {
      dataPromise = Promise.all([
        fetch(new URL("canada-regions.json", assetBase)),
        fetch(new URL("meshmapper-canada-regions.json", assetBase))
      ]).then(function (responses) {
        if (!responses[0].ok) throw new Error("Unable to load MeshCore Canada region data");
        if (!responses[1].ok) throw new Error("Unable to load MeshMapper Canada boundaries");
        return Promise.all([responses[0].json(), responses[1].json()]);
      }).then(function (loaded) {
        return applyMeshMapperRegions(loaded[0], loaded[1]);
      }).catch(function (error) {
        dataPromise = null;
        throw error;
      });
    }
    return dataPromise;
  }

  function applyMeshMapperRegions(data, collection) {
    if (!collection || !Array.isArray(collection.features) || collection.features.length !== 29) {
      throw new Error("MeshMapper Canada boundary data is invalid");
    }
    var suppliedAliases = data.aliases || {};
    var previousAliases = data.regionAliases || {};
    var tagMap = data.meshMapperTagMap || {};
    var strategySeeds = (data.seeds || []).map(function (seed) {
      return Object.assign({}, seed, {
        tag: slug(seed.tag),
        sourceTier: "strategy",
        boundaryType: "approximate"
      });
    });
    var strategyTagSet = {};
    strategySeeds.forEach(function (seed) { strategyTagSet[seed.tag] = true; });
    var previousMetroGroups = (data.metroGroups || []).map(function (group) {
      return { label: group.label, tags: group.tags.slice() };
    });
    data.regionAliases = {};
    Object.keys(data.hierarchy || {}).forEach(function (tag) {
      data.regionAliases[tag] = unique([tag, data.hierarchy[tag].label]
        .concat(suppliedAliases[tag] || [])
        .concat(previousAliases[tag] || [])
        .filter(Boolean));
    });
    data.meshMapperSources = {};

    function mappedTagFor(rawTag, rawCode) {
      var mapped = tagMap[rawTag] || tagMap[rawCode];
      if (mapped && typeof mapped === "object") mapped = mapped.tag || mapped.canonicalTag;
      var canonicalTag = slug(mapped || rawTag);
      if (!data.hierarchy[canonicalTag] || !strategyTagSet[canonicalTag]) {
        throw new Error("MeshMapper region " + (rawCode || rawTag || "unknown") + " has no strategy mapping");
      }
      return canonicalTag;
    }

    var normalizedFeatures = collection.features.map(function (feature) {
      var props = feature.properties || {};
      var rawTag = slug(props.tag || props.code);
      var rawCode = slug(props.code || props.tag);
      var tag = mappedTagFor(rawTag, rawCode);
      var center = props.center || [0, 0];
      data.regionAliases[tag] = unique((data.regionAliases[tag] || []).concat([
        tag,
        rawTag,
        rawCode,
        props.code,
        props.name
      ].filter(Boolean)));
      data.meshMapperSources[tag] = (data.meshMapperSources[tag] || []).concat([{
        rawTag: rawTag,
        rawCode: rawCode,
        sourceTag: props.tag || props.code || "",
        sourceCode: props.code || props.tag || "",
        name: props.name || "",
        source: "MeshMapper Canada boundary snapshot " + collection.version,
        sourceUrl: props.sourceUrl || (collection.source && collection.source.url) || ""
      }]);
      var normalizedFeature = Object.assign({}, feature, {
        properties: Object.assign({}, props, {
          tag: tag,
          canonicalTag: tag,
          rawTag: rawTag,
          rawCode: rawCode,
          sourceTag: props.tag || props.code || "",
          sourceCode: props.code || props.tag || ""
        })
      });
      normalizedFeature.meshMapperSeed = {
        tag: tag,
        lat: Number(center[1]),
        lon: Number(center[0]),
        r: Number(props.radiusKm) || 0,
        resolve: true,
        meshMapperFeature: normalizedFeature,
        sourceTier: "meshmapper",
        boundaryType: "exact"
      };
      return normalizedFeature;
    });
    var meshMapperSeeds = normalizedFeatures.map(function (feature) {
      return feature.meshMapperSeed;
    });
    normalizedFeatures.forEach(function (feature) {
      delete feature.meshMapperSeed;
    });
    data.meshMapperRegions = Object.assign({}, collection, { features: normalizedFeatures });
    data.meshMapperTags = unique(meshMapperSeeds.map(function (seed) { return seed.tag; }));
    data.meshMapperSeeds = meshMapperSeeds;
    data.strategySeeds = strategySeeds;
    data.strategyFallbackSeeds = strategySeeds.filter(function (seed) { return seed.resolve !== false; });
    // Retained as an internal compatibility alias for the existing map renderer.
    data.communityExtraSeeds = data.strategyFallbackSeeds;
    data.seeds = strategySeeds;
    data.consolidatedRegionTags = unique(strategySeeds.map(function (seed) { return seed.tag; }));
    data.regionCounts = {
      total: data.consolidatedRegionTags.length,
      meshMapper: normalizedFeatures.length,
      strategy: data.consolidatedRegionTags.length
    };

    var groupForProvince = {
      bc: "British Columbia", ab: "Alberta", sk: "Prairies", mb: "Prairies",
      on: "Ontario", qc: "Quebec", nb: "Atlantic Canada", ns: "Atlantic Canada",
      pe: "Atlantic Canada", nl: "Atlantic Canada", yt: "Territories", nt: "Territories", nu: "Territories"
    };
    meshMapperSeeds.forEach(function (seed) {
      var alreadyGrouped = previousMetroGroups.some(function (group) { return group.tags.indexOf(seed.tag) !== -1; });
      if (alreadyGrouped) return;
      var parent = parentFor(data, seed.tag);
      var label = groupForProvince[parent] || labelFor(data, parent || data.meta.rootTag);
      var group = previousMetroGroups.find(function (entry) { return entry.label === label; });
      if (!group) {
        group = { label: label, tags: [] };
        previousMetroGroups.push(group);
      }
      group.tags.push(seed.tag);
    });
    data.metroGroups = previousMetroGroups;
    return data;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function icon(name) {
    return '<i class="mcc-icon" data-lucide="' + esc(name) + '" aria-hidden="true"></i>';
  }

  function loadLucide() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      return Promise.resolve(window.lucide);
    }
    if (lucidePromise) return lucidePromise;
    lucidePromise = new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = LUCIDE_SRC;
      script.defer = true;
      script.onload = function () { resolve(window.lucide || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
    return lucidePromise;
  }

  function refreshIcons(root) {
    loadLucide().then(function (lucide) {
      if (!lucide || typeof lucide.createIcons !== "function") return;
      try {
        lucide.createIcons({
          attrs: {
            "stroke-width": 2,
            "aria-hidden": "true"
          }
        });
      } catch (err) {
        // Icons are progressive enhancement; text labels remain usable.
      }
    });
  }

  function copyText(text, button, resetLabel) {
    var feedback = function (copied) {
      if (!button) return;
      var originalHtml = button.dataset.originalHtml || button.innerHTML || resetLabel || "Copy";
      button.dataset.originalHtml = originalHtml;
      button.classList.toggle("is-copied", copied);
      button.innerHTML = copied ? "Copied" : "Copy failed";
      window.setTimeout(function () {
        button.classList.remove("is-copied");
        button.innerHTML = button.dataset.originalHtml || resetLabel || "Copy";
        refreshIcons(button);
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
    return (data.status && data.status[tag]) || {
      state: "draft",
      reviewer: "Unreviewed",
      source: "Canada MeshCore Region Strategy draft v1.1.1"
    };
  }

  function statusLabel(state) {
    if (state === "draft") return "Needs review";
    if (state === "proposal") return "Draft";
    if (state === "reviewed") return "Reviewed";
    if (state === "active") return "Active";
    if (state === "deprecated") return "Deprecated";
    return state || "Needs review";
  }

  function statusBadge(data, tag) {
    var state = statusFor(data, tag).state || "draft";
    return '<span class="mcc-badge mcc-badge-' + esc(state) + '">' + esc(statusLabel(state)) + "</span>";
  }

  function labelFor(data, tag) {
    return data.hierarchy[tag] ? data.hierarchy[tag].label : tag;
  }

  function parentFor(data, tag) {
    return data.hierarchy[tag] ? data.hierarchy[tag].parent : null;
  }

  function ancestryFor(data, tag) {
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

  function seedText(seed) {
    return seed
      ? seed.lat.toFixed(4) + ", " + seed.lon.toFixed(4) + " / r " + (seed.r || 0) + " km"
      : "No seed";
  }

  function statusCounts(data) {
    var counts = {
      reviewed: 0,
      active: 0,
      draft: 0,
      deprecated: 0,
      total: 0,
      seeded: data.seeds.length
    };
    (data.consolidatedRegionTags || data.meshMapperTags || Object.keys(data.hierarchy)).forEach(function (tag) {
      var state = statusFor(data, tag).state || "draft";
      counts.total += 1;
      counts[state] = (counts[state] || 0) + 1;
    });
    return counts;
  }

  function provinceOptions(data) {
    var regionTags = data.consolidatedRegionTags || data.meshMapperTags;
    var tags = regionTags ? unique(regionTags.map(function (tag) {
      return provinceTagFor(data, tag);
    }).filter(Boolean)) : Object.keys(data.hierarchy).filter(function (tag) {
      return parentFor(data, tag) === data.meta.rootTag;
    });
    return tags.sort(function (a, b) {
      return labelFor(data, a).localeCompare(labelFor(data, b));
    });
  }

  function regionPageHref(page) {
    var host = document.querySelector("[data-mcc-regions][data-mcc-root]");
    if (!host && window.location.pathname.indexOf(".html") !== -1) {
      return (page === "config" ? "config" : page) + ".html";
    }
    var routes = { dashboard: "", config: "setup/", setup: "setup/", map: "map/" };
    var root = host ? host.getAttribute("data-mcc-root") : "./";
    return new URL(routes[page] || "", new URL(root, document.baseURI)).href;
  }

  function mapHrefForState(state) {
    var params = new URLSearchParams();
    if (Number.isFinite(state.lat)) params.set("lat", state.lat.toFixed(6));
    if (Number.isFinite(state.lon)) params.set("lon", state.lon.toFixed(6));
    if (state.name) params.set("name", state.name);
    if (state.resolution && state.resolution.primary) {
      params.set("tag", state.forcedTag || state.resolution.primary.seed.tag);
    }
    return regionPageHref("map") + (params.toString() ? "?" + params.toString() : "");
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

  function rankSeeds(data, lat, lon) {
    return data.seeds.filter(function (seed) {
      return seed.resolve !== false;
    }).map(function (seed) {
      var km = haversineKm(lat, lon, seed.lat, seed.lon);
      return {
        seed: seed,
        km: km,
        score: km - (seed.r || 0),
        ancestry: ancestryFor(data, seed.tag)
      };
    }).sort(function (a, b) {
      return a.score - b.score;
    });
  }

  function rankSeedPool(seeds, lat, lon) {
    return seeds.map(function (seed) {
      var km = haversineKm(lat, lon, seed.lat, seed.lon);
      return {
        seed: seed,
        km: km,
        score: km - (seed.r || 0)
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

  function boundaryFeatureAt(data, lat, lon, forcedTag) {
    var features = data.meshMapperRegions && data.meshMapperRegions.features || [];
    function distanceFromCenter(feature) {
      var center = feature.properties && feature.properties.center || [0, 0];
      return haversineKm(lat, lon, Number(center[1]), Number(center[0]));
    }
    function nearest(featuresAtPoint) {
      return featuresAtPoint.sort(function (a, b) {
        return distanceFromCenter(a) - distanceFromCenter(b);
      })[0] || null;
    }
    if (forcedTag) {
      var forced = nearest(features.filter(function (feature) {
        return String(feature.properties.tag).toLowerCase() === String(forcedTag).toLowerCase() &&
          featureContainsPoint(feature, lat, lon);
      }));
      if (forced) return forced;
      // A region chosen from the strategy layer or carried in the URL is
      // authoritative. Do not let an overlapping MeshMapper polygon replace it.
      return null;
    }
    return nearest(features.filter(function (feature) {
      return featureContainsPoint(feature, lat, lon);
    }));
  }

  function strategyFallbackAt(data, lat, lon, forcedTag) {
    var seeds = data.strategyFallbackSeeds || data.communityExtraSeeds || [];
    function rankedEntry(seed) {
      var km = haversineKm(lat, lon, seed.lat, seed.lon);
      return { seed: seed, km: km, score: km - (seed.r || 0), ancestry: ancestryFor(data, seed.tag) };
    }
    function withinCoverage(entry) {
      var radius = Number(entry.seed.r) || 0;
      var limit = Math.max(35, Math.min(205, radius * 1.35));
      return entry.km <= limit;
    }
    if (forcedTag) {
      var forcedSeed = seeds.find(function (seed) { return seed.tag === String(forcedTag).toLowerCase(); });
      if (forcedSeed) {
        var forcedEntry = rankedEntry(forcedSeed);
        if (withinCoverage(forcedEntry)) return forcedEntry;
      }
    }
    var ranked = seeds.map(rankedEntry).sort(function (a, b) { return a.score - b.score; });
    return ranked[0] && withinCoverage(ranked[0]) ? ranked[0] : null;
  }

  function resolveLocation(data, lat, lon, forcedTag) {
    var ranked = rankSeeds(data, lat, lon);
    var boundary = boundaryFeatureAt(data, lat, lon, forcedTag);
    var boundaryTag = boundary ? String(boundary.properties.tag).toLowerCase() : null;
    var primary = boundaryTag
      ? ranked.find(function (entry) { return entry.seed.tag === boundaryTag; }) || null
      : null;
    if (!primary) primary = strategyFallbackAt(data, lat, lon, forcedTag);
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
      insideBoundary: Boolean(boundary),
      hasMatch: Boolean(primary),
      sourceTier: boundary ? "meshmapper" : primary ? "strategy" : null,
      coverageKm: primary ? Math.max(35, Math.min(205, (Number(primary.seed.r) || 0) * 1.35)) : 0
    };
  }

  function recommend(data, resolution, type, selectedMetros) {
    if (!resolution || !resolution.primary) return null;
    var primaryTag = resolution.primary.seed.tag;
    var carryTags = type === "high-site" && selectedMetros && selectedMetros.length
      ? selectedMetros
      : [primaryTag];
    var tags = [];
    var parentOverrides = {};
    var notes = [];

    if (resolution.sourceTier === "strategy") {
      notes.push("Approximate area.");
    }

    carryTags.forEach(function (tag) {
      tags = tags.concat(ancestryFor(data, tag));
    });
    tags = unique(tags);

    carryTags.forEach(function (tag) {
      var profile = data.profiles && data.profiles[tag];
      var additions = profile && profile.additionalTags || [];
      additions.forEach(function (entry) {
        var additionalTag = slug(typeof entry === "string" ? entry : entry && entry.tag);
        var additionalParent = slug(entry && typeof entry === "object" && entry.parent || "");
        if (!additionalTag || !data.hierarchy[additionalTag]) return;
        if (tags.indexOf(additionalTag) === -1) tags.push(additionalTag);
        if (additionalParent) parentOverrides[additionalTag] = additionalParent;
      });
    });

    var reviewTags = tags.filter(function (tag) {
      var state = statusFor(data, tag).state;
      return state === "draft";
    });
    var deprecatedTags = tags.filter(function (tag) {
      return statusFor(data, tag).state === "deprecated";
    });
    if (reviewTags.length) {
      notes.push("Check locally before using: " + reviewTags.join(", ") + ".");
    }
    if (deprecatedTags.length) {
      notes.push("Do not use: " + deprecatedTags.join(", ") + ".");
    }

    var budget = regionBudget(tags);
    if (budget.tagCount > 32) {
      notes.push("Too many regions: " + budget.tagCount + " tags exceeds the 32-tag limit.");
    }
    if (budget.responseBytes > 172) {
      notes.push("Region names use " + budget.responseBytes + " bytes, above the 172-byte response limit.");
    }

    return {
      tags: tags,
      parentOverrides: parentOverrides,
      budget: budget,
      notes: notes
    };
  }

  function utf8Bytes(value) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(String(value)).length;
    return unescape(encodeURIComponent(String(value))).length;
  }

  function regionBudget(tags) {
    return {
      tagCount: tags.length,
      // Firmware's regions response includes the terminating NUL byte.
      responseBytes: utf8Bytes(tags.join(",")) + 1
    };
  }

  function effectiveParentFor(data, tag, parentOverrides) {
    return parentOverrides && parentOverrides[tag] || parentFor(data, tag);
  }

  function regionDefTokens(data, tags, parentOverrides) {
    return tags.map(function (tag, index) {
      if (index === tags.length - 1) return tag;
      var next = tags[index + 1];
      var nextParent = effectiveParentFor(data, next, parentOverrides) || "*";
      return nextParent === tag ? tag : tag + "|" + nextParent;
    });
  }

  function buildCommands(data, tags, firmware, includeBaseline, parentOverrides) {
    var lines = [];
    if (includeBaseline) {
      lines = lines.concat(data.meta.baselineCommands || []);
    }

    if (firmware === "1.16") {
      var regionDefLine = "region def " + regionDefTokens(data, tags, parentOverrides).join(" ");
      if (regionDefLine.length <= 160) {
        lines.push(regionDefLine);
      } else {
        tags.forEach(function (tag) {
          var parent = effectiveParentFor(data, tag, parentOverrides);
          lines.push(parent ? "region put " + tag + " " + parent : "region put " + tag);
        });
      }
      lines.push("region save");
      return lines;
    }

    tags.forEach(function (tag) {
      var parent = effectiveParentFor(data, tag, parentOverrides);
      lines.push(parent ? "region put " + tag + " " + parent : "region put " + tag);
      if (firmware === "1.14") lines.push("region allowf " + tag);
    });
    lines.push("region save");
    return lines;
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

  function rgbForTag(tag) {
    var h = hueForTag(tag) / 360;
    var s = 0.55;
    var l = 0.45;
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function hue2rgb(t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return [
      Math.round(hue2rgb(h + 1 / 3) * 255),
      Math.round(hue2rgb(h) * 255),
      Math.round(hue2rgb(h - 1 / 3) * 255)
    ];
  }

  function resolverCacheKey(data, bounds, width, height, seeds, displayDepth, maxBoundaryRank, landMaskVersion) {
    var seedSignature = seeds.map(function (seed) {
      return [seed.tag, seed.lat, seed.lon, seed.r || 0, seed.resolve === false ? 0 : 1].join(":");
    }).join("|");
    return [
      "mcc-region-cells-v10",
      data.version || "unknown",
      landMaskVersion || "no-land-mask",
      width + "x" + height,
      "depth-" + displayDepth,
      "max-boundary-" + maxBoundaryRank,
      JSON.stringify(bounds),
      seedSignature
    ].join("::");
  }

  function readResolverCache(key) {
    try {
      var raw = window.localStorage && window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeResolverCache(key, payload) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch (err) {
      // Cache quota or privacy mode should never block the map.
    }
  }

  function nextFrame(fn) {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(fn);
    } else {
      window.setTimeout(fn, 0);
    }
  }

  function roundMapCoord(value) {
    return Math.round(value * 1000) / 1000;
  }

  function normalizeBounds(bounds) {
    return [
      [roundMapCoord(bounds[0][0]), roundMapCoord(bounds[0][1])],
      [roundMapCoord(bounds[1][0]), roundMapCoord(bounds[1][1])]
    ];
  }

  function quantizeOverlayBounds(bounds, step) {
    var value = step || 0.1;
    return [
      [
        Math.floor(bounds[0][0] / value) * value,
        Math.floor(bounds[0][1] / value) * value
      ],
      [
        Math.ceil(bounds[1][0] / value) * value,
        Math.ceil(bounds[1][1] / value) * value
      ]
    ];
  }

  function bboxIntersects(a, b) {
    return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
  }

  function buildViewportLandMask(landMask, bounds, width, height, mercY, yTop, yBot) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var south = bounds[0][0];
    var west = bounds[0][1];
    var north = bounds[1][0];
    var east = bounds[1][1];
    var viewportBbox = [west, south, east, north];
    var ySpan = yBot - yTop;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    landMask.polygons.forEach(function (poly) {
      if (!poly || !poly.bbox || !bboxIntersects(poly.bbox, viewportBbox)) return;
      (poly.rings || []).forEach(function (ring) {
        if (!ring || ring.length < 3) return;
        ring.forEach(function (coord, index) {
          var x = ((coord[0] - west) / (east - west)) * width;
          var y = ((mercY(coord[1]) - yTop) / ySpan) * height;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      });
    });
    try {
      ctx.fill("evenodd");
    } catch (err) {
      ctx.fill();
    }
    var alpha = ctx.getImageData(0, 0, width, height).data;
    var pixels = new Uint8Array(width * height);
    var landPixels = 0;
    for (var i = 0; i < pixels.length; i += 1) {
      if (alpha[i * 4 + 3] > 127) {
        pixels[i] = 1;
        landPixels += 1;
      }
    }
    return {
      pixels: pixels,
      landPixels: landPixels
    };
  }

  function displayTagForDepth(data, tag, displayDepth) {
    var chain = ancestryFor(data, tag);
    var index = Math.min(chain.length - 1, Math.max(0, displayDepth - 1));
    return chain[index] || tag;
  }

  function legendDepthForZoom(zoom) {
    if (zoom <= 4) return {
      depth: 2,
      label: "Province / territory",
      scale: 0.42,
      maxWidth: 760,
      maxHeight: 520,
      boundsStep: 1,
      seedMarginKm: 900,
      maxBoundaryRank: 0,
      boundaryLabel: "Tint only"
    };
    if (zoom <= 7) return {
      depth: 3,
      label: "Area group",
      scale: 0.48,
      maxWidth: 820,
      maxHeight: 560,
      boundsStep: 0.5,
      seedMarginKm: 650,
      maxBoundaryRank: 2,
      boundaryLabel: "Area transitions"
    };
    return {
      depth: 99,
      label: "Local region",
      scale: 0.54,
      maxWidth: 900,
      maxHeight: 650,
      boundsStep: 0.2,
      seedMarginKm: 450,
      maxBoundaryRank: 2,
      boundaryLabel: "Local transitions"
    };
  }

  function hierarchyLevelName(index, chain) {
    if (index === 0) return "Country";
    if (index === 1) return "Province / Territory";
    if (index === chain.length - 1) {
      return chain.length > 3 ? "Local Region" : "Region";
    }
    return "Area Group";
  }

  function boundaryRankForChains(leftChain, rightChain) {
    var shared = 0;
    var maxShared = Math.min(leftChain.length, rightChain.length);
    while (shared < maxShared && leftChain[shared] === rightChain[shared]) {
      shared += 1;
    }
    if (shared <= 1) return 3;
    if (shared <= 2) return 2;
    return 1;
  }

  function boundaryStyle(rank) {
    if (rank >= 3) return {
      color: [231, 184, 73, 140],
      halo: [4, 11, 16, 42],
      spread: 0,
      haloSpread: 0
    };
    if (rank === 2) return {
      color: [76, 205, 169, 150],
      halo: [4, 11, 16, 42],
      spread: 0,
      haloSpread: 0
    };
    return {
      color: [236, 250, 247, 135],
      halo: [4, 11, 16, 32],
      spread: 0,
      haloSpread: 0
    };
  }

  function paintBorderPixel(img, ranks, width, height, x, y, rank, color, rankAware) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    var offset = y * width + x;
    if (rankAware && rank < ranks[offset]) return;
    var idx = offset * 4;
    img.data[idx] = color[0];
    img.data[idx + 1] = color[1];
    img.data[idx + 2] = color[2];
    img.data[idx + 3] = color[3];
    if (rankAware) ranks[offset] = rank;
  }

  function paintBoundaryStroke(img, ranks, width, height, segment, spread, color, rankAware) {
    for (var n = -spread; n <= spread; n += 1) {
      var x = segment.x;
      var y = segment.y;
      if (segment.vertical) {
        x += n;
      } else {
        y += n;
      }
      paintBorderPixel(img, ranks, width, height, x, y, segment.rank, color, rankAware);
    }
  }

  function buildGeneratedRegionGridAsync(data, bounds, width, height, onProgress, options) {
    bounds = normalizeBounds(bounds);
    var displayDepth = options && options.displayDepth ? options.displayDepth : 99;
    var seedMarginKm = options && options.seedMarginKm ? options.seedMarginKm : 450;
    var maxBoundaryRank = options && typeof options.maxBoundaryRank === "number" ? options.maxBoundaryRank : 3;
    var isCancelled = options && options.isCancelled ? options.isCancelled : function () { return false; };
    var landMask = options && options.landMask;
    if (!landMask || !Array.isArray(landMask.polygons) || !landMask.polygons.length) {
      return Promise.reject(new Error("Map shading data unavailable"));
    }
    var displayTags = [null];
    var displayChains = [null];
    var displayTagIndexes = {};
    function displayIndexForTag(tag) {
      if (displayTagIndexes[tag]) return displayTagIndexes[tag];
      var index = displayTags.length;
      displayTagIndexes[tag] = index;
      displayTags[index] = tag;
      displayChains[index] = ancestryFor(data, tag);
      return index;
    }
    var sourceSeeds = data.seeds.filter(function (seed) {
      return seed.resolve !== false;
    });
    var centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    var centerLon = (bounds[0][1] + bounds[1][1]) / 2;
    var diagonalKm = haversineKm(bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]);
    var seedLimitKm = diagonalKm / 2 + seedMarginKm;
    var candidateSeeds = sourceSeeds.filter(function (seed) {
      return haversineKm(centerLat, centerLon, seed.lat, seed.lon) <= seedLimitKm + (Number(seed.r) || 0);
    });
    if (candidateSeeds.length < Math.min(12, sourceSeeds.length)) {
      candidateSeeds = sourceSeeds.slice();
    }
    var seeds = candidateSeeds.map(function (seed) {
      var displayTag = displayTagForDepth(data, seed.tag, displayDepth);
      return {
        seed: seed,
        displayTag: displayTag,
        displayIndex: displayIndexForTag(displayTag),
        rgb: rgbForTag(displayTag),
        radius: Number(seed.r) || 0
      };
    });
    var cacheKey = resolverCacheKey(data, bounds, width, height, seeds.map(function (entry) {
      return entry.seed;
    }), displayDepth, maxBoundaryRank, landMask.version);
    var cached = readResolverCache(cacheKey);
    if (cached && cached.regionsUrl && cached.bordersUrl) {
      if (onProgress) onProgress({ percent: 100, cached: true, message: "Using cached map shading..." });
      return Promise.resolve({
        bounds: bounds,
        regionsUrl: cached.regionsUrl,
        bordersUrl: cached.bordersUrl,
        stats: cached.stats || { seeds: seeds.length, cells: width * height, cached: true },
        cached: true
      });
    }

    var canvasRegions = document.createElement("canvas");
    canvasRegions.width = width;
    canvasRegions.height = height;

    var regionCtx = canvasRegions.getContext("2d");
    var regionImg = regionCtx.createImageData(width, height);
    var cellSeedIndexes = new Uint16Array(width * height);
    var tagCounts = {};
    var tagPixels = 0;
    var south = bounds[0][0];
    var west = bounds[0][1];
    var north = bounds[1][0];
    var east = bounds[1][1];
    var deg = Math.PI / 180;
    var mercY = function (latDeg) {
      return Math.log(Math.tan(Math.PI / 4 + (latDeg * deg) / 2));
    };
    var invMercY = function (y) {
      return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / deg;
    };
    var yTop = mercY(north);
    var yBot = mercY(south);
    if (onProgress) onProgress({ percent: 4, cached: false, message: "Preparing map shading..." });
    var viewportLandMask = buildViewportLandMask(landMask, bounds, width, height, mercY, yTop, yBot);
    var rowsPerFrame = 6;
    var py = 0;
    var lastPercent = -1;

    if (onProgress) onProgress({ percent: 8, cached: false, message: "Rendering map shading..." });

    return new Promise(function (resolve, reject) {
      function processRows() {
        if (isCancelled()) {
          resolve({ cancelled: true });
          return;
        }
        try {
          var end = Math.min(height, py + rowsPerFrame);
          for (; py < end; py += 1) {
            var lat = invMercY(yTop + ((py + 0.5) / height) * (yBot - yTop));
            for (var px = 0; px < width; px += 1) {
              var maskOffset = py * width + px;
              if (!viewportLandMask.pixels[maskOffset]) continue;
              var lon = west + ((px + 0.5) / width) * (east - west);
              var best = null;
              var bestScore = Infinity;
              var bestSeedIndex = -1;
              for (var si = 0; si < seeds.length; si += 1) {
                var entry = seeds[si];
                var km = haversineKm(lat, lon, entry.seed.lat, entry.seed.lon);
                var score = km - entry.radius;
                if (score < bestScore) {
                  bestScore = score;
                  best = entry;
                  bestSeedIndex = si;
                }
              }
              if (!best) continue;
              var idx = (py * width + px) * 4;
              regionImg.data[idx] = best.rgb[0];
              regionImg.data[idx + 1] = best.rgb[1];
              regionImg.data[idx + 2] = best.rgb[2];
              regionImg.data[idx + 3] = 255;
              cellSeedIndexes[maskOffset] = best.displayIndex;
              tagCounts[best.displayTag] = (tagCounts[best.displayTag] || 0) + 1;
              tagPixels += 1;
            }
          }

          var percent = Math.min(99, Math.floor((py / height) * 100));
          if (onProgress && percent !== lastPercent) {
            lastPercent = percent;
            onProgress({ percent: Math.max(8, percent), cached: false, message: "Rendering map shading..." });
          }

          if (py < height) {
            nextFrame(processRows);
            return;
          }

          if (onProgress) onProgress({ percent: 99, cached: false, message: maxBoundaryRank > 0 ? "Drawing region transitions..." : "Preparing tint layer..." });

          regionCtx.putImageData(regionImg, 0, 0);
          var regionsUrl = canvasRegions.toDataURL("image/png");
          var canvasBorders = document.createElement("canvas");
          canvasBorders.width = width;
          canvasBorders.height = height;
          var borderCtx = canvasBorders.getContext("2d");
          var borderImg = borderCtx.createImageData(width, height);
          var borderRanks = new Uint8Array(width * height);
          var borderSegments = [];
          var chainCache = {};
          var rankCache = {};

          function chainForSeedIndex(seedIndex) {
            var tag = displayTags[seedIndex];
            if (!tag) return [];
            if (!chainCache[tag]) chainCache[tag] = displayChains[seedIndex] || ancestryFor(data, tag);
            return chainCache[tag];
          }

          function rankBetween(leftIndex, rightIndex) {
            if (!leftIndex || !rightIndex || leftIndex === rightIndex) return 0;
            var key = leftIndex < rightIndex ? leftIndex + ":" + rightIndex : rightIndex + ":" + leftIndex;
            if (Object.prototype.hasOwnProperty.call(rankCache, key)) return rankCache[key];
            var rank = boundaryRankForChains(chainForSeedIndex(leftIndex), chainForSeedIndex(rightIndex));
            if (rank > maxBoundaryRank) rank = 0;
            rankCache[key] = rank;
            return rank;
          }

          if (maxBoundaryRank > 0) {
            for (var by = 0; by < height; by += 1) {
              for (var bx = 0; bx < width; bx += 1) {
                var here = cellSeedIndexes[by * width + bx];
                if (bx < width - 1) {
                  var right = cellSeedIndexes[by * width + bx + 1];
                  var vRank = rankBetween(here, right);
                  if (vRank) borderSegments.push({ x: bx, y: by, rank: vRank, vertical: true });
                }
                if (by < height - 1) {
                  var down = cellSeedIndexes[(by + 1) * width + bx];
                  var hRank = rankBetween(here, down);
                  if (hRank) borderSegments.push({ x: bx, y: by, rank: hRank, vertical: false });
                }
              }
            }
          }
          borderSegments.forEach(function (segment) {
            var style = boundaryStyle(segment.rank);
            paintBoundaryStroke(borderImg, borderRanks, width, height, segment, style.haloSpread, style.halo, false);
          });
          borderSegments.forEach(function (segment) {
            var style = boundaryStyle(segment.rank);
            paintBoundaryStroke(borderImg, borderRanks, width, height, segment, style.spread, style.color, true);
          });
          borderCtx.putImageData(borderImg, 0, 0);
          var bordersUrl = canvasBorders.toDataURL("image/png");
          var stats = {
            seeds: seeds.length,
            cells: tagPixels,
            landPixels: viewportLandMask.landPixels,
            borders: borderSegments.length,
            displayDepth: displayDepth,
            maxBoundaryRank: maxBoundaryRank,
            landMaskVersion: landMask.version,
            tagCounts: tagCounts,
            cached: false
          };
          writeResolverCache(cacheKey, {
            createdAt: Date.now(),
            regionsUrl: regionsUrl,
            bordersUrl: bordersUrl,
            stats: stats
          });
          if (onProgress) onProgress({ percent: 100, cached: false, message: "Map shading ready." });
          resolve({
            bounds: bounds,
            regionsUrl: regionsUrl,
            bordersUrl: bordersUrl,
            stats: stats,
            cached: false
          });
        } catch (err) {
          reject(err);
        }
      }

      nextFrame(processRows);
    });
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
    var displayName = best.names.find(function (name) {
      return normalizeLocationSearch(name) === needle;
    }) || labelFor(data, best.seed.tag);
    var provinceTag = provinceTagFor(data, best.seed.tag);
    return {
      lat: Number(best.seed.lat),
      lon: Number(best.seed.lon),
      name: [displayName, provinceTag && labelFor(data, provinceTag)].filter(Boolean).join(", "),
      countryCode: "ca",
      province: provinceTag && labelFor(data, provinceTag),
      exactLocalMatch: best.score <= 1
    };
  }

  function geocoderCaSearch(query) {
    return fetch("https://geocoder.ca/?locate=" + encodeURIComponent(query) + "&json=1")
      .then(function (res) {
        if (!res.ok) throw new Error("Geocoding service error");
        return res.json();
      })
      .then(function (body) {
        return parseGeocoderCaHit(body, query);
      });
  }

  function nominatimSearch(params) {
    var url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams(Object.assign({
      format: "json",
      limit: "1",
      addressdetails: "1"
    }, params));
    return fetch(url, { headers: { "Accept-Language": "en-CA,en" } })
      .then(function (res) {
        if (!res.ok) throw new Error("Geocoding service error");
        return res.json();
      })
      .then(function (rows) {
        return rows.length ? parseNominatimHit(rows[0]) : null;
      });
  }

  function geocodeCanadianPostal(postal) {
    return nominatimSearch({ postalcode: postal.formatted, country: "ca" }).then(function (hit) {
      if (hit) return hit;
      return nominatimSearch({ q: postal.formatted, countrycodes: "ca" });
    }).then(function (hit) {
      if (hit) return hit;
      return fetch("https://geocoder.ca/?locate=" + encodeURIComponent(postal.compact) + "&json=1")
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

  function geocode(data, query) {
    var localMatch = localGeocode(data, query);
    if (localMatch && localMatch.exactLocalMatch) return Promise.resolve(localMatch);
    var postal = parseCanadianPostalCode(query);
    var primaryLookup = postal
      ? geocodeCanadianPostal(postal)
      : nominatimSearch({ q: query, countrycodes: "ca" }).then(function (hit) {
        if (hit) return hit;
        return nominatimSearch({ q: query });
      });

    return primaryLookup.catch(function () {
      return geocoderCaSearch(postal ? postal.formatted : query).catch(function () { return null; });
    }).then(function (hit) {
      if (hit) return hit;
      if (localMatch) return localMatch;
      throw new Error("Location lookup is temporarily unavailable. Try an airport code or use the map.");
    });
  }

  function reverseGeocode(lat, lon) {
    var url = "https://nominatim.openstreetmap.org/reverse?" + new URLSearchParams({
      format: "json",
      lat: String(lat),
      lon: String(lon),
      zoom: "8",
      addressdetails: "1"
    });
    return fetch(url, { headers: { "Accept-Language": "en-CA,en" } })
      .then(function (res) {
        if (!res.ok) throw new Error("Reverse geocoding service error");
        return res.json();
      })
      .then(function (hit) {
        return parseNominatimHit({
          lat: lat,
          lon: lon,
          display_name: hit.display_name || (lat.toFixed(4) + ", " + lon.toFixed(4)),
          address: hit.address || {}
        });
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

  function renderCandidateList(data, target, state, onPick) {
    if (!target || !state.resolution) return;
    target.innerHTML = state.resolution.top5.map(function (entry, index) {
      var tag = entry.seed.tag;
      var selected = tag === state.forcedTag || (!state.forcedTag && index === 0);
      var ancestry = ancestryFor(data, tag).map(function (item) {
        return item;
      }).join(" -> ");
      return '<button type="button" class="mcc-candidate' + (selected ? " is-selected" : "") + '" data-tag="' + esc(tag) + '">' +
        '<span class="mcc-candidate-rank">' + (index + 1) + "</span>" +
        "<span>" +
        '<span class="mcc-candidate-title"><code>' + esc(tag) + "</code> " + esc(labelFor(data, tag)) + "</span>" +
        '<span class="mcc-candidate-meta">' + esc(ancestry) + "</span>" +
        "</span>" +
        '<span class="mcc-candidate-distance">~' + Math.round(entry.km) + " km</span>" +
        "</button>";
    }).join("");

    target.querySelectorAll("[data-tag]").forEach(function (button) {
      button.addEventListener("click", function () {
        onPick(button.getAttribute("data-tag"));
      });
    });
  }

  function renderMetroChips(data, target, state, onChange) {
    if (!target) return;
    if (state.type !== "high-site" || !state.resolution) {
      target.innerHTML = "";
      return;
    }
    var preselect = {};
    if (!state.selectedMetros.length) {
      state.resolution.top5.slice(0, 2).forEach(function (entry) {
        preselect[entry.seed.tag] = true;
      });
      state.selectedMetros = Object.keys(preselect);
    }

    target.innerHTML = '<p class="mcc-hint">High-site repeaters can carry multiple local areas. Select every area this site is intended to serve.</p>' +
      data.metroGroups.map(function (group) {
        return '<div class="mcc-chip-group"><strong>' + esc(group.label) + '</strong><div class="mcc-chip-list">' +
          group.tags.map(function (tag) {
            var checked = state.selectedMetros.indexOf(tag) !== -1 ? " checked" : "";
            return '<label class="mcc-chip"><input type="checkbox" value="' + esc(tag) + '"' + checked + '> <code>' + esc(tag) + "</code> " + esc(labelFor(data, tag)) + "</label>";
          }).join("") +
          "</div></div>";
      }).join("");

    target.querySelectorAll("input[type='checkbox']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.selectedMetros = Array.prototype.slice.call(target.querySelectorAll("input[type='checkbox']:checked")).map(function (item) {
          return item.value;
        });
        onChange();
      });
    });
  }

  function renderResult(data, target, state) {
    if (!target) return;
    if (!state.canGenerate) {
      target.innerHTML = '<div class="mcc-empty-state">' +
        icon("radio-tower") +
        '<strong>No recommendation yet</strong>' +
        '<span>Choose a Canadian location.</span>' +
        '</div>';
      refreshIcons(target);
      return;
    }

    var rec = recommend(data, state.resolution, state.type, state.selectedMetros);
    if (!rec) {
      target.innerHTML = '<div class="mcc-empty-state">' + icon("radio-tower") + '<strong>No recommendation yet</strong></div>';
      refreshIcons(target);
      return;
    }
    var firmware = state.firmware || data.meta.defaultFirmware || "1.16";
    var commands = buildCommands(data, rec.tags, firmware, state.includeBaseline, rec.parentOverrides);
    var technicalCommands = commands.concat(["region dump"]);
    var titleTag = state.resolution.primary.seed.tag;
    var statusNotes = rec.notes.map(function (note) {
      var warning = note.indexOf("Check locally") === 0 || note.indexOf("Do not use") === 0 ||
        note.indexOf("Approximate") === 0 || note.indexOf("Too many") === 0 || note.indexOf("Region names use") === 0;
      return '<div class="mcc-note' + (warning ? " mcc-note-warning" : "") + '">' + esc(note) + "</div>";
    }).join("");
    var firmwareLabel = firmware === "1.16" ? "v1.16+" : firmware === "1.15" ? "v1.15.x" : "v1.14.x";
    var guided = state.finishPath === "guided";
    var verificationCommands = ["region dump"];
    if (state.includeBaseline) verificationCommands.push("get radio");
    var resultBody = guided
      ? '<div class="mcc-guide-panel">' +
        '<ol class="mcc-guide-steps">' +
        '<li class="mcc-guide-connect"><div><h4>Connect to the repeater CLI</h4><p>Choose USB when you can reach the repeater, or manage it over LoRa from a companion radio.</p>' +
        '<div class="mcc-connect-methods">' +
        '<section class="mcc-connect-method"><div class="mcc-connect-method-head">' + icon("usb") + '<div><h5>USB serial</h5><small>At the repeater</small></div></div>' +
        '<ol><li>Connect the repeater to a computer with a data-capable USB cable.</li>' +
        '<li>In desktop Chrome or Edge, open the <a href="https://meshcore.io/flasher" target="_blank" rel="noopener">MeshCore Flasher</a>. For Gessaman\'s MQTT Observer firmware, use the <a href="https://observer.gessaman.com/" target="_blank" rel="noopener">MeshCore Observer Flasher</a> instead.</li>' +
        '<li>Choose <strong>Console</strong>, then approve the repeater\'s serial or COM port when the browser asks.</li></ol></section>' +
        '<section class="mcc-connect-method"><div class="mcc-connect-method-head">' + icon("radio-tower") + '<div><h5>Remote over LoRa</h5><small>Through a companion radio</small></div></div>' +
        '<ol><li>On Android or iPhone/iPad, connect the <a href="https://meshcore.io/" target="_blank" rel="noopener">official MeshCore app</a> to your companion radio.</li>' +
        '<li>Open <strong>Contacts</strong>, select the repeater, then choose <strong>Remote Management</strong> from its menu.</li>' +
        '<li>Enter the repeater admin password, tap <strong>Log In</strong>, then open <strong>Command Line</strong>.</li></ol>' +
        '<p class="mcc-connect-note">If the repeater is missing, open Tools → Discover Nearby Nodes. If a wait timer appears, let it finish before logging in.</p></section>' +
        '</div></div></li>' +
        '<li><div><h4>Confirm the command line</h4><p>Run this first. A version reply means the CLI is ready; make sure it matches your firmware choice.</p>' +
        '<button type="button" class="mcc-command-line" data-cmd="ver"><span>ver</span><em>' + icon("copy") + 'Copy</em></button></div></li>' +
        '<li><div><h4>Apply the settings</h4><p>Copy and run each line in order. Wait for the device reply before continuing.</p>' +
        '<div class="mcc-guide-command-list">' + commands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + 'Copy</em></button>';
        }).join("") + '</div><p class="mcc-guide-stop">If a reply starts with Err, stop. Check the region reply before sending region save. Existing regions are not removed automatically.</p></div></li>' +
        '<li><div><h4>Check the result</h4><p>' + (state.includeBaseline
          ? 'Restart the device so the radio settings take effect. Reconnect, then run:'
          : 'Run this to confirm the saved regions:') + '</p>' +
        '<div class="mcc-guide-command-list">' + verificationCommands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + 'Copy</em></button>';
        }).join("") + '</div></div></li>' +
        '</ol>' +
        '<a class="mcc-guide-docs" href="https://docs.meshcore.io/cli_commands/" target="_blank" rel="noopener">MeshCore command help ' + icon("external-link") + '</a>' +
        '</div>'
      : '<div class="mcc-command-panel">' +
        '<div class="mcc-command-toolbar"><span>Commands</span></div>' +
        '<pre><code>' +
        technicalCommands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + 'Copy</em></button>';
        }).join("") +
        '</code></pre>' +
        '</div>';

    target.innerHTML =
      '<div class="mcc-result-console">' +
      '<div class="mcc-result-head">' +
      '<div>' +
      '<h3 class="mcc-result-title"><code>' + esc(titleTag.toUpperCase()) + "</code> — " + esc(labelFor(data, titleTag)) + "</h3>" +
      '<div class="mcc-result-sub">' + esc(state.name || labelFor(data, titleTag)) + "</div>" +
      '<span class="mcc-source-tier mcc-source-tier-' + esc(state.resolution.sourceTier || "unknown") + '">' +
      (state.resolution.sourceTier === "meshmapper" ? "MeshMapper boundary" : "Approximate area") + '</span>' +
      '</div>' +
      (!guided ? '<button type="button" class="mcc-button mcc-copy-all">' + icon("copy") + 'Copy commands</button>' : '') +
      '</div>' +
      '<div class="mcc-ancestry" aria-label="Region ancestry">' +
      rec.tags.map(function (tag) {
        var stateName = statusFor(data, tag).state || "draft";
        return '<span class="mcc-tag-pill' + (stateName === "draft" ? " is-draft" : "") + '"><code>' + esc(tag) + "</code></span>";
      }).join("") +
      "</div>" +
      '<dl class="mcc-result-meta">' +
      '<div><dt>Firmware</dt><dd>' + esc(firmwareLabel) + '</dd></div>' +
      '<div><dt>Region budget</dt><dd>' + esc(rec.budget.tagCount) + ' / 32 tags · ' +
      esc(rec.budget.responseBytes) + ' / 172 bytes</dd></div>' +
      '</dl>' +
      resultBody +
      (statusNotes ? '<div class="mcc-notes">' + statusNotes + "</div>" : "") +
      "</div>";

    var copy = target.querySelector(".mcc-copy-all");
    if (copy) {
      copy.addEventListener("click", function () {
        copyText(technicalCommands.join("\n"), copy, "Copy commands");
      });
    }
    target.querySelectorAll(".mcc-command-line").forEach(function (button) {
      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-cmd") || "", button.querySelector("em"), "Copy");
      });
    });
    refreshIcons(target);
  }

  function seedForTag(data, tag) {
    return data.seeds.find(function (seed) {
      return seed.tag === tag;
    }) || null;
  }

  function sourceUrlFor(data, tag) {
    var st = statusFor(data, tag);
    if (st.sourceUrl) return st.sourceUrl;
    var meshMapperSource = data.meshMapperSources && data.meshMapperSources[tag] && data.meshMapperSources[tag][0];
    if (meshMapperSource && meshMapperSource.sourceUrl) return meshMapperSource.sourceUrl;
    var seed = seedForTag(data, tag);
    if (seed && seed.pnwAligned && data.meta.attribution) return data.meta.attribution.url;
    if (data.source && data.source.forum) return data.source.forum;
    return null;
  }

  function currentCommands(data, state) {
    if (!state || !state.canGenerate || !state.resolution) return null;
    var rec = recommend(data, state.resolution, state.type, state.selectedMetros);
    if (!rec) return null;
    var firmware = state.firmware || data.meta.defaultFirmware || "1.16";
    return buildCommands(data, rec.tags, firmware, state.includeBaseline, rec.parentOverrides);
  }

  function renderRegionDetail(data, section, target, state, tag) {
    if (!section || !target) return;
    if (!tag) {
      section.hidden = true;
      target.innerHTML = "";
      return;
    }
    var st = statusFor(data, tag);
    var seed = seedForTag(data, tag);
    var sourceUrl = sourceUrlFor(data, tag);
    var ancestry = ancestryFor(data, tag);
    var commands = state && state.canGenerate && state.resolution &&
      state.resolution.primary && state.resolution.primary.seed.tag === tag
      ? currentCommands(data, state)
      : null;
    var pnwAligned = seed && seed.pnwAligned;
    section.hidden = false;
    target.innerHTML =
      '<div class="mcc-detail-head">' +
      '<div><code>' + esc(tag) + '</code><h3>' + esc(labelFor(data, tag)) + '</h3></div>' +
      statusBadge(data, tag) +
      '</div>' +
      '<div class="mcc-detail-ancestry">' +
      ancestry.map(function (item) {
        var index = ancestry.indexOf(item);
        return '<span class="mcc-detail-node">' +
          '<small>' + esc(hierarchyLevelName(index, ancestry)) + '</small>' +
          '<code>' + esc(item) + '</code>' +
          '<em>' + esc(labelFor(data, item)) + '</em>' +
          '</span>';
      }).join('<b>-></b>') +
      '</div>' +
      '<dl class="mcc-detail-list">' +
      '<div><dt>Review</dt><dd>' + esc(st.reviewer || "Unreviewed") + '</dd></div>' +
      '<div><dt>Source</dt><dd>' + esc(st.source || "Not recorded") + '</dd></div>' +
      '<div><dt>Seed</dt><dd>' + (seed
        ? esc(seed.lat.toFixed(4) + ", " + seed.lon.toFixed(4) + " / r " + (seed.r || 0) + " km")
        : "No seed point") + '</dd></div>' +
      '<div><dt>Source note</dt><dd>' + (pnwAligned ? "BC coastal seed follows the PNW reference data" : "Strategy draft v1.1.1 region") + '</dd></div>' +
      '</dl>' +
      '<div class="mcc-detail-actions">' +
      '<button type="button" class="mcc-button mcc-button-secondary" data-action="copy-detail-tag">' + icon("copy") + 'Copy tag</button>' +
      (commands ? '<button type="button" class="mcc-button mcc-button-secondary" data-action="copy-detail-commands">' + icon("clipboard") + 'Copy commands</button>' : '') +
      (sourceUrl ? '<a class="mcc-button mcc-button-secondary" href="' + esc(sourceUrl) + '" target="_blank" rel="noopener">' + icon("external-link") + 'Open source</a>' : '') +
      '</div>';

    var copyTag = target.querySelector("[data-action='copy-detail-tag']");
    if (copyTag) {
      copyTag.addEventListener("click", function () {
        copyText(tag, copyTag, "Copy tag");
      });
    }
    var copyCommands = target.querySelector("[data-action='copy-detail-commands']");
    if (copyCommands && commands) {
      copyCommands.addEventListener("click", function () {
        copyText(commands.join("\n"), copyCommands, "Copy commands");
      });
    }
    refreshIcons(target);
  }

  function renderVisibleLegend(data, target, generated, zoom, onPick) {
    if (!target) return;
    if (!generated || !generated.stats || !generated.stats.tagCounts) {
      target.innerHTML = '<p class="mcc-hint">Rendering visible tags...</p>';
      return;
    }
    var depth = legendDepthForZoom(zoom);
    var counts = generated.stats.tagCounts;
    var tags = Object.keys(counts).filter(function (tag) {
      return counts[tag] > 0;
    });
    var total = tags.reduce(function (sum, tag) {
      return sum + counts[tag];
    }, 0);
    if (!tags.length || !total) {
      target.innerHTML = '<p class="mcc-hint">No visible tags in this viewport.</p>';
      return;
    }
    tags.sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    });
    var maxShown = target.classList && target.classList.contains("mcc-floating-legend") ? 8 : 18;
    var shown = tags.slice(0, maxShown);
    var hidden = Math.max(0, tags.length - shown.length);
    target.innerHTML =
      '<div class="mcc-visible-legend-head">' +
      '<strong>Visible tags</strong>' +
      '<span>' + esc(depth.label) + ' view · ' + esc(depth.boundaryLabel || "Transitions") + ' · zoom ' + esc(zoom) + '</span>' +
      '</div>' +
      '<div class="mcc-visible-legend-list">' +
      shown.map(function (tag) {
        var pct = Math.max(1, Math.round((counts[tag] / total) * 100));
        var chain = ancestryFor(data, tag);
        var context = chain.slice(1, -1).join(" -> ");
        return '<button type="button" class="mcc-visible-region" data-tag="' + esc(tag) + '">' +
          '<i style="background:' + esc(colorForTag(tag)) + '"></i>' +
          '<span>' +
          '<strong><code>' + esc(tag) + '</code> ' + esc(labelFor(data, tag)) + '</strong>' +
          (context ? '<small>' + esc(context) + '</small>' : '') +
          '</span>' +
          '<em>' + pct + '%</em>' +
          '</button>';
      }).join("") +
      (hidden ? '<div class="mcc-visible-more">+' + hidden + ' smaller visible tags</div>' : '') +
      '</div>';
    target.querySelectorAll("[data-tag]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (onPick) onPick(button.getAttribute("data-tag"));
      });
    });
  }

  function refreshTool(data, els, state, afterRefresh) {
    if (els.candidatesSection) els.candidatesSection.hidden = !state.canGenerate;
    if (els.resultSection) els.resultSection.hidden = !state.canGenerate;
    if (!state.canGenerate) {
      state.resolution = null;
      if (els.candidates) els.candidates.innerHTML = "";
      if (els.metro) els.metro.innerHTML = "";
      renderResult(data, els.result, state);
      renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
      if (afterRefresh) afterRefresh();
      return;
    }
    if (state.canGenerate) {
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag);
      if (state.resolution && state.resolution.primary) {
        state.detailTag = state.resolution.primary.seed.tag;
      }
    }
    renderCandidateList(data, els.candidates, state, function (tag) {
      state.forcedTag = tag;
      state.selectedMetros = [];
      refreshTool(data, els, state, afterRefresh);
    });
    renderMetroChips(data, els.metro, state, function () {
      renderResult(data, els.result, state);
    });
    renderResult(data, els.result, state);
    renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
    if (afterRefresh) afterRefresh();
  }

  function toolUi() {
    return '' +
      '<div class="mcc-wizard">' +
      '<ol class="mcc-wizard-progress" aria-label="Setup progress">' +
      '<li><button type="button" data-go-step="1"><span>1</span><strong>Location</strong></button></li>' +
      '<li><button type="button" data-go-step="2" disabled><span>2</span><strong>Radio</strong></button></li>' +
      '<li><button type="button" data-go-step="3" disabled><span>3</span><strong>Site</strong></button></li>' +
      '<li><button type="button" data-go-step="4" disabled><span>4</span><strong>Finish</strong></button></li>' +
      '</ol>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="1">' +
      '<p class="mcc-step-label">Step 1 of 4</p>' +
      '<h2>Choose a location</h2>' +
      '<label class="mcc-label" for="mcc-location-input">City or postal code</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-location-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '<div data-role="status"></div>' +
      '<details class="mcc-alternate-regions" data-role="alternate-regions" hidden>' +
      '<summary>Choose another nearby region</summary>' +
      '<div class="mcc-candidates" data-role="candidates"></div>' +
      '</details>' +
      '<div class="mcc-wizard-actions">' +
      '<a class="mcc-button mcc-button-secondary" data-action="view-map" href="' + esc(regionPageHref("map")) + '" hidden>' + icon("map") + 'View on map</a>' +
      '<button class="mcc-button" type="button" data-next-step disabled>Next' + icon("arrow-right") + '</button>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="2" hidden>' +
      '<p class="mcc-step-label">Step 2 of 4</p>' +
      '<h2>Use recommended radio settings?</h2>' +
      '<div class="mcc-choice-list mcc-choice-list-large" data-role="device-path" role="group" aria-label="Recommended radio settings">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-device-path" value="new" checked><span><strong>Yes — new or reset device</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-device-path" value="existing"><span><strong>No — keep current settings</strong></span></label>' +
      '</div>' +
      '<details class="mcc-advanced-options">' +
      '<summary>Firmware (advanced)</summary>' +
      '<div class="mcc-choice-list" data-role="firmware" role="group" aria-label="Firmware version">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-firmware" value="1.16" checked><span><strong>v1.16+</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-firmware" value="1.15"><span><strong>v1.15.x</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-firmware" value="1.14"><span><strong>v1.14.x</strong></span></label>' +
      '</div>' +
      '</details>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button><button class="mcc-button" type="button" data-next-step>Next' + icon("arrow-right") + '</button></div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="3" hidden>' +
      '<p class="mcc-step-label">Step 3 of 4</p>' +
      '<h2>Where will it be installed?</h2>' +
      '<div class="mcc-choice-list" data-role="types" role="group" aria-label="Repeater installation type">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="residential" checked><span><strong>Home or portable</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="urban"><span><strong>Rooftop or tower</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="high-site"><span><strong>Mountaintop / wide coverage</strong></span></label>' +
      '</div>' +
      '<div data-role="metro"></div>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button><button class="mcc-button" type="button" data-next-step>Next' + icon("arrow-right") + '</button></div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="4" hidden>' +
      '<p class="mcc-step-label">Step 4 of 4</p>' +
      '<h2>Choose how to finish</h2>' +
      '<div class="mcc-finish-paths" role="group" aria-label="Choose setup instructions">' +
      '<button type="button" class="mcc-finish-path is-active" data-finish-path="guided" aria-pressed="true">' + icon("list-checks") + '<span><strong>Guide me</strong><small>Apply the settings step by step</small></span></button>' +
      '<button type="button" class="mcc-finish-path" data-finish-path="technical" aria-pressed="false">' + icon("terminal") + '<span><strong>Copy commands</strong><small>Show all commands at once</small></span></button>' +
      '</div>' +
      '<div data-role="result"><p class="mcc-result-empty">Choose a Canadian location to generate commands.</p></div>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button><a class="mcc-button mcc-button-secondary" data-action="view-map" href="' + esc(regionPageHref("map")) + '" hidden>' + icon("map") + 'View on map</a></div>' +
      '</section>' +
      '</div>';
  }

  function initConfig(el, data) {
    el.innerHTML = toolUi();
    refreshIcons(el);
    var state = {
      lat: null,
      lon: null,
      name: "",
      forcedTag: null,
      type: "residential",
      firmware: data.meta.defaultFirmware || "1.16",
      includeBaseline: true,
      selectedMetros: [],
      canGenerate: false,
      resolution: null,
      finishPath: "guided",
      wizardStep: 1,
      maxStep: 1
    };
    var els = {
      input: el.querySelector("#mcc-location-input"),
      locate: el.querySelector("[data-action='locate']"),
      status: el.querySelector("[data-role='status']"),
      alternateRegions: el.querySelector("[data-role='alternate-regions']"),
      candidates: el.querySelector("[data-role='candidates']"),
      metro: el.querySelector("[data-role='metro']"),
      result: el.querySelector("[data-role='result']"),
      finishPaths: Array.prototype.slice.call(el.querySelectorAll("[data-finish-path]")),
      steps: Array.prototype.slice.call(el.querySelectorAll("[data-wizard-step]")),
      progress: Array.prototype.slice.call(el.querySelectorAll("[data-go-step]")),
      viewMap: Array.prototype.slice.call(el.querySelectorAll("[data-action='view-map']"))
    };

    var firmwareInput = el.querySelector("input[name='mcc-firmware'][value='" + state.firmware + "']");
    if (firmwareInput) firmwareInput.checked = true;

    function updateMapLinks() {
      els.viewMap.forEach(function (link) {
        link.hidden = !state.canGenerate;
        if (state.canGenerate) link.href = mapHrefForState(state);
      });
      if (els.alternateRegions) els.alternateRegions.hidden = true;
    }

    function showStep(step) {
      var next = Math.max(1, Math.min(4, step));
      if (next > state.maxStep) return;
      var changed = state.wizardStep !== next;
      state.wizardStep = next;
      els.steps.forEach(function (section) {
        section.hidden = Number(section.getAttribute("data-wizard-step")) !== next;
      });
      els.progress.forEach(function (button) {
        var buttonStep = Number(button.getAttribute("data-go-step"));
        button.disabled = buttonStep > state.maxStep;
        button.classList.toggle("is-active", buttonStep === next);
        button.classList.toggle("is-complete", buttonStep < next || buttonStep < state.maxStep);
        if (buttonStep === next) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      if (next === 4) renderResult(data, els.result, state);
      if (changed) {
        var activeStep = els.steps.find(function (section) {
          return Number(section.getAttribute("data-wizard-step")) === next;
        });
        var heading = activeStep && activeStep.querySelector("h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }
      refreshIcons(el);
    }

    function selectFinishPath(path) {
      state.finishPath = path === "technical" ? "technical" : "guided";
      els.finishPaths.forEach(function (button) {
        var active = button.getAttribute("data-finish-path") === state.finishPath;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      renderResult(data, els.result, state);
    }

    function advanceStep() {
      if (state.wizardStep === 1 && !state.canGenerate) {
        setStatus(els.status, "Choose a Canadian location before continuing.", "error");
        return;
      }
      state.maxStep = Math.max(state.maxStep, Math.min(4, state.wizardStep + 1));
      showStep(state.wizardStep + 1);
    }

    function useGeo(geo) {
      state.lat = geo.lat;
      state.lon = geo.lon;
      state.name = geo.name;
      state.forcedTag = null;
      state.selectedMetros = [];
      if (!isCanada(geo)) {
        state.canGenerate = false;
        setStatus(els.status, "This location is outside Canada.", "warning");
        refreshTool(data, els, state);
        return;
      }
      state.resolution = resolveLocation(data, state.lat, state.lon);
      if (!state.resolution.hasMatch) {
        state.canGenerate = false;
        setStatus(els.status, "No region found here. Try a nearby city.", "warning");
      } else {
        state.canGenerate = true;
        state.maxStep = Math.max(state.maxStep, 2);
        setStatus(els.status, state.resolution.sourceTier === "meshmapper"
          ? "Region found."
          : "Strategy region found. Boundary is approximate.",
        state.resolution.sourceTier === "meshmapper" ? "info" : "warning");
      }
      refreshTool(data, els, state, updateMapLinks);
      updateMapLinks();
      var nextButton = el.querySelector("[data-wizard-step='1'] [data-next-step]");
      if (nextButton) nextButton.disabled = !state.canGenerate;
      showStep(1);
    }

    function locate() {
      var query = els.input.value.trim();
      if (!query) {
        setStatus(els.status, "Enter a Canadian city, airport code, or postal code.", "error");
        return;
      }
      els.locate.disabled = true;
      els.locate.textContent = "Finding";
      geocode(data, query).then(useGeo).catch(function (err) {
        state.canGenerate = false;
        setStatus(els.status, esc(err.message || "Location lookup failed"), "error");
        refreshTool(data, els, state, updateMapLinks);
      }).finally(function () {
        els.locate.disabled = false;
        els.locate.innerHTML = icon("search") + "Find";
        refreshIcons(els.locate);
      });
    }

    els.locate.addEventListener("click", locate);
    els.input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") locate();
    });
    el.querySelectorAll("[data-next-step]").forEach(function (button) {
      button.addEventListener("click", advanceStep);
    });
    el.querySelectorAll("[data-prev-step]").forEach(function (button) {
      button.addEventListener("click", function () { showStep(state.wizardStep - 1); });
    });
    els.progress.forEach(function (button) {
      button.addEventListener("click", function () {
        showStep(Number(button.getAttribute("data-go-step")));
      });
    });
    els.finishPaths.forEach(function (button) {
      button.addEventListener("click", function () {
        selectFinishPath(button.getAttribute("data-finish-path"));
      });
    });
    el.querySelectorAll("input[name='mcc-device-path']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.includeBaseline = input.value === "new";
        renderResult(data, els.result, state);
      });
    });
    el.querySelectorAll("input[name='mcc-type']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.type = input.value;
        state.selectedMetros = [];
        refreshTool(data, els, state);
      });
    });
    el.querySelectorAll("input[name='mcc-firmware']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.firmware = input.value;
        renderResult(data, els.result, state);
      });
    });
    showStep(1);
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      var script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = function () { resolve(window.L); };
      script.onerror = function () {
        leafletPromise = null;
        reject(new Error("Leaflet failed to load"));
      };
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function setMapProgress(els, progress, done) {
    var percent = Math.max(0, Math.min(100, Math.round(progress.percent || 0)));
    var label = progress.message || (progress.cached ? "Using cached region cells..." : "Rendering region cells...");
    if (els.loader) {
      els.loader.hidden = !!done;
      els.loader.classList.toggle("is-done", !!done);
    }
    if (els.loaderLabel) els.loaderLabel.textContent = label;
    if (els.loaderPercent) els.loaderPercent.textContent = percent + "%";
    if (els.loaderBar) els.loaderBar.style.width = percent + "%";
    if (els.loaderInline) els.loaderInline.hidden = !!done;
    if (els.loaderInlineLabel) els.loaderInlineLabel.textContent = label;
    if (els.loaderInlinePercent) els.loaderInlinePercent.textContent = percent + "%";
  }

  function initMap(el, data) {
    el.innerHTML = '' +
      '<div class="mcc-map-shell">' +
      '<aside class="mcc-map-panel">' +
      '<div class="mcc-panel-header">' +
      '<h2>Find a region</h2>' +
      '<p>MeshMapper boundaries take priority. Other areas are approximate.</p>' +
      '<a class="mcc-button mcc-button-secondary" href="' + esc(regionPageHref("config")) + '">' + icon("list-checks") + 'Setup</a>' +
      '</div>' +
      '<section class="mcc-card mcc-card-compact">' +
      '<h2>Choose a location</h2>' +
      '<label class="mcc-label" for="mcc-map-location-input">City, airport code, or postal code</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-map-location-input" data-role="map-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="map-locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '<div data-role="map-status"></div>' +
      '</section>' +
      '<section class="mcc-card mcc-dynamic-card" data-role="map-result-section" hidden>' +
      '<h2>Selected region</h2>' +
      '<div data-role="map-result"><p class="mcc-result-empty">Choose a Canadian location to see its region.</p></div>' +
      '</section>' +
      '<details class="mcc-card mcc-map-options">' +
      '<summary>Settings</summary>' +
      '<div class="mcc-choice-list" role="group" aria-label="Repeater installation type">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-map-type" value="residential" checked><span><strong>Home or portable</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-map-type" value="urban"><span><strong>Rooftop or tower</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-map-type" value="high-site"><span><strong>Mountaintop / wide coverage</strong></span></label>' +
      '</div>' +
      '<div data-role="map-metro"></div>' +
      '<label class="mcc-label" for="mcc-map-firmware">Firmware</label>' +
      '<select class="mcc-select" id="mcc-map-firmware" data-role="map-firmware">' +
      '<option value="1.16">v1.16+</option><option value="1.15">v1.15.x</option><option value="1.14">v1.14.x</option>' +
      '</select>' +
      '<label class="mcc-choice" style="margin-top:0.55rem"><input type="checkbox" data-action="map-baseline" checked><span><strong>Include recommended radio defaults</strong></span></label>' +
      '</details>' +
      '</aside>' +
      '<div class="mcc-map-area"><div class="mcc-map-canvas" data-role="map-canvas" role="region" aria-label="Interactive Canadian region map"></div></div>' +
      '</div>';
    refreshIcons(el);

    var state = {
      lat: null,
      lon: null,
      name: "",
      forcedTag: null,
      type: "residential",
      firmware: data.meta.defaultFirmware || "1.16",
      includeBaseline: true,
      selectedMetros: [],
      canGenerate: false,
      resolution: null,
      detailTag: null
    };
    var els = {
      input: el.querySelector("[data-role='map-input']"),
      locate: el.querySelector("[data-action='map-locate']"),
      status: el.querySelector("[data-role='map-status']"),
      candidatesSection: null,
      candidates: null,
      metro: el.querySelector("[data-role='map-metro']"),
      resultSection: el.querySelector("[data-role='map-result-section']"),
      result: el.querySelector("[data-role='map-result']"),
      detailSection: null,
      detail: null,
      canvas: el.querySelector("[data-role='map-canvas']")
    };
    var afterMapRefresh = function () {};
    el.querySelector("[data-role='map-firmware']").value = state.firmware;

    loadLeaflet().then(function (L) {
      if (!el.isConnected) return;
      var map = L.map(els.canvas, { minZoom: 3, maxZoom: 13 });
      activeMaps.push({ container: el, map: map });
      var canadaBounds = data.meta.map.bounds || [[41.5, -141.5], [83.5, -52]];
      function fitCanada() {
        map.fitBounds(canadaBounds, { padding: [24, 24], maxZoom: 4 });
      }
      fitCanada();
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      var communityLayer = L.layerGroup();
      var communityCoverageLayers = [];
      var communityMarkerLayers = [];
      data.communityExtraSeeds.forEach(function (seed) {
        var radius = Math.max(35, Math.min(205, (Number(seed.r) || 0) * 1.35));
        var coverage = L.circle([seed.lat, seed.lon], {
          radius: radius * 1000,
          color: "#8f98b7",
          opacity: 0.55,
          weight: 1,
          dashArray: "4 5",
          fillColor: colorForTag(seed.tag),
          fillOpacity: 0.035
        });
        coverage.bindTooltip('<strong>' + esc(seed.tag.toUpperCase()) + '</strong> - ' + esc(labelFor(data, seed.tag)) + '<br><small>Strategy area · approximate</small>');
        coverage.on("click", function (event) {
          if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
          verifyAndUseGeo(event.latlng.lat, event.latlng.lng, labelFor(data, seed.tag), false, seed.tag);
        });
        coverage.addTo(communityLayer);
        communityCoverageLayers.push(coverage);
        var communityMarker = L.circleMarker([seed.lat, seed.lon], {
          radius: 3,
          color: "#d6dbef",
          weight: 1,
          fillColor: colorForTag(seed.tag),
          fillOpacity: 0.9
        }).bindTooltip('<strong>' + esc(seed.tag.toUpperCase()) + '</strong> - ' + esc(labelFor(data, seed.tag)));
        communityMarker.on("click", function (event) {
          if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
          useGeo({ lat: seed.lat, lon: seed.lon, name: labelFor(data, seed.tag), countryCode: "ca" }, false, seed.tag);
        });
        communityMarker.addTo(communityLayer);
        communityMarkerLayers.push(communityMarker);
      });

      var fillLayer = L.geoJSON(data.meshMapperRegions, {
        style: function (feature) {
          return {
            color: "transparent",
            weight: 0,
            fillColor: colorForTag(feature.properties.tag),
            fillOpacity: 0.2
          };
        },
        onEachFeature: function (feature, layer) {
          layer.bindTooltip('<strong>' + esc(feature.properties.code) + '</strong> - ' + esc(feature.properties.name));
          layer.on("click", function (event) {
            if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
            useGeo({
              lat: event.latlng.lat,
              lon: event.latlng.lng,
              name: feature.properties.name,
              countryCode: "ca"
            }, false, feature.properties.tag);
          });
        }
      });
      var borderLayer = L.geoJSON(data.meshMapperRegions, {
        interactive: false,
        style: { color: "#aeb8ff", opacity: 0.9, weight: 1.5, fill: false }
      });
      var unifiedRegionLayer = L.layerGroup([communityLayer, fillLayer, borderLayer]).addTo(map);
      var selectedLayer = L.geoJSON(null, {
        interactive: false,
        style: { color: "#ffffff", opacity: 1, weight: 4, fillColor: "#4287ff", fillOpacity: 0.38 }
      }).addTo(map);
      var selectedCommunityLayer = L.layerGroup().addTo(map);

      function syncCommunityZoom() {
        var nationalView = map.getZoom() < 5;
        communityCoverageLayers.forEach(function (layer) {
          layer.setStyle({ opacity: nationalView ? 0.18 : 0.55, fillOpacity: nationalView ? 0.01 : 0.035 });
        });
        communityMarkerLayers.forEach(function (layer) {
          layer.setStyle({ opacity: nationalView ? 0 : 1, fillOpacity: nationalView ? 0 : 0.9 });
        });
      }
      map.on("zoomend", syncCommunityZoom);
      syncCommunityZoom();

      function updateBoundaryHighlight() {
        selectedLayer.clearLayers();
        selectedCommunityLayer.clearLayers();
        if (state.resolution && state.resolution.boundary) {
          selectedLayer.addData(state.resolution.boundary);
          selectedLayer.bringToFront();
        } else if (state.resolution && state.resolution.primary) {
          var seed = state.resolution.primary.seed;
          L.circle([seed.lat, seed.lon], {
            radius: state.resolution.coverageKm * 1000,
            color: "#ffffff",
            opacity: 1,
            weight: 3,
            dashArray: "7 5",
            fillColor: "#4287ff",
            fillOpacity: 0.24,
            interactive: false
          }).addTo(selectedCommunityLayer);
        }
      }
      afterMapRefresh = updateBoundaryHighlight;

      var marker = null;
      function place(lat, lon) {
        if (marker) marker.setLatLng([lat, lon]);
        else marker = L.marker([lat, lon]).addTo(map);
      }

      function useGeo(geo, recenter, forcedTag) {
        state.lat = Number(geo.lat);
        state.lon = Number(geo.lon);
        state.name = geo.name || (state.lat.toFixed(4) + ", " + state.lon.toFixed(4));
        state.forcedTag = forcedTag || null;
        state.selectedMetros = [];
        place(state.lat, state.lon);
        if (!isCanada(geo)) {
          state.forcedTag = null;
          state.canGenerate = false;
          state.detailTag = null;
          state.resolution = null;
          setStatus(els.status, "That point appears to be outside Canada.", "warning");
        } else {
          state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag);
          state.canGenerate = state.resolution.hasMatch;
          state.detailTag = state.canGenerate ? state.resolution.primary.seed.tag : null;
          if (state.canGenerate) {
            setStatus(els.status, state.resolution.sourceTier === "meshmapper"
              ? state.detailTag.toUpperCase() + " — " + labelFor(data, state.detailTag)
              : state.detailTag.toUpperCase() + " — " + labelFor(data, state.detailTag) + " (approximate)",
            state.resolution.sourceTier === "meshmapper" ? "info" : "warning");
          } else {
            setStatus(els.status, "No region here.", "warning");
          }
        }
        refreshTool(data, els, state, updateBoundaryHighlight);
        if (recenter) {
          if (state.resolution && state.resolution.boundary) {
            var selectedBounds = L.geoJSON(state.resolution.boundary).getBounds();
            if (selectedBounds.isValid()) map.fitBounds(selectedBounds, { padding: [28, 28], maxZoom: 9 });
          } else if (state.resolution && state.resolution.primary) {
            var fallbackSeed = state.resolution.primary.seed;
            var latDelta = state.resolution.coverageKm / 111;
            var lonDelta = latDelta / Math.max(0.25, Math.cos(fallbackSeed.lat * Math.PI / 180));
            var fallbackBounds = L.latLngBounds(
              [fallbackSeed.lat - latDelta, fallbackSeed.lon - lonDelta],
              [fallbackSeed.lat + latDelta, fallbackSeed.lon + lonDelta]
            );
            if (fallbackBounds.isValid()) map.fitBounds(fallbackBounds, { padding: [28, 28], maxZoom: 9 });
          } else {
            map.setView([state.lat, state.lon], Math.max(map.getZoom(), 8));
          }
        }
      }

      function rejectUnverifiedPoint(lat, lon, name, recenter) {
        state.lat = Number(lat);
        state.lon = Number(lon);
        state.name = name || (state.lat.toFixed(4) + ", " + state.lon.toFixed(4));
        state.forcedTag = null;
        state.selectedMetros = [];
        state.canGenerate = false;
        state.resolution = null;
        state.detailTag = null;
        place(state.lat, state.lon);
        setStatus(els.status, "We couldn't confirm that this point is in Canada. No settings were generated. Search for a nearby Canadian city and try again.", "error");
        refreshTool(data, els, state, updateBoundaryHighlight);
        if (recenter) map.setView([state.lat, state.lon], Math.max(map.getZoom(), 8));
      }

      function verifyAndUseGeo(lat, lon, name, recenter, forcedTag) {
        setStatus(els.status, "Checking location...", "info");
        return reverseGeocode(lat, lon).then(function (geo) {
          if (name) geo.name = name;
          useGeo(geo, recenter, forcedTag);
        }).catch(function () {
          rejectUnverifiedPoint(lat, lon, name, recenter);
        });
      }

      function locate() {
        var query = els.input.value.trim();
        if (!query) {
          setStatus(els.status, "Enter a Canadian city, airport code, or postal code.", "error");
          return;
        }
        els.locate.disabled = true;
        els.locate.textContent = "Finding";
        geocode(data, query).then(function (geo) {
          useGeo(geo, true);
        }).catch(function (err) {
          setStatus(els.status, esc(err.message || "Location lookup failed"), "error");
        }).finally(function () {
          els.locate.disabled = false;
          els.locate.innerHTML = icon("search") + "Find";
          refreshIcons(els.locate);
        });
      }

      els.locate.addEventListener("click", locate);
      els.input.addEventListener("keydown", function (event) { if (event.key === "Enter") locate(); });
      map.on("click", function (event) {
        var lat = event.latlng.lat;
        var lon = event.latlng.lng;
        verifyAndUseGeo(lat, lon, lat.toFixed(4) + ", " + lon.toFixed(4), false);
      });

      var params = new URLSearchParams(window.location.search);
      var initialLatRaw = params.get("lat");
      var initialLonRaw = params.get("lon");
      var initialLat = initialLatRaw === null || initialLatRaw.trim() === "" ? NaN : Number(initialLatRaw);
      var initialLon = initialLonRaw === null || initialLonRaw.trim() === "" ? NaN : Number(initialLonRaw);
      var hasInitialLocation = Number.isFinite(initialLat) && Number.isFinite(initialLon);
      if (hasInitialLocation) {
        var initialName = params.get("name") || (initialLat.toFixed(4) + ", " + initialLon.toFixed(4));
        els.input.value = initialName;
        verifyAndUseGeo(initialLat, initialLon, initialName, true, params.get("tag"));
      } else {
        fitCanada();
      }
      window.setTimeout(function () {
        map.invalidateSize();
        if (!hasInitialLocation) fitCanada();
      }, 250);
    }).catch(function (err) {
      setStatus(els.status, esc(err.message), "error");
    });

    el.querySelectorAll("input[name='mcc-map-type']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.type = input.value;
        state.selectedMetros = [];
        refreshTool(data, els, state, afterMapRefresh);
      });
    });
    el.querySelector("[data-role='map-firmware']").addEventListener("change", function (event) {
      state.firmware = event.target.value;
      renderResult(data, els.result, state);
      renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
    });
    el.querySelector("[data-action='map-baseline']").addEventListener("change", function (event) {
      state.includeBaseline = event.target.checked;
      renderResult(data, els.result, state);
      renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
    });
  }

  function regionRows(data) {
    return (data.consolidatedRegionTags || data.meshMapperTags || Object.keys(data.hierarchy)).map(function (tag) {
      var item = data.hierarchy[tag];
      var st = statusFor(data, tag);
      var seed = seedForTag(data, tag);
      var hasMeshMapperBoundary = data.meshMapperTags.indexOf(tag) !== -1;
      return {
        tag: tag,
        label: item.label,
        parent: item.parent || "",
        ancestry: ancestryText(data, tag),
        province: provinceTagFor(data, tag),
        state: st.state || "draft",
        statusLabel: statusLabel(st.state || "draft"),
        source: st.source || "",
        reviewer: st.reviewer || "",
        seed: seedText(seed),
        sourceTier: hasMeshMapperBoundary ? "meshmapper" : "strategy",
        boundaryType: hasMeshMapperBoundary ? "exact" : "approximate",
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
      '<div class="mcc-region-table-wrap"><table class="mcc-region-table"><thead><tr><th scope="col">Region</th><th scope="col">Area</th><th scope="col">Boundary</th><th scope="col">Basis</th></tr></thead><tbody></tbody></table></div>' +
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
        if (provinceFilter && row.province !== provinceFilter && row.tag !== provinceFilter) return false;
        return true;
      });
      count.textContent = shown.length === rows.length ? rows.length + " regions" : shown.length + " of " + rows.length + " regions";
      body.innerHTML = shown.map(function (row) {
        return "<tr>" +
          '<td><code>' + esc(row.tag) + "</code> " + esc(row.label) + "</td>" +
          "<td>" + esc(row.province ? labelFor(data, row.province) : "Canada") + "</td>" +
          "<td>" + (row.boundaryType === "exact" ? "MeshMapper" : "Approx.") + "</td>" +
          "<td>" + (row.basis === "established" ? "Established" : "Proposed") + "</td>" +
          "</tr>";
      }).join("");
      refreshIcons(el);
    }
    input.addEventListener("input", draw);
    province.addEventListener("change", draw);
    draw();
  }

  function renderDashboard(el, data) {
    el.innerHTML =
      '<div class="mcc-dashboard">' +
      '<section class="mcc-console-header mcc-dashboard-header">' +
      '<h2>Canadian regions — Draft v1.1.1</h2>' +
      '<div class="mcc-dashboard-actions">' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("config")) + '">' + icon("list-checks") + '<span><strong>Setup</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("map")) + '">' + icon("map") + '<span><strong>Map</strong></span></a>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-stat-grid" aria-label="Region status summary">' +
      '<div class="mcc-stat"><span>Regions</span><strong>' + data.regionCounts.total + '</strong></div>' +
      '<div class="mcc-stat"><span>MeshMapper boundaries</span><strong>' + data.regionCounts.meshMapper + '</strong></div>' +
      '<div class="mcc-stat"><span>Provinces &amp; territories</span><strong>' + provinceOptions(data).length + '</strong></div>' +
      '</section>' +
      '<section class="mcc-card mcc-dashboard-table">' +
      '<div class="mcc-section-head"><div><h2>Regions</h2></div></div>' +
      '<div data-role="dashboard-table"></div>' +
      '</section>' +
      '</div>';
    renderRegionTable(el.querySelector("[data-role='dashboard-table']"), data);
    refreshIcons(el);
  }

  function initRegions() {
    activeMaps = activeMaps.filter(function (entry) {
      if (entry.container.isConnected) return true;
      try { entry.map.remove(); } catch (error) { /* The old document is already gone. */ }
      return false;
    });
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-mcc-regions]"));
    if (!nodes.length) return;
    loadData().then(function (data) {
      nodes.forEach(function (node) {
        if (!node.isConnected) return;
        if (node.dataset.mccReady === "1") return;
        node.dataset.mccReady = "1";
        var mode = node.getAttribute("data-mcc-regions");
        if (mode === "config") initConfig(node, data);
        if (mode === "map") initMap(node, data);
        if (mode === "dashboard") renderDashboard(node, data);
        if (mode === "table") renderRegionTable(node, data);
      });
    }).catch(function (err) {
      nodes.forEach(function (node) {
        if (!node.isConnected) return;
        node.innerHTML = '<div class="mcc-status mcc-status-error">' + esc(err.message) + "</div>";
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
