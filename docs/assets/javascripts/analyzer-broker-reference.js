(function () {
  "use strict";

  var isFrench = /^fr(?:-|$)/i.test(
    document.documentElement ? document.documentElement.lang || "" : ""
  );

  function tr(english, french) {
    return isFrench ? french : english;
  }

  function cell(row, value) {
    var item = document.createElement("td");
    item.textContent = String(value);
    row.appendChild(item);
  }

  function validConfig(config) {
    return config &&
      config.schema_version === 1 &&
      Array.isArray(config.brokers) &&
      config.brokers.length === 2 &&
      config.brokers.every(function (broker) {
        return /^mqtt[12]\.meshcore\.ca$/.test(broker.host) &&
          broker.port === 443 &&
          broker.transport === "websockets" &&
          broker.tls === true &&
          broker.verify_tls === true &&
          broker.token_audience === broker.host;
      });
  }

  async function init() {
    var root = document.getElementById("broker-reference");
    if (!root || root.dataset.ready === "true") return;
    var body = document.getElementById("broker-reference-body");
    var status = document.getElementById("broker-reference-status");
    if (!body || !status || !root.dataset.source) return;

    root.dataset.ready = "true";
    try {
      var response = await fetch(root.dataset.source, {credentials: "same-origin"});
      if (!response.ok) throw new Error("configuration request failed");
      var config = await response.json();
      if (!validConfig(config)) throw new Error("configuration is invalid");

      var fragment = document.createDocumentFragment();
      config.brokers.forEach(function (broker) {
        var row = document.createElement("tr");
        cell(row, broker.id === "primary"
          ? tr("Primary", "Principal")
          : tr("Backup", "Secours"));
        cell(row, broker.host);
        cell(row, broker.port);
        cell(row, "WebSockets");
        cell(row, tr(
          "Required; verify certificates",
          "Requis; vérifier les certificats"
        ));
        cell(row, broker.token_audience);
        fragment.appendChild(row);
      });
      body.replaceChildren(fragment);
      status.textContent = isFrench
        ? "Configuration de l’observateur " + config.version +
          ", vérifiée le " + config.last_reviewed + "."
        : "Observer configuration " + config.version +
          ", reviewed " + config.last_reviewed + ".";
    } catch (_error) {
      status.textContent = tr(
        "The generated broker table could not be loaded. Open the canonical JSON below.",
        "Impossible de charger le tableau des serveurs MQTT. Ouvrez le fichier JSON de référence ci-dessous."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
