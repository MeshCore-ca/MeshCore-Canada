---
title: MeshCore questions and answers
description: Find short answers about Canadian settings, hardware, range, joining a mesh, and observer problems.
audience:
  - newcomer
  - meshcore-user
  - mesh-operator
task: answer-meshcore-question
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-11-02
review_by: 2026-12-31
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Bilingual answers checked against the IATA configurator and linked setup guides on 2026-10-29; no hardware testing.
difficulty: beginner
estimated_time: 2-10 minutes
destructive: false
---

# MeshCore FAQ

## General

??? question "What radio settings does MeshCore use in Canada?"
    Choose the **Canada** preset in the app. It sets the Canadian radio values
    and **3-byte** paths; the separate **USA** preset uses the same radio values
    but leaves the path setting alone ([preset update](https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579)). The values are in
    the [Canada defaults](../index.md#canada-baseline) table.

    Always check your [community directory](../provinces/index.md) page in case a
    nearby mesh uses different settings.

??? question "What is 3-byte path hash mode?"
    MeshCore messages carry short repeater IDs along their path. MeshCore Canada
    recommends **3-byte** IDs: bigger repeater networks get far more unique IDs
    than with the old 1-byte setting. In the MeshCore command line:

    ```text
    set path.hash.mode 2
    ```

    Repeaters older than firmware 1.14 can't forward 2- or 3-byte paths. More in
    the [upstream FAQ](https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md#39-q-what-is-multibyte-support-what-do-1-byte-2-byte-3-byte-adverts-and-messages-mean).

??? question "Do I need a ham radio licence?"
    MeshCore Canada can't give legal advice. Most Canadian MeshCore communities
    assume licence-exempt LoRa use in the right ISM band, but you're responsible
    for legal frequencies, power, antennas and duty cycle where you are.

    If you operate as an amateur station or use non-standard equipment, check the
    [current ISED rules](../resources/links.md#radio-and-regulatory-references)
    before transmitting.

??? question "What range should I expect?"
    Range depends heavily on the antenna, height, terrain, obstructions, noise
    and line of sight. A handheld indoors may only cover a neighbourhood; a
    well-placed outdoor repeater with a clear view can cover much more.

    When troubleshooting, compare against a nearby known-good node before
    assuming the firmware is at fault.

## Hardware

??? question "What devices work with MeshCore?"
    Use devices listed in the [MeshCore flasher](https://meshcore.io/flasher) or
    in a MeshCore Canada guide for the role you need. See
    [Choose hardware](../hardware/index.md).

    For an observer, a supported Wi-Fi LoRa board can run as a
    [repeater observer](../config/index.md?type=observer).

??? question "Can I use my Meshtastic device with MeshCore?"
    Sometimes, but it has to be flashed with MeshCore firmware and supported by
    the MeshCore build you choose. A device running Meshtastic won't join a
    MeshCore mesh.

    Back up anything you care about before reflashing, and treat the first
    MeshCore flash as a new setup.

??? question "Which board should I buy first?"
    For a first companion, pick one that's listed in the MeshCore flasher and has
    community support near you: see [Companions](../hardware/recommended-companions.md).
    For a fixed repeater or observer, stable power, a good antenna and remote
    access matter more than a screen.

## Network

??? question "How do I join an existing mesh?"
    1. Find your local page in the [community directory](../provinces/index.md).
    2. Choose the **Canada** preset unless the local page says otherwise.
    3. Check that paths are set to **3-byte**.
    4. Reboot the device after changing radio settings.
    5. Send an advert and check whether nearby users can see you.

??? question "How do I start a new mesh in my area?"
    Use the Canada defaults unless you have a local reason to differ. Start with
    companions, then set up repeaters with the [setup tool](../config/index.md),
    which gives you every command to paste.

    When you're ready, [add your community](../contributing.md) to the
    directory with its region, status, contacts and any different settings.

??? question "Why does my observer show no packets?"
    A broker connection only proves the observer reached MQTT. It may still hear
    nothing if the radio preset or path setting is wrong, packet publishing is
    off, or no nearby nodes are active.

    Use [Check your observer](../analyzer/verify.md) and
    [Troubleshooting](../analyzer/troubleshooting.md) to narrow it down.

??? question "Where can I ask another question?"
    See [Get help](../start/get-help.md): Discord and the forum are the quickest.
