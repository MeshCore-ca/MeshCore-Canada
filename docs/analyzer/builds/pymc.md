---
title: Observe with PyMC
description: Add the Canadian endpoint pair to an existing PyMC repeater with a config backup, service check, rollback, and live proof.
audience:
  - observer-operators
  - service-operators
task: configure-pymc-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: advanced
estimated_time: 25 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css
---

# Observe with PyMC

Add MeshCore Canada's primary and backup endpoints to a PyMC repeater service you already operate.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Choose it when</strong>A working PyMC repeater service already manages the radio.</div>
  <div><strong>Choose another method when</strong>You would install Python and PyMC only to observe traffic.</div>
  <div><strong>Stays online</strong>The PyMC host, service, radio connection, and internet access.</div>
</div>

## Supported environment

This guide assumes a Linux service named `pymc-repeater` and config at `/etc/pymc_repeater/config.yaml`. MeshCore Canada has not published a pinned PyMC/Python support matrix for this page. Confirm the installed version, service name, config path, and upstream format before editing.

| Environment | Coverage in this guide |
|---|---|
| Linux with systemd and the default paths | Documented path; still confirm the installed PyMC release |
| Linux with a different service or config path | Adapt only after checking the local unit and upstream documentation |
| macOS or Windows | Not covered by this service procedure |
| PyMC and Python versions | Use the versions supported by the installed upstream PyMC release; no version pair is verified here |

## Before you start

- [ ] PyMC is healthy before the change.
- [ ] You know the actual service and config paths.
- [ ] The radio uses the local mesh settings.
- [ ] You chose a real [location code](../iata-codes.md).
- [ ] You can restore a root-owned backup.

Record the current service state:

```bash
sudo systemctl status pymc-repeater --no-pager
sudo cp -- /etc/pymc_repeater/config.yaml /etc/pymc_repeater/config.yaml.pre-meshcore-ca
```

## What this changes

You edit PyMC's YAML config and restart its service. The change adds a location code and two encrypted, token-authenticated broker entries. It does not change radio firmware.

## Set up

In `/etc/pymc_repeater/config.yaml`, set the location code inside `mqtt`:

```yaml
mqtt:
  iata_code: YOW
```

Replace `YOW` with the real code nearest the observer.

Under `mqtt.brokers`, add:

```yaml
- name: MeshCore-CA
  enabled: true
  host: mqtt1.meshcore.ca
  port: 443
  transport: websockets
  format: letsmesh
  disallowed_packet_types: []
  retain_status: false
  tls:
    enabled: true
    insecure: false
  use_jwt_auth: true
  audience: mqtt1.meshcore.ca
- name: MeshCore-CA Backup
  enabled: true
  host: mqtt2.meshcore.ca
  port: 443
  transport: websockets
  format: letsmesh
  disallowed_packet_types: []
  retain_status: false
  tls:
    enabled: true
    insecure: false
  use_jwt_auth: true
  audience: mqtt2.meshcore.ca
```

Do not add an MQTT password. Leave optional owner email blank unless it is operationally needed.

Review the edited section, then restart:

```bash
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

If the service fails, inspect a short local excerpt:

```bash
sudo journalctl -u pymc-repeater -n 80 --no-pager
```

Review and redact output before sharing it.

## Expected result

The service remains active without YAML, TLS, or token errors. Its packet counter or logs change when the connected radio hears nearby traffic.

## Verify in CoreScope

1. Find the observer in [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Wait for normal nearby activity.
3. Confirm a recent packet in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Complete [Check your observer](../verify.md). A healthy systemd service is not end-to-end proof.

## Recovery

Restore the exact backup made before editing:

```bash
sudo cp -- /etc/pymc_repeater/config.yaml.pre-meshcore-ca /etc/pymc_repeater/config.yaml
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

Keep the failed edited file privately if it is useful for diagnosis, but do not post it without redacting secrets and personal fields.

## If verification fails

Use [symptom-first troubleshooting](../troubleshooting.md). Include the PyMC version, service name, first failed stage, and a short redacted log excerpt.
