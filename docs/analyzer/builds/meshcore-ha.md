---
title: Observe with Home Assistant
description: Send packets from an existing Home Assistant MeshCore integration to CoreScope.
audience:
  - observer-operators
  - home-assistant-users
task: configure-home-assistant-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: intermediate
estimated_time: 15 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Observe with Home Assistant

Use the MeshCore integration you already run in Home Assistant to publish packet telemetry to MeshCore Canada.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Use Home Assistant if</strong>It already has a working MeshCore integration and connected radio.</div>
  <div><strong>Use something else if</strong>You would install Home Assistant only for observing.</div>
  <div><strong>Keep online</strong>Home Assistant, the radio connection, and internet access.</div>
</div>

## Check your screen

Current MeshCore integrations use these fields:

| Packet control | Location control |
|---|---|
| **Payload Mode** = `packet` | Free-text **Broker IATA Code** |

If your screen looks different, see [Home Assistant screen does not match the guide](../troubleshooting.md#home-assistant-screen-does-not-match-the-guide). Update the integration if it cannot accept the correct location code; do not substitute a nearby code.

## Before you start

- [ ] Home Assistant and the MeshCore integration are healthy.
- [ ] The radio is connected over a supported USB, BLE, or TCP path.
- [ ] The radio uses the local mesh settings.
- [ ] You chose a real [location code](../iata-codes.md).
- [ ] You read [Observer data, access, and privacy](../data-collection-access.md).

## What this changes

You will add two MQTT broker entries and enable packet payloads. Do not enter a Wi-Fi password or static MQTT password.

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

## What you should see

Both entries show connected and nearby radio activity changes the packet count. If the brokers connect but no packets appear, packet mode may be off or the radio may hear nothing.

## Verify in CoreScope

1. Find the observer in [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Wait for normal nearby MeshCore activity.
3. Confirm a recent packet in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Finish with [Check your observer](../verify.md). Home Assistant's connected badge is not proof that packets reached CoreScope.

## Recovery

Disable or remove only the two MeshCore Canada broker entries you added. Keep unrelated Home Assistant integrations and the radio connection unchanged. Confirm the original MeshCore integration still operates.

## If verification fails

Use [Troubleshooting](../troubleshooting.md). Include the Home Assistant version, MeshCore integration version, first failed stage, and a redacted error. Review any diagnostics archive before sharing it.
