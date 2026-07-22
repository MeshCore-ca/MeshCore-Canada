---
title: Observer endpoint reference
description: Find the broker, security, topic, and packet settings used by MeshCore Canada observers.
audience:
  - observer-operators
  - service-operators
task: reference-observer-endpoints
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 8 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-broker-reference.js?v=20260722-2
---

# Observer endpoint reference

Use this reference after you have [chosen an observer setup](intro.md). Follow that setup's guide instead of copying fields from here on their own.

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
  <p class="mc-location-status" id="broker-reference-status" role="status">Loading canonical endpoint values…</p>
</div>

If the table does not load, open [observer-config.json](observer-config.json).

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
- Match each token audience to its endpoint host.
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
| DNS or port reachable | The host can reach the endpoint |
| Broker connected | Transport and authentication succeeded |
| Observer visible | Status reached the live service |
| Recent packet visible | The radio-to-viewer path works end to end |

Only a recent packet completes [the observer check](verify.md).
