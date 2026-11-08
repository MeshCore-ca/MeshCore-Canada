---
title: Mounting a repeater
description: Pole, gutter and vent-pipe mounts the community uses for solar repeaters, with photos and printable parts.
audience:
  - repeater-builder
  - site-owner
task: plan-repeater-mount
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: site dependent
destructive: false
requires:
  - property-permission
  - site-specific-safety-review
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Mounting a repeater

Mount the antenna as high as you can, with a clear line of sight, on a mount that
can handle the wind and weather. **Height is might:** the higher the repeater,
the better it connects to the mesh.

Stay clear of power lines, and don't work on a roof or ladder alone.

## Pole mount

The most common method: a standard pole and clamp.

- Simple to set up with widely available hardware.
- Attaches to an existing mast, tower or sturdy pole.
- Best for permanent installations that need height and stability.

**Clamps:** [adjustable pole mount (Amazon)](https://a.co/d/5U5cT4m) ·
[pole clamp option 1 (AliExpress)](https://www.aliexpress.com/item/1005004943447000.html) ·
[pole clamp option 2 (AliExpress)](https://www.aliexpress.com/item/1005004943650198.html) ·
[RAK enclosure mounting guide](https://docs.rakwireless.com/product-categories/wisblock/rakbox-uo180x130x60/installation-guide/#mounting-guide)

**Poles:** [Princess Auto 4 ft army tent pole](https://www.princessauto.com/en/4-ft-army-tent-pole/product/PA0009280777)
(they link together for more height; anchor them properly) ·
[3/4 × 36-inch steel tube (Home Depot)](https://www.homedepot.ca/product/paulin-3-4-x-36-inch-round-steel-tube/1000126774)

**Alfa antenna pole mount:** Stéphane P made this 3D-printed mount for the Alfa
5.8 dBi antenna. [Download the STL](https://drive.google.com/file/d/1wIU9kLxolzM9vPUB35ETY1sCPLGvtfFu/view?usp=share_link)

[![3D-printed pole mount holding an Alfa antenna](images/PoleMount.jpg){ .mc-build-photo width="300" loading=lazy }](images/PoleMount.jpg)

**Pole mount on a chimney:**

[![Repeater pole mounted on a chimney](images/ChimneyMount.jpg){ .mc-build-photo width="300" loading=lazy }](images/ChimneyMount.jpg)

## Gutter mount

Community member **Aussiemandias** designed a 3D-printable gutter mount for quick,
discreet installs.

- Good for homes where a pole isn't practical.
- Clips onto the gutter, with no drilling into walls.
- Keeps the antenna up on a stable base.

[Download the STL](https://drive.proton.me/urls/A0P57SRHT0#voPRasptRVbW)

[![RAK Unify enclosure on a 3D-printed gutter mount](images/RAKUnify_GutterMounted.jpeg){ .mc-build-photo width="300" loading=lazy }](images/RAKUnify_GutterMounted.jpeg)

## Vent pipe extension mount

- A standard 3-foot ABS pipe from Home Depot, 3" in diameter.
- ABS cement on the side joined to the extension. On the side attached to the
  house, two self-tapping screws on each side as a safety measure, so it can be
  removed later.

[![Repeater mounted on an ABS vent pipe extension](images/VentPipeExtension.jpg){ .mc-build-photo width="300" loading=lazy }](images/VentPipeExtension.jpg)

## Notes

- Whatever the mount, use weather-rated hardware that can handle your local wind.
- Check mounts now and then for wear, corrosion or loosening.
- These options are for the [300 mW solar repeater build](repeater-solar-300mw-diy-build.md).

**Next:** [Update a repeater over the air](../meshcore/update-repeater-ota.md)
