# MQTT Firmware (Direct Observer)

Flash observer firmware directly onto a supported board. The device connects to WiFi and publishes mesh traffic to MQTT brokers without a host computer.

!!! info "Pre-configured firmware"
    The 2026-05-21 and newer images are pre-compiled by **n30nex** and come pre-configured with the MeshCore.ca broker pair (`mqtt1.meshcore.ca` and `mqtt2.meshcore.ca`) in slots 1 and 2, plus the USA/Canada radio defaults (`910.525 MHz / 62.5 kHz / SF7 / CR5`). After flashing, run the CLI setup block below to set WiFi, IATA, node name, path hash mode, and packet publishing.

## Supported Boards

All boards support both Repeater and Room Server roles.

=== "Available (Hardware Verified)"

    | Board | Notes |
    |-------|-------|
    | Heltec V3 | Fully tested |

=== "Available (Build Verified)"

    | Board | Notes |
    |-------|-------|
    | Heltec V4 OLED | Build verified, smoke test recommended |
    | LILYGO T3S3 SX1262 | Build verified, smoke test recommended |
    | T-Beam Supreme SX1262 | Build verified, smoke test recommended |
    | T-Beam SX1262 | Build verified, smoke test recommended |
    | Seeed XIAO ESP32S3 + Wio-SX1262 | Build verified, smoke test recommended |

=== "Coming Soon (Pending Build)"

    | Board | Notes |
    |-------|-------|
    | Heltec Wireless Tracker | Needs dedicated firmware target and validation |
    | Heltec Wireless Paper | Needs dedicated firmware target and validation |

New boards will appear in the firmware picker automatically as they are validated and released.

## Firmware Downloads

Pick your board, role, and flash type to get the right firmware image.

Most users should choose **First Flash (Merged)**, download the file, then flash it with the [MeshCore Flasher](https://flasher.meshcore.io/). No `esptool` offsets are needed when using the picker download.

<div id="fw-picker" style="margin: 1.5em 0;">
  <div id="fw-loading" style="padding: 1em; opacity: 0.75;">Loading firmware manifest... If this does not change, use the static download table below or download from GitHub Releases.</div>
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
  var REPO = "MeshCore-ca/MeshCore-Canada";
  var API  = "https://api.github.com/repos/" + REPO + "/releases/latest";
  var LOCAL_MANIFEST = "../firmware/manifest.json";
  var LOCAL_FIRMWARE_BASE = "../firmware/";

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
    var isMerged   = artifact.type === "merged";
    var helpText   = isMerged
      ? "MeshCore Flasher full image. Use for first flash or recovery; writes at 0x00000."
      : "App-only update image. Use only on devices already running MeshCore; writes at 0x10000.";
    var linkText   = isMerged ? "Download for MeshCore Flasher" : "Download update image";

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
      '<div style="font-size: 0.9em; margin-bottom: 0.8em;">' +
        helpText +
      '</div>' +
      '<a href="' + href + '" download ' +
        'style="display: inline-block; padding: 0.6em 1.5em; border-radius: 6px; ' +
        'background: var(--md-accent-fg-color); color: var(--md-accent-bg-color); ' +
        'font-weight: 600; text-decoration: none;">' +
        linkText + '</a>';
  }

  function initManifest(data, assetMap) {
    manifest = data;
    assets = assetMap || {};
    (manifest.artifacts || []).forEach(function(artifact) {
      if (!assets[artifact.file]) {
        assets[artifact.file] = LOCAL_FIRMWARE_BASE + artifact.file;
      }
    });

    populateSelect("fw-board", manifest.boards);
    populateSelect("fw-role", manifest.roles);
    populateSelect("fw-type", manifest.types);
    document.getElementById("fw-loading").style.display = "none";
    document.getElementById("fw-selects").style.display = "flex";
    document.getElementById("fw-board").addEventListener("change", update);
    document.getElementById("fw-role").addEventListener("change", update);
    document.getElementById("fw-type").addEventListener("change", update);
    update();
  }

  function loadLocalManifest() {
    return fetch(LOCAL_MANIFEST)
      .then(function(r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function(data) {
        initManifest(data, {});
      });
  }

  function initRelease(release) {
    var releaseAssets = {};
    (release.assets || []).forEach(function(asset) {
      releaseAssets[asset.name] = asset.browser_download_url;
    });

    var manifestAsset = (release.assets || []).find(function(a) {
      return a.name === "manifest.json";
    });
    if (!manifestAsset) {
      return loadLocalManifest();
    }

    fetch(manifestAsset.browser_download_url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        initManifest(data, releaseAssets);
      })
      .catch(function() {
        return loadLocalManifest();
      });
  }

  fetch(API)
    .then(function(r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(initRelease)
    .catch(function() {
      loadLocalManifest().catch(function() {
        document.getElementById("fw-loading").innerHTML =
          'Could not load firmware list. <a href="https://github.com/' + REPO + '/releases/latest">Download from GitHub Releases</a>.';
      });
    });
})();
</script>

### Static Download Index

If the firmware picker does not load, use this static table. **First Flash (Merged)** is the right choice for a new board, erased board, or recovery flash. Use **Update** only on a device already running MeshCore.

| Board | Role | First Flash (Merged) | Update |
|-------|------|----------------------|--------|
| Heltec V3 | Repeater | [Download](firmware/meshcore-ca-heltec-v3-repeater-20260521-merged.bin) | [Download](firmware/meshcore-ca-heltec-v3-repeater-20260521-update.bin) |
| Heltec V3 | Room Server | [Download](firmware/meshcore-ca-heltec-v3-room-server-20260521-merged.bin) | [Download](firmware/meshcore-ca-heltec-v3-room-server-20260521-update.bin) |
| Heltec V4 OLED | Repeater | [Download](firmware/meshcore-ca-heltec-v4-oled-repeater-20260521-merged.bin) | [Download](firmware/meshcore-ca-heltec-v4-oled-repeater-20260521-update.bin) |
| Heltec V4 OLED | Room Server | [Download](firmware/meshcore-ca-heltec-v4-oled-room-server-20260521-merged.bin) | [Download](firmware/meshcore-ca-heltec-v4-oled-room-server-20260521-update.bin) |
| LILYGO T3S3 SX1262 | Repeater | [Download](firmware/meshcore-ca-lilygo-t3s3-sx1262-repeater-20260521-merged.bin) | [Download](firmware/meshcore-ca-lilygo-t3s3-sx1262-repeater-20260521-update.bin) |
| LILYGO T3S3 SX1262 | Room Server | [Download](firmware/meshcore-ca-lilygo-t3s3-sx1262-room-server-20260521-merged.bin) | [Download](firmware/meshcore-ca-lilygo-t3s3-sx1262-room-server-20260521-update.bin) |
| LILYGO T-Beam S3 Supreme SX1262 | Repeater | [Download](firmware/meshcore-ca-lilygo-t-beam-s3-supreme-sx1262-repeater-20260521-merged.bin) | [Download](firmware/meshcore-ca-lilygo-t-beam-s3-supreme-sx1262-repeater-20260521-update.bin) |
| LILYGO T-Beam S3 Supreme SX1262 | Room Server | [Download](firmware/meshcore-ca-lilygo-t-beam-s3-supreme-sx1262-room-server-20260521-merged.bin) | [Download](firmware/meshcore-ca-lilygo-t-beam-s3-supreme-sx1262-room-server-20260521-update.bin) |
| LILYGO T-Beam SX1262 | Repeater | [Download](firmware/meshcore-ca-lilygo-tbeam-sx1262-repeater-20260521-merged.bin) | [Download](firmware/meshcore-ca-lilygo-tbeam-sx1262-repeater-20260521-update.bin) |
| LILYGO T-Beam SX1262 | Room Server | [Download](firmware/meshcore-ca-lilygo-tbeam-sx1262-room-server-20260521-merged.bin) | [Download](firmware/meshcore-ca-lilygo-tbeam-sx1262-room-server-20260521-update.bin) |
| Seeed XIAO ESP32S3 + Wio-SX1262 | Repeater | [Download](firmware/meshcore-ca-seeed-xiao-s3-wio-sx1262-repeater-20260521-merged.bin) | [Download](firmware/meshcore-ca-seeed-xiao-s3-wio-sx1262-repeater-20260521-update.bin) |
| Seeed XIAO ESP32S3 + Wio-SX1262 | Room Server | [Download](firmware/meshcore-ca-seeed-xiao-s3-wio-sx1262-room-server-20260521-merged.bin) | [Download](firmware/meshcore-ca-seeed-xiao-s3-wio-sx1262-room-server-20260521-update.bin) |

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Board | A supported LoRa board (see list above) |
| WiFi | 2.4 GHz network credentials |
| IATA Code | Your real 3-letter IATA airport code (e.g. `YOW` for Ottawa) |
| Radio preset | Built into 2026-05-21+ firmware: USA/Canada recommended settings, `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | 3-byte path hashes: `set path.hash.mode 2` |

## Flashing

1. Pick your board and role from the picker above
2. Choose **First Flash (Merged)** unless you already know you need an app-only update image
3. Download the firmware and flash it with the [MeshCore Flasher](https://flasher.meshcore.io/)

!!! tip "First time flashing?"
    Use **First Flash (Merged)**. The published merged filenames end in `-merged.bin`, which lets MeshCore Flasher detect the full image and write it at the correct offset.

| Flash type | Use case | Technical offset |
|------------|----------|------------------|
| First Flash (Merged) | New board, erased board, recovery from a bad flash | `0x00000` |
| Update | Device already running MeshCore with a valid bootloader and partition table | `0x10000` |

Technical users can still flash with their preferred ESP tool. Most users should use the MeshCore Flasher and the **First Flash (Merged)** picker option.

## CLI Setup

After flashing, connect to the device's admin CLI (serial or web) to set your WiFi, IATA code, and node name.

### Guided Heltec V3 / V4 Setup

For Heltec V3 and Heltec V4 OLED boards running the MeshCore.ca direct MQTT firmware, the guided setup script prompts for your board, role, IATA code, WiFi network, WiFi password, node name, broker restore choice, and repeat/observe-only mode. It also applies the MeshCore Canada radio values, 3-byte path hash mode, and required MQTT packet publishing settings:

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/setup-mqtt-firmware.sh)
```

The script can send the commands over USB serial on Linux or macOS, or print a copy/paste command block for the web/admin CLI. If you already know the serial port, pass it directly:

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/setup-mqtt-firmware.sh) --port /dev/ttyUSB0
```

To generate commands without touching a serial port:

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/setup-mqtt-firmware.sh) --print-only
```

### Manual CLI Setup

If you prefer to configure the device manually, replace `YOW` with the real 3-letter airport code nearest to you and fill in your network credentials:

```text
set name YOW-Repeater-01
set path.hash.mode 2
set mqtt.iata YOW
set wifi.ssid YourWiFiNetwork
set wifi.pwd YourWiFiPassword
set wifi.powersave none
set mqtt.status on
set mqtt.packets on
set bridge.enabled on
set mqtt.rx on
set mqtt.tx advert
reboot
```

!!! warning "Use a real IATA code"
    The firmware will let you type any value, but the public MeshCore.ca broker only accepts valid 3-letter IATA airport codes. If the code is not on the quick list, it can still work as long as it is a real airport code. Placeholder or made-up values such as `XXX` or `HOME` will not publish. Do not use `CAN` as shorthand for Canada; it is a real airport code for Guangzhou and will tag your observer to the wrong region.

!!! note "Room Servers"
    For room server roles, change the name to match (e.g. `YOW-Room-Server-01`).

!!! tip "MeshCore Canada network settings"
    Fresh 2026-05-21 and newer direct MQTT firmware images already default to the **USA/Canada (Recommended)** radio preset used by MeshCore Canada communities. `set path.hash.mode 2` is still required during onboarding because it selects 3-byte path hashes for repeater-backed MeshCore Canada networks. If you are updating an older image, reusing a device with retained preferences, or verifying a device before remote installation, run `set radio 910.525,62.5,7,5` as well.

## Packet Repeating

By default, the device will repeat packets for other nodes on the mesh in addition to observing. If that's what you want, no changes needed.

If you already have a repeater nearby (e.g. one on your roof) and this device should only observe without repeating traffic, disable it:

```text
set repeat off
```

## Broker Slots

These firmware images ship pre-configured with `mqtt1.meshcore.ca` and `mqtt2.meshcore.ca` in slots 1 and 2. No action needed unless your slots were cleared or overwritten.

??? note "Restore broker slots manually"

    If your broker slots were cleared or overwritten, restore them with:

    ```text
    set mqtt1.preset none
    set mqtt2.preset none
    set mqtt3.preset none
    set mqtt4.preset none
    set mqtt5.preset none
    set mqtt6.preset none
    set mqtt1.preset custom
    set mqtt1.server wss://mqtt1.meshcore.ca:443
    set mqtt1.port 443
    set mqtt1.audience mqtt1.meshcore.ca
    set mqtt2.preset custom
    set mqtt2.server wss://mqtt2.meshcore.ca:443
    set mqtt2.port 443
    set mqtt2.audience mqtt2.meshcore.ca
    ```

## Verify

Once your device is online, head to [Check Your Observer](../verify.md) to confirm it's reporting correctly.

## Useful Links

<div class="grid cards" markdown>

-   :material-flash:{ .lg .middle } **MeshCore Flasher**

    ---

    Web-based flashing tool for MeshCore firmware.

    [:octicons-arrow-right-24: flasher.meshcore.io](https://flasher.meshcore.io/)

-   :material-cog:{ .lg .middle } **MeshCore Config Tool**

    ---

    Configure your device settings via the web.

    [:octicons-arrow-right-24: config.meshcore.dev](https://config.meshcore.dev/)

</div>
