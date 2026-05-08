# Mzansi Couriers - South African Context Testing Plan

## 1. Mobile Responsiveness & Device Testing

**SA Market Context**: Most SA users access via mobile (70%+ mobile traffic). Common devices: iPhone 11-13, Samsung Galaxy A series, Xiaomi, budget Android phones.

**Tests**:
- [ ] Test on mobile viewport (375px width - iPhone SE)
- [ ] Test on tablet viewport (768px width - iPad)
- [ ] Test on desktop viewport (1440px width)
- [ ] Verify touch targets are 44px minimum (accessibility)
- [ ] Test landscape orientation
- [ ] Verify navigation is accessible on small screens

## 2. Network & Performance Testing

**SA Context**: Average internet speed in SA is 10-25 Mbps, but many users on 3G/4G with variable speeds. Data is expensive (R0.50-R1.50/MB).

**Tests**:
- [ ] Test page load time on 4G network (simulate 10 Mbps)
- [ ] Test page load time on 3G network (simulate 3 Mbps)
- [ ] Verify images are optimized (no large uncompressed files)
- [ ] Test with images disabled (low-data mode)
- [ ] Verify app works offline or degrades gracefully
- [ ] Check bundle size is reasonable (<500KB gzipped)

## 3. Currency & Pricing

**SA Context**: All prices in South African Rand (ZAR/R). No decimal places for small amounts. Users expect clear pricing.

**Tests**:
- [ ] Verify all prices display with R prefix (e.g., "R29", "R2,500")
- [ ] Test pricing calculations for different distances
- [ ] Test pricing for different package sizes
- [ ] Verify no currency conversion issues
- [ ] Test price display in booking confirmation
- [ ] Verify earnings calculations in courier dashboard

## 4. Authentication & Role-Based Access

**SA Context**: Users may have limited email access. Phone-based auth preferred.

**Tests**:
- [ ] Test customer signup flow end-to-end
- [ ] Test courier signup flow end-to-end
- [ ] Test admin access (verify non-admins can't access)
- [ ] Test logout functionality
- [ ] Test session persistence across page reloads
- [ ] Test role-based dashboard access (customer sees customer dashboard, etc.)

## 5. Booking Flow

**SA Context**: Users expect fast, simple booking. Common routes: JNB-Pretoria, Cape Town metro, Durban-Pinetown.

**Tests**:
- [ ] Test address entry for Johannesburg
- [ ] Test address entry for Cape Town
- [ ] Test address entry for Durban
- [ ] Test package size selection
- [ ] Test weight entry
- [ ] Verify price estimate updates correctly
- [ ] Test booking confirmation
- [ ] Verify delivery tracking after booking

## 6. Courier Job Feed

**SA Context**: Couriers work flexible hours. Need quick job acceptance/rejection.

**Tests**:
- [ ] Test job feed displays nearby deliveries
- [ ] Test accept job functionality
- [ ] Test decline job functionality
- [ ] Test online/offline toggle
- [ ] Verify earnings update after job completion
- [ ] Test job details display (pickup, dropoff, payment)

## 7. Admin Dashboard

**SA Context**: Admins need real-time visibility into deliveries across SA regions.

**Tests**:
- [ ] Test analytics charts load correctly
- [ ] Test delivery status distribution chart
- [ ] Test courier management (approve/suspend)
- [ ] Test real-time delivery monitor
- [ ] Test filtering by city/region
- [ ] Verify admin can see all user data

## 8. Notifications

**SA Context**: Users prefer in-app + SMS/WhatsApp. Email often unreliable.

**Tests**:
- [ ] Test job notification for couriers
- [ ] Test delivery status notification for customers
- [ ] Test notification persistence
- [ ] Verify notification content is clear and actionable

## 9. Accessibility

**SA Context**: Inclusive design matters. Many users have varying literacy levels.

**Tests**:
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test screen reader compatibility (NVDA, JAWS)
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Test form labels and error messages
- [ ] Verify focus indicators are visible

## 10. Localization

**SA Context**: SA has 11 official languages. App uses English + Zulu/Xhosa greetings.

**Tests**:
- [ ] Verify "Sawubona" greeting displays correctly
- [ ] Verify "Ayoba!" messaging works
- [ ] Verify SA flag emoji displays correctly
- [ ] Check all copy for SA English spelling (colour, honour, etc.)
- [ ] Verify city names are correct (Johannesburg, Cape Town, Durban, Pretoria, etc.)

## 11. Data & Security

**SA Context**: Users concerned about data privacy. POPIA compliance important.

**Tests**:
- [ ] Verify HTTPS is enforced
- [ ] Test password security (if applicable)
- [ ] Verify user data is not logged in plain text
- [ ] Test data deletion on logout
- [ ] Verify no sensitive data in local storage

## 12. Error Handling

**SA Context**: Network interruptions common. App should handle gracefully.

**Tests**:
- [ ] Test behavior when network is lost mid-booking
- [ ] Test behavior when API is slow
- [ ] Test error messages are clear and helpful
- [ ] Test retry functionality
- [ ] Verify no cryptic error codes shown to users

## Test Results Summary

| Category | Status | Notes |
|----------|--------|-------|
| Mobile Responsiveness | [ ] | |
| Network Performance | [ ] | |
| Currency & Pricing | [ ] | |
| Authentication | [ ] | |
| Booking Flow | [ ] | |
| Courier Job Feed | [ ] | |
| Admin Dashboard | [ ] | |
| Notifications | [ ] | |
| Accessibility | [ ] | |
| Localization | [ ] | |
| Data & Security | [ ] | |
| Error Handling | [ ] | |

