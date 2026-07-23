(function () {
  "use strict";

  var isFrench = /^fr(?:-|$)/i.test(
    document.documentElement ? document.documentElement.lang || "" : ""
  );

  function tr(english, french) {
    return isFrench ? french : english;
  }

  function utf8Length(text) {
    if (window.TextEncoder) return new TextEncoder().encode(text).length;
    return unescape(encodeURIComponent(text)).length;
  }

  function safeCliToken(text) {
    // MeshCore's device CLI does not publish a general quoting contract.
    // Reject ambiguous values instead of guessing shell-style escaping.
    return /^[A-Za-z0-9!#$%&()*+,./:=?@^_~-]+$/.test(text);
  }

  function markInvalid(field, invalid) {
    field.setAttribute("aria-invalid", invalid ? "true" : "false");
  }

  function redactedCommands(commands) {
    return commands.map(function (line) {
      if (line.indexOf("set wifi.ssid ") === 0) {
        return isFrench ? "set wifi.ssid [masqué]" : "set wifi.ssid [hidden]";
      }
      if (line.indexOf("set wifi.pwd ") === 0) {
        return isFrench ? "set wifi.pwd [masqué]" : "set wifi.pwd [hidden]";
      }
      return line;
    });
  }

  async function populateLocations(root, datalist, status) {
    var source = root.dataset.locationSource;
    if (!source || !datalist) return;
    try {
      var response = await fetch(source, {credentials: "same-origin"});
      if (!response.ok) throw new Error("location data request failed");
      var payload = await response.json();
      if (!payload || payload.schema_version !== 1 || !Array.isArray(payload.locations)) {
        throw new Error("location data is invalid");
      }
      var fragment = document.createDocumentFragment();
      payload.locations.forEach(function (location) {
        if (!/^[A-Z]{3}$/.test(location.code)) return;
        var option = document.createElement("option");
        option.value = location.code;
        option.label = location.name + ", " + location.province;
        fragment.appendChild(option);
      });
      datalist.replaceChildren(fragment);
      status.textContent = payload.locations.length + tr(
        " Canadian quick-list codes loaded.",
        " codes canadiens chargés dans la liste de suggestions."
      );
    } catch (_error) {
      status.textContent = tr(
        "Location suggestions are unavailable. You can still enter a real 3-letter airport code.",
        "Les suggestions d’emplacement ne sont pas disponibles. Vous pouvez tout de même entrer un vrai code d’aéroport à 3 lettres."
      );
    }
  }

  function init() {
    var root = document.getElementById("observer-command-builder");
    if (!root || root.dataset.ready === "true") return;

    var fields = {
      board: document.getElementById("observer-board"),
      iata: document.getElementById("observer-iata"),
      role: document.getElementById("observer-role"),
      number: document.getElementById("observer-number"),
      ssid: document.getElementById("observer-ssid"),
      password: document.getElementById("observer-password"),
      repeat: document.getElementById("observer-repeat")
    };
    var output = document.getElementById("observer-command-output");
    var status = document.getElementById("observer-copy-status");
    var errors = document.getElementById("observer-command-errors");
    var summary = document.getElementById("observer-command-summary");
    var copyButton = document.getElementById("observer-copy-commands");
    var revealCommandsButton = document.getElementById("observer-reveal-commands");
    var togglePasswordButton = document.getElementById("observer-toggle-password");
    var clearButton = document.getElementById("observer-clear-secrets");
    var datalist = document.getElementById("observer-iata-list");
    var locationStatus = document.getElementById("observer-location-status");
    if (
      Object.values(fields).some(function (field) { return !field; }) ||
      !output || !status || !errors || !summary || !copyButton ||
      !revealCommandsButton || !togglePasswordButton || !clearButton
    ) {
      return;
    }

    root.dataset.ready = "true";
    var exactCommands = [];
    var commandsRevealed = false;

    function hideExactCommands() {
      commandsRevealed = false;
      revealCommandsButton.textContent = tr(
        "Reveal sensitive commands",
        "Afficher les commandes sensibles"
      );
      revealCommandsButton.setAttribute("aria-pressed", "false");
      copyButton.disabled = true;
    }

    function showCurrentCommands() {
      output.textContent = (commandsRevealed ? exactCommands : redactedCommands(exactCommands)).join("\n");
      revealCommandsButton.textContent = commandsRevealed
        ? tr("Hide sensitive commands", "Masquer les commandes sensibles")
        : tr("Reveal sensitive commands", "Afficher les commandes sensibles");
      revealCommandsButton.setAttribute("aria-pressed", commandsRevealed ? "true" : "false");
      copyButton.disabled = !commandsRevealed || !exactCommands.length;
    }

    function renderSummary(board, iata, nodeName, repeat) {
      var values = [
        [tr("Board", "Carte"), fields.board.options[fields.board.selectedIndex].text],
        [tr("Location", "Emplacement"), iata || tr("Not set", "Non défini")],
        [tr("Node name", "Nom du nœud"), nodeName || tr("Not set", "Non défini")],
        [
          tr("Mesh traffic", "Trafic du réseau maillé"),
          repeat === "on"
            ? tr("Observe and repeat", "Observer et relayer")
            : tr("Observe only", "Observer seulement")
        ]
      ];
      var fragment = document.createDocumentFragment();
      values.forEach(function (entry) {
        var wrapper = document.createElement("div");
        var term = document.createElement("dt");
        var detail = document.createElement("dd");
        term.textContent = entry[0];
        detail.textContent = entry[1];
        wrapper.appendChild(term);
        wrapper.appendChild(detail);
        fragment.appendChild(wrapper);
      });
      summary.replaceChildren(fragment);
      summary.dataset.board = board;
    }

    function render() {
      var messages = [];
      var board = fields.board.value;
      var iata = (fields.iata.value || "").trim().toUpperCase();
      var role = fields.role.value;
      var number = (fields.number.value || "").trim();
      var ssid = fields.ssid.value || "";
      var password = fields.password.value || "";
      var repeat = fields.repeat.value;
      var nodeName = iata && number ? iata + "-" + role + "-" + number : "";

      [fields.iata, fields.number, fields.ssid, fields.password].forEach(function (field) {
        markInvalid(field, false);
      });

      if (!/^[A-Z]{3}$/.test(iata) || iata === "XXX" || iata === "CAN") {
        messages.push(tr(
          "Enter a real 3-letter airport code; do not use XXX or CAN.",
          "Entrez un vrai code d’aéroport à 3 lettres; n’utilisez pas XXX ni CAN."
        ));
        markInvalid(fields.iata, true);
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,15}$/.test(number)) {
        messages.push(tr(
          "Node number must use 1–16 letters, numbers, underscores, or hyphens.",
          "Le numéro du nœud doit comporter de 1 à 16 lettres, chiffres, traits de soulignement ou traits d’union."
        ));
        markInvalid(fields.number, true);
      }
      if (nodeName && utf8Length(nodeName) > 24) {
        messages.push(tr(
          "The generated node name is over 24 bytes; shorten the node number.",
          "Le nom de nœud généré dépasse 24 octets; raccourcissez le numéro du nœud."
        ));
        markInvalid(fields.number, true);
      }
      if (!ssid || utf8Length(ssid) > 32 || !safeCliToken(ssid)) {
        messages.push(tr(
          "Enter a 1–32 byte SSID without spaces, quotes, backslashes, semicolons, pipes, control characters, or non-ASCII text. Use Configure via USB for other SSIDs.",
          "Entrez un SSID de 1 à 32 octets, sans espaces, guillemets, barres obliques inverses, points-virgules, barres verticales, caractères de contrôle ni texte non ASCII. Utilisez Configure via USB pour les autres SSID."
        ));
        markInvalid(fields.ssid, true);
      }
      if (!password || utf8Length(password) > 64 || !safeCliToken(password)) {
        messages.push(tr(
          "Enter a 1–64 byte password using the safe CLI character set, or use Configure via USB for this network.",
          "Entrez un mot de passe de 1 à 64 octets avec les caractères permis par l’interface de commande, ou utilisez Configure via USB pour ce réseau."
        ));
        markInvalid(fields.password, true);
      }

      hideExactCommands();
      errors.textContent = messages.join(" ");
      renderSummary(board, iata, nodeName, repeat);

      if (messages.length) {
        exactCommands = [];
        revealCommandsButton.disabled = true;
        output.textContent = tr(
          "Complete the required fields to build commands.",
          "Remplissez les champs obligatoires pour générer les commandes."
        );
        return;
      }

      exactCommands = [
        "set name " + nodeName,
        "set radio 910.525,62.5,7,5",
        "set path.hash.mode 2",
        "set mqtt.iata " + iata,
        "set wifi.ssid " + ssid,
        "set wifi.pwd " + password,
        "set wifi.powersave none",
        "set mqtt1.preset meshcore-ca-1",
        "set mqtt2.preset meshcore-ca-2",
        "set mqtt3.preset none",
        "set mqtt4.preset none",
        "set mqtt5.preset none",
        "set mqtt6.preset none",
        "set mqtt.status on",
        "set mqtt.packets on",
        "set mqtt.raw off",
        "set mqtt.rx on",
        "set mqtt.tx advert",
        "set bridge.enabled on",
        "set repeat " + repeat,
        "advert",
        "reboot"
      ];
      revealCommandsButton.disabled = false;
      showCurrentCommands();
    }

    function clearSecrets() {
      fields.ssid.value = "";
      fields.password.value = "";
      fields.password.type = "password";
      togglePasswordButton.textContent = tr("Show", "Afficher");
      togglePasswordButton.setAttribute("aria-pressed", "false");
      exactCommands = [];
      hideExactCommands();
      output.textContent = tr("Wi-Fi fields cleared.", "Champs Wi-Fi effacés.");
      errors.textContent = "";
      fields.ssid.focus();
    }

    root.addEventListener("input", render);
    root.addEventListener("change", render);
    togglePasswordButton.addEventListener("click", function () {
      var showing = fields.password.type === "text";
      fields.password.type = showing ? "password" : "text";
      togglePasswordButton.textContent = showing
        ? tr("Show", "Afficher")
        : tr("Hide", "Masquer");
      togglePasswordButton.setAttribute("aria-pressed", showing ? "false" : "true");
      fields.password.focus();
    });
    revealCommandsButton.addEventListener("click", function () {
      if (!exactCommands.length) return;
      commandsRevealed = !commandsRevealed;
      showCurrentCommands();
    });
    copyButton.addEventListener("click", function () {
      if (!commandsRevealed || !exactCommands.length) return;
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        status.textContent = tr(
          "Clipboard unavailable. Copy the revealed commands manually.",
          "Le presse-papiers n’est pas disponible. Copiez manuellement les commandes affichées."
        );
        return;
      }
      navigator.clipboard.writeText(exactCommands.join("\n")).then(function () {
        status.textContent = tr(
          "Copied. Your clipboard now contains Wi-Fi credentials.",
          "Copié. Votre presse-papiers contient maintenant vos identifiants Wi-Fi."
        );
      }, function () {
        status.textContent = tr(
          "Copy failed. Copy the revealed commands manually.",
          "Échec de la copie. Copiez manuellement les commandes affichées."
        );
      });
    });
    clearButton.addEventListener("click", clearSecrets);
    window.addEventListener("pagehide", clearSecrets);

    populateLocations(root, datalist, locationStatus);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
