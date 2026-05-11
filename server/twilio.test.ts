import { describe, it, expect } from 'vitest';
import { verifyTwilioCredentials } from './_core/twilio';

describe('Twilio Integration', () => {
  it('should verify Twilio credentials are valid', async () => {
    const isValid = await verifyTwilioCredentials();
    expect(isValid).toBe(true);
  }, { timeout: 10000 });

  it('should have Twilio environment variables set', () => {
    expect(process.env.TWILIO_ACCOUNT_SID).toBeDefined();
    expect(process.env.TWILIO_AUTH_TOKEN).toBeDefined();
    expect(process.env.TWILIO_WHATSAPP_NUMBER).toBeDefined();
  }, { timeout: 5000 });
});
