# Coolify Convex Demo Deployment

This repo is a small WSConsult deployment proof for the full app path:

- Next.js frontend built by Coolify from this repo with the Node/Nixpacks flow
- per-app Convex backend deployed in the same Coolify project
- public frontend hostname
- public browser-facing Convex client hostname
- Convex dashboard hostname protected separately by Cloudflare Access

## Names

- App slug: `coolify-convex-demo`
- GitHub repo: `https://github.com/StiensWout/coolify-convex-demo`
- Coolify project/environment: `WSConsult` / `production`
- Coolify app UUID: `cfvkcetf0enm5urtb3svjw98`
- Coolify Convex service UUID: `mhow0qbvk17t90lchhq5pe96`
- App Infisical project: `WSConsult coolify-convex-demo`
- App Infisical project slug: `wsconsult-coolify-convex-demo`
- App Infisical project ID: `558a077a-eb84-4a50-96b5-617bcdb4b428`
- Public app hostname: `coolify-convex-demo.wsconsult.work`
- Public Convex client hostname: `convex-coolify-convex-demo.wsconsult.work`
- Public Convex HTTP actions hostname:
  `convex-coolify-convex-demo-http.wsconsult.work`
- Convex dashboard hostname: `convex-coolify-convex-demo-dashboard.wsconsult.work`

## App Runtime

The frontend is a Next.js app router application. There is intentionally no
Dockerfile in this repo; Coolify should use its Node/Nixpacks-style build
detection, similar to a Vercel deployment.

Recommended Coolify settings:

```text
Build Pack: Nixpacks
Install Command: npm ci
Build Command: npm run build
Start Command: npm run start -- --hostname 0.0.0.0
Port: 3000
Health Check Path: /healthz
```

Coolify should set these build-time/runtime environment variables for the app
resource:

```text
NEXT_PUBLIC_CONVEX_URL=https://convex-coolify-convex-demo.wsconsult.work
NEXT_PUBLIC_APP_HOSTNAME=coolify-convex-demo.wsconsult.work
NEXT_PUBLIC_BUILD_ID=coolify-reinstall-2026-06-30
```

The app writes a browser check-in to Convex on page load and exposes a manual
`Ping Convex` button. The subscribed snapshot shows the current write count and
recent check-ins, proving the browser can read and write through the public
Convex endpoint.

## Convex Runtime

Convex functions live in `convex/`:

- `status:snapshot` reads the counter and recent check-ins.
- `status:checkIn` writes a browser check-in, increments a counter, and prunes
  old demo records.

The Convex deployment must be app-specific. Do not reuse a shared Convex stack
for this demo.

Required self-hosted Convex settings are stored only in Coolify secrets and the
root-only deploy credential note on `wsconsult-deploy-01`.

The deployed Convex service contains:

- `backend`: `ghcr.io/get-convex/convex-backend:latest`, routed through
  `https://convex-coolify-convex-demo.wsconsult.work` and
  `https://convex-coolify-convex-demo-http.wsconsult.work`
- `dashboard`: `ghcr.io/get-convex/convex-dashboard:latest`, routed through
  `https://convex-coolify-convex-demo-dashboard.wsconsult.work`
- `postgres`: `postgres:17-alpine`, with app-specific database
  `coolify_convex_demo`

The dashboard hostname is protected by a dedicated Cloudflare Access
self-hosted application named `coolify-convex-demo Convex dashboard`. The
browser-facing Convex client hostname is intentionally public and does not use
Cloudflare service-token headers.

## Validation

Reinstalled and validated on 2026-06-30:

- Local `npm run build` passed for the Next.js app.
- `npx convex deploy` pushed the schema and functions to
  `https://convex-coolify-convex-demo.wsconsult.work`.
- Coolify deployment `lo7il6nbe4editjkxuzm1hjm` finished successfully.
- `https://coolify-convex-demo.wsconsult.work/healthz` returned `ok`.
- `https://convex-coolify-convex-demo.wsconsult.work/version` returned `200`.
- `https://convex-coolify-convex-demo-http.wsconsult.work` reached the
  Convex backend and returned `404` because this demo does not define HTTP
  actions.
- `https://convex-coolify-convex-demo-dashboard.wsconsult.work` returned a
  Cloudflare Access login redirect.
- The public app HTML loaded and included the expected demo controls.
- Public Convex HTTP client validation mutated `status:checkIn` and advanced
  the counter from `0` to `1`.
- Public Convex websocket validation subscribed to `status:snapshot`, mutated
  `status:checkIn`, and observed the live subscription update from `1` to `2`.
- T3 collaborative preview reported no automation host for this environment, so
  a real browser screenshot/action capture was not available during this
  reinstall validation.

Manual checks:

1. Open `https://coolify-convex-demo.wsconsult.work`.
2. Confirm the status badge shows `Live Convex read`.
3. Confirm `Browser writes` increments after page load or `Ping Convex`.
4. Confirm the recent activity list updates without a page refresh.
5. Confirm `https://convex-coolify-convex-demo.wsconsult.work` is reachable by
   browser clients without Cloudflare service-token headers.
6. Confirm `https://convex-coolify-convex-demo-dashboard.wsconsult.work` is
   protected by Cloudflare Access before any production-like use.
