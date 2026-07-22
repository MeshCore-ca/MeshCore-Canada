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
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: beginner
estimated_time: 10-15 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Choose a companion device

A companion is your personal MeshCore messaging device. Choose whether you want to use a phone or built-in controls, then confirm the exact model in the [official MeshCore flasher](https://meshcore.io/flasher).

<div class="mc-guide-status" data-status="draft" markdown>

**Check before buying.** These are devices to compare, not a guaranteed compatibility list. Confirm the exact model, Canadian radio band, companion firmware target, connector, and included accessories.

</div>

## Choose how you want to use it

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Phone-paired</h3>
    <p>Your phone provides the main interface and connects to the radio over Bluetooth Low Energy (BLE).</p>
    <p><strong>Check:</strong> phone compatibility, battery, antenna, and the exact companion target.</p>
  </section>
  <section class="mc-decision-card">
    <h3>Standalone</h3>
    <p>A display and built-in controls allow normal messaging without a phone.</p>
    <p><strong>Check:</strong> whether current firmware supports the model and all controls you need.</p>
  </section>
  <section class="mc-decision-card">
    <h3>Build your own</h3>
    <p>You choose the board, battery, enclosure, cable, and antenna.</p>
    <p><strong>Check:</strong> board revision, battery polarity and protection, enclosure fit, and every antenna connector.</p>
  </section>
</div>

## Devices to compare

<div class="mc-table-wrap" markdown>

| Device | Style | Check before buying | Manufacturer |
|---|---|---|---|
| ThinkNode M1 | Phone-paired, display | Exact flasher target, 902–928 MHz model, antenna connector, included battery and accessories | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| LilyGO T-Echo | Phone-paired, display | Exact hardware revision, flasher target, radio band, connector, and included antenna | [LilyGO](https://lilygo.cc/products/t-echo-lilygo) |
| SenseCAP T1000-E | Phone-paired, card-style enclosure | Exact flasher target, radio band, internal-antenna limitations, and phone support | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| LilyGO T-LORA Pager | Standalone controls | Exact hardware revision and current support for the display, keyboard, and intended workflow | [LilyGO](https://lilygo.cc/en-ca/products/t-lora-pager) |
| LilyGO T-Deck Plus | Standalone controls | Exact hardware revision and current support for the display, keyboard, trackball, and intended workflow | [LilyGO](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

!!! note "Listings change"
    A product page can default to another radio band, accessory bundle, or connector. Check the selected option before checkout.

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
