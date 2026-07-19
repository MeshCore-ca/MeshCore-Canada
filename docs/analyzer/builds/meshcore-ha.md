---
title: Observe with Home Assistant
description: Add MeshCore Canada packet publishing to an existing Home Assistant MeshCore integration and verify it end to end.
audience:
  - observer-operators
  - home-assistant-users
task: configure-home-assistant-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: intermediate
estimated_time: 15 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css
---

# Observe with Home Assistant

Use the MeshCore integration you already run in Home Assistant to publish packet telemetry to MeshCore Canada.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Choose it when</strong>Home Assistant already has a working MeshCore integration and connected radio.</div>
  <div><strong>Choose another method when</strong>You would install Home Assistant only for observing.</div>
  <div><strong>Stays online</strong>Home Assistant, the radio connection, and internet access.</div>
</div>

## Version and screen check

This guide is not pinned to a tested integration release. Identify the interface before changing it:

| Interface you see | Packet control | Location control |
|---|---|---|
| Current-style screen | **Payload Mode** = `packet` | Free-text **Broker IATA Code** |
| Older screen | **Packets (Lets Mesh)** enabled | May use a limited picker |

If your screen does not accept the correct location code, update the MeshCore integration. Do not substitute a wrong nearby code.

## Before you start

- [ ] Home Assistant and the MeshCore integration are healthy.
- [ ] The radio is connected over a supported USB, BLE, or TCP path.
- [ ] The radio uses the local mesh settings.
- [ ] You chose a real [location code](../iata-codes.md).
- [ ] You read [Observer data, access, and privacy](../data-collection-access.md).

## What this changes

You add two MQTT broker entries inside the MeshCore integration and enable packet payloads. No Wi-Fi password or static MQTT password belongs in these entries.

## Set up

Open:

**Settings** → **Devices & Services** → **MeshCore** → **Configure** → **Manage MQTT Brokers**

Add the primary entry:

| Field | Value |
|---|---|
| Server | `mqtt1.meshcore.ca` |
| Port | `443` |
| Transport | `websockets` |
| Use TLS | Enabled |
| TLS Verify | Enabled |
| Username / Password | Leave blank |
| Use MeshCore Auth Token | Enabled |
| Token Audience | `mqtt1.meshcore.ca` |
| Payload Mode | `packet` |
| Status Topic | `meshcore/{IATA}/{PUBLIC_KEY}/status` |
| Packets Topic | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

Set the integration's location field to the real three-letter code nearest the observer.

Add the backup entry with the same settings, changing only:

| Field | Value |
|---|---|
| Server | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

Leave optional owner fields blank unless they are needed. Save both entries.

## Expected result

Both entries show connected. Normal nearby radio activity produces packet activity in the integration. A connected broker without packet activity usually means packet mode is off or the radio hears nothing.

## Verify in CoreScope

1. Find the observer in [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Wait for normal nearby MeshCore activity.
3. Confirm a recent packet in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Complete [Check your observer](../verify.md). Do not treat Home Assistant's connected badge as final proof.

## Recovery

Disable or remove only the two MeshCore Canada broker entries you added. Keep unrelated Home Assistant integrations and the radio connection unchanged. Confirm the original MeshCore integration still operates.

## If verification fails

Use [symptom-first troubleshooting](../troubleshooting.md). Record the Home Assistant version, MeshCore integration version, first failed stage, and a redacted error—never a full diagnostics archive without review.
