# Backend Sync Mirror v1

Branch: `feature/backend-sync-mirror-v1`

## Goal

Connect the mobile app to the protected Render backend for staging live ops.

## Local-first rule

The device remains the source of truth.

The backend receives a mirror only. It must not overwrite local goals, deposits, milestones, or progress in this branch.

## Mobile behaviour

The app now:

- generates a stable local device id
- signs backend write requests
- sends telemetry events to `/api/v1/events`
- sends goals/deposits mirror to `/api/v1/sync`
- fails silently if backend is offline or misconfigured

## Required Expo env values for staging

```text
EXPO_PUBLIC_BACKEND_URL=https://plump-backend-staging.onrender.com
EXPO_PUBLIC_PLUMP_DEVICE_AUTH_SECRET=<same staging secret as Render>
```

`EXPO_PUBLIC_API_BASE_URL` is also supported as an alias.

## Backend behaviour

`/api/v1/sync` stores:

- raw sync batch in `sync`
- latest goal mirror in `goal_mirrors`
- latest deposit mirror in `deposit_mirrors`

## Security note

This is staging live-ops security only. Expo public env values are not true production secrets.

Before public paid launch, replace this with:

```text
feature/production-device-registration-v1
```

## Not in this branch

- No backend overwrite of local state.
- No login.
- No bank integration.
- No production device registration.
- No IAP server validation.
- No App Store Server Notifications.
