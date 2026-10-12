# Mzansi Couriers - Payout System Implementation Guide

## Overview
This guide documents the Payout on Demand system for couriers and automatic weekly owner revenue payouts.

## Completed Components

### 1. Frontend - Courier Dashboard
**File:** `client/src/pages/CourierDashboard.tsx`
- Added "Payout on Demand" card with amber/orange branding
- Features:
  - "Request Payout Now" button
  - "View History" button
  - Information about instant payouts, 24/7 availability
  - Minimum R100 payout amount
  - Small processing fee (1%)

### 2. Frontend - Courier Onboarding Training
**File:** `client/src/pages/CourierOnboarding.tsx`
- Added "Payout on Demand" training card (14th card)
- Explains:
  - Instant payouts to bank account
  - 24/7 availability (weekends included)
  - Minimum R100
  - Processing fee
  - Use case: Get cash quickly when needed

### 3. Backend - Payout Router
**File:** `server/routers/payoutRouter.ts`
- **Procedures:**
  1. `requestCourierPayout` - Courier requests instant payout
  2. `getCourierPayoutHistory` - View payout history
  3. `processWeeklyOwnerPayout` - Admin: Process weekly 20% revenue
  4. `getOwnerPayoutHistory` - Admin: View owner payouts
  5. `getWeeklyRevenueSummary` - Admin: Current week revenue

## Remaining Tasks

### 1. Database Schema Updates
Add these tables to `drizzle/schema.ts`:

```typescript
export const courier_payouts = sqliteTable('courier_payouts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  courier_id: text('courier_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(), // in cents
  bank_account_id: text('bank_account_id').notNull(),
  type: text('type').notNull(), // 'on_demand' or 'weekly'
  status: text('status').notNull(), // 'pending', 'processing', 'completed', 'failed'
  processing_fee: integer('processing_fee').notNull(), // 1% fee
  net_amount: integer('net_amount').notNull(), // amount - fee
  requested_at: integer('requested_at').notNull(),
  completed_at: integer('completed_at'),
  paystack_transfer_id: text('paystack_transfer_id'),
  error_message: text('error_message'),
});

export const owner_payouts = sqliteTable('owner_payouts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  owner_id: text('owner_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(), // 20% of total delivery fees
  delivery_count: integer('delivery_count').notNull(),
  period_start: integer('period_start').notNull(),
  period_end: integer('period_end').notNull(),
  status: text('status').notNull(), // 'pending', 'processing', 'completed'
  created_at: integer('created_at').notNull(),
  paystack_transfer_id: text('paystack_transfer_id'),
});
```

### 2. Update Users Table
Add to `users` table in schema:
```typescript
available_balance: integer('available_balance').default(0), // Courier's available balance in cents
```

### 3. Update Deliveries Table
Add to `deliveries` table:
```typescript
platform_fee: integer('platform_fee'), // 20% of delivery fee (owner's cut)
```

### 4. Run Database Migration
```bash
pnpm drizzle-kit generate
# Review the generated SQL migration
# Apply via webdev_execute_sql
```

### 5. Update Router Exports
Add to `server/routers.ts`:
```typescript
import { payoutRouter } from './routers/payoutRouter';

export const appRouter = router({
  // ... existing routers
  payout: payoutRouter,
});
```

### 6. Create Scheduled Job for Weekly Owner Payout
Create `server/_core/jobs/weeklyPayoutJob.ts`:
```typescript
import { trpc } from '@/lib/trpc';

export async function scheduleWeeklyPayoutJob() {
  // Run every Friday at 5 PM
  // Call: trpc.payout.processWeeklyOwnerPayout.mutate()
  // This processes all deliveries from Monday-Sunday
  // Calculates 20% platform fee
  // Creates owner payout record
}
```

### 7. Integrate with Paystack
Update `server/payments/paystack.ts`:
```typescript
// Add transfer function for payouts
export async function initiatePaystackTransfer(
  amount: number,
  recipient_code: string,
  reference: string
) {
  // Call Paystack Transfers API
  // https://api.paystack.co/transfer
}
```

### 8. Create Frontend Components
- `CourierPayoutModal.tsx` - Modal for requesting payout
- `PayoutHistoryPage.tsx` - View payout history
- `AdminPayoutDashboard.tsx` - Admin view of all payouts

### 9. Add Routes to App.tsx
```typescript
<Route path="/payout/history" component={PayoutHistoryPage} />
<Route path="/admin/payouts" component={AdminPayoutDashboard} />
```

### 10. Create Tests
- Test courier payout request with sufficient balance
- Test insufficient balance error
- Test weekly owner payout calculation
- Test payout history retrieval

## Implementation Order

1. **Database Schema** - Add tables and columns
2. **Database Migration** - Generate and apply SQL
3. **Backend Router** - Fix TypeScript errors and test procedures
4. **Scheduled Job** - Set up weekly payout trigger
5. **Paystack Integration** - Add transfer functionality
6. **Frontend Components** - Create modals and pages
7. **Route Integration** - Add to App.tsx
8. **Testing** - Unit and integration tests
9. **Deployment** - Save checkpoint and deploy

## Key Business Logic

### Courier Payout on Demand
1. Courier requests payout (minimum R100)
2. System verifies available balance
3. Deducts amount from balance (includes 1% processing fee)
4. Creates pending payout record
5. Triggers Paystack transfer
6. Updates status when transfer completes

### Owner Weekly Revenue
1. Every Friday, system calculates revenue
2. Gets all completed deliveries from Monday-Sunday
3. Calculates 20% platform fee from each delivery
4. Sums total fees for the week
5. Creates owner payout record
6. Triggers Paystack transfer to owner's bank account

## Paystack Configuration

- **Recipient Code** - Created during courier onboarding
- **Transfer Amount** - In kobo (divide by 100)
- **Transfer Reason** - "Mzansi Couriers Payout"
- **Settlement Account** - Owner's bank account

## Security Considerations

- All payout requests require authentication
- Admin procedures require admin role
- Sensitive bank details stored securely
- All transactions logged for audit trail
- Processing fees transparent to couriers
- Weekly owner payouts automated and auditable

## Testing Checklist

- [ ] Courier can request payout with sufficient balance
- [ ] Insufficient balance error shows correctly
- [ ] Payout history displays correctly
- [ ] Weekly owner payout calculates 20% correctly
- [ ] Admin can view all payouts
- [ ] Paystack transfers process successfully
- [ ] Failed transfers handled gracefully
- [ ] Payout status updates correctly
- [ ] Processing fees calculated accurately
