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
  var lucidePromise = null;
  var activeMaps = [];
  var LUCIDE_SRC = new URL("vendor/lucide.js", assetBase).href;

  function fetchJsonAsset(filename, errorMessage) {
    return fetch(new URL(filename, assetBase)).then(function (response) {
      if (!response.ok) throw new Error(errorMessage);
      return response.json();
    });
  }

  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetchJsonAsset("canada-regions.json", "Unable to load MeshCore Canada region data")
        .then(prepareCatalog)
        .catch(function (error) {
          catalogPromise = null;
          throw error;
        });
    }
    return catalogPromise;
  }

  function loadDisplayPartition() {
    if (!displayPartitionPromise) {
      displayPartitionPromise = fetchJsonAsset(
        "canada-region-partition.geojson",
        "Unable to load the Canadian map layer"
      ).catch(function (error) {
        displayPartitionPromise = null;
        throw error;
      });
    }
    return displayPartitionPromise;
  }

  function loadResolverPartition() {
    if (!resolverPartitionPromise) {
      resolverPartitionPromise = fetchJsonAsset(
        "canada-region-partition-digital.geojson",
        "Unable to load the Canadian location layer"
      ).catch(function (error) {
        resolverPartitionPromise = null;
        throw error;
      });
    }
    return resolverPartitionPromise;
  }

  function loadData(mode) {
    if (mode === "map") {
      return Promise.all([loadCatalog(), loadDisplayPartition()]).then(function (loaded) {
        return applyGeneratedPartition(loaded[0], loaded[1], null);
      });
    }
    if (mode === "config") {
      return Promise.all([loadCatalog(), loadResolverPartition()]).then(function (loaded) {
        return applyGeneratedPartition(loaded[0], null, loaded[1]);
      });
    }
    return loadCatalog();
  }

  function prepareCatalog(data) {
    if (data.__mccPrepared) return data;
    var suppliedAliases = data.aliases || {};
    var previousAliases = data.regionAliases || {};
    var strategySeeds = (data.seeds || []).map(function (seed) {
      return Object.assign({}, seed, {
        tag: slug(seed.tag),
        sourceTier: "generated",
        boundaryType: "generated-partition"
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
    var partitionTags = Object.keys(seedTags).sort();
    data.strategySeeds = strategySeeds;
    data.strategyFallbackSeeds = [];
    data.communityExtraSeeds = [];
    data.seeds = strategySeeds;
    data.consolidatedRegionTags = partitionTags;
    data.regionCounts = {
      total: partitionTags.length,
      generated: partitionTags.length,
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
        label: record.label,
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
      if (!Array.isArray(collection.features) || !collection.features.length) {
        throw new Error("Canadian map layer is invalid");
      }
      var displaySeen = {};
      var normalizedFeatures = collection.features.map(function (feature) {
        var tag = slug(feature.properties && feature.properties.tag);
        if (!tag || displaySeen[tag] || !expected[tag]) {
          throw new Error("Canadian map layer contains an invalid or duplicate region: " + (tag || "unknown"));
        }
        displaySeen[tag] = true;
        return Object.assign({}, feature, {
          properties: Object.assign({}, feature.properties, {
            tag: tag,
            canonicalTag: tag,
            sourceTier: "generated",
            boundaryType: "generated-partition"
          })
        });
      });
      if (Object.keys(displaySeen).length !== Object.keys(expected).length) {
        throw new Error("Canadian map layer does not match the region catalog");
      }
      data.partitionRegions = Object.assign({}, collection, { features: normalizedFeatures });
      data.partitionByTag = {};
      normalizedFeatures.forEach(function (feature) { data.partitionByTag[feature.properties.tag] = feature; });
    }

    if (resolverCollection) {
      if (!Array.isArray(resolverCollection.features) || !resolverCollection.features.length) {
        throw new Error("Canadian location layer is invalid");
      }
      data.resolverByTag = {};
      var normalizedResolverFeatures = resolverCollection.features.map(function (feature) {
        var tag = slug(feature.properties && feature.properties.tag);
        if (!tag || !expected[tag] || data.resolverByTag[tag]) {
          throw new Error("Canadian location layer contains an invalid or duplicate region: " + (tag || "unknown"));
        }
        var normalized = Object.assign({}, feature, {
          properties: Object.assign({}, feature.properties, { tag: tag, canonicalTag: tag })
        });
        data.resolverByTag[tag] = normalized;
        return normalized;
      });
      if (Object.keys(data.resolverByTag).length !== Object.keys(expected).length) {
        throw new Error("Canadian location layer does not match the region catalog");
      }
      data.resolverRegions = Object.assign({}, resolverCollection, { features: normalizedResolverFeatures });
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
    if (data.status && data.status[tag]) return data.status[tag];
    return {
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
    if (data.hierarchy[tag]) return data.hierarchy[tag].label;
    if (data.externalTagLabels && data.externalTagLabels[tag]) return data.externalTagLabels[tag];
    return tag;
  }

  function scopeExists(data, tag) {
    return Boolean(data.hierarchy[tag]);
  }

  function parentFor(data, tag) {
    return data.hierarchy[tag] ? data.hierarchy[tag].parent : null;
  }

  function childrenFor(data, tag) {
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
      features: leaves.map(function (leaf) { return data.partitionByTag[leaf]; }).filter(Boolean)
    };
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

  function selectedExternalRegionPaths(data, ids) {
    var selected = {};
    unique(ids || []).forEach(function (id) { selected[id] = true; });
    return (data.externalRegionPathList || []).filter(function (record) {
      return Boolean(selected[record.id]);
    }).sort(function (left, right) {
      return left.path.join("/").localeCompare(right.path.join("/"));
    });
  }

  function defaultRepeaterLeaves(data, primaryTag) {
    var area = sharedRepeaterAreaForTag(data, primaryTag);
    if (area && area.defaultForMembers) return area.members.slice();
    return [primaryTag];
  }

  function labelledPath(data, path) {
    return path.map(function (tag) { return labelFor(data, tag); }).join(" › ");
  }

  function seedText(seed) {
    return seed
      ? seed.lat.toFixed(4) + ", " + seed.lon.toFixed(4) + " / r " + (seed.r || 0) + " km"
      : "No seed";
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
    var routes = { dashboard: "", config: "", setup: "", map: "map/", standard: "standard/" };
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
    if (state.type === "high-site") params.set("type", "large");
    if (state.selectedMetros && state.selectedMetros.length) {
      params.set("regions", state.selectedMetros.join(","));
    }
    if (state.selectedExternalPaths && state.selectedExternalPaths.length) {
      params.set("external", state.selectedExternalPaths.join(","));
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

  function rankSeeds(data, lat, lon, jurisdictionTag) {
    return data.seeds.filter(function (seed) {
      return seed.resolve !== false && (!jurisdictionTag || provinceTagFor(data, seed.tag) === jurisdictionTag);
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
    features = features.filter(function (feature) {
      return !jurisdictionTag || provinceTagFor(data, feature.properties.tag) === jurisdictionTag;
    });
    function deterministic(featuresAtPoint) {
      return featuresAtPoint.sort(function (a, b) {
        var aId = String(a.properties.registryId || a.properties.tag);
        var bId = String(b.properties.registryId || b.properties.tag);
        return aId.localeCompare(bId);
      })[0] || null;
    }
    if (forcedTag) {
      var forced = deterministic(features.filter(function (feature) {
        return String(feature.properties.tag).toLowerCase() === String(forcedTag).toLowerCase() &&
          featureContainsPoint(feature, lat, lon);
      }));
      if (forced) return forced;
    }
    return deterministic(features.filter(function (feature) {
      return featureContainsPoint(feature, lat, lon);
    }));
  }

  function resolveLocation(data, lat, lon, forcedTag, jurisdictionTag) {
    var ranked = rankSeeds(data, lat, lon, jurisdictionTag);
    var boundary = boundaryFeatureAt(data, lat, lon, forcedTag, jurisdictionTag);
    var boundaryTag = boundary ? String(boundary.properties.tag).toLowerCase() : null;
    var primary = boundaryTag
      ? ranked.find(function (entry) { return entry.seed.tag === boundaryTag; }) || null
      : null;
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
      displayBoundary: boundaryTag && data.partitionByTag ? data.partitionByTag[boundaryTag] : null,
      insideBoundary: Boolean(boundary),
      hasMatch: Boolean(primary),
      sourceTier: boundary ? "generated" : null,
      coverageKm: 0
    };
  }

  function recommend(data, resolution, type, selectedMetros, selectedExternalPaths) {
    if (!resolution || !resolution.primary) return null;
    var primaryTag = resolution.primary.seed.tag;
    var carryTags = type === "high-site" && selectedMetros && selectedMetros.length
      ? selectedMetros
      : defaultRepeaterLeaves(data, primaryTag);
    carryTags = canonicalLeafOrder(data, carryTags);
    var externalPaths = type === "high-site"
      ? selectedExternalRegionPaths(data, selectedExternalPaths)
      : [];
    var tags = [];
    var parentOverrides = {};
    var notes = [];

    carryTags.forEach(function (tag) {
      tags = tags.concat(ancestryFor(data, tag));
    });
    externalPaths.forEach(function (record) {
      tags = tags.concat(record.path);
      record.path.forEach(function (tag) {
        parentOverrides[tag] = data.externalTagParents[tag];
      });
      if (record.status !== "documented") {
        notes.push("Confirm " + record.label + " tags with neighbouring operators before applying them.");
      }
    });
    tags = unique(tags);
    var paths = carryTags.map(function (tag) { return ancestryFor(data, tag); })
      .concat(externalPaths.map(function (record) { return record.path; }));
    var jurisdictions = unique(carryTags.map(function (tag) { return provinceTagFor(data, tag); }));
    var sharedArea = sharedRepeaterAreaForTag(data, primaryTag);

    var reviewTags = tags.filter(function (tag) {
      if (data.externalTagLabels && data.externalTagLabels[tag]) return false;
      var state = statusFor(data, tag).state;
      return state === "draft";
    });
    var deprecatedTags = tags.filter(function (tag) {
      if (data.externalTagLabels && data.externalTagLabels[tag]) return false;
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
      leaves: carryTags,
      paths: paths,
      jurisdictions: jurisdictions,
      sharedArea: sharedArea,
      externalPaths: externalPaths,
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
    if (parentOverrides && Object.prototype.hasOwnProperty.call(parentOverrides, tag)) {
      return parentOverrides[tag];
    }
    return parentFor(data, tag);
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
      return lines;
    }

    tags.forEach(function (tag) {
      var parent = effectiveParentFor(data, tag, parentOverrides);
      lines.push(parent ? "region put " + tag + " " + parent : "region put " + tag);
      if (firmware === "1.14") lines.push("region allowf " + tag);
    });
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

  function hierarchyLevelName(index, chain) {
    if (index === 0) return "Country";
    if (index === 1) return "Province / Territory";
    if (index === chain.length - 1) {
      return chain.length > 3 ? "Local Region" : "Region";
    }
    return "Area Group";
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
    if (tied.length > 1) {
      return {
        ambiguous: true,
        choices: tied.map(function (item) {
          var province = provinceTagFor(data, item.seed.tag);
          return labelFor(data, item.seed.tag) + (province ? ", " + province.toUpperCase() : "");
        })
      };
    }
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
      tag: best.seed.tag,
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
    if (localMatch && localMatch.ambiguous) {
      return Promise.reject(new Error("That name matches more than one region (" + localMatch.choices.join("; ") + "). Add a province or postal code."));
    }
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
    var primaryTag = state.resolution.primary.seed.tag;
    if (!state.selectedMetros.length) {
      state.selectedMetros = defaultRepeaterLeaves(data, primaryTag);
    }
    state.selectedExternalPaths = state.selectedExternalPaths || [];
    var sharedArea = sharedRepeaterAreaForTag(data, primaryTag);
    var requiredTags = unique([primaryTag].concat(sharedArea && sharedArea.defaultForMembers ? sharedArea.members : []));
    state.selectedMetros = canonicalLeafOrder(data, state.selectedMetros.concat(requiredTags));
    var nearbyTags = rankSeeds(data, state.lat, state.lon, null).slice(0, 6).map(function (entry) {
      return entry.seed.tag;
    });
    var visibleTags = canonicalLeafOrder(data, state.selectedMetros.concat(nearbyTags));
    var groups = (data.metroGroups || []).map(function (group) {
      return {
        label: group.label,
        tags: group.tags.filter(function (tag) { return visibleTags.indexOf(tag) !== -1; })
      };
    }).filter(function (group) { return group.tags.length; });
    var allGroups = (data.metroGroups || []).map(function (group) {
      return {
        label: group.label,
        tags: group.tags.filter(function (tag) { return visibleTags.indexOf(tag) === -1; })
      };
    }).filter(function (group) { return group.tags.length; });
    var sharedNote = sharedArea
      ? '<div class="mcc-shared-area-note"><strong>Shared repeater area</strong><span>' +
        esc(sharedArea.label) + " keeps " + esc(sharedArea.members.map(function (tag) {
          return labelFor(data, tag);
        }).join(" and ")) + " in one repeater configuration.</span></div>"
      : "";
    var externalChoices = (data.externalRegionPathList || []).map(function (record) {
      var checked = state.selectedExternalPaths.indexOf(record.id) !== -1 ? " checked" : "";
      var status = record.status === "documented" ? "community path" : "confirm locally";
      return '<label class="mcc-neighbour-path"><input type="checkbox" data-external-path value="' +
        esc(record.id) + '"' + checked + '><span><strong>' + esc(record.label) + '</strong><small><code>' +
        esc(record.path.join(" › ")) + "</code> · " + esc(status) + "</small></span></label>";
    }).join("");

    target.innerHTML = '<p class="mcc-hint">Add only the paths this repeater should forward. Different repeaters can carry different paths to spread traffic.</p>' +
      sharedNote +
      '<h3 class="mcc-picker-heading">Canadian regions</h3>' +
      '<p class="mcc-hint">Provinces and territories may be mixed.</p>' +
      '<div class="mcc-served-region-groups">' +
      groups.map(function (group) {
        return '<div class="mcc-chip-group"><strong>' + esc(group.label) + '</strong><div class="mcc-chip-list">' +
          group.tags.map(function (tag) {
            var checked = state.selectedMetros.indexOf(tag) !== -1 ? " checked" : "";
            var required = requiredTags.indexOf(tag) !== -1;
            return '<label class="mcc-chip' + (required ? " is-required" : "") + '"><input type="checkbox" data-canadian-region value="' +
              esc(tag) + '"' + checked + (required ? " disabled" : "") + '> <code>' + esc(tag) + "</code> " +
              esc(labelFor(data, tag)) + (required ? '<span class="mcc-chip-required">required</span>' : "") + "</label>";
          }).join("") +
          "</div></div>";
      }).join("") +
      '</div>' +
      '<label class="mcc-label mcc-add-region-label">Add any Canadian region</label>' +
      '<select class="mcc-select" data-action="add-served-region">' +
      '<option value="">Choose a region</option>' +
      allGroups.map(function (group) {
        return '<optgroup label="' + esc(group.label) + '">' + group.tags.map(function (tag) {
          return '<option value="' + esc(tag) + '">' + esc(labelFor(data, tag)) + " (" + esc(tag) + ")</option>";
        }).join("") + "</optgroup>";
      }).join("") +
      "</select>" +
      (externalChoices
        ? '<div class="mcc-neighbour-paths"><h3 class="mcc-picker-heading">Neighbouring network paths</h3>' +
          '<p class="mcc-hint">These paths were seen in Canada–U.S. routes. Nothing outside Canada is added to the boundary map.</p>' +
          '<div class="mcc-neighbour-path-list">' + externalChoices + "</div></div>"
        : "");

    target.querySelectorAll("input[data-canadian-region]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.selectedMetros = Array.prototype.slice.call(target.querySelectorAll("input[data-canadian-region]:checked")).map(function (item) {
          return item.value;
        });
        state.selectedMetros = canonicalLeafOrder(data, state.selectedMetros);
        onChange();
      });
    });
    target.querySelectorAll("input[data-external-path]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.selectedExternalPaths = Array.prototype.slice.call(target.querySelectorAll("input[data-external-path]:checked")).map(function (item) {
          return item.value;
        });
        onChange();
      });
    });
    var addRegion = target.querySelector("[data-action='add-served-region']");
    if (addRegion) {
      addRegion.addEventListener("change", function () {
        if (!addRegion.value) return;
        state.selectedMetros = canonicalLeafOrder(data, state.selectedMetros.concat(addRegion.value));
        renderMetroChips(data, target, state, onChange);
        onChange();
      });
    }
  }

  function renderResult(data, target, state) {
    if (!target) return;
    if (!state.canGenerate) {
      target.innerHTML = '<div class="mcc-empty-state">' +
        icon("radio-tower") +
        '<strong>No region yet</strong>' +
        '<span>Choose a location first.</span>' +
        '</div>';
      refreshIcons(target);
      return;
    }

    var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
    if (!rec) {
      target.innerHTML = '<div class="mcc-empty-state">' + icon("radio-tower") + '<strong>No region yet</strong></div>';
      refreshIcons(target);
      return;
    }
    if (rec.budget.tagCount > 32 || rec.budget.responseBytes > 172) {
      target.innerHTML = '<div class="mcc-empty-state">' +
        icon("triangle-alert") +
        '<strong>Too many regions selected</strong>' +
        '<span>This selection uses ' + esc(rec.budget.tagCount) + ' tags and ' + esc(rec.budget.responseBytes) + ' bytes. Remove regions until it fits the 32-tag and 172-byte limits.</span>' +
        '</div>';
      refreshIcons(target);
      return;
    }
    var firmware = state.firmware || data.meta.defaultFirmware || "1.16";
    var commands = buildCommands(data, rec.tags, firmware, state.includeBaseline, rec.parentOverrides);
    var technicalCommands = commands.concat(["region", "region save", "region"]);
    var titleTag = state.resolution.primary.seed.tag;
    var statusNotes = rec.notes.map(function (note) {
      var warning = note.indexOf("Check locally") === 0 || note.indexOf("Do not use") === 0 ||
        note.indexOf("Approximate") === 0 || note.indexOf("Confirm ") === 0 ||
        note.indexOf("Too many") === 0 || note.indexOf("Region names use") === 0;
      return '<div class="mcc-note' + (warning ? " mcc-note-warning" : "") + '">' + esc(note) + "</div>";
    }).join("");
    var firmwareLabel = firmware === "1.16" ? "v1.16+" : firmware === "1.15" ? "v1.15.x" : "v1.14.x";
    var guided = state.finishPath === "guided";
    var verificationCommands = ["region"];
    if (state.includeBaseline) verificationCommands.push("get radio");
    var expectedPaths = rec.paths.map(function (path) { return labelledPath(data, path); });
    var expectedPathMarkup = '<div class="mcc-region-path-list">' + expectedPaths.map(function (path) {
      return "<span>" + esc(path) + "</span>";
    }).join("") + "</div>";
    var multiProvince = rec.jurisdictions.length > 1;
    var scopeNotices = [];
    if (rec.sharedArea) {
      scopeNotices.push('<div class="mcc-shared-area-note"><strong>Shared repeater area</strong><span>' +
        esc(rec.sharedArea.label) + " combines " + esc(rec.sharedArea.members.map(function (tag) {
          return labelFor(data, tag);
        }).join(" and ")) + " in one repeater setup. All map boundaries remain separate.</span></div>");
    } else if (multiProvince) {
      scopeNotices.push('<div class="mcc-shared-area-note"><strong>Cross-province repeater setup</strong><span>' +
        esc(rec.jurisdictions.map(function (tag) { return labelFor(data, tag); }).join(" + ")) +
        ". Each map region keeps its own boundary.</span></div>");
    }
    if (rec.externalPaths.length) {
      scopeNotices.push('<div class="mcc-shared-area-note"><strong>Neighbouring network paths</strong><span>' +
        esc(rec.externalPaths.map(function (record) { return record.label; }).join(" + ")) +
        " is added to this repeater only. MeshCore Canada does not own or draw those boundaries.</span></div>");
    }
    var scopeNotice = scopeNotices.join("");
    var resultBody = guided
      ? '<div class="mcc-guide-panel">' +
        '<ol class="mcc-guide-steps">' +
        '<li class="mcc-guide-connect"><div><h4>Connect to the repeater CLI</h4><p>Use USB at the repeater or remote management over LoRa.</p>' +
        '<div class="mcc-connect-methods">' +
        '<section class="mcc-connect-method"><div class="mcc-connect-method-head">' + icon("usb") + '<div><h5>USB serial</h5><small>At the repeater</small></div></div>' +
        '<ol><li>Connect the repeater to a computer with a data-capable USB cable.</li>' +
        '<li>In desktop Chrome or Edge, open the <a href="https://meshcore.io/flasher" target="_blank" rel="noopener">MeshCore Flasher</a>. For Gessaman\'s MQTT Observer firmware, use the <a href="https://observer.gessaman.com/" target="_blank" rel="noopener">MeshCore Observer Flasher</a> instead.</li>' +
        '<li>Choose <strong>Console</strong>, then approve the repeater\'s serial or COM port when the browser asks.</li></ol></section>' +
        '<section class="mcc-connect-method"><div class="mcc-connect-method-head">' + icon("radio-tower") + '<div><h5>Remote over LoRa</h5><small>Through a companion radio</small></div></div>' +
        '<ol><li>On a phone or computer, connect the <a href="https://meshcore.io/" target="_blank" rel="noopener">official MeshCore app</a> to your companion radio.</li>' +
        '<li>Open <strong>Contacts</strong>, select the repeater, then choose <strong>Remote Management</strong> from its menu.</li>' +
        '<li>Enter the repeater admin password, tap <strong>Log In</strong>, then open <strong>Command Line</strong>.</li></ol>' +
        '<p class="mcc-connect-note">If the repeater is missing, open Tools → Discover Nearby Nodes. If a wait timer appears, let it finish before logging in.</p></section>' +
        '</div></div></li>' +
        '<li><div><h4>Confirm the command line</h4><p>Run <code>ver</code> and check the version.</p>' +
        '<button type="button" class="mcc-command-line" data-cmd="ver"><span>ver</span><em>' + icon("copy") + 'Copy</em></button></div></li>' +
        '<li><div><h4>Apply the settings</h4><p>Run each line in order. Wait for a reply.</p>' +
        '<div class="mcc-guide-command-list">' + commands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + 'Copy</em></button>';
        }).join("") + '</div><p class="mcc-guide-stop">Stop on <code>Err</code>. Existing regions are not cleared.</p></div></li>' +
        '<li><div><h4>Check and save</h4><p>Run <code>region</code> and confirm each path:</p>' +
        expectedPathMarkup +
        '<div class="mcc-guide-command-list"><button type="button" class="mcc-command-line" data-cmd="region"><span>region</span><em>' + icon("copy") + 'Copy</em></button></div>' +
        '<p>Save:</p>' +
        '<div class="mcc-guide-command-list"><button type="button" class="mcc-command-line" data-cmd="region save"><span>region save</span><em>' + icon("copy") + 'Copy</em></button></div>' +
        '<p>' + (state.includeBaseline
          ? 'Restart the device, reconnect, then run these final checks:'
          : 'Run this once more to confirm the saved region:') + '</p>' +
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

    var sourceBadge = '<span class="mcc-source-tier mcc-source-tier-' + esc(state.resolution.sourceTier || "unknown") + '">' +
      (state.resolution.sourceTier === "generated" ? "Canada-wide region boundary" : "Boundary unavailable") + '</span>';
    var ancestryMarkup = '<div class="mcc-ancestry" aria-label="Region tags">' +
      rec.tags.map(function (tag) {
        var external = Boolean(data.externalTagLabels && data.externalTagLabels[tag]);
        var stateName = external ? "external" : statusFor(data, tag).state || "draft";
        return '<span class="mcc-tag-pill' + (stateName === "draft" ? " is-draft" : "") +
          (external ? " is-external" : "") + '"><code>' + esc(tag) + "</code></span>";
      }).join("") +
      "</div>";
    var metaMarkup = '<dl class="mcc-result-meta">' +
      '<div><dt>Firmware</dt><dd>' + esc(firmwareLabel) + '</dd></div>' +
      '<div><dt>Region budget</dt><dd>' + esc(rec.budget.tagCount) + ' / 32 tags · ' +
      esc(rec.budget.responseBytes) + ' / 172 bytes</dd></div>' +
      '</dl>';
    var technicalDetails = guided
      ? '<details class="mcc-advanced-options mcc-result-advanced"><summary>Advanced details</summary>' + sourceBadge + ancestryMarkup + metaMarkup + '</details>'
      : sourceBadge + ancestryMarkup + metaMarkup;

    target.innerHTML =
      '<div class="mcc-result-console">' +
      '<div class="mcc-result-head">' +
      '<div>' +
      '<h3 class="mcc-result-title"><code>' + esc(titleTag.toUpperCase()) + "</code> — " + esc(labelFor(data, titleTag)) + "</h3>" +
      '<div class="mcc-result-sub">' + esc(state.name || labelFor(data, titleTag)) + "</div>" +
      '<div class="mcc-region-path"><strong>' + (rec.paths.length > 1 ? "Repeater regions:" : "Your region:") + "</strong>" +
      expectedPathMarkup + "</div>" +
      '</div>' +
      (!guided ? '<button type="button" class="mcc-button mcc-copy-all">' + icon("copy") + 'Copy commands</button>' : '') +
      '</div>' +
      scopeNotice +
      technicalDetails +
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
    var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
    if (!rec) return null;
    if (rec.budget.tagCount > 32 || rec.budget.responseBytes > 172) return null;
    var firmware = state.firmware || data.meta.defaultFirmware || "1.16";
    return buildCommands(data, rec.tags, firmware, state.includeBaseline, rec.parentOverrides)
      .concat(["region", "region save", "region"]);
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
    var sharedArea = sharedRepeaterAreaForTag(data, tag);
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
      (sharedArea
        ? '<div><dt>Repeater area</dt><dd>' + esc(sharedArea.label) + " · " +
          esc(sharedArea.members.map(function (member) { return labelFor(data, member); }).join(" + ")) + "</dd></div>"
        : "") +
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
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag);
      if (state.resolution && state.resolution.primary) {
        state.detailTag = state.resolution.primary.seed.tag;
      }
    }
    renderCandidateList(data, els.candidates, state, function (tag) {
      state.forcedTag = tag;
      state.selectedMetros = [];
      state.selectedExternalPaths = [];
      refreshTool(data, els, state, afterRefresh);
    });
    renderMetroChips(data, els.metro, state, function () {
      renderResult(data, els.result, state);
      renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
      if (afterRefresh) afterRefresh();
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
      '<label class="mcc-label" for="mcc-location-input">City, airport code, or postal code</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-location-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '<p class="mcc-search-privacy">Search uses OpenStreetMap and geocoder.ca. Or click the map.</p>' +
      '<div data-role="status"></div>' +
      '<div class="mcc-selected-region" data-role="selected-region" hidden></div>' +
      '<details class="mcc-alternate-regions" data-role="region-browser" hidden>' +
      '<summary>Choose a different region</summary>' +
      '<div class="mcc-region-breadcrumbs" data-role="config-region-breadcrumbs"></div>' +
      '<div class="mcc-region-children" data-role="config-region-children"></div>' +
      '</details>' +
      '<div class="mcc-wizard-actions">' +
      '<a class="mcc-button mcc-button-secondary" data-action="view-map" href="' + esc(regionPageHref("map")) + '" hidden>' + icon("map") + 'View on map</a>' +
      '<button class="mcc-button" type="button" data-next-step disabled>Next' + icon("arrow-right") + '</button>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="2" hidden>' +
      '<p class="mcc-step-label">Step 2 of 4</p>' +
      '<h2>Use recommended settings?</h2>' +
      '<div class="mcc-choice-list mcc-choice-list-large" data-role="device-path" role="group" aria-label="Recommended radio settings">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-device-path" value="new" checked><span><strong>Yes — apply defaults</strong></span></label>' +
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
      '<h2>Installation site</h2>' +
      '<div class="mcc-choice-list" data-role="types" role="group" aria-label="Repeater installation type">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="residential" checked><span><strong>Home or portable</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="urban"><span><strong>Rooftop or tower</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="high-site"><span><strong>Large or cross-border coverage</strong><small>Choose forwarding paths</small></span></label>' +
      '</div>' +
      '<div data-role="metro"></div>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button><button class="mcc-button" type="button" data-next-step>Next' + icon("arrow-right") + '</button></div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="4" hidden>' +
      '<p class="mcc-step-label">Step 4 of 4</p>' +
      '<h2>Finish setup</h2>' +
      '<div class="mcc-finish-paths" role="group" aria-label="Choose setup instructions">' +
      '<button type="button" class="mcc-finish-path is-active" data-finish-path="guided" aria-pressed="true">' + icon("list-checks") + '<span><strong>Guide me</strong><small>Step-by-step help</small></span></button>' +
      '<button type="button" class="mcc-finish-path" data-finish-path="technical" aria-pressed="false">' + icon("terminal") + '<span><strong>Copy commands</strong><small>All commands at once</small></span></button>' +
      '</div>' +
      '<div data-role="result"><p class="mcc-result-empty">Choose a location first.</p></div>' +
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
      jurisdictionTag: null,
      type: "residential",
      firmware: data.meta.defaultFirmware || "1.16",
      includeBaseline: true,
      selectedMetros: [],
      selectedExternalPaths: [],
      canGenerate: false,
      resolution: null,
      browseTag: data.meta.rootTag || "can",
      finishPath: "guided",
      wizardStep: 1,
      maxStep: 1
    };
    var els = {
      input: el.querySelector("#mcc-location-input"),
      locate: el.querySelector("[data-action='locate']"),
      status: el.querySelector("[data-role='status']"),
      selectedRegion: el.querySelector("[data-role='selected-region']"),
      regionBrowser: el.querySelector("[data-role='region-browser']"),
      breadcrumbs: el.querySelector("[data-role='config-region-breadcrumbs']"),
      children: el.querySelector("[data-role='config-region-children']"),
      candidatesSection: null,
      candidates: null,
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
        setStatus(els.status, "Choose a location first.", "error");
        return;
      }
      state.maxStep = Math.max(state.maxStep, Math.min(4, state.wizardStep + 1));
      showStep(state.wizardStep + 1);
    }

    function renderConfigRegionBrowser(tag) {
      if (!data.hierarchy[tag]) tag = data.meta.rootTag || "can";
      state.browseTag = tag;
      var selectedTag = state.resolution && state.resolution.primary
        ? state.resolution.primary.seed.tag
        : null;
      var sharedArea = selectedTag ? sharedRepeaterAreaForTag(data, selectedTag) : null;
      if (els.selectedRegion) {
        els.selectedRegion.hidden = !selectedTag;
        els.selectedRegion.innerHTML = selectedTag
          ? '<strong>Your home region</strong><span>' + esc(ancestryFor(data, selectedTag).map(function (item) {
            return labelFor(data, item);
          }).join(" › ")) + '</span>' +
            (sharedArea ? '<span class="mcc-selected-shared-area">Shared repeater area: ' + esc(sharedArea.label) + "</span>" : "")
          : "";
      }
      if (els.regionBrowser) els.regionBrowser.hidden = !selectedTag;
      if (!els.breadcrumbs || !els.children) return;

      var path = ancestryFor(data, tag);
      els.breadcrumbs.innerHTML = path.map(function (item, index) {
        var current = index === path.length - 1;
        return '<button type="button" class="mcc-region-crumb' + (current ? ' is-current' : '') + '" data-config-region-node="' + esc(item) + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(labelFor(data, item)) + '</button>';
      }).join('<span aria-hidden="true">›</span>');

      var children = childrenFor(data, tag);
      els.children.innerHTML = children.length
        ? children.map(function (child) {
          var nested = childrenFor(data, child).length > 0;
          var leafCount = leafDescendants(data, child).length;
          return '<button type="button" class="mcc-region-child" data-config-region-node="' + esc(child) + '">' +
            '<span><strong>' + esc(labelFor(data, child)) + '</strong><small>' +
            (nested ? leafCount + ' subregions' : child.toUpperCase() + ' · region') +
            '</small></span><span aria-hidden="true">' + (nested ? '›' : '✓') + '</span></button>';
        }).join("")
        : '<p class="mcc-help">Used for your settings.</p>';
    }

    function chooseConfigRegionNode(tag) {
      var children = childrenFor(data, tag);
      renderConfigRegionBrowser(tag);
      if (!children.length) {
        var seed = seedForTag(data, tag);
        if (seed) {
          useGeo({ lat: seed.lat, lon: seed.lon, name: labelFor(data, tag), countryCode: "ca", tag: tag });
        }
      }
    }

    function useGeo(geo) {
      state.lat = geo.lat;
      state.lon = geo.lon;
      state.name = geo.name;
      state.forcedTag = geo.tag || null;
      state.jurisdictionTag = state.forcedTag
        ? provinceTagFor(data, state.forcedTag)
        : jurisdictionTagFromGeo(geo);
      state.selectedMetros = [];
      state.selectedExternalPaths = [];
      if (!isCanada(geo)) {
        state.canGenerate = false;
        state.resolution = null;
        if (els.selectedRegion) els.selectedRegion.hidden = true;
        if (els.regionBrowser) els.regionBrowser.hidden = true;
        setStatus(els.status, "This location is outside Canada.", "warning");
        refreshTool(data, els, state);
        return;
      }
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag);
      if (!state.resolution.hasMatch) {
        state.canGenerate = false;
        if (els.selectedRegion) els.selectedRegion.hidden = true;
        if (els.regionBrowser) els.regionBrowser.hidden = true;
        setStatus(els.status, "No region found here. Try a nearby city.", "warning");
      } else {
        state.canGenerate = true;
        state.maxStep = Math.max(state.maxStep, 2);
        setStatus(els.status, "Region found.", "info");
        renderConfigRegionBrowser(state.resolution.primary.seed.tag);
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
        setStatus(els.status, "Enter a city, airport code, or postal code.", "error");
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
    if (els.breadcrumbs) {
      els.breadcrumbs.addEventListener("click", function (event) {
        var button = event.target.closest("[data-config-region-node]");
        if (button) chooseConfigRegionNode(button.getAttribute("data-config-region-node"));
      });
    }
    if (els.children) {
      els.children.addEventListener("click", function (event) {
        var button = event.target.closest("[data-config-region-node]");
        if (button) chooseConfigRegionNode(button.getAttribute("data-config-region-node"));
      });
    }
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
        state.selectedExternalPaths = [];
        refreshTool(data, els, state, updateMapLinks);
        updateMapLinks();
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
      '<div class="mcc-map-shell">' +
      '<aside class="mcc-map-panel">' +
      '<div class="mcc-panel-header">' +
      '<h2>Find a region</h2>' +

      '<a class="mcc-button mcc-button-secondary" href="' + esc(regionPageHref("config")) + '">' + icon("list-checks") + 'Setup</a>' +
      '</div>' +
      '<section class="mcc-card mcc-card-compact">' +
      '<h2>Browse regions</h2>' +
      '<div class="mcc-region-breadcrumbs" data-role="region-breadcrumbs"></div>' +
      '<div class="mcc-region-children" data-role="region-children"></div>' +
      '</section>' +
      '<section class="mcc-card mcc-card-compact">' +
      '<h2>Choose a location</h2>' +
      '<label class="mcc-label" for="mcc-map-location-input">City, airport code, or postal code</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-map-location-input" data-role="map-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="map-locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '<p class="mcc-search-privacy">Search uses OpenStreetMap and geocoder.ca. Or click the map.</p>' +
      '<div data-role="map-status"></div>' +
      '</section>' +
      '<section class="mcc-card mcc-dynamic-card" data-role="map-result-section" hidden>' +
      '<h2>Selected region</h2>' +
      '<div data-role="map-result"><p class="mcc-result-empty">Choose a location.</p></div>' +
      '</section>' +
      '<details class="mcc-card mcc-map-options">' +
      '<summary>Settings</summary>' +
      '<div class="mcc-choice-list" role="group" aria-label="Repeater installation type">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-map-type" value="residential" checked><span><strong>Home or portable</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-map-type" value="urban"><span><strong>Rooftop or tower</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-map-type" value="high-site"><span><strong>Large or cross-border coverage</strong><small>Choose forwarding paths</small></span></label>' +
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

    var mapParams = new URLSearchParams(window.location.search);
    var requestedLargeCoverage = mapParams.get("type") === "large";
    var requestedCanadianRegions = canonicalLeafOrder(
      data,
      String(mapParams.get("regions") || "").split(",").map(slug).filter(Boolean)
    );
    var requestedExternalPaths = selectedExternalRegionPaths(
      data,
      String(mapParams.get("external") || "").split(",").map(slug).filter(Boolean)
    ).map(function (record) { return record.id; });
    var state = {
      lat: null,
      lon: null,
      name: "",
      forcedTag: null,
      jurisdictionTag: null,
      type: requestedLargeCoverage ? "high-site" : "residential",
      firmware: data.meta.defaultFirmware || "1.16",
      includeBaseline: true,
      selectedMetros: [],
      selectedExternalPaths: [],
      canGenerate: false,
      resolution: null,
      detailTag: null,
      browseTag: data.meta.rootTag || "can"
    };
    var els = {
      input: el.querySelector("[data-role='map-input']"),
      locate: el.querySelector("[data-action='map-locate']"),
      status: el.querySelector("[data-role='map-status']"),
      breadcrumbs: el.querySelector("[data-role='region-breadcrumbs']"),
      children: el.querySelector("[data-role='region-children']"),
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
    var initialTypeInput = el.querySelector("input[name='mcc-map-type'][value='" + state.type + "']");
    if (initialTypeInput) initialTypeInput.checked = true;

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

      var partitionLayer = L.geoJSON(data.partitionRegions, {
        style: function (feature) {
          return {
            color: "#aeb8ff",
            opacity: 0.8,
            weight: 1,
            fillColor: colorForTag(feature.properties.tag),
            fillOpacity: 0.2
          };
        },
        onEachFeature: function (feature, layer) {
          layer.bindTooltip('<strong>' + esc(feature.properties.tag.toUpperCase()) + '</strong> - ' + esc(feature.properties.label));
          layer.on("click", function (event) {
            if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
            useGeo({
              lat: event.latlng.lat,
              lon: event.latlng.lng,
              name: feature.properties.label,
              countryCode: "ca"
            }, false, feature.properties.tag);
          });
        }
      }).addTo(map);
      var browseLayer = L.geoJSON(null, {
        interactive: false,
        style: { color: "#ffd166", opacity: 1, weight: 3, fillColor: "#ffd166", fillOpacity: 0.12 }
      }).addTo(map);
      var selectedLayer = L.geoJSON(null, {
        interactive: false,
        style: { color: "#ffffff", opacity: 1, weight: 4, fillColor: "#4287ff", fillOpacity: 0.38 }
      }).addTo(map);

      function updateBoundaryHighlight() {
        selectedLayer.clearLayers();
        var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
        if (rec) {
          selectedLayer.addData({
            type: "FeatureCollection",
            features: rec.leaves.map(function (tag) { return data.partitionByTag[tag]; }).filter(Boolean)
          });
          selectedLayer.bringToFront();
        }
      }
      afterMapRefresh = updateBoundaryHighlight;

      function renderRegionBrowser(tag, fitSelection) {
        if (!data.hierarchy[tag]) tag = data.meta.rootTag || "can";
        state.browseTag = tag;
        var path = ancestryFor(data, tag);
        els.breadcrumbs.innerHTML = path.map(function (item, index) {
          var current = index === path.length - 1;
          return '<button type="button" class="mcc-region-crumb' + (current ? ' is-current' : '') + '" data-region-node="' + esc(item) + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(labelFor(data, item)) + '</button>';
        }).join('<span aria-hidden="true">›</span>');

        var children = childrenFor(data, tag);
        if (children.length) {
          els.children.innerHTML = children.map(function (child) {
            var nested = childrenFor(data, child).length > 0;
            var leafCount = leafDescendants(data, child).length;
            return '<button type="button" class="mcc-region-child" data-region-node="' + esc(child) + '">' +
              '<span><strong>' + esc(labelFor(data, child)) + '</strong><small>' +
              (nested ? leafCount + ' subregions' : child.toUpperCase() + ' · region') +
              '</small></span><span aria-hidden="true">' + (nested ? '›' : '✓') + '</span></button>';
          }).join("");
        } else {
          els.children.innerHTML = '<p class="mcc-help">Used for lookup and commands.</p>';
        }

        browseLayer.clearLayers();
        if (tag !== (data.meta.rootTag || "can")) {
          browseLayer.addData(featuresForNode(data, tag));
          browseLayer.bringToFront();
          selectedLayer.bringToFront();
          if (fitSelection && browseLayer.getBounds().isValid()) {
            map.fitBounds(browseLayer.getBounds(), { padding: [28, 28], maxZoom: children.length ? 6 : 8 });
          }
        } else if (fitSelection) {
          fitCanada();
        }
      }

      function chooseRegionNode(tag) {
        var children = childrenFor(data, tag);
        renderRegionBrowser(tag, true);
        if (!children.length) {
          var seed = data.seeds.find(function (entry) { return entry.tag === tag; });
          if (seed) {
            useGeo({ lat: seed.lat, lon: seed.lon, name: labelFor(data, tag), countryCode: "ca" }, false, tag);
          }
        }
      }

      els.breadcrumbs.addEventListener("click", function (event) {
        var button = event.target.closest("[data-region-node]");
        if (button) chooseRegionNode(button.getAttribute("data-region-node"));
      });
      els.children.addEventListener("click", function (event) {
        var button = event.target.closest("[data-region-node]");
        if (button) chooseRegionNode(button.getAttribute("data-region-node"));
      });
      renderRegionBrowser(state.browseTag, false);

      var marker = null;
      function place(lat, lon) {
        if (marker) marker.setLatLng([lat, lon]);
        else marker = L.marker([lat, lon]).addTo(map);
      }

      function useGeo(geo, recenter, forcedTag) {
        state.lat = Number(geo.lat);
        state.lon = Number(geo.lon);
        state.name = geo.name || (state.lat.toFixed(4) + ", " + state.lon.toFixed(4));
        state.forcedTag = forcedTag || geo.tag || null;
        state.jurisdictionTag = state.forcedTag
          ? provinceTagFor(data, state.forcedTag)
          : jurisdictionTagFromGeo(geo);
        state.selectedMetros = [];
        state.selectedExternalPaths = [];
        place(state.lat, state.lon);
        if (!isCanada(geo)) {
          state.forcedTag = null;
          state.canGenerate = false;
          state.detailTag = null;
          state.resolution = null;
          setStatus(els.status, "Outside Canada.", "warning");
        } else {
          state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag);
          state.canGenerate = state.resolution.hasMatch;
          state.detailTag = state.canGenerate ? state.resolution.primary.seed.tag : null;
          if (state.canGenerate) {
            setStatus(els.status, state.detailTag.toUpperCase() + " — " + labelFor(data, state.detailTag), "info");
            renderRegionBrowser(state.detailTag, false);
          } else {
            setStatus(els.status, "No region here.", "warning");
          }
        }
        refreshTool(data, els, state, updateBoundaryHighlight);
        if (recenter) {
          if (state.resolution && state.resolution.displayBoundary) {
            var selectedBounds = L.geoJSON(state.resolution.displayBoundary).getBounds();
            if (selectedBounds.isValid()) map.fitBounds(selectedBounds, { padding: [28, 28], maxZoom: 9 });
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
        state.jurisdictionTag = null;
        state.selectedMetros = [];
        state.selectedExternalPaths = [];
        state.canGenerate = false;
        state.resolution = null;
        state.detailTag = null;
        place(state.lat, state.lon);
        setStatus(els.status, "Choose a mapped point in Canada.", "warning");
        refreshTool(data, els, state, updateBoundaryHighlight);
        if (recenter) map.setView([state.lat, state.lon], Math.max(map.getZoom(), 8));
      }

      function verifyAndUseGeo(lat, lon, name, recenter, forcedTag) {
        var boundary = boundaryFeatureAt(data, Number(lat), Number(lon), forcedTag, null);
        if (!boundary) {
          rejectUnverifiedPoint(lat, lon, name, recenter);
          return Promise.resolve();
        }
        var tag = String(boundary.properties.tag).toLowerCase();
        useGeo({
          lat: Number(lat),
          lon: Number(lon),
          name: name || labelFor(data, tag),
          countryCode: "ca",
          tag: tag
        }, recenter, tag);
        return Promise.resolve();
      }

      function locate() {
        var query = els.input.value.trim();
        if (!query) {
          setStatus(els.status, "Enter a city, airport code, or postal code.", "error");
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

      var initialLatRaw = mapParams.get("lat");
      var initialLonRaw = mapParams.get("lon");
      var initialLat = initialLatRaw === null || initialLatRaw.trim() === "" ? NaN : Number(initialLatRaw);
      var initialLon = initialLonRaw === null || initialLonRaw.trim() === "" ? NaN : Number(initialLonRaw);
      var hasInitialLocation = Number.isFinite(initialLat) && Number.isFinite(initialLon);
      if (hasInitialLocation) {
        var initialName = mapParams.get("name") || (initialLat.toFixed(4) + ", " + initialLon.toFixed(4));
        els.input.value = initialName;
        verifyAndUseGeo(initialLat, initialLon, initialName, true, mapParams.get("tag")).then(function () {
          if (!requestedLargeCoverage || !state.canGenerate) return;
          state.type = "high-site";
          state.selectedMetros = requestedCanadianRegions;
          state.selectedExternalPaths = requestedExternalPaths;
          refreshTool(data, els, state, updateBoundaryHighlight);
          if (selectedLayer.getBounds().isValid()) {
            map.fitBounds(selectedLayer.getBounds(), { padding: [28, 28], maxZoom: 8 });
          }
        });
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
        state.selectedExternalPaths = [];
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
    return (data.consolidatedRegionTags || Object.keys(data.hierarchy)).map(function (tag) {
      var item = data.hierarchy[tag];
      var st = statusFor(data, tag);
      var seed = seedForTag(data, tag);
      var hasGeneratedBoundary = Boolean(seed);
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
        sourceTier: hasGeneratedBoundary ? "generated" : "grouping",
        boundaryType: hasGeneratedBoundary ? "generated-partition" : "derived-parent",
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
          "<td>Canada-wide</td>" +
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
      '<h2>Canadian regions</h2>' +
      '<div class="mcc-dashboard-actions">' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("config")) + '">' + icon("list-checks") + '<span><strong>Setup</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("map")) + '">' + icon("map") + '<span><strong>Map</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("standard")) + '">' + icon("book-open-check") + '<span><strong>Standard</strong></span></a>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-stat-grid" aria-label="Region status summary">' +
      '<div class="mcc-stat"><span>Regions</span><strong>' + data.regionCounts.total + '</strong></div>' +
      '<div class="mcc-stat"><span>Local regions</span><strong>' + data.regionCounts.generated + '</strong></div>' +
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
    nodes.forEach(function (node) {
      if (!node.isConnected || node.dataset.mccReady === "1" || node.dataset.mccLoading === "1") return;
      var mode = node.getAttribute("data-mcc-regions");
      node.dataset.mccLoading = "1";
      node.innerHTML = '<div class="mcc-status mcc-status-info" role="status">Loading Canadian regions…</div>';
      loadData(mode).then(function (data) {
        if (!node.isConnected) return;
        delete node.dataset.mccLoading;
        node.dataset.mccReady = "1";
        if (mode === "config") initConfig(node, data);
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
