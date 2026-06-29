# Plump — Product Requirements (PRD)

**By ThoughtSnap Labs · plump.app**
A cozy savings-challenge / cash-stuffing app where a chubby honey mascot IS the progress bar.
Hard-paywall product. Local-first. Zero Emergent branding anywhere.

## Original Problem Statement
Build an App Store-ready Expo React Native hard-paywall savings-challenge app. Users design a
personalised £0 savings card (challenge, style, goal, mascot) through a ~3-min interactive
onboarding BEFORE the paywall (the free conversion lever). After purchase, the full saving loop
unlocks. Mascot plumps up as users save; share card drives the viral loop. SnapBack-style direct
Apple IAP (no RevenueCat), simulated in preview.

## User Personas
- "Pretty money" / cash-stuffing savers who want saving to feel cozy and rewarding, not like budgeting.
- Goal-driven savers (trips, emergency fund, Christmas) who love visual progress + shareable wins.

## Architecture
- **Frontend:** Expo SDK 54, expo-router, TypeScript strict. State via `AppProvider` (theme,
  settings, entitlement, goals, deposits, onboarding draft). AsyncStorage repositories.
- **Mascot:** parametric `react-native-svg` component (4 variants × plumpness 0–1). Used for
  in-app, app icon, splash, share card.
- **Services:** challengeEngine, iapService (real react-native-iap guarded + simulated fallback),
  entitlementService, remoteConfigService, telemetryService, reviewPromptService, haptics,
  notifications, share (view-shot + native share).
- **Backend:** FastAPI stubs under `/api` (health, /api/v1/config, events, sync,
  validate-transaction, app-store-notifications). Mongo-optional; mobile never depends on it.

## Implemented (2026-06-29)
- ✅ Brand assets: Plump icon, adaptive icon, splash, favicon (honey mascot on cream, no Emergent branding)
- ✅ Design system (Fredoka/Nunito fonts, full light/dark palette, spacing/radius tokens)
- ✅ 7-step onboarding: intro → challenge → style → goal → mascot → plumpness preview → card-reveal
- ✅ Card reveal animation + haptic beat + cheeky weighted review ask (Sure/Not now)
- ✅ Hard paywall: Annual hero (3-day trial), Monthly, Lifetime; close, restore, legal text
- ✅ Holding state (locked card, Unlock re-opens paywall, Edit my card); tabs are Pro-gated
- ✅ Paid app: Home dashboard, Goals (multiple/new/archive), Card (share), Settings (toggles, dark mode)
- ✅ Save loop: 100-envelope grid → save → "Thunk." mascot plumps → milestone modal + confetti
- ✅ Challenge engine (envelope_100, week_52, penny_365, no_spend, custom) + streaks + projections
- ✅ Simulated IAP in preview; real StoreKit guarded for TestFlight; entitlement cache
- ✅ Backend stubs verified (all /api routes 200)
- ✅ Tested end-to-end (testing agent) — all M1–M5 flows pass, no Emergent branding

## Backlog
- **P1:** Backend receipt validation (App Store Server API JWS verify) — currently stubbed.
- **P1:** Real product price labels from StoreKit once products propagate in TestFlight.
- **P2:** Export ledger; sinking-fund custom challenge builder UI; image export polish for share card.
- **P2 (M6):** Live-ops dashboard (funnel/revenue/retention) — backend collections already capture events/sync.
- **P2:** Cadence reminder notifications (opt-in scaffolding done; needs build to test).

## Notes
- IAP, push, audio-in-background features require an EAS/TestFlight build — cannot be validated in Expo Go.
- App is local-first; clearing `plump.*` AsyncStorage keys resets onboarding.
