# MeshCore Canada

Community documentation and network tools for [meshcore.ca](https://meshcore.ca/),
in English and French. Built with MkDocs Material and small browser scripts.

## Work locally

Use Python 3.13 and Node.js 22.19 or newer. From the repository root:

```sh
python -m pip install -r requirements-docs.txt
npm ci
npm run docs:build
python -m http.server 4173 --bind 127.0.0.1 --directory .tmp/site
```

Open `http://127.0.0.1:4173/`. Rebuild after editing. Build output belongs in
`.tmp/`, not in a commit. `npm run docs:build:preview` builds for subpath hosting.

## Where to make changes

- Pages: `docs/`. Update each English `.md` and French `.fr.md` pair; retain old
  heading anchors when changing titles.
- Navigation, theme, and shared templates: `mkdocs.yml` and `overrides/`.
- Community listings: `data/communities.json` and `data/communities.fr.json`.
  Run `python scripts/validate-communities.py --write` after editing the source.
  It generates the directory pages and `docs/assets/radio-profiles.json`.
  Keep `data/community-search-anchors.json` in sync when adding listings. These
  are approximate search references, not claimed radio locations or coverage.
- Region tools: `docs/assets/regions/`, using published MeshMapper IATA zones
  plus explicitly labelled MeshCore Canada starter regions.
  Scope policy lives in `data/iata-scope-policy.json`. Follow the refresh steps
  below; the former census boundary editor no longer accepts proposals.
- Broker settings: `docs/analyzer/observer-config.json`. The build generates the
  broker reference table from this file, including its no-JavaScript version.
- Anonymous submissions: `tools/region-proposal-gateway/`. The site and gateway
  deploy separately; check the gateway README before changing their contract.
- Header totals: `docs/assets/javascripts/network-status.js` reads public Beacon
  aggregates and caches them per tab for five minutes. City search uses Natural
  Resources Canada's current Geolocator API, only when a search is submitted.
- Homepage art: run `python scripts/generate-home-hero.py` after installing the
  region dependencies to regenerate the decorative SVG from existing geography.
  Compare the custom header with Material's template when upgrading the theme.

Never commit credentials, private keys, precise private locations, or test
submissions containing personal information. Human maintainers review changes
before publication; an automated test is not hardware or policy approval.

## Check a change

```sh
python scripts/validate-content.py
python scripts/validate-communities.py
python scripts/validate_community_submission.py
python -m unittest discover -s tests/content -p "test_*.py"
npm run test:content
npm run test:editor
npm run check:links
npx playwright install chromium firefox webkit
npm run test:browser
npm run audit:lighthouse
```

The broker-helper tests need Bash and PowerShell (`pwsh`); on Windows they use
Git Bash. They run in temporary directories, do not install software, and never
connect to a real broker. Browser submission tests intercept requests locally.

For region, gateway, or automation changes, also run:

```sh
python -m pip install -r scripts/requirements-regions.txt
python -m pip install -r tools/region-proposal-gateway/requirements.txt
node scripts/validate-regions.cjs
python scripts/verify-iata-geometry.py
node scripts/validate-legacy-region-data.cjs
python scripts/verify-region-geometry.py
python scripts/verify-region-geometry.py --partition docs/assets/regions/canada-region-partition-digital.geojson
python -m unittest discover -s tools/region-proposal-gateway/tests
python -m unittest discover -s tests/automation
```

The quality workflow runs these checks on pull requests. Publishing is a separate
reviewed workflow; opening a PR does not authorize deploying it or changing brokers.
See [the September audit follow-up](maintenance/site-audit-2026-09-04.md) for the
current fixes, test coverage, and confirmations still needed from maintainers.

## Refresh MeshMapper zones

```sh
node scripts/fetch-meshmapper-regions.mjs .tmp/meshmapper-canada-current.geojson
```

Review the Canadian zone list and complete published polygons before replacing
`docs/assets/regions/meshmapper-iata-boundaries.geojson`. The importer fails if a
polygon is missing; do not substitute circles or nearest-airport areas. Update
`data/iata-scope-policy.json` for new/removed zones, then run:

```sh
python scripts/build-iata-boundaries.py
node scripts/build-iata-catalog.mjs
node scripts/validate-regions.cjs
python scripts/verify-iata-geometry.py
```

`iata-regions.json` and the compatibility URL `canada-regions.json` are identical
generated catalogues. `iata-boundaries.geojson` combines unchanged published zones
with the six starter assignments in `data/iata-starter-regions.json`.
`scope-jurisdictions.geojson` identifies the physical province and supplies broad
starter outlines; it does not alter MeshMapper boundaries. Labrador's outline
comes from official divisions 10 and 11, recorded in
`data/iata-labrador-outline.geojson`. To refresh that input, pass the SHA-256-locked
Statistics Canada CD ZIP to `python scripts/build-iata-boundaries.py --labrador-source <zip>`.
The generator subtracts published zones from starters and refuses a code collision;
review the starter's retirement when MeshMapper publishes the same code.
The old catalogue lives
in `maintenance/legacy-regions/` with its original geography retained for history.
See [the migration audit](maintenance/iata-scope-migration-2026-09-24.md) for scope
decisions, firmware support, migration risks, and deployment checks.
