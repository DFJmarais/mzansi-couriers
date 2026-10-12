# Apple Guideline 4.2 Audit Sources

## Official sources

1. [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
2. [Apple — Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/)

## Requirements captured

Apple Guideline 4.2 says an app should include features, content, and UI that elevate it beyond a repackaged website. Apple’s current review guidance also says developers should test for crashes and bugs, provide complete and accurate metadata, give App Review full access through an active demo account or fully featured demo mode, keep backend services live, and explain non-obvious features in Review Notes.

Apple’s account-deletion support guidance says apps that support account creation must let users initiate deletion within the app. The option should be easy to find, typically in account settings; it should delete the entire account record and associated personal data unless legally required retention applies; and confirmation steps may be used if they are not unnecessarily difficult. Sending users to the default web browser for sign-in or registration is identified by Apple as a poor experience under Guideline 4, and it does not remove the in-app deletion obligation.

## Audit interpretation for Mzansi Couriers

The relevant Apple test is not whether the app has a few native plugins. Reviewers must be able to see a coherent, useful iOS experience that is materially more than a website wrapper: role-based courier operations, real parcel tracking, location and route behavior, delivery evidence capture, notifications, scanning, and accessible account controls. Native functionality must be real, connected to persisted delivery data, and usable during review rather than merely present in source code.
