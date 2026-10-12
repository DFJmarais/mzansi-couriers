# Mzansi Couriers - Testing Guide

## Testing Strategy

This document outlines the testing approach for Mzansi Couriers, covering unit tests, integration tests, end-to-end tests, and performance testing.

## Unit Tests

Unit tests verify individual functions and components in isolation.

### Running Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/auth.logout.test.ts

# Run tests with coverage
pnpm test --coverage
```

### Test Structure

Tests are located in `server/*.test.ts` files. Each test file follows this pattern:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../db';

describe('Delivery Service', () => {
  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should create a delivery', async () => {
    const result = await db.createDelivery({
      customerId: 1,
      pickupAddress: '123 Main St',
      dropoffAddress: '456 Oak Ave',
      packageSize: 'medium',
      price: 50,
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe('pending');
  });
});
```

### Key Test Areas

**Authentication**
- Login/logout flows
- Session management
- Token validation
- Role-based access

**Deliveries**
- Create delivery
- Update status
- Assign courier
- Calculate pricing
- Track delivery

**Payments**
- Process payment
- Refund handling
- Invoice generation
- Payment verification

**Notifications**
- Send SMS
- Send WhatsApp
- Send email
- Notification preferences

## Integration Tests

Integration tests verify multiple components working together.

### Running Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Run specific integration test
pnpm test:integration delivery.integration.test.ts
```

### Integration Test Examples

**Delivery Booking Flow**
1. Customer logs in
2. Creates delivery
3. System calculates price
4. Payment processed
5. Courier assigned
6. Notifications sent

**Courier Assignment Flow**
1. Delivery created
2. System finds available couriers
3. Courier accepts job
4. Customer notified
5. Tracking starts

## End-to-End Tests

End-to-end tests verify complete user workflows through the UI.

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e booking.e2e.test.ts

# Run E2E tests in headed mode (see browser)
pnpm test:e2e --headed
```

### E2E Test Scenarios

**Customer Booking Scenario**
1. Visit home page
2. Click "Send a Package"
3. Fill booking form
4. Select package size
5. Enter recipient details
6. Review price
7. Proceed to payment
8. Complete payment
9. Verify confirmation

**Courier Assignment Scenario**
1. Courier logs in
2. View available jobs
3. Accept delivery
4. Navigate to pickup
5. Mark as picked up
6. Navigate to dropoff
7. Mark as delivered
8. Submit receipt

## Performance Testing

Performance tests verify the app handles load correctly.

### Running Performance Tests

```bash
# Run load test (100 concurrent users)
pnpm test:load

# Run stress test (1000 concurrent users)
pnpm test:stress

# Run endurance test (24 hours)
pnpm test:endurance
```

### Performance Benchmarks

| Scenario | Target | Acceptable |
|----------|--------|-----------|
| Page load (1K users) | <2s | <3s |
| API response (100 req/s) | <200ms | <500ms |
| Database query | <50ms | <100ms |
| Concurrent deliveries | 100 | 50 |

### Load Test Scenarios

**Scenario 1: Normal Load**
- 100 concurrent users
- 10 requests per user
- Expected: 100% success rate

**Scenario 2: Peak Load**
- 1000 concurrent users
- 5 requests per user
- Expected: >95% success rate

**Scenario 3: Stress Test**
- 5000 concurrent users
- 1 request per user
- Expected: >80% success rate

## Security Testing

Security tests verify protection against common vulnerabilities.

### Running Security Tests

```bash
# Run security audit
pnpm audit

# Run OWASP ZAP scan
pnpm test:security

# Check for vulnerabilities
pnpm test:vulnerabilities
```

### Security Test Checklist

**Authentication & Authorization**
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF token validation
- [ ] Session hijacking prevention
- [ ] Password hashing verification
- [ ] Rate limiting enforcement

**Data Protection**
- [ ] HTTPS enforcement
- [ ] Data encryption
- [ ] PII protection
- [ ] Secure headers
- [ ] Cookie security

**API Security**
- [ ] Input validation
- [ ] Output encoding
- [ ] Error handling
- [ ] API key rotation
- [ ] Webhook verification

## Browser Testing

Browser tests verify compatibility across different browsers.

### Supported Browsers

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Chrome (Android)
- Mobile Safari (iOS)

### Running Browser Tests

```bash
# Test on Chrome
pnpm test:browser:chrome

# Test on Firefox
pnpm test:browser:firefox

# Test on Safari
pnpm test:browser:safari

# Test all browsers
pnpm test:browser:all
```

## Mobile Testing

Mobile tests verify the app works on mobile devices.

### Mobile Devices

- iPhone 12/13/14/15
- Samsung Galaxy S21/S22/S23
- Pixel 6/7/8
- iPad (various sizes)

### Mobile Test Checklist

- [ ] Touch interactions work
- [ ] Responsive layout
- [ ] Mobile navigation
- [ ] Keyboard handling
- [ ] Orientation changes
- [ ] Network throttling
- [ ] Battery usage
- [ ] Data usage

## Accessibility Testing

Accessibility tests verify the app is usable by everyone.

### Running Accessibility Tests

```bash
# Run accessibility audit
pnpm test:a11y

# Generate accessibility report
pnpm test:a11y --report
```

### Accessibility Checklist

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Form accessibility
- [ ] Error messages
- [ ] Skip links

## Regression Testing

Regression tests prevent new changes from breaking existing functionality.

### Running Regression Tests

```bash
# Run regression test suite
pnpm test:regression

# Compare against baseline
pnpm test:regression --baseline
```

### Regression Test Areas

- Core delivery flow
- Payment processing
- Courier assignment
- Notifications
- Admin dashboard
- User authentication
- Pricing calculations

## Test Data Management

### Seeding Test Data

```bash
# Seed test database
pnpm seed:test

# Seed with specific scenario
pnpm seed:test --scenario=peak-load
```

### Test Data Cleanup

```bash
# Clear test data
pnpm clean:test

# Reset to baseline
pnpm reset:test
```

## Continuous Integration

Tests run automatically on every commit.

### CI Pipeline

1. **Lint & Format** (2 min)
   - Check code style
   - Fix formatting issues

2. **Unit Tests** (5 min)
   - Run all unit tests
   - Check coverage >80%

3. **Integration Tests** (10 min)
   - Run integration tests
   - Verify database operations

4. **Build** (3 min)
   - Build production bundle
   - Check bundle size

5. **E2E Tests** (15 min)
   - Run critical user flows
   - Verify UI interactions

6. **Performance** (5 min)
   - Check performance metrics
   - Compare against baseline

7. **Security** (5 min)
   - Run security audit
   - Check for vulnerabilities

**Total CI Time: ~45 minutes**

## Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Server logic | 90% | TBD |
| API endpoints | 85% | TBD |
| Database layer | 80% | TBD |
| Frontend components | 75% | TBD |
| Overall | 80% | TBD |

## Debugging Tests

### Debugging Unit Tests

```bash
# Run single test with debugging
pnpm test server/auth.logout.test.ts --inspect-brk

# Run with verbose output
pnpm test --reporter=verbose
```

### Debugging E2E Tests

```bash
# Run E2E test in debug mode
pnpm test:e2e --debug

# Run with headed browser
pnpm test:e2e --headed --debug

# Pause on failure
pnpm test:e2e --pause-on-failure
```

## Test Reporting

### Generating Reports

```bash
# Generate test report
pnpm test:report

# Generate coverage report
pnpm test:coverage:report

# Generate performance report
pnpm test:performance:report
```

## Best Practices

1. **Write tests first** - Test-driven development
2. **Keep tests isolated** - No test interdependencies
3. **Use meaningful names** - Describe what's being tested
4. **Mock external services** - Don't call real APIs
5. **Clean up after tests** - Reset database state
6. **Test edge cases** - Not just happy paths
7. **Maintain test data** - Keep fixtures updated
8. **Review test coverage** - Aim for >80%

## Troubleshooting

### Tests Failing Randomly

- Check for race conditions
- Verify test isolation
- Review async/await usage
- Check database state

### Tests Running Slowly

- Profile test execution
- Optimize database queries
- Reduce unnecessary setup
- Parallelize tests

### Flaky Tests

- Increase timeouts
- Add retry logic
- Fix timing issues
- Mock non-deterministic functions

---

Last Updated: May 27, 2026
