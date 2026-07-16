# MeshCore Canada anonymous submission service

Give this file to the MeshCore Canada administrator. It activates one
MeshCore Canada-owned service for both public community ideas and region
boundary proposals. Contributors do not need GitHub accounts.

## Do not merge PR #39 first

Provision and verify the service from the PR branch before merging. The safe
order is:

1. Create the organization-owned GitHub App and Turnstile widget.
2. Deploy the PR branch on the MeshCore Canada production host.
3. Configure DNS, firewall, Caddy, TLS, health, and CORS.
4. Merge PR #39 only after the public API checks pass.
5. Let the existing GitHub Pages workflow publish `main`.
6. Switch the host checkout to `main`, rebuild, and test both forms signed out.

The fixed public endpoint is:

```text
https://api.meshcore.ca:21323/api/meshcore-canada/submissions
```

Do not substitute another hostname, route, or port without changing and
reviewing both browser clients, tests, Caddy, and deployment configuration.

## What is being deployed

```text
meshcore.ca/submit-idea/       community idea (static GitHub Pages form)
meshcore.ca/config/editor/     boundary proposal (static GitHub Pages editor)
              | HTTPS POST, Turnstile token, no GitHub login
              v
api.meshcore.ca:21323/api/meshcore-canada/submissions
              | short-lived repository-restricted installation token
              v
MeshCore Canada GitHub App -> MeshCore-ca/MeshCore-Canada issue
```

The API accepts two strict schemas:

- `mcc-community-idea/v1` creates a public community-idea issue.
- `mcc-region-editor-proposal/v1` revalidates the proposed census-cell moves
  against the mounted region authority, then creates a public boundary issue.

The service creates issues only. It cannot change repository contents or make
a boundary live. The GitHub App, Turnstile account, DNS, host, TLS, secrets,
and repository installation must all be controlled by MeshCore Canada.

## 1. Create the GitHub App

While signed in as a `MeshCore-ca` organization owner or GitHub App manager,
open the [pre-filled App registration](https://github.com/organizations/MeshCore-ca/settings/apps/new?name=MeshCore%20Canada%20Submissions&description=Creates%20public%20review%20issues%20for%20anonymous%20MeshCore%20Canada%20ideas%20and%20region%20boundary%20proposals&url=https%3A%2F%2Fmeshcore.ca%2F&public=false&issues=write&webhook_active=false).

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

## 4. Check out PR #39 before merging

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
sudo git clone https://github.com/MeshCore-ca/MeshCore-Canada.git \
  /opt/meshcore-canada
sudo git -C /opt/meshcore-canada fetch origin \
  pull/39/head:pr-39-submissions
sudo git -C /opt/meshcore-canada switch pr-39-submissions
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

and proxies only `/api/meshcore-canada/submissions` and its `/config` child to
`127.0.0.1:8787`. Validate and reload:

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
```

Required evidence:

- TLS validates for `api.meshcore.ca` on port `21323`.
- Config returns HTTP 200 with version `1`, the correct public site key, and
  `turnstileAction` equal to `meshcore_submission`.
- The allowed request returns
  `Access-Control-Allow-Origin: https://meshcore.ca`.
- OPTIONS returns HTTP 204 and allows `POST` plus `Content-Type`.
- The invalid origin is denied and receives no allow-origin header.
- Public port `8787` remains unreachable.

Do not merge until these checks pass.

## 9. Merge, publish, and switch to `main`

1. Merge [PR #39](https://github.com/MeshCore-ca/MeshCore-Canada/pull/39).
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

Keep the host checkout synchronized whenever `docs/assets/regions` changes.
If the static editor and mounted authority differ, boundary proposals fail
closed as stale; community ideas continue to use their independent schema.

## 10. Test both flows without a GitHub account

Use a signed-out private browser.

### Community idea

1. Open `https://meshcore.ca/submit-idea/`.
2. Enter an unmistakable test titled `Production anonymous idea test — close`.
3. Review it, complete Turnstile if prompted, and select **Submit idea**.
4. Confirm the returned link is a new `MeshCore-ca/MeshCore-Canada` issue
   created by the GitHub App without a GitHub login.
5. Confirm the issue contains no secret, then close it as a test.

### Region boundary proposal

1. Open `https://meshcore.ca/config/editor/`.
2. Make one small valid same-province draft move.
3. Use reason `Production anonymous boundary test — do not apply`.
4. Complete Turnstile and select **Submit for review**.
5. Confirm the App-created issue contains the signed hash and canonical data.
6. Close it without applying the boundary change.

Both pages must retain their copy/download or manual fallback when the API is
unavailable. Neither flow should request a GitHub login for direct submission.

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
  `/var/lib/meshcore-submissions`. Never delete a confirmed `created` row.
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

- [ ] Host, DNS, GitHub App, Turnstile, and secrets are MeshCore Canada-owned.
- [ ] `api.meshcore.ca` is DNS-only or intentionally backed by Spectrum.
- [ ] Provider and host firewalls allow TCP `21323`; `8787` is loopback only.
- [ ] Caddy presents a valid certificate on `api.meshcore.ca:21323`.
- [ ] GitHub App is installed only on `MeshCore-ca/MeshCore-Canada` with Issues
      read/write and no Contents permission.
- [ ] Turnstile validates `meshcore.ca`, `config.meshcore.ca`, and action
      `meshcore_submission`.
- [ ] Loopback health, public config, allowed CORS, denied CORS, and preflight
      checks pass before merge.
- [ ] PR #39 is merged and GitHub Pages publishes successfully.
- [ ] Signed-out idea and boundary submissions each create a test issue.
- [ ] Both test issues are closed; no test boundary is applied.
- [ ] Production checkout is on clean `main` and the ledger is backed up.
