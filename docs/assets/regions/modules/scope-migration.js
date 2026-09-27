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
    var preparing = desired.activation === "prepare";
    var removed = preparing ? [] : current.nodes.filter(function (node) { return node.name !== "*" && desired.tags.indexOf(node.name) === -1; });
    if (preparing && current.nodes.length - 1 + added.length > scope.maxTags) throw new Error("Region table would be full");
    if (preparing) {
      var union = current.nodes.filter(function (node) { return node.name !== "*"; }).map(function (node) { return node.name; }).concat(added);
      var parents = {};
      current.nodes.forEach(function (node) { if (node.name !== "*") parents[node.name] = node.parent === "*" ? null : node.parent; });
      desired.tags.forEach(function (tag) { parents[tag] = desired.parentOverrides[tag] || null; });
      if (scope.budget(union, parents).responseBytes > scope.maxResponseBytes) throw new Error("Combined region list would be truncated");
    }
    var changes = kept.filter(function (tag) { var node = old.get(tag); return !node.forward || node.parent !== (desired.parentOverrides[tag] || "*"); });
    var commands = [];
    // Detach retained children before removing their obsolete ancestors.
    kept.forEach(function (tag) { if (removed.some(function (node) { return node.name === old.get(tag).parent; })) commands.push("region put " + tag); });
    removed.slice().sort(function (a, b) { return b.depth - a.depth; }).forEach(function (node) { commands.push("region remove " + node.name); });
    commands = commands.concat(scope.commands(desired, firmware));
    if (current.home && current.home !== "*" && removed.some(function (node) { return node.name === current.home; })) commands.push("region home " + desired.home);
    commands.push("region", "region save", "region");
    return { kept: kept, added: added, removed: removed.map(function (node) { return node.name; }), changed: changes,
      wildcard: { before: old.get("*").forward, after: preparing ? old.get("*").forward : !desired.bridge },
      defaultScope: { before: current.defaultScope, after: preparing ? current.defaultScope : firmware === "1.14" ? null : desired.home }, commands: commands };
  }

  function verify(current, desired, firmware) {
    var nodes = new Map(current.nodes.map(function (node) { return [node.name, node]; }));
    var missing = desired.tags.filter(function (tag) { return !nodes.has(tag); });
    var incorrect = desired.tags.filter(function (tag) { var node = nodes.get(tag); return node && (!node.forward || node.parent !== (desired.parentOverrides[tag] || "*")); });
    var preparing = desired.activation === "prepare";
    var unexpected = preparing ? [] : current.nodes.filter(function (node) { return node.name !== "*" && !desired.tags.includes(node.name); }).map(function (node) { return node.name; });
    var wildcard = preparing || nodes.get("*").forward === !desired.bridge;
    var hasDefault = !preparing && (firmware === "1.15" || firmware === "1.16");
    var defaultMatches = !hasDefault || (current.defaultScope ? current.defaultScope === desired.home : null);
    return { missing: missing, incorrect: incorrect, unexpected: unexpected, wildcard: wildcard, defaultMatches: defaultMatches,
      matches: !missing.length && !incorrect.length && !unexpected.length && wildcard && defaultMatches !== false,
      complete: defaultMatches !== null };
  }

  function mountVerification(root, desired, firmware) {
    if (!root) return;
    var fr = document.documentElement.lang.startsWith("fr");
    var t = function (en, french) { return fr ? french : en; };
    var hasDefault = desired.activation !== "prepare" && (firmware === "1.15" || firmware === "1.16");
    root.className = "mc-scope-check";
    root.innerHTML = '<details><summary>' + t("Verify the result", "Vérifier le résultat") + '</summary><p>' +
      t("After applying and saving, run region and paste the complete reply. This checks text only, not the radio or coverage. Nothing leaves this tab.", "Après l’application et l’enregistrement, lancez region et collez la réponse complète. Cette vérification porte sur le texte, pas sur la radio ni la couverture. Rien ne quitte cet onglet.") + '</p>' +
      '<label>' + t("Result of region", "Réponse de region") + '<textarea data-verify-list rows="7" maxlength="4096" spellcheck="false" autocomplete="off"></textarea></label>' +
      (hasDefault ? '<label>' + t("Result of region default", "Réponse de region default") + '<input data-verify-default maxlength="60" autocomplete="off"></label>' : '') +
      '<button type="button" class="md-button mcc-button" data-verify-check>' + t("Check these settings", "Vérifier ces réglages") + '</button><p data-verify-status role="status"></p><pre data-verify-details hidden></pre>' +
      '<p>' + (desired.activation === "prepare" ? t("Preparation: test local unscoped messaging. Keep existing wildcard and default-scope settings; coordinate any change with local operators.", "Préparation : testez les messages locaux sans portée. Conservez les réglages actuels du joker et de la portée par défaut; coordonnez tout changement avec les opérateurs locaux.") : t("After coordinated activation: test a local channel, then a new cross-region DM and its reply using the agreed scopes. A saved DM path alone does not test discovery.", "Après l’activation coordonnée : testez un canal local, puis un nouveau MP interrégional et sa réponse avec les portées convenues. Un chemin de MP déjà enregistré ne teste pas la découverte.")) + '</p>' +
      '<p>' + t("Stop on Err or a failed test. Use USB and your saved configuration to restore the known-working settings. A saved region list is not a full device backup.", "Arrêtez sur Err ou en cas d’échec. Utilisez USB et votre sauvegarde pour rétablir les réglages fonctionnels. Une liste de régions n’est pas une sauvegarde complète de l’appareil.") + '</p></details>';
    var list = root.querySelector("[data-verify-list]"), def = root.querySelector("[data-verify-default]");
    var status = root.querySelector("[data-verify-status]"), details = root.querySelector("[data-verify-details]");
    function clear() { status.textContent = ""; details.textContent = ""; details.hidden = true; }
    list.addEventListener("input", clear);
    if (def) def.addEventListener("input", clear);
    root.querySelector("[data-verify-check]").addEventListener("click", function () {
      clear();
      try {
        var result = verify(parse(list.value, def ? def.value : ""), desired, firmware);
        status.textContent = !result.matches ? t("Settings differ. Review the details before continuing.", "Les réglages diffèrent. Examinez les détails avant de continuer.") : result.complete ?
          (desired.activation === "prepare" ? t("Prepared scope names and permissions match. Compare * and the default scope with your backup; this check does not establish that they stayed unchanged.", "Les noms et autorisations préparés correspondent. Comparez * et la portée par défaut avec votre sauvegarde; cette vérification ne prouve pas qu’ils sont restés inchangés.") : t("The pasted scope settings match this selection. Complete the radio tests below.", "Les réglages de portée collés correspondent à ce choix. Effectuez les essais radio ci-dessous.")) :
          t("The region list matches; paste region default to finish checking the default scope.", "La liste correspond; collez region default pour terminer la vérification de la portée par défaut.");
        var findings = [];
        [["missing", t("Missing: ", "Manquants : ")], ["incorrect", t("Parent or forwarding differs: ", "Parent ou retransmission différent : ")], ["unexpected", t("Unexpected: ", "Non prévus : ")]].forEach(function (field) { if (result[field[0]].length) findings.push(field[1] + result[field[0]].join(", ")); });
        if (!result.wildcard) findings.push(t("Wildcard forwarding (*) differs.", "La retransmission du joker (*) diffère."));
        if (result.defaultMatches === false) findings.push(t("Default scope differs.", "La portée par défaut diffère."));
        details.textContent = findings.join("\n"); details.hidden = !findings.length;
      } catch (_) { status.textContent = t("Cannot read this reply. Paste the complete region list with indentation, without prompts or other commands.", "Impossible de lire cette réponse. Collez la liste complète avec ses retraits, sans invite ni autre commande."); }
    });
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
          t("Default scope: ", "Scope par défaut : ") + (result.defaultScope.before || t("unknown", "inconnu")) + " → " + (desired.activation === "prepare" ? t("unchanged", "inchangé") : result.defaultScope.after || t("unchanged (1.14)", "inchangé (1.14)"));
        ["report", "review", "backup"].forEach(function (name) { find(name).hidden = false; });
      } catch (error) {
        if (current && /full|truncated/.test(error.message)) {
          find("backup").hidden = false;
          find("status").textContent = t("The combined preparation list would exceed the firmware limits. Keep the working configuration and coordinate a reviewed migration; no removal commands were generated.", "La liste combinée dépasserait les limites du micrologiciel. Gardez la configuration fonctionnelle et coordonnez une migration révisée; aucune commande de suppression n’a été générée.");
        } else find("status").textContent = t("Cannot safely read this list. Paste the complete region response with its indentation, without prompts or other commands. Check the optional default value too.", "Impossible de lire cette liste de façon sûre. Collez la réponse complète de region avec ses retraits, sans invite ni autre commande. Vérifiez aussi la valeur facultative du scope par défaut.");
      }
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
  globalThis.MeshCoreScopeMigration = { parse: parse, plan: plan, verify: verify, mount: mount, mountVerification: mountVerification };
})();
