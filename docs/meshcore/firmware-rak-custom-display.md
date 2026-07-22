---
title: RAK4631 custom display firmware archive
description: Understand why the former RAK4631 custom-display recipe is archived and what proof is needed to restore it.
audience:
  - firmware-maintainer
  - advanced-builder
task: review-rak-display-archive
scope: experimental
status: archived
owner: docs-firmware
last_reviewed: 2026-07-19
review_by: 2027-01-19
difficulty: advanced
estimated_time: 3-5 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---
# RAK4631 Custom Display Firmware (Archived)

<div class="mc-guide-status" data-status="archived" markdown>

**Archived route.** It contains no supported build or flash recipe. Conflicting historical repository, target, device, filename, and version details remain quarantined.

</div>

!!! danger "Archived and unverified — do not flash"
    The former instructions on this page mixed repository, target, device, filename, and firmware-version details. They have not been reproduced against the current official MeshCore source, so they were removed from the operational guide rather than presented as working instructions.

- **Scope:** Historical community experiment
- **Status:** Archived; not supported or verified by MeshCore Canada

The experiment attempted to add a MakerFocus 1.3-inch SH1106 OLED to a RAK4631 companion build. There is currently no reviewed build recipe, supported-version matrix, test log, or recovery procedure on this page.

## Do not use this page to build or flash firmware

- Do not copy old PlatformIO configuration fragments from cached versions of this page.
- Do not flash an artifact unless its board target, source commit, build command, checksum, and recovery path have been independently verified.
- Use the [official MeshCore source repository](https://github.com/meshcore-dev/MeshCore) for current supported targets.

## Historical references retained for review

- [Official MeshCore source repository](https://github.com/meshcore-dev/MeshCore)
- [Historical upstream repository URL used by the old guide](https://github.com/ripplebiz/MeshCore.git)
- Historical PlatformIO dependency URL used by the old guide: <https://github.com/maxgerhardt/platform-nordicnrf52.git#rak>
- [PlatformIO Core installer source](https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py)

## Human review required

Restoring an operational guide requires a clean build from a named official commit, a verified RAK4631 target, a documented display wiring/power review, checksums for the resulting artifacts, a bench test, and a peer-reviewed recovery procedure.


## Next step

For a supported RAK4631 role, confirm the exact current target in the [official MeshCore web flasher](https://meshcore.io/flasher) and follow the matching [companion](flash-companion.md) or [repeater](flash-repeater.md) safety flow.
