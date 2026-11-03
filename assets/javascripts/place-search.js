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
      return row.key === "geonames" && /^(city|town|ville|cite|village|hamlet|incorporated hamlet|hameau|hameau constitue|incorporated village|village constitue|community|communaute|settlement|etablissement|locality|localite|urban community|agglomeration urbaine|dispersed rural community|collectivite rurale dispersee|municipality|municipalite|rural municipality|indian reserve|reserve indienne)$/.test(category);
    }).map(function (row) {
      return { name: decode(row.name).slice(0, 180), province: decode(row.province).slice(0, 80), lat: Number(row.lat), lon: Number(row.lng), category: normalize(row.category) };
    }).filter(function (place) {
      var code = provinceCode(place.province);
      var key = place.lat + ":" + place.lon;
      if (!place.name || !code || !Number.isFinite(place.lat) || !Number.isFinite(place.lon) || place.lat < 41 || place.lat > 84 || place.lon < -142 || place.lon > -52 || (requested.province && requested.province !== code) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (saintJean(requested.name)) {
      // Official GeoNames retain the English names in NB/NL. Keep those
      // province choices alongside Quebec's several Saint-Jean communities.
      places.sort(function (a, b) { return Number(/^(city|town|ville|cite)$/.test(b.category)) - Number(/^(city|town|ville|cite)$/.test(a.category)); });
      var represented = new Set(), first = [], rest = [];
      places.forEach(function (place) { var code = provinceCode(place.province); (represented.has(code) ? rest : first).push(place); represented.add(code); });
      return first.concat(rest).slice(0, 5);
    }
    var exact = places.filter(function (place) { return normalize(place.name) === normalize(requested.name); });
    if (exact.length) {
      var cities = exact.filter(function (place) { return /^(city|town|ville|cite)$/.test(place.category); });
      // Prefer an exact city/town over similarly named bays, townships, or rural localities.
      return (cities.length ? cities : exact).slice(0, 5);
    }
    return places.slice(0, 5);
  }

  function saintJean(name) { return normalize(name).replace(/[^a-z]/g, "") === "saintjean"; }
  function lookupQueries(query) {
    var place = splitPlaceQuery(query);
    if (!saintJean(place.name)) return [place.name];
    if (place.province === "NB") return ["Saint John"];
    if (place.province === "NL") return ["St. John's"];
    return place.province ? [place.name] : [place.name, "Saint John", "St. John's"];
  }
  async function lookup(query, language, request) {
    var rows = [];
    for (var name of lookupQueries(query)) {
      var url = "https://geolocator.api.geo.ca/?" + new URLSearchParams({ q: name, lang: language, keys: "geonames" });
      var response = await request(url);
      if (!response.ok) throw new Error("Place lookup failed");
      var result = await response.json();
      if (!Array.isArray(result)) throw new Error("Invalid place response");
      if (name !== splitPlaceQuery(query).name) result = result.filter(function (row) { return normalize(row.name) === normalize(name); });
      rows = rows.concat(result);
    }
    return placeCandidates(rows, query);
  }

  // Street addresses: a civic number, then the street ("111 Wellington Street, Ottawa" or, in
  // French, "111, rue Wellington, Ottawa"), then optionally the town after a comma and a province.
  // Anything else is a town, searched with lookup() as before.

  // Words that say what kind of street it is, and small words, skipped when comparing street names,
  // so "rue Wellington" is Wellington Street and "St. Paul Street" is Saint Paul Street.
  var STREET_WORDS = new Set(("street st avenue ave av road rd drive dr boulevard blvd boul crescent cres court ct lane ln " +
    "place pl way terrace terr circle cir trail highway hwy route rte parkway pkwy square sq line sideroad " +
    "rue chemin ch rang montee cote promenade impasse allee croissant carre ruelle autoroute " +
    "saint sainte ste de du des la le les l d of the").split(" "));

  // The first word of a street's name that isn't one of those: "Rue de la Gauchetière" -> "gauchetiere".
  function streetWord(street) {
    var words = normalize(street).split(/[^a-z0-9]+/).filter(Boolean);
    for (var i = 0; i < words.length; i += 1) if (!STREET_WORDS.has(words[i])) return words[i];
    return "";
  }

  // Town names compared without case, accents, spaces or hyphens.
  function sameTown(a, b) {
    return normalize(a).replace(/[^a-z0-9]/g, "") === normalize(b).replace(/[^a-z0-9]/g, "");
  }

  // What was typed, as { number, street, town, province }, or null when it doesn't start with a
  // civic number. `street` is the first word of the street name; `town` is "" when none was typed.
  function addressQuery(query) {
    var typed = splitPlaceQuery(String(query || ""));
    var parts = typed.name.split(",").map(function (part) { return part.trim(); }).filter(Boolean);
    // "111, rue Wellington": the number and the street are one part.
    if (parts.length > 1 && /^\d+[a-z]?$/i.test(parts[0])) parts.splice(0, 2, parts[0] + " " + parts[1]);
    var found = /^(\d+[a-z]?)\s+(.*\p{L}.*)$/iu.exec(parts[0] || "");
    if (!found) return null;
    return { number: found[1].toLowerCase(), street: streetWord(found[2]), town: parts.length > 1 ? parts[parts.length - 1] : "", province: typed.province };
  }

  function isAddress(query) { return addressQuery(query) !== null; }

  // Whether a found address is the one typed: the same civic number and the same first word of the
  // street name, and the same town and province when those were typed. The street can still differ
  // after that word (Maple Avenue, Maple Drive), so the page always asks before using an address.
  function matchesAddress(place, wanted) {
    var parts = place.name.split(",");
    var found = /^(\d+[a-z]?)\s+(.*)$/i.exec(parts[0].trim());
    if (!found || found[1].toLowerCase() !== wanted.number) return false;
    if (wanted.street && streetWord(found[2]) !== wanted.street) return false;
    if (wanted.town && !sameTown(parts[parts.length - 1], wanted.town)) return false;
    return !wanted.province || provinceCode(place.province) === wanted.province;
  }

  // "City Of Ottawa" -> "Ottawa". The French replies say "Ville Of".
  var MUNICIPALITY_TYPE = /^(?:city|town|township|village|municipality|county|district|regional municipality|rural municipality|ville|canton|municipalit[eé]|cit[eé]) of\s+/i;

  // geo.ca `keys=locate` rows, kept only when they are a civic address (a street number placed on
  // its street), not the towns, lakes, intersections and whole streets the same reply carries.
  // Each is named "<number and street>, <municipality>": "111 Wellington Street, Ottawa".
  // With `wanted` (from addressQuery), only the ones that match what was typed.
  function addressCandidates(rows, wanted) {
    if (!Array.isArray(rows)) throw new Error("Invalid place response");
    var seen = new Set();
    var places = [];
    rows.slice(0, 500).forEach(function (row) {
      if (!row || row.key !== "locate" || !Array.isArray(row.tag) || row.tag.indexOf("INTERPOLATED_POSITION") === -1) return;
      var province = decode(row.province).slice(0, 80);
      var parts = decode(row.name).split(",").map(function (part) { return part.trim(); }).filter(Boolean);
      if (parts.length && provinceCode(parts[parts.length - 1])) parts.pop();
      if (parts.length < 2) return;
      var municipality = parts[1].replace(MUNICIPALITY_TYPE, "");
      var place = { name: (parts[0] + ", " + municipality).slice(0, 80), province: province, lat: Number(row.lat), lon: Number(row.lng), kind: "address" };
      var key = place.lat + ":" + place.lon;
      if (!municipality || !provinceCode(province) || !Number.isFinite(place.lat) || !Number.isFinite(place.lon) || place.lat < 41 || place.lat > 84 || place.lon < -142 || place.lon > -52 || seen.has(key)) return;
      if (wanted && !matchesAddress(place, wanted)) return;
      seen.add(key);
      places.push(place);
    });
    return places.slice(0, 5);
  }

  // The civic addresses that match what was typed.
  async function lookupAddress(query, language, request) {
    var url = "https://geolocator.api.geo.ca/?" + new URLSearchParams({ q: query.trim(), lang: language, keys: "locate" });
    var response = await request(url);
    if (!response.ok) throw new Error("Place lookup failed");
    return addressCandidates(await response.json(), addressQuery(query));
  }

  // A town or a street address. The two geocoder keys answer separately (asking for both at
  // once returns nothing), so an address is looked up first. When no address matches what was
  // typed, the town typed after the comma is searched instead ("22 Oak Street, Picton" -> Picton),
  // or, with no town typed, the whole text as a town (100 Mile House has a number too).
  async function find(query, language, request) {
    var wanted = addressQuery(query);
    if (wanted) {
      var addresses = await lookupAddress(query, language, request);
      if (addresses.length) return addresses;
      if (wanted.town) return lookup(wanted.town + (wanted.province ? ", " + wanted.province : ""), language, request);
    }
    return lookup(query, language, request);
  }
  globalThis.MeshCorePlaceSearch = { normalize: normalize, provinceCode: provinceCode, splitPlaceQuery: splitPlaceQuery, placeCandidates: placeCandidates, distanceKm: distanceKm, lookupQueries: lookupQueries, lookup: lookup, isAddress: isAddress, addressQuery: addressQuery, addressCandidates: addressCandidates, lookupAddress: lookupAddress, find: find };
})();
