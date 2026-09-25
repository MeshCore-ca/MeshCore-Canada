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
  function render(data, tag, province, base) {
    var profile = data.profiles && data.profiles[tag];
    if (!profile) return "";
    var review = profile.settingsReview;
    var stale = review.checkedAt && Date.now() - Date.parse(review.checkedAt) > 180 * 86400000;
    var settings = review.status === "confirmed" ? (stale ? t("Due for a new check", "À revérifier") : t("Locally confirmed", "Confirmés localement")) : t("Not locally confirmed", "Non confirmés localement");
    var owner = profile.maintainer ? '<a href="' + esc(profile.maintainer.contact) + '">' + esc(profile.maintainer.name) + '</a>' : t("No maintainer listed", "Aucun responsable indiqué");
    var contacts = profile.communities.map(function (community) {
      var url = new URL(community.route.replace(/^\//, ""), base);
      return '<li><a href="' + esc(url.href) + '">' + esc(french ? community.nameFr : community.name) + '</a>' + (community.override ? ' — ' + t("different radio settings listed", "réglages radio différents indiqués") : '') + '</li>';
    }).join("");
    return '<section class="mc-region-profile" aria-label="' + t("Region profile", "Fiche régionale") + '"><h3>' + t("Your region", "Votre région") + ': <code>' + esc(tag.toUpperCase()) + '</code></h3>' +
      '<dl><div><dt>' + t("Boundary source", "Source des limites") + '</dt><dd>' + (data.status[tag].state === "published" ? "MeshMapper" : t("MeshCore Canada planning region", "Région proposée par MeshCore Canada")) + ' · ' + esc(data.status[tag].state === "published" ? data.source.fetchedAt.slice(0,10) : data.source.starterReviewedAt) + '</dd></div>' +
      '<div><dt>' + t("Local settings", "Réglages locaux") + '</dt><dd>' + settings + (review.checkedAt ? ' · <a href="' + esc(review.evidence) + '">' + esc(review.checkedAt) + '</a>' : '') + '</dd></div>' +
      '<div><dt>' + t("Maintainer", "Responsable") + '</dt><dd>' + owner + '</dd></div></dl>' +
      '<p>' + t("A published boundary does not confirm local radio settings or adoption. Directory contacts below are not appointed region maintainers.", "Une limite publiée ne confirme ni les réglages radio ni l’adoption locale. Les contacts ci-dessous ne sont pas des responsables régionaux désignés.") + '</p>' +
      (contacts ? '<ul>' + contacts + '</ul>' : '<p>' + t("No community contact is listed for this region yet.", "Aucun contact communautaire n’est encore indiqué pour cette région.") + '</p>') +
      '<p><a href="' + href(base, "provinces/", tag, province) + '">' + t("Community listings", "Communautés") + '</a> · ' +
      '<a href="' + href(base, "start/companion/", tag, province) + '">' + t("Companion setup", "Configurer un compagnon") + '</a> · ' +
      '<a href="' + href(base, "start/repeater/", tag, province) + '">' + t("Repeater setup", "Configurer un répéteur") + '</a> · ' +
      '<a href="' + href(base, "start/observer/", tag, province) + '">' + t("Observer setup", "Configurer un observateur") + '</a> · ' +
      '<a href="' + href(base, "meshcore/generate-repeater-id/", tag, province) + '">' + t("Optional ID check", "Vérification facultative d’identifiant") + '</a></p>' +
      '<p><a href="' + href(base, "submit-idea/", tag, province, "maintainer") + '">' + t("Volunteer as maintainer", "Devenir responsable") + '</a> · ' +
      '<a href="' + href(base, "submit-idea/", tag, province, "settings") + '">' + t("Confirm local settings", "Confirmer les réglages locaux") + '</a> · ' +
      '<a href="' + href(base, "submit-idea/", tag, province, "boundary") + '">' + t("Suggest a boundary change", "Proposer une limite") + '</a></p></section>';
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
      banner.innerHTML = '<strong>' + t("Selected region", "Région choisie") + ': ' + esc(tag.toUpperCase()) + '</strong> · <a href="' + href(base, "config/map/", tag, province) + '">' + t("View region", "Voir la région") + '</a> · <a href="' + href(base, "config/", tag, province) + '">' + t("Repeater commands", "Commandes du répéteur") + '</a>';
      heading.after(banner);
    }).catch(function () { /* The page remains usable without context data. */ });
  }
  globalThis.MeshCoreRegionProfile = { render: render, load: load };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  if (window.document$) window.document$.subscribe(init);
})();
