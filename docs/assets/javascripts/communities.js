(function () {
  "use strict";

  var placeCache = new Map();
  var lastRequest = 0;
  var places = globalThis.MeshCorePlaceSearch;
  var normalize = places.normalize;
  var splitPlaceQuery = places.splitPlaceQuery;
  var placeCandidates = places.placeCandidates;
  var distanceKm = places.distanceKm;

  function initializeDirectory(root) {
    if (!root || root.dataset.communityReady === "true") return;
    var search = root.querySelector("#community-search");
    var status = root.querySelector("#community-status");
    var override = root.querySelector("#community-override");
    var count = root.querySelector("[data-community-count]");
    var lookup = root.querySelector("[data-community-lookup]");
    var choices = root.querySelector("[data-community-choices]");
    var credit = root.querySelector("[data-community-credit]");
    var submit = root.querySelector("[data-community-locate]");
    var showAll = root.querySelector("[data-community-show-all]");
    var page = root.closest(".md-content") || document;
    var results = page.querySelector("[data-community-results]");
    var cards = Array.from(page.querySelectorAll("[data-community-card]"));
    var empty = page.querySelector("[data-community-empty]");
    var isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
    if (!search || !status || !override || !count || !lookup || !choices || !submit || !results || !empty || !cards.length) return;
    root.dataset.communityReady = "true";
    var selectedPlace = null;
    var expanded = false;
    var controller = null;
    var requestId = 0;
    var params = new URL(window.location.href).searchParams;
    var regionTag = /^[a-z]{3}$/.test(params.get("region") || "") ? params.get("region") : "";
    var regionIds = null;
    var regionNotice = document.createElement("p");
    regionNotice.setAttribute("role", "status");
    regionNotice.hidden = true;
    root.prepend(regionNotice);
    var points = new Map(cards.map(function (card) { return [card, JSON.parse(card.dataset.communityPoints)]; }));
    cards.forEach(function (card) {
      if (!card.querySelector("[data-community-distance]")) {
        var line = document.createElement("p");
        line.className = "mc-community-distance";
        line.dataset.communityDistance = "";
        line.hidden = true;
        card.querySelector(".mc-community-area").after(line);
      }
    });
    var format = new Intl.NumberFormat(isFrench ? "fr-CA" : "en-CA", { maximumFractionDigits: 0 });

    function saveQuery(updateHistory) {
      function update(url) {
        if (search.value.trim()) url.searchParams.set("community", search.value.trim());
        else url.searchParams.delete("community");
        if (selectedPlace) url.searchParams.set("nearby", "1");
        else url.searchParams.delete("nearby");
        if (regionTag) url.searchParams.set("region", regionTag);
        else url.searchParams.delete("region");
        return url;
      }
      if (updateHistory) window.history.replaceState(null, "", update(new URL(window.location.href)));
      document.querySelectorAll(".md-select__link[hreflang]").forEach(function (link) { link.href = update(new URL(link.href)).href; });
    }

    function applyFilters(updateHistory) {
      var query = normalize(search.value);
      var ordered = cards.map(function (card, index) {
        var distances = selectedPlace ? points.get(card).map(function (point) { return { distance: distanceKm(selectedPlace, point), label: point.label }; }) : [];
        distances.sort(function (a, b) { return a.distance - b.distance; });
        return { card: card, index: index, nearest: distances[0] };
      });
      if (selectedPlace) ordered.sort(function (a, b) { return a.nearest.distance - b.nearest.distance || a.index - b.index; });
      var matching = 0;
      var visible = 0;
      ordered.forEach(function (entry) {
        var card = entry.card;
        var matches = (!regionIds || regionIds.includes(card.id.replace(/^directory-/, ""))) && (selectedPlace || !query || normalize(card.dataset.communitySearch).includes(query)) &&
          (!status.value || card.dataset.communityStatus === status.value) && (!override.checked || card.dataset.communityOverride === "true");
        if (matches) matching += 1;
        card.hidden = !matches || (selectedPlace && !expanded && matching > 5);
        if (!card.hidden) visible += 1;
        var line = card.querySelector("[data-community-distance]");
        line.hidden = !selectedPlace;
        if (selectedPlace) {
          line.textContent = "≈ " + format.format(entry.nearest.distance) + " km";
          line.title = (isFrench ? "Point de référence : " : "Reference point: ") + entry.nearest.label;
        }
        results.appendChild(card);
      });
      empty.hidden = visible !== 0;
      showAll.hidden = !selectedPlace || expanded || matching <= 5;
      count.textContent = selectedPlace
        ? (isFrench ? visible + " communautés les plus proches de " : visible + " nearest communities to ") + selectedPlace.name + ", " + selectedPlace.province
        : (isFrench ? visible + " " + (visible === 1 ? "communauté affichée" : "communautés affichées") : "Showing " + visible + " " + (visible === 1 ? "community" : "communities"));
      saveQuery(updateHistory !== false);
      return visible;
    }

    function cancelLookup() {
      requestId += 1;
      if (controller) controller.abort();
      submit.disabled = false;
      root.setAttribute("aria-busy", "false");
      choices.replaceChildren();
      choices.hidden = true;
      lookup.textContent = "";
    }

    function choosePlace(place) {
      selectedPlace = place;
      expanded = false;
      search.value = place.name + ", " + place.province;
      choices.hidden = true;
      lookup.textContent = "";
      credit.hidden = false;
      applyFilters();
    }

    async function locate(event) {
      if (event) event.preventDefault();
      if (submit.disabled) return;
      var query = search.value.trim();
      if (query.length < 2) {
        lookup.textContent = isFrench ? "Entrez une ville, avec la province au besoin." : "Enter a city, with its province if needed.";
        search.focus();
        return;
      }
      cancelLookup();
      var current = requestId;
      controller = new AbortController();
      var signal = controller.signal;
      submit.disabled = true;
      root.setAttribute("aria-busy", "true");
      credit.hidden = false;
      lookup.textContent = isFrench ? "Recherche de la ville…" : "Looking up the city…";
      var timer;
      try {
        var key = (isFrench ? "fr:" : "en:") + normalize(query);
        var places = placeCache.get(key);
        if (!places) {
          await new Promise(function (resolve) { window.setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRequest))); });
          if (signal.aborted || current !== requestId) return;
          lastRequest = Date.now();
          var requestController = controller;
          timer = window.setTimeout(function () { requestController.abort(); }, 12000);
          var url = new URL("https://geolocator.api.geo.ca/");
          url.search = new URLSearchParams({ q: splitPlaceQuery(query).name, lang: isFrench ? "fr" : "en", keys: "geonames" }).toString();
          var response = await fetch(url, { signal: signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
          if (!response.ok) throw new Error("Place lookup failed");
          places = placeCandidates(await response.json(), query);
          if (placeCache.size >= 20) placeCache.delete(placeCache.keys().next().value);
          placeCache.set(key, places);
        }
        if (current !== requestId) return;
        if (places.length === 1) choosePlace(places[0]);
        else if (!places.length) lookup.textContent = isFrench ? "Aucune ville trouvée. Essayez le nom avec la province." : "No city found. Try its name and province.";
        else {
          lookup.textContent = isFrench ? "Quel lieu cherchez-vous ?" : "Which place do you mean?";
          choices.hidden = false;
          places.forEach(function (place) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "md-button";
            button.textContent = place.name + ", " + place.province;
            button.addEventListener("click", function () { choosePlace(place); });
            choices.appendChild(button);
          });
        }
      } catch (_) {
        if (current === requestId) lookup.textContent = isFrench
          ? "La recherche de villes est indisponible. Vous pouvez toujours filtrer la liste par province ou communauté."
          : "City lookup is unavailable. You can still filter the list by province or community.";
      } finally {
        window.clearTimeout(timer);
        if (current === requestId) {
          submit.disabled = false;
          root.setAttribute("aria-busy", "false");
        }
      }
    }

    search.addEventListener("input", function () { cancelLookup(); selectedPlace = null; expanded = false; credit.hidden = true; regionIds = null; regionTag = ""; regionNotice.hidden = true; applyFilters(); });
    root.addEventListener("submit", locate);
    status.addEventListener("change", function () { applyFilters(); });
    override.addEventListener("change", function () { applyFilters(); });
    showAll.addEventListener("click", function () { expanded = true; applyFilters(); });
    page.querySelectorAll("[data-community-clear]").forEach(function (button) {
      button.addEventListener("click", function () {
        cancelLookup(); selectedPlace = null; expanded = false; credit.hidden = true;
        regionIds = null; regionTag = ""; regionNotice.hidden = true;
        search.value = ""; status.value = ""; override.checked = false;
        applyFilters(); search.focus();
      });
    });
    search.value = params.get("community") || "";
    applyFilters(false);
    if (regionTag && window.MeshCoreRegionProfile) {
      var requestedRegion = regionTag;
      window.MeshCoreRegionProfile.load().then(function (data) {
        if (regionTag !== requestedRegion || !data.profiles[regionTag]) return;
        regionIds = data.profiles[regionTag].communities.map(function (community) { return community.id; });
        regionNotice.textContent = (isFrench ? "Contacts associés à la région " : "Contacts associated with region ") + regionTag.toUpperCase() + (isFrench ? ". Les points de référence ne représentent pas la couverture radio. Effacez le filtre pour voir toutes les communautés." : ". Reference points are not radio coverage. Clear the filter to see every community.");
        regionNotice.hidden = false;
        applyFilters(false);
      }).catch(function () { regionNotice.hidden = false; regionNotice.textContent = isFrench ? "Filtre régional indisponible; toutes les communautés restent accessibles." : "Region filter unavailable; all communities remain available."; });
    }
    if (search.value && params.get("nearby") === "1") locate();
  }

  globalThis.MeshCoreCommunitySearch = { distanceKm: distanceKm, placeCandidates: placeCandidates, splitPlaceQuery: splitPlaceQuery };
  function initialize() { document.querySelectorAll("[data-community-directory]").forEach(initializeDirectory); }
  if (typeof document === "undefined") return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
  if (typeof window.document$ !== "undefined") window.document$.subscribe(initialize);
})();
