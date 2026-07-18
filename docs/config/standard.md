---
title: Region definition and authority
---

# MeshCore Canada region definition and authority

This standard defines one Canada-wide region system: how every location is assigned, how boundaries are generated, how large regions split, who may approve changes, and which source wins when sources disagree.

| Standard | Value |
| --- | --- |
| Identifier | MCC-REG-1 |
| Version | 1.1 proposed |
| Geographic reference | Statistics Canada 2021 Census geography |
| Current semantic input | Canada MeshCore Region Strategy v1.1.1 |
| Current community boundary input | MeshMapper Canada snapshot, 2026-07-12 |
| Current operational evidence | Privacy-safe Canadian radio-density snapshot, 2026-07-15 UTC; aggregate Canada–U.S. route snapshot, 2026-07-18 |
| Adoption | Becomes normative when approved and merged by MeshCore Canada |

!!! important "What is authoritative today?"
    This page and the generated national partition are proposed for review. The candidate assigns every digital DA exactly once and the public map renders only dissolved leaf regions. No raw source polygon or approximate circle is a boundary. The partition becomes operationally authoritative only after community review and every release check in this standard passes.

## The decision

MeshCore Canada maintains **one geographic partition**. Every part of Canada belongs to exactly one geographic leaf in the path `can → province or territory → region → optional subregion`. Leaf interiors never overlap and their union covers the complete national DA extent.

The published MeshCore Canada registry is the single source of truth. A boundary is not stored as a hand-drawn polygon. It is stored as ownership of official Statistics Canada geographic cells, then regenerated from those cells. Census Subdivisions keep a municipality or municipal equivalent together by default; Dissemination Areas remain the exact geometry used to publish the shared edge.

Only leaves own land. Provinces, territories, and larger region records are grouping nodes derived from their children. Raw MeshMapper polygons, strategy circles, and event areas are never published as regions. A shared repeater area is configuration metadata, not another map layer.

## Canonical model

### Geographic records

| Level | Purpose | Rule |
| --- | --- | --- |
| `can` | National root | One record; short tag remains `can` |
| Province or territory | Jurisdiction and stewardship | The 13 official Canadian jurisdictions |
| Region | Stable operating area | Exhaustive within its jurisdiction |
| Subregion | Optional split of a region | Exhaustive within its parent; never overlaps a sibling |

A region with no children is a geographic leaf. When it is split, all of its cells move to subregions and the former leaf becomes a grouping node. It has no independent fill, resolver ownership, or additional command scope. A location resolves to one and only one leaf.

Every record has separate fields for:

- an immutable registry ID such as `ca-ab-r0014`;
- one canonical, globally unique on-air tag;
- English and French labels;
- optional locally approved Indigenous and historical labels;
- its parent registry ID;
- its source and review history;
- its release state: `proposed`, `reviewed`, `active`, `deprecated`, or `retired`.

Names, tags, and geometry may change through review. The immutable ID does not.

### Cross-province repeater areas

A provincial border separates map ownership, not radio traffic. Every location still has one home leaf, but one repeater may carry several complete leaf paths when its normal coverage crosses a province or territory.

A **shared repeater area** records an established cross-jurisdiction community. It has a label and member leaves, but no polygon, parent, resolver result, or on-air tag of its own. The configurator emits the complete path for every member instead:

- National Capital Region: `can → on → on-alg → ott` and `can → qc → gatout`;
- Lloydminster: `can → ab → lloyd-ab` and `can → sk → lloyd-sk`.

For firmware v1.16+, the National Capital Region becomes:

```text
region def can on on-alg ott|can qc gatout
```

The `ncr` search name is not sent over the air. Both sides keep their canonical tags, and every repeater in the shared area receives the same ordered tree.

This rule applies everywhere in Canada:

1. A registered shared area is selected automatically for each member leaf.
2. A large-coverage or border repeater outside a registered area may select any verified set of Canadian leaves, including leaves in different provinces or territories.
3. Commands contain the union of the selected leaf paths. Shared ancestors appear once, parents appear before children, and each new branch jumps back to an ancestor that already exists.
4. The configurator must fail closed if the result exceeds the firmware limits of 32 tags or 172 response bytes. No generated CLI line may exceed 160 characters; if one `region def` line would be too long, the configurator uses ordered `region put` lines instead.
5. Adding a shared area never moves a census cell, joins polygons, or weakens the non-overlap checks.

Register an automatic shared area only when operators on every side confirm routine cross-border paths or one continuous community. Other long paths are selected per repeater. This keeps defaults useful without turning every provincial boundary into one oversized radio area.

### Large and neighbouring network paths

A region path is a forwarding choice, not a prediction of RF range. Large coverage does not require a mountain. Elevation, water paths, ordinary rooftop sites, and linked repeaters can all produce long routes.

Every repeater keeps one Canadian home region. Operators may then add complete Canadian or neighbouring U.S. paths that the repeater should forward. Region matching is exact, so every intended scope needs its complete ancestry. The configurator never adds a neighbouring path automatically and never draws U.S. geometry.

Use the smallest useful set and spread work across repeaters:

| Repeater role | Forwarding choice |
| --- | --- |
| Local access | Home path only |
| Regional bridge | Home path plus the few neighbouring Canadian paths it routinely connects |
| Long-haul backbone | A reviewed set of Canadian and U.S. paths supported by observed routes |

Do not put every available path on every repeater. For example, traffic between Waterloo, Toronto, and Western New York can be divided among bridge repeaters instead of making each repeater carry all three paths. The choice belongs to local operators and must be coordinated with the communities that use those paths.

A U.S. path is eligible when it is next to Canada or across shared water and appears in resolved route evidence. A farther path requires repeated resolved route evidence. Evidence only makes a path available; it does not make the path a default or prove future performance.

The 2026-07-18 aggregate route snapshot supports these paths:

| Area | Exact path | Status | Canadian side | Route patterns / observations |
| --- | --- | --- | --- | ---: |
| Western New York | `us → us-ny` | Documented by WNY operators | Ontario and Québec | 4,508 / 33,820 |
| Washington | `west → pnw → wa` | Documented PNW path | British Columbia | 5,384 / 21,596 |
| Oregon | `west → pnw → or` | Documented PNW path; farther route | British Columbia | 903 / 1,394 |
| Pennsylvania | `us → us-pa` | Provisional; confirm locally | Ontario | 37 / 82 |
| Ohio | `us → us-oh` | Provisional; confirm locally | Ontario | 6 / 10 |
| California | `west → ca` | Provisional PNW extension; farther route | British Columbia | 7 / 12 |

The snapshot counts unique resolved route patterns and their observations from `dev.meshcore.ca`. It stores no node names, identifiers, or exact coordinates. Counts are routing evidence, not a performance benchmark. Border or farther states may be added later only with the same evidence and neighbouring-operator review.

### Selecting a larger region

Selecting a province, territory, or larger region reveals its immediate child regions. Selecting a child with further children drills down again. The smallest displayed choices are the active leaves used for location lookup and commands.

A parent outline is calculated as the union of its children for highlighting and map navigation. It is never stored or rendered as a competing filled region. This keeps the hierarchy useful without assigning the same place twice.

The initial parent-child tree, labels, and seed locations consolidate the submitted strategy document, forum discussion, Discord feedback, screenshots, and earlier region drafts. Those community sources decide **which** subregions exist and how people identify them. MeshMapper remains the main boundary preference where it has a Canadian region. The generator decides the exact shared edge by assigning whole DAs; it does not invent extra names or stack user-drawn shapes.

Future feedback enters the same pipeline as a proposed parent change, seed change, name change, or explicit DA reassignment. The before/after DA list is reviewable, so a local preference can improve a boundary without creating a gap or overlap elsewhere.

## Nationwide coverage frame

The topology atom is the **2021 Statistics Canada Dissemination Area (DA)**. The digital product contains all 57,936 DAs and is the complete ownership domain. The cartographic product contains 57,932 DAs because four water-only DAs are omitted; it is used only for the cleaner public shoreline. Both products use the same membership wherever a cartographic DA exists.

The default ownership cohort is the **2021 Census Subdivision (CSD)**: the Statistics Canada unit used for a municipality or municipal equivalent. All 5,161 CSDs are kept whole unless an approved exception assigns every DA in that CSD. The 293 **Census Divisions (CDs)** provide a higher grouping for regional municipalities, counties, and comparable areas. A reviewed CD decision may keep an established regional community together, but it may not erase another region seed without review.

The generator uses the 76 official **2021 Economic Regions (ERs)** as broad guardrails. ERs keep an urban seed from absorbing a large, unrelated rural area merely because it is the closest seed. ER names are not automatically used as on-air names.

The current strategy contributes 192 candidate geographic seeds. The generator creates 193 leaves because the former cross-border Lloydminster seed is split into an Alberta leaf and a Saskatchewan leaf. MeshMapper contributes 29 community source polygons mapped to 27 canonical candidate tags. These are assignment inputs, not competing final layers.

| Jurisdiction | ER guardrails | Current candidate leaves | MeshMapper source polygons |
| --- | ---: | ---: | ---: |
| British Columbia | 8 | 29 | 9 |
| Alberta | 8 | 14 | 4 |
| Saskatchewan | 6 | 12 | 1 |
| Manitoba | 8 | 10 | 1 |
| Ontario | 11 | 50 | 10 |
| Québec | 17 | 17 | 4 |
| New Brunswick | 5 | 15 | 0 |
| Nova Scotia | 5 | 18 | 0 |
| Prince Edward Island | 1 | 3 | 0 |
| Newfoundland and Labrador | 4 | 11 | 0 |
| Yukon | 1 | 6 | 0 |
| Northwest Territories | 1 | 5 | 0 |
| Nunavut | 1 | 3 | 0 |
| **Canada** | **76** | **193** | **29** |

The candidate leaf catalog remains machine-readable in [`canada-regions.json`](../assets/regions/canada-regions.json). The table above does not ratify every candidate name or grouping. Fuzzy hub areas—especially in Alberta, Saskatchewan, Manitoba, Newfoundland and Labrador, Yukon, and parts of Québec—remain priorities for local review before activation.

### Current-system audit

The retired overlapping prototype confirmed why one generated authority layer is needed:

- the catalog records still require community review before activation;
- 192 overlapping seed-radius areas and 29 raw MeshMapper polygons were displayed together, but did not form a partition;
- 52 of the 192 seed centres currently resolve to another tag or no tag under the prototype resolver, including three cross-jurisdiction results;
- the 29 MeshMapper polygons contain 29 non-trivial overlap pairs; they must be reconciled before use as one layer;
- the current `YXX` source polygon is an obvious area outlier and must be refreshed or explicitly approved before it can anchor Abbotsford;
- six normalized aliases have more than one owner, so ambiguous searches require jurisdiction context or an explicit choice.

These are migration findings, not accepted region definitions. The public map now consumes only the generated partition; source circles and raw source polygons remain evidence for the generator and QA report.

### Complete guardrail inventory

Every DA falls inside one of these province-or-territory and ER combinations. Codes are from the 2021 Standard Geographical Classification.

| Jurisdiction | Economic regions |
| --- | --- |
| Newfoundland and Labrador | `1010` Avalon Peninsula; `1020` South Coast–Burin Peninsula; `1030` West Coast–Northern Peninsula–Labrador; `1040` Notre Dame–Central Bonavista Bay |
| Prince Edward Island | `1110` Prince Edward Island |
| Nova Scotia | `1210` Cape Breton; `1220` North Shore; `1230` Annapolis Valley; `1240` Southern; `1250` Halifax |
| New Brunswick | `1310` Campbellton–Miramichi; `1320` Moncton–Richibucto; `1330` Saint John–St. Stephen; `1340` Fredericton–Oromocto; `1350` Edmundston–Woodstock |
| Québec | `2410` Gaspésie–Îles-de-la-Madeleine; `2415` Bas-Saint-Laurent; `2420` Capitale-Nationale; `2425` Chaudière-Appalaches; `2430` Estrie; `2433` Centre-du-Québec; `2435` Montérégie; `2440` Montréal; `2445` Laval; `2450` Lanaudière; `2455` Laurentides; `2460` Outaouais; `2465` Abitibi-Témiscamingue; `2470` Mauricie; `2475` Saguenay–Lac-Saint-Jean; `2480` Côte-Nord; `2490` Nord-du-Québec |
| Ontario | `3510` Ottawa; `3515` Kingston–Pembroke; `3520` Muskoka–Kawarthas; `3530` Toronto; `3540` Kitchener–Waterloo–Barrie; `3550` Hamilton–Niagara Peninsula; `3560` London; `3570` Windsor–Sarnia; `3580` Stratford–Bruce Peninsula; `3590` Northeast; `3595` Northwest |
| Manitoba | `4610` Southeast; `4620` South Central; `4630` Southwest; `4640` North Central; `4650` Winnipeg; `4660` Interlake; `4670` Parklands; `4680` North |
| Saskatchewan | `4710` Regina–Moose Mountain; `4720` Swift Current–Moose Jaw; `4730` Saskatoon–Biggar; `4740` Yorkton–Melville; `4750` Prince Albert; `4760` Northern |
| Alberta | `4810` Lethbridge–Medicine Hat; `4820` Camrose–Drumheller; `4830` Calgary; `4840` Banff–Jasper–Rocky Mountain House; `4850` Red Deer; `4860` Edmonton; `4870` Athabasca–Grande Prairie–Peace River; `4880` Wood Buffalo–Cold Lake |
| British Columbia | `5910` Vancouver Island and Coast; `5920` Lower Mainland–Southwest; `5930` Thompson–Okanagan; `5940` Kootenay; `5950` Cariboo; `5960` North Coast; `5970` Nechako; `5980` Northeast |
| Yukon | `6010` Yukon |
| Northwest Territories | `6110` Northwest Territories |
| Nunavut | `6210` Nunavut |

## Authority and source precedence

The **published registry release** is the final operational authority. Its inputs have different jobs:

| Priority | Source | Role |
| ---: | --- | --- |
| 1 | Approved registry decisions | Explicit boundary, naming, split, merge, or DA-reassignment decisions |
| 2 | MeshMapper Canada | Main community boundary and identity anchor where it has a Canadian region |
| 3 | Canada MeshCore Region Strategy v1.1.1 | Candidate tags, parent relationships, and seeds outside MeshMapper coverage |
| 4 | Statistics Canada CD/CSD relationships | Keep municipalities and established regional groupings coherent |
| 5 | Privacy-safe radio-density snapshot | Secondary tie-break evidence for close, unreviewed whole-CSD choices |
| 6 | Deterministic generator | Reconciles every DA into one region without inventing another manual layer |

Statistics Canada is the topology authority at every priority. MeshMapper and approved community shapes decide intended coverage; the final edge is snapped to whole DAs so neighbours share the same boundary.

Other sources have supporting roles:

- SGC Economic Regions prevent unreasonable long-distance growth.
- Census Divisions and Census Subdivisions define the higher grouping and indivisible-by-default ownership cohorts used by the generator.
- Privacy-safe clusters from the MeshCore Canada live and development directories account for every fresh positioned node. Fixed repeater, room, and sensor nodes provide the assignment evidence; companions add advisory density context because they may move. The clusters are supporting evidence, not a replacement for local review.
- Current provincial and territorial datasets validate municipal changes and local terminology.
- The Canadian Geographical Names Database validates place names.
- First Nations reserve, Inuit region, Métis settlement, treaty, and Canada Lands data are reference datasets outside the region layer. They do not become operational boundaries or names without affected-community review.

An approved local decision may refine a MeshMapper anchor. It must identify the changed DAs, explain the local consensus, pass the same QA, and receive a new registry release. Raw polygons from different providers are never stacked together as a final “best effort” layer.

## Deterministic boundary generation

The generator must produce the same result from the same locked inputs.

### 1. Lock inputs

Record the download URL, release date, licence, file size, and SHA-256 hash for:

- the 2021 DA digital and cartographic boundary files;
- the 2021 SGC Economic Region classification;
- the 2021 Census Division and Census Subdivision digital boundary files;
- the MeshMapper Canada snapshot;
- the candidate registry, approved census overrides, privacy-safe radio-density snapshot, and generator configuration.

Do not mix a newer Census Subdivision file into the 2021 DA suite. Newer municipal files are change advisories until a complete compatible census-geography suite is adopted.

### 2. Normalize geometry

Validate and repair source geometry, calculate area and distance in Statistics Canada `EPSG:3347`, and publish web output in WGS 84. Each DA is addressed by its DGUID, not by a row number or a label.

For MCC-REG-1, the digital DA coverage is the ownership geometry. “Representative point” means GEOS `PointOnSurface` calculated from that geometry in Statistics Canada's `EPSG:3347` projection. The complete official DA coverage is preserved as shared atoms; it is not buffered, repaired, or simplified one feature at a time. Only external source polygons are repaired before comparison. `sources.lock.json` records the exact source files, while `generator.yml` records the algorithm, toolchain, and precision settings.

The candidate generator requires each source polygon to have a registry crosswalk, non-empty repaired geometry, a declared jurisdiction, and contact with at least one DA in that jurisdiction. A source marked quarantined is excluded. Centre, radius, and jurisdiction-spill review remain release gates before a candidate can become authoritative.

### 3. Snap MeshMapper envelopes to DAs

A source polygon marks a DA as part of its **macro envelope** when either:

- the DA representative point is covered by the source polygon; or
- at least 50% of the DA land area overlaps the source polygon.

If envelopes cover the same DA, the winning envelope is selected by:

1. an explicit approved override;
2. the largest overlap ratio;
3. the source-priority value in the registry;
4. the lexically smallest immutable registry ID.

Every conflict is written to the QA report. An envelope chooses which MeshMapper target may compete for a DA; it does not own the DA outright. Raw source shapes are never exported as operational polygons.

### 4. Validate community seeds

Each local region has one reviewed seed point. The DA containing that point is its anchor. A seed on a boundary uses the lexically smallest covering DA DGUID. A seed outside its declared jurisdiction is a release-blocking error.

Two candidate seeds in the same DA are a release-blocking conflict. The registry must correct the seed; the generator never silently moves it.

### 5. Set guardrails

Automatic assignment never crosses a province or territory. Each seed has one home Economic Region. A MeshMapper target may also compete inside every Economic Region touched by its accepted envelope.

### 6. Produce provisional DA ownership

First choose the nearest seed whose home Economic Region matches the DA. Inside a winning MeshMapper envelope, compare its mapped target with the community seeds covered by that envelope whose home Economic Region matches the DA. If only the mapped target remains, also include the ordinary same-ER nearest seed. Assign the DA to the closest candidate in `EPSG:3347`; exact ties resolve by immutable registry ID.

This is a provisional vote, not final ownership. It keeps MeshMapper as the main boundary preference while allowing submitted local regions to influence a large envelope. The QA report records each envelope's provisional per-region DA counts and blocks a dominant envelope that starves a contained community seed.

If an Economic Region has no home seed, the generator records a release-blocking fallback and uses the nearest seed inside the same province or territory only to keep the candidate map complete. It never assigns across a jurisdiction border.

MultiPolygon output is valid for real islands and separated land components; synthetic water bridges are not. A disconnected mainland fragment is flagged for local review.

### 7. Keep census communities coherent

The generator converts provisional DA votes into final whole-CSD ownership in this order:

1. an approved CSD decision;
2. an approved CD decision that does not conflict with another region seed;
3. the region whose seed is inside the CSD;
4. the only region seed inside the containing CD;
5. the plurality of provisional DA votes;
6. for a close unreviewed choice only, qualifying privacy-safe radio-cluster evidence;
7. projected seed distance and immutable registry ID for a remaining exact tie.

A CSD may be divided only by an approved split exception that lists every DGUID in that CSD and its owner. The generator fails if any other CSD has more than one owner. This prevents a nearest-seed edge from slicing an incorporated city merely because one neighbourhood is closer to the next seed.

The Kitchener-Waterloo fixture is release-blocking: all 189 DAs in Cambridge CSD `3530010`, including Hespeler, resolve to `wat`; all 766 DAs in Waterloo CD `3530` resolve to `wat`. These counts are tied to the locked 2021 Census geography and must be reviewed when the census vintage changes.

### 8. Use radio activity only as a privacy-safe tie-break

The locked `radio-density.json` snapshot joins fresh positioned observations from `live.meshcore.ca` with positioned entries currently returned by `dev.meshcore.ca`, then deduplicates matching public keys in memory. The dev endpoint does not provide a per-node observation time, so dev-only entries contribute advisory density but cannot become boundary-decision evidence. Fresh live repeater, room, and sensor observations supply the decision counts; companion locations remain advisory. The snapshot is bound to a SHA-256 digest of each DGUID and its pre-radio provisional owner, so stale candidate labels fail closed while a valid radio tie-break can still change final ownership without a circular hash dependency.

Clusters span no more than 30 kilometres. Every published geographic count is at least five. Candidate counts are published only inside their own CSD, and the complete CSD candidate breakdown is suppressed if any candidate bucket contains fewer than five nodes. Raw node identifiers, names, and exact coordinates are never persisted.

Radio evidence may choose between candidates already present in a CSD only when the provisional margin is at most 10 percentage points and at least 60% of eligible radio evidence supports one candidate. It cannot create a region, split a CSD, cross a province or territory, or override an approved census decision. A radio snapshot is reproducible evidence for a release, not a live automatic authority; changes enter only through a newly locked snapshot and normal review.

### 9. Generate both boundary products

- The resolver uses DA **digital** boundaries so coastal water is handled consistently.
- The public map uses DA **cartographic** boundaries for a clean shoreline.

Both products use the same DA membership. Generated leaf interiors are pairwise disjoint and their union is the complete locked DA extent. Adjacent leaves share one zero-width edge. A point exactly on that edge resolves to the lexically smallest registry ID.

## Splitting and merging

Large regions split by moving whole DAs, not by drawing a new freehand line.

A split proposal must include:

- the parent region ID;
- the DGUID membership of every proposed child;
- proposed canonical tags and English/French labels;
- the local reason for the split;
- evidence of affected-community review;
- an updated command-budget report.

All parent cells must belong to exactly one child. After a split, the parent is a non-leaf grouping only. It has no separate resolver ownership, published fill, or additional routing scope.

Aggregate Dissemination Areas are useful starting groups for a split, but their codes are not permanent identity. They may be divided or combined when local geography calls for it.

CSDs are the default subregion building blocks. Prefer whole municipalities or municipal equivalents first, then combine adjacent CSDs using their CD, local identity, terrain, and operating evidence. Dividing a CSD is an exception and requires the complete enumerated DA assignment described above.

A merge preserves every retired ID and tag as an alias or tombstone. A retired tag is never silently reused for another place.

## Names and on-air tags

The registry follows the forum's preference for short, flat, human-readable tags. Hierarchy is stored in parent fields rather than repeated inside every tag.

Canonical on-air tags must:

- be globally unique across the connected mesh;
- contain only lowercase `a-z`, `0-9`, and `-`;
- use no more than 29 UTF-8 bytes;
- remain stable once active;
- avoid automatic “largest town wins” naming for broad rural areas;
- be checked against active, deprecated, retired, alias, and non-geographic search-group names.

IATA and postal codes may be aliases where helpful, but neither system is the national naming authority. New subregions use a locally meaningful flat tag when one is unambiguous. A parent-prefixed tag is a fallback for collision avoidance, not a requirement.

Generated commands use canonical tags only. Search may accept labels and aliases. The registry stores English and French labels separately; local Indigenous names require review by the affected community and are never inferred.

## Governance

### Responsibilities

| Role | Responsibility |
| --- | --- |
| MeshCore Canada region maintainers | Registry integrity, collision checks, releases, generator and QA |
| Provincial or territorial stewards | Coordinate local proposals and confirm jurisdiction-wide effects |
| Local operators and communities | First review of local names, grouping, and practical coverage |
| Adjacent region stewards | Joint review when a proposal moves their shared DA boundary |

The national maintainers enforce the data model; they do not invent local identity. A technically valid change may still wait for local review. A locally popular change may still fail if it creates a gap, overlap, collision, or command-budget violation.

### Change process

1. Submit a proposal from the boundary editor. The proposal service opens a public issue with the affected DGUIDs, names, tags, reason, and proposed author; no contributor account is required.
2. Generate a before/after diff and QA report.
3. Obtain affected local and jurisdiction review. Cross-boundary proposals require every affected side.
4. Allow a public review window recorded in the proposal.
5. An allowlisted maintainer approves by closing the `boundary-update` issue
   as **Completed**. **Close as not planned** rejects it.
6. The repository Action verifies the signed proposal, records the reviewed
   census decision, regenerates and validates the full national layer, commits
   it to `main`, and queues publication.
7. Keep the previous release available for rollback and migration.

### Boundary editor proposals

The boundary editor works on the same census cells as the generator. Its normal action reassigns a whole CSD, with its containing CD shown as review context. It never saves a freehand polygon as operational geometry. A reviewer may use DA-level draft edits to shape an exceptional split, but the approved `splitExceptions` record must expand that draft to list every DA in the CSD, with no duplicate or missing DGUID.

The editor is a static page at `/config/editor/` and requires no contributor account. It builds a versioned proposal with the base membership hash and before/after owner for each changed DGUID. On submission, a MeshCore Canada-hosted proposal service repeats the authority and proposal checks, verifies the anti-spam challenge, and uses a repository-restricted GitHub App to open the public review issue automatically. The static page and production service are both operated by MeshCore Canada; no GitHub credential or signing secret is placed in the browser. The public App has Issues read/write only and cannot change the map. The canonical proposal is signed by the App and stored in machine-readable issue markers while the issue shows the human review summary. Maintainers may reproduce the proposal check with `scripts/validate-region-proposal.py`, which adds CD/CSD context and requires a reason before review; an author may also be recorded.

After local and public review, an allowlisted maintainer closes the labelled issue as **Completed**. The repository-owned Action independently verifies the issue author, closer, label, App signature, proposal hash, and jurisdiction. It also checks the current owner of every requested cell. A proposal can remain open while unrelated boundaries change, but it fails closed if one of its requested cells changed during review. A whole-CSD decision becomes a cohort override; a partial-CSD decision becomes an explicit split listing every DA in that CSD. The Action then regenerates both national partitions and editor cells from locked sources, runs the release checks, and commits the source decision and generated artifacts to `main`. That push starts the normal site deployment. Any failure before publication reopens the issue and leaves `main` unchanged. Closing as **Not planned** makes no authority change. Editor drafts, browser-local state, and submitted issues are never operational authority until this approval and validation complete.

The editor's own census-cell geometry (`docs/assets/regions/cells/`) was last regenerated with `scripts/build-region-editor-data.py --retain 10%` rather than the script's 8% default, because 8% collapses a BC dissemination area to a degenerate shape; the retained value is recorded alongside the rest of the build inputs in `docs/assets/regions/cells/manifest.json`.

Versioning rules:

- **Major:** census-geography vintage or incompatible authority/model change.
- **Minor:** DA reassignment, split, merge, hierarchy change, tag change, or shared repeater area membership change.
- **Patch:** labels, aliases, documentation, or source metadata with no membership change.

Operational region boundaries are community routing definitions. They are not legal, electoral, cadastral, treaty, title, or sovereignty claims.

## Release checks

A geographic release fails unless all of these are true:

- all 57,936 DAs appear exactly once in the leaf-membership table;
- all 5,161 CSDs and 293 CDs are identified from the same locked 2021 Census suite;
- every CSD has one leaf owner unless an approved split exception enumerates every one of its DGUIDs;
- every DA's leaf is inside the same province or territory;
- every pair of leaf interiors has zero positive-area overlap, regardless of hierarchy branch;
- the symmetric difference between the leaf union and the locked 57,936-DA digital union is zero at the configured precision;
- every subregion union equals its parent membership;
- only leaves own geometry; no `routingOverlays`, `sharedParents`, or profile-added scopes exist;
- every shared repeater area contains canonical leaves from at least two provinces or territories, and no leaf belongs to more than one automatic shared area;
- shared-area names never enter the on-air tree; the complete member paths fit every firmware and serial-line budget;
- every neighbouring path is non-geographic, optional, backed by aggregate route evidence, and uses a documented or explicitly provisional external hierarchy;
- neighbouring paths never own Canadian cells, resolve from a map point, or appear as U.S. boundary geometry;
- every resolver test point returns exactly one leaf;
- every active region is contiguous by shared land edge, or has a documented island/MultiPolygon exception;
- every active tag is globally unique and within the firmware byte limit;
- every old tag resolves to an active record, a deprecated record, or a tombstone;
- every active geographic record has reviewed `allowed_er_codes`, and no seed or locked-cell conflict remains;
- every MeshMapper anchor has a DA-level deviation report;
- Cambridge CSD `3530010` has exactly 189 DAs owned by `wat`, and Waterloo CD `3530` has exactly 766 DAs owned by `wat`;
- any radio-density input contains no raw node identifiers, names, or exact coordinates, uses aggregates of at least five nodes, and cannot split a CSD;
- every source polygon passes the area, centre, jurisdiction-compatibility, and review-state checks before it is used as an anchor;
- all generated geometry is valid and reproducible from locked inputs;
- all generated command fixtures fit the 32-region, 172-byte response, and 160-character serial-line limits;
- English and French labels are present for every active geographic record;
- the QA report contains no unreviewed conflicts or fallback regions.

## Required registry artifacts

Before the first MCC-REG-1 geographic release is marked active, the repository must publish:

| Artifact | Purpose |
| --- | --- |
| `sources.lock.json` | Exact inputs, licences, and hashes |
| `generator.yml` | Algorithm version and all constants |
| `canada-regions.json` | Geographic records, hierarchy, aliases, and source crosswalks |
| `municipal-overrides.json` | Approved CD/CSD ownership decisions and complete CSD split exceptions |
| `radio-density.json` | Optional locked privacy-safe aggregate evidence; never raw node data |
| `canada-region-membership.csv` | One row for every digital DA, with CD/CSD context, provisional vote, and final leaf |
| `aliases.csv` | Current, deprecated, historical, and search aliases |
| `canada-region-partition.geojson` | Generated cartographic leaf layer |
| `canada-region-partition-digital.geojson` | Generated complete resolver layer |
| `canada-region-partition.qa.json` | Release evidence, hashes, and source deviations |
| `configuration.yml` | Firmware and radio-setting policy kept separate from geography |

Generated GeoJSON is a build output. The catalog, membership table, generator configuration, and source lock are the authority inputs. Non-geographic search groups never own cells, appear in the map layer, or resolve from a point. A shared repeater area's group name never enters a command; only the canonical paths of its member leaves do.

## Migration from the current map

| Phase | Result | Boundary status |
| --- | --- | --- |
| Generated candidate | 193 exclusive leaves; every digital DA assigned once | Complete and non-overlapping; still proposed |
| Source lock | Statistics Canada, MeshMapper, strategy, and override inputs frozen | Reproducible inputs |
| Generated draft | Every DA assigned; automated QA published | Complete but proposed |
| Local review | Alberta and other fuzzy hub areas corrected; names reviewed in both official languages | Reviewed |
| Active release | Membership and artifacts pass every release check | Authoritative |

MeshMapper remains the main community assignment source where it has a region. Circles and raw source polygons are never promoted or rendered as final regions. Ottawa and Outaouais remain adjacent provincial leaves, and Lloydminster remains split into `lloyd-ab` and `lloyd-sk`. Their shared repeater configurations join canonical member paths without joining the map geometry.

## Repeater configuration rules

Generated instructions must follow the current [official MeshCore CLI documentation](https://docs.meshcore.io/cli_commands/), not copied examples from an older strategy document.

- Use `region def` or `region put` to define the exact tree required by that repeater.
- `name|jump` creates `name` under the current cursor and then moves the cursor to `jump`; `jump` is not the parent of `name`.
- `region def` does not clear the current tree and may leave partial changes after an error.
- A cross-province configuration must use one `can` root with one complete branch per selected leaf. It must not invent a second parent or a shared-area tag.
- A neighbouring U.S. path keeps the hierarchy used by that community. It is a separate root branch and does not become part of `can`.
- Registered shared repeater areas use the same deterministic member order on every repeater. Other large-coverage selections are ordered by canonical hierarchy, not by click order.
- Select paths per repeater role. Do not add every path everywhere.
- Run bare `region` to inspect the result.
- Run `region save` only after the tree and flood permissions are correct.

The setup tool must generate and test commands from registry parent IDs. It must never infer command order by splitting a tag string. The map may outline all selected Canadian leaves together, but each fill remains its original non-overlapping geographic region. Neighbouring U.S. paths appear in commands and labels only. The boundary editor continues to accept one province or territory per proposal; shared repeater membership and neighbouring path metadata are changed in the catalog and reviewed by every affected side.

## Source record

- [MeshCore Canada forum discussion](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54), including the complete-coverage and administrative-building-block discussion in [posts 29–36](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/29), the local-authority discussion in [posts 43–44](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/43), and the discoverability concern in [post 50](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/50).
- Canada MeshCore Region Strategy v1.1.1, dated 2026-06-23. Supplied PDF SHA-256: `9f32d71d2656cfa3abfda4736c3ddb64d1b6e7c5d4e88a7d55b63424f9353a3b`.
- [MeshMapper](https://meshmapper.net/) Canada snapshot `meshmapper-ca-2026-07-12`.
- [Statistics Canada 2021 DA definition](https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/az/definition-eng.cfm?ID=geo021), [2021 Boundary Files guide](https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021001-eng.htm), [2021 dissemination-geography relationships](https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/dguid-idugd/index2021-eng.cfm?year=21), and [2021 Economic Region standard](https://www.statcan.gc.ca/en/subjects/standard/sgc/2021/er-additionalinfo).
- [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/terms-conditions/open-licence).
- MeshCore Canada privacy-safe positioned-node snapshot from [`live.meshcore.ca`](https://live.meshcore.ca/) and [`dev.meshcore.ca`](https://dev.meshcore.ca/), with fixed infrastructure used for decisions and all roles retained only as aggregate context.
- Aggregate resolved-route evidence from [`dev.meshcore.ca`](https://dev.meshcore.ca/) on 2026-07-18. Only area totals are retained.
- [WNY MeshCore radio settings](https://wnymeshcore.org/guides/radio-settings) for `us → us-ny`, the [Pacific Northwest strategy](https://gessaman.com/meshcore/regions/) for `west → pnw → wa` and `west → pnw → or`, and the [RegionMesh state-path convention](https://www.regionmesh.com/meshcore-region-configuration/) for provisional U.S. state paths.
