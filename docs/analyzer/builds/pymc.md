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
  - assets/styles/analyzer.css?v=20261019-1
---

# Observe with PyMC

Add MeshCore Canada's primary and backup addresses to your PyMC repeater service.

## Check your installation

This procedure is for a Linux systemd service named `pymc-repeater` with config at `/etc/pymc_repeater/config.yaml`. Confirm the version, service name, path, and config format before editing. For different paths, macOS, or Windows, follow the installed PyMC version's documentation.

## You need { #before-you-start }

- PyMC is healthy before the change.
- You know the actual service and config paths.
- The radio uses the local mesh settings.
- You chose a real [location code](../iata-codes.md).
- You can restore a root-owned backup.

Record the current service state:

```bash
sudo systemctl status pymc-repeater --no-pager
backup="/etc/pymc_repeater/config.yaml.pre-meshcore-ca.$(date -u +%Y%m%dT%H%M%S).$"
sudo cp --no-clobber -- /etc/pymc_repeater/config.yaml "$backup"
printf 'Backup: %s\n' "$backup"
```

## Set up

In `/etc/pymc_repeater/config.yaml`, set the location code inside `mqtt`:

```yaml
mqtt:
  iata_code: YOW
```

Replace `YOW` with your code from the [Find your zone](../../config/map.md) page.

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

## Check it { #verify-in-corescope }

Your observer should show up within a few minutes in the [Live observer list](https://live.meshcore.ca/?tab=Observers), with recent packets in [Live packets](https://live.meshcore.ca/). A connected status is not proof that packets arrived, so finish with [Check your observer](../verify.md). Not showing? See [Troubleshooting](../troubleshooting.md).

## Recovery

Restore the exact backup made before editing:

```bash
sudo cp -- "${backup:?Set backup to the saved backup path first}" /etc/pymc_repeater/config.yaml
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

Keep the failed file privately if it helps with diagnosis. Do not post it without removing secrets and personal details.

