---
title: Observe with MCtoMQTT
description: Send packets from a USB radio through an always-on Linux or macOS computer.
audience:
  - observer-operators
  - service-operators
task: configure-mctomqtt-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 30 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Observe with MCtoMQTT

MCtoMQTT reads packets from a USB-connected MeshCore radio and publishes them from an always-on Linux or macOS host.

## Is this method right for you?

<div class="mc-method-fit">
  <div><strong>Use MCtoMQTT if</strong>A Linux or macOS computer stays beside a packet-log radio connected over USB.</div>
  <div><strong>Use something else if</strong>RemoteTerm, Home Assistant, or PyMC already manages the radio.</div>
  <div><strong>Keep online</strong>The radio, USB connection, host service, and internet connection.</div>
</div>

The helper can also configure `meshcore-packet-capture` for a companion connected by BLE, serial, or TCP.

## Before you start

| Requirement | Check |
|---|---|
| Radio | Packet logging works over USB and the local mesh settings are correct |
| Host | Linux or macOS for `meshcoretomqtt`; Windows is supported only for companion capture |
| Access | You can read the current config and restart the service |
| Location | A real three-letter [location code](../iata-codes.md) |
| Tools | `curl`, a text viewer, and `systemctl` on Linux |

!!! warning "Review before running"
    These helpers are not pinned to a release or checksum. Download and inspect them before running. `--no-restart` still writes files; it is not a dry run.

Files to review:

- [Bash helper source](https://github.com/MeshCore-ca/MeshCore-Canada/blob/main/docs/analyzer/scripts/add-meshcore-ca-broker.sh)
- [Published Bash helper](https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh)
- [PowerShell companion helper source](https://github.com/MeshCore-ca/MeshCore-Canada/blob/main/docs/analyzer/scripts/add-meshcore-ca-packetcapture-broker.ps1)

## What this changes

On a serial host, the helper:

- writes `/etc/mctomqtt/config.d/20-meshcore-ca.toml`;
- makes a timestamped `.bak.<timestamp>` copy when that file exists;
- adds the primary and backup MeshCore Canada endpoints and location code; and
- restarts `mctomqtt` unless `--no-restart` is used.

For companion capture, it updates `~/.meshcore-packet-capture/.env.local`, makes a timestamped backup, configures slots 1 and 2, disables slots 3–6, and may restart the capture service.

Install flags download and run separate upstream installers. Do not use them until you have reviewed the named upstream installer too.

## Set up

### 1. Download and inspect the helper

```bash
workdir="$(mktemp -d)"
curl -fsSLo "$workdir/add-meshcore-ca-broker.sh" https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh
less "$workdir/add-meshcore-ca-broker.sh"
```

Check the source URL, changed paths, endpoint hosts, backup behaviour, and restart behaviour. Keep the file for the rest of this setup.

### 2. Write without restarting

Replace `YOW` with the real location code nearest the observer:

```bash
bash "$workdir/add-meshcore-ca-broker.sh" --device serial-host --iata YOW --no-restart
```

The helper validates the code shape, rejects `XXX`, warns on codes outside its quick list, and prints the changed and backup paths.

### 3. Review the result

```bash
sudo sed -n '1,220p' /etc/mctomqtt/config.d/20-meshcore-ca.toml
```

Check that:

- the location code is correct;
- primary host and audience are `mqtt1.meshcore.ca`;
- backup host and audience are `mqtt2.meshcore.ca`;
- port is `443`, transport is WebSockets, and TLS verification is enabled.

Do not paste the full file into a public issue without reviewing it.

### 4. Restart deliberately

```bash
sudo systemctl restart mctomqtt
sudo systemctl status mctomqtt --no-pager
```

The service should stay active without repeated TLS or authentication errors.

### Run it directly after review

After reviewing the current published helper, you can run that same file directly:

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device serial-host --iata YOW
```

The downloaded-file method above is easier to review and recover.

### Fresh installation

`--install-mctomqtt` downloads and runs the upstream `meshcoretomqtt` installer. Review that installer first, then add the flag:

```bash
bash "$workdir/add-meshcore-ca-broker.sh" --device serial-host --iata YOW --install-mctomqtt
```

The upstream installer controls serial-port selection and package changes, and it is not pinned or checksummed here.

## Companion capture

Set the companion radio to the local mesh settings first.

=== "Linux or macOS"

    Review the same Bash helper, then run:

    ```bash
    bash "$workdir/add-meshcore-ca-broker.sh" --device companion --iata YOW --no-restart
    ```

    Review `~/.meshcore-packet-capture/.env.local`, then restart your capture process.

=== "Windows PowerShell"

    Download and inspect the helper before running:

    ```powershell
    $helper = Join-Path $env:TEMP "add-meshcore-ca-packetcapture-broker.ps1"
    Invoke-WebRequest https://meshcore.ca/analyzer/scripts/add-meshcore-ca-packetcapture-broker.ps1 -OutFile $helper
    Get-Content $helper
    powershell -NoProfile -ExecutionPolicy Bypass -File $helper -Iata YOW
    ```

    The PowerShell helper changes `%USERPROFILE%\.meshcore-packet-capture\.env.local` and creates a backup. Its optional install switch executes an upstream installer and must be reviewed first.

There is no documented `meshcoretomqtt` Windows installer for the packet-log serial-host path.

## What you should see

The service stays active, the primary endpoint connects, and its packet count changes when the radio hears nearby traffic.

## Verify in CoreScope

1. Confirm the service remains active.
2. Find the observer in [CoreScope Observers](https://live.meshcore.ca/#/observers).
3. Wait for normal nearby activity.
4. Confirm a recent packet in [CoreScope Packets](https://live.meshcore.ca/#/packets).

Finish with [Check your observer](../verify.md). A running service or broker connection is not proof that packets reached CoreScope.

## Recovery

Use the exact backup path printed by the helper.

If a serial-host drop-in existed before:

```bash
sudo cp -- '/etc/mctomqtt/config.d/20-meshcore-ca.toml.bak.<timestamp>' '/etc/mctomqtt/config.d/20-meshcore-ca.toml'
sudo systemctl restart mctomqtt
```

If the helper created a new drop-in and no prior file existed:

```bash
sudo rm -- '/etc/mctomqtt/config.d/20-meshcore-ca.toml'
sudo systemctl restart mctomqtt
```

For companion capture, restore the printed `.env.local.bak.<timestamp>` over `.env.local`, preserve its permissions, and restart the capture process.

The helper does not uninstall software added by an upstream install flag. Use that upstream project's reviewed uninstall process.

## If verification fails

Use [Troubleshooting](../troubleshooting.md). Share only a short redacted service status and the list of changed paths.
