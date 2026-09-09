---
title: Flash and configure a room server
description: Safely flash, secure, and test a supported MeshCore room server before deployment.
audience:
  - room-server-operator
  - network-operator
task: flash-room-server
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 30-45 minutes
destructive: true
requires:
  - supported-room-server-board
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css?v=20260728-1
---
# Flash and configure a room server

Confirm that the official flasher supports your exact board as a room server,
then back it up, flash it, secure access, and test it with a companion.

## Before you erase

!!! danger "Erase Flash deletes stored room-server data"
    Erasing can remove the device identity/private key, room data, guest and admin access, name, radio settings, and other saved configuration. Back up anything you need before continuing.

For an existing device, record the board, firmware version, name, role, radio settings, and access configuration. Export or securely record the private key with a supported tool. Store passwords in a password manager and never place them in screenshots, issues, or chat.

If room history or identity cannot be backed up and must be retained, stop before erasing.

## Before you start

- [ ] The exact board and **Room Server** role are confirmed.
- [ ] Existing identity, room data, and settings are backed up where supported.
- [ ] A known-good data USB cable and stable power are available.
- [ ] I am using a current browser with Web Serial support, such as Chrome or Edge.
- [ ] I checked the local community page for radio-setting overrides.

## What flashing changes

Flashing replaces firmware and **Erase Flash** can delete identity, room data, access settings, and radio configuration. Setup writes guest/admin access, name, and local radio settings.

## Recovery plan

Keep the exact board's USB recovery method, backed-up identity/settings, a known-good cable, and the verified Room Server artifact available before erasing. If flashing fails, return the same board to DFU mode and retry the same verified target; do not switch board files.

## Flash the firmware

1. Open the official [MeshCore Web Flasher](https://meshcore.io/flasher).
2. Select the exact device model.
3. Select **Room Server** and the intended version for that board.
4. Follow the flasher’s connection steps for your board. Use **Enter DFU Mode** only when that target asks for it.
5. Recheck the hardware and role selections.
6. For a first installation or deliberate reset, back up first. Click **Erase Flash** only if the board’s instructions require it. For an update, leave erase off unless its release notes require a reset.
7. Click **Flash** and wait for completion before disconnecting.

If flashing fails after erase, leave the device connected, refresh the flasher, re-enter DFU mode, confirm the board and role, and retry **Flash**. Use the board's documented USB recovery process if it is no longer detected.

## Check the flash

The flasher reports completion, the device restarts as a Room Server, and **Configure via USB** can reconnect. Otherwise use the recovery plan before setting access details.

## Configure the Room Server

1. After flashing, click **Configure via USB**.
2. Select the room server's serial device and connect.
3. Set a descriptive name that does not expose a private location.
4. Set separate, unique guest and admin passwords and store them securely.
   - The guest password is shared with people who should enter the room.
   - The admin password controls management access and should not be shared as the guest password.
5. Check the local community page for different settings. If none are listed, choose **Canada** (`910.525 MHz / 62.5 kHz / SF7 / CR5`) and **3-byte** paths (`set path.hash.mode 2`).
6. Save settings and reboot.

If Canada is not listed in your app or flasher, follow the [older-preset instructions](../provinces/index.md#canada-baseline).

## Test the server

1. Reconnect to the console after reboot and confirm the name, role, and radio settings.
2. Send an advert.
3. Confirm a companion discovers the Room Server.
4. Log in from the companion with the guest password.
5. Confirm the intended room behavior, then reboot once more and verify the settings persist.

Do not deploy the server remotely until USB recovery, admin access, discovery, and guest access all work on the bench.


## Recovery and undo

If discovery, guest access, admin access, or persistence fails, keep the server local and reachable by USB. Restore the backed-up identity/settings where supported or reflash the exact Room Server target by USB, then repeat verification. Do not deploy a server whose access path or recovery is uncertain.

## What's next

After the server survives reboot and access checks, [find the local community](../provinces/index.md) and document who maintains the room and its recovery record.

## Sources

- [Official MeshCore web flasher](https://meshcore.io/flasher)
- [Official MeshCore source and releases](https://github.com/meshcore-dev/MeshCore)
