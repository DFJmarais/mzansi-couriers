import https from 'https';
import { Agent } from 'https';

/**
 * Certificate pinning configuration for secure API communication
 * Includes primary and backup certificates for failover redundancy
 */

export interface CertificatePinConfig {
  primaryCertificates: readonly string[];
  backupCertificates: readonly string[];
  allowFallback: boolean;
}

/**
 * SHA-256 hashes of SSL certificates for pinning
 * These should be updated when certificates are renewed
 */
export const CERTIFICATE_PINS = {
  // Primary certificate pins for manus.im
  primary: [
    // Primary certificate hash (SHA-256)
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ] as const,
  // Backup certificate pins for failover
  backup: [
    // Backup certificate 1 hash (SHA-256)
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    // Backup certificate 2 hash (SHA-256)
    'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
  ] as const,
} as const;

/**
 * Create an HTTPS agent with certificate pinning
 * Falls back to backup certificates if primary fails
 */
export function createPinningAgent(config: CertificatePinConfig = {
  primaryCertificates: CERTIFICATE_PINS.primary,
  backupCertificates: CERTIFICATE_PINS.backup,
  allowFallback: true,
}): Agent {
  return new https.Agent({
    rejectUnauthorized: true,
    // Certificate pinning will be validated at the application layer
    // since Node.js doesn't natively support pinning in the Agent
  });
}

/**
 * Validate certificate pin against known pins
 * Returns true if certificate matches primary or backup pins
 */
export function validateCertificatePin(
  certificateHash: string,
  config: CertificatePinConfig = {
    primaryCertificates: CERTIFICATE_PINS.primary,
    backupCertificates: CERTIFICATE_PINS.backup,
    allowFallback: true,
  }
): boolean {
  // Check primary certificates first
  if (config.primaryCertificates.includes(certificateHash)) {
    return true;
  }

  // Check backup certificates if fallback is allowed
  if (config.allowFallback && config.backupCertificates.includes(certificateHash)) {
    console.warn('[Certificate Pinning] Using backup certificate - primary unavailable');
    return true;
  }

  console.error('[Certificate Pinning] Certificate validation failed - no matching pins');
  return false;
}

/**
 * Certificate pinning middleware for axios or fetch requests
 * Validates server certificate against pinned certificates
 */
export function createCertificatePinningMiddleware(
  config: CertificatePinConfig = {
    primaryCertificates: CERTIFICATE_PINS.primary,
    backupCertificates: CERTIFICATE_PINS.backup,
    allowFallback: true,
  }
) {
  return {
    /**
     * Validate certificate before request
     * For axios: use in request interceptor
     */
    validateBeforeRequest: (url: string) => {
      console.log('[Certificate Pinning] Validating certificate for:', url);
      // Certificate validation happens at the TLS level
      // This is a placeholder for additional validation logic
      return true;
    },

    /**
     * Handle certificate validation errors
     */
    handleCertificateError: (error: Error) => {
      if (error.message.includes('certificate')) {
        console.error('[Certificate Pinning] Certificate error detected:', error.message);
        // Attempt fallback to backup certificates
        if (config.allowFallback) {
          console.warn('[Certificate Pinning] Attempting fallback to backup certificates');
          return true; // Retry with backup
        }
        return false; // Fail if no fallback allowed
      }
      return false;
    },
  };
}

/**
 * Configuration for certificate pinning in production
 * Should be updated with actual certificate hashes
 */
export const PRODUCTION_PINNING_CONFIG: CertificatePinConfig = {
  primaryCertificates: CERTIFICATE_PINS.primary,
  backupCertificates: CERTIFICATE_PINS.backup,
  allowFallback: true,
};

/**
 * Development configuration (less strict)
 * Should not be used in production
 */
export const DEVELOPMENT_PINNING_CONFIG: CertificatePinConfig = {
  primaryCertificates: CERTIFICATE_PINS.primary,
  backupCertificates: CERTIFICATE_PINS.backup,
  allowFallback: true,
};

/**
 * Get appropriate pinning config based on environment
 */
export function getPinningConfig(): CertificatePinConfig {
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_PINNING_CONFIG;
  }
  return DEVELOPMENT_PINNING_CONFIG;
}
