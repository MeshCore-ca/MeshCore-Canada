# MeshMapper IATA scope migration

## Decision and boundaries

This change replaces the website's census-derived region model with the published
Canadian MeshMapper zones. It applies the simpler scope model across the Canadian
catalogue, while keeping `onqc` and its optional pilot settings specific to Ontario
and Québec. This is broader than the original proposal's ON/QC-only rollout;
maintainers must approve the national website change separately from local RF
deployment. No device, broker account, or production service is changed by this PR.

## Sources checked

- [ON/QC proposal](https://meshcore.ca/proposals/onqc-scopes/), including its
  firmware picker and screenshots merged in #107.
- [MeshMapper](https://meshmapper.net/): 33 Canadian zones and complete published
  polygons fetched on 2026-09-24. The old July snapshot had 29 zones. The importer
  reads the public map's zone metadata and the same viewport endpoint as its
  client, without bypassing the blocked legacy endpoint.
- MeshCore `CommonCLI.cpp` and `RegionMap.h` at repeater tags 1.14.1, 1.15.0,
  1.16.0 and current source, plus the [official CLI](https://docs.meshcore.io/cli_commands/).
- Existing community search references, local editor drafts, proposal gateway,
  archival boundary data, generated catalogues, and approval automation.

## Model

### September 25: starter assignments

At the user's request, six MeshCore Canada regions now fill the five missing
jurisdictions: `yyg` for PEI, `yyt` for Newfoundland, `yyr` for Labrador, `yxy`
for Yukon, `yzf` for the Northwest Territories, and `yfb` for Nunavut. These
use the same flat IATA/province/Canada scopes, without `onqc`.

They are explicitly labelled starter regions, not MeshMapper publications or
coverage claims. Airport authorities and Transport Canada's airport list confirm
the codes; references are in the bilingual scope guide and starter policy.
Province/territory outlines define the broad extents. Labrador is drawn from the
SHA-256-pinned Statistics Canada divisions 1010/1011, with Newfoundland the rest
of the province. The 33 published MeshMapper polygons remain unchanged and take
priority if their coverage expands. A newly published matching code requires an
explicit starter-to-MeshMapper transition, not duplicate regions.

Geometry checks prove complete coverage of these five jurisdictions, no starter
overlap, unchanged MeshMapper geometry, and correct Labrador/Newfoundland coastal
lookups. EN/FR browser checks cover every added code and confirm that generated
commands do not include `onqc` or an unrequested radio change.

| Concern | New behavior |
|---|---|
| City zone | Published MeshMapper IATA code, lowercase on air |
| Province | Physical repeater province, independent of city boundaries |
| Shared mesh | `onqc` only for Ontario/Québec; no invented scopes elsewhere |
| National | `can` carried for future use, not a companion default |
| North America | `na` carried as a reserved placeholder, not active cross-border routing |
| Local repeater | Allow unscoped floods with `region allowf *` |
| Bridge | Explicit city choices, own province only, `region denyf *` |
| Own adverts | Home city on 1.15+; unscoped on 1.14 with a visible warning |
| Companion/Public | Proposed `onqc` in ON/QC; city scope for tests and bots |
| Radio/hash | Keep current values unless explicitly selected |
| ON/QC intervals | Optional 240-minute advert, 47-hour flood advert, 16-hop limit |

Canadian scopes are flat siblings. The province grouping in the browser is only
navigation. Explicit neighbouring U.S. paths remain opt-in metadata, not Canadian
map geometry. Scopes do not provide encryption, geofencing, or proof of RF coverage.

The September 26 update incorporates [#114](https://github.com/MeshCore-ca/MeshCore-Canada/pull/114):
`can` and `na` are reserved scopes in the shared catalogue and command generator.
Both guides, the configurator, migration checks and budgets use that same list.
They do not change companion defaults, unscoped forwarding or geographic boundaries.

Ottawa and Gatineau share `yow`; their repeaters retain `on` and `qc` respectively.
North Bay's `yyb` footprint also crosses into Québec. Province outlines identify
the physical province without clipping MeshMapper polygons. Outside the six
starter assignments, gaps stay gaps. Published overlaps require a choice;
no nearest-airport circles are substituted.

## Firmware and migration safety

- 1.16+: root-reset `region def` syntax for independent scopes.
- 1.15: individual `region put`/`region allowf`, then home-city `region default`.
- 1.14: individual commands with explicit flood permission; no unsupported
  `region default`. Earlier versions are not offered.
- All profiles respect 32 entries and the actual 160-byte region response buffer,
  including wildcard, indentation, flags, home marker, newlines, and terminator.
- Existing entries are not automatically deleted. Guides require a backup and
  deepest-first cleanup, preferably over USB. Some commands persist immediately.
- Unique old links migrate to IATA codes. Ambiguous old home codes need a new
  choice or a fresh coordinate lookup. Unresolved extra city selections block
  command copying until the replacement list is reviewed.
- Manual zone links do not serialize the zone centre as a user's exact location.
  Downloaded setup summaries omit coordinates and credentials.

## Data and compatibility

The snapshot's SHA-256 binds the generated catalogue and browser cache URL.
`iata-regions.json` and the existing public `canada-regions.json` URL now serve the
same data. The original catalogue is preserved byte-for-byte under
`maintenance/legacy-regions/`; its old geographic assets and validation remain.
Community search anchors retain their exact previous approximate points, expanded
from obsolete region names to explicit coordinates. Observer quick lists gain all
published zone codes; no running observer or MQTT account is retagged.

The old editor URL now explains MeshMapper ownership in both languages and exports
browser-local drafts without deleting or uploading them. The community idea form
continues to use its existing signed, rate-limited gateway contract. Boundary v1/v2
POSTs return 410 with no Turnstile/GitHub/preview side effects. Historical preview
downloads remain valid. The former issue-close publisher is manual-only/read-only,
and its command-line entrypoint refuses to run against the active IATA policy.
Existing boundary issues, including #63, are not closed or applied by this PR.

## Verification and rollout

Automated coverage includes all 33 zones, province geometry, Ottawa/Gatineau,
Rigaud-style bridges, outside-Canada/gap/overlap handling, firmware variants,
legacy links, radio opt-in, English/French navigation, saved-draft recovery,
gateway retirement, old data integrity, links, accessibility, and browser layouts.
The PR check results are the record for the exact candidate tested.

Before merge, the production owner must deploy and verify the gateway retirement
using [instructions.md](../instructions.md), retaining ledger and preview backups.
Website CI cannot prove that deployment, RF behavior, or community agreement.
Coordinate repeaters and companions locally before moving an operating mesh.

Rollback is a reviewed Git revert and normal Pages deployment, not a force push.
Do not re-enable old boundary automation as a side effect. Restore a gateway image
only with state preserved and retired submissions blocked. Restore device settings
from each operator's own backup if an RF migration is rolled back.
