---
title: Set up a network observer
description: Choose a simple, supported way to send nearby MeshCore radio activity to the Canadian live network tools.
audience:
  - observer-operators
task: choose-observer-method
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: beginner
estimated_time: 5 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-method-chooser.js?v=20260722-2
---

# Set up a network observer

An observer listens for nearby MeshCore radio packets and sends a copy to MeshCore Canada's live tools. It does not read private messages, and it does not need to repeat traffic.

## How the pieces fit

<ol class="mc-analyzer-flow">
  <li><strong>Radio</strong><span>hears nearby MeshCore packets</span></li>
  <li><strong>Observer</strong><span>passes those packets to the internet</span></li>
  <li><strong>MeshCore Canada</strong><span>receives them through two shared endpoints</span></li>
  <li><strong>Live tools</strong><span>show observer and packet health</span></li>
</ol>

The shared endpoints use MQTT. You do not need to learn it before choosing a
method.

!!! warning "Radio traffic may become public"
    Observer telemetry and heard radio packets can appear in public tools. Do not transmit sensitive information. Read [Data, access, and privacy](data-collection-access.md) before operating an observer.

## Pick what you already use

Choose the closest match. The result links to one focused guide.

<div class="mc-method-chooser" id="observer-method-chooser">
  <label for="observer-method">
    <strong>What is already part of this setup?</strong>
    <select id="observer-method">
      <option value="">Choose one</option>
      <option value="remote-term">RemoteTerm manages the radio</option>
      <option value="home-assistant">Home Assistant has the MeshCore integration</option>
      <option value="pymc">A PyMC repeater service is already running</option>
      <option value="usb-host">A Linux or macOS computer stays beside a USB radio</option>
      <option value="wifi-board">A supported Wi-Fi LoRa board can be dedicated to observing</option>
    </select>
  </label>
  <div class="mc-method-result" id="observer-method-result" role="status" tabindex="-1" hidden></div>
</div>

No JavaScript? Use the same comparison below.

| Your current setup | Recommended method | Host that must stay on |
|---|---|---|
| RemoteTerm already manages the radio | [RemoteTerm](remoteterm.md) | The RemoteTerm host |
| Home Assistant already has MeshCore | [Home Assistant](builds/meshcore-ha.md) | Home Assistant |
| PyMC already manages a repeater | [PyMC](builds/pymc.md) | The PyMC host |
| A Linux or macOS host is connected by USB | [MCtoMQTT](builds/mctomqtt.md) | The USB host |
| A supported Wi-Fi LoRa board can be dedicated | [Standalone MQTT firmware](builds/mqtt-firmware.md) | No separate host |

If none fit, ask in the [MeshCore Canada forum](https://forum.meshcore.ca/) before installing more software.

## Shared setup values

Every method uses:

- a radio already set for the local mesh;
- a real three-letter [location code](iata-codes.md);
- the MeshCore Canada primary and backup endpoints;
- encrypted connections with certificate checks; and
- packet publishing, not status-only publishing.

The Canadian onboarding baseline is **USA/Canada (Recommended)**, `910.525 MHz / 62.5 kHz / SF7 / CR5`, with 3-byte path hashes. A published local setting takes priority.

Advanced operators can inspect the [canonical observer configuration](observer-config.json) or [broker reference](broker-reference.md).

## What success looks like

Setup is not finished when a screen says “connected.” Finish when both are true:

1. your observer appears in [CoreScope Observers](https://live.meshcore.ca/#/observers); and
2. a packet heard by your radio appears in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Follow [Check your observer](verify.md) at the end of the method you choose. If a check fails, use [symptom-first troubleshooting](troubleshooting.md).
