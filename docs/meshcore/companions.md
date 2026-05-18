# Recommended Companions

!!! info "This page is a work in progress"
    Content coming soon. Want to help? See [Contributing](../contributing.md).

## What is a Companion Device?

A companion is the device you carry or keep nearby to send and receive MeshCore messages. It still needs the same network settings as the repeaters around it.

## MeshCore Canada Settings

Use these settings before testing range or message delivery:

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |

If your companion app exposes a **Path hash mode**, **Path hash size**, or **Advert path** option, set it to **3-byte**. This is the recommended MeshCore Canada setting for companion radios on repeater-backed networks.

If your companion is configured through a MeshCore CLI that supports the setting, use:

```text
set path.hash.mode 2
```

!!! warning "Common onboarding miss"
    A companion can be flashed successfully and still be off-network if it is left on another regional preset or a 1-byte path setting. Set **USA/Canada (Recommended)** first, then set the path mode to **3-byte**.

## Recommended Devices

<!-- TODO: Table of recommended companion devices with specs, price range, pros/cons -->

| Device | Chipset | Display | Battery | Notes |
|--------|---------|---------|---------|-------|
| <!-- TODO --> | | | | |

## Firmware Flashing

<!-- TODO: Links to firmware and flashing instructions for each device -->
