# MeshCore Canada anonymous submission service

The service creates public review issues for community ideas submitted at
[meshcore.ca/submit-idea](https://meshcore.ca/submit-idea/), without requiring a
GitHub account. MeshMapper owns the published zone boundaries; the former census
boundary submission and approval workflow is retired.

Production remains organization-owned at exactly:

```text
https://api.meshcore.ca:21323/api/meshcore-canada/submissions
```

See [instructions.md](../../instructions.md) for deployment, backup, verification,
and rollback. The production owner must deploy this gateway revision before the
IATA website migration is merged. Repository tests are not deployment evidence.

## HTTP contract

The base path is `/api/meshcore-canada/submissions`.

- `GET <base>/config`: version, public Turnstile key, action
  `meshcore_submission`, `communityIdeaOptionalDetails: true`,
  `boundaryProposals: false`, and `regionAuthority: https://meshmapper.net/`.
- `POST <base>`: envelope
  `{"version":1,"submission":{...},"turnstileToken":"...","website":""}`.
- Accepted schema: `mcc-community-idea/v1`. Required summary, need, and public
  acknowledgement; optional experience/details retain the short-form contract.
- Both `mcc-region-editor-proposal/v1` and `/v2` return HTTP **410** with
  `boundary_editor_retired` before Turnstile verification or external writes.
- `GET/HEAD <base>/previews/<sha256>.png` still serves existing immutable previews;
  unknown hashes return 404. No new boundary previews are created.

Successful community submissions return `ok`, `issueNumber`, `issueUrl`,
`submissionSha256`, and `duplicate`. Canonical UTF-8 JSON uses recursively sorted
keys, unescaped Unicode, compact separators, and no trailing newline. Its SHA-256
is the idempotency key.

The server rejects unknown fields, invalid Unicode, control characters, invalid
source-page URLs, excessive lengths, and nonempty honeypots. Contributor HTML and
mentions are escaped. Browser clients verify the exact GitHub repository URL and
returned hash. No credentials reach the browser.

## Security and ownership

Keep the existing GitHub App restricted to **Issues: read/write** on
`MeshCore-ca/MeshCore-Canada`, implicit metadata access, no Contents permission,
and no webhook. Installation tokens are short-lived and repository-restricted.

Turnstile must validate the hostname and `meshcore_submission` action. Exact
allowlisted origins, POST/Content-Type preflight, no CORS credentials, trusted
proxy validation, and pre/post-verification rate limits remain unchanged.
Never log contributor text, request bodies, tokens, or secrets.

The old approval Action is now manual-only and read-only. It cannot apply a
closed boundary issue. Historical validation/rendering helpers remain available
for archived evidence and tests, not for new submissions.

## Production layout

```text
checkout: /opt/meshcore-canada
state: /var/lib/meshcore-submissions
secrets: /etc/meshcore-submissions
compose project: meshcore-submissions
compose service: submission-gateway
image: meshcore-canada/submission-gateway:production
loopback: 127.0.0.1:8787
public: api.meshcore.ca:21323 (Caddy)
```

Keep `8787` private. Compose runs non-root UID/GID 10001, read-only root and
secret/legacy-authority mounts, dropped capabilities, bounded resources/logs,
and one writable state mount. Preserve the protected environment, App PEM, and
Turnstile files. Leave historical read-only mounts in place during this update.

Port 21323 requires DNS-only Cloudflare or an explicitly configured Spectrum
service; ordinary orange-cloud HTTPS proxying does not cover it. Do not change
the production route, TLS configuration, or firewall as part of a code update.

## Recovery

Back up the SQLite ledger and `previews/` before changing the deployment.
Never delete a confirmed `created` row or an image referenced by an old issue.
Pending rows require checking the signed GitHub hash before manual repair;
GitHub search indexing can lag. Community retries return the existing issue,
rather than creating another.

Key rotation and production tests require the service owner. A rollback to an
old gateway can reopen retired boundary submissions, so keep that route blocked
until the retirement behavior is restored.

## Tests

```sh
python -m pip install -r tools/region-proposal-gateway/requirements.txt
python -m unittest discover -s tools/region-proposal-gateway/tests -v
python -m unittest discover -s tests/automation -v
node --test tests/editor/*.test.mjs
python scripts/validate_community_submission.py
```

Tests use mocked external services, not live credentials. They cover community
validation, CORS, Turnstile, App permissions, canonical hashes, idempotency,
both retired schemas with no side effects, old preview downloads, and historical
boundary validation/rendering.
