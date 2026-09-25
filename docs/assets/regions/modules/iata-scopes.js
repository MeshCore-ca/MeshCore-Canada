(function (root, factory) {
  "use strict";
  root.MeshCoreIataScopes = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MAX_REGIONS = 32;
  var MAX_COMMAND_BYTES = 160;
  var MAX_RESPONSE_BYTES = 160;

  function bytes(value) {
    return typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(String(value)).length
      : unescape(encodeURIComponent(String(value))).length;
  }

  function unique(values) { return Array.from(new Set(values)); }

  function city(data, tag) {
    var record = data.hierarchy && data.hierarchy[tag];
    return record && record.kind === "city" ? record : null;
  }

  function budget(tags, parents) {
    // `region` and `region def` export into a 160-byte buffer in CommonCLI.
    // Include indentation, flags/newlines, the root, one home marker, and NUL.
    var responseBytes = 6;
    tags.forEach(function (tag) {
      if (!/^[a-z0-9-]{1,29}$/.test(tag)) throw new Error("Invalid scope name: " + tag);
      var seen = new Set([tag]);
      var depth = 1;
      var parent = parents && parents[tag];
      while (parent) {
        if (seen.has(parent) || tags.indexOf(parent) === -1) throw new Error("Invalid scope parent: " + tag);
        seen.add(parent);
        depth += 1;
        parent = parents[parent];
      }
      responseBytes += depth + bytes(tag) + 3;
    });
    return { tagCount: tags.length, responseBytes: responseBytes, maxTags: MAX_REGIONS, maxResponseBytes: MAX_RESPONSE_BYTES };
  }

  function profile(data, selection) {
    var home = String(selection.home || "").toLowerCase();
    if (!city(data, home)) throw new Error("Choose an IATA region from the map.");
    var province = String(selection.province || "").toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(data.policy.provinces, province)) throw new Error("Choose the province or territory where the repeater is installed.");
    var bridge = selection.bridge === true;
    var extra = unique(selection.cities || []).filter(function (tag) { return tag !== home; });
    extra.forEach(function (tag) {
      if (!city(data, tag)) throw new Error("Unknown IATA region: " + tag);
    });
    var external = unique(selection.external || []).map(function (id) {
      var record = data.externalRegionPaths && data.externalRegionPaths[id];
      if (!record || record.automatic !== false || record.geographic !== false) throw new Error("Unknown neighbouring network: " + id);
      return Object.assign({ id: id, status: record.authority && record.authority.status || "provisional" }, record);
    });
    if (!bridge && (extra.length || external.length)) throw new Error("Choose edge mode before adding other zones.");
    var cities = [home].concat(extra.sort());
    var meshScopes = Object.keys(data.policy.meshScopes).filter(function (scope) {
      return data.policy.meshScopes[scope].indexOf(province) !== -1;
    });
    var tags = unique(cities.concat([province], meshScopes, [data.policy.reservedScope]));
    var canadianTags = tags.slice();
    var parents = {};
    tags.forEach(function (tag) { parents[tag] = null; });
    external.forEach(function (record) {
      record.path.forEach(function (tag, index) {
        if (Object.prototype.hasOwnProperty.call(parents, tag) && parents[tag] !== (index ? record.path[index - 1] : null)) {
          throw new Error("Conflicting scope parent: " + tag);
        }
        parents[tag] = index ? record.path[index - 1] : null;
        tags.push(tag);
      });
    });
    tags = unique(tags);
    var limits = budget(tags, parents);
    var notes = [];
    if (city(data, home).provinces.indexOf(province) === -1) {
      notes.push("Confirm the repeater province: it differs from this zone's usual province.");
    }
    external.forEach(function (record) {
      if (record.status !== "documented") notes.push("Confirm " + record.label + " tags with neighbouring operators before applying them.");
    });
    return {
      home: home, province: province, bridge: bridge,
      tags: tags, leaves: cities, jurisdictions: [province],
      paths: canadianTags.map(function (tag) { return [tag]; })
        .concat(external.map(function (record) { return record.path; })),
      externalPaths: external, parentOverrides: parents,
      sharedArea: null, budget: limits, notes: notes,
      companionDefault: meshScopes[0] || null,
      reservedScope: data.policy.reservedScope,
    };
  }

  function definitionCommands(result, firmware) {
    if (result.budget.tagCount > MAX_REGIONS || result.budget.responseBytes > MAX_RESPONSE_BYTES) {
      throw new Error("Too many scopes to configure and verify safely.");
    }
    var tokens = result.tags.map(function (tag, index) {
      if (index === result.tags.length - 1) return tag;
      var nextParent = result.parentOverrides[result.tags[index + 1]] || "*";
      return nextParent === tag ? tag : tag + "|" + nextParent;
    });
    var line = "region def " + tokens.join(" ");
    if (firmware === "1.16" && bytes(line) <= MAX_COMMAND_BYTES) return [line];
    var lines = [];
    result.tags.forEach(function (tag) {
      lines.push("region put " + tag + (result.parentOverrides[tag] ? " " + result.parentOverrides[tag] : ""));
      if (firmware === "1.14" || firmware === "1.10") lines.push("region allowf " + tag);
    });
    return lines;
  }

  function commands(result, firmware) {
    firmware = firmware || "1.16";
    if (["1.10", "1.14", "1.15", "1.16"].indexOf(firmware) === -1) throw new Error("Choose a supported firmware version.");
    var lines = definitionCommands(result, firmware).concat([result.bridge ? "region denyf *" : "region allowf *"]);
    if (firmware === "1.15" || firmware === "1.16") lines.push("region default " + result.home);
    return lines;
  }

  function standardCommands(firmware, includeHash) {
    if (["1.10", "1.14", "1.15", "1.16"].indexOf(firmware) === -1) throw new Error("Choose a supported firmware version.");
    var lines = includeHash !== false && firmware !== "1.10" ? ["set path.hash.mode 2"] : [];
    return lines.concat(["set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16"]);
  }

  function pointInRing(point, ring) {
    var inside = false;
    var x = point[0], y = point[1];
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var a = ring[i], b = ring[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  function contains(feature, lat, lon) {
    if (!feature || !feature.geometry || !Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    var geometry = feature.geometry;
    var polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    return polygons.some(function (rings) {
      return rings.length && pointInRing([lon, lat], rings[0]) && !rings.slice(1).some(function (ring) { return pointInRing([lon, lat], ring); });
    });
  }

  function matches(collection, lat, lon) {
    return collection.features.filter(function (feature) { return contains(feature, lat, lon); });
  }

  function provinceAt(collection, lat, lon) {
    var found = matches(collection, lat, lon);
    return found.length === 1 ? found[0].properties.tag : null;
  }

  return { profile: profile, commands: commands, standardCommands: standardCommands, budget: budget, contains: contains, matches: matches, provinceAt: provinceAt,
    maxTags: MAX_REGIONS, maxResponseBytes: MAX_RESPONSE_BYTES, maxCommandBytes: MAX_COMMAND_BYTES };
}));
