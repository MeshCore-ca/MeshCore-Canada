// Build the repeater region commands from the chosen area, firmware,
// repeater type and optional neighbouring city.
(function () {
  var COPY_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg>';

  function buildCommands(firmware, city, province, extra, edge) {
    var codes = [city].concat(extra ? [extra] : [], [province, "onqc", "can"]);
    var unscoped = edge ? "region denyf *" : "region allowf *";
    var commands = [];

    if (firmware === "116") {
      commands.push("region def " + codes.join("|* "));
    } else {
      codes.forEach(function (code) {
        commands.push("region put " + code);
        if (firmware === "110") commands.push("region allowf " + code);
      });
    }
    commands.push(unscoped);
    if (firmware !== "110") commands.push("region default " + city);
    commands.push("region save");
    return commands;
  }

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

  function setUp(group) {
    var picker = group.querySelector("[data-scp-picker]");
    var area = group.querySelector("[data-scp-area]");
    var firmware = group.querySelector("[data-scp-firmware]");
    var type = group.querySelector("[data-scp-type]");
    var extra = group.querySelector("[data-scp-extra]");
    var extraField = group.querySelector("[data-scp-extra-field]");
    var summary = group.querySelector("[data-scp-summary]");
    var output = group.querySelector("[data-scp-output]");
    var notes = group.querySelectorAll("[data-scp-note]");
    var fallback = group.querySelector("[data-scp-fallback]");
    var copyLabel = group.getAttribute("data-copy-label") || "Copy";
    var copiedLabel = group.getAttribute("data-copied-label") || "Copied";

    function selectedText(select) {
      return select.options[select.selectedIndex].text;
    }

    function update() {
      var option = area.options[area.selectedIndex];
      var city = option.getAttribute("data-city");
      var province = option.getAttribute("data-province");
      var edge = type.value === "edge";

      extraField.hidden = !edge;
      Array.prototype.forEach.call(extra.options, function (choice) {
        choice.disabled = choice.value === city;
      });
      if (extra.value === city) extra.value = "";
      var neighbour = edge ? extra.value : "";

      var parts = [selectedText(area), selectedText(firmware), selectedText(type)];
      if (neighbour) parts.push("+ " + neighbour);
      summary.textContent = parts.join(" · ");

      output.textContent = "";
      buildCommands(firmware.value, city, province, neighbour, edge).forEach(function (command) {
        var item = document.createElement("li");
        item.className = "scp-cmd";
        var code = document.createElement("code");
        code.textContent = command;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "scp-copy";
        button.setAttribute("aria-label", copyLabel + ": " + command);
        button.title = copyLabel;
        button.innerHTML = COPY_ICON;
        button.addEventListener("click", function () {
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
        item.appendChild(code);
        item.appendChild(button);
        output.appendChild(item);
      });

      notes.forEach(function (note) {
        var key = note.getAttribute("data-scp-note");
        note.hidden = !(
          key === "fw-" + firmware.value ||
          (key === "edge" && edge) ||
          (key === "extra" && neighbour)
        );
      });
    }

    [area, firmware, type, extra].forEach(function (select) {
      select.addEventListener("change", update);
    });
    picker.hidden = false;
    summary.hidden = false;
    output.hidden = false;
    if (fallback) fallback.hidden = true;
    update();
  }

  document.querySelectorAll("[data-scp-picker-group]").forEach(setUp);
})();
