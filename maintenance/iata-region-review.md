# Maintaining IATA regions

The website ships reviewed snapshots. A live upstream change never rewrites the
map or sends commands to repeaters.

## Review a MeshMapper update

The **Review MeshMapper changes** Action runs weekly on `main` and can also be
started manually there. It uses the [official Zones API](https://wiki.meshmapper.net/zones-api/),
not the homepage or its private map endpoints. It validates drawn geometry and
compares names, centres, URLs, groups and boundaries. No change means no issue
update. A change opens or updates one bot-owned review issue and saves the
candidate GeoJSON and comparison as a 30-day artifact.

The importer uses `get_zones.php?country=CA`, followed by each returned site's
`get_geojson.php`. It accepts the API's 2–6-character region codes, preserves
GeoJSON coordinates, and keeps `geometry: null` for regions without a drawn
boundary. Disabled regions are absent from the directory. API groups are metadata,
not instructions to add new on-air scopes.

Responses are cached for one hour in `.tmp/meshmapper-api-cache.json`; later
requests use `If-None-Match` and reuse the body on HTTP 304. The weekly workflow
retains this public-response cache between runs. Requests are spaced below the
shared 60-per-minute limit. HTTP errors stop the run without replacing the candidate;
429 reports `Retry-After` rather than immediately retrying.

The API candidate uses snapshot schema v2; the reviewer also accepts the older
v1 approved snapshot. An enabled region with no boundary remains visible in the
review report, but is not a polygon to publish. Do not copy a null geometry into
the active polygon-only map input or invent a circle for it. Coordinate with the
region's owner before promoting its boundary. The existing approved map stays
unchanged until a separate boundary review is completed.

Gap assignments consider every eligible published regional centre as well as
starter hubs. Never distribute all leftover land among only newly added hubs.
Extensions reuse the nearby IATA code but remain separate planning features in the
combined v2 GeoJSON. Do not union them into or relabel the original published
polygon. Feature keys are (tag, regionSource); the catalogue has one entry per code.

The geometry check includes named towns between regions, a national half-degree
sample grid against all eligible centres, and an order-independence check. Full
coverage and valid polygons alone are not enough to approve a boundary update.

Download the candidate from the linked run. Review it before replacing
`docs/assets/regions/meshmapper-iata-boundaries.geojson`. Update the province
assignments in `data/iata-scope-policy.json` for any new code. If MeshMapper now
publishes a starter code, remove that starter only after agreeing how its old
planning area will be reassigned. The generator intentionally stops on a collision.

Regenerate with `python scripts/build-iata-boundaries.py` and
`node scripts/build-iata-catalog.mjs`. Run the geometry, content and browser checks,
and verify the exact candidate on the preview in both languages. Merge through a
reviewed PR. Never reactivate the retired census-boundary publisher.

## Region contacts and settings

`data/iata-region-profiles.json` contains optional records keyed by lowercase IATA
code. Missing records mean **no maintainer listed** and **settings unconfirmed**.
Community links come from public directory reference points, not appointments.

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
