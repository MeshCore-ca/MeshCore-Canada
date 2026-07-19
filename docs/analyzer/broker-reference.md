---
title: Advanced observer endpoint reference
description: Inspect the canonical MeshCore Canada endpoint, transport, authentication, topic, and packet-mode values.
audience:
  - observer-operators
  - service-operators
task: reference-observer-endpoints
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: advanced
estimated_time: 8 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css
page_scripts:
  - assets/javascripts/analyzer-broker-reference.js
---

# Advanced observer endpoint reference

This page is for operators who already chose an [observer method](intro.md). Beginners should follow the method guide instead of copying values from this page.

## Generated endpoint table

The table is loaded from the [canonical observer configuration](observer-config.json).

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

Without JavaScript, open [observer-config.json](observer-config.json) directly.

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
| Home Assistant | **Payload Mode** = `packet`, or older **Packets (Lets Mesh)** enabled |
| RemoteTerm | Enable the Community MQTT packet topic |

## Interpret status correctly

| State | What it proves |
|---|---|
| DNS or port reachable | The host can reach the endpoint |
| Broker connected | Transport and authentication succeeded |
| Observer visible | Status reached the live service |
| Recent packet visible | The radio-to-viewer path works end to end |

Only the last state completes [observer verification](verify.md).
