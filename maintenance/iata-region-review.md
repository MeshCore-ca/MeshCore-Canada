# Maintaining IATA regions

The website ships snapshots of MeshMapper's zones API. Simple upstream changes
are published nightly; anything larger waits for a person. Nothing here ever
sends commands to repeaters.

## Review a MeshMapper update

The **Review MeshMapper changes** Action runs nightly at 07:23 UTC on `main` and
can also be started manually there. It uses the [official Zones API](https://wiki.meshmapper.net/zones-api/),
not the homepage or its private map endpoints. It validates drawn geometry and
compares names, centres, URLs, groups and boundaries.

**Simple changes publish themselves.** A change is simple when no zone was added
or removed, every boundary is valid, only boundaries, centres or groups changed
(a renamed zone waits for a person), and every region on the combined map,
including planning areas, changed by less than 1% of its area and reaches no more
than 5 km beyond its old outline. Reach ignores pieces under 5 hectares (rebuild
slivers between zones), so a thin spike ending in a town still counts. Both limits
are measured against the map from the last commit a person made to it, so nightly
changes cannot add up unseen. Rounding and the routine YOW and YXX edits of
2026-11-01 reached under 1 km; the redrawn YQB and YUL reached 21 and 111 km. The
job then rebuilds the map, runs the region validators, geometry check and region
tests, and commits to `main` with `MCC_BOUNDARY_PUSH_TOKEN` (an admin token, so it
can bypass the review rule). That push starts the normal CI, which gates the
deploy. The limits are `simpleChangePercent` and `simpleShiftKm` in
`scripts/promote-meshmapper-snapshot.mjs`.

**Everything else waits for a person.** The job opens or updates one bot-owned
review issue that says why it did not publish, and saves the candidate GeoJSON
and comparison as a 30-day artifact. A clean comparison, including one after an
automatic publish, closes that issue, preserving notes outside its generated
summary. The job fails early if the publishing token stops working.

The importer uses `get_zones.php?country=CA`, followed by each returned site's
`get_geojson.php`. It accepts the API's 2–6-character region codes, preserves
GeoJSON coordinates, and keeps `geometry: null` for regions without a drawn
boundary. Disabled regions are absent from the directory. API groups are metadata,
not instructions to add new on-air scopes.

The importer requires a Canada-wide integration key in `MESHMAPPER_API_KEY`.
Configure the same name as a GitHub Actions secret; never put the key in source,
URLs, site assets or browser code. The v1.5.117 read APIs require `X-API-Key`,
including conditional requests. A regional key can return only part of Canada:
the importer stops if approved regions disappear. Use `--allow-region-removals`
only after checking the key's geographic access and confirming actual removals.
The key must not be limited to certain IPs: GitHub-hosted runners change address
on every run, and MeshMapper refuses them with `403 ip_not_allowed`. Failed
requests log MeshMapper's error code.

Parsed responses are kept for 24 hours in the private, ignored
`.tmp/meshmapper-api-cache.json`, bound to a credential fingerprint and `CA`.
Credential changes discard the old cache; HTTP 401/403 discard authorized data.
This cache is not uploaded or placed in the shared Actions cache. The nightly job
fetches a fresh candidate and publishes only that review artifact, never the key.

Requests are spaced by at least 2.2 seconds, below the shared 30-per-minute read
budget. Every network read, including HTTP 304, counts toward the key's quota
(normally 1,000 reads per UTC day). Later requests send `If-None-Match`.
HTTP errors stop without replacing the candidate and retain a `Retry-After`
cooldown. Timeouts and incomplete JSON retain the previous copy and defer retries
for 24 hours. Do not scrape pages or use private endpoints as a fallback.

The API candidate uses snapshot schema v2; the reviewer also accepts the older
v1 approved snapshot. `has_boundary: true` may still return `geometry: null`
when a stored boundary cannot be used. Keep that metadata and flag the region
for review; do not manufacture a polygon. A region without usable geometry remains
visible in the review report, but is not a polygon to publish. The map builders
skip null geometry; never invent a circle for it. Coordinate with the region's
owner before promoting its boundary. The existing approved map stays unchanged
until a separate boundary review is completed.

Geometry problems are reported in the review issue and its candidate-bound
`geometry.json` artifact instead of preventing the issue from being created.
The publication validators remain strict: never promote a candidate with an
invalid polygon, an unresolved centre, or a missing usable boundary.

The authenticated 2026-10-13 check found a self-intersecting YQB polygon and a
substantial YUL change, so the map kept its pre-API snapshot (see
`maintenance/meshmapper-api-review-2026-10-13.json`). On 2026-11-01 YQB was fixed
in MeshMapper, the YUL change was confirmed, and the first API snapshot replaced
the old homepage-feed copy. It added MeshMapper's Halifax (YHZ) and Saint John
(YSJ) zones, which replaced the starter regions with the same codes. A successful
fetch is still not approval to replace the map.

Gap assignments consider every eligible published regional centre as well as
starter hubs. Never distribute all leftover land among only newly added hubs.
Extensions reuse the nearby IATA code but remain separate planning features in the
combined v2 GeoJSON. Do not union them into or relabel the original published
polygon. Feature keys are (tag, regionSource); the catalogue has one entry per code.

The geometry check includes named towns between regions, a national half-degree
sample grid against all eligible centres, and an order-independence check. Full
coverage and valid polygons alone are not enough to approve a boundary update.

### Publish a reviewed candidate

```sh
gh run download <run id> -n meshmapper-review -D .tmp/meshmapper-review
node scripts/promote-meshmapper-snapshot.mjs --check
node scripts/promote-meshmapper-snapshot.mjs
```

The review issue gives the exact run id. `--check` reports without writing
anything. Without it, the script replaces
`docs/assets/regions/meshmapper-iata-boundaries.geojson` and regenerates the
combined map and catalogue. It needs the region tools
(`pip install -r scripts/requirements-regions.txt`); set `PYTHON` if `python3`
is not the interpreter that has them.

It writes nothing, and says what to change, when:

- the file did not come from the zones API;
- a boundary is invalid, unusable, or does not contain its centre (fix it in
  MeshMapper and fetch again);
- a new region needs its provinces in `zoneProvinces` in
  `data/iata-scope-policy.json` (it suggests the province containing the centre;
  add any other province the region serves);
- a region was removed, lost its boundary, or still has a profile record;
- MeshMapper now publishes a starter code. Remove that starter only after
  agreeing how its old planning area will be reassigned.

Regions MeshMapper lists without a boundary are kept in the snapshot but left off
the map, so the nightly review does not report them again. Validators only accept
API snapshots.

After promoting, look at the map, run `node scripts/validate-regions.cjs`,
`python scripts/verify-iata-geometry.py` and `npm run test:content`, then commit.
Never reactivate the retired census-boundary publisher.

## Region contacts and settings

The current country scope is `can`, as in the archived census catalogue. An earlier
preview used `ca`; preparation preserves any such existing entry, and the migration
comparison makes any later removal explicit. The retired optional California
`west/ca` suggestion remains outside the current choices pending a separate review.
Saved selections containing it require review; no U.S. scope is silently renamed.

`onny` is an independent, opt-in Ontario–New York label, available under neighbouring
networks and in the ON/QC repeater guide. It is never added automatically. Operators
along the intended path must agree to carry it and test the shared channel both
ways; adding it neither changes local channels nor announces a rollout.

`data/iata-region-profiles.json` contains optional records keyed by lowercase IATA
code. Missing records mean **no maintainer listed**, **settings unconfirmed** and
**local rollout unconfirmed**. A published MeshMapper zone is not an adoption announcement.
Community links come from public directory reference points, not appointments.

To record local rollout, add a separate `rollout` record with `phase` (`preparing`,
`cutover-announced` or `active`), `checkedAt` (`YYYY-MM-DD`) and an HTTPS `evidence`
link to the local announcement. The date records the check, not an automatic
activation time; the announcement must explain timing and neighbouring-operator
coordination. Unknown regions keep `phase: unconfirmed` with null date/evidence.
Never infer rollout from map publication, radio adverts or directory contact checks.
The ON/QC timetable does not apply to other provinces. Update English/French
guidance together, and test the exact PR candidate on preview before publication.

To record a volunteer, use `maintainer` with `name`, an HTTPS `contact`, and an
HTTPS `evidence` link showing their public consent. To confirm local settings,
use `settingsReview` with `status: confirmed`, `checkedAt: YYYY-MM-DD`, and an
HTTPS `evidence` link to the agreed settings. Update the community directory if
those settings differ from its listing. A contact check is not RF confirmation.
The site flags confirmations older than six months for another check.

The region card's contribution links prefill the existing idea form for a
maintainer, settings confirmation or boundary refinement. Submission never
appoints someone or changes a boundary automatically. Ask neighbouring operators
before refining a planning region, especially at provincial and published-zone
edges. Keep the code stable where possible; document any migration when it changes.
