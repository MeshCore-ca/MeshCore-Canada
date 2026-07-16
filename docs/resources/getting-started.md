# Getting Started with MeshCore in Canada

!!! info "This page is a work in progress"
    More hardware-specific walkthroughs are still being added. These network settings are the current MeshCore Canada baseline.

## Welcome to MeshCore!

MeshCore Canada communities generally use the same radio preset and path settings so companions, repeaters, room servers, and observers can hear each other reliably.

## Step 1: Understand the Basics

MeshCore devices must match the local mesh's radio settings before they can join the network. For MeshCore Canada, start with these defaults unless your local community page lists a different setting.

| Setting | MeshCore Canada value |
|---------|------------------------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash / advert path mode | `3-byte` |
| CLI path setting | `set path.hash.mode 2` |

!!! warning "Preset must match"
    A device on another regional preset may appear to be configured correctly but will not hear the MeshCore Canada network. Pick **USA/Canada (Recommended)** in apps or config tools. If the tool only exposes raw radio fields, use `910.525 MHz`, `62.5 kHz`, `SF7`, and `CR5`.

!!! note "Why 3-byte path hashes?"
    MeshCore Canada recommends 3-byte path hashes for better behavior on larger repeater-backed networks. Companion devices often need this changed manually. Repeaters, room servers, and standalone observers should have path hash mode set during onboarding.

## Step 2: Get Your Hardware

Choose a role:

- **Companion**: the handheld or mobile device you use to send and receive messages.
- **Repeater**: a fixed node that extends mesh coverage.
- **Room server**: a fixed node that hosts rooms and can also observe mesh traffic.
- **Observer**: a device or host service that forwards packets to the MeshCore.ca MQTT analyzer.

Start with [Recommended Companions](../hardware/recommended-companions.md) if you want a personal device, or [Recommended Repeaters](../hardware/recommended-repeaters.md) if you are building a fixed node.

## Step 3: Flash the Firmware

Flash firmware for the role you need, then apply the MeshCore Canada network settings before judging whether the device works.

For repeaters, room servers, and standalone observers, include this first-run CLI setting:

```text
set path.hash.mode 2
```

If you are reusing a device with retained preferences or configuring firmware through the CLI, also run `set radio 910.525,62.5,7,5`.

For companion devices, set the radio preset to **USA/Canada (Recommended)** and set path hash mode to **3-byte** in the companion app or config tool. If you are configuring a companion through a CLI that supports MeshCore settings, use:

```text
set path.hash.mode 2
```

After changing radio parameters, reboot the device.

### Optional repeater loop protection

Loop detection is not part of the Canada-wide basic setup. MeshCore leaves it off by default. If local operators are troubleshooting a packet storm caused by a looping repeater, firmware 1.14 and newer can use:

```text
set loop.detect moderate
```

This is a troubleshooting safeguard for repeaters, not a setting to apply to every new device. Coordinate the change with the local mesh, and leave it off when there is no loop problem. See the [upstream MeshCore CLI reference](https://github.com/meshcore-dev/MeshCore/blob/main/docs/cli_commands.md#view-or-change-this-nodes-loop-detection) for the available modes.

## Step 4: Configure Your Role

| Role | Next setup step |
|------|-----------------|
| Companion | Pair it with your app, send an advert, and ask a nearby user to confirm they can see you |
| Repeater | Pick a clear node name, test from the ground, then install it where it has good antenna visibility |
| Room server | Configure rooms, verify it still uses the local mesh settings, and document who maintains it |
| Observer | Follow [Analyzer & MQTT](../analyzer/intro.md) and verify it appears in CoreScope |

## Step 5: Find or Start a Community

Browse the [Mesh Directory](../provinces/index.md) and check your province or nearby region. If a local community documents a different preset, follow the local community setting for that mesh.

If your region is missing, use [Contributing](../contributing.md) to request a new listing with the community name, region, status, contacts, and radio settings.

## Step 6: Get on the Air

Send an advert after configuration so nearby nodes learn your identity and route. If you do not see other users, re-check the radio preset first, then confirm the path hash mode is set to 3-byte.

## First Success Checklist

- Your device shows the **USA/Canada (Recommended)** preset, or the raw values match `910.525 MHz / 62.5 kHz / SF7 / CR5`.
- Path hash mode is **3-byte**.
- The device was rebooted after radio changes.
- A nearby community member or second known-good device can see your advert.
- If this is an observer, [CoreScope](https://live.meshcore.ca/#/observers) shows the expected node name and IATA region.

## Need Help?

Open an issue or update request through [Contributing](../contributing.md), or ask in your local MeshCore Canada community channel.
