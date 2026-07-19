---
title: Flash and configure a room server
description: Back up, flash, secure, verify, and recover a supported MeshCore Room Server before deployment.
audience:
  - room-server-operator
  - network-operator
task: flash-room-server
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 30-45 minutes
destructive: true
requires:
  - supported-room-server-board
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css
---
# Flash and Configure a Room Server

<div class="mc-guide-status" data-status="draft" markdown>

**Safety-flow reviewed; device/version compatibility not yet verified.** Confirm the exact board and current Room Server target in the official flasher before erasing.

</div>

Flash a supported device as a MeshCore Room Server, secure access, and verify that a companion can discover and enter it.

- **Scope:** MeshCore Canada onboarding baseline
- **Status:** Operational guide; confirm the exact board and current firmware in the flasher

## Before You Erase

!!! danger "Erase Flash deletes stored room-server data"
    Erasing can remove the device identity/private key, room data, guest and admin access, name, radio settings, and other saved configuration. Back up anything you need before continuing.

For an existing device, record the board, firmware version, name, role, radio settings, and access configuration. Export or securely record the private key with a supported tool. Store passwords in a password manager and never place them in screenshots, issues, or chat.

If room history or identity cannot be backed up and must be retained, stop before erasing.

## Prerequisites and preflight

- [ ] The exact board and **Room Server** role are confirmed.
- [ ] Existing identity, room data, and settings are backed up where supported.
- [ ] A known-good data USB cable and stable power are available.
- [ ] I am using a current browser with Web Serial support, such as Chrome or Edge.
- [ ] I checked the local community page for radio-setting overrides.

## What this will change

Flashing replaces firmware and **Erase Flash** can delete identity, room data, access settings, and radio configuration. Setup writes guest/admin access, name, and local radio settings.

## Recovery plan

Keep the exact board's USB recovery method, backed-up identity/settings, a known-good cable, and the verified Room Server artifact available before erasing. If flashing fails, return the same board to DFU mode and retry the same verified target; do not switch board files.

## Flash the firmware

1. Open the official [MeshCore Web Flasher](https://meshcore.io/flasher).
2. Select the exact device model.
3. Select **Room Server** and the intended version for that board.
4. Click **Enter DFU Mode** and wait for the expected device to appear.
5. Recheck the hardware and role selections.
6. Click **Erase Flash** and wait for a successful erase message.
7. Click **Flash** and wait for completion before disconnecting.

If flashing fails after erase, leave the device connected, refresh the flasher, re-enter DFU mode, confirm the board and role, and retry **Flash**. Use the board's documented USB recovery process if it is no longer detected.

## Expected result after flashing

The flasher reports completion, the device restarts as a Room Server, and **Configure via USB** can reconnect. Otherwise use the recovery plan before setting access details.

## Configure the Room Server

1. After flashing, click **Configure via USB**.
2. Select the room server's serial device and connect.
3. Set a descriptive name that does not expose a private location.
4. Set separate, unique guest and admin passwords and store them securely.
   - The guest password is shared with people who should enter the room.
   - The admin password controls management access and should not be shared as the guest password.
5. Check the local community page for an override. If none is documented, choose **USA/Canada (Recommended)** (`910.525 MHz / 62.5 kHz / SF7 / CR5`).
6. Save settings and reboot.

## Verify success

1. Reconnect to the console after reboot and confirm the name, role, and radio settings.
2. Send an advert.
3. Confirm a companion discovers the Room Server.
4. Log in from the companion with the guest password.
5. Confirm the intended room behavior, then reboot once more and verify the settings persist.

Do not deploy the server remotely until USB recovery, admin access, discovery, and guest access all work on the bench.


## Recovery and undo

If discovery, guest access, admin access, or persistence fails, keep the server local and reachable by USB. Restore the backed-up identity/settings where supported or reflash the exact Room Server target by USB, then repeat verification. Do not deploy a server whose access path or recovery is uncertain.

## Next step

After the server survives reboot and access checks, [find the local community](../provinces/index.md) and document who maintains the room and its recovery record.

## Sources and verification limits

- [Official MeshCore web flasher](https://meshcore.io/flasher)
- [Official MeshCore source and releases](https://github.com/meshcore-dev/MeshCore)

A firmware maintainer must attach a dated tested-board/version matrix before this guide can be marked verified.
