# Repeater Build Guides

This page gives practical build patterns for MeshCore Canada repeaters. Use the hardware-specific firmware guide when you are ready to flash a board.

## Baseline Configuration

Before placing a repeater, configure it for the MeshCore Canada network:

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |

For repeaters or room servers flashed with 2026-05-21 or newer MeshCore.ca direct MQTT firmware, run:

```text
set path.hash.mode 2
reboot
```

!!! note "Fresh MeshCore.ca firmware flashes"
    The 2026-05-21 and newer MeshCore.ca direct MQTT firmware images already default to the USA/Canada radio preset. If you are updating an older image, reusing a device with retained preferences, or configuring generic firmware, also run `set radio 910.525,62.5,7,5` before installing the repeater on a roof, mast, or remote site.

## Indoor Repeater

Use this pattern for testing, apartments, windowsill coverage, or a known-good spare node.

| Part | Recommendation |
|------|----------------|
| Board | MeshCore-supported LoRa board |
| Power | Stable USB power supply |
| Antenna | Short 915 MHz antenna, away from computer noise |
| Location | Window or high shelf, not behind metal or appliances |

Checklist:

1. Flash firmware and configure radio/path settings.
2. Set a clear node name such as `YOW-Indoor-Repeater-01`.
3. Reboot and send an advert.
4. Confirm a companion can hear it from another room or outside.
5. Leave it running for a day before using it as a reference node.

## Outdoor Repeater

Use this pattern for roof, mast, or tower deployments.

| Part | Recommendation |
|------|----------------|
| Enclosure | Weatherproof, UV-resistant, with strain relief |
| Power | Protected USB, PoE splitter, or DC regulator with margin |
| Antenna | Outdoor 915 MHz antenna mounted above obstructions |
| Cable | Short coax run or low-loss feedline |
| Service access | USB or serial access without fully rebuilding the site |

Before mounting, confirm:

- The repeater hears at least one known local node.
- The node name and community page identify the region.
- The path hash mode is 3-byte.
- The enclosure is sealed but not trapping condensation against the board.

## Solar-Powered Remote Repeater

Remote sites need more margin than indoor tests.

| Area | Check |
|------|-------|
| Battery | Sized for overnight load and several low-sun days |
| Panel | Sized for winter sun angle and snow/dirt losses |
| Charge controller | Suitable for the battery chemistry |
| Enclosure | Venting or moisture control considered |
| Monitoring | Physical access plan and last-known config recorded |

For direct MQTT observers, also confirm WiFi or backhaul at the final installation point. A good radio site can still be a poor observer site if internet access is unreliable.

## Deployment Record

Keep a short record for every fixed repeater:

| Field | Example |
|-------|---------|
| Node name | `YOW-Repeater-01` |
| Region/IATA | `YOW` |
| Firmware | `20260521` |
| Radio preset | `USA/Canada (Recommended)` |
| Path hash mode | `3-byte` |
| Antenna | Outdoor 915 MHz vertical |
| Contact | Community page, Discord, Telegram, or maintainer |

This makes community support much easier when a repeater disappears or starts reporting under the wrong region.
