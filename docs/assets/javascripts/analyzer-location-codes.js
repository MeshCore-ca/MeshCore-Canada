(function () {
  "use strict";

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
    status.textContent = "Loading location codes…";

    try {
      var response = await fetch(source, {credentials: "same-origin"});
      if (!response.ok) throw new Error("location data request failed");
      var payload = await response.json();
      if (!validPayload(payload)) throw new Error("location data is invalid");

      var locations = payload.locations.slice().sort(function (left, right) {
        return left.province.localeCompare(right.province) || left.name.localeCompare(right.name);
      });
      var provinces = Array.from(new Set(locations.map(function (item) {
        return item.province;
      }))).sort();

      provinces.forEach(function (name) {
        var option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        province.appendChild(option);
      });

      function render() {
        var query = search.value.trim().toLocaleLowerCase("en-CA");
        var selectedProvince = province.value;
        var matches = locations.filter(function (location) {
          var searchable = [
            location.code,
            location.name,
            location.province,
            location.province_code
          ].join(" ").toLocaleLowerCase("en-CA");
          return (!query || searchable.includes(query)) &&
            (!selectedProvince || location.province === selectedProvince);
        });

        var fragment = document.createDocumentFragment();
        matches.forEach(function (location) {
          var row = document.createElement("tr");
          row.appendChild(textCell(location.code));
          row.appendChild(textCell(location.name));
          row.appendChild(textCell(location.province));
          fragment.appendChild(row);
        });
        body.replaceChildren(fragment);
        status.textContent = matches.length === 1
          ? "1 location code shown."
          : matches.length + " location codes shown.";
      }

      search.addEventListener("input", render);
      province.addEventListener("change", render);
      render();
    } catch (_error) {
      status.textContent = "The location list could not be loaded. Use the raw data link below or try again.";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
