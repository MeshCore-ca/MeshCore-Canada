# Recommended Repeaters

A repeater extends local mesh coverage by hearing packets and forwarding them for other nodes. It must use the same radio preset and path hash settings as the surrounding MeshCore Canada network.

## Required Network Settings

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |

For repeaters flashed with 2026-05-21 or newer MeshCore.ca direct MQTT firmware:

```text
set path.hash.mode 2
reboot
```

!!! warning "Check before installation"
    A repeater installed with the wrong regional preset or path hash mode can look healthy locally but still fail to participate in the MeshCore Canada network. Fresh 2026-05-21 and newer MeshCore.ca direct MQTT firmware already defaults to the USA/Canada radio preset, but older images, retained preferences, and generic firmware should be verified with `set radio 910.525,62.5,7,5` before mounting the device somewhere hard to reach.

## Hardware Selection

| Priority | Why it matters |
|----------|----------------|
| Stable power | Brownouts cause confusing mesh and MQTT failures |
| Outdoor-rated enclosure | Moisture and condensation are common failure modes |
| Accessible USB or serial | Remote sites are hard to recover after a bad config |
| Quality antenna and feedline | Antenna placement usually matters more than board choice |
| WiFi support | Required for direct MQTT observer firmware |

## Known Direct MQTT Repeater Targets

The [MQTT Firmware](../analyzer/builds/mqtt-firmware.md) guide publishes repeater and room-server builds for WiFi-capable LoRa boards.

| Board | Status | Notes |
|-------|--------|-------|
| Heltec V3 | Field-tested | Good first direct MQTT target |
| Heltec V4 OLED | Build verified | Smoke test before remote install |
| LILYGO T3S3 SX1262 | Build verified | Smoke test before remote install |
| LILYGO T-Beam S3 Supreme SX1262 | Build verified | PSRAM target profile |
| LILYGO T-Beam SX1262 | Build verified | Smoke test before remote install |
| Seeed XIAO ESP32S3 + Wio-SX1262 | Build verified | Compact build target |

!!! note "RAK3112 direct firmware"
    RAK3112 is not part of the direct WiFi MQTT firmware path because that path requires onboard WiFi.

## Placement Tips

- Put the antenna high enough to clear nearby roofs, terrain, and dense trees where possible.
- Keep coax runs short, or use lower-loss feedline for longer runs.
- Keep the radio and power path serviceable after installation.
- Test from the ground before installing on a roof, mast, or remote site.
- Record the node name, IATA code, firmware date, and config commands used.

## Solar-Powered Repeaters

For solar sites, size the battery and panel for the worst expected weather, not the best day of the year. Leave enough margin for cold temperatures, snow cover, and consecutive cloudy days. If the site also acts as an MQTT observer, confirm WiFi or backhaul stability before assuming radio range is the issue.
