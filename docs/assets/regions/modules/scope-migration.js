(function () {
  "use strict";
  var scope = globalThis.MeshCoreIataScopes;
  var validName = /^[A-Za-z0-9][A-Za-z0-9_-]{0,30}$/;

  function parse(text, defaultScope) {
    if (typeof text !== "string" || text.length > 4096 || /\t/.test(text)) throw new Error("Invalid region list");
    var lines = text.replace(/\r/g, "").replace(/^\n+|\n+$/g, "").split("\n");
    var nodes = [], stack = [], names = new Set(), home = null;
    lines.forEach(function (line, index) {
      var match = /^( *)(\*|[A-Za-z0-9][A-Za-z0-9_-]{0,30})(\^)?( F)?$/.exec(line);
      if (!match || (index === 0 ? match[1].length !== 0 || match[2] !== "*" : match[1].length === 0 || match[2] === "*")) throw new Error("Invalid region list");
      var depth = match[1].length, name = match[2];
      if (depth > stack.length || names.has(name) || nodes.length >= 32) throw new Error("Invalid region list");
      if (match[3]) { if (home) throw new Error("Invalid region list"); home = name; }
      names.add(name);
      nodes.push({ name: name, parent: depth ? stack[depth - 1] : null, depth: depth, forward: !!match[4] });
      stack.length = depth; stack.push(name);
    });
    var value = String(defaultScope || "").trim().replace(/^default scope is (?:now )?/, "");
    if (value && value !== "<null>" && (!validName.test(value) || !names.has(value))) throw new Error("Invalid default scope");
    return { nodes: nodes, home: home, defaultScope: value || null, text: lines.join("\n") };
  }

  function plan(current, desired, firmware) {
    if (["1.14", "1.15", "1.16"].indexOf(firmware) === -1) throw new Error("Unsupported firmware");
    var old = new Map(current.nodes.map(function (node) { return [node.name, node]; }));
    var kept = desired.tags.filter(function (tag) { return old.has(tag); });
    var added = desired.tags.filter(function (tag) { return !old.has(tag); });
    var removed = current.nodes.filter(function (node) { return node.name !== "*" && desired.tags.indexOf(node.name) === -1; });
    var changes = kept.filter(function (tag) { var node = old.get(tag); return !node.forward || node.parent !== (desired.parentOverrides[tag] || "*"); });
    var commands = [];
    // Detach retained children before removing their obsolete ancestors.
    kept.forEach(function (tag) { if (removed.some(function (node) { return node.name === old.get(tag).parent; })) commands.push("region put " + tag); });
    removed.slice().sort(function (a, b) { return b.depth - a.depth; }).forEach(function (node) { commands.push("region remove " + node.name); });
    commands = commands.concat(scope.commands(desired, firmware));
    if (current.home && current.home !== "*" && removed.some(function (node) { return node.name === current.home; })) commands.push("region home " + desired.home);
    commands.push("region", "region save", "region");
    return { kept: kept, added: added, removed: removed.map(function (node) { return node.name; }), changed: changes,
      wildcard: { before: old.get("*").forward, after: !desired.bridge },
      defaultScope: { before: current.defaultScope, after: firmware === "1.14" ? null : desired.home }, commands: commands };
  }

  function mount(root, desired, firmware, copy) {
    if (!root) return;
    var fr = document.documentElement.lang.startsWith("fr");
    var t = function (en, french) { return fr ? french : en; };
    root.innerHTML = '<details class="mcc-advanced-options"><summary>' + t("Check an existing region list", "Vérifier une liste de régions existante") + '</summary>' +
      '<p>' + t("Paste only the output of region. It stays in this browser tab. Use USB and keep a backup: remote replies can be cut short. This is not a full device backup.", "Collez seulement la réponse de region. Elle reste dans cet onglet. Utilisez USB et gardez une copie : les réponses à distance peuvent être tronquées. Ce n’est pas une sauvegarde complète de l’appareil.") + '</p>' +
      '<label>' + t("Current region list", "Liste actuelle") + '<textarea data-migration-input rows="7" maxlength="4096" spellcheck="false" autocomplete="off"></textarea></label>' +
      '<label>' + (firmware === "1.14" ? t("Current default (not changed on 1.14)", "Scope par défaut actuel (inchangé avec 1.14)") : t("Result of region default (optional; firmware 1.15+)", "Réponse de region default (facultative; micrologiciel 1.15+)")) + '<input data-migration-default maxlength="60" autocomplete="off"></label>' +
      '<p class="mcc-hint">' + t("The ^ marker is the home region, not the default scope. Unlisted regions cannot be checked. No radio settings, passwords or keys are changed.", "Le symbole ^ marque la région d’origine, pas le scope par défaut. Les régions absentes ne peuvent pas être vérifiées. Aucun réglage radio, mot de passe ou clé n’est modifié.") + '</p>' +
      '<button type="button" class="mcc-button" data-migration-check>' + t("Compare", "Comparer") + '</button>' +
      '<p data-migration-status role="status"></p><pre data-migration-report hidden></pre>' +
      '<label class="mcc-choice" hidden data-migration-review><input type="checkbox"><span>' + t("I checked that the pasted list is complete and reviewed every removal and forwarding change.", "J’ai vérifié que la liste collée est complète et examiné chaque suppression et changement de retransmission.") + '</span></label>' +
      '<textarea data-migration-commands aria-label="' + t("Migration commands", "Commandes de migration") + '" readonly rows="8" hidden></textarea>' +
      '<button type="button" class="mcc-button" data-migration-copy hidden>' + t("Copy migration commands", "Copier les commandes de migration") + '</button>' +
      '<button type="button" class="mcc-button mcc-button-secondary" data-migration-backup hidden>' + t("Download pasted list", "Télécharger la liste collée") + '</button></details>';
    var find = function (name) { return root.querySelector("[data-migration-" + name + "]"); };
    var current, result;
    function clear() {
      current = null; result = null;
      ["report", "review", "commands", "copy", "backup"].forEach(function (name) { find(name).hidden = true; });
      find("commands").value = ""; find("review").querySelector("input").checked = false; find("status").textContent = "";
    }
    find("input").addEventListener("input", clear); find("default").addEventListener("input", clear);
    find("check").addEventListener("click", function () {
      clear();
      try {
        current = parse(find("input").value, find("default").value);
        result = plan(current, desired, firmware);
        var list = function (values) { return values.join(", ") || t("None", "Aucun"); };
        var forwarding = function (value) { return value ? t("allow", "autoriser") : t("block", "bloquer"); };
        find("report").textContent = t("Keep: ", "Conserver : ") + list(result.kept) + "\n" + t("Add: ", "Ajouter : ") + list(result.added) + "\n" +
          t("Change parent/forwarding: ", "Changer le parent/la retransmission : ") + list(result.changed) + "\n" + t("Remove: ", "Supprimer : ") + list(result.removed) + "\n" +
          "* : " + forwarding(result.wildcard.before) + " → " + forwarding(result.wildcard.after) + "\n" +
          t("Default scope: ", "Scope par défaut : ") + (result.defaultScope.before || t("unknown", "inconnu")) + " → " + (result.defaultScope.after || t("unchanged (1.14)", "inchangé (1.14)"));
        ["report", "review", "backup"].forEach(function (name) { find(name).hidden = false; });
      } catch (_) { find("status").textContent = t("Cannot safely read this list. Paste the complete region response with its indentation, without prompts or other commands. Check the optional default value too.", "Impossible de lire cette liste de façon sûre. Collez la réponse complète de region avec ses retraits, sans invite ni autre commande. Vérifiez aussi la valeur facultative du scope par défaut."); }
    });
    find("review").querySelector("input").addEventListener("change", function (event) {
      var approved = !!result && event.target.checked;
      find("commands").hidden = find("copy").hidden = !approved;
      find("commands").value = approved ? result.commands.join("\n") : "";
      find("status").textContent = approved ? t("Run one line at a time. Stop on Err. Some commands save immediately. No commands have been sent to a device.", "Exécutez une ligne à la fois. Arrêtez sur Err. Certaines commandes enregistrent immédiatement les changements. Aucune commande n’a été envoyée à un appareil.") : "";
    });
    find("copy").addEventListener("click", function () { if (find("commands").value) copy(find("commands").value, find("copy"), t("Copy migration commands", "Copier les commandes de migration")); });
    find("backup").addEventListener("click", function () {
      if (!current) return;
      var blob = new Blob([current.text + "\n\n" + (current.defaultScope ? "default scope is " + current.defaultScope : "Default scope not recorded") + "\n"], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = "meshcore-region-list.txt"; link.hidden = true; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }
  globalThis.MeshCoreScopeMigration = { parse: parse, plan: plan, mount: mount };
})();
