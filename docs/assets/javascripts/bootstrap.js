(function () {
  "use strict";

  var storagePrefix = "meshcore-canada:progress:v1:";

  function storageKey(input) {
    var pageKey = input.closest("[data-mc-progress-page]");
    var scope = pageKey ? pageKey.getAttribute("data-mc-progress-page") : window.location.pathname;
    return storagePrefix + scope + ":" + input.id;
  }

  function readProgress(input) {
    try {
      return window.localStorage.getItem(storageKey(input)) === "done";
    } catch (_error) {
      return false;
    }
  }

  function writeProgress(input) {
    try {
      if (input.checked) {
        window.localStorage.setItem(storageKey(input), "done");
      } else {
        window.localStorage.removeItem(storageKey(input));
      }
    } catch (_error) {
      // The journey still works when storage is blocked or unavailable.
    }
  }

  function initialiseProgress() {
    document.querySelectorAll("input[type='checkbox'][data-mc-progress]").forEach(function (input) {
      if (!input.id || input.dataset.mcProgressReady === "true") return;
      input.dataset.mcProgressReady = "true";
      input.checked = readProgress(input);
      input.addEventListener("change", function () {
        writeProgress(input);
      });
    });
  }

  function labelExternalLinks() {
    document.querySelectorAll("a[target='_blank']").forEach(function (link) {
      if (link.dataset.mcExternalReady === "true") return;
      link.dataset.mcExternalReady = "true";
      var current = link.getAttribute("aria-label");
      if (!current) {
        var text = (link.textContent || "External link").trim();
        link.setAttribute("aria-label", text + " (opens in a new tab)");
      }
    });
  }

  function labelThemeControls() {
    var search = document.querySelector(".md-search[role='dialog']");
    if (search && !search.hasAttribute("aria-label")) {
      search.setAttribute("aria-label", "Site search");
    }

    document.querySelectorAll("a[href]").forEach(function (link) {
      if ((link.textContent || "").trim() !== "Start") return;
      if (!/\/start\/(?:$|[?#])/.test(link.href)) return;
      link.setAttribute("aria-label", "Start using MeshCore");
    });
  }

  function initialiseSearchInputs() {
    document.querySelectorAll(".md-search__input").forEach(function (input) {
      if (input.dataset.mcSearchReady === "true") return;
      input.dataset.mcSearchReady = "true";

      var pendingKeyup;

      input.addEventListener("input", function () {
        window.clearTimeout(pendingKeyup);
        pendingKeyup = window.setTimeout(function () {
          input.dispatchEvent(new KeyboardEvent("keyup", {
            bubbles: true,
            key: "Unidentified",
            code: "Unidentified"
          }));
        }, 60);
      });

      input.addEventListener("keyup", function (event) {
        if (event.isTrusted) {
          window.clearTimeout(pendingKeyup);
        }
      });
    });
  }

  function initialise() {
    initialiseProgress();
    labelExternalLinks();
    labelThemeControls();
    initialiseSearchInputs();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(initialise);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
