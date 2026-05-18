# MeshCore-HA (Home Assistant)

Add the MeshCore.ca broker pair to your Home Assistant MeshCore integration. This connects your HA instance to the Canadian mesh telemetry network.

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Home Assistant | With the MeshCore integration installed |
| MeshCore Node | Connected to HA via USB, BLE, or TCP |
| IATA Code | The same real 3-letter IATA airport code used by your observer (e.g. `YOW` for Ottawa) |
| Mesh Settings | Connected node uses `USA/Canada (Recommended)` and 3-byte path hashes |

## Setup

!!! tip "Known-good setup"
    A Home Assistant observer needs three things to line up: both brokers connected, **Payload Mode** set to `packet` (or **Packets (Lets Mesh)** enabled on older screens), and the same real IATA code on both broker entries.

    The connected MeshCore node must also be on the MeshCore Canada network settings: **USA/Canada (Recommended)**, or raw radio values `910.525 MHz / 62.5 kHz / SF7 / CR5`, with 3-byte path hashes.

### 1. Open Broker Settings

Navigate to:

**Settings** > **Devices & Services** > **MeshCore** > **Configure** > **Manage MQTT Brokers**

### 2. Configure the Primary Broker

| Field | Value |
|-------|-------|
| Server | `mqtt1.meshcore.ca` |
| Port | `443` |
| Transport | `websockets` |
| Use TLS | :material-check: Enabled |
| TLS Verify | :material-check: Enabled |
| Username / Password | Leave blank |
| Use MeshCore Auth Token | :material-check: Enabled |
| Token Audience | `mqtt1.meshcore.ca` |
| Auth Token TTL | Leave default |
| Payload Mode | `packet` |
| Status Topic | `meshcore/{IATA}/{PUBLIC_KEY}/status` |
| Packets Topic | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |
| Client ID Prefix | Optional |
| Owner Public Key | Optional (TLS verified only) |
| Owner Email | Optional (TLS verified only) |

### 3. Configure the Backup Broker

Add a second broker with the same settings, changing only:

| Field | Value |
|-------|-------|
| Server | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

All other fields remain the same as the primary broker.

!!! warning "Packet mode is required"
    If your Home Assistant version shows a checkbox or option named **Packets (Lets Mesh)**, enable it. In newer versions this is the **Payload Mode** setting and it must be `packet`. If this is missed, the broker can appear connected while no packet data shows up.

### 4. Set Your Region

Make sure your IATA code is set in the integration. The `{IATA}` placeholder in the topic templates will be replaced with your code (e.g. `YOW`).

The Home Assistant integration must use the same IATA code as the observer that is publishing packets. If Home Assistant is set to `YOW` but the observer publishes under `YKF`, Home Assistant will subscribe to the wrong topics and look empty.

Current MeshCore-HA versions use a free-text **Broker IATA Code** field, so you can type a real code such as `YTR` even if it is missing from a quick list. If your Home Assistant screen only offers a picker and does not let you enter the code manually, update the MeshCore integration before using a neighboring airport code as a workaround.

!!! tip
    You can find common Canadian IATA codes on the [Analyzer Overview](../intro.md) page. If your nearest real airport code is missing from that quick list, you can still use it.

## Common HA Symptoms

| Symptom | Most likely fix |
|---------|-----------------|
| Brokers show connected but no packets appear | Enable **Packets (Lets Mesh)** or set **Payload Mode** to `packet` |
| `YTR` or another code is not selectable | Update MeshCore-HA, then type the code in **Broker IATA Code** |
| One broker works and the backup does not | Check the second broker's **Token Audience** is `mqtt2.meshcore.ca` |
| Packets appear under the wrong city | Set both broker IATA fields to the nearest real airport code |

## Quick Reference

| Setting | Primary | Backup |
|---------|---------|--------|
| Server | `mqtt1.meshcore.ca` | `mqtt2.meshcore.ca` |
| Port | `443` | `443` |
| Transport | `websockets` | `websockets` |
| TLS | Enabled + Verified | Enabled + Verified |
| Auth | MeshCore JWT Token | MeshCore JWT Token |
| Audience | `mqtt1.meshcore.ca` | `mqtt2.meshcore.ca` |
| Payload Mode | `packet` | `packet` |

## Verify

After saving, head to [Check Your Observer](../verify.md) to confirm it's reporting correctly.
