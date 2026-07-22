---
title: Build a standalone MQTT observer
description: Flash a supported Wi-Fi LoRa board, build safe local CLI commands, recover if needed, and verify packets in CoreScope.
audience:
  - observer-operators
task: configure-standalone-observer
scope: experimental
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: advanced
estimated_time: 35 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-command-builder.js?v=20260722-2
---

# Build a standalone MQTT observer

Dedicated observer firmware lets a supported Wi-Fi LoRa board send nearby packet telemetry without a separate host computer.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Choose it when</strong>A supported Wi-Fi LoRa board can be dedicated to observing.</div>
  <div><strong>Choose another method when</strong>The radio is already managed by RemoteTerm, Home Assistant, PyMC, or a nearby USB host.</div>
  <div><strong>Stays online</strong>The board, stable power, 2.4 GHz Wi-Fi, and internet access.</div>
</div>

This is a third-party firmware path. Confirm the board and displayed build before flashing.

## Version and source check

| Item | Recorded reference |
|---|---|
| Flasher | [observer.gessaman.com](https://observer.gessaman.com/) |
| Recorded source branch | `mqtt-bridge-implementation-flex` |
| Recorded source commit | `c0c845f5` |
| Expected presets | `meshcore-ca-1` and `meshcore-ca-2` |

The recorded commit is provenance, not proof that the live flasher still serves it. Stop if the flasher identifies a different board, source, or build that you have not reviewed.

## Before you start

!!! danger "Back up before enabling Erase device"
    Erasing can remove the private identity key, name, radio settings, region data, and other saved configuration. Back up the private key and record the board, role, firmware version, and settings. If an identity cannot be backed up, stop and use a new board or ask for help.

- [ ] Confirm the exact board is listed by the observer flasher.
- [ ] Decide whether this node should repeat traffic or observe only.
- [ ] Back up the existing identity and settings.
- [ ] Keep a known-good data USB cable and the board's recovery method nearby.
- [ ] Choose a real [location code](../iata-codes.md).
- [ ] Plan to test on the bench before deployment.

## What this changes

Flashing replaces the board firmware. Setup then changes the name, radio values, path-hash mode, location label, Wi-Fi credentials, broker presets, packet mode, and repeat behaviour.

The command builder runs locally in this browser. It does not store Wi-Fi fields, place them in the URL, or include them in the default preview.

## Set up

### 1. Flash the board

1. Open [observer.gessaman.com](https://observer.gessaman.com/).
2. Under **MQTT Observer Firmware**, choose the exact supported board.
3. Choose **Repeater** or **Room Server**.
4. For a new or intentionally repurposed board, enable **Erase device** only after the backup gate above.
5. Flash the merged image.
6. When flashing finishes, prefer **Configure via USB**. Use **Console** only for settings the setup screen does not expose.

**Expected:** the flasher reports completion and the board reconnects on USB.

### 2. Enter the shared settings

Use the local mesh settings. When no community override exists, the Canadian onboarding baseline is:

| Setting | Value |
|---|---|
| Radio preset | **USA/Canada (Recommended)** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hashes | 3 bytes (`set path.hash.mode 2`) |
| Primary preset | `meshcore-ca-1` |
| Backup preset | `meshcore-ca-2` |
| Wi-Fi | A 2.4 GHz network |

### 3. Build a reviewed CLI block

The CLI has no documented general quoting contract. The builder rejects spaces, quotes, backslashes, control characters, and other ambiguous Wi-Fi values. Use **Configure via USB** for a network it cannot represent safely.

<div class="mc-command-builder" id="observer-command-builder" data-location-source="../../location-codes.json">
  <div class="mc-command-grid">
    <label>
      <strong>Board</strong>
      <select id="observer-board">
        <option value="heltec-v3">Heltec V3</option>
        <option value="heltec-v4-oled">Heltec V4 OLED</option>
        <option value="other-supported">Another target listed by the flasher</option>
      </select>
    </label>
    <label>
      <strong>Location code</strong>
      <input id="observer-iata" list="observer-iata-list" maxlength="3" placeholder="YOW" autocomplete="off" spellcheck="false">
      <datalist id="observer-iata-list"></datalist>
    </label>
    <label>
      <strong>Role</strong>
      <select id="observer-role">
        <option value="Repeater">Repeater</option>
        <option value="Room-Server">Room server</option>
      </select>
    </label>
    <label>
      <strong>Node number</strong>
      <input id="observer-number" value="01" maxlength="16" autocomplete="off" spellcheck="false">
    </label>
    <label>
      <strong>Wi-Fi SSID</strong>
      <input id="observer-ssid" maxlength="32" autocomplete="off" spellcheck="false" aria-describedby="observer-secret-help">
    </label>
    <div class="mc-command-field">
      <label for="observer-password"><strong>Wi-Fi password</strong></label>
      <div class="mc-secret-row">
        <input id="observer-password" type="password" maxlength="64" autocomplete="new-password" spellcheck="false" aria-describedby="observer-secret-help">
        <button type="button" id="observer-toggle-password" aria-pressed="false">Show</button>
      </div>
    </div>
    <label class="mc-command-field--wide">
      <strong>Mesh traffic</strong>
      <select id="observer-repeat">
        <option value="on">Observe and repeat packets</option>
        <option value="off">Observe only</option>
      </select>
    </label>
  </div>
  <p class="mc-command-notice" id="observer-location-status" aria-live="polite">Loading Canadian location suggestions…</p>
  <p class="mc-command-notice" id="observer-secret-help">SSID and password stay in this page only. They are cleared when you leave and hidden from the preview until you reveal them.</p>
  <div class="mc-command-errors" id="observer-command-errors" role="alert" aria-live="assertive"></div>
  <dl class="mc-command-summary" id="observer-command-summary" aria-label="Non-sensitive command summary"></dl>
  <div class="mc-command-actions">
    <button type="button" id="observer-reveal-commands" aria-pressed="false" disabled>Reveal sensitive commands</button>
    <button type="button" id="observer-copy-commands" disabled>Copy revealed commands</button>
    <button type="button" id="observer-clear-secrets">Clear Wi-Fi fields</button>
    <span id="observer-copy-status" aria-live="polite"></span>
  </div>
  <pre aria-label="Observer command preview"><code id="observer-command-output">Complete the required fields to build commands.</code></pre>
</div>

Review the non-sensitive summary and redacted preview. Reveal and copy only on a trusted computer. The clipboard then contains Wi-Fi credentials; clear it after use.

### Manual CLI path

If you prefer manual entry, set the non-sensitive values first:

```text
set name YOW-Repeater-01
set radio 910.525,62.5,7,5
set path.hash.mode 2
set mqtt.iata YOW
set wifi.powersave none
set mqtt1.preset meshcore-ca-1
set mqtt2.preset meshcore-ca-2
set mqtt3.preset none
set mqtt4.preset none
set mqtt5.preset none
set mqtt6.preset none
set mqtt.status on
set mqtt.packets on
set mqtt.raw off
set mqtt.rx on
set mqtt.tx advert
set bridge.enabled on
set repeat on
advert
```

Replace the name and location code. Use `set repeat off` for an observe-only node.

Enter credentials directly in the device console:

```text
set wifi.ssid <network-name>
set wifi.pwd <network-password>
reboot
```

Do not paste completed credential lines into chat, issues, screenshots, logs, or saved notes. Do not add generic shell quotes to a device CLI value.

## Expected result

After reboot, run:

```text
get name
get wifi.status
get mqtt.iata
get mqtt1.preset
get mqtt2.preset
get mqtt.status
get mqtt.packets
get bridge.enabled
get path.hash.mode
```

Expected:

- Wi-Fi and MQTT report connected;
- the location code is correct;
- presets are `meshcore-ca-1` and `meshcore-ca-2`;
- packet publishing and bridge mode are on; and
- path hash mode is `2`.

## Verify in CoreScope

1. Find the observer in [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Wait for normal nearby radio activity.
3. Confirm a recent packet in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Complete [Check your observer](../verify.md). Connected Wi-Fi and MQTT are not end-to-end proof.

## Recovery

If the board does not reboot or reconnect:

1. disconnect and reconnect with a known-good data cable;
2. use the board-specific recovery/boot sequence published by the flasher;
3. reflash the exact correct target without erasing again unless recovery requires it;
4. restore the backed-up identity and settings only to the intended board; and
5. repeat the local CLI checks before returning the board to service.

If the firmware runs but observing fails, restore the recorded prior settings or reflash the last known-good reviewed build. Keep the private identity backup private.

## If verification fails

Use [symptom-first troubleshooting](../troubleshooting.md). Share only read-command output after redacting private details; never share Wi-Fi commands or a private key.
