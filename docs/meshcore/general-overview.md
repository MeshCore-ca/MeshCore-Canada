---
title: MeshCore roles and Canadian onboarding
description: Understand MeshCore device roles, separate Canadian baseline guidance from local practice, and choose a safe next step.
audience:
  - newcomer
  - meshcore-operator
task: understand-meshcore-roles
scope: canada-baseline
status: draft
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css
---
# MeshCore Roles and Canadian Onboarding

<div class="mc-guide-status" data-status="draft" markdown>

**Orientation page.** MeshCore Canada explains community onboarding and Canadian practices; the official MeshCore project remains authoritative for firmware, protocol, releases, and supported targets.

</div>

!!! important "MeshCore project split, use the official links"
    The project has split. Use only official links:

    - **Flashing tool and blog:** [meshcore.io](https://meshcore.io/)
    - **Source code:** [github.com/meshcore-dev/MeshCore](https://github.com/meshcore-dev/MeshCore)
    - **Discord (named "MeshCore.io"):** [discord.com/invite/fUfWevRXAg](https://discord.com/invite/fUfWevRXAg)

    Read more about the split: [The Split, blog.meshcore.io](https://blog.meshcore.io/2026/04/23/the-split).

MeshCore is a repeater-driven mesh network built on LoRa radios. A device's firmware determines whether it acts as a companion, repeater, room server, or another supported role.

- **Scope:** MeshCore basics and MeshCore Canada onboarding
- **Status:** Overview; use local community pages for local operating practices

MeshCore Canada documents the Canadian network and community practices. It does not replace the official MeshCore firmware, protocol, or upstream documentation.

## Choose a Role

- A **companion** connects a person and their app to the mesh.
- A **repeater** forwards mesh traffic and supports network coverage.
- A **room server** hosts persistent room messages for its users.

Read [MeshCore Roles](general-meshcore-roles.md) before choosing firmware.

## Canada and Local Settings

MeshCore Canada publishes a national onboarding baseline. A province, territory, or local community may document an override for its network. Check the [Mesh Directory](../provinces/index.md) before configuring a device, and follow a documented local override when one exists.

Ottawa-specific schedules and field experience are local practice, not proof of a Canada-wide standard.

## Start Here

1. Read [MeshCore Roles](general-meshcore-roles.md).
2. Choose a [recommended companion](../hardware/recommended-companions.md).
3. Follow [Flashing a Companion](flash-companion.md).
4. Find your local community in the [Mesh Directory](../provinces/index.md).
5. Use the [MeshCore How-To](general-howto.md) guides to share contacts and send messages.

## Operator and Reference Guides

- [MeshCore FAQ](general-faq.md)
- [Flashing a Repeater](flash-repeater.md)
- [Flashing a Room Server](flash-room-server.md)
- [Repeater Configurator](../config/index.md)
- [Region map](../config/map.md)
- [Region standard](../config/standard.md)

Experimental and legacy firmware pages are retained for review but are not part of this beginner path.


## Next step

If you are new, [choose your role](../start/choose-a-goal.md). If you already know the role, continue to the matching flashing guide and verify success before using advanced tools.
