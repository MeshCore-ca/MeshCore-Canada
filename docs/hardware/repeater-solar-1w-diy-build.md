---
title: Review the 1 W solar repeater build
description: Review the experimental Ikoka Stick solar build, its evidence gaps, staged assembly, bench checks, and recovery plan.
audience:
  - advanced-repeater-builder
  - hardware-reviewer
task: review-1w-solar-repeater-build
scope: experimental
status: experimental
owner: docs-hardware
last_reviewed: 2026-07-19
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

# Review the 1 W Solar Repeater Build

This page preserves an Ottawa experimental build around the GOME Ikoka Stick hardware revision 0.4.0, a Waveshare Solar Power Manager, a filtered RF path, and a fabricated enclosure.

<div class="mc-guide-status" data-status="experimental" markdown>

**Experimental — do not build or deploy without domain review.** The content migration did not reproduce the hardware, verify the electrical design, pin the firmware target, validate optional telemetry, recheck prices, or establish expected measurements and climate limits.

</div>

<dl class="mc-guide-facts">
  <div><dt>Original author</dt><dd>MrAlders0n, Ottawa</dd></div>
  <div><dt>Source date</dt><dd>January 1, 2026</dd></div>
  <div><dt>Hardware note</dt><dd>GOME Ikoka Stick HW 0.4.0</dd></div>
  <div><dt>Power note</dt><dd>Waveshare Solar Power Manager, standard model</dd></div>
  <div><dt>Firmware target</dt><dd>Not pinned or reproduced here</dd></div>
  <div><dt>Maintenance interval</dt><dd>Must be set by the site review</dd></div>
</dl>

## Is this build appropriate?

The original field note positioned this as a specialized backbone or long-reach experiment. A 1 W radio is not a default upgrade. Coordinate with adjacent communities and use evidence from the intended site before changing network coverage or traffic patterns.

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
  <li>The build will remain supervised on the bench until a commissioning record is approved.</li>
</ul>

## What this build changes

The procedure cuts and drills an enclosure, bonds a solar panel with epoxy and sealant, modifies the mounting system, connects a high-power RF path and filter, assembles a lithium power system, and may remove display pins for optional telemetry. Several changes are difficult or impossible to undo without replacing parts.

## Legacy bill of materials

<div class="mc-table-wrap" markdown>

| # | Legacy product lead | Qty | Legacy CAD figure | Detail to verify | Source |
|---:|---|---:|---:|---|---|
| 1 | GOME Ikoka Stick HW 0.4.0 | 1 | $55 | Hardware revision, Canadian band, RF output, current firmware target, recovery | [Project page](https://github.com/ndoo/ikoka-stick-meshtastic-device) |
| 2 | Waveshare Solar Power Manager, standard model | 1 | $15 | Exact model, panel/battery/output limits, startup behaviour, temperature | [Waveshare](https://www.waveshare.com/wiki/Solar_Power_Manager) |
| 3 | IP65 junction box, 220×170×110 mm | 1 | $30 | Material, actual ingress rating after modification, temperature, vent | [AliExpress](https://www.aliexpress.com/item/1005007587120013.html) |
| 4 | 10 W / 18 V panel, 250×340 mm | 1 | $35 | Electrical limits, dimensions, mass, weather/load suitability | [Amazon lead](https://a.co/d/0eJo5GCr) |
| 5 | 3P1S or 4P1S 18650 pack | 1 | $25–35 | Chemistry, matched cells, protection, construction, charger and temperature | [MP&W Supply](https://mpandw.ca/) |
| 6 | Battery protection board | 1 | $8 | Exact thresholds, current, temperature, wiring, compatibility | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off) |
| 7 | 890–960 MHz four-cavity band-pass filter, 50 W | 1 | $65 | Frequency response at 902–928 MHz, insertion loss, connectors, weather/temperature | [Alibaba lead](https://www.alibaba.com/product-detail/50W-890-960MHz-4-Cavity-Filter_1601399651944.html) |
| 8 | 10–15 cm SMA right-angle to N-type female bulkhead cable | 1 | $6 | Connector gender/polarity, loss, bend, seal | [AliExpress](https://www.aliexpress.com/item/1005008569444661.html) |
| 9 | 7.5 cm SMA male right-angle cable | 1 | $7 | Connector match, loss, bend, power handling | [AliExpress](https://www.aliexpress.com/item/1005006702037541.html) |
| 10 | 0.5 ft USB-A to USB-C right-angle cable | 1 | $7 | Data/power needs, current, fit, strain | [Amazon lead](https://a.co/d/045htrEG) |
| 11–12 | M3×35 spacers and M3×5 screws | as needed | Not recorded | Material, strength, fit, corrosion | Local source |
| 13 | Gorilla Epoxy, 25 ml | 1 | $15 | Material compatibility, cure, outdoor/temperature limits | [Home Depot](https://www.homedepot.ca/product/gorilla-epoxy-syringe-25ml/1000778451) |
| 14 | Waterproof vent plug | 1 | $2 | Thread, airflow, ingress performance after install | [AliExpress](https://www.aliexpress.com/item/1005006370919409.html) |
| 15 | Clear outdoor silicone sealant | 1 | $10 | Material compatibility, cure, UV/temperature limits | Local hardware source |
| 16 | Adafruit INA3221, optional | 1 | $15–20 | Electrical interface, address, firmware support, isolation, calibration | [DigiKey](https://www.digikey.ca/en/products/detail/adafruit-industries-llc/6062/25660599) |

</div>

The previous guide also listed a Callboost 915 MHz cavity filter as a legacy alternative lead: [AliExpress](https://www.aliexpress.com/item/1005004468960058.html). No comparative filter evidence is attached here.

<p class="mc-table-note">The original guide estimated roughly $280–310 CAD before antenna, printed parts, and some mounting hardware. The source was dated January 1, 2026; prices and bundle contents were not rechecked.</p>

## Tools and downloads

The legacy build used soldering tools, a multimeter, wire tools, step and small drill bits, a jigsaw or rotary tool, marking tools, clamps, and suitable personal protection. Select tools and controls appropriate to the reviewed materials and work.

Legacy printable files:

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
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-1.jpg" alt="Legacy example of solar-panel wires routed through the enclosure cutout" loading="lazy"><figcaption>Legacy fabrication example; measurements must come from the actual parts.</figcaption></figure>
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
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-2.jpg" alt="Legacy mounting plate with spacers and RF filter" loading="lazy"><figcaption>Legacy plate and filter layout.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-3.jpg" alt="Legacy enclosure with filter, RF bulkhead cables, and vent plug" loading="lazy"><figcaption>Legacy RF and vent layout; connector direction and seals require review.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 4 — Review the power-manager startup modification</h3>
    <p>The legacy guide described shorting the standard Waveshare manager's boot-button pads so output would resume after a power loss. That modification has not been reproduced or reviewed here.</p>
    <p><strong>Do not apply it</strong> until the exact model schematic, failure modes, warranty, safe soldering method, startup test, and rollback are approved by a hardware reviewer.</p>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-4.jpg" alt="Legacy photograph of a wire across solar-manager boot-button pads" loading="lazy"><figcaption>Historical modification photograph, not an instruction to solder the current hardware.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Stage 5 — Mount the radio and decide on optional telemetry</h3>
    <p>Dry-fit the Ikoka Stick and power manager. The optional INA3221 branch removes the display header and solders to I2C pads, so it must remain separate from the base build.</p>
    <p>The legacy notes recorded display-header pins as GND, 3.3 V, SCL, and SDA and assigned battery to channel 1 and solar to channel 3. Those pin assignments, measurement topology, calibration, current range, I2C address, and firmware support have not been independently verified.</p>
    <p><strong>Default:</strong> omit optional telemetry. Do not remove display pins or apply historical firmware flags until a reviewer reproduces the exact hardware and current MeshCore target.</p>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-5.jpg" alt="Legacy optional INA3221 connection to the Ikoka display-header area" loading="lazy"><figcaption>Historical optional branch, quarantined pending electrical and firmware review.</figcaption></figure>
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
      <li>Keep the enclosure open for supervised first power and commissioning.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-6.jpg" alt="Legacy completed interior with optional INA3221 telemetry" loading="lazy"><figcaption>Legacy optional-telemetry layout.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-7.jpg" alt="Legacy completed interior without optional INA3221 telemetry" loading="lazy"><figcaption>Legacy base-layout example.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-8.jpg" alt="Legacy full enclosure interior with radio, filter, power manager, and battery" loading="lazy"><figcaption>Legacy interior overview; do not infer electrical approval from the photograph.</figcaption></figure>
  </section>
</div>

## Wiring diagram status

![Legacy 1 W solar repeater wiring diagram](images/repeater-solar-1w-diy-build-9.svg){ .mc-build-photo loading=lazy }

The diagram is retained as a historical review artifact. It is not an approved schematic. A reviewer must reconcile it with the exact product documentation, protection requirements, conductor ratings, grounds, optional telemetry, and measured results.

## Expected readings and stop conditions

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

## Bench test and commissioning

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

Do not deploy until a hardware/electrical reviewer, RF reviewer, and site owner approve the commissioning record.

## Recovery and undo

If a check fails, stop transmitting and disconnect solar, USB, and battery power using the reviewed safe sequence. Move the equipment to a suitable supervised work area. Do not reconnect a warm, swollen, damaged, leaking, or otherwise questionable lithium battery. Restore firmware by USB only after the electrical/RF fault is understood.

Cutouts, epoxy, removed pins, and solder bridges may be irreversible. Replace uncertain components rather than improvising a repair. The safe rollback from the optional telemetry branch is to omit it before modification, not to assume removed hardware can be restored.

## Maintenance

No interval is approved. The site record must define inspections for mounting, panel/bond, water entry, vent, seals, corrosion, cables/connectors, filter, battery condition, charge behaviour, measured values, firmware/configuration, radio verification, and physical recovery. Reinspect after any severe event or unexplained behaviour defined by the site reviewer.

## Sources and change log

- Original community guide: MrAlders0n (Ottawa), January 1, 2026.
- July 19, 2026: converted to an experimental review guide; separated optional telemetry, removed executable unverified firmware flags, added evidence limits, staged checkpoints, measurements, commissioning, recovery, and maintenance requirements. No hardware or firmware claim was upgraded to verified.

## Next step

Review the [repeater selection guide](recommended-repeaters.md) with the local network operator. If the experiment is approved and commissioned, complete the [mounting plan](repeater-mounting-options.md) and [repeater configuration](../config/index.md).
