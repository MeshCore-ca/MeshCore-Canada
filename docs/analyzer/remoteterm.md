---
title: Observe with RemoteTerm
description: Forward packets from a radio already managed by RemoteTerm, then verify the complete path in CoreScope.
audience:
  - observer-operators
task: configure-remoteterm-observer
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

# Observe with RemoteTerm

[RemoteTerm for MeshCore](https://github.com/jkingsman/Remote-Terminal-for-MeshCore) can forward raw packets from a radio it already manages. It does not publish decrypted messages.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Choose it when</strong>RemoteTerm already connects to the radio over serial, TCP, or BLE.</div>
  <div><strong>Choose another method when</strong>You would install RemoteTerm only for observing; compare the simpler host or standalone paths first.</div>
  <div><strong>Stays online</strong>The RemoteTerm host, its radio connection, and internet access.</div>
</div>

This guide follows RemoteTerm's rolling interface and is not pinned to a tested release. If labels differ, record the RemoteTerm version and check the upstream instructions before saving.

## Before you start

- [ ] RemoteTerm is installed from its reviewed upstream source.
- [ ] The radio connection is stable.
- [ ] The radio is on the local mesh settings.
- [ ] You chose a real [location code](iata-codes.md).
- [ ] You read [Observer data, access, and privacy](data-collection-access.md).

## What this changes

RemoteTerm gains one primary and one backup Community MQTT entry. Each entry sends packet telemetry through an encrypted WebSocket connection. It does not change radio firmware.

## Set up

Open **Settings** → **MQTT & Automation**, add **Community MQTT / meshcoretomqtt**, and enter:

| Field | Primary value |
|---|---|
| Name | `MeshCore.ca 1` |
| Broker Host | `mqtt1.meshcore.ca` |
| Broker Port | `443` |
| Transport | `WebSockets` |
| Authentication | `Token` |
| WebSocket Path | `/` |
| Token Audience | `mqtt1.meshcore.ca` |
| Use TLS | Enabled |
| Verify TLS certificates | Enabled |
| Region Code | Your nearest real three-letter location code |
| Packet Topic Template | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

Leave optional owner email blank unless it is operationally needed. Save the entry as enabled.

Add a backup entry with the same values, changing only:

| Field | Backup value |
|---|---|
| Name | `MeshCore.ca 2` |
| Broker Host | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

Use the same location code in both entries.

![RemoteTerm Community MQTT settings for MeshCore Canada](../assets/mcterm.png)

!!! note "Windows MQTT fanout"
    If RemoteTerm's current upstream instructions require Uvicorn `--loop none` for Windows MQTT fanout, use that documented launch option. Confirm against the installed RemoteTerm version.

## Expected result

Both entries remain enabled without repeated TLS or token errors. Normal nearby radio activity increments packet handling in RemoteTerm.

## Verify in CoreScope

1. Open [CoreScope Observers](https://live.meshcore.ca/#/observers) and find the RemoteTerm observer.
2. Create or wait for normal nearby activity.
3. Open [CoreScope Packets](https://live.meshcore.ca/#/packets) and confirm a recent packet appears.

Continue through the complete [observer verification checklist](verify.md). A connected entry without a recent packet is not complete.

## Recovery

Disable or remove only the two Community MQTT entries you added. Do not remove unrelated RemoteTerm automation. Confirm RemoteTerm still manages the radio normally.

## If verification fails

Use [symptom-first troubleshooting](troubleshooting.md). For a missing backup only, compare its host and token audience; both must be `mqtt2.meshcore.ca`.
