# Mesh Directory

Find the nearest MeshCore Canada community page for your province or territory. Local pages can document region-specific rooms, repeaters, observers, contact points, and any settings that differ from the national onboarding baseline.

!!! tip "Start local"
    MeshCore Canada generally uses the USA/Canada radio preset and 3-byte path hashes, but local pages are the source of truth when a community documents a different preset or operating practice.

## National Baseline

Use these defaults unless a local community page publishes a different setting:

| Setting | Value |
|---------|-------|
| Radio preset | `USA/Canada (Recommended)` |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path hash mode | `3-byte` |
| CLI path setting | `set path.hash.mode 2` |

## Provinces and Territories

| Region | Directory status |
|--------|------------------|
| [British Columbia](british-columbia.md) | Active listing |
| [Alberta](alberta.md) | Active listings |
| [Saskatchewan](saskatchewan.md) | Needs community listing |
| [Manitoba](manitoba.md) | Needs community listing |
| [Ontario](ontario.md) | Active listings |
| [Quebec](quebec.md) | Active listings |
| [New Brunswick](new-brunswick.md) | Forming listing |
| [Nova Scotia](nova-scotia.md) | Active listing |
| [Prince Edward Island](prince-edward-island.md) | Needs community listing |
| [Newfoundland and Labrador](newfoundland-and-labrador.md) | Needs community listing |
| [Territories (YT / NT / NU)](territories.md) | Needs community listing |

## Community Entry Format

Community pages should use the same basic fields so newcomers can scan quickly:

| Field | What to include |
|-------|-----------------|
| Name | Community or mesh name |
| Region | City, area, province, or coverage region |
| Status | Active, forming, testing, or needs update |
| Radio settings | Preset plus raw values when known |
| Path hash mode | Usually 3-byte for MeshCore Canada |
| Contact | Discord, Telegram, website, issue link, or maintainer |

## Missing or outdated local information?

Open an update request through [Contributing](../contributing.md) so the directory can stay current as Canadian MeshCore communities grow.
