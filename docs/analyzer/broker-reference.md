---
title: Observer connection reference
description: Find the broker address, security, topic, and packet settings used by MeshCore Canada observers.
audience:
  - observer-operators
  - service-operators
task: reference-observer-endpoints
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-09-02
review_by: 2026-12-01
difficulty: advanced
estimated_time: 8 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Observer connection reference

Use this after you [choose an observer setup](intro.md). Follow that guide rather
than copying these values without context.

## Broker settings

These values come from the shared [observer configuration](observer-config.json).

<div class="mc-generated-reference" id="broker-reference" data-source="../observer-config.json">
  <div class="mc-location-table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col">Use</th>
          <th scope="col">Host</th>
          <th scope="col">Port</th>
          <th scope="col">Transport</th>
          <th scope="col">TLS</th>
          <th scope="col">Token audience</th>
        </tr>
      </thead>
      <tbody id="broker-reference-body"></tbody>
    </table>
  </div>
</div>

## Read-only access

See the [read-only MQTT account list](data-collection-access.md#read-only-mqtt-accounts) for approved subscribers, including QuinteMesh. Ask an administrator below to request access.

The JWT settings on this page are for **observers publishing packets**. Read-only subscribers use the credentials and connection instructions supplied by an administrator. Do not use an observer’s private key for subscriber access.

## Broker administrators

Contact an administrator to request read-only access or report an account problem. Never send passwords or tokens.

| Administrator | Contact |
|---|---|
| n30nex | [GitHub: @n30nex](https://github.com/n30nex) |
| Mr. Alderson | [GitHub: @MrAlders0n](https://github.com/MrAlders0n) |
| Ded | [GitHub: @446564](https://github.com/446564) |
| Kranic | [MeshCore forum: @djkranic](https://forum.meshcore.ca/u/djkranic) |

## Topic templates

```text
meshcore/{IATA}/{PUBLIC_KEY}/packets
meshcore/{IATA}/{PUBLIC_KEY}/status
```

`{IATA}` is the observer's real three-letter location code. `{PUBLIC_KEY}` is supplied by the radio or integration. Never substitute a private key.

## Authentication and transport

- Use WebSockets on port `443`.
- Require TLS and verify certificates.
- Use the MeshCore JWT token option where available.
- Match each token audience to its server address.
- Do not put a token or password into a URL, screenshot, issue, or diagnostic bundle.

## Packet mode by method

| Method | Required packet setting |
|---|---|
| MQTT firmware | `mqtt.packets on`, `bridge.enabled on`, and `mqtt.rx on` |
| MCtoMQTT / companion capture | Configure the `/packets` topic |
| PyMC | `format: letsmesh` |
| Home Assistant | **Payload Mode** = `packet` |
| RemoteTerm | Enable the Community MQTT packet topic |

## What each check tells you

| State | What it proves |
|---|---|
| DNS or port reachable | The host can reach the server |
| Broker connected | Transport and authentication succeeded |
| Observer visible | Status reached the live service |
| Recent packet visible | The radio-to-viewer path works end to end |

Only a recent packet completes [the observer check](verify.md).
