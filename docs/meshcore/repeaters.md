# Recommended Repeaters

!!! info "This page is a work in progress"
    Content coming soon. Want to help? See [Contributing](../contributing.md).

## What is a Repeater?

A repeater extends local mesh coverage by hearing packets and forwarding them for other nodes. It must use the same radio preset and path hash settings as the surrounding MeshCore Canada network.

## Required Network Settings

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |

For repeaters with MeshCore CLI access:

```text
set radio 910.525,62.5,7,5
set path.hash.mode 2
reboot
```

!!! warning "Check before installation"
    A repeater installed with the wrong regional preset or path hash mode can look healthy locally but still fail to participate in the MeshCore Canada network. Confirm these settings before mounting it somewhere hard to reach.

## Recommended Devices

<!-- TODO: Table of recommended repeater hardware -->

| Device | Chipset | Power Source | Enclosure | Notes |
|--------|---------|-------------|-----------|-------|
| <!-- TODO --> | | | | |

## Solar-Powered Setups

<!-- TODO: Info on solar repeater builds for remote deployment -->

## Placement Tips

<!-- TODO: Antenna height, line of sight, optimal locations -->
