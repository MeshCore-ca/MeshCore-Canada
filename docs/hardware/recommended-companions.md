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

A companion is the radio that pairs with the MeshCore app on your phone. These
are the ones Canadian communities use. Before buying, check that the
[MeshCore flasher](https://meshcore.io/flasher) lists the exact model, and that
it's the 915 MHz version.

## Ready to use

<div class="mc-table-wrap" markdown>

| Product | Notes | Link |
|---|---|---|
| **ThinkNode M1** | Compact device powered by the nRF52840 with a 1.54" screen and GPS support. Designed as a ready-to-use companion node for reliable messaging and tracking. **Order an RP-SMA antenna** with it: SMA won't fit. | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| **LilyGO T-Echo** | Compact device with onboard display and GPS. Choose the 915 MHz version for Canada, then flash the current MeshCore companion firmware. | [LilyGO Store](https://lilygo.cc/products/t-echo-lilygo) |
| **SenseCAP T1000-E** | Slim card-style tracker device from Seeed Studio. Portable and IP65-rated. **Internal antenna:** shorter range, and don't open it to swap the antenna. | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| **RAK WisMesh Tag** | Rugged device with GPS, integrated antennas, 1000 mAh battery, and IP66 enclosure. It ships with Meshtastic, so flash the current MeshCore companion firmware before use. **Internal antenna:** shorter range. | [RAKwireless](https://store.rakwireless.com/products/wismesh-tag-meshtastic-gps-lora-tracker-ip66) |

</div>

AliExpress links often open on the cheapest option, so check you've picked the
right bundle. Want a better antenna for a model with a removable one? See
[Antennas](recommended-antenna.md).

## Build your own

An example build for people who like to assemble their own. It pairs with your
phone like the ones above.

<div class="mc-table-wrap" markdown>

| Item | Product name | Cost (CAD) | Link |
|---|---|---|---|
| **LoRa board** | Heltec T114 (bundle with screen) | $45.99 | [AliExpress](https://www.aliexpress.com/item/1005007916299029.html) |
| **Right-angle IPEX to SMA pigtail cable** | SMA-KW 2PCS 8cm | $4.67 | [AliExpress](https://www.aliexpress.com/item/1005009270132403.html) |
| **Battery** | MakerFocus 3.7V 3000mAh LiPo (pack of 4), Micro JST 1.5 connection with protection board | $34.34 | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4?variant=44823607541998) |
| **Antenna** | Gizont 915 MHz SMA M | $10.68 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) (make sure you select the right antenna when opening the link) |

</div>

*Example shopping total:* **$95.68 CAD**, including a four-battery pack and two
pigtails, so it's not the per-device cost. *Prices are dated September 2, 2026;
check the linked pages for current prices, shipping and duties.*

The kit doesn't include a case. [Alley Cat's models](https://www.printables.com/@AlleyCat/models)
are good 3D-printable options; pick one that fits the 3000 mAh battery and the
right-angle connector.

This build is also sold assembled by [Space Hedgehog](https://space-hedgehog.com/).

## Standalone devices

Standalone devices have their own screen and keyboard and work without a phone.
We recommend starting with a phone-paired companion instead: standalone units
cost more, and their firmware still has rough edges.

<div class="mc-table-wrap" markdown>

| Product | Notes | Link |
|---|---|---|
| **LilyGO T-LORA Pager** | A compact standalone LoRa messaging device styled like a classic pager. Useful for simple off-grid communication without needing a smartphone. | [LilyGO Store](https://lilygo.cc/en-ca/products/t-lora-pager) |
| **LilyGO T-Deck Plus** | Standalone device supported by MeshCore's Ripple firmware. The trackball can be awkward, so consider the controls before choosing it. | [LilyGO Store](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

**Next:** [Set up a companion](../start/companion.md).
