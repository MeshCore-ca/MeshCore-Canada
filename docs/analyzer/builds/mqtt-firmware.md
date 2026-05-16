# MQTT Firmware (Direct Observer)

Flash observer firmware directly onto a supported board. The device connects to WiFi and publishes mesh traffic to MQTT brokers without a host computer.

These firmware images are pre-compiled by **n30nex** and come pre-configured with the MeshCore.ca broker pair (`mqtt1.meshcore.ca` and `mqtt2.meshcore.ca`) in slots 1 and 2. After flashing, you only need to set your WiFi credentials, IATA region code, and node name.

## Supported Boards

All boards support both Repeater and Room Server roles.

### Currently Available (Hardware Verified)

- Heltec V3
- Heltec V4 OLED

### Coming Soon (Built, Pending Hardware Validation)

- LILYGO T3S3 SX1262
- T-Beam Supreme SX1262
- T-Beam SX1262
- Seeed XIAO ESP32S3 + Wio-SX1262
- RAK3112
- Heltec Wireless Tracker
- Heltec Wireless Paper

New boards will appear in the firmware picker automatically as they are validated and released.

## Firmware Downloads

Pick your board, role, and flash type to get the right firmware image.

<div id="fw-picker" style="margin: 1.5em 0;">
  <div id="fw-loading" style="padding: 1em; opacity: 0.6;">Loading firmware manifest...</div>
  <div id="fw-selects" style="display: none; flex-wrap: wrap; gap: 1em; margin-bottom: 1em;">
    <div style="flex: 1; min-width: 160px;">
      <label for="fw-board" style="display: block; font-weight: 600; margin-bottom: 0.3em; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7;">Board</label>
      <select id="fw-board" style="width: 100%; padding: 0.5em; border-radius: 6px; border: 1px solid var(--md-default-fg-color--lightest); background: var(--md-code-bg-color); color: var(--md-default-fg-color); font-size: 0.95em;"></select>
    </div>
    <div style="flex: 1; min-width: 160px;">
      <label for="fw-role" style="display: block; font-weight: 600; margin-bottom: 0.3em; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7;">Role</label>
      <select id="fw-role" style="width: 100%; padding: 0.5em; border-radius: 6px; border: 1px solid var(--md-default-fg-color--lightest); background: var(--md-code-bg-color); color: var(--md-default-fg-color); font-size: 0.95em;"></select>
    </div>
    <div style="flex: 1; min-width: 160px;">
      <label for="fw-type" style="display: block; font-weight: 600; margin-bottom: 0.3em; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7;">Flash Type</label>
      <select id="fw-type" style="width: 100%; padding: 0.5em; border-radius: 6px; border: 1px solid var(--md-default-fg-color--lightest); background: var(--md-code-bg-color); color: var(--md-default-fg-color); font-size: 0.95em;"></select>
    </div>
  </div>
  <div id="fw-result" style="padding: 1em 1.2em; border-radius: 8px; border: 2px solid var(--md-accent-fg-color); background: var(--md-code-bg-color);"></div>
</div>

<script>
(function() {
  var REPO = "MrAlders0n/MeshCore-Canada";
  var API  = "https://api.github.com/repos/" + REPO + "/releases/latest";

  var manifest = null;
  var assets   = {};

  function populateSelect(id, items) {
    var el = document.getElementById(id);
    el.innerHTML = items.map(function(item) {
      return '<option value="' + item.id + '">' + item.label + '</option>';
    }).join("");
  }

  function findArtifact() {
    if (!manifest) return null;
    var board = document.getElementById("fw-board").value;
    var role  = document.getElementById("fw-role").value;
    var type  = document.getElementById("fw-type").value;
    return manifest.artifacts.find(function(a) {
      return a.board === board && a.role === role && a.type === type;
    });
  }

  function update() {
    var artifact = findArtifact();
    var result   = document.getElementById("fw-result");

    if (!artifact) {
      result.innerHTML = '<span style="opacity: 0.5;">No firmware available for this combination.</span>';
      return;
    }

    var file = artifact.file;
    var href = assets[file] || "#";
    var boardEl = document.getElementById("fw-board");
    var roleEl  = document.getElementById("fw-role");
    var typeEl  = document.getElementById("fw-type");
    var boardLabel = boardEl.options[boardEl.selectedIndex].text;
    var roleLabel  = roleEl.options[roleEl.selectedIndex].text;
    var typeLabel  = typeEl.options[typeEl.selectedIndex].text;

    result.innerHTML =
      '<div style="margin-bottom: 0.6em;">' +
        '<strong>' + boardLabel + '</strong> &middot; ' +
        roleLabel + ' &middot; ' + typeLabel +
      '</div>' +
      '<div style="font-family: var(--md-code-font-family); font-size: 0.85em; opacity: 0.7; margin-bottom: 0.4em;">' +
        file +
      '</div>' +
      '<div style="font-size: 0.8em; opacity: 0.5; margin-bottom: 0.8em;">Build: ' +
        manifest.version + ' (' + manifest.date + ')</div>' +
      '<a href="' + href + '" download ' +
        'style="display: inline-block; padding: 0.6em 1.5em; border-radius: 6px; ' +
        'background: var(--md-accent-fg-color); color: var(--md-accent-bg-color); ' +
        'font-weight: 600; text-decoration: none;">' +
        '⬇ Download Firmware</a>';
  }

  function init(release) {
    (release.assets || []).forEach(function(asset) {
      assets[asset.name] = asset.browser_download_url;
    });

    var manifestAsset = release.assets.find(function(a) {
      return a.name === "manifest.json";
    });
    if (!manifestAsset) {
      document.getElementById("fw-loading").textContent = "No firmware manifest found in latest release.";
      return;
    }

    fetch(manifestAsset.browser_download_url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        manifest = data;
        populateSelect("fw-board", manifest.boards);
        populateSelect("fw-role", manifest.roles);
        populateSelect("fw-type", manifest.types);
        document.getElementById("fw-loading").style.display = "none";
        document.getElementById("fw-selects").style.display = "flex";
        document.getElementById("fw-board").addEventListener("change", update);
        document.getElementById("fw-role").addEventListener("change", update);
        document.getElementById("fw-type").addEventListener("change", update);
        update();
      })
      .catch(function() {
        document.getElementById("fw-loading").textContent = "Failed to load firmware manifest.";
      });
  }

  fetch(API)
    .then(function(r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(init)
    .catch(function() {
      document.getElementById("fw-loading").innerHTML =
        'Could not load firmware list. <a href="https://github.com/' + REPO + '/releases/latest">Download from GitHub Releases</a>.';
    });
})();
</script>

## Prerequisites

- A supported LoRa board (see list above)
- 2.4 GHz WiFi network credentials
- Your 3-character IATA region code (e.g. `YOW` for Ottawa, `YYZ` for Toronto)

## Flashing

1. Pick your board, role, and flash type from the picker above and download the firmware
2. Flash using the [MeshCore Flasher](https://flasher.meshcore.io/) or your preferred ESP flashing tool

## CLI Setup

After flashing, connect to the device's admin CLI (serial or web) to set your WiFi, region code, and node name. Replace `YOW` with your IATA code and fill in your network credentials:

```text
set name YOW-Repeater-01
set mqtt.iata YOW
set wifi.ssid YourWiFiNetwork
set wifi.pwd YourWiFiPassword
set wifi.powersave none
set mqtt.status on
set mqtt.packets on
set bridge.enabled on
set mqtt.rx on
set mqtt.tx advert
set repeat on
reboot
```

!!! note "Room Servers"
    For room server roles, change the name (e.g. `YOW-Room-Server-01`) and omit `set repeat on`.

## Broker Slots

These firmware images ship pre-configured with `mqtt1.meshcore.ca` and `mqtt2.meshcore.ca` in slots 1 and 2. No action needed unless your slots were cleared or overwritten.

??? note "Restore broker slots manually"

    ```text
    set mqtt1.preset none
    set mqtt2.preset none
    set mqtt3.preset none
    set mqtt4.preset none
    set mqtt5.preset none
    set mqtt6.preset none
    set mqtt1.preset custom
    set mqtt1.server wss://mqtt1.meshcore.ca:443/mqtt
    set mqtt1.port 443
    set mqtt1.audience mqtt1.meshcore.ca
    set mqtt2.preset custom
    set mqtt2.server wss://mqtt2.meshcore.ca:443/mqtt
    set mqtt2.port 443
    set mqtt2.audience mqtt2.meshcore.ca
    ```

## Verify

Once your device is online, head to [Verify Observer Status](../verify.md) to confirm it's reporting correctly.

## Useful Links

- [MeshCore Flasher](https://flasher.meshcore.io/)
- [MeshCore Config Tool](https://config.meshcore.dev/)
- [MeshCore CLI Docs](https://meshcore.dev/docs/cli)
