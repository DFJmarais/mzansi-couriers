import { eq } from 'drizzle-orm';
import { appRouter } from '../server/routers.ts';
import { getDb } from '../server/db.ts';
import { users, addresses, deliveries, deliveryPaymentSessions } from '../drizzle/schema.ts';
import { initializeParcelLedger, getParcelLedgerState } from '../server/services/financial-ledger.ts';
import { handlePaystackWebhook } from '../server/payments/webhook.ts';

async function main() {
const reference = 'sandbox-refund-charge-1791012186291';
const db = await getDb();
if (!db) throw new Error('Database unavailable');
const customer = (await db.select().from(users).where(eq(users.role, 'customer')).limit(1))[0];
const admin = (await db.select().from(users).where(eq(users.role, 'admin')).limit(1))[0];
if (!customer || !admin) throw new Error('Existing customer/admin fixture is required');
const [pickup] = await db.insert(addresses).values({ userId: customer.id, label: 'Sandbox pickup', street: '1 Test Street', city: 'Johannesburg', postalCode: '2000', latitude: '-26.20410000', longitude: '28.04730000' }).$returningId();
const [dropoff] = await db.insert(addresses).values({ userId: customer.id, label: 'Sandbox dropoff', street: '2 Test Street', city: 'Johannesburg', postalCode: '2001', latitude: '-26.21000000', longitude: '28.05000000' }).$returningId();
const [delivery] = await db.insert(deliveries).values({ customerId: customer.id, recipientName: 'Sandbox Recipient', recipientEmail: 'sandbox-recipient@mzansicouriers.co.za', pickupAddressId: Number(pickup.id), dropoffAddressId: Number(dropoff.id), pickupLatitude: '-26.20410000', pickupLongitude: '28.04730000', dropoffLatitude: '-26.21000000', dropoffLongitude: '28.05000000', status: 'pending', packageSize: 'small', packageType: 'box', lengthCm: '10.0', widthCm: '10.0', heightCm: '10.0', packageWeight: '1.00', packageDescription: 'Sandbox refund test parcel', trackingCode: `#MZ-SBX${Date.now().toString().slice(-6)}-TST`, estimatedPrice: '10.00', finalPrice: '10.00', distance: '1.00' }).$returningId();
const deliveryId = Number(delivery.id);
await db.insert(deliveryPaymentSessions).values({ customerId: customer.id, reference, amount: '10.00', currency: 'ZAR', status: 'paid', bookingData: { sandbox: true, purpose: 'manual_refund_flow' }, deliveryId, paidAt: new Date() });
await initializeParcelLedger({ deliveryId, customerPayment: 10, paymentCost: 0 });
const caller = (user) => appRouter.createCaller({ req: {}, res: {}, user });
const requested = await caller(customer).refunds.request({ deliveryId, requestedAmount: 5, reason: 'Sandbox manual refund lifecycle test' });
const reviewed = await caller(admin).refunds.review({ requestId: requested.requestId });
const approved = await caller(admin).refunds.approve({ requestId: requested.requestId, amount: 5, adminNote: 'Approved for sandbox verification' });
if (!approved.approved || !approved.paystackRefundId) throw new Error(`Refund initiation failed: ${JSON.stringify(approved)}`);
const processing = await handlePaystackWebhook({ event: 'refund.processing', data: { transaction_reference: reference, refund_reference: approved.paystackRefundId, amount: 500 } });
const processed = await handlePaystackWebhook({ event: 'refund.processed', data: { transaction_reference: reference, refund_reference: approved.paystackRefundId, amount: 500 } });
const duplicate = await handlePaystackWebhook({ event: 'refund.processed', data: { transaction_reference: reference, refund_reference: approved.paystackRefundId, amount: 500 } });
const ledger = await getParcelLedgerState(deliveryId);
console.log(JSON.stringify({ deliveryId, requestId: requested.requestId, reviewed: reviewed.status, approved: { status: approved.status, refundId: approved.paystackRefundId }, webhook: { processing, processed, duplicate }, ledger: { customerPayment: ledger.customerPayment, platformAllocation: ledger.platformAllocation, courierPoolAllocation: ledger.courierPoolAllocation, refunds: ledger.refunds, platformReversals: ledger.platformReversals, courierPoolReversals: ledger.courierPoolReversals, finalPlatformContribution: ledger.finalPlatformContribution, finalCourierEarnings: ledger.finalCourierEarnings } }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
