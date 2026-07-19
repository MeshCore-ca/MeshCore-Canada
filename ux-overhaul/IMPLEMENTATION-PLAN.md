# Consolidated overhaul implementation plan

All phases land in one pull request, but each phase remains independently
reviewable and must pass its own gate before dependent work begins.

## Phase 0 — Containment and source authority

- quarantine empty, incorrect, and unverified pages from primary navigation;
- add backup/data-loss guidance before erase operations;
- repair known malformed pages and directory drift;
- remove tracked `site/` output and ignore it;
- exclude asset-only routes from page discovery;
- add a recoverable 404 and baseline metadata;
- secure the observer command builder's credential inputs.

Gate: existing region/gateway tests and strict MkDocs build remain green.

## Phase 1 — Foundation

- add validated page metadata and lifecycle rules;
- add semantic design tokens, light/dark palettes, shared shell, components,
  breadcrumbs, metadata bar, feedback, and page-scoped assets;
- introduce six-category task navigation and redirect registry;
- add content, link, sitemap, accessibility, browser, visual, and performance
  test foundations.

Gate: ordinary pages load no region/editor/submission application bundle and
the shell passes keyboard/mobile/contrast checks.

## Phase 2 — Start and communities

- rebuild the homepage around goals;
- add Start, role comparison, role journeys, verification, and help;
- migrate all community entries into one validated data source;
- generate community and province views with search/list-first behavior.

Gate: newcomer and community discovery critical paths pass without a map.

## Phase 3 — Domain journeys

- rebuild devices, recommendations, builds, and destructive firmware journeys;
- rebuild Analyzer/MQTT around a method chooser, secure builder, verification,
  and symptom-first troubleshooting;
- retain `HUMAN REVIEW REQUIRED` status for unverified domain claims.

Gate: all destructive pages meet the safety template and domain review
requirements are explicit.

## Phase 4 — Region applications

- extract configurator domain modules and golden fixtures;
- redesign configurator/map using normal/advanced progressive disclosure;
- extract editor proposal state/domain modules;
- add explicit v1/v2 entry, structured CSD selection, deliberate anchor,
  draft recovery, safe undo/redo, accessible review, and trusted text preview;
- preserve every gateway, signature, proposal, geometry, and authority check.

Gate: exact domain fixtures plus keyboard/mobile E2E for v1 and v2.

## Phase 5 — Launch quality

- finish search, SEO, privacy, French-ready architecture, performance, and
  accessibility;
- reconcile all audited routes;
- build staging from the integration commit;
- deploy only the namespaced output to the existing Pi 5 `splashpage`
  container at `/meshcore-canada/`;
- run live smoke and regression checks;
- push the branch and open one reviewable pull request with evidence.

Gate: full definition of done and Pi 5 staging proof. Production merge remains
a maintainer action.

## Parallel ownership

- Integration lead: shared files, architecture, branch, gates, staging, PR.
- P0 audit: read-only containment evidence.
- Foundation audit: read-only theme/content/CI architecture evidence.
- Pi 5 audit: read-only `splashpage`, mounts, routes, disk, and deployment
  conventions.

File ownership is reassigned only after the initial audits return.
