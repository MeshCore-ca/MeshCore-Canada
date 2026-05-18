# PyMC (Python MeshCore)

Add the MeshCore.ca broker pair to an existing pyMC repeater installation. PyMC connects to your MeshCore device and forwards traffic to MQTT brokers using a YAML config file.

## Prerequisites

| Requirement | Details |
|-------------|---------|
| PyMC | A working pyMC repeater installation |
| IATA Code | Your real 3-letter IATA airport code (e.g. `YOW` for Ottawa) |
| Mesh Settings | Repeater radio uses `USA/Canada (Recommended)` and 3-byte path hashes |

## Configuration

### 1. Set Your IATA Code

In `/etc/pymc_repeater/config.yaml`, set your region code under the MQTT section:

```yaml
mqtt:
  iata_code: YOW
```

Use the real 3-letter airport code nearest to you. The public broker rejects placeholders and made-up region names such as `XXX` or `HOME`. Do not use `CAN` as shorthand for Canada; it is a real airport code for Guangzhou and will tag your observer to the wrong region.

Also confirm the underlying repeater is on the MeshCore Canada network settings: **USA/Canada (Recommended)**, or raw radio values `910.525 MHz / 62.5 kHz / SF7 / CR5`, with 3-byte path hashes.

### 2. Add the Broker Block

Paste the following under `mqtt.brokers` in your config file:

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

### 3. Optional Fields

You can also set these optional fields in the `mqtt` section:

```yaml
mqtt:
  owner: "your-public-key"
  email: "you@example.com"
```

### 4. Restart the Service

```bash
sudo systemctl restart pymc-repeater
```

## Quick Reference

| Setting | Value |
|---------|-------|
| Config file | `/etc/pymc_repeater/config.yaml` |
| Primary broker | `mqtt1.meshcore.ca` |
| Backup broker | `mqtt2.meshcore.ca` |
| Port | `443` |
| Transport | `websockets` |
| TLS | Enabled, verified |
| Auth | JWT token (`use_jwt_auth: true`) |
| Format | `letsmesh` |

## Verify

After restarting, head to [Check Your Observer](../verify.md) to confirm it's reporting correctly.
