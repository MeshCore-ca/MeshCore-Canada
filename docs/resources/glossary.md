---
title: MeshCore glossary
description: Find plain-language definitions for MeshCore devices, radio settings, paths, and network data terms.
audience:
  - newcomer
  - meshcore-user
task: define-meshcore-term
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2027-01-19
evidence: Existing MeshCore Canada documentation terminology
difficulty: beginner
estimated_time: 2-10 minutes
destructive: false
---

# MeshCore glossary

Use your browser's **Find** command to jump to a term. Definitions are short;
the linked guides explain how to use each setting or device.

## A-D

**Advert**
:   A MeshCore announcement packet that helps nearby nodes learn about a device
    and its path.

**Bandwidth**
:   A LoRa radio setting that affects how much radio spectrum a transmission
    uses. Use the value from your local settings or the configurator.

**Broker**
:   A service that receives and distributes messages for Message Queuing
    Telemetry Transport (MQTT).

**Coding rate (CR)**
:   A LoRa error-correction setting. Use the value from your local settings or
    the configurator.

**Companion**
:   A personal MeshCore device used to send and receive messages. It often
    connects to an app and does not relay mesh traffic.

**CoreScope**
:   MeshCore Canada's public tools for viewing observers, packets, nodes, and
    map data.

## F-M

**Firmware**
:   Software installed on a device. MeshCore firmware is built for a specific
    board and role.

**Industrial, scientific, and medical (ISM) band**
:   Radio spectrum used by many low-power devices. Legal use still depends on
    location, equipment, and operating conditions.

**JSON Web Token (JWT)**
:   A time-limited credential used by supported MeshCore Canada data services.
    Treat it as sensitive.

**Location code**
:   A short code that groups observer data by area. Some observer guides call
    this an IATA code because they use three-letter airport codes.

**LoRa**
:   The long-range, low-power radio modulation used by MeshCore devices.

**Mesh network**
:   A network in which supported devices can relay traffic instead of relying
    on one central radio.

**Message Queuing Telemetry Transport (MQTT)**
:   A publish-and-subscribe protocol used by observers to send network data to
    public tools.

## N-R

**Node**
:   Any MeshCore device on the network.

**Observer**
:   A radio or host service that listens for MeshCore traffic and sends network
    data to public tools. It does not relay mesh traffic.

**Path hash mode**
:   The MeshCore setting that controls the size of identifiers in advert paths.
    Use the value from the current local or Canadian configuration.

**Preset**
:   A named group of radio settings.

**Repeater**
:   A normally fixed MeshCore device that relays packets to extend network
    coverage.

**Room server**
:   A MeshCore device that keeps a shared room available to companions. Its
    main job is hosting the room, not extending coverage.

## S-W

**Signal-to-noise ratio (SNR)**
:   A measurement comparing a received signal with background noise.

**Spreading factor (SF)**
:   A LoRa setting that affects airtime, data rate, and reception. Use the value
    from your local settings or the configurator.

**WebSocket**
:   A long-lived web connection. Some MQTT clients use WebSockets to reach a
    broker through normal web network paths.

## Related pages

- [Compare MeshCore roles](../meshcore/general-meshcore-roles.md)
- [Read common questions](../meshcore/general-faq.md)
- [Open the region standard](../config/standard.md)
- [Choose an observer method](../analyzer/intro.md)
