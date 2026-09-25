// Repeater setup helper for the ON/QC scopes proposal: one set of answers
// ("Your repeater") drives the standard settings and region commands, and
// every command card gets a working copy button.
(function () {
  var root = document.documentElement;
  var picker = document.querySelector("[data-scp-picker]");
  var copyLabel = (picker && picker.getAttribute("data-copy-label")) || "Copy";
  var copiedLabel = (picker && picker.getAttribute("data-copied-label")) || "Copied";
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg>';

  root.classList.add("scp-js");

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(field);
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".scp-copy");
    if (!button) return;
    var code = button.parentNode.querySelector("code");
    if (!code) return;
    var command = code.textContent;
    copyText(command).then(function () {
      button.classList.add("is-copied");
      button.title = copiedLabel;
      button.setAttribute("aria-label", copiedLabel + ": " + command);
      window.setTimeout(function () {
        button.classList.remove("is-copied");
        button.title = copyLabel;
        button.setAttribute("aria-label", copyLabel + ": " + command);
      }, 1600);
    });
  });

  if (!picker) return;

  var area = picker.querySelector("[data-scp-area]");
  var firmware = picker.querySelector("[data-scp-firmware]");
  var type = picker.querySelector("[data-scp-type]");
  var extra = picker.querySelector("[data-scp-extra]");
  var extraField = picker.querySelector("[data-scp-extra-field]");

  function standardCommands(version) {
    var commands = [];
    if (version !== "110") commands.push("set path.hash.mode 2");
    return commands.concat(["set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16"]);
  }

  function regionCommands(version, city, province, neighbour, edge) {
    var codes = [city].concat(neighbour ? [neighbour] : [], [province, "onqc", "can"]);
    var commands = [];
    if (version === "116") {
      commands.push("region def " + codes.join("|* "));
    } else {
      codes.forEach(function (code) {
        commands.push("region put " + code);
        if (version === "114" || version === "110") commands.push("region allowf " + code);
      });
    }
    commands.push(edge ? "region denyf *" : "region allowf *");
    if (version === "116" || version === "115") commands.push("region default " + city);
    commands.push("region save");
    return commands;
  }

  function render(list, commands) {
    list.textContent = "";
    commands.forEach(function (command) {
      var item = document.createElement("li");
      item.className = "scp-cmd";
      var code = document.createElement("code");
      code.textContent = command;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "scp-copy";
      button.title = copyLabel;
      button.setAttribute("aria-label", copyLabel + ": " + command);
      button.innerHTML = COPY_ICON; // fixed icon markup, no page or user input
      item.appendChild(code);
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  function shortText(select) {
    return select.options[select.selectedIndex].text;
  }

  function update() {
    var option = area.options[area.selectedIndex];
    var city = option.getAttribute("data-city");
    var province = option.getAttribute("data-province");
    var version = firmware.value;
    var edge = type.value === "edge";

    extraField.hidden = !edge;
    Array.prototype.forEach.call(extra.options, function (choice) {
      choice.disabled = choice.value === city;
    });
    if (extra.value === city) extra.value = "";
    var neighbour = edge ? extra.value : "";

    var summary = [shortText(area), shortText(firmware), shortText(type)];
    if (neighbour) summary.push("+ " + neighbour);
    document.querySelectorAll("[data-scp-summary]").forEach(function (label) {
      label.textContent = summary.join(" · ");
    });

    document.querySelectorAll('[data-scp-output="standard"]').forEach(function (list) {
      render(list, standardCommands(version));
    });
    document.querySelectorAll('[data-scp-output="region"]').forEach(function (list) {
      render(list, regionCommands(version, city, province, neighbour, edge));
    });

    var active = {
      "fw-116": version === "116",
      "fw-115": version === "115",
      "fw-put-allow": version === "114" || version === "110",
      "no-hash": version === "110",
      edge: edge,
      extra: Boolean(neighbour)
    };
    document.querySelectorAll("[data-scp-note]").forEach(function (note) {
      note.hidden = !active[note.getAttribute("data-scp-note")];
    });
  }

  [area, firmware, type, extra].forEach(function (select) {
    select.addEventListener("change", update);
  });
  picker.hidden = false;
  document.querySelectorAll("[data-scp-nojs]").forEach(function (note) {
    note.hidden = true;
  });
  update();
})();
