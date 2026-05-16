# MCtoMQTT (USB Serial Host)

Bridge a USB-connected MeshCore node to MQTT brokers using `meshcoretomqtt`. This runs on a Linux or macOS host with the device connected over USB serial.

!!! info "What it does"
    The MCtoMQTT service reads packets from a MeshCore device over its serial port and publishes them to one or more MQTT brokers. A config drop-in file tells it where to send the data.

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Device | MeshCore node with packet logging enabled, connected via USB serial |
| Host | Linux or macOS |
| Tools | `curl` installed |
| IATA Code | Your 3-character region code (e.g. `YOW` for Ottawa) |

## Quick Setup

If `meshcoretomqtt` is already installed, run the one-liner to add the MeshCore.ca brokers:

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device serial-host
```

This creates a config drop-in at `/etc/mctomqtt/config.d/20-meshcore-ca.toml` pointing at the MeshCore.ca broker pair, then restarts the service.

### Fresh Install

If `meshcoretomqtt` is not yet installed, add `--install-mctomqtt` and the script will run the upstream installer first:

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device serial-host --install-mctomqtt
```

!!! tip
    The upstream installer will walk you through serial port selection.

## Specifying Your Region

Pass your IATA code via the `--iata` flag or the `MESHCORE_CA_IATA` environment variable:

=== "Flag"

    ```bash
    bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device serial-host --iata YOW
    ```

=== "Environment Variable"

    ```bash
    MESHCORE_CA_IATA=YOW bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device serial-host
    ```

If omitted, the script will prompt interactively.

## What the Script Creates

The drop-in config at `/etc/mctomqtt/config.d/20-meshcore-ca.toml`:

??? note "View full config"

    ```toml
    [general]
    iata = "YOW"

    [[broker]]
    name = "meshcore-ca-1"
    enabled = true
    server = "mqtt1.meshcore.ca"
    port = 443
    transport = "websockets"
    keepalive = 60
    qos = 0
    retain = true

    [broker.tls]
    enabled = true
    verify = true

    [broker.auth]
    method = "token"
    audience = "mqtt1.meshcore.ca"

    [[broker]]
    name = "meshcore-ca-2"
    enabled = true
    server = "mqtt2.meshcore.ca"
    port = 443
    transport = "websockets"
    keepalive = 60
    qos = 0
    retain = true

    [broker.tls]
    enabled = true
    verify = true

    [broker.auth]
    method = "token"
    audience = "mqtt2.meshcore.ca"
    ```

## Companion Devices (BLE / Serial / TCP)

For companion radios (not packet-log serial hosts), use the companion path instead:

=== "Linux / macOS"

    ```bash
    bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device companion
    ```

    Add `--install-packetcapture` for a fresh install. The upstream installer will walk you through BLE, serial, or TCP connection setup.

=== "Windows PowerShell"

    ```powershell
    powershell -NoProfile -ExecutionPolicy Bypass -Command "iwr https://meshcore.ca/analyzer/scripts/add-meshcore-ca-packetcapture-broker.ps1 -UseBasicParsing | iex"
    ```

    Config is stored under `%USERPROFILE%\.meshcore-packet-capture\.env.local`.

!!! warning "Windows and Serial Hosts"
    There is no upstream `meshcoretomqtt` Windows installer. Keep packet-log serial hosts on Linux or macOS. The Windows PowerShell helper is for companion radios only.

## Quick Reference

| Path | Manager | Connection | Config Location |
|------|---------|------------|-----------------|
| Serial Host | meshcoretomqtt | USB serial | `/etc/mctomqtt/config.d/20-meshcore-ca.toml` |
| Companion | meshcore-packet-capture | BLE, serial, or TCP | `~/.meshcore-packet-capture/.env.local` |

## Script Options

| Flag | Description |
|------|-------------|
| `--iata CODE` | 3-character region code |
| `--device TYPE` | `serial-host` or `companion` |
| `--install-mctomqtt` | Install meshcoretomqtt if not present |
| `--install-packetcapture` | Install meshcore-packet-capture if not present |
| `--no-restart` | Patch config without restarting the service |
| `--config-dir PATH` | Override config dir (default: `/etc/mctomqtt`) |
| `--service NAME` | Override systemd service name (default: `mctomqtt`) |

## Verify

Once your service is running, head to [Check Your Observer](../verify.md) to confirm it's reporting correctly.
