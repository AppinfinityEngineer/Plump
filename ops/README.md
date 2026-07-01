# Plump Live Ops

Minimal Render-hosted live ops dashboard.

## What it tracks

Only the launch-critical business funnel:

- app opens / installs approximation by unique device id
- onboarding started
- onboarding completed
- paywall seen
- converted by plan
- onboarding completed but not converted
- install source if the app sends one
- estimated gross/net revenue today, this week, and this month
- Apple commission deduction defaults to 15%

No personal data, no account data, no bank data.

## Correct setup order

1. Apply and commit this branch.
2. Push `feature/live-ops-minimal-v1`.
3. Create the Render Web Service from this branch.
4. Generate two tokens:
   - `PLUMP_DEVICE_AUTH_SECRET`
   - `LIVE_OPS_ADMIN_TOKEN`
5. Add those tokens to Render environment variables.
6. Deploy Render.
7. Open `/health` to confirm the service is live.
8. Open `/ops?token=LIVE_OPS_ADMIN_TOKEN` to view the dashboard.
9. Only after Render exists, copy `frontend/.env.liveops.example` to `frontend/.env.local` and fill in the real Render URL/token for a future app build.
10. Do not submit a new App Store build just for this branch unless you intentionally want app telemetry to start flowing from that app build.

## Render service

Create a new Render Web Service with:

- Root Directory: `ops`
- Build Command: `npm install`
- Start Command: `npm start`

## Render environment variables

Required:

```text
PLUMP_DEVICE_AUTH_SECRET=<same secret used by the app for signed telemetry>
LIVE_OPS_ADMIN_TOKEN=<long random admin dashboard token>
```

Optional:

```text
LIVE_OPS_DATA_DIR=/var/data
APPLE_COMMISSION_RATE=0.15
PLUMP_MONTHLY_PRICE=6.99
PLUMP_ANNUAL_PRICE=29.99
PLUMP_LIFETIME_PRICE=49.99
```

For persistence, attach a Render disk and set:

```text
LIVE_OPS_DATA_DIR=/var/data
```

## Dashboard URL

```text
https://YOUR-RENDER-SERVICE.onrender.com/ops?token=LIVE_OPS_ADMIN_TOKEN
```

The dashboard refreshes every 30 seconds.

## App wiring for future builds

The existing Plump app telemetry client posts to:

```text
/api/v1/events
```

It requires these app build env vars:

```text
EXPO_PUBLIC_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com
EXPO_PUBLIC_PLUMP_DEVICE_AUTH_SECRET=<same value as PLUMP_DEVICE_AUTH_SECRET>
```

Expo public env vars are compiled into the app at build time. If the current App Store build was not built with these values, it will not send live ops data. The dashboard can still be deployed now, and data will begin flowing from the next app build that includes those env vars.

## Revenue note

This dashboard estimates revenue from successful app-side purchase/plan events and deducts Apple commission. For exact Apple financial revenue, add App Store Server Notifications or Apple Sales Reports later.
