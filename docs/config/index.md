---
title: Set up a repeater
description: A guided setup for a repeater or a repeater observer, one question at a time, ending with every command to paste and what each one does.
audience:
  - repeater-operator
task: set-up-repeater
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-11-02
review_by: 2027-05-02
evidence: tests/browser/setup-tool.spec.mjs
difficulty: beginner
estimated_time: 20-40 minutes
page_styles:
  - assets/setup/setup.css?v=20261105-1
page_scripts:
  - assets/regions/modules/iata-scopes.js?v=20261013-1
  - assets/regions/modules/scope-migration.js?v=20260926-2
  - assets/javascripts/place-search.js?v=20261102-9
  - assets/setup/setup-text.js?v=20261105-3
  - assets/setup/setup-flow.js?v=20261103-12
  - assets/setup/setup-place.js?v=20261103-12
  - assets/setup/setup-commands.js?v=20261103-12
  - assets/setup/setup-ui.js?v=20261105-2
hide:
  - navigation
  - toc
---
# Set up a repeater

Answer a few questions, one at a time, and get every command to paste into your repeater, with what each one does.

Before you start: pick a [supported board](../hardware/recommended-repeaters.md), agree on the site with your [local community](../provinces/index.md), and set it up on the bench before it goes up the mast.

<div data-setup-tool><p class="setup-fallback">The setup tool didn't load. Reload the page.</p></div>

<noscript>The setup tool needs JavaScript. [How repeaters work](guide.md) explains every step and command it would show.</noscript>

## After it's set up

- Check that a nearby companion hears its advert. Each time it reboots, set its clock again with `clock sync` from the MeshCore app. After a restart its clock is often wrong, and phones may ignore its announcements until it's set.
- Choose an [antenna](../hardware/recommended-antenna.md) and a [mount](../hardware/repeater-mounting-options.md).
- On firmware 1.14 or newer, read about [loop detection](guide.md#loop-detection) before changing a community repeater.
- Something not working? [Get help](../start/get-help.md).

<small>[Region data: sources and licences](../assets/regions/NOTICE.txt)</small>
