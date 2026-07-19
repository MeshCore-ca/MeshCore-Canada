# UI/UX overhaul decisions

This log records architecture and delivery decisions for the consolidated
overhaul branch.

## D-001 — Preserve MkDocs and static hosting

**Status:** Accepted

MkDocs Material remains the site framework. Theme overrides, structured data,
generated content, and route-scoped progressive enhancement are sufficient for
the required experience. A large client framework would add operational and
accessibility risk without solving a demonstrated requirement.

## D-002 — One consolidated pull request

**Status:** Owner decision

The handoff's phases remain the dependency and validation order, but all
reviewable commits will be presented in one pull request. The PR description
will provide a commit/surface map so reviewers can review it in slices.

## D-003 — One lead owns shared files

**Status:** Accepted

Only the integration lead edits `mkdocs.yml`, `.gitignore`, theme overrides,
global design tokens, navigation, redirect authority, shared schemas, and
deployment workflows. Parallel work uses non-overlapping ownership or returns
read-only findings.

## D-004 — Source authority excludes generated output

**Status:** Accepted

`docs/`, structured data, theme source, and application source are authority.
`site/` is disposable build output and must not be committed. Staging packages
are built from a known commit.

## D-005 — Route migration is staged

**Status:** Accepted

The first integration stage changes labels, grouping, canonical journeys, and
redirects while preserving current URLs. Files move only when the redirect
registry and link tests prove compatibility.

## D-006 — Progressive enhancement and route-scoped assets

**Status:** Accepted

Ordinary content must work without JavaScript. Only tokens, typography, shell,
and minimal bootstrap code load globally. Configurator, map, editor,
submission, and command-builder assets load on their own routes.

## D-007 — Region behavior is frozen during UI work

**Status:** Accepted

Region authority, proposal, command, signature, approval, and regeneration
semantics are protected by exact fixtures. Client validation improves feedback
but never becomes authority.

## D-008 — Pi 5 staging is isolated under the existing splash page

**Status:** Owner decision

The test build is served from the existing `splashpage` Docker container at:

`https://canadaverse.org/meshcore-canada/`

The Canadaverse homepage and existing routes are not redesigned or replaced.
The staging deployment adds a namespaced subtree and follows the container's
existing mounts, ownership, health checks, and reverse-proxy conventions.

## D-009 — Production remains GitHub Pages

**Status:** Accepted

The Pi 5 is a staging surface only. The reviewed end state is deployed to
`meshcore.ca` through the MeshCore Canada repository's existing GitHub Pages
pipeline after maintainers merge the consolidated PR.

## D-010 — Human review is explicit, not a project-wide stop

**Status:** Accepted

Unverified hardware, firmware, local-policy, community, translation, analytics,
retention, and production-operation decisions are marked `HUMAN REVIEW
REQUIRED`. Independent implementation and validation continue.
