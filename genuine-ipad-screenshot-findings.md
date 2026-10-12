# Genuine iPad Screenshot Capture Findings

Captured from the running Mzansi Couriers application after fixing the AdvancedTracking TypeScript blocker.

- Capture viewport: 1024 x 1366 (iPad portrait aspect ratio 3:4)
- Actual routes captured: `/`, `/become-driver`, `/track`, `/pricing/surge`
- The screenshots show real rendered app UI, not generated placeholder panels.
- Source files:
  - `/home/ubuntu/screenshots/webdev-preview-root-1787405777071818717-1807.png`
  - `/home/ubuntu/screenshots/webdev-preview-become_driver-1787405777070604497-5744.png`
  - `/home/ubuntu/screenshots/webdev-preview-track-1787405777164871649-5183.png`
  - `/home/ubuntu/screenshots/webdev-preview-pricing_surge-1787405777304061637-4263.png`

Visual content observed:
- Home: Mzansi Couriers header, South Africa delivery network label, package CTA, real-time tracking, transparent pricing, safe and secure feature cards, and How It Works.
- Become Driver: courier onboarding headline, earnings information, work-area, schedule, and income cards.
- Track: real delivery ID DEL-001, Sandton-to-Midrand route, ETA, courier details, delivery status, delivery details, and package information.
- Surge Pricing: base pricing, real-time pricing explanation, peak-hour cards, and money-saving tips.

The 1024 x 1366 captures are genuine app screens. They can be resized to the exact 2048 x 2732 App Store Connect dimensions while preserving the 3:4 aspect ratio.

## Visual Verification

The genuine Home capture was visually inspected and shows the actual Mzansi Couriers branded app interface, including the Mzansi logo, South Africa delivery network header, real-time tracking, transparent pricing, safe and secure cards, package CTA, delivery-zone indicators, and How It Works content.

The genuine Surge Pricing capture was visually inspected and shows the actual in-app Surge Pricing page, including base pricing, real-time pricing explanation, peak-hour multiplier cards, and money-saving tips. It is suitable as a functional store screenshot.

The final 2048 x 2732 Home screenshot was inspected and preserves the genuine branded UI with readable headings, navigation, delivery CTA, tracking/pricing/safety features, and the How It Works section.

The final 2048 x 2732 Advanced Tracking screenshot was inspected and preserves the genuine delivery tracking UI, including DEL-001, ETA, AI prediction, quick actions, delivery preferences, package data, optimized route metrics, and recent updates. The map area is a real in-app map container but appears gray in this preview because the map service did not render in the sandbox; this is noted for selection decisions.

The final 2048 x 2732 Surge Pricing screenshot was inspected and contains real, legible pricing UI including base pricing, surge logic, peak-hour ranges, and money-saving guidance.

The final 2048 x 2732 Packaging Requirements screenshot was inspected and contains real, legible parcel-preparation UI including the mandatory parcel identification code, packaging rules, prohibited items, and weight/size guidance.

Selected final set: Home, Advanced Tracking, Surge Pricing, and Packaging Requirements. These are genuine screenshots captured from the live app preview and resized without adding mockup frames or fabricated UI.

Native icon audit: the current AppIcon-512@2x.png is a generic Capacitor-style blue mark on a white geometric background, not a complete Mzansi Couriers icon set. The project favicon is a 256x256 orange square with only the small letters “MC”; it is not a suitable source for a professional iOS AppIcon by itself. The native AppIcon manifest declares only one universal 1024x1024 entry, so iPhone/iPad slots are not explicitly represented in Contents.json.

Visual QA: the replacement 1024 icon is a solid RGB parcel-and-route mark in deep green and orange, with no transparency and no tiny text. Final-size screenshot 01 shows the real Mzansi Couriers Home page with navigation, send-package CTA, tracking, pricing, and how-it-works content. Final-size screenshot 02 shows the real Advanced Tracking screen with delivery ID, ETA, AI prediction card, quick actions, preferences, package details, route metrics, and recent updates. The map region is a genuine app map container but appears gray in the sandbox because map tiles did not load; do not use this screenshot if a non-map screen is preferred for store imagery.

Visual QA: final-size screenshot 03 shows the real Surge Pricing page with Base Pricing, demand rules, peak-hour cards, and money-saving guidance. Final-size screenshot 04 shows the real Packaging Requirements page with parcel identification code, packaging rules, prohibited items, and weight/size guidance. Both are genuine app screens at 2048x2732 and are readable for App Store review.
