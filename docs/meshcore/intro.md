# Introduction to MeshCore

MeshCore is a lightweight mesh radio system for LoRa devices. A MeshCore network lets nearby radios pass messages and routing information between each other without relying on cellular service, WiFi, or the public internet.

MeshCore Canada documents the settings and community conventions Canadian meshes use so new devices can join the right network quickly.

## Core Ideas

| Term | Meaning |
|------|---------|
| Companion | A personal radio paired with a phone, tablet, or computer for sending and receiving messages |
| Repeater | A fixed radio that relays traffic to extend coverage |
| Room server | A fixed node that hosts rooms and may also relay or observe mesh traffic |
| Observer | A radio or host service that forwards packet telemetry to MeshCore.ca over MQTT |

All devices in the same local mesh must agree on the radio settings. If a device is flashed correctly but uses a different preset, it may look healthy while hearing nothing nearby.

## MeshCore Canada Baseline

Use these defaults unless your local community page publishes a different setting:

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |
| CLI path setting | `set path.hash.mode 2` |

!!! tip "Start with Getting Started"
    If you are setting up a first device, use [Getting Started](../resources/getting-started.md) before choosing a hardware-specific guide.

## How Traffic Moves

Companions send messages into the mesh. Repeaters and room servers help carry those packets beyond the range of a single radio link. Observers listen to the same mesh traffic and publish packet metadata to the MeshCore.ca MQTT brokers for live tools such as CoreScope.

MeshCore traffic is still radio-first. MQTT does not replace the local mesh; it gives communities visibility into observers, packet flow, and regional health.

## Why These Settings Matter

MeshCore Canada uses a shared baseline to make roaming and inter-community support easier:

- New users can ask for help without first translating local radio parameters.
- Repeaters, room servers, and observers can be tested with the same checklist.
- Community pages only need to document exceptions when a local mesh intentionally differs.

Before judging range or troubleshooting MQTT, confirm the radio preset and path hash mode first.
