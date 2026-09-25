(function () {
  "use strict";
  var provinces = {
    AB: ["Alberta"], BC: ["British Columbia", "Colombie-Britannique"],
    MB: ["Manitoba"], NB: ["New Brunswick", "Nouveau-Brunswick"],
    NL: ["Newfoundland and Labrador", "Terre-Neuve-et-Labrador"],
    NS: ["Nova Scotia", "Nouvelle-Écosse"], NT: ["Northwest Territories", "Territoires du Nord-Ouest"],
    NU: ["Nunavut"], ON: ["Ontario"], PE: ["Prince Edward Island", "Île-du-Prince-Édouard"],
    QC: ["Quebec", "Québec"], SK: ["Saskatchewan"], YT: ["Yukon"]
  };

  function decode(value) {
    // GeoNames occasionally escapes accents inside an already-decoded JSON string.
    return String(value || "").replace(/\\u([0-9a-f]{4})/gi, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); });
  }

  function normalize(value) {
    return decode(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  }

  function provinceCode(value) {
    var name = normalize(value);
    return Object.keys(provinces).find(function (code) {
      return [code].concat(provinces[code]).some(function (alias) { return normalize(alias) === name; });
    }) || "";
  }

  function splitPlaceQuery(value) {
    var query = value.trim();
    var normalized = normalize(query);
    var aliases = Object.keys(provinces).flatMap(function (code) {
      return [code].concat(provinces[code]).map(function (alias) { return { code: code, alias: normalize(alias) }; });
    }).sort(function (a, b) { return b.alias.length - a.alias.length; });
    for (var item of aliases) {
      if (normalized.endsWith(" " + item.alias) || normalized.endsWith("," + item.alias)) {
        return { name: query.slice(0, -item.alias.length).replace(/[,\s]+$/, ""), province: item.code };
      }
    }
    return { name: query, province: "" };
  }

  function distanceKm(a, b) {
    var radians = Math.PI / 180;
    var lat = (b.lat - a.lat) * radians;
    var lon = (b.lon - a.lon) * radians;
    var h = Math.sin(lat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(lon / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
  }

  function placeCandidates(rows, query) {
    if (!Array.isArray(rows)) throw new Error("Invalid place response");
    var requested = splitPlaceQuery(query);
    var seen = new Set();
    var places = rows.slice(0, 500).filter(function (row) {
      var category = normalize(row.category);
      return row.key === "geonames" && /^(city|town|ville|cite|village|hamlet|hameau|community|communaute|settlement|etablissement|locality|localite|urban community|agglomeration urbaine|dispersed rural community|collectivite rurale dispersee|municipality|municipalite|rural municipality|indian reserve|reserve indienne)$/.test(category);
    }).map(function (row) {
      return { name: decode(row.name).slice(0, 180), province: decode(row.province).slice(0, 80), lat: Number(row.lat), lon: Number(row.lng), category: normalize(row.category) };
    }).filter(function (place) {
      var code = provinceCode(place.province);
      var key = place.name + ":" + place.lat + ":" + place.lon;
      if (!place.name || !code || !Number.isFinite(place.lat) || !Number.isFinite(place.lon) || place.lat < 41 || place.lat > 84 || place.lon < -142 || place.lon > -52 || (requested.province && requested.province !== code) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    var exact = places.filter(function (place) { return normalize(place.name) === normalize(requested.name); });
    if (exact.length) {
      var cities = exact.filter(function (place) { return /^(city|town|ville|cite)$/.test(place.category); });
      // Prefer an exact city/town over similarly named bays, townships, or rural localities.
      return (cities.length ? cities : exact).slice(0, 5);
    }
    return places.slice(0, 5);
  }

  globalThis.MeshCorePlaceSearch = { normalize: normalize, provinceCode: provinceCode, splitPlaceQuery: splitPlaceQuery, placeCandidates: placeCandidates, distanceKm: distanceKm };
})();

