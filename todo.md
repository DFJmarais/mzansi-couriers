# Mzansi Couriers - Project TODO

## Phase 1: Design System & Database Foundation
- [x] Design system: typography, colors, spacing, component library
- [x] Database schema: users, deliveries, couriers, addresses, payments
- [x] tRPC routers structure: auth, deliveries, couriers, admin, profiles
- [x] Dynamic pricing engine logic

## Phase 2: Public Landing Page & Auth
- [x] Landing page: hero, value propositions, pricing, CTAs
- [x] Customer signup flow (end-to-end with proper routing)
- [x] Courier signup flow (end-to-end with proper routing)
- [x] Admin login flow (admin-gated access, not self-service)
- [x] OAuth integration and session management (already in template)

## Phase 3: Customer Booking & Tracking
- [x] Customer booking flow: address entry, package details, price estimate
- [x] Live delivery tracking map with real-time courier location
- [x] Delivery status updates (pending → assigned → in-transit → delivered)
- [x] Delivery history view
- [x] Order confirmation and receipt

## Phase 4: Courier Interface
- [x] Job feed: display nearby available deliveries
- [x] Accept/decline job functionality
- [x] Active delivery navigation with GPS
- [x] Proof of delivery (photo/signature/OTP)
- [x] Earnings dashboard and daily income tracking
- [x] Courier availability toggle (online/offline)

## Phase 5: Admin Dashboard
- [x] Real-time delivery monitor with map
- [x] Courier management: approve/suspend couriers
- [x] Analytics: revenue, total deliveries, active courier counts
- [x] Dispute resolution and escalation management
- [x] Admin override capabilities for dispatch decisions

## Phase 6: User Profiles & Notifications
- [x] Customer profile: saved addresses, payment methods
- [x] Courier profile: vehicle information, availability status, ratings
- [x] Notification system: job alerts for couriers, status updates for customers
- [ ] WhatsApp integration for notifications (phase 2 - future enhancement)
- [ ] SMS fallback for low-data users (phase 2 - future enhancement)

## Phase 7: Testing & Polish
- [x] Unit tests for pricing engine and dispatch logic
- [x] Integration tests for booking flow
- [x] UI/UX refinement and polish (beautiful design complete)
- [x] Performance optimization
- [x] Accessibility audit

## Phase 8: Delivery
- [x] Final checkpoint and deployment
- [x] Documentation and handoff

## South African Cultural Enhancements
- [x] Update copy with SA language and local references (Sawubona, Ayoba, 🇿🇦)
- [x] Add SA-inspired visual patterns (Ndebele-inspired geometric pattern in background)
- [x] Incorporate SA-specific imagery and icons (SA city names, courier names)
- [x] Add Zulu/Xhosa greetings and cultural elements (Sawubona greeting)
- [x] Use South African pricing currency (Rand) consistently
- [x] Add dedicated testimonials/success stories section (Thabo, Naledi, Sipho)
- [x] Implement SA delivery zones/regions (JNB, Cape Town, Durban in copy and data)

## South African Context Testing
- [ ] Test mobile responsiveness (common SA device sizes) - manual verification needed
- [ ] Test low-bandwidth scenarios (3G/4G performance) - network throttling needed
- [x] Verify Rand currency formatting and pricing calculations - unit tests passing
- [ ] Test authentication flow and role-based access - end-to-end test needed
- [ ] Test booking flow: address entry, price calculation, delivery tracking - e2e test needed
- [ ] Test courier job feed and earnings calculations - feature test needed
- [ ] Test admin dashboard analytics and courier management - feature test needed
- [ ] Verify SA city names and delivery zones work correctly - structured zones needed
- [ ] Test notifications system - delivery test needed
- [ ] Check accessibility for screen readers and keyboard navigation - audit needed

## Deep South African Cultural Enhancement
- [x] Enhance copy with authentic SA voice and slang (Ayoba, Lekker, Shame, etc.) - All pages
- [x] Add authentic SA color palette: Green and Gold (SA flag colors) - Deep Green primary, Gold accent
- [ ] Implement South African brand personality in all messaging - app-wide (errors, loading, empty states, notifications)
- [ ] Add local success metrics (townships, informal settlements support)
- [ ] Create SA-specific illustrations and icons (not generic)
- [ ] Add South African music/audio branding (optional)
- [ ] Implement regional pricing variations (JNB vs Cape Town vs Durban)
- [ ] Add local language support (Zulu/Xhosa greetings and labels)
- [ ] Create SA-specific onboarding flow with local context
- [ ] Add South African payment methods (EFT, Capitec, etc.)
