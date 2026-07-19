(function (root, factory) {
  "use strict";
  root.MeshCoreRegionConfiguratorSupport = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function finiteCoordinate(value, minimum, maximum) {
    var number = Number(String(value == null ? "" : value).trim());
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
      "MeshCore Canada repeater commissioning summary",
      "Generated: " + normalizeText(input.generatedAt),
      "Location label: " + (normalizeText(input.locationLabel) || "Not recorded"),
      "Home region: " + normalizeText(input.homeRegion),
      "Firmware: " + normalizeText(input.firmware),
      "Region budget: " + normalizeText(input.budget),
      "",
      "Forwarding paths:"
    ];
    paths.forEach(function (path) { lines.push("- " + path); });
    lines.push("", "Commands:");
    commands.forEach(function (command) { lines.push(command); });
    lines.push(
      "",
      "Verification:",
      "1. Run region before saving and compare every path above.",
      "2. Run region save only after the paths and flood permissions are correct.",
      "3. Run region again after saving.",
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
