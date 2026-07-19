(function () {
  "use strict";

  var methods = {
    "remote-term": {
      title: "Use RemoteTerm",
      description: "Keep using the radio connection and management screen you already have.",
      href: "../remoteterm/"
    },
    "home-assistant": {
      title: "Use Home Assistant",
      description: "Add the MeshCore Canada broker pair inside your existing MeshCore integration.",
      href: "../builds/meshcore-ha/"
    },
    "pymc": {
      title: "Use PyMC",
      description: "Add the broker pair to the PyMC service you already operate.",
      href: "../builds/pymc/"
    },
    "usb-host": {
      title: "Use MCtoMQTT",
      description: "Run a small bridge on the Linux or macOS computer connected to the radio by USB.",
      href: "../builds/mctomqtt/"
    },
    "wifi-board": {
      title: "Use standalone MQTT firmware",
      description: "A supported Wi-Fi LoRa board can listen and publish without a separate computer.",
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
      link.textContent = "Open this setup guide";
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
