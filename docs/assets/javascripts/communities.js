(function () {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function initializeDirectory(root) {
    if (!root || root.dataset.communityReady === "true") {
      return;
    }

    var search = root.querySelector("#community-search");
    var status = root.querySelector("#community-status");
    var override = root.querySelector("#community-override");
    var count = root.querySelector("[data-community-count]");
    var page = root.closest(".md-content") || document;
    var cards = Array.prototype.slice.call(
      page.querySelectorAll("[data-community-card]")
    );
    var empty = page.querySelector("[data-community-empty]");
    var clearButtons = page.querySelectorAll("[data-community-clear]");

    if (!search || !status || !override || !count || !empty || !cards.length) {
      return;
    }

    root.dataset.communityReady = "true";

    function updateUrl(query) {
      if (!window.history || !window.history.replaceState) {
        return;
      }
      var url = new URL(window.location.href);
      if (query) {
        url.searchParams.set("community", query);
      } else {
        url.searchParams.delete("community");
      }
      window.history.replaceState(null, "", url);
    }

    function applyFilters(options) {
      var query = normalize(search.value);
      var selectedStatus = status.value;
      var requireOverride = override.checked;
      var visible = 0;

      cards.forEach(function (card) {
        var matchesQuery =
          !query || normalize(card.dataset.communitySearch).indexOf(query) !== -1;
        var matchesStatus =
          !selectedStatus || card.dataset.communityStatus === selectedStatus;
        var matchesOverride =
          !requireOverride || card.dataset.communityOverride === "true";
        var show = matchesQuery && matchesStatus && matchesOverride;
        card.hidden = !show;
        if (show) {
          visible += 1;
        }
      });

      empty.hidden = visible !== 0;
      count.textContent =
        "Showing " + visible + " " + (visible === 1 ? "community" : "communities");
      if (!options || options.updateUrl !== false) {
        updateUrl(search.value.trim());
      }
    }

    function clearFilters() {
      search.value = "";
      status.value = "";
      override.checked = false;
      applyFilters();
      search.focus();
    }

    search.addEventListener("input", applyFilters);
    status.addEventListener("change", applyFilters);
    override.addEventListener("change", applyFilters);
    clearButtons.forEach(function (button) {
      button.addEventListener("click", clearFilters);
    });

    var initialQuery = new URL(window.location.href).searchParams.get("community");
    if (initialQuery) {
      search.value = initialQuery;
    }
    applyFilters({ updateUrl: false });
  }

  function initialize() {
    document
      .querySelectorAll("[data-community-directory]")
      .forEach(initializeDirectory);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  if (typeof window.document$ !== "undefined") {
    window.document$.subscribe(initialize);
  }
})();
