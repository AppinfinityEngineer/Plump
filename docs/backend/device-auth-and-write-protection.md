# Backend Device Auth and Write Protection

Branch: `feature/backend-device-auth-and-write-protection-v1`

## Goal

Protect public backend write endpoints before the mobile app sends live events or sync mirrors.

## Public endpoints

These remain public:

- `GET /api/health`
- `GET /api/`
- `GET /api/v1/config`

## Protected endpoints

These require a signed device request:

- `POST /api/v1/events`
- `POST /api/v1/sync`

## Required headers

```text
X-Plump-Device-Id: <stable local device id>
X-Plump-Timestamp: <unix seconds>
X-Plump-Signature: <hex hmac sha256>
```

## Signature format

```text
HMAC_SHA256(PLUMP_DEVICE_AUTH_SECRET, "{timestamp}.{device_id}.{raw_body}")
```

Where:

- `timestamp` is the exact `X-Plump-Timestamp` header value.
- `device_id` is the exact `X-Plump-Device-Id` header value.
- `raw_body` is the exact JSON request body string sent over the wire.

## Replay guard

Requests older/newer than 5 minutes are rejected.

## Render env required

```text
MONGO_URL=<Plump Atlas URI>
DB_NAME=plump_staging
ENVIRONMENT=staging
PLUMP_DEVICE_AUTH_SECRET=<long random secret>
```

## PowerShell signing smoke test

```powershell
$BASE="https://plump-backend-staging.onrender.com"
$SECRET="<same value as Render PLUMP_DEVICE_AUTH_SECRET>"
$DEVICE="dev-local"
$TS=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$BODY='{"events":[{"type":"signed_smoke_test","deviceId":"dev-local"}]}'

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($SECRET)
$msg = [Text.Encoding]::UTF8.GetBytes("$TS.$DEVICE.$BODY")
$SIG = -join ($hmac.ComputeHash($msg) | ForEach-Object { $_.ToString("x2") })

Invoke-RestMethod "$BASE/api/v1/events" -Method Post -ContentType "application/json" -Body $BODY -Headers @{
  "X-Plump-Device-Id"=$DEVICE
  "X-Plump-Timestamp"=$TS
  "X-Plump-Signature"=$SIG
}
```

Expected:

```text
accepted : 1
```

Unsigned write should fail:

```powershell
Invoke-RestMethod "$BASE/api/v1/events" -Method Post -ContentType "application/json" -Body '{"events":[]}'
```

Expected:

```text
401 / 403
```

## Not in this branch

- No mobile client signing yet.
- No backend sync mirror shape changes.
- No IAP validation.
- No App Store Server Notification validation.
