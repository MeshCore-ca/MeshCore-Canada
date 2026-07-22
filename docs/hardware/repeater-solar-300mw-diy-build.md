---
title: 300 mW solar repeater build
description: Review and bench-test a draft RAK-based solar repeater build before deployment.
audience:
  - repeater-builder
  - hardware-reviewer
task: build-300mw-solar-repeater
scope: community-build
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: one day plus sealant cure time
destructive: false
requires:
  - multimeter
  - safe-work-area
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# 300 mW Solar Repeater Build

<div class="mc-guide-status" data-status="draft" markdown>

**Draft.** Verify the exact parts, electrical limits, connector polarity,
firmware target, and weatherproofing before powering or deploying this build.

</div>

<dl class="mc-guide-facts">
  <div><dt>Radio</dt><dd>RAK19003 / RAK4631 Type 6</dd></div>
  <div><dt>Firmware</dt><dd>Confirm the current repeater target</dd></div>
  <div><dt>Weather rating</dt><dd>Verify after every enclosure modification</dd></div>
  <div><dt>Maintenance</dt><dd>Set an inspection schedule for the site</dd></div>
</dl>

## Before you start

This build cuts an enclosure, assembles an RF path, and connects a lithium battery to a solar charging system. It also creates equipment intended for an exposed, elevated installation.

!!! danger "Stop until the complete system is reviewed"
    Verify the exact battery chemistry, protection, charger limits, connector polarity, wire ratings, solar input, enclosure, vent, antenna path, and weatherproofing in manufacturer documentation. Use a qualified person for electrical or structural details outside your competence.

<ul class="mc-checklist">
  <li>Every part and hardware revision matches a dated source.</li>
  <li>The radio board appears in the current official MeshCore flasher for the repeater role.</li>
  <li>The antenna is for the Canadian 902–928 MHz band and its complete connector path is confirmed.</li>
  <li>The battery and solar power path have documented protection and compatible limits.</li>
  <li>You have a multimeter, eye protection, suitable drilling/cutting tools, and a safe work area.</li>
  <li>You have a USB recovery cable and will keep the unit on the bench until its checks pass.</li>
</ul>

## What this build changes

The procedure drills enclosure openings, installs an external antenna connector and vent, connects the radio and antenna, adds battery protection in the power path, and seals the enclosure. These changes can be difficult to undo without replacing parts.

## Bill of materials

<div class="mc-table-wrap" markdown>

| System part | Example | Qty | What to verify | Source |
|---|---|---:|---|---|
| Enclosure | WisMesh Unify Enclosure 910422 | 1 | Revision, panel and charger limits, seals, venting, included hardware | [AliExpress](https://aliexpress.com/item/1005008369061766.html) |
| LoRa board | RAK19003 / RAK4631, Type 6 | 1 | Exact board, Canadian band, firmware target, connectors | [AliExpress](https://aliexpress.com/item/1005008285698839.html) |
| Antenna | Alfa AOA-915-5ACM | 1 | Band, connector, mount, weather exposure | [Amazon Canada](https://www.amazon.ca/dp/B08H8J6ZV6) |
| Antenna pigtail | N female to IPEX | 1 | IPEX generation, connector gender and polarity, length, loss | [AliExpress](https://aliexpress.com/item/1005001920963497.html) |
| Battery option | MakerFocus 3000 mAh Li-ion pack | 1 | Chemistry, dimensions, connector, polarity, protection, charger limits | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4) |
| Battery option | 3000 mAh Li-ion pack | 1 | The same checks, plus Canadian shipping restrictions | [Amazon US](https://www.amazon.com/3000mAh-Rechargable-Protection-Insulated-Development/dp/B08T6GT7DV) |
| Battery option | Space Hedgehog 3000 mAh battery | 1 | The same checks, plus current stock and revision | [Space Hedgehog](https://space-hedgehog.com/products/3000mah-battery) |
| Battery protection | Li-ion PCM | 1 | Whether it is required and compatible; current, voltage, temperature, and wiring limits | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off?variant=51646910660664) |
| Vent | M12×1.5 waterproof vent plug | 1 | Thread, seal, airflow, enclosure compatibility | [AliExpress](https://aliexpress.com/item/1005006370919409.html) |

</div>

<p class="mc-table-note">These are parts to investigate, not verified recommendations. Check current specifications, stock, shipping, and total cost before buying.</p>

## Tools and consumables

- multimeter and manufacturer documentation for each electrical component;
- eye protection and suitable drilling/cutting tools;
- step drill bit sized by test-fitting the actual bulkhead and vent;
- wire tools and insulation/heat-shrink appropriate to the selected parts;
- self-fusing silicone tape or another reviewed outdoor connector-sealing method;
- outdoor sealant compatible with the enclosure materials; and
- known-good data USB cable for flashing and recovery.

## Assembly stages

<div class="mc-stage-list">
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 1 — Inspect before modifying</h3>
    <p>Confirm every part number and revision. Inspect the enclosure seals and hardware. Identify the enclosure top, antenna location, vent location, cable clearances, and service access before drilling.</p>
    <p><strong>Checkpoint:</strong> stop if any connector, polarity, protection, charger limit, or enclosure detail is uncertain.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Stage 2 — Prepare the enclosure and RF path</h3>
    <ol>
      <li>Mount the RAK backplate with the supplied hardware.</li>
      <li>Mark separate openings for the N-type bulkhead and vent. Drill slowly with suitable protection, deburr the holes, and test-fit after each step.</li>
      <li>Install the bulkhead and vent using the reviewed seals and orientation.</li>
      <li>With all power disconnected, attach the radio-side pigtail to the correct LoRa connector.</li>
      <li>Install the Bluetooth antenna described by the exact board documentation.</li>
      <li>Attach the external LoRa antenna before any power or transmit test.</li>
    </ol>
    <p><strong>Checkpoint:</strong> the RF path is mechanically secure, unforced, correctly mated, and attached before power.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Stage 3 — Flash and dry-fit</h3>
    <ol>
      <li>Keep the unit open and accessible.</li>
      <li>Follow the <a href="../../meshcore/flash-repeater/">safe repeater flashing guide</a> for the exact board.</li>
      <li>Mount the radio on the backplate and confirm that cables are not pinched or sharply bent.</li>
    </ol>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_MountedAll.jpeg" alt="RAK board and antenna cables dry-fitted on the enclosure backplate" loading="lazy">
      <figcaption>Example dry fit. Check the exact board and cable routing in hand.</figcaption>
    </figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 4 — Verify and connect the power path</h3>
    <ol>
      <li>With power disconnected, identify the battery, charger, and any protection-board terminals from their current manufacturer documentation.</li>
      <li>Verify both JST cable polarities with a multimeter; do not rely on wire colour alone.</li>
      <li>Connect the charger side and battery side only according to the reviewed diagram for the exact protection device.</li>
      <li>Insulate and mechanically secure the protection board and battery without crushing, heating, puncturing, or trapping them against sharp edges.</li>
    </ol>
    <figure>
      <img class="mc-build-photo" src="../images/RAK19003-Layout.png" alt="RAK19003 connector layout used as a visual orientation note" loading="lazy">
      <figcaption>Orientation only. Follow the documentation for your exact board.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/VoltaicEnclosures_Layout.png" alt="Example protection-board connection layout" loading="lazy">
      <figcaption>Concept only. Do not infer terminal labels or limits for another protection board.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/RAK19003-LayoutSolar.jpg" alt="Solar enclosure layout showing battery and protection wiring" loading="lazy">
      <figcaption>Confirm polarity and every electrical limit before reproducing the path.</figcaption>
    </figure>
  </section>
  <section class="mc-build-stage">
    <h3>Stage 5 — Seal only after bench verification</h3>
    <ol>
      <li>Fit the enclosure gasket without twisting or pinching it.</li>
      <li>Connect the enclosure solar lead only after its polarity and limits are confirmed.</li>
      <li>Close the enclosure evenly with the specified hardware and torque/process from its documentation.</li>
      <li>Apply the reviewed outdoor weather-sealing method to the exposed antenna connection without blocking drainage or venting.</li>
    </ol>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_Finished.jpeg" alt="Completed RAK Unify repeater interior before the enclosure is closed" loading="lazy">
      <figcaption>Example interior. Part revisions and routing may differ.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_SelfFuseTape.jpeg" alt="Self-fusing tape around an outdoor antenna connector" loading="lazy">
      <figcaption>One community weather-sealing example, not a universal installation method.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_Heatshrink.jpg" alt="Heat-shrink around an outdoor antenna connection" loading="lazy">
      <figcaption>Confirm that the chosen method is compatible, inspectable, and does not trap water.</figcaption>
    </figure>
  </section>
</div>

## Check the readings

No numeric electrical acceptance range has been peer-reviewed for this page. Use the current manufacturer limits for the exact battery, charger, protection device, radio board, and panel.

<div class="mc-table-wrap" markdown>

| Check | Acceptable result | Stop condition |
|---|---|---|
| Power disconnected continuity | No unintended short across the documented supply path | Unexpected continuity, unstable reading, or uncertain meter setup |
| Polarity | Every connector matches its documented polarity before mating | Wire colour and measured/documented polarity disagree |
| Battery and solar input | Measured values remain within every component's published limits | Any value is outside a limit or the limit is unknown |
| First power | No heat, odour, swelling, smoke, noise, or unstable restart | Any abnormal physical or electrical behaviour |
| Radio current/operation | Behaviour is consistent with the reviewed board and role documentation | Current draw or behaviour cannot be explained from evidence |

</div>

## Test it on the bench

<ul class="mc-checklist">
  <li>Photograph and record the exact parts, revisions, wiring, polarity checks, and measured values.</li>
  <li>Power from a supervised, current-limited bench source where appropriate for the reviewed hardware.</li>
  <li>Confirm the repeater boots, reconnects, and retains firmware, identity, radio, region, advert, and access settings after reboot.</li>
  <li>Confirm a nearby companion receives an advert and the planned local routing test succeeds.</li>
  <li>Exercise the intended solar/charge path under supervised conditions supported by the component documentation.</li>
  <li>Inspect seals and cable strain before and after a controlled water-resistance check appropriate to the enclosure documentation.</li>
  <li>Keep USB recovery practical and record the recovery procedure.</li>
</ul>

Do not mount the build until all checks pass and a hardware reviewer approves the site record.

## Recovery and undo

If a check fails, disconnect solar, USB, and battery power using the documented safe sequence. Move the unit to a non-combustible supervised work area, inspect for heat or battery damage, and do not reconnect a questionable lithium battery. Restore the last known-good board configuration by USB only after the electrical fault is resolved.

Mechanical holes and adhesive/sealant work may not be reversible; replace damaged or uncertain enclosure and power parts rather than improvising a repair.

## Maintenance

No Canada-wide interval is approved. Before deployment, record a site-specific inspection schedule covering mount movement, water entry, seals, corrosion, cable strain, battery condition, charging behaviour, measured values, firmware/configuration, radio verification, and physical recovery.

## Source

Based on community build notes contributed by MrAlders0n in 2026. The parts and
instructions still require hardware review.

After the bench test, complete the [mounting plan](repeater-mounting-options.md)
and set the repeater's region with the [configurator](../config/index.md).
