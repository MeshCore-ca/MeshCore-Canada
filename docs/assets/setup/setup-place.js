// Place lookups for the guided repeater setup tool: which region and province a
// town is in, which regions border it, which radio settings apply and which
// cross-border networks to offer. Pure data logic. No DOM and no text shown to
// people (see setup-text.js).
//
// MeshCoreIataScopes and MeshCorePlaceSearch are looked up when a function runs,
// not when this script loads, so a page that only reads data (the explainer) can
// load this file without place-search.js.
(function () {
  "use strict";

  // Cross-border networks by province. The catalogue records no provinces for
  // them, so this is fixed here. `shared` ones are offered to any repeater in the
  // province; `edgeOnly` ones only make sense for an edge repeater next to the border.
  // Every id is a key of the catalogue's `externalRegionPaths`.
  var CROSS_BORDER = {
    on: { shared: ["ontario-new-york"], edgeOnly: ["ohio", "pennsylvania", "western-new-york"] },
    qc: { shared: ["quebec-new-york"], edgeOnly: [] },
    bc: { shared: [], edgeOnly: ["oregon", "washington"] }
  };

  var vertexIndexes = new WeakMap();

  function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  // Case, accent and spacing differences do not matter when typing a town or alias.
  function fold(value) {
    return String(value == null ? "" : value).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  async function fetchJson(fetcher, url, init, unavailable) {
    var response = await fetcher(url, init);
    if (!response || !response.ok) throw new Error(unavailable);
    return response.json();
  }

  function featureCollection(value, invalid) {
    if (!value || value.type !== "FeatureCollection" || !Array.isArray(value.features)) throw new Error(invalid);
    return value;
  }

  // Loads the same files, at the same cache-keyed URLs, as the scopes picker.
  // `baseUrl` is any URL inside docs/assets/setup/ (normally this script's own).
  async function loadData(baseUrl, fetcher) {
    var get = fetcher || globalThis.fetch;
    var catalog = await fetchJson(get, new URL("../regions/iata-regions.json", baseUrl), { cache: "no-cache" }, "Region catalogue unavailable");
    if (!catalog || !catalog.hierarchy || !catalog.aliases || !catalog.profiles || !catalog.source) throw new Error("Invalid region catalogue");
    function geometryUrl(name, hash) {
      var url = new URL("../regions/" + name, baseUrl);
      if (hash) url.searchParams.set("v", hash);
      return url;
    }
    var loaded = await Promise.all([
      fetchJson(get, geometryUrl("iata-boundaries.geojson", catalog.source.boundarySha256), undefined, "Region boundaries unavailable"),
      fetchJson(get, geometryUrl("scope-jurisdictions.geojson", catalog.source.jurisdictionSha256), undefined, "Region boundaries unavailable"),
      fetchJson(get, new URL("../radio-profiles.json", baseUrl), undefined, "Radio profiles unavailable")
    ]);
    var profiles = loaded[2];
    if (!Array.isArray(profiles)) throw new Error("Invalid radio profiles");
    return {
      catalog: catalog,
      boundaries: featureCollection(loaded[0], "Invalid region boundaries"),
      jurisdictions: featureCollection(loaded[1], "Invalid region boundaries"),
      profiles: profiles
    };
  }

  function provincesOf(catalog, tag) {
    var entry = has(catalog.hierarchy, tag) ? catalog.hierarchy[tag] : null;
    return entry && Array.isArray(entry.provinces) ? entry.provinces.map(function (code) { return String(code).toLowerCase(); }) : [];
  }

  function option(catalog, tag, province) {
    var entry = has(catalog.hierarchy, tag) ? catalog.hierarchy[tag] : {};
    var result = { tag: tag, province: province, name: entry.label || tag.toUpperCase() };
    if (entry.labelFr) result.nameFr = entry.labelFr;
    return result;
  }

  function byTagThenProvince(a, b) {
    return a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : a.province < b.province ? -1 : a.province > b.province ? 1 : 0;
  }

  // Which region(s) and province a geocoded place is in.
  //   one                the boundary gives exactly one region and province
  //   many               several fit; the person is asked which
  //   none               no listed region covers it; the person can type a region code
  //   province-mismatch  the geocoder's province disagrees with the boundary; the
  //                      options are what the boundary says, for the page to explain
  // `place.province` is a name or code in English or French. An empty one makes no
  // claim, so the boundary decides; a name that is not a Canadian province counts
  // as a disagreement.
  function resolve(place, data) {
    var scopes = globalThis.MeshCoreIataScopes;
    var placeSearch = globalThis.MeshCorePlaceSearch;
    if (!scopes || !placeSearch) throw new Error("The region and place search scripts must be loaded first");
    var catalog = data.catalog;
    var jurisdiction = scopes.provinceAt(data.jurisdictions, place.lat, place.lon);

    var found = scopes.matches(data.boundaries, place.lat, place.lon);
    var published = found.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; });
    if (published.length) found = published;
    var tags = [];
    found.forEach(function (feature) {
      var tag = feature.properties.tag;
      if (tags.indexOf(tag) === -1) tags.push(tag);
    });

    // What the boundary says: the province it lies in, or every province the region spans.
    var suggested = [];
    tags.forEach(function (tag) {
      var provinces = provincesOf(catalog, tag);
      if (jurisdiction) provinces = provinces.filter(function (code) { return code === jurisdiction; });
      provinces.forEach(function (province) { suggested.push(option(catalog, tag, province)); });
    });
    suggested.sort(byTagThenProvince);

    var claimed = String(place.province == null ? "" : place.province).trim();
    if (!claimed) return { status: suggested.length === 1 ? "one" : suggested.length ? "many" : "none", options: suggested };
    var given = placeSearch.provinceCode(claimed).toLowerCase();
    var agreeing = suggested.filter(function (item) { return item.province === given; });
    if (agreeing.length) return { status: agreeing.length === 1 ? "one" : "many", options: agreeing };
    return { status: suggested.length ? "province-mismatch" : "none", options: suggested };
  }

  // Whether a region, at this spot, is one of MeshCore Canada's own planning areas
  // rather than a MeshMapper zone, told apart the same way as on the region map:
  //   "starter"    a starter region: MeshMapper has no zone there yet
  //   "extension"  the spot is outside the region's MeshMapper zone, in the gap
  //                MeshCore Canada gives to that region (a planning extension)
  //   null         a MeshMapper zone, or no spot to check (a region code typed by hand)
  function planning(tag, place, data) {
    var status = data.catalog.status && has(data.catalog.status, tag) ? data.catalog.status[tag] : null;
    if (status && status.state === "starter") return "starter";
    if (!place || typeof place.lat !== "number" || typeof place.lon !== "number" || !isFinite(place.lat) || !isFinite(place.lon)) return null;
    var scopes = globalThis.MeshCoreIataScopes;
    if (!scopes) throw new Error("The region script must be loaded first");
    var here = scopes.matches(data.boundaries, place.lat, place.lon).filter(function (feature) { return feature.properties.tag === tag; });
    if (!here.length || here.some(function (feature) { return feature.properties.regionSource === "meshmapper"; })) return null;
    return here.some(function (feature) { return feature.properties.planningKind === "extension"; }) ? "extension" : null;
  }

  // A region code typed by hand: one option for each province the region spans.
  function fromCode(code, data) {
    var catalog = data.catalog;
    var tag = String(code == null ? "" : code).trim().toLowerCase();
    if (!tag || !has(catalog.hierarchy, tag) || catalog.hierarchy[tag].kind !== "city") return [];
    return provincesOf(catalog, tag).map(function (province) { return option(catalog, tag, province); });
  }

  // A town or area name that the catalogue lists as an alias of a region.
  function fromAlias(text, data) {
    var catalog = data.catalog;
    var wanted = fold(text);
    if (!wanted) return [];
    var result = [];
    Object.keys(catalog.aliases).forEach(function (tag) {
      var entry = has(catalog.hierarchy, tag) ? catalog.hierarchy[tag] : null;
      if (!entry || entry.kind !== "city") return;
      if (!catalog.aliases[tag].some(function (alias) { return fold(alias) === wanted; })) return;
      provincesOf(catalog, tag).forEach(function (province) { result.push(option(catalog, tag, province)); });
    });
    return result;
  }

  function eachPoint(geometry, visit) {
    var polygons = !geometry ? [] : geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    polygons.forEach(function (rings) {
      rings.forEach(function (ring) { ring.forEach(visit); });
    });
  }

  // tag -> (other tag -> number of exact vertices both regions' outlines contain).
  // Built once for each loaded set of boundaries.
  function sharedVertices(collection) {
    var cached = vertexIndexes.get(collection);
    if (cached) return cached;
    var tagsAt = new Map();
    collection.features.forEach(function (feature) {
      var tag = feature.properties && feature.properties.tag;
      if (!tag) return;
      eachPoint(feature.geometry, function (point) {
        var key = point[0] + "," + point[1];
        var tags = tagsAt.get(key);
        if (!tags) tagsAt.set(key, tags = new Set());
        tags.add(tag);
      });
    });
    var shared = new Map();
    tagsAt.forEach(function (tags) {
      if (tags.size < 2) return;
      var list = Array.from(tags);
      list.forEach(function (a) {
        if (!shared.has(a)) shared.set(a, new Map());
        var counts = shared.get(a);
        list.forEach(function (b) {
          if (a !== b) counts.set(b, (counts.get(b) || 0) + 1);
        });
      });
    });
    vertexIndexes.set(collection, shared);
    return shared;
  }

  // Regions whose outline shares at least two exact vertices with this region's, sorted.
  // One shared corner is only a touch, not a border.
  function neighbours(tag, data) {
    var counts = sharedVertices(data.boundaries).get(String(tag == null ? "" : tag).toLowerCase());
    if (!counts) return [];
    return Array.from(counts.keys()).filter(function (other) { return counts.get(other) >= 2; }).sort();
  }

  function sameRadio(a, b) {
    return !!a && !!b && a.frequency_mhz === b.frequency_mhz && a.bandwidth_khz === b.bandwidth_khz &&
      a.spreading_factor === b.spreading_factor && a.coding_rate === b.coding_rate;
  }

  // The radio profiles a region's groups use, each with the groups that use it.
  // The Canada settings are always first: a group that lists no radio settings
  // uses them, and so does someone who is not in any listed group. A group whose
  // settings match no profile is left out rather than given the wrong frequency.
  function radioOptions(tag, data) {
    var key = String(tag == null ? "" : tag).toLowerCase();
    var entry = has(data.catalog.profiles, key) ? data.catalog.profiles[key] : null;
    var communities = entry && Array.isArray(entry.communities) ? entry.communities : [];
    var result = [{ id: "canada", communities: [], communitiesFr: [] }];
    communities.forEach(function (community) {
      var overrides = community.settings && community.settings.overrides;
      var raw = overrides && overrides.raw_radio;
      var id = "canada";
      if (raw) {
        var profile = data.profiles.find(function (item) { return sameRadio(item.radio, raw); });
        if (!profile) return;
        id = profile.id;
      }
      var chosen = result.find(function (item) { return item.id === id; });
      if (!chosen) result.push(chosen = { id: id, communities: [], communitiesFr: [] });
      var name = community.name || community.id;
      chosen.communities.push(name);
      chosen.communitiesFr.push(community.nameFr || name);
    });
    return result;
  }

  // Cross-border networks for a province code ("on", "qc", "bc"). Fresh arrays each time.
  function crossBorder(province) {
    var key = String(province == null ? "" : province).trim().toLowerCase();
    var entry = has(CROSS_BORDER, key) ? CROSS_BORDER[key] : { shared: [], edgeOnly: [] };
    return { shared: entry.shared.slice(), edgeOnly: entry.edgeOnly.slice() };
  }

  globalThis.MeshCoreSetupPlace = {
    loadData: loadData,
    resolve: resolve,
    planning: planning,
    fromCode: fromCode,
    fromAlias: fromAlias,
    neighbours: neighbours,
    radioOptions: radioOptions,
    crossBorder: crossBorder
  };
}());
