---
title: Observe with Home Assistant
description: Send packets from an existing Home Assistant MeshCore integration to Beacon.
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
  - assets/styles/analyzer.css?v=20261019-1
---

# Observe with Home Assistant

Use the MeshCore integration you already run in Home Assistant to publish packet telemetry to MeshCore Canada.

## Check your screen

Current MeshCore integrations use these fields:

| Packet control | Location control |
|---|---|
| **Payload Mode** = `packet` | Free-text **Broker IATA Code** |

If your screen looks different, see [Home Assistant screen does not match the guide](../troubleshooting.md#home-assistant-screen-does-not-match-the-guide). Update the integration if it cannot accept the correct location code; do not substitute a nearby code.

## You need { #before-you-start }

- Home Assistant and the MeshCore integration are healthy.
- The radio is connected over a supported USB, BLE, or TCP path.
- The radio uses the local mesh settings.
- You chose a real [location code](../../config/map.md).
- You read [Observer data, access, and privacy](../data-collection-access.md).

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

Set the integration's location field to the uppercase code from the [Find your zone](../../config/map.md) page.

Add the backup entry with the same settings, changing only:

| Field | Value |
|---|---|
| Server | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

Leave optional owner fields blank unless they are needed. Save both entries.

## Check it { #verify-in-corescope }

Your observer should show up within a few minutes in the [Live observer list](https://live.meshcore.ca/?tab=Observers), with recent packets in [Live packets](https://live.meshcore.ca/). A connected status is not proof that packets arrived, so finish with [Check your observer](../verify.md). Not showing? See [Troubleshooting](../troubleshooting.md).

## Recovery

Disable or remove only the two MeshCore Canada broker entries you added. Keep unrelated Home Assistant integrations and the radio connection unchanged. Confirm the original MeshCore integration still operates.

