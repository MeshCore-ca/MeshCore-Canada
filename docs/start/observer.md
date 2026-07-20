---
title: Start with an observer
description: Choose, configure, and verify a MeshCore observer that sends Canadian network data to public tools.
audience:
  - observer-operator
  - service-operator
task: start-observer
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: intermediate
estimated_time: varies by method
destructive: false
requires:
  - supported-observer-method
  - internet-connection
---

# Start with an observer

Outcome: an observer that sends network data to MeshCore Canada's public tools
and appears in the health view.

## Understand the role

An observer listens through a MeshCore radio and sends network data to public
services. It does not route mesh traffic. It may run on radio firmware, an
always-on computer, or a home-automation host.

Read [what the service collects and who can access
it](../analyzer/data-collection-access.md) before enabling an observer.

## Before you start

- Open the [observer method chooser](../analyzer/intro.md).
- Pick a method that matches the radio, operating system, and host you already
  have.
- Back up configuration before replacing firmware or installing a service.
- Use a real nearby location code when the chosen method asks for one.

## What this path changes

Depending on the method, setup may replace radio firmware, install a host
service, or add a home-automation integration. It also enables public
network data publishing.

<section class="mc-start-progress" data-mc-progress-page="observer" aria-labelledby="observer-progress-title">
  <h2 id="observer-progress-title">Your setup path</h2>
  <p>Checks are saved only in this browser.</p>
  <ol>
    <li><label><input id="observer-progress-understand" type="checkbox" data-mc-progress> Understand the observer role and data flow</label></li>
    <li><label><input id="observer-progress-method" type="checkbox" data-mc-progress> Choose a supported observer method</label></li>
    <li><label><input id="observer-progress-prepare" type="checkbox" data-mc-progress> Back up and prepare</label></li>
    <li><label><input id="observer-progress-install" type="checkbox" data-mc-progress> Follow the selected setup guide</label></li>
    <li><label><input id="observer-progress-configure" type="checkbox" data-mc-progress> Apply local radio and service settings</label></li>
    <li><label><input id="observer-progress-verify-local" type="checkbox" data-mc-progress> Confirm the radio can hear nearby activity</label></li>
    <li><label><input id="observer-progress-verify-network" type="checkbox" data-mc-progress> Confirm the observer in CoreScope</label></li>
  </ol>
</section>

## Set up the observer

Use the [observer method chooser](../analyzer/intro.md), then follow only the
guide for the selected method.

<!-- HUMAN REVIEW REQUIRED: Service operators must approve the linked observer
method support, credential handling, install, and rollback guidance before
launch. -->

## Apply Canada or local settings

The connected radio must use the same settings as the nearby mesh. Start with
**USA/Canada (Recommended)** and the **3-byte** path setting unless your local community publishes an override.

!!! warning "Match your local mesh"
    Check the [community directory](../provinces/index.md). A connected
    observer can be online while hearing no useful traffic if its radio
    settings do not match nearby devices.

The setup method will introduce advanced terms such as **location code** and
the broker connection only when they are needed.

## Verify success

Your observer path is complete when:

1. its radio hears known nearby mesh activity;
2. it appears in [CoreScope Observers](https://live.meshcore.ca/#/observers);
   and
3. recent activity appears after a nearby transmission.

Use the [observer verification checklist](verify.md#observer).

## Operate and maintain

Check the observer after radio, network, credential, host, or firmware
changes. Review the [data and access policy](../analyzer/data-collection-access.md)
when service behavior changes.

## Next step

Open [Check your observer](../analyzer/verify.md) for the detailed health
view. If it is missing or quiet, [get help](get-help.md).
