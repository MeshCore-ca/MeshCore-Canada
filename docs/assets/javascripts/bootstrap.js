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
      var current = (link.getAttribute("aria-label") || "").trim();
      if (!current) {
        var text = (link.textContent || "").trim();
        if (!text) text = (link.getAttribute("title") || "External link").trim();
        link.setAttribute("aria-label", text + " (opens in a new tab)");
      }
    });
  }

  function makeHeaderToggleAccessible(label, checkbox, name, panel) {
    if (!label || !checkbox || label.dataset.mcToggleReady === "true") return;
    label.dataset.mcToggleReady = "true";
    label.setAttribute("role", "button");
    label.setAttribute("tabindex", "0");
    if (!label.hasAttribute("aria-label")) label.setAttribute("aria-label", name);
    if (panel) {
      if (!panel.id) panel.id = "mc-" + checkbox.id.replace(/^__/, "") + "-panel";
      label.setAttribute("aria-controls", panel.id);
    }

    function updateState() {
      var expanded = checkbox.checked;
      label.setAttribute("aria-expanded", expanded ? "true" : "false");
      label.setAttribute("aria-label", expanded ? name.replace(/^Open /, "Close ") : name);
    }

    var suppressKeyboardClick = false;
    label.addEventListener("click", function (event) {
      if (!suppressKeyboardClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressKeyboardClick = false;
    });
    label.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      suppressKeyboardClick = true;
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      window.setTimeout(function () { suppressKeyboardClick = false; }, 0);
    });
    checkbox.addEventListener("change", updateState);
    updateState();
  }

  function labelThemeControls() {
    var search = document.querySelector(".md-search[role='dialog']");
    if (search && !search.hasAttribute("aria-label")) {
      search.setAttribute("aria-label", "Site search");
    }

    var drawerToggle = document.getElementById("__drawer");
    var drawer = document.querySelector(".md-sidebar--primary");
    document.querySelectorAll("label.md-header__button[for='__drawer']").forEach(function (label) {
      makeHeaderToggleAccessible(label, drawerToggle, "Open navigation", drawer);
    });

    var searchToggle = document.getElementById("__search");
    document.querySelectorAll("label.md-header__button[for='__search'], label.md-search__icon[for='__search']").forEach(function (label) {
      makeHeaderToggleAccessible(label, searchToggle, "Open site search", search);
    });

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

  function initialiseResponsiveTables() {
    document.querySelectorAll(".mc-table-wrap table").forEach(function (table) {
      if (table.dataset.mcResponsiveReady === "true") return;

      var headings = Array.from(table.querySelectorAll("thead th")).map(function (heading) {
        return (heading.textContent || "").replace(/\s+/g, " ").trim();
      });
      if (!headings.length) return;

      table.querySelectorAll("tbody tr").forEach(function (row) {
        var column = 0;
        Array.from(row.children).forEach(function (cell) {
          var span = Math.max(Number.parseInt(cell.getAttribute("colspan") || "1", 10), 1);
          var labels = headings.slice(column, column + span).filter(Boolean);
          if (labels.length) cell.setAttribute("data-label", labels.join(" / "));
          column += span;
        });
      });

      table.dataset.mcResponsiveReady = "true";
      table.classList.add("mc-table--responsive");
      table.closest(".mc-table-wrap").classList.add("mc-table-wrap--responsive");
    });
  }

  function initialiseRepoStars() {
    var counters = Array.from(document.querySelectorAll("[data-mc-repo-stars]"));
    if (!counters.length || counters.every(function (counter) {
      return counter.dataset.mcRepoStarsReady === "true";
    })) return;
    counters.forEach(function (counter) {
      counter.dataset.mcRepoStarsReady = "true";
    });

    var language = document.documentElement.lang || "en";

    function showCount(value) {
      var count = Number(value);
      if (!Number.isFinite(count)) return;
      var formatted = count.toLocaleString(language);
      counters.forEach(function (counter) {
        var countNode = counter.querySelector("[data-mc-repo-star-count]");
        if (countNode) countNode.textContent = formatted;
        counter.setAttribute(
          "aria-label",
          language.startsWith("fr") ? formatted + " étoiles GitHub" : formatted + " GitHub stars"
        );
      });
    }

    try {
      var cached = window.sessionStorage.getItem("meshcore-canada:github-stars:v1");
      if (cached !== null) {
        showCount(cached);
        return;
      }
    } catch (_error) {
      // The build-time count remains visible when storage is unavailable.
    }

    window.fetch("https://api.github.com/repos/MeshCore-ca/MeshCore-Canada", {
      cache: "force-cache",
      referrerPolicy: "no-referrer"
    }).then(function (response) {
      if (!response.ok) throw new Error("GitHub repository request failed");
      return response.json();
    }).then(function (repository) {
      var count = Number(repository.stargazers_count);
      if (!Number.isFinite(count)) return;
      showCount(count);
      try {
        window.sessionStorage.setItem("meshcore-canada:github-stars:v1", String(count));
      } catch (_error) {
        // The live count still works when storage is unavailable.
      }
    }).catch(function () {
      // Keep the build-time count when GitHub is unavailable.
    });
  }

  // On small screens Material opens the drawer inside the current page's
  // section (e.g. "Start" on the home page). Collapse those sections each time
  // the drawer opens so people always start at the main menu.
  function openDrawerAtTopLevel() {
    var drawerToggle = document.getElementById("__drawer");
    if (!drawerToggle || drawerToggle.dataset.mcTopLevelReady === "true") return;
    drawerToggle.dataset.mcTopLevelReady = "true";
    var mobile = window.matchMedia("(max-width: 76.234375em)");
    drawerToggle.addEventListener("change", function () {
      if (!drawerToggle.checked || !mobile.matches) return;
      document.querySelectorAll(".md-nav--primary input.md-nav__toggle").forEach(function (toggle) {
        toggle.checked = false;
      });
    });
  }

  function initialise() {
    openDrawerAtTopLevel();
    initialiseProgress();
    labelExternalLinks();
    labelThemeControls();
    initialiseSearchInputs();
    initialiseResponsiveTables();
    initialiseRepoStars();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(initialise);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
