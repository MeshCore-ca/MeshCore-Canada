# Repeater Build Guides

!!! info "This page is a work in progress"
    Content coming soon. Want to help? See [Contributing](../contributing.md).

## Overview

Step-by-step guides for building and deploying MeshCore repeaters.

Before placing a repeater, configure it for the MeshCore Canada network:

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |

For repeaters or room servers configured through the MeshCore CLI, run:

```text
set radio 910.525,62.5,7,5
set path.hash.mode 2
reboot
```

!!! note "Fresh MeshCore.ca firmware flashes"
    New users flashing MeshCore.ca repeater firmware should still run the onboarding settings above. This confirms the repeater is on the USA/Canada radio preset and uses 3-byte path hashes before it is installed on a roof, mast, or remote site.

## Indoor Repeater

<!-- TODO: Parts list, assembly, firmware flash, configuration -->

## Outdoor / Weatherproof Repeater

<!-- TODO: Enclosure options, weatherproofing, mounting -->

## Solar-Powered Remote Repeater

<!-- TODO: Solar panel sizing, battery, charge controller, full build walkthrough -->
