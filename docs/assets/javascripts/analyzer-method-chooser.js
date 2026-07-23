(function () {
  "use strict";

  var isFrench = /^fr(?:-|$)/i.test(
    document.documentElement ? document.documentElement.lang || "" : ""
  );

  function tr(english, french) {
    return isFrench ? french : english;
  }

  var methods = {
    "remote-term": {
      title: tr("Use RemoteTerm", "Utiliser RemoteTerm"),
      description: tr(
        "Keep using the radio connection and management screen you already have.",
        "Continuez d’utiliser la connexion radio et l’écran de gestion dont vous disposez déjà."
      ),
      href: "../remoteterm/"
    },
    "home-assistant": {
      title: tr("Use Home Assistant", "Utiliser Home Assistant"),
      description: tr(
        "Add the MeshCore Canada broker pair inside your existing MeshCore integration.",
        "Ajoutez les deux serveurs MQTT de MeshCore Canada à votre intégration MeshCore existante."
      ),
      href: "../builds/meshcore-ha/"
    },
    "pymc": {
      title: tr("Use PyMC", "Utiliser PyMC"),
      description: tr(
        "Add the broker pair to the PyMC service you already operate.",
        "Ajoutez les deux serveurs MQTT au service PyMC que vous exploitez déjà."
      ),
      href: "../builds/pymc/"
    },
    "usb-host": {
      title: tr("Use MCtoMQTT", "Utiliser MCtoMQTT"),
      description: tr(
        "Run a small bridge on the Linux or macOS computer connected to the radio by USB.",
        "Exécutez une petite passerelle sur l’ordinateur Linux ou macOS relié à la radio par USB."
      ),
      href: "../builds/mctomqtt/"
    },
    "wifi-board": {
      title: tr("Use standalone MQTT firmware", "Utiliser un micrologiciel MQTT autonome"),
      description: tr(
        "A supported Wi-Fi LoRa board can listen and publish without a separate computer.",
        "Une carte LoRa Wi-Fi compatible peut écouter et publier sans ordinateur distinct."
      ),
      href: "../builds/mqtt-firmware/"
    }
  };

  function init() {
    var root = document.getElementById("observer-method-chooser");
    if (!root || root.dataset.ready === "true") return;

    var select = root.querySelector("select");
    var result = document.getElementById("observer-method-result");
    if (!select || !result) return;

    root.dataset.ready = "true";
    select.addEventListener("change", function () {
      var method = methods[select.value];
      if (!method) {
        result.hidden = true;
        result.replaceChildren();
        return;
      }

      var heading = document.createElement("strong");
      heading.textContent = method.title;
      var detail = document.createElement("span");
      detail.textContent = method.description + " ";
      var link = document.createElement("a");
      link.href = method.href;
      link.textContent = tr("Open this setup guide", "Ouvrir ce guide de configuration");
      detail.appendChild(link);
      result.replaceChildren(heading, detail);
      result.hidden = false;
      result.focus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
