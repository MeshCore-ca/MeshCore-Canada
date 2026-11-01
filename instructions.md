# MeshCore Canada anonymous submission service

This organization-owned service accepts community ideas without a GitHub account.
Canadian zone boundaries now come from MeshMapper. The former census boundary
editor and its approval-to-main workflow are retired.

## IATA migration: deploy the gateway before merging

The production owner must:

1. Record the running commit and image. Stop only `submission-gateway` long enough
   to back up `/var/lib/meshcore-submissions`, including the ledger and previews.
2. Deploy the reviewed PR commit using the existing service, secrets, GitHub App,
   Caddy route, DNS, and ports. Do not create a replacement App or host.
3. Run the health, config, CORS, and preflight checks below. Confirm
   `boundaryProposals: false` and `communityIdeaOptionalDetails: true`.
4. Confirm both `mcc-region-editor-proposal/v1` and `/v2` return HTTP 410 with
   `boundary_editor_retired`, without consuming Turnstile tokens, creating issues,
   or rendering previews. Unit tests cover these no-side-effect guarantees.
5. Confirm an existing immutable preview URL still loads. Do not prune historical
   issues, browser drafts, ledger rows, or preview images.
6. Test the community form signed out, with approval for any public test issue.
   Record the candidate SHA and results in the PR before merging.

The retired Action has no issue-closure trigger and no write permission.
Closing an old boundary issue must not change `main`. Do not enable the former
boundary publisher or create its push token. Owners may retire
`MCC_BOUNDARY_PUSH_TOKEN` and the boundary-only verification secret after checking
that no other workflow uses them; keep the App PEM and Turnstile secret used by
community submissions.

This PR does not deploy the gateway or alter any repeater. The remaining setup
sections are for an administrator who needs to provision or recover the existing
service; they are not permission to change production.

The fixed public endpoint is:

```text
https://api.meshcore.ca:21323/api/meshcore-canada/submissions
```

## Responsibility and rollback boundary

Repository work must pass CI on the exact review commit. The production owner
must separately verify the host, protected mounts, TLS, Turnstile, GitHub App,
rollback image, and signed-out community journey. Do not infer deployment from
a green PR.

For a failed gateway update, restore the recorded image without deleting state.
An old image may accept retired boundary schemas again: block those submissions
or keep the gateway stopped until the retirement fix is restored. Community
fallback links to GitHub remain available. Reverting the website alone must not
reactivate boundary publishing.

## HTTP behavior

- Community ideas: `mcc-community-idea/v1`, unchanged public review issues.
- Boundary proposals: HTTP 410, no new issue or preview.
- Existing preview GET/HEAD URLs: unchanged.
- Region map/configurator: checked-in MeshMapper snapshot; no runtime gateway call.
- `/config/editor/`: bilingual retirement page and browser-local draft download.

## 1. Create the GitHub App

While signed in as a `MeshCore-ca` organization owner or GitHub App manager,
open the [pre-filled App registration](https://github.com/organizations/MeshCore-ca/settings/apps/new?name=MeshCore%20Canada%20Submissions&description=Creates%20public%20review%20issues%20for%20anonymous%20MeshCore%20Canada%20ideas&url=https%3A%2F%2Fmeshcore.ca%2F&public=false&issues=write&webhook_active=false).

Confirm:

- App name: `MeshCore Canada Submissions`
- Homepage: `https://meshcore.ca/`
- Callback URL: blank
- Webhook: disabled
- Repository permission: **Issues — Read and write**
- All other repository and organization permissions: **No access**
- Availability: private to the organization

After creating it:

1. Record the **Client ID**.
2. Generate and securely save one private-key PEM.
3. Install the App on `MeshCore-ca`.
4. Select **Only select repositories** and choose only `MeshCore-Canada`.
5. Record the numeric installation ID from the installation URL.

Do not use a personal access token. The service requests a short-lived token
restricted again to this repository and `issues: write`.

## 2. Create the Turnstile widget

In a Cloudflare account owned by MeshCore Canada, create a Managed Turnstile
widget:

- Name: `MeshCore Canada Submissions`
- Mode: **Managed**
- Allowed hostnames: `meshcore.ca` and `config.meshcore.ca`
- Pre-clearance: disabled

Record the public site key and secret key. The configured action returned by
the API is `meshcore_submission`. Only the public site key reaches browsers;
the secret stays on the host.

## 3. Configure DNS and the network

Create `api.meshcore.ca` in the MeshCore Canada DNS account and point it to the
production host with an `A`, `AAAA`, or appropriate `CNAME` record.

Port `21323` is not supported by Cloudflare's ordinary orange-cloud HTTPS
proxy. If Cloudflare DNS is used, set this record to **DNS only** (gray cloud),
so clients connect directly to the MeshCore Canada host. Cloudflare Spectrum
is an alternative only if MeshCore Canada already has it and deliberately
configures TCP/TLS forwarding for `21323`; the normal proxy is not a substitute.

Allow inbound TCP `21323` in both the provider firewall and host firewall.
Caddy also needs inbound `80` and/or `443` for normal ACME validation unless
DNS challenge or an existing managed certificate is deliberately configured.
Allow outbound HTTPS to GitHub, Turnstile, and the selected ACME provider.

Do **not** expose container port `8787`; it must remain on loopback.

## 4. Check out the pull request before merging

The supplied paths and Compose defaults are:

```text
checkout: /opt/meshcore-canada
state:    /var/lib/meshcore-submissions
secrets:  /etc/meshcore-submissions
service:  submission-gateway
image:    meshcore-canada/submission-gateway:production
```

On the production host:

```sh
PR_NUMBER=NN  # replace NN with the pull-request number
sudo git clone https://github.com/MeshCore-ca/MeshCore-Canada.git \
  /opt/meshcore-canada
sudo git -C /opt/meshcore-canada fetch origin \
  "pull/${PR_NUMBER}/head:submission-pr-${PR_NUMBER}"
sudo git -C /opt/meshcore-canada switch "submission-pr-${PR_NUMBER}"
sudo git -C /opt/meshcore-canada status --short --branch
sudo git -C /opt/meshcore-canada rev-parse HEAD
```

If the checkout already exists, omit `clone`, fetch the PR again, and reset
only by switching to the freshly fetched branch. The status must be clean.
Record the tested commit SHA.

## 5. Install protected configuration

The container runs as UID/GID `10001`.

```sh
sudo install -d -o 10001 -g 10001 -m 0700 \
  /var/lib/meshcore-submissions
sudo install -d -o root -g root -m 0700 \
  /etc/meshcore-submissions
sudo install -o root -g root -m 0600 \
  /opt/meshcore-canada/tools/region-proposal-gateway/environment.example \
  /etc/meshcore-submissions/environment
sudoedit /etc/meshcore-submissions/environment
```

Set the three non-secret values:

```text
TURNSTILE_SITE_KEY=<public site key>
GITHUB_APP_CLIENT_ID=<GitHub App client ID>
GITHUB_APP_INSTALLATION_ID=<numeric installation ID>
```

Keep these existing path values:

```text
MCC_REPO_ROOT=/opt/meshcore-canada
SUBMISSION_STATE_DIR=/var/lib/meshcore-submissions
SUBMISSION_SECRET_DIR=/etc/meshcore-submissions
SUBMISSION_IMAGE_TAG=production
```

Install the two secrets separately:

```sh
sudo install -o 10001 -g 10001 -m 0600 \
  /secure/download/location/meshcore-canada-submissions.private-key.pem \
  /etc/meshcore-submissions/github-app.pem
sudoedit /etc/meshcore-submissions/turnstile
sudo chown 10001:10001 /etc/meshcore-submissions/turnstile
sudo chmod 0600 /etc/meshcore-submissions/turnstile
sudo stat -c '%u:%g %a %n' \
  /etc/meshcore-submissions/github-app.pem \
  /etc/meshcore-submissions/turnstile
```

Paste only the Turnstile secret into `turnstile`. Both secret files must show
`10001:10001 600`. Never place them in Git, an issue, Discord, email, browser
configuration, the Compose environment file, or command history.

## 6. Start the branch deployment

The host clock must be synchronized because GitHub App JWTs are time-bound.

```sh
timedatectl show -p NTPSynchronized --value
sudo ss -ltnp '( sport = :8787 or sport = :21323 )'
curl -fsS -o /dev/null https://api.github.com/
curl -fsS -o /dev/null \
  https://challenges.cloudflare.com/turnstile/v0/api.js

cd /opt/meshcore-canada/tools/region-proposal-gateway
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml config
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml up -d --build
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml ps
curl -fsS http://127.0.0.1:8787/healthz
```

The clock command must print `yes`, Compose must resolve without placeholders,
the service must be healthy, and loopback health must return `{"ok":true}`.

## 7. Configure Caddy and TLS on port 21323

Merge or import
`tools/region-proposal-gateway/Caddyfile.example` into the production Caddy
configuration. Do not overwrite unrelated sites. It terminates TLS at:

```text
https://api.meshcore.ca:21323
```

and proxies only `/api/meshcore-canada/submissions` and its children
(`/config` and immutable `/previews/...png`) to `127.0.0.1:8787`. Validate and
reload:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
sudo ss -ltnp '( sport = :21323 or sport = :8787 )'
```

Expected listeners are Caddy on public `21323` and the gateway on
`127.0.0.1:8787`. If Caddy runs in a container, keep the gateway private and
set `TRUSTED_PROXY_CIDRS` to the exact proxy address instead of broad networks.

## 8. Verify the public API before merging

```sh
API='https://api.meshcore.ca:21323/api/meshcore-canada/submissions'

curl -fsS "$API/config"

curl -si \
  -H 'Origin: https://meshcore.ca' \
  "$API/config"

curl -si -X OPTIONS \
  -H 'Origin: https://meshcore.ca' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  "$API"

curl -si \
  -H 'Origin: https://example.invalid' \
  "$API/config"

MISSING_PREVIEW="$(printf '0%.0s' {1..64})"
curl -si "$API/previews/$MISSING_PREVIEW.png"
```

Required evidence:

- TLS validates for `api.meshcore.ca` on port `21323`.
- Config returns HTTP 200 with version `1`, the correct public site key, and
  `turnstileAction` equal to `meshcore_submission`, `boundaryProposals: false`,
  and `communityIdeaOptionalDetails: true`.
- The allowed request returns
  `Access-Control-Allow-Origin: https://meshcore.ca`.
- OPTIONS returns HTTP 204 and allows `POST` plus `Content-Type`.
- The invalid origin is denied and receives no allow-origin header.
- The unknown preview returns HTTP 404 and no CORS header.
- Public port `8787` remains unreachable.

Do not merge until these checks pass.

## 9. Merge, publish, and switch to `main`

1. Merge the reviewed pull request.
2. Wait for the repository validation and `Deploy MkDocs site` workflow.
3. Confirm the new pages and JavaScript are live at `meshcore.ca`.
4. Switch the service checkout to the exact published `main` revision:

```sh
sudo git -C /opt/meshcore-canada fetch origin
sudo git -C /opt/meshcore-canada switch main
sudo git -C /opt/meshcore-canada pull --ff-only origin main
cd /opt/meshcore-canada/tools/region-proposal-gateway
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml up -d --build
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS \
  'https://api.meshcore.ca:21323/api/meshcore-canada/submissions/config'
```

Community submissions do not depend on changing map boundaries. Keep existing
read-only historical mounts during this migration; removing them is separate maintenance.

## Operations and rollback

Routine checks:

```sh
cd /opt/meshcore-canada/tools/region-proposal-gateway
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml ps
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml logs --tail=100 submission-gateway
curl -fsS http://127.0.0.1:8787/healthz
```

- To stop submissions without affecting GitHub Pages or existing issues, stop
  only `submission-gateway`.
- To roll back the website, revert the responsible commit on `main` and let the
  normal Pages workflow publish the revert. Do not force-push production.
- Before migration or ledger maintenance, stop the gateway and back up
  `/var/lib/meshcore-submissions`. This includes the ledger and issue preview
  PNGs. Never delete a confirmed `created` row or a preview referenced by an
  issue.
- If a row remains `pending`, audit GitHub for its signed hash before changing
  the ledger; search indexing is eventually consistent.
- Rotate the GitHub App PEM by installing a new key, restarting and testing,
  then revoking the old key. Rotate the Turnstile secret and protected file
  together.
- Keep Caddy and container logs bounded. Never add request bodies, tokens,
  secrets, or contributor text to logs.
- The ordinary Cloudflare proxy must remain off for this port unless a tested
  Spectrum configuration replaces the DNS-only path.

## Administrator completion checklist

- [ ] Exact PR commit, tests, and rollback image recorded.
- [ ] State backup verified; historical previews and ledger preserved.
- [ ] Only the existing submission service rebuilt; no DNS, port, or credential changes.
- [ ] Health, TLS, CORS, preflight, and least-privilege App checks pass.
- [ ] Config advertises community ideas and boundary retirement.
- [ ] Both boundary schemas return 410 without side effects.
- [ ] Existing preview URL works; unknown preview returns 404.
- [ ] Signed-out community submission verified with permission.
- [ ] Retired approval Action cannot push to main.
- [ ] Merge and Pages publication happen only after owner approval.
