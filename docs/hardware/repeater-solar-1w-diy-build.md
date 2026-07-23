---
title: Experimental 1 W solar repeater
description: Evaluate an unverified high-power solar repeater design before deciding whether to reproduce it.
audience:
  - advanced-repeater-builder
  - hardware-reviewer
task: review-1w-solar-repeater-build
scope: experimental
status: experimental
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: multiple days including fabrication and cure time
destructive: false
requires:
  - multimeter
  - soldering-experience
  - fabrication-experience
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Experimental 1 W Solar Repeater

This unverified design combines an Ikoka Stick 0.4.0, a solar power manager,
a filtered RF path, and a fabricated enclosure.

<div class="mc-guide-status" data-status="experimental" markdown>

**Do not build or deploy this design without electrical, RF, and site review.**
Its firmware target, electrical design, optional telemetry, measurements, and
climate limits have not been reproduced.

</div>

<dl class="mc-guide-facts">
  <div><dt>Radio</dt><dd>GOME Ikoka Stick 0.4.0</dd></div>
  <div><dt>Power</dt><dd>Waveshare Solar Power Manager</dd></div>
  <div><dt>Firmware</dt><dd>Not pinned or reproduced</dd></div>
  <div><dt>Maintenance</dt><dd>Set during the site review</dd></div>
</dl>

## Is this build appropriate?

This is a specialized backbone or long-range experiment, not a default
upgrade. Coordinate with nearby communities and show that the site needs it
before changing coverage or traffic patterns.

Use the [300 mW draft build](repeater-solar-300mw-diy-build.md) or a reviewed pre-built path unless a network operator and hardware/RF reviewer agree that this experiment addresses a measured need.

## Before you start

!!! danger "This combines high-power RF, lithium batteries, charging, soldering, cutting, and an outdoor elevated installation"
    Verify every component and limit from current manufacturer documentation. Keep an antenna and reviewed RF path attached before any transmit test. Do not energize a battery or charger path when polarity, protection, wiring, temperature, or expected readings are unknown.

<ul class="mc-checklist">
  <li>The local network need and cross-region effects are documented.</li>
  <li>The exact Ikoka hardware and repeater firmware target are confirmed and recoverable by USB.</li>
  <li>A hardware/electrical reviewer approves the battery, charger, panel, wiring, protection, optional telemetry, and enclosure thermal plan.</li>
  <li>An RF reviewer approves the radio, filter, feed line, antenna, connectors, and site.</li>
  <li>A structural/site review covers the finished mass, panel area, mount, wind, ice, snow, cable route, and access.</li>
  <li>The build will remain supervised on the bench until its test record is approved.</li>
</ul>

## What this build changes

The procedure cuts and drills an enclosure, bonds a solar panel with epoxy and sealant, modifies the mounting system, connects a high-power RF path and filter, assembles a lithium power system, and may remove display pins for optional telemetry. Several changes are difficult or impossible to undo without replacing parts.

## Bill of materials to verify

<div class="mc-table-wrap" markdown>

| # | Part | Qty | Detail to verify | Source |
|---:|---|---:|---|---|
| 1 | GOME Ikoka Stick 0.4.0 | 1 | Hardware revision, Canadian band, RF output, firmware target, recovery | [Project page](https://github.com/ndoo/ikoka-stick-meshtastic-device) |
| 2 | Waveshare Solar Power Manager | 1 | Exact model, panel, battery and output limits, startup behaviour, temperature | [Waveshare](https://www.waveshare.com/wiki/Solar_Power_Manager) |
| 3 | IP65 junction box, 220×170×110 mm | 1 | Material, ingress rating after modification, temperature, vent | [AliExpress](https://www.aliexpress.com/item/1005007587120013.html) |
| 4 | 10 W / 18 V panel, 250×340 mm | 1 | Electrical limits, dimensions, mass, weather and load suitability | [Amazon](https://a.co/d/0eJo5GCr) |
| 5 | 3P1S or 4P1S 18650 pack | 1 | Chemistry, matched cells, protection, construction, charger, temperature | [MP&W Supply](https://mpandw.ca/) |
| 6 | Battery protection board | 1 | Thresholds, current, temperature, wiring, compatibility | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off) |
| 7 | 890–960 MHz four-cavity band-pass filter, 50 W | 1 | Response at 902–928 MHz, insertion loss, connectors, weather, temperature | [Alibaba](https://www.alibaba.com/product-detail/50W-890-960MHz-4-Cavity-Filter_1601399651944.html) |
| 8 | 10–15 cm SMA right-angle to N-type female bulkhead cable | 1 | Connector gender and polarity, loss, bend, seal | [AliExpress](https://www.aliexpress.com/item/1005008569444661.html) |
| 9 | 7.5 cm SMA male right-angle cable | 1 | Connector match, loss, bend, power handling | [AliExpress](https://www.aliexpress.com/item/1005006702037541.html) |
| 10 | 0.5 ft USB-A to USB-C right-angle cable | 1 | Data and power needs, current, fit, strain | [Amazon](https://a.co/d/045htrEG) |
| 11–12 | M3×35 spacers and M3×5 screws | as needed | Material, strength, fit, corrosion | Local source |
| 13 | Gorilla Epoxy, 25 ml | 1 | Material compatibility, cure, outdoor and temperature limits | [Home Depot](https://www.homedepot.ca/product/gorilla-epoxy-syringe-25ml/1000778451) |
| 14 | Waterproof vent plug | 1 | Thread, airflow, ingress performance after install | [AliExpress](https://www.aliexpress.com/item/1005006370919409.html) |
| 15 | Clear outdoor silicone sealant | 1 | Material compatibility, cure, UV and temperature limits | Local hardware source |
| 16 | Adafruit INA3221, optional | 1 | Electrical interface, address, firmware support, isolation, calibration | [DigiKey](https://www.digikey.ca/en/products/detail/adafruit-industries-llc/6062/25660599) |

</div>

<p class="mc-table-note">These parts are unverified leads. Check current specifications, availability, shipping, and total cost before buying.</p>

## Tools and downloads

Plan for soldering and wire tools, a multimeter, suitable drills and cutting
tools, clamps, eye protection, and a safe work area.

Printable files to verify:

- [Mounting plate and battery holder (.3mf)](files/repeater-solar-1w-diy-build-plate-and-battery-holder.3mf)
- [Mounting plate (.stl)](files/repeater-solar-1w-diy-build-plate.stl)
- [3P1S 18650 battery holder (.stl)](files/repeater-solar-1w-diy-build-3x18650-battery-holder.stl)

Confirm dimensions, material, temperature performance, fasteners, battery restraint, and print quality before use.

## Assembly stages

<div class="mc-stage-list">
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 1 — Review and dry-fit</h3>
    <p>Confirm all revisions, dimensions, electrical limits, connector paths, filter orientation, clearances, printed parts, cable bends, vent location, panel location, and service access before cutting or bonding.</p>
    <p><strong>Checkpoint:</strong> the reviewed schematic, RF path, and mechanical layout agree with the exact parts in hand.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Stage 2 — Prepare the enclosure and panel</h3>
    <ol>
      <li>Measure the panel junction box and mark the enclosure cutout from the actual parts.</li>
      <li>Use an appropriate pilot opening and cutting tool with the enclosure empty and safely supported.</li>
      <li>Deburr and clean the cutout, then dry-fit the panel and cable route.</li>
      <li>Bond and clamp only with a reviewed material-compatible process. Let it cure for the full manufacturer time.</li>
      <li>Apply the reviewed weather seal without blocking drainage or venting.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-1.jpg" alt="Solar-panel wires routed through the enclosure cutout" loading="lazy"><figcaption>Example only. Measure the actual parts.</figcaption></figure>
  </section>
  <section class="mc-build-stage">
    <h3>Stage 3 — Install the mounting plate, filter, bulkhead, and vent</h3>
    <ol>
      <li>Fit the reviewed spacers and mounting plate without stressing the enclosure.</li>
      <li>Mount the filter with identified input and output ports and adequate cable bend radius.</li>
      <li>Drill and deburr the bulkhead and vent holes by test-fitting the actual hardware.</li>
      <li>Install seals, bulkhead, and vent according to their documentation.</li>
      <li>Leave RF connections unpowered and accessible for inspection.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-2.jpg" alt="Mounting plate with spacers and RF filter" loading="lazy"><figcaption>Example plate and filter layout.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-3.jpg" alt="Enclosure with filter, RF bulkhead cables, and vent plug" loading="lazy"><figcaption>Check connector direction and every seal.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 4 — Review the power-manager startup modification</h3>
    <p><strong>Do not bridge the power manager's boot-button pads.</strong> That modification has not been reproduced or reviewed.</p>
    <p>Before considering any change, require the exact schematic, failure modes, warranty impact, soldering method, startup test, and rollback to be approved by a hardware reviewer.</p>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-4.jpg" alt="Unverified wire bridge across solar-manager boot-button pads" loading="lazy"><figcaption>Unverified modification. Do not reproduce it from this photograph.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 5 — Mount the radio and decide on optional telemetry</h3>
    <p>Dry-fit the Ikoka Stick and power manager. The optional INA3221 branch removes the display header and solders to I2C pads, so it must remain separate from the base build.</p>
    <p>The telemetry pinout, measurement path, calibration, current range, I2C address, and firmware support are not verified.</p>
    <p><strong>Default:</strong> omit optional telemetry. Do not remove display pins or add firmware flags until the exact hardware and current MeshCore target are reproduced.</p>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-5.jpg" alt="Unverified optional INA3221 connection to the Ikoka display-header area" loading="lazy"><figcaption>Unverified optional telemetry. Do not reproduce it from this photograph.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 6 — Assemble the battery and charging path</h3>
    <ol>
      <li>Keep solar, battery, USB, and radio disconnected.</li>
      <li>Confirm the battery pack construction, cell matching, protection, restraint, insulation, and temperature limits.</li>
      <li>Confirm every power-manager and protection-board terminal from current manufacturer documentation.</li>
      <li>Measure and record polarity; do not rely on wire colour.</li>
      <li>Connect one reviewed branch at a time and inspect before proceeding.</li>
    </ol>
    <p><strong>Checkpoint:</strong> no unknown terminal, limit, expected value, exposed conductor, or unsupported battery condition remains.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Stage 7 — Complete the RF and USB paths</h3>
    <ol>
      <li>Verify filter input/output direction and every SMA/N-type connector.</li>
      <li>Attach the complete reviewed antenna path before the radio can transmit.</li>
      <li>Route the USB power cable without sharp bends, abrasion, or strain.</li>
      <li>Keep the enclosure open for supervised first power and checks.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-6.jpg" alt="Completed interior with optional INA3221 telemetry" loading="lazy"><figcaption>Unverified optional-telemetry layout.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-7.jpg" alt="Completed interior without optional INA3221 telemetry" loading="lazy"><figcaption>Example base layout.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-8.jpg" alt="Full enclosure interior with radio, filter, power manager, and battery" loading="lazy"><figcaption>Example interior. A photograph is not electrical approval.</figcaption></figure>
  </section>
</div>

## Check the readings

No numeric acceptance range has been peer-reviewed for this page. Do not substitute guessed voltages or currents.

<div class="mc-table-wrap" markdown>

| Check | Acceptable result | Stop condition |
|---|---|---|
| Disconnected continuity | No unintended short on the documented supply or RF paths | Unexpected continuity or uncertain meter setup |
| Connector polarity | Measurements match the reviewed schematic and manufacturer pinout | Any disagreement or unknown pin |
| Solar, battery, and output values | Each measured value is within every connected component's current documentation | Missing limit or out-of-range value |
| First power | Stable expected startup with no heat, odour, swelling, smoke, noise, or cycling | Any abnormal physical or electrical behaviour |
| RF path | Correct band, filter direction, connections, and attached antenna before transmit | Missing antenna, loose/forced connector, unknown filter response |
| Optional telemetry | Independently reproduced measurement and firmware behaviour | Unverified wiring, address, calibration, or build target |

</div>

## Test it on the bench

<ul class="mc-checklist">
  <li>Record exact parts, revisions, source documents, schematic, photographs, polarity, and measured values.</li>
  <li>Use supervised and current-limited first-power methods appropriate to the reviewed hardware.</li>
  <li>Confirm the unit starts after each intended power source is applied and after a controlled power interruption.</li>
  <li>Confirm the repeater's identity, firmware, radio, region, path, advert, and access settings survive reboot.</li>
  <li>Confirm a nearby companion receives an advert and the planned local routing test succeeds.</li>
  <li>Measure the RF/power behaviour using the reviewer's approved method; do not infer output from a firmware setting alone.</li>
  <li>Run a supervised charge/load test that covers the reviewed conditions without exceeding component limits.</li>
  <li>Inspect cable strain and seals, then complete an enclosure-appropriate water-resistance test.</li>
  <li>Prove USB recovery and document the removal/access plan.</li>
</ul>

Do not deploy until a hardware/electrical reviewer, RF reviewer, and site owner approve the completed test record.

## Recovery and undo

If a check fails, stop transmitting and disconnect solar, USB, and battery power using the reviewed safe sequence. Move the equipment to a suitable supervised work area. Do not reconnect a warm, swollen, damaged, leaking, or otherwise questionable lithium battery. Restore firmware by USB only after the electrical/RF fault is understood.

Cutouts, epoxy, removed pins, and solder bridges may be irreversible. Replace uncertain components rather than improvising a repair. The safe rollback from the optional telemetry branch is to omit it before modification, not to assume removed hardware can be restored.

## Maintenance

No interval is approved. The site record must define inspections for mounting, panel/bond, water entry, vent, seals, corrosion, cables/connectors, filter, battery condition, charge behaviour, measured values, firmware/configuration, radio verification, and physical recovery. Reinspect after any severe event or unexplained behaviour defined by the site reviewer.

## Source

Based on experimental community notes contributed by MrAlders0n in 2026. No
hardware or firmware claim on this page is verified.

Prefer a reviewed option from the [repeater selection guide](recommended-repeaters.md).
If this experiment is approved and commissioned, complete the
[mounting plan](repeater-mounting-options.md) and
[repeater configuration](../config/index.md).
