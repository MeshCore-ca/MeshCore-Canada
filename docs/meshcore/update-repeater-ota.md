---
title: Update a repeater or room server over the air
description: Update an nRF52 repeater or room server safely and verify its settings.
audience:
  - advanced-repeater-operator
  - room-server-operator
task: update-repeater-ota
scope: experimental
status: experimental
status_notice: false
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: 30-60 minutes
destructive: true
requires:
  - supported-nrf52-device
  - physical-usb-recovery
  - verified-firmware-zip
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Update a repeater or room server over the air

## Before you start

!!! danger "Bootloader first"
    Only do this if the repeater has the **OTAFIX bootloader**. The
    [repeater setup tool](../config/index.md) walks through the bootloader update
    for nRF52 boards.

!!! danger "Android only: iOS not recommended"
    These steps are for **Android**. iOS technically works, but we've had several
    failed OTA updates from iOS. Until that changes, don't use an iOS device for
    OTA updates.

This only applies to nRF-based boards (for example the RAK4630, Heltec T114 and
XIAO nRF52). **We strongly recommend updating over USB instead.**

!!! warning "OTA risks"
    An OTA update can fail even when the app says it worked, and then the
    repeater needs a USB re-flash. We had one fail in winter and had to wait until
    spring to reach the repeater. Proceed at your own risk.

Save the repeater's private key first, in case a failed update forces a USB
re-flash: log in as admin, open **Command Line** and send `get prv.key`. Keep the
reply in a password manager and never share it.

These steps summarise the [official instructions on the MeshCore blog](https://blog.meshcore.io/2026/04/02/nrf-ota-update).

## 1. Download the firmware .zip

1. Open the [MeshCore flasher](https://meshcore.io/flasher) and find your device.
2. Select the **Repeater** or **Room Server** role, then the latest version.
3. Click **Download** at the bottom right and choose the `.zip` file.

You can also download the `.zip` for your board (for example, the T114 repeater)
from the [MeshCore GitHub releases](https://github.com/meshcore-dev/MeshCore/releases).

## 2. Log in and start OTA

1. In the MeshCore app, log in to the device with the admin password.
2. Open the **Command Line** tab and send:

    ```
    start ota
    ```

3. You should see a reply like:

    ```
    OK - mac: FF:AA:BB ...
    ```

**Tip:** a standalone device such as a T-Deck running Ripple can also send
`start ota`.

## 3. Connect with your phone

Install Nordic's **nRF Device Firmware Update** app from Google Play if you don't
have it.

### DFU app settings

Tap the **Settings** icon and set:

- **Packet receipts notification:** ON
- **Number of packets:** 8
- **Request high MTU:** OFF
- **Disable resume:** ON
- **Prepare object delay:** 0 ms
- **Force scanning:** ON

### Start the update

1. Select the `.zip` file you downloaded.
2. Select your device from the scan list.
3. Press **Start** and wait for the update to finish.

## 4. Check it updated

1. Log out and log back in, with the app or a standalone device.
2. Check the clock with `clock`. If it's wrong, send `clock sync`.
3. Send `ver` to confirm the firmware version changed.

## Recovery if it fails

If the update stalls or fails, send this from your phone or a standalone device,
then try again:

```
reboot
```

**RAK4631 with the updated bootloader:** the app will likely say the flash
failed. Scan again: the device shows up with a generic name (such as AdaDFU or
RAK4631_DFU). Select it and upload the update again.
