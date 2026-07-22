---
title: Flash, configure, and bench-test a repeater
description: Back up, flash by USB, configure, verify, and recover a MeshCore repeater before it leaves the bench.
audience:
  - repeater-builder
  - network-operator
task: flash-repeater
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 30-60 minutes
destructive: true
requires:
  - supported-repeater-board
  - physical-usb-access
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---
# Flash, configure, and bench-test a repeater

Confirm the exact board, bootloader, repeater target, and firmware file in the
official sources before making changes. Keep the repeater on the bench until
it passes every check in this guide.

## Before changing firmware

!!! danger "Back up the repeater before any erase"
    **Erase Flash** can remove the repeater's identity/private key, admin access, name, location, region definitions, radio settings, and other saved configuration. A deployed identity cannot be recreated unless its private key was backed up.

For an existing repeater, record or export:

- exact board model, role, and current firmware version;
- device name, radio settings, location choice, advert settings, path-hash mode, and region configuration;
- admin/guest access information in your password manager; and
- the private key through a supported secure backup method.

Never post the private key or passwords in an issue, screenshot, log, or chat. If a required backup cannot be completed, stop before erasing.

## Before you start

- [ ] The exact board and role are confirmed.
- [ ] Existing identity and settings are backed up securely.
- [ ] A known-good data USB cable and stable power are available.
- [ ] I can regain physical USB access if setup or an update fails.
- [ ] I checked the [community directory](../provinces/index.md) and the [repeater configurator](../config/index.md) for the correct local region and settings.
- [ ] I will bench-test before installing the repeater at height or in a remote enclosure.

## What flashing changes

An erase replaces firmware and can delete identity and settings. The setup also writes radio, advert, path-hash, access, location, and region values that affect the shared network.

## Recovery plan

Keep the exact board's USB recovery method, known-good data cable, backed-up identity/settings, and verified firmware file at the bench. If an erase or flash fails, do not try another board target; return the exact board to DFU/bootloader mode and retry the same verified role by USB.

## nRF52 bootloader decision

Skip this section for boards that are not nRF52-based.

For supported nRF52 boards, MeshCore Canada currently directs operators to the [OTAFIX releases](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases) before relying on OTA recovery. Confirm the file matches the exact board; using another board's bootloader can require physical recovery.

Download only the current OTAFIX file whose board name matches your exact
hardware. Do not use a filename copied from an older guide or screenshot.

1. Download the matching `update-*.uf2` from the OTAFIX release page.
2. Connect the board over USB.
3. Enter its UF2 bootloader mode. On a RAK4631 this is normally done by double-pressing the button beside USB; other boards use their documented reset method.
4. Confirm a USB drive appears and inspect `INFO.TXT` so the board identity is what you expect.
5. Copy the matching UF2 file to that drive. The drive may disconnect as the board reboots.
6. Re-enter bootloader mode and confirm `INFO.TXT` reports bootloader version `0.9.2` before continuing.

If the board identity or expected version does not match, stop and recover over USB before flashing MeshCore.

## Flash by USB (recommended)

Use the official [MeshCore Web Flasher](https://meshcore.io/flasher) in a browser with [Web Serial support](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

1. Connect the repeater by USB.
2. Select the exact hardware model.
3. Select **Repeater** as the role and choose the intended version for that board.
4. Click **Enter DFU Mode** and wait for the flasher to find the board.
5. Recheck the selected board and role.
6. Click **Erase Flash** and wait for a successful erase message.
7. Click **Flash** and wait for completion before disconnecting.

If flashing fails after erase, do not repeatedly erase. Refresh the page, return the board to DFU mode, verify the target again, and retry **Flash**. Use the board's USB recovery process if it no longer appears.

## Check the flash

The flasher reports completion, the board restarts as a repeater, and the setup console can reconnect. If that state is not reached, follow the recovery plan before configuration.

## Configure the repeater

1. In the MeshCore Web Flasher, open **Repeater Setup**.
2. Connect to the repeater and enable **Show Advanced Settings** so the required fields are visible.
3. Enter the intended location or use the map. Do not publish an exact private location unless that is appropriate for the site.
4. Set a descriptive name, such as `Callsign_R1` or `Downtown_R1`.
5. Set a unique admin password and store it securely.
6. Confirm the local community has not documented an override. Otherwise apply **USA/Canada (Recommended)** (`910.525 MHz / 62.5 kHz / SF7 / CR5`).
7. Set the current MeshCore Canada default advert values:
   - **Advert Interval:** `60` minutes
   - **Flood Advert Interval:** `24` hours
   - **Flood Max:** `64`
8. Use the [Repeater Configurator](../config/index.md) to get the region commands and path-hash mode. The Canada default is 3-byte (`set path.hash.mode 2`); use different local settings when your community lists them.
9. Add owner information only if it is suitable for public adverts.
10. Save the settings and reboot.

### Loop detection

Repeater firmware **1.14 or newer** can reject packets that repeatedly pass
through the same repeater. Change this only with the local operators. Record
the current value, then run:

```text
get loop.detect
set loop.detect moderate
get loop.detect
```

The last command should report `moderate`. Watch for lost legitimate traffic
and restore the recorded value if delivery gets worse. This setting can limit
a packet storm; it does not repair a faulty repeater or prove the mesh is
healthy. See the [official CLI reference](https://docs.meshcore.io/cli_commands/#view-or-change-this-nodes-loop-detection){ target="_blank" rel="noopener" }.

## Verify and bench-test

1. Reconnect after reboot and sync the repeater clock.
2. Confirm the firmware version, device name, radio settings, path-hash mode, advert settings, and region configuration match the plan.
3. Send an advert and confirm a nearby companion receives it.
4. Reboot once more, reconnect, and confirm the saved configuration remains intact.
5. Verify remote administration from the intended companion before closing an enclosure or installing the repeater remotely.

After every reboot, resync the repeater clock. Routing can continue without a correct clock, but stale advert timing can prevent companions from accepting a new advert.

Do not deploy until the repeater passes this bench test and USB recovery remains practical.

## 1-byte identity changes

Most operators should not change a repeater identity after setup. A region that still coordinates 1-byte IDs may direct an operator to do so. Follow [Generating a Repeater ID](generate-repeater-id.md) only when the local region operator confirms it is required, and keep the old private key as the rollback path.


## Before installation

Keep the repeater on the bench until every verification passes. Then review the [mounting plan](../hardware/repeater-mounting-options.md) and retain physical USB access.

## Sources

- [Official MeshCore web flasher](https://meshcore.io/flasher)
- [Official MeshCore source and releases](https://github.com/meshcore-dev/MeshCore)
- [OTAFIX releases referenced by the community](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases)
