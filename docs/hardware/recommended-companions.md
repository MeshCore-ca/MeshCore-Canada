---
title: Compare companion devices
description: Compare phone-paired, standalone, and DIY companion paths with explicit accessories and verification limits.
audience:
  - newcomer
  - companion-owner
task: choose-companion
scope: canada-baseline
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: beginner
estimated_time: 10-15 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Compare Companion Devices

A companion is a personal MeshCore endpoint. Choose between a phone-paired radio, a standalone device, or a DIY build, then confirm the exact board in the current official flasher.

<div class="mc-guide-status" data-status="draft" markdown>

**Draft product inventory.** These are community purchasing leads, not a verified compatibility list. Product revisions, connectors, batteries, included accessories, firmware targets, prices, and stock can change without notice.

</div>

## Choose the interaction style

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Phone-paired</h3>
    <p>Usually the simplest path. Your phone provides the main interface and connects to the radio over Bluetooth Low Energy (BLE).</p>
    <p><strong>Verify:</strong> phone platform, current app support, exact flasher target, battery, and antenna connector.</p>
  </section>
  <section class="mc-decision-card">
    <h3>Standalone</h3>
    <p>Uses built-in controls and a display. It avoids a phone for normal use but may have a more specialized interface and firmware path.</p>
    <p><strong>Verify:</strong> current MeshCore support for the exact model and whether the intended controls work in that build.</p>
  </section>
  <section class="mc-decision-card">
    <h3>DIY phone-paired</h3>
    <p>Lets you choose the board, battery, enclosure, pigtail, and antenna. It also makes you responsible for connector and electrical compatibility.</p>
    <p><strong>Verify:</strong> board revision, polarity, protected battery, enclosure fit, and complete antenna path.</p>
  </section>
</div>

## Phone-paired product leads

<div class="mc-table-wrap" markdown>

| Product lead | Phone needed | Screen / controls recorded in prior notes | Antenna detail to verify | Firmware evidence on this page | Source |
|---|---:|---|---|---|---|
| ThinkNode M1 | Yes | 1.54-inch screen and GPS listed by vendor | Prior notes say RP-SMA; confirm current revision | None attached; confirm exact target in official flasher | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| LilyGO T-Echo | Yes | Display and GPS listed by vendor | Confirm current connector and included antenna | None attached; confirm exact target in official flasher | [LilyGO](https://lilygo.cc/products/t-echo-lilygo) |
| SenseCAP T1000-E | Yes | Card-style enclosure; no general-purpose controls listed here | Internal antenna recorded; confirm limitations with vendor | None attached; confirm exact target in official flasher | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| RAK WisMesh Tag | Yes | GPS and integrated enclosure recorded in prior notes | Integrated antenna recorded; confirm revision | None attached; confirm exact target in official flasher | [AliExpress listing](https://www.aliexpress.com/item/1005009754254701.html) |

</div>

!!! warning "Marketplace bundles can change"
    A product page may default to an accessory, GPS module, different radio band, or different connector. Confirm the exact bundle and model before checkout.

## DIY example from Ottawa notes

This legacy example describes a phone-paired companion. It does not include a verified enclosure or a dated compatibility review.

<div class="mc-table-wrap" markdown>

| Part | Product lead | Detail to verify | Legacy CAD figure | Source |
|---|---|---|---:|---|
| LoRa board | Heltec T114 bundle with screen | Exact board revision and official companion target | $45.99 | [AliExpress](https://www.aliexpress.com/item/1005007916299029.html) |
| Pigtail | Right-angle IPEX to SMA, 8 cm | IPEX generation, SMA gender/polarity, cable orientation | $4.67 | [AliExpress](https://www.aliexpress.com/item/1005009270132403.html) |
| Battery | MakerFocus 3.7 V 3000 mAh LiPo pack | Connector, polarity, protection, dimensions, charge limits | $34.34 | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4?variant=44823607541998) |
| Antenna | Gizont 167 cm 915 MHz SMA lead | Band and exact connector match | $10.68 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |

</div>

<p class="mc-table-note">The legacy page estimated $95.68 CAD before enclosure and some shipping. Its price snapshot date was not recorded. Recalculate from current listings.</p>

For an enclosure lead, the previous guide referenced [Alley Cat's printable models](https://www.printables.com/@AlleyCat/models). Confirm board, battery, pigtail, strain relief, and thermal fit for the exact model you print.

## Standalone product leads

<div class="mc-table-wrap" markdown>

| Product lead | Phone for normal messaging | Interface | What must be confirmed | Source |
|---|---:|---|---|---|
| LilyGO T-LORA Pager | No, if the intended standalone firmware supports the required workflow | Built-in display and controls | Exact revision, official target, role, and control support | [LilyGO](https://lilygo.cc/en-ca/products/t-lora-pager) |
| LilyGO T-Deck Plus | No, if the intended standalone firmware supports the required workflow | Display, keyboard, and trackball | Exact revision, official target, role, and current interface limitations | [LilyGO](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

## Before buying

<ul class="mc-checklist">
  <li>The exact product revision appears in the current official MeshCore flasher for the companion role.</li>
  <li>The radio is the Canadian 902–928 MHz variant.</li>
  <li>The phone/app requirement matches how you intend to use it.</li>
  <li>The battery connector, polarity, protection, dimensions, and charging method are documented.</li>
  <li>The antenna and every adapter match the device connector.</li>
  <li>The enclosure leaves the USB recovery path accessible.</li>
  <li>You checked current price, stock, shipping, duty, and return terms.</li>
</ul>

## Verify the completed setup

After flashing, confirm the app or standalone interface reconnects, the intended role and radio settings survive a reboot, and a local message test succeeds. A product listing alone is not proof of firmware support.

## Human review required

A hardware maintainer must attach dated manufacturer sources, firmware compatibility, connector checks, and a link-health review before any product on this page can carry a verified recommendation label.

## Next step

Once the exact board is confirmed, [flash a companion safely](../meshcore/flash-companion.md). If you meant to improve coverage for others, [compare repeater paths](recommended-repeaters.md) instead.
