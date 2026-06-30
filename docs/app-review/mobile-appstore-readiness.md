# Plump Mobile App Store Readiness

Branch: `feature/mobile-appstore-readiness-v1`

## Product position

Plump is a paid savings challenge app. The user can complete onboarding, create a challenge, see the card reveal/value moment, and then must unlock the app with Apple In-App Purchase to use the main savings challenge experience.

Do not describe Plump as free in App Store metadata, onboarding, screenshots, paywall copy, captions, or review notes unless an actual Apple-configured free trial is being described with clear subscription disclosure.

## Paywall legal links

Use Apple's Standard Licensed Application End User License Agreement as the Terms link unless a custom Plump EULA is added later:

https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Use the published Plump Privacy Policy link:

https://docs.google.com/document/d/e/2PACX-1vQzXNr50T8jjdN3oYoszMwBshdex7y3PSh0a3p7tE6zEKG5Jb4k8dEmXLeVYYdr2T3bnqjJJIJQxQ5S/pub

Required paywall links:
- Terms
- Privacy Policy
- Restore Purchases

## Required visible app-side items

- Restore Purchases is visible on the paywall.
- Terms link is visible on the paywall and opens Apple's Standard EULA.
- Privacy Policy link is visible on the paywall and opens the published Plump Privacy Policy.
- Subscription disclosure is visible on the paywall.
- Lifetime unlock disclosure is visible on the paywall.
- Hard paywall close/X is allowed in dev/test mode only.
- Hard paywall close/X must be hidden for review/production mode.

## iOS privacy manifest

The app includes a first-party `PrivacyInfo.xcprivacy` file at the Expo project root.

Current first-party declaration:
- No tracking.
- No tracking domains.
- No collected data types declared by first-party app code in this manifest.
- No required-reason accessed API types declared by first-party app code in this manifest.

Before final App Store submission, confirm the generated iOS archive includes all dependency privacy manifests and that App Store Connect does not report missing required-reason API declarations from dependencies.

## App Store Connect privacy answers draft

Use this as a working draft only. Confirm against the final binary and any SDK behaviour before submission.

Suggested position for Plump MVP:
- No third-party advertising.
- No cross-app tracking.
- No bank connection.
- No financial advice.
- No account/login required.
- Savings entries are local-first user-entered progress records.
- IAP purchase processing is handled by Apple.

## Screenshot and metadata rules

Screenshots should show:
- Cute savings challenge setup.
- Card reveal/value moment.
- Paid unlock/paywall if showing paid functionality.
- Progress card / mascot progress if unlocked screenshots are used.

Avoid:
- “Free savings app”
- “Start free”
- “No payment needed”
- Any wording implying bank integration or financial advice.
- Any wording implying guaranteed savings outcomes.

Safe metadata language:
- “Paid savings challenge tracker”
- “Create cute saving challenges”
- “Track manual saves”
- “Grow your mascot as your progress grows”
- “Share progress cards”

## Submission gate

Apple approval is not the public paid launch gate.

Public release remains blocked until:
- `production-iap-server-validation-v1`
- `app-store-server-notifications-v1`
