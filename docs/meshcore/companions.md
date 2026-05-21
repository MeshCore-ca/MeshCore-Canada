# Recommended Companions

A companion is the device you carry or keep nearby to send and receive MeshCore messages. It pairs with a phone, tablet, desktop app, web app, or serial client depending on the firmware and hardware.

## MeshCore Canada Settings

Use these settings before testing range or message delivery:

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |

If your companion app exposes a **Path hash mode**, **Path hash size**, or **Advert path** option, set it to **3-byte**.

If your companion is configured through a MeshCore CLI that supports the setting, use:

```text
set path.hash.mode 2
```

!!! warning "Common onboarding miss"
    A companion can be flashed successfully and still be off-network if it is left on another regional preset or a 1-byte path setting. Set **USA/Canada (Recommended)** first, then set the path mode to **3-byte**.

## Choosing a Companion

| Priority | What to look for |
|----------|------------------|
| Official support | The board appears in the MeshCore Flasher or official MeshCore hardware list |
| Radio match | LoRa radio variant supports the Canadian band used by your community |
| Usability | BLE, USB, or WiFi connection method works with the app you plan to use |
| Power | Battery capacity and charging are appropriate for portable use |
| Recovery | You can access USB serial or boot mode if a flash or config change goes wrong |

Avoid buying hardware only because it works with another LoRa mesh project. Confirm MeshCore support first.

## Good First-Device Patterns

| Pattern | Best for | Notes |
|---------|----------|-------|
| Ready-made companion node | New users | Least assembly, easiest support path |
| ESP32 LoRa board with display | Tinkerers | Useful for serial recovery and status, but check exact board revision |
| Small battery-powered node | Portable use | Prioritize antenna quality and app support over tiny size |
| Spare repeater-capable board | Testing | Can be reflashed later as a repeater or observer if WiFi is supported |

## First Setup Checklist

1. Flash a MeshCore companion firmware supported by your board.
2. Pair or connect from your chosen MeshCore app.
3. Set the radio preset to **USA/Canada (Recommended)**.
4. Set path hash mode to **3-byte**.
5. Reboot after changing radio parameters.
6. Send an advert.
7. Ask a nearby community member to confirm they can see you.

## When a Companion Should Not Be the Observer

A companion can report packets through some host-side tools, but a fixed observer is usually better when you want reliable live telemetry. If your goal is to feed CoreScope continuously, use the [Analyzer & MQTT](../analyzer/intro.md) observer guides.
