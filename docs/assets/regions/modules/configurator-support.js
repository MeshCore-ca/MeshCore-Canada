(function (root, factory) {
  "use strict";
  root.MeshCoreRegionConfiguratorSupport = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function finiteCoordinate(value, minimum, maximum) {
    var text = String(value == null ? "" : value).trim();
    if (!text) return null;
    var number = Number(text);
    return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
  }

  function parseCoordinates(latitude, longitude) {
    var lat = finiteCoordinate(latitude, -90, 90);
    var lon = finiteCoordinate(longitude, -180, 180);
    return lat === null || lon === null ? null : { lat: lat, lon: lon };
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function commissioningRecord(input) {
    var paths = Array.isArray(input.paths) ? input.paths.map(normalizeText).filter(Boolean) : [];
    var commands = Array.isArray(input.commands) ? input.commands.map(normalizeText).filter(Boolean) : [];
    var lines = [
      "MeshCore Canada repeater setup summary",
      "Generated: " + normalizeText(input.generatedAt),
      "Location label: " + (normalizeText(input.locationLabel) || "Not recorded"),
      "Home region: " + normalizeText(input.homeRegion),
      "Firmware: " + normalizeText(input.firmware),
      "Region budget: " + normalizeText(input.budget),
      "Radio network: " + normalizeText(input.radio || "Keep current settings"),
      "Advert ID size: " + normalizeText(input.hashMode || "Keep current settings"),
      "",
      "Forwarded scopes:"
    ];
    paths.forEach(function (path) { lines.push("- " + path); });
    lines.push("", "Commands:");
    commands.forEach(function (command) { lines.push(command); });
    lines.push(
      "",
      "Verification:",
      "1. Back up and remove obsolete regions before applying a fresh scope list, preferably over USB.",
      "2. Run region and compare every scope and flood permission above. Some commands save immediately.",
      "3. Run region again after saving.",
      "4. If radio settings changed, reboot and run get radio to confirm them.",
      "5. If the advert ID size changed, run get path.hash.mode to confirm it.",
      "",
      "This summary omits exact coordinates, passwords, private keys, and device identifiers."
    );
    return lines.join("\n") + "\n";
  }

  function safeFileStem(value) {
    var stem = normalizeText(value).toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return stem || "repeater";
  }

  return {
    commissioningRecord: commissioningRecord,
    parseCoordinates: parseCoordinates,
    safeFileStem: safeFileStem
  };
}));
