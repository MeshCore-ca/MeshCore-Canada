(function () {
  "use strict";
  var scriptUrl = document.currentScript.src;
  var french = document.documentElement.lang.startsWith("fr");
  var t = function (en, fr) { return french ? fr : en; };
  var esc = function (text) { return String(text).replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; }); };
  function href(base, path, tag, province, request) {
    var url = new URL(path, base);
    url.searchParams.set(path.startsWith("config/") ? "tag" : "region", tag);
    if (province) url.searchParams.set("province", province);
    if (request) url.searchParams.set("request", request);
    return esc(url.href);
  }
  var catalogue;
  function load() {
    if (!catalogue) catalogue = fetch(new URL("../regions/iata-regions.json", scriptUrl), { cache: "no-cache" }).then(function (res) { if (!res.ok) throw new Error("Region data unavailable"); return res.json(); }).catch(function (error) { catalogue = null; throw error; });
    return catalogue;
  }
  function init() {
    var params = new URLSearchParams(location.search), tag = params.get("region");
    if (!/^[a-z]{3}$/.test(tag || "") || !/\/(start|meshcore)\//.test(location.pathname)) return;
    var article = document.querySelector("article.md-content__inner"), heading = article && article.querySelector("h1");
    if (!heading || article.querySelector("[data-region-context]")) return;
    load().then(function (data) {
      if (!data.profiles[tag] || !heading.isConnected || article.querySelector("[data-region-context]") || new URLSearchParams(location.search).get("region") !== tag) return;
      var prefix = location.pathname.includes("/fr/") ? "fr/" : "";
      var assetRoot = new URL("../../", scriptUrl);
      var base = new URL(prefix, assetRoot);
      var province = data.policy.zoneProvinces[tag].includes(params.get("province")) ? params.get("province") : "";
      var banner = document.createElement("aside"); banner.dataset.regionContext = ""; banner.className = "mc-region-profile";
      banner.innerHTML = '<strong>' + t("Selected region", "Région choisie") + ': ' + esc(tag.toUpperCase()) + '</strong> · <a href="' + href(base, "config/map/", tag, province) + '">' + t("View region", "Voir la région") + '</a> · <a href="' + href(base, "config/", tag, province) + '">' + t("Set up a repeater", "Configurer un répéteur") + '</a>';
      heading.after(banner);
    }).catch(function () { /* The page remains usable without context data. */ });
  }
  globalThis.MeshCoreRegionProfile = { load: load };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  if (window.document$) window.document$.subscribe(init);
})();
