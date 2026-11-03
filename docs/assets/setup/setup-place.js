// Place lookups for the guided repeater setup tool: which region and province a
// town is in, which regions are nearest to it, which radio settings apply and which
// cross-border scopes to offer. Pure data logic. No DOM and no text shown to
// people (see setup-text.js).
//
// MeshCoreIataScopes and MeshCorePlaceSearch are looked up when a function runs,
// not when this script loads, so a page that only reads data (the explainer) can
// load this file without place-search.js.
(function () {
  "use strict";

  var KM_PER_DEGREE = 111.195;   // one degree of latitude

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
      fetchJson(get, new URL("../radio-profiles.json", baseUrl), undefined, "Radio profiles unavailable"),
      // Built from data/cross-border-scopes.yml. Checked with the server on every load, like the catalogue,
      // so an edited list shows up without a new version number.
      fetchJson(get, new URL("../regions/cross-border-scopes.json", baseUrl), { cache: "no-cache" }, "Cross-border scopes unavailable")
    ]);
    var profiles = loaded[2];
    if (!Array.isArray(profiles)) throw new Error("Invalid radio profiles");
    return {
      catalog: catalog,
      boundaries: featureCollection(loaded[0], "Invalid region boundaries"),
      jurisdictions: featureCollection(loaded[1], "Invalid region boundaries"),
      profiles: profiles,
      crossBorder: crossBorderFile(loaded[3])
    };
  }

  var SCOPE_RE = /^[a-z0-9-]{1,29}$/;
  var SCOPE_TEXT = ["name", "nameFr", "description", "descriptionFr"];

  // The cross-border scopes file as built from the YAML: a list of scopes with their words in both languages.
  function crossBorderFile(value) {
    var valid = !!value && Array.isArray(value.scopes) && value.scopes.every(function (item) {
      return !!item && typeof item.scope === "string" && SCOPE_RE.test(item.scope) &&
        SCOPE_TEXT.every(function (key) { return typeof item[key] === "string" && item[key].trim() !== ""; }) &&
        Array.isArray(item.provinces) && item.provinces.every(function (code) { return typeof code === "string"; });
    });
    if (!valid) throw new Error("Invalid cross-border scopes");
    return value;
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

  function polygonsOf(geometry) {
    return !geometry ? [] : geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  }

  function eachPoint(geometry, visit) {
    polygonsOf(geometry).forEach(function (rings) {
      rings.forEach(function (ring) { ring.forEach(visit); });
    });
  }

  // A region's middle, where the map pin starts when only the region is known (a region code, or a
  // link from the region map): the boundary's own `center` ([lon, lat]), or else the middle of its
  // outline. A MeshMapper zone comes before a planning extension of the same region. null for a tag
  // with no outline.
  function centre(tag, data) {
    var wanted = String(tag == null ? "" : tag).toLowerCase();
    var features = data.boundaries.features.filter(function (feature) { return feature.properties && feature.properties.tag === wanted; });
    if (!features.length) return null;
    var published = features.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; });
    var feature = (published.length ? published : features)[0];
    var given = feature.properties.center;
    if (Array.isArray(given) && typeof given[0] === "number" && typeof given[1] === "number" && isFinite(given[0]) && isFinite(given[1])) return { lat: given[1], lon: given[0] };
    var box = null;
    eachPoint(feature.geometry, function (point) {
      if (!box) box = { west: point[0], east: point[0], south: point[1], north: point[1] };
      box.west = Math.min(box.west, point[0]);
      box.east = Math.max(box.east, point[0]);
      box.south = Math.min(box.south, point[1]);
      box.north = Math.max(box.north, point[1]);
    });
    return box ? { lat: (box.south + box.north) / 2, lon: (box.west + box.east) / 2 } : null;
  }

  function isSpot(point) {
    return !!point && typeof point.lat === "number" && typeof point.lon === "number" && isFinite(point.lat) && isFinite(point.lon);
  }

  // Kilometres from the spot to the line from `a` to `b` ([lon, lat] each), on a flat map centred on the
  // spot. A degree of longitude is scaled by the latitude halfway between the spot and the line, which is
  // accurate to a few percent at the distances that matter here.
  function segmentKm(a, b, lat, lon) {
    var scale = Math.cos(((a[1] + b[1]) / 2 + lat) / 2 * Math.PI / 180) * KM_PER_DEGREE;
    var ax = (a[0] - lon) * scale;
    var ay = (a[1] - lat) * KM_PER_DEGREE;
    var dx = (b[0] - a[0]) * scale;
    var dy = (b[1] - a[1]) * KM_PER_DEGREE;
    var length = dx * dx + dy * dy;
    var along = length ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length)) : 0;
    return Math.hypot(ax + along * dx, ay + along * dy);
  }

  function outlineKm(features, lat, lon) {
    var best = Infinity;
    features.forEach(function (feature) {
      polygonsOf(feature.geometry).forEach(function (rings) {
        rings.forEach(function (ring) {
          for (var i = 1; i < ring.length; i += 1) best = Math.min(best, segmentKm(ring[i - 1], ring[i], lat, lon));
        });
      });
    });
    return best;
  }

  function named(catalog, tag) {
    var entry = catalog.hierarchy[tag];
    var result = { tag: tag, name: entry.label || tag.toUpperCase() };
    if (entry.labelFr) result.nameFr = entry.labelFr;
    return result;
  }

  function lowerTags(tags) {
    return (Array.isArray(tags) ? tags : []).map(function (tag) { return String(tag).toLowerCase(); });
  }

  function isRegion(catalog, tag) {
    return has(catalog.hierarchy, tag) && catalog.hierarchy[tag].kind === "city";
  }

  // The regions nearest a spot ({ lat, lon }), closest first, as [{ tag, name, nameFr, km }]. `km` is the
  // distance from the spot to the region's outline, 0 if the spot is inside it. Only regions are listed,
  // never provinces or the wider scopes. Options: `exclude` (tags to leave out, such as the home region)
  // and `limit` (how many; all by default). Where a region has a MeshMapper zone, that is the outline
  // measured, not a planning extension beside it, as on the region map. A spot that isn't a spot has none.
  function nearest(point, data, options) {
    var scopes = globalThis.MeshCoreIataScopes;
    if (!scopes) throw new Error("The region script must be loaded first");
    if (!isSpot(point)) return [];
    var settings = options || {};
    var left = lowerTags(settings.exclude);
    var catalog = data.catalog;
    var byTag = new Map();
    data.boundaries.features.forEach(function (feature) {
      var tag = feature.properties && feature.properties.tag;
      if (!tag || left.indexOf(tag) !== -1 || !isRegion(catalog, tag)) return;
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(feature);
    });
    var list = [];
    byTag.forEach(function (features, tag) {
      var published = features.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; });
      if (published.length) features = published;
      var km = scopes.matches({ features: features }, point.lat, point.lon).length ? 0 : outlineKm(features, point.lat, point.lon);
      if (!isFinite(km)) return;
      list.push(Object.assign(named(catalog, tag), { km: Math.round(km * 10) / 10 }));
    });
    list.sort(function (a, b) { return a.km - b.km || (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0); });
    return settings.limit > 0 ? list.slice(0, settings.limit) : list;
  }

  // Text as compared when searching: no case or accents, and dots, dashes and apostrophes read as spaces,
  // so "Sault Ste. Marie" and "val d'or" match "Sault Ste Marie" and "Val-d’Or".
  function words(value) {
    return fold(value).replace(/[^a-z0-9]+/g, " ").trim();
  }

  // 0 the typed text is the code, 1 it is a whole name or alias, 2 it starts a name, alias, code or one of
  // their words, 3 it is somewhere inside one; null when it is in none of them.
  function rank(candidates, wanted) {
    var best = null;
    candidates.forEach(function (candidate) {
      var score = null;
      if (candidate.code && candidate.text === wanted) score = 0;
      else if (candidate.text === wanted) score = 1;
      else if (candidate.text.indexOf(wanted) === 0 || candidate.text.indexOf(" " + wanted) !== -1) score = 2;
      else if (candidate.text.indexOf(wanted) !== -1) score = 3;
      if (score !== null && (best === null || score < best)) best = score;
    });
    return best;
  }

  // Regions whose code, name, French name or alias contains the typed text, best matches first, as
  // [{ tag, name, nameFr }]. Case, accents, dots and dashes don't matter. Fewer than two letters is too
  // little to search on and finds nothing. Options: `exclude` (tags to leave out) and `limit` (how many).
  function search(text, data, options) {
    var wanted = words(text);
    if (wanted.length < 2) return [];
    var settings = options || {};
    var left = lowerTags(settings.exclude);
    var catalog = data.catalog;
    var found = [];
    Object.keys(catalog.hierarchy).forEach(function (tag) {
      if (!isRegion(catalog, tag) || left.indexOf(tag) !== -1) return;
      var entry = catalog.hierarchy[tag];
      var candidates = [{ text: tag, code: true }];
      [entry.label, entry.labelFr].concat(has(catalog.aliases, tag) ? catalog.aliases[tag] : []).forEach(function (name) {
        if (name) candidates.push({ text: words(name) });
      });
      var score = rank(candidates, wanted);
      if (score !== null) found.push({ score: score, sort: words(entry.label || tag), result: named(catalog, tag) });
    });
    found.sort(function (a, b) {
      return a.score - b.score || (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0) || (a.result.tag < b.result.tag ? -1 : 1);
    });
    var list = found.map(function (item) { return item.result; });
    return settings.limit > 0 ? list.slice(0, settings.limit) : list;
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

  // The cross-border scopes to offer a repeater in a province ("on", "qc", "bc"), from the file the page
  // loaded: [{ scope, name, nameFr, description, descriptionFr, provinces }], in the file's order. They suit
  // city and edge repeaters alike. Fresh objects each time; nothing without the loaded data.
  function crossBorder(province, data) {
    var key = String(province == null ? "" : province).trim().toLowerCase();
    var scopes = data && data.crossBorder && Array.isArray(data.crossBorder.scopes) ? data.crossBorder.scopes : [];
    return scopes.filter(function (item) { return item.provinces.indexOf(key) !== -1; })
      .map(function (item) { return Object.assign({}, item, { provinces: item.provinces.slice() }); });
  }

  globalThis.MeshCoreSetupPlace = {
    loadData: loadData,
    resolve: resolve,
    planning: planning,
    centre: centre,
    fromCode: fromCode,
    fromAlias: fromAlias,
    nearest: nearest,
    search: search,
    radioOptions: radioOptions,
    crossBorder: crossBorder
  };
}());
