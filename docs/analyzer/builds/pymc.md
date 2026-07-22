---
title: Observe with PyMC
description: Send packets from an existing PyMC repeater service to CoreScope.
audience:
  - observer-operators
  - service-operators
task: configure-pymc-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 25 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Observe with PyMC

Add MeshCore Canada's primary and backup endpoints to a PyMC repeater service you already operate.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Use PyMC if</strong>A working PyMC repeater service already manages the radio.</div>
  <div><strong>Use something else if</strong>You would install Python and PyMC only to observe traffic.</div>
  <div><strong>Keep online</strong>The PyMC host, service, radio connection, and internet access.</div>
</div>

## Check your installation

This procedure is for a Linux systemd service named `pymc-repeater` with config at `/etc/pymc_repeater/config.yaml`. Confirm the version, service name, path, and config format before editing. For different paths, macOS, or Windows, follow the installed PyMC version's documentation.

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

You will edit PyMC's YAML config and restart the service. The change adds a location code and two encrypted, token-authenticated broker entries; it does not change the radio firmware.

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

Review any output before sharing it. Follow the [redaction checklist](../troubleshooting.md#what-to-share-when-asking-for-help).

## What you should see

The service stays active without YAML, TLS, or token errors, and its packet count changes when the radio hears nearby traffic.

## Verify in CoreScope

1. Find the observer in [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Wait for normal nearby activity.
3. Confirm a recent packet in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Finish with [Check your observer](../verify.md). A healthy systemd service is not proof that packets reached CoreScope.

## Recovery

Restore the exact backup made before editing:

```bash
sudo cp -- /etc/pymc_repeater/config.yaml.pre-meshcore-ca /etc/pymc_repeater/config.yaml
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

Keep the failed file privately if it helps with diagnosis. Do not post it without removing secrets and personal details.

## If verification fails

Use [Troubleshooting](../troubleshooting.md). Include the PyMC version, service name, first failed stage, and a short redacted log excerpt.
