---
title: IATA regions and message scopes
description: Choose MeshMapper IATA zones, configure flat repeater scopes, and migrate safely from the former region hierarchy.
audience:
  - repeater-operator
  - region-maintainer
task: understand-region-standard
scope: canada-baseline
status: draft
owner: region-maintainers
last_reviewed: 2026-09-24
review_by: 2027-03-24
tested_with:
  scope_model: meshcore-canada-iata-scopes-v1
  repeater_firmware: 1.16+
difficulty: intermediate
---

# IATA regions and message scopes

Use the [region map](map.md) to find your IATA region, then open the
[repeater configurator](index.md). Both use the same boundaries and label their sources.

Write scope names in lowercase: **yow (Ottawa–Gatineau)**, **yul (Montréal)**,
or **yyz (Toronto)**. Uppercase airport codes can be used to search, but the
generated on-air names are lowercase. `YOW`, `yow`, and the former `ott` are
different on-air names.

## The scope list

| Level | Example | Purpose |
| --- | --- | --- |
| City | `yow` | The MeshMapper city zone |
| Province or territory | `on` or `qc` | The province where the repeater is installed |
| Shared mesh | `onqc` | Ontario and Québec only |
| Canada | `can` | Carried for future use; not a companion default yet |

These are independent names, not an inherited path. An Ottawa repeater carries
`yow`, `on`, `onqc`, and `can`. A Gatineau repeater carries `yow`, `qc`, `onqc`,
and `can`. Both use one city zone across the river.

The website uses IATA city codes across Canada. The wider-mesh defaults below
come from the [ON/QC proposal](../proposals/onqc-scopes.md); they are not an
announcement that every operator has adopted them. Outside ON/QC, the tool
uses city, province, and `can`, without inventing another shared-mesh scope.
Agree on wider companion and channel scopes with your local operators.

Scopes filter flood forwarding. They are not encryption, access control, radio
coverage, or GPS fences. Known-path direct traffic is not confined by these
flood filters.

## Find your city and province

- Use the code shown on the map: a published [MeshMapper](https://meshmapper.net/) zone or a labelled starter region below.
- For a cross-province zone, use the repeater's physical province. A city name
  does not override its location.
- If the map shows no zone, ask your community to add or update it in
  MeshMapper. The nearest airport or a nearby marker is not an assigned zone.
- If published polygons overlap, choose the intended community zone; the tool
  does not silently choose one.

Province outlines identify the repeater's province and define the broad starter
regions below. They do not split or change published MeshMapper zones.

## Starter regions {#starter-regions}

These MeshCore Canada assignments fill places without published MeshMapper zones.
They use real IATA codes and the same flat scope format, but are **not MeshMapper
listings or coverage claims**. The map marks them with dashed gold boundaries.

| Area | Scope | Code reference |
| --- | --- | --- |
| Prince Edward Island | `yyg` | [Charlottetown](https://flyyyg.com/) |
| Newfoundland | `yyt` | [St. John's](https://stjohnsairport.com/) |
| Labrador | `yyr` | [Happy Valley–Goose Bay](https://goosebayairport.com/) |
| Yukon | `yxy` | [Whitehorse](https://yukonairports.ca/contact-information) |
| Northwest Territories | `yzf` | [Yellowknife](https://tc.canada.ca/en/aviation/operating-airports-aerodromes/list-airports-owned-transport-canada) |
| Nunavut | `yfb` | [Iqaluit](https://tc.canada.ca/en/aviation/operating-airports-aerodromes/list-airports-owned-transport-canada) |

In the other provinces, these hubs fill the remaining gaps:

| Province | Planning regions |
| --- | --- |
| BC | `ylw` Kelowna, `yxs` Prince George, `yxt` Terrace, `yxc` Cranbrook |
| AB | `ymm` Fort McMurray, `yqu` Grande Prairie |
| SK | `yxe` Saskatoon, `yqr` Regina |
| MB | `ybr` Brandon, `yth` Thompson, `yyq` Churchill |
| ON | `ysb` Sudbury, `yam` Sault Ste. Marie, `yts` Timmins, `yqk` Kenora |
| QC | `yvo` Val-d’Or, `yzv` Sept-Îles, `yvp` Kuujjuaq |
| NB | `yqm` Moncton, `yfc` Fredericton, `ysj` Saint John |
| NS | `yhz` Halifax, `yqi` Yarmouth |

Unassigned land is divided by distance to **all regional centres in the province**:
published MeshMapper regions and the starter hubs above. It is not assigned only
to new regions. Distance uses Canada Lambert projection.

### Planning extensions {#planning-extensions}

A gap next to an existing IATA region can use that code as a **planning extension**.
For example, the Wingham-area point `43.8678, -81.2619` is assigned to `ykf`, not
Sudbury (`ysb`). Goderich is assigned to `yxu`, and Kincardine to `ylk`.

Extensions are separate, dashed areas, not changes to MeshMapper's published
polygons. The result identifies which source contains your point. All 13 provinces
and territories remain mapped. Planning boundaries need local review and do not
represent measured radio coverage.

For example, PEI uses `yyg`, `pe`, and `can`; Yukon uses `yxy`, `yt`, and `can`.
They do not use `onqc`. The [configurator](index.md) generates the commands.

These are broad starting areas, not a claim that distant communities share an
RF path. Confirm use with local operators and [suggest a refinement](../submit-idea.md)
as local meshes develop. Published MeshMapper boundaries always take priority.

The outlines use the existing Statistics Canada province/territory geography.
Labrador follows census divisions 10 and 11; Newfoundland is the rest of that
province. No nearest-airport circles or former multi-level scope names are used.

## Repeater setup

Use **1.16 or newer** when possible. The configurator also supports **1.15**
and a limited **1.14** mode. Keep physical recovery access and coordinate with
nearby operators.

| Firmware | Generated setup | Advert scope |
| --- | --- | --- |
| 1.16+ | Flat `region def` | Home city |
| 1.15 | Individual `region put` commands | Home city |
| 1.14 | `region put` plus `region allowf` for each name | Unscoped; upgrade to scope adverts |

On 1.15, `region put` replies `OK - (flood allowed)`. If an idempotent setup
command gets no reply, check the connection and resend it; the app offers
**Send Again**. Stop on an actual error. Earlier firmware should be upgraded
before using the Canadian 3-byte baseline.

### Remove old entries first {#existing-devices}

Use USB for the migration if possible, so a scope change cannot interrupt your
management path. Run `region` and save a copy of the current tree.
`region def` adds or moves entries; it does not remove old ones.

Remove unwanted names with `region remove <name>`, working from the most
indented entries up to their parents. Do not remove `*`. For the old Ottawa
path only, the sequence is:

```text
region remove ott
region remove on-alg
region remove on
region remove can
region save
```

For a tailored comparison, open **Check an existing region list** in the
configurator's last step. Paste the complete `region` reply and, on 1.15+,
optionally the `region default` reply. The checker lists retained, added, changed,
and removed scopes. It keeps the pasted data in your browser and requires you to
review removals before copying commands. Remote replies may be truncated; use USB
and keep a backup. The `^` marker indicates the home region, not the default scope.

Other trees need their own names and order. Stop on `Err - not empty`, inspect
the remaining children, and remove those first. Run `region` again; only `*`
should remain for a full manual replacement. The checker can instead retain
matching entries and move them out of obsolete parents. Do not factory-reset a node
just to change its scopes.

### Region contacts and review

Each map result shows its boundary source, local community links, maintainer,
and settings-review status. A published boundary does not prove local adoption
or confirm radio settings. Directory contacts are not automatically appointed as
region maintainers.

Use the region card to volunteer as maintainer, confirm settings with dated public
evidence, or suggest a boundary refinement. Changes require a reviewed PR.
MeshMapper changes are checked weekly and collected in a review issue; they are
never published automatically. Settings confirmations are marked for another
check after six months.

### Local repeater

An Ottawa repeater uses:

```text
region def yow|* on|* onqc|* can
region allowf *
region default yow
region
region save
region
```

`|*` returns the definition cursor to the root before the next name.
`region allowf *` keeps unscoped traffic working locally. `region default yow`
puts this repeater's own flood adverts in its city scope.

For Gatineau, change `on` to `qc`. For Montréal, use `yul` with `qc`. Outside
ON/QC, a Calgary repeater uses `region def yyc|* ab|* can` and
`region default yyc`.

### Bridge repeater

Select bridge mode only when the repeater deliberately links city zones.
Choose the additional cities it actually serves. For Rigaud, linking
Ottawa–Gatineau to Montréal from the Québec side:

```text
region def yow|* yul|* qc|* onqc|* can
region denyf *
region default yow
region
region save
region
```

The bridge carries both city names but only its own province. It drops
unscoped floods. Scoped `onqc` traffic can still cross it; `yow` traffic stops
at repeaters that do not carry `yow`. Any other repeater linking the same
cities must follow the same unscoped policy, or traffic can go around the bridge.

Additional U.S. paths remain explicit, separately labelled operator choices.
Confirm those names with the neighbouring network; this migration does not
rename U.S. scopes or add U.S. polygons.

### Optional ON/QC standard settings

The configurator offers these as a visible opt-in. It keeps radio frequency
and advert-ID settings unchanged unless you choose a change. Selecting the
ON/QC option also selects 3-byte advert IDs.

```text
set path.hash.mode 2
set advert.interval 240
set flood.advert.interval 47
set flood.max 16
```

These mean 3-byte IDs, local adverts every four hours, flood adverts every
47 hours, and at most 16 flood hops. Confirm that 16 hops reaches the longest
intended route. `set flood.max.unscoped 3` is an optional local-noise limit,
not a default generated by the tool.

Settings can take effect or persist as commands are entered. Keep your backup;
do not rely on rebooting to undo them. Check each reply and stop on errors.
After saving, run `region` again and verify every intended scope and `F` flag.
The bridge's `*` must not have `F`.

## Companion and channel setup

With MeshCore app **1.43 or newer**, open **Settings → Network Settings →
Default Region Scope**. In the ON/QC mesh, select `onqc`. This lets an initial
flooded direct message, and its path-discovery reply, cross the shared mesh.

| ON/QC traffic | Scope |
| --- | --- |
| Companion default and Public channel | `onqc` |
| Test and bot channels | Your city, such as `yow` |
| A bot's own default | Its city |
| Other channels | City, province, or `onqc`, by agreement |

Set channel scopes explicitly: an unset channel uses the companion default.
Do not use `can` as the default yet. Outside ON/QC, agree on a mesh-wide
default locally; the website does not assume that a Canada-wide route exists.

## Firmware limits

- At most **32 named regions**, separate from the wildcard.
- At most **160 bytes per CLI command**.
- A **160-byte region-tree reply buffer**. The tool budgets indentation, flags,
  a home marker, and the terminating byte so the full result can be checked.

Select only useful bridge zones. An oversized profile produces no commands.

## Updates and older links

Request changes to published zones in [MeshMapper](https://meshmapper.net/).
For our starter regions, [send a community proposal](../submit-idea.md).
MeshCore Canada keeps published zones unchanged and labels its own additions separately.
Known old links can lead to the corresponding IATA zone, but boundaries may
have changed. Recheck the place, province, and extra bridge zones. Ambiguous
or missing old names require a new selection.

The [former editor](editor/index.md) provides a download of locally saved
drafts. New census-cell submissions are retired; existing issues and preview
images are retained as history. Community-listing updates still use the
[community form](../submit-idea.md).

## Sources

- [ON/QC scope proposal](../proposals/onqc-scopes.md)
- [MeshMapper](https://meshmapper.net/) and the snapshot details in the map's **Region data** view
- [MeshCore CLI reference](https://docs.meshcore.io/cli_commands/)
- [Data and licence notice](../assets/regions/NOTICE.txt)
- [Previous census-based design, preserved in Git history](https://github.com/MeshCore-ca/MeshCore-Canada/blob/e5281887ffdce3985d8f919fc353fa597a8ac93e/docs/config/standard.md)
