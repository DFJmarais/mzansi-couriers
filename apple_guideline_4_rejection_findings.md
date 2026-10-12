# Apple Review Rejection Findings — 2026-09-09

## Review evidence

Apple reviewed Mzansi Couriers version 2.0.2 (13) on an iPad Air 11-inch (M3). The rejection cites Guideline 4.2 — Minimum Functionality and Guideline 4 — Design.

## Apple’s observed issues

The app was considered too similar to a web browsing experience and did not provide enough native iOS functionality. Apple also observed that users were sent to the default web browser to sign in or register, which created a poor in-app experience.

## Implementation implications

The next build must provide a clearly native app experience for the core courier workflow, not only a remote/web wrapper. Authentication must be initiated from inside the app and must not send the user to the default browser. A system-managed ASWebAuthenticationSession is appropriate for the OAuth handoff because Apple documents it as an embedded iOS authentication session that returns the callback to the calling app. The callback scheme must be explicitly registered and the server must support a mobile callback that returns the authenticated session to the app.

The native experience should visibly include courier-first actions such as today’s parcel queue, pickup/delivery status, native camera evidence capture, location-aware route status, offline queueing, and local notifications. These should be meaningful core operations and not decorative native wrappers.

## Official references

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)
- [Authenticating a User Through a Web Service](https://developer.apple.com/documentation/authenticationservices/authenticating-a-user-through-a-web-service)
