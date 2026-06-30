# Coolify Convex Demo Deployment

This repo is a small WSConsult deployment proof for the full app path:

- Next.js frontend built by Coolify from this repo with the Node/Nixpacks flow
- per-app Convex backend deployed in the same Coolify project
- public frontend hostname
- public browser-facing Convex client hostname
- Convex dashboard hostname protected separately by Cloudflare Access

## Names

- App slug: `coolify-convex-demo`
- Coolify project/environment: `WSConsult` / `production`
- Public app hostname: `coolify-convex-demo.wsconsult.work`
- Public Convex client hostname: `convex-coolify-convex-demo.wsconsult.work`
- Convex dashboard hostname: `convex-coolify-convex-demo-dashboard.wsconsult.work`
- Convex HTTP actions hostname: not created; this app does not use HTTP actions.

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
NEXT_PUBLIC_BUILD_ID=production
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

## Validation

After deployment:

1. Open `https://coolify-convex-demo.wsconsult.work`.
2. Confirm the status badge shows `Live Convex read`.
3. Confirm `Browser writes` increments after page load or `Ping Convex`.
4. Confirm the recent activity list updates without a page refresh.
5. Confirm `https://convex-coolify-convex-demo.wsconsult.work` is reachable by
   browser clients without Cloudflare service-token headers.
6. Confirm `https://convex-coolify-convex-demo-dashboard.wsconsult.work` is
   protected by Cloudflare Access before any production-like use.
