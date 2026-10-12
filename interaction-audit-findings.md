# Interaction Audit Findings

## Initial inventory

The client source currently exposes the following route families: `/`, `/send`, `/track`, `/track/advanced`, `/customer/dashboard`, `/customer/onboarding`, `/customer/send-package`, `/courier/dashboard`, `/courier/earnings`, `/courier/performance`, `/courier/onboarding`, `/admin/login`, `/admin/dashboard`, `/admin/analytics`, `/admin/automation`, `/admin/onboarding`, `/admin/outreach`, `/admin/referral-config`, `/admin/support-bot`, and `/admin/surge-pricing`.

A source scan found 272 clickable or navigation-related handler references across client TypeScript and TSX files, and 50 test files across the client and server. This is an inventory signal, not proof that all 272 interactions have been executed. Further phases must combine static target validation, automated tests, and visual role-specific checks.

## Known test limitation

Courier-only routes and actions require an authenticated courier session. Owner admin routes require the secure owner session. Public and unauthenticated behavior can be tested in the sandbox; authenticated courier and owner actions require valid role sessions or dedicated test fixtures.
