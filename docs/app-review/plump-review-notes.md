# Plump App Review Notes

Plump is a paid savings challenge app. It does not offer free access to the main app after onboarding.

Review flow:
1. Launch Plump.
2. Complete onboarding and create a savings challenge.
3. View the generated Plump card / value moment.
4. Continue to the paywall.
5. Use Apple sandbox In-App Purchase to unlock the app.
6. After purchase, the app opens to the main savings challenge experience.

Plump uses Apple In-App Purchase only. No external payment is used.

Important:
- Restore Purchases is visible on the paywall.
- Terms and Privacy Policy links are visible on the paywall.
- Subscription disclosure is visible on the paywall.
- Lifetime unlock disclosure is visible on the paywall.
- In dev/test mode the paywall close button may be visible for internal testing.
- For App Review / production mode, the visible close/X should be hidden by setting PAYWALL_MODE to review or production.
- Apple approval is not the public paid launch gate. Public release is blocked until production server-side IAP validation and App Store Server Notifications are implemented.
