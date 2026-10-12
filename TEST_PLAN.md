# Mzansi Couriers - Comprehensive Test Plan

## Test Scope
Full end-to-end testing of all customer and courier features

---

## Phase 1: Customer Booking Flow

### Test Case 1.1: Address Search (Google Maps Autocomplete)
- [ ] Search for "50 2nd Avenue Kleinmond Western Cape"
- [ ] Verify autocomplete suggestions appear
- [ ] Verify full address is returned with coordinates
- [ ] Verify address components are parsed (street, suburb, city, province)

### Test Case 1.2: Distance Calculation
- [ ] Set pickup: "50 2nd Avenue Kleinmond"
- [ ] Set dropoff: "3 Church Street Ladybrand"
- [ ] Verify distance calculates (should be ~1,146 km)
- [ ] Verify duration displays

### Test Case 1.3: Pricing Calculation
- [ ] Verify base price: R75
- [ ] Verify per-leg pricing applied
- [ ] Verify service level multipliers work
- [ ] Verify weight surcharges apply
- [ ] Expected price: ~R450-500

### Test Case 1.4: Service Level Selection
- [ ] Verify Economy option available
- [ ] Verify Express option available
- [ ] Verify Local Same Day ONLY available for <100km
- [ ] Verify Local Same Day disabled for >100km routes

### Test Case 1.5: Tracking Code Generation
- [ ] Complete booking
- [ ] Verify tracking code displays (#MZ-ABC123-XYZ format)
- [ ] Verify code can be copied
- [ ] Verify code can be printed
- [ ] Verify code is unique for each booking

### Test Case 1.6: Booking Confirmation
- [ ] Verify all booking details display
- [ ] Verify pricing breakdown shows
- [ ] Verify tracking code is prominent
- [ ] Verify print option works

---

## Phase 2: Courier Onboarding

### Test Case 2.1: Welcome Step
- [ ] Click "Become a Courier"
- [ ] Verify welcome message displays
- [ ] Verify benefits listed

### Test Case 2.2: Requirements Check
- [ ] Verify requirements listed (license, vehicle, smartphone)
- [ ] Verify no insurance requirement (removed)
- [ ] Verify ability to agree to requirements

### Test Case 2.3: Identity Verification
- [ ] Verify ID upload field present
- [ ] Verify vehicle registration upload field present
- [ ] Verify insurance upload field ABSENT (removed)

### Test Case 2.4: Training Module
- [ ] Verify 5+ training cards display
- [ ] Verify delivery procedures card present
- [ ] Verify pickup checklist included
- [ ] Verify delivery confirmation process explained
- [ ] Verify photo requirements explained

### Test Case 2.5: Safety & Fraud Rules
- [ ] Verify zero-tolerance policy explained
- [ ] Verify consequences listed
- [ ] Verify AI fraud detection mentioned

### Test Case 2.6: Quiz
- [ ] Verify 4 questions appear
- [ ] Verify questions cover key topics
- [ ] Verify passing score required

### Test Case 2.7: Bank Account Setup
- [ ] Verify Paystack integration
- [ ] Verify account details can be entered

### Test Case 2.8: Activation
- [ ] Verify terms & conditions
- [ ] Verify account activation button
- [ ] Verify completion message

---

## Phase 3: Address Search (Google Maps)

### Test Case 3.1: Multiple Address Formats
- [ ] Search: "Main Road Kleinmond" → verify suggestions
- [ ] Search: "Church Street Ladybrand" → verify suggestions
- [ ] Search: "Cape Town" → verify city-level results
- [ ] Search: "Johannesburg" → verify city-level results

### Test Case 3.2: Autocomplete Responsiveness
- [ ] Type slowly, verify suggestions appear in real-time
- [ ] Type quickly, verify debouncing works
- [ ] Verify no lag in suggestions

### Test Case 3.3: Address Formatting
- [ ] Verify full address displayed (street, suburb, city, province)
- [ ] Verify coordinates included
- [ ] Verify postal codes included where available

---

## Phase 4: Pricing System

### Test Case 4.1: Relay-Based Pricing
- [ ] Short distance (0-40km): verify R40/leg
- [ ] Medium distance (40-80km): verify R45/leg
- [ ] Long distance (80-120km): verify R50/leg
- [ ] Verify base fee: R75

### Test Case 4.2: Service Level Multipliers
- [ ] Economy: 1.0x multiplier
- [ ] Express: 1.25x multiplier
- [ ] Local Same Day: 1.5x multiplier (if <100km)

### Test Case 4.3: Weight Surcharges
- [ ] 0-5kg: R0 surcharge
- [ ] 5-10kg: R30 surcharge
- [ ] 10-20kg: R60 surcharge
- [ ] 20-30kg: R120 surcharge

### Test Case 4.4: Cape Town → Durban Example
- [ ] Distance: ~1,398 km
- [ ] Expected price: ~R450-500
- [ ] Verify price breakdown displays

---

## Phase 5: Tracking Code System

### Test Case 5.1: Code Generation
- [ ] Verify code format: #MZ-ABC123-XYZ
- [ ] Verify code is 14 characters
- [ ] Verify code is unique per booking

### Test Case 5.2: Code Display
- [ ] Verify code displays on booking confirmation
- [ ] Verify code is copyable
- [ ] Verify code is printable

### Test Case 5.3: Public Tracking
- [ ] Navigate to /track page
- [ ] Search for tracking code
- [ ] Verify delivery status displays
- [ ] Verify pickup/dropoff addresses show

---

## Phase 6: Home Page

### Test Case 6.1: Pricing Example
- [ ] Verify Cape Town → Durban example displays
- [ ] Verify price: ~R450-500
- [ ] Verify route breakdown shows

### Test Case 6.2: Marketing Messaging
- [ ] Verify "Couriers earn R14,000-16,000/month" message
- [ ] Verify relay network benefits explained
- [ ] Verify competitive pricing highlighted

### Test Case 6.3: Navigation
- [ ] Verify "Get Started" button works
- [ ] Verify "Become a Courier" button works
- [ ] Verify "Track Package" link visible
- [ ] Verify "Become a Driver" page accessible

---

## Phase 7: Public Tracking Page

### Test Case 7.1: Tracking by Code
- [ ] Enter valid tracking code
- [ ] Verify delivery details display
- [ ] Verify pickup address shows
- [ ] Verify dropoff address shows

### Test Case 7.2: Delivery Status
- [ ] Verify status displays (pending, picked up, in transit, delivered)
- [ ] Verify timestamps show
- [ ] Verify courier info displays (if assigned)

---

## Test Results Summary

| Phase | Test Cases | Passed | Failed | Notes |
|-------|-----------|--------|--------|-------|
| 1. Customer Booking | 6 | ? | ? | |
| 2. Courier Onboarding | 8 | ? | ? | |
| 3. Address Search | 3 | ? | ? | |
| 4. Pricing System | 4 | ? | ? | |
| 5. Tracking Codes | 3 | ? | ? | |
| 6. Home Page | 3 | ? | ? | |
| 7. Tracking Page | 2 | ? | ? | |
| **TOTAL** | **29** | **?** | **?** | |

---

## Issues Found
(To be filled during testing)

---

## Sign-Off
- Tester: 
- Date: 
- Status: ☐ Pass ☐ Fail ☐ Partial
