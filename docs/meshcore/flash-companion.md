---
title: Flash and configure a companion
description: Back up, flash, configure, verify, and recover a supported MeshCore companion without losing important identity data.
audience:
  - first-time-user
  - companion-owner
task: flash-companion
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: beginner
estimated_time: 20-30 minutes
destructive: true
requires:
  - supported-companion
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css
---
# Flash and Configure a Companion

<div class="mc-guide-status" data-status="draft" markdown>

**Safety-flow reviewed; device compatibility not yet verified.** Confirm the exact board and current companion target in the official flasher. No tested board/firmware matrix is attached to this page.

</div>

Flash a supported device with companion firmware, then connect it to the Canadian mesh.

- **Scope:** MeshCore Canada onboarding baseline
- **Status:** Operational guide; confirm the exact board and current firmware in the flasher

Local communities may publish different radio settings. Check the [Mesh Directory](../provinces/index.md) before applying the national baseline.

## Before You Erase

!!! danger "Erase Flash deletes the device's stored data"
    Erasing can remove the node identity/private key, name, contacts, channels, radio settings, and other saved configuration. An erased identity cannot be recovered unless you backed it up.

If this is not a brand-new device:

1. Connect with the app or configuration tool that currently manages it.
2. Record the board model, role, firmware version, device name, radio settings, and any settings you need to recreate.
3. Export or securely record the device identity/private key using a supported backup method for that firmware. Store it as a secret; never post it in screenshots, chat, issues, or logs.
4. Export contacts or channels if your app provides that option.

If you cannot back up an identity or configuration that matters, **stop before Erase Flash** and ask your local community for help.

## Prerequisites and preflight

- [ ] I selected the exact hardware model printed on or reported by the board.
- [ ] I backed up everything I need from an existing device.
- [ ] I have a known-good data USB cable and stable power.
- [ ] I am using a browser with Web Serial support, such as current Chrome or Edge.
- [ ] I know how to put this board back into DFU or bootloader mode if flashing fails.

!!! warning "USB serial drivers"
    Some boards require a USB serial driver before the browser can connect.

## What this will change

Flashing replaces the installed firmware and, when **Erase Flash** is selected, deletes stored identity and configuration. The later setup writes the device name and local radio settings.

## Flash the companion firmware

Use the official [MeshCore Web Flasher](https://meshcore.io/flasher). The flasher requires a browser that supports [Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

1. Connect the device by USB.
2. Select the exact hardware model.
3. Select **Companion Radio (Bluetooth)**.
4. Select the firmware version intended for that board.
5. Click **Enter DFU Mode**. The flasher should report that it found a device in the expected mode.
6. Recheck the hardware and firmware selections.
7. Click **Erase Flash**, then wait for a successful erase message.
8. Click **Flash** and wait for the completion message before disconnecting the device.

## Recovery if flashing fails

Do not keep erasing. Leave the device connected, refresh the flasher, return the board to DFU mode, reselect the exact board and companion firmware, and retry **Flash**. If the board no longer appears, follow its documented bootloader recovery method or ask for help before trying another target.

## Expected result after flashing

The flasher reports completion, the board restarts as a companion, and the supported app can discover it. If any part is missing, use the recovery path before changing another setting.

## Configure the companion

1. Pair the node with the supported MeshCore app on your phone or computer.
2. Give it a descriptive name that does not reveal a private location.
3. Check your local community page for an override.
4. If no override is documented, apply the MeshCore Canada baseline: **USA/Canada (Recommended)** (`910.525 MHz / 62.5 kHz / SF7 / CR5`).
5. Save the settings and reconnect after the device restarts.

The optional **Message Settings → Auto Reset Path** preference affects how the app manages changing paths. Leave it at its default unless your local testing process calls for a different setting.

## Verify before regular use

1. Confirm the app reconnects and shows the expected device name and radio settings.
2. Send a test message in the **Public** channel.
3. A response such as **Heard X Repeats** indicates that at least one repeater reported hearing it. A plain **Sent** result is not proof that the settings are wrong; move to a known coverage area or ask the local community to help test.

Do not consider the setup complete until the saved settings survive a reboot and a local test succeeds.


## Next step

After the companion passes the reboot and local message check, [find your community](../provinces/index.md) and keep the board-specific USB recovery method with the device record.

## Sources and verification limits

- [Official MeshCore web flasher](https://meshcore.io/flasher)
- [Official MeshCore source and releases](https://github.com/meshcore-dev/MeshCore)

A firmware maintainer must attach a dated tested-board/version matrix before this guide can be marked verified.
