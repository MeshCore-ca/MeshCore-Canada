# Maintaining IATA regions

The website ships reviewed snapshots. A live upstream change never rewrites the
map or sends commands to repeaters.

## Review a MeshMapper update

The **Review MeshMapper changes** Action runs weekly on `main` and can also be
started manually there. It fetches the public Canadian zones, validates their
geometry, and compares names, centres and boundaries. No change means no issue
update. A change opens or updates one bot-owned review issue and saves the
candidate GeoJSON and comparison as a 30-day artifact.

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
