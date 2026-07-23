(function () {
  "use strict";

  var isFrench = /^fr(?:-|$)/i.test(
    document.documentElement ? document.documentElement.lang || "" : ""
  );

  function tr(english, french) {
    return isFrench ? french : english;
  }

  var frenchProvinceNames = {
    BC: "Colombie-Britannique",
    AB: "Alberta",
    SK: "Saskatchewan",
    MB: "Manitoba",
    ON: "Ontario",
    QC: "Québec",
    NB: "Nouveau-Brunswick",
    NS: "Nouvelle-Écosse",
    PE: "Île-du-Prince-Édouard",
    NL: "Terre-Neuve-et-Labrador",
    YT: "Yukon",
    NT: "Territoires du Nord-Ouest",
    NU: "Nunavut"
  };

  var frenchLocationNames = {
    YYZ: "Toronto-Pearson",
    YTZ: "Toronto-Billy Bishop",
    YUL: "Montréal-Trudeau",
    YMX: "Montréal-Mirabel",
    YQB: "Québec",
    YND: "Gatineau / région d’Ottawa",
    YHU: "Montréal–Saint-Hubert",
    YGL: "La Grande Rivière",
    YZV: "Sept-Îles",
    YGP: "Gaspé",
    YRQ: "Trois-Rivières"
  };

  function localizedProvince(location) {
    return isFrench && frenchProvinceNames[location.province_code]
      ? frenchProvinceNames[location.province_code]
      : location.province;
  }

  function localizedName(location) {
    return isFrench && frenchLocationNames[location.code]
      ? frenchLocationNames[location.code]
      : location.name;
  }

  function textCell(text) {
    var cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function validPayload(payload) {
    if (!payload || payload.schema_version !== 1 || !Array.isArray(payload.locations)) return false;
    var seen = new Set();
    return payload.locations.every(function (location) {
      if (
        !location ||
        !/^[A-Z]{3}$/.test(location.code) ||
        !/^[A-Z]{2}$/.test(location.province_code) ||
        typeof location.name !== "string" ||
        typeof location.province !== "string" ||
        seen.has(location.code)
      ) {
        return false;
      }
      seen.add(location.code);
      return true;
    });
  }

  async function init() {
    var root = document.getElementById("location-code-tool");
    if (!root || root.dataset.ready === "true") return;

    var search = document.getElementById("location-code-search");
    var province = document.getElementById("location-code-province");
    var body = document.getElementById("location-code-results");
    var status = document.getElementById("location-code-status");
    var source = root.dataset.source;
    if (!search || !province || !body || !status || !source) return;

    root.dataset.ready = "true";
    status.textContent = tr(
      "Loading location codes…",
      "Chargement des codes d’emplacement…"
    );

    try {
      var response = await fetch(source, {credentials: "same-origin"});
      if (!response.ok) throw new Error("location data request failed");
      var payload = await response.json();
      if (!validPayload(payload)) throw new Error("location data is invalid");

      var locale = isFrench ? "fr-CA" : "en-CA";
      var locations = payload.locations.slice().sort(function (left, right) {
        return localizedProvince(left).localeCompare(localizedProvince(right), locale) ||
          localizedName(left).localeCompare(localizedName(right), locale);
      });
      var provinces = Array.from(new Set(locations.map(function (item) {
        return item.province;
      }))).sort(function (left, right) {
        var leftLocation = locations.find(function (item) { return item.province === left; });
        var rightLocation = locations.find(function (item) { return item.province === right; });
        return localizedProvince(leftLocation).localeCompare(localizedProvince(rightLocation), locale);
      });

      provinces.forEach(function (name) {
        var option = document.createElement("option");
        option.value = name;
        var representative = locations.find(function (item) { return item.province === name; });
        option.textContent = localizedProvince(representative);
        province.appendChild(option);
      });

      function render() {
        var query = search.value.trim().toLocaleLowerCase(locale);
        var selectedProvince = province.value;
        var matches = locations.filter(function (location) {
          var searchable = [
            location.code,
            location.name,
            location.province,
            localizedName(location),
            localizedProvince(location),
            location.province_code
          ].join(" ").toLocaleLowerCase(locale);
          return (!query || searchable.includes(query)) &&
            (!selectedProvince || location.province === selectedProvince);
        });

        var fragment = document.createDocumentFragment();
        matches.forEach(function (location) {
          var row = document.createElement("tr");
          row.appendChild(textCell(location.code));
          row.appendChild(textCell(localizedName(location)));
          row.appendChild(textCell(localizedProvince(location)));
          fragment.appendChild(row);
        });
        body.replaceChildren(fragment);
        status.textContent = matches.length === 1
          ? tr("1 location code shown.", "1 code d’emplacement affiché.")
          : matches.length + tr(
            " location codes shown.",
            " codes d’emplacement affichés."
          );
      }

      search.addEventListener("input", render);
      province.addEventListener("change", render);
      render();
    } catch (_error) {
      status.textContent = tr(
        "The location list could not be loaded. Use the raw data link below or try again.",
        "Impossible de charger la liste des emplacements. Utilisez le lien vers les données brutes ci-dessous ou réessayez."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
