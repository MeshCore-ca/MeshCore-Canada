---
title: Choose a companion device
description: Compare phone-paired and standalone companion devices and check compatibility before buying.
audience:
  - newcomer
  - companion-owner
task: choose-companion
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-09-03
review_by: 2027-03-02
difficulty: beginner
estimated_time: 10-15 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Choose a companion device

Companion nodes run dedicated companion firmware and operate as user endpoints on the MeshCore network. Most companion nodes pair with your smartphone over Bluetooth Low Energy (BLE) to provide access to the mesh.

There are also standalone companion nodes with built-in screens and input devices. These operate without a smartphone but still function as endpoints.

<div class="mc-guide-status" data-status="draft" markdown>

**Check before buying.** These devices have been tried and tested by the Ottawa community and other meshes, but product revisions and firmware support change. Confirm the exact model, Canadian radio band, companion firmware target, connector, and included accessories in the [official MeshCore flasher](https://flasher.meshcore.io/) and in current manufacturer information.

</div>

!!! warning "Only replace removable antennas"
    Companions with removable antennas may benefit from one of the tested upgrades below. Do not open or modify a sealed, internal-antenna device such as the T1000-E or WisMesh Tag.

    See: [Recommended antennas](recommended-antenna.md)

## Bluetooth Low Energy (BLE) companions

These devices require a smartphone and the MeshCore app. They connect to your phone over BLE, and you use the app to interact with the mesh. In this setup, the companion acts only as the radio, linking your phone to the mesh network.

### Pre-built

The easiest way to get started is to buy a companion node, flash it with MeshCore, and join the mesh. The MeshCore app connects to the node over BLE and is used to send and receive messages on the mesh.

!!! warning "Important ThinkNode M1 note"
    Make sure to order an **RP-SMA antenna** with the device.

    **Do not accidentally buy SMA. You specifically need RP-SMA.**

    ThinkNode uses RP-SMA on the ThinkNode M1.

!!! warning "AliExpress bundles"
    AliExpress usually shows the cheapest item (for example, only the GPS module) when opening a link. Make sure you select the right bundle when adding to your cart.

The following pre-built companion nodes are popular and widely available:

<div class="mc-table-wrap" markdown>

| Product | Notes | Link |
|---|---|---|
| **ThinkNode M1** | Compact device powered by the nRF52840 with a 1.54" screen and GPS support. Designed as a ready-to-use companion node for reliable messaging and tracking. **Note:** Has an RP-SMA connector. See the SMA vs. RP-SMA warning above. | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| **LilyGO T-Echo** | Compact device with onboard display and GPS. Choose the 915 MHz version for Canada, then flash the current MeshCore companion firmware. | [LilyGO Store](https://lilygo.cc/products/t-echo-lilygo) |
| **SenseCAP T1000-E** | Slim card-style tracker device from Seeed Studio. Portable and IP65-rated. **Note:** Range is more limited due to internal antennas. | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| **RAK WisMesh Tag** | Rugged device with GPS, integrated antennas, 1000 mAh battery, and IP66 enclosure. It ships with Meshtastic, so flash the current MeshCore companion firmware before use. **Note:** Range is more limited due to internal antennas. | [RAKwireless](https://store.rakwireless.com/products/wismesh-tag-meshtastic-gps-lora-tracker-ip66) |

</div>

### Build your own

For hobbyists who like to source parts and assemble their own node, here is an Ottawa-friendly example build. See [Recommended antennas](recommended-antenna.md) for other antenna options.

This is a **companion node** role and requires a smartphone. The MeshCore app connects to the node over BLE and is used to send and receive messages on the mesh.

#### Example DIY build

<div class="mc-table-wrap" markdown>

| Item | Product name | Cost (CAD) | Link |
|---|---|---|---|
| **LoRa board** | Heltec T114 (bundle with screen) | $45.99 | [AliExpress](https://www.aliexpress.com/item/1005007916299029.html) |
| **Right-angle IPEX to SMA pigtail cable** | SMA-KW 2PCS 8cm | $4.67 | [AliExpress](https://www.aliexpress.com/item/1005009270132403.html) |
| **Battery** | MakerFocus 3.7V 3000mAh LiPo (pack of 4), Micro JST 1.5 connection with protection board | $34.34 | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4?variant=44823607541998) |
| **Antenna** | Gizont 915 MHz SMA M | $10.68 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) (make sure you select the right antenna when opening the link) |

</div>

*Example shopping total:* **$95.68 CAD**, including a four-battery pack and two pigtails. This is not the per-device cost.

*Prices are dated September 2, 2026. Check the linked pages for current prices, shipping, duties, and availability.*

!!! warning "Case for the example DIY build"
    This DIY build example does not include a case. For 3D-printable cases, check out **[Alley Cat's models](https://www.printables.com/@AlleyCat/models)**. They are excellent for custom companion node builds. Make sure the case you choose will fit the 3000 mAh battery and the right-angle IPEX to SMA connector.

If you are in the Ottawa area, you can also purchase this build fully assembled locally from [Space Hedgehog](https://space-hedgehog.com/).

## Standalone nodes

There are standalone devices such as the **T-Deck**, but we recommend starting with a phone-paired companion node instead. Standalone units tend to be more expensive, the UI is not as smooth as the mobile app, and they still have quirks and firmware limitations that can make them challenging for beginners.

### Available standalone devices

<div class="mc-table-wrap" markdown>

| Product | Notes | Link |
|---|---|---|
| **LilyGO T-LORA Pager** | A compact standalone LoRa messaging device styled like a classic pager. Useful for simple off-grid communication without needing a smartphone. | [LilyGO Store](https://lilygo.cc/en-ca/products/t-lora-pager) |
| **LilyGO T-Deck Plus** | Standalone device supported by MeshCore's Ripple firmware. The trackball can be awkward, so consider the controls before choosing it. | [LilyGO Store](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

## Before buying

<ul class="mc-checklist">
  <li>The exact product revision appears in the current official MeshCore flasher as a companion.</li>
  <li>The radio is the Canadian 902–928 MHz variant.</li>
  <li>The phone/app requirement matches how you intend to use it.</li>
  <li>The battery connector, polarity, protection, dimensions, and charging method are documented.</li>
  <li>The antenna and every adapter match the device connector.</li>
  <li>The enclosure leaves the USB recovery path accessible.</li>
  <li>You checked current stock, shipping, duty, and return terms.</li>
</ul>

## Continue setup

Once the exact board is confirmed, [flash and configure the companion](../meshcore/flash-companion.md). After flashing, reboot it and complete a local message test.
