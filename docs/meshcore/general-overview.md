# MeshCore Overview

!!! important "MeshCore project split, use the official links"
    Due to recent events in the MeshCore development team, the project has split. To stay on the official track, please only use:

    - **Flashing tool and blog:** [meshcore.io](https://meshcore.io/)
    - **Source code:** [github.com/meshcore-dev/MeshCore](https://github.com/meshcore-dev/MeshCore)
    - **Discord (named "MeshCore.io"):** [discord.com/invite/fUfWevRXAg](https://discord.com/invite/fUfWevRXAg)

    Read more about the split: [The Split, blog.meshcore.io](https://blog.meshcore.io/2026/04/23/the-split).

MeshCore is a **repeater-driven long-range mesh network** built on top of LoRa radios. This section of the wiki explains the basics of how MeshCore works in the Ottawa region, how the different device roles fit together, and walks through the most common tasks you will perform as a new user.

If you are brand new to MeshCore, start here and work your way through the pages below in order.

---

## What's in This Section

### [MeshCore Roles](general-meshcore-roles.md)
Explains the three device roles (**Companion Nodes**, **Repeaters**, and **Room Servers**), what each one does, and how they interact on the mesh. A single piece of hardware can play any of these roles depending on the firmware you flash, so understanding this section helps you pick the right firmware for your device.

### [MeshCore FAQ](general-faq.md)
Covers the most common questions about how MeshCore behaves on the Ottawa network, including:

- How adverts work and the Ottawa advert schedule
- Routing behaviour and repeater neighbours
- The public channel and how "Heard Repeats" is displayed in the app

### [MeshCore How-To](general-howto.md)
Step-by-step walkthroughs for day-to-day tasks in the MeshCore mobile app, such as sharing your contact URL, importing contacts, and tracing routes. Each guide is visual and suitable for both new and experienced users.

### [Repeater Configurator](../config/index.md)
An interactive tool that finds the right Canadian region for a repeater and produces the exact commands to configure it — radio settings, region path, and verification steps. Also includes the [region map](../config/map.md) and the [region standard](../config/standard.md).

### Firmware Guides
Everything you need to get firmware onto a device:

- [Flashing a Companion](flash-companion.md)
- [Flashing a Repeater](flash-repeater.md)
- [Updating a Repeater (OTA)](update-repeater-ota.md)
- [Generating a Repeater ID](generate-repeater-id.md)
- [Flashing a Room Server](flash-room-server.md)
- [RAK4631 Custom Display Firmware](firmware-rak-custom-display.md)
- [Heltec V3 Wi-Fi Firmware](firmware-heltec-v3-wifi.md)

---

## New to MeshCore?

If you are just getting started, we recommend this path:

1. Read **[MeshCore Roles](general-meshcore-roles.md)** to understand what a companion node, repeater, and room server each do.
2. Pick a **[Recommended Companion](../hardware/recommended-companions.md)** and flash it using the **[Flashing a Companion](flash-companion.md)** guide.
3. Skim the **[MeshCore FAQ](general-faq.md)** so you know what to expect from the network.
4. Use the **[MeshCore How-To](general-howto.md)** walkthroughs to share contacts and start messaging.

When you are ready to contribute to the network backbone, move on to **[Flashing a Repeater](flash-repeater.md)** and the **[Hardware](../hardware/recommended-repeaters.md)** section.
