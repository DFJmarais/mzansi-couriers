/**
 * Courier ID Encryption Module
 * Handles QR code encryption, decryption, and courier ID generation
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.COURIER_ID_ENCRYPTION_KEY || 'mzansi-courier-secret-key-32-char';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt QR token for courier ID
 */
export function encryptQrToken(courierId: number): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);

  const data = JSON.stringify({
    courierId,
    timestamp: Date.now(),
  });

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt QR token
 */
export function decryptQrToken(token: string, maxAgeMs: number = 24 * 60 * 60 * 1000): { courierId: number; timestamp: number } | null {
  try {
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    // Check if token has expired
    const age = Date.now() - data.timestamp;
    if (age > maxAgeMs) return null;

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Generate formatted courier ID number
 */
export function generateCourierIdNumber(courierId: number): string {
  const number = String(courierId).padStart(6, '0').slice(-6);
  return `MC-${number}`;
}

/**
 * Hash verification token
 */
export function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify QR code signature
 */
export function verifyQrSignature(token: string, signature: string): boolean {
  const hash = hashVerificationToken(token);
  return hash === signature;
}

/**
 * Generate QR code data
 */
export function generateQrCodeData(courierId: number): {
  courierId: string;
  token: string;
  signature: string;
  expiresAt: Date;
} {
  const token = encryptQrToken(courierId);
  const signature = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    courierId: generateCourierIdNumber(courierId),
    token,
    signature,
    expiresAt,
  };
}
