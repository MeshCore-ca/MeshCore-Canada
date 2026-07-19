---
title: Update a repeater or room server over the air
description: Decide whether OTA is safe, prepare physical recovery, update an nRF52 device, and verify every retained setting.
audience:
  - advanced-repeater-operator
  - room-server-operator
task: update-repeater-ota
scope: ottawa-field-practice
status: experimental
owner: docs-firmware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: advanced
estimated_time: 30-60 minutes
destructive: true
requires:
  - supported-nrf52-device
  - physical-usb-recovery
  - verified-firmware-zip
page_styles:
  - assets/styles/devices-builds.css
---
# Update a Repeater or Room Server over the Air

<div class="mc-guide-status" data-status="experimental" markdown>

**Advanced Ottawa field practice.** USB remains the primary update method. Exact board, bootloader, current version, target artifact, phone/app behaviour, and recovery have not been reproduced as a current matrix on this page.

</div>

OTA updating is an advanced fallback for supported nRF52 devices. USB flashing remains the recommended method.

- **Scope:** MeshCore Canada field practice
- **Status:** Advanced and high risk; upstream support and exact board/version must be confirmed

!!! danger "Bootloader prerequisite"
    Proceed only after confirming that the exact board has the OTAFIX bootloader described in [Flashing a Repeater](flash-repeater.md#nrf52-bootloader-decision). A failed OTA update can require physical USB recovery.

!!! warning "Android is the MeshCore Canada field-tested path"
    The community has observed failed OTA attempts from iOS and currently recommends Android for this workflow. This is a local risk-control recommendation, not a claim that upstream iOS support does not exist.

## Prerequisites: decide whether to stop

Use USB instead if any answer below is **no**:

- [ ] The device is an OTA-supported nRF52 board such as a RAK4631, Heltec T114, or XIAO nRF52840.
- [ ] The board identity, installed bootloader, current firmware, and intended firmware file are known.
- [ ] The private key, settings, region configuration, and access details are backed up securely.
- [ ] Stable power and a reliable radio-management path are available for the full update.
- [ ] Someone can reach the device with a USB cable if OTA fails.
- [ ] The downloaded ZIP names the exact board and role.

!!! danger "No physical recovery means no OTA"
    Do not start an OTA update on a roof, tower, winter site, or other inaccessible installation when a failed update cannot be recovered promptly by USB.

## What this will change

OTA places the device into firmware-update mode and replaces its firmware over Bluetooth. A failed transfer can leave the device needing physical USB recovery, while a wrong artifact can target the wrong board or role.

## Recovery plan before starting

Keep the correct USB firmware and a data cable ready. Record the current version and settings. If the device remains in DFU mode after a failed attempt, scan again for a generic DFU name and retry the same verified ZIP. If it does not recover over the air, stop and reflash the exact board/role by USB using the backup.

## 1. Download the Exact Firmware ZIP

1. Open the [MeshCore Web Flasher](https://meshcore.io/flasher).
2. Select the exact device and **Repeater** or **Room Server** role.
3. Choose the specific version approved for this update; do not rely on a generic “latest” label.
4. Use the download control to save the `.zip` artifact.

Alternatively, use the [official MeshCore releases](https://github.com/meshcore-dev/MeshCore/releases) and verify the artifact is for the exact board and role.

## 2. Put the Device in OTA Mode

1. In the MeshCore mobile app, log in with the admin password.
2. Open **Command Line** and run:

    ```text
    start ota
    ```

3. Continue only after a reply similar to `OK - mac: FF:AA:BB ...` confirms OTA mode. If there is no confirmation, stop and keep the device on its current firmware.

You may also issue `start ota` from a standalone management device that supports the repeater command line.

## 3. Transfer the Update

Install Nordic's **nRF Device Firmware Update** app from the official app store for the phone.

For the MeshCore Canada Android-tested path, use:

- **Packet receipts notification:** on
- **Number of packets:** `8`
- **Request high MTU:** off
- **Disable resume:** on
- **Prepare object delay:** `0 ms`
- **Force scanning:** on

Then:

1. Select the verified `.zip` file.
2. Select the expected device from the scan list.
3. Start the update and keep the phone, device, and power stable until the app reports completion.

If the app reports failure but a generic name such as `AdaDFU` or `RAK4631_DFU` appears, select that device and retry the same verified ZIP once. Do not switch to another board's file.

## Expected result

The DFU app reports completion, the device restarts, remote administration reconnects, and the device reports the intended firmware version. Anything less is a failed or incomplete update.

## 4. Verify the update

1. Log out and reconnect after the device restarts.
2. Run `ver` and confirm the exact intended firmware version.
3. Run `clock`; if needed, run `clock sync` from a supported remote management device.
4. Confirm the radio, path-hash, region, advert, access, and role settings still match the saved configuration.
5. Send an advert and complete a local message-routing test.

The update is not complete until the device reconnects, reports the intended version, retains its configuration, and passes the local test.

For upstream context, see the [official MeshCore OTA instructions](https://blog.meshcore.io/2026/04/02/nrf-ota-update).


## Recovery after a failed update

If the same verified ZIP cannot complete against the expected DFU device, stop remote attempts and recover the exact board/role by USB. Restore the backed-up identity and settings where supported, then repeat the complete verification. Never try a different board artifact as a recovery guess.

## Next step

Record the old and new versions, artifact filename/source, device identity, result, settings check, radio test, and recovery status in the repeater maintenance record.

## Verification limits

The Android recommendation and DFU settings are community field practice, not a current cross-platform test matrix. A firmware maintainer must reproduce the exact board/version/app combinations before this page can be marked verified.
