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
    MeshCore Canada recommends 3-byte path hashes for better behavior on larger repeater-backed networks. Companion devices often need this changed manually. Repeaters and room servers flashed with MeshCore.ca firmware should also be checked during onboarding.

## Step 2: Get Your Hardware

Choose a role:

- **Companion**: the handheld or mobile device you use to send and receive messages.
- **Repeater**: a fixed node that extends mesh coverage.
- **Room server**: a fixed node that hosts rooms and can also observe mesh traffic.
- **Observer**: a device or host service that forwards packets to the MeshCore.ca MQTT analyzer.

## Step 3: Flash the Firmware

Flash firmware for the role you need, then apply the MeshCore Canada network settings before judging whether the device works.

For repeaters and room servers using the MeshCore.ca observer firmware, include these first-run CLI settings:

```text
set radio 910.525,62.5,7,5
set path.hash.mode 2
```

For companion devices, set the radio preset to **USA/Canada (Recommended)** and set path hash mode to **3-byte** in the companion app or config tool. If you are configuring a companion through a CLI that supports MeshCore settings, use:

```text
set path.hash.mode 2
```

After changing radio parameters, reboot the device.

## Step 4: Find or Start a Community

Browse the [Mesh Directory](../provinces/ontario.md) and check your province or nearby region. If a local community documents a different preset, follow the local community setting for that mesh.

## Step 5: Get on the Air

Send an advert after configuration so nearby nodes learn your identity and route. If you do not see other users, re-check the radio preset first, then confirm the path hash mode is set to 3-byte.

## Need Help?

Open an issue or update request through [Contributing](../contributing.md), or ask in your local MeshCore Canada community channel.
