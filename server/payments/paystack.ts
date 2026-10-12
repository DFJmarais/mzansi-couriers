import axios from 'axios';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is not set');
}

const paystackClient = axios.create({
  baseURL: PAYSTACK_API_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a payment transaction
 */
export async function initializePayment(params: {
  email: string;
  amount: number; // Amount in kobo (1 Naira = 100 kobo, 1 ZAR = 100 cents)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const response = await paystackClient.post('/transaction/initialize', {
      email: params.email,
      amount: Math.round(params.amount * 100), // Convert to cents/kobo
      reference: params.reference || `ref-${Date.now()}`,
      ...(params.callback_url ? { callback_url: params.callback_url } : {}),
      metadata: params.metadata || {},
    });

    return {
      success: true,
      data: response.data.data,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error: any) {
    console.error('[Paystack] Initialize payment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(reference: string) {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);

    const transaction = response.data.data;
    return {
      success: true,
      data: {
        reference: transaction.reference,
        amount: transaction.amount / 100, // Convert from cents/kobo to currency
        status: transaction.status,
        customer_email: transaction.customer.email,
        customer_id: transaction.customer.id,
        authorization: transaction.authorization,
        paid_at: transaction.paid_at,
        created_at: transaction.created_at,
        channel: transaction.channel,
        currency: transaction.currency,
      },
      isPaid: transaction.status === 'success',
    };
  } catch (error: any) {
    console.error('[Paystack] Verify payment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      isPaid: false,
    };
  }
}

/** Queue a full or partial refund. The caller must have already completed the admin decision and amount checks. */
export async function initiateRefund(params: { transaction: string; amount?: number; merchantNote?: string; customerNote?: string }) {
  try {
    const response = await paystackClient.post('/refund', {
      transaction: params.transaction,
      ...(params.amount === undefined ? {} : { amount: Math.round(params.amount * 100) }),
      ...(params.merchantNote ? { merchant_note: params.merchantNote } : {}),
      ...(params.customerNote ? { customer_note: params.customerNote } : {}),
    });
    const refund = response.data.data;
    return { success: true as const, data: refund, status: refund?.status ?? 'pending', refundId: refund?.id ? String(refund.id) : null };
  } catch (error: any) {
    console.error('[Paystack] Refund initiation failed:', error.response?.data?.message || error.message);
    return { success: false as const, error: error.response?.data?.message || error.message };
  }
}

/**
 * Create a transfer recipient for courier payouts
 */
export async function createTransferRecipient(params: {
  type: 'nuban' | 'mobile_money' | 'ghipss';
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}) {
  try {
    const response = await paystackClient.post('/transferrecipient', {
      type: params.type,
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: params.currency || 'ZAR',
    });

    return {
      success: true,
      data: response.data.data,
      recipient_code: response.data.data.recipient_code,
    };
  } catch (error: any) {
    console.error('[Paystack] Create transfer recipient error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Initiate a transfer to a recipient
 */
export async function initiateTransfer(params: {
  source: 'balance' | 'main';
  recipient_code: string;
  amount: number; // Amount in currency (will be converted to cents/kobo)
  reason?: string;
  reference?: string;
}) {
  try {
    const response = await paystackClient.post('/transfer', {
      source: params.source,
      recipient_code: params.recipient_code,
      amount: Math.round(params.amount * 100), // Convert to cents/kobo
      reason: params.reason || 'Courier payout',
      reference: params.reference || `transfer-${Date.now()}`,
    });

    return {
      success: true,
      data: response.data.data,
      transfer_code: response.data.data.transfer_code,
      reference: response.data.data.reference,
      status: response.data.data.status,
    };
  } catch (error: any) {
    console.error('[Paystack] Initiate transfer error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Verify a transfer
 */
export async function verifyTransfer(reference: string) {
  try {
    const response = await paystackClient.get(`/transfer/verify/${reference}`);

    const transfer = response.data.data;
    return {
      success: true,
      data: {
        reference: transfer.reference,
        amount: transfer.amount / 100,
        status: transfer.status,
        recipient: transfer.recipient,
        transfer_code: transfer.transfer_code,
      },
      isSuccessful: transfer.status === 'success',
    };
  } catch (error: any) {
    console.error('[Paystack] Verify transfer error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      isSuccessful: false,
    };
  }
}

/**
 * Get list of banks for account verification
 */
export async function getBanks() {
  try {
    const response = await paystackClient.get('/bank?currency=ZAR');
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error('[Paystack] Get banks error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      data: [],
    };
  }
}

/**
 * Verify account details
 */
export async function verifyAccountDetails(params: {
  account_number: string;
  bank_code: string;
}) {
  try {
    const response = await paystackClient.get('/bank/resolve', {
      params: {
        account_number: params.account_number,
        bank_code: params.bank_code,
      },
    });

    return {
      success: true,
      data: response.data.data,
      account_name: response.data.data.account_name,
    };
  } catch (error: any) {
    console.error('[Paystack] Verify account error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Test Paystack connection
 */
export async function testPaystackConnection() {
  try {
    const response = await paystackClient.get('/bank?currency=ZAR&perPage=1');
    return {
      success: true,
      message: 'Paystack connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Paystack] Connection test error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
