# Plump App Store Connect Setup

Locked launch identity:

- App name: Plump
- Bundle ID: com.thoughtsnaplabs.plump
- Version: 1.0.0
- First iOS build number: 1
- SKU: PLUMP-IOS-001

## App Store Connect one-time setup

Create the app record manually once in App Store Connect:

- Platform: iOS
- Name: Plump
- Primary language: English (U.K.)
- Bundle ID: com.thoughtsnaplabs.plump
- SKU: PLUMP-IOS-001
- User Access: Full Access

## In-app purchases

Create these before TestFlight purchase testing:

Subscription group:
- Name: Plump Pro

Auto-renewable subscriptions:
- Product ID: plump.monthly
- Reference name: Plump Monthly
- Price: £6.99

- Product ID: plump.annual
- Reference name: Plump Annual
- Price: £29.99

Non-consumable:
- Product ID: plump.lifetime
- Reference name: Plump Lifetime
- Price: £49.99

## Build command

From `frontend`:

```bash
npm run ship:testflight
```

This runs:

```bash
eas build --platform ios --profile production --auto-submit
```

App Store Connect must already have the app record before auto-submit can complete.
