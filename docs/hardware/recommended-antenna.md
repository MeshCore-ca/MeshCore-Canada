---
title: Compare antennas and feed lines
description: Shortlist 915 MHz antennas and cables while checking connector fit, evidence, site needs, and dated pricing.
audience:
  - companion-owner
  - repeater-builder
task: choose-antenna
scope: ottawa-field-practice
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 10-15 minutes
destructive: false
requires:
  - confirmed-radio-band
  - confirmed-device-connector
page_styles:
  - assets/styles/devices-builds.css
---

# Compare Antennas and Feed Lines

Build a shortlist, then verify the radio band, connector, dimensions, mounting method, and current manufacturer specifications before ordering.

<div class="mc-guide-status" data-status="draft" markdown>

**Draft Ottawa field notes.** The products and legacy prices below were carried forward from community notes. No controlled comparison, link-health review, or product-revision audit was attached. Treat them as leads, not verified MeshCore Canada recommendations.

</div>

!!! danger "Disconnect power before changing an antenna"
    Do not power or transmit from a radio without the correct antenna attached. Disconnect USB and battery power before connecting or removing an antenna, and follow the radio manufacturer's instructions.

## Check compatibility first

<ul class="mc-checklist">
  <li>The antenna is specified for the Canadian 902–928 MHz band.</li>
  <li>The connector family and polarity match: SMA and RP-SMA can look similar but do not mate electrically in the same way.</li>
  <li>The connector gender, pigtail, and feed line form one complete path.</li>
  <li>The device and mount can support the antenna's size, weight, wind load, and cable strain.</li>
  <li>Outdoor connectors can be weatherproofed and inspected without trapping water.</li>
  <li>The current product page and datasheet support the details used in your decision.</li>
</ul>

## Companion antenna leads

These portable antenna leads use SMA-family connectors. Confirm the exact connector on your device before ordering.

<div class="mc-table-wrap" markdown>

| Product lead | Connector recorded in prior notes | Evidence available here | Legacy CAD figure | Source |
|---|---|---|---:|---|
| Gizont 167 cm 915 MHz | SMA male | Ottawa community field note; no test record attached | $10.53–$12 | [Space Hedgehog](https://space-hedgehog.com/products/gizont-915mhz-antenna?variant=51602989711416) / [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |
| Gizont 167 cm 915 MHz | RP-SMA male | Ottawa community field note; no test record attached | $10.53 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |
| LINX ANT-916-CW-HW-SMA | SMA | Product lead only | $14.65 | [DigiKey](https://www.digikey.ca/en/products/detail/te-connectivity-linx/ANT-916-CW-HW-SMA/2694126?s=N4IgTCBcDaIDIEkByANABAQSQFQLQE4BGANlwGEB1XACSoGUBZDEAXQF8g) |
| Taoglas TI.09.A.0111 | SMA | Product lead only | $17.47 | [DigiKey](https://www.digikey.ca/en/products/detail/taoglas-limited/TI-09-A-0111/2332695?s=N4IgTCBcDaICoEMD2BzANggzgAjgSQDoAGATgIEFiBGGkAXQF8g) |
| Seeed Studio LoRa Antenna Kit | SMA | Product lead only | $6.79 | [Seeed Studio](https://www.seeedstudio.com/LoRa-Antenna-Kit-for-reTerminal-DM-p-5714.html) |

</div>

## Fixed repeater antenna leads

A permanent repeater antenna is a complete installation decision, not just a gain number. Include feed-line loss, connector count, pattern, local RF conditions, structure, lightning/grounding review, weather, and safe access.

<div class="mc-table-wrap" markdown>

| Product lead | Type recorded in prior notes | Connector | Evidence available here | Legacy CAD figure | Source |
|---|---|---|---|---:|---|
| Alfa AOA-915-5ACM | Omnidirectional | N-type | Ottawa community field note; no controlled result attached | $34.99 | [Amazon Canada](https://www.amazon.ca/dp/B08H8J6ZV6) |
| Seeed Studio 318020693 | 902–928 MHz fiberglass omni, 1300 mm | N-type | Product lead and Ottawa field note | $110 | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |
| L-com HG913Y-NF | Directional | N-type | Product lead only | $237.17 | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

<p class="mc-table-note">Price snapshot date was not recorded in the legacy page. Recheck every figure, shipping cost, duty, connector, and revision at the linked source.</p>

## Feed-line lead

The previous guide pointed to [Infinite Cables](https://www.infinitecables.com/) in Toronto for short LMR-240 Ultra Flex assemblies. The linked example was an [N-type male to N-type female cable](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465). Confirm both end connectors, length, loss, weather rating, and bend/strain requirements for your installation.

## Record the decision

Before installation, record:

- antenna product and revision;
- published band and pattern;
- every connector and adapter in order;
- cable type and length;
- mounting and weatherproofing method;
- source links and the date checked; and
- the local test you will use after installation.

## Verify after installation

With the enclosure still accessible, confirm the radio reports its expected settings, the feed line is not loose or sharply bent, the weather seal does not create a water path, and a local message test succeeds. Do not attribute a change in coverage to the antenna alone without repeatable before/after evidence.

## Human review required

A hardware/RF reviewer must attach dated datasheets, connector verification, link checks, and repeatable evidence before any product on this page can carry a verified recommendation label.

## Next step

For a fixed installation, continue to [mounting options](repeater-mounting-options.md). For a portable node, return to [companion choices](recommended-companions.md).
