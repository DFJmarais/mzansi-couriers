import { useEffect } from 'react';
import { PAYSTACK_CONFIG, getPaystackPublicKey, isLiveKey, getPaystackEnvironment } from '@/lib/paystack-config';

/**
 * Initialize Paystack on component mount
 * This component ensures the Paystack script is loaded and configured
 */
export function PaymentInitializer() {
  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    // Log Paystack configuration status
    console.log('Paystack Configuration:', {
      environment: getPaystackEnvironment(),
      isLive: isLiveKey(),
      publicKey: getPaystackPublicKey().substring(0, 20) + '...',
      currency: PAYSTACK_CONFIG.currency,
    });

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}

/**
 * Hook to use Paystack payment
 */
export function usePaystackPayment() {
  return {
    publicKey: getPaystackPublicKey(),
    environment: getPaystackEnvironment(),
    isLive: isLiveKey(),
    currency: PAYSTACK_CONFIG.currency,
    
    /**
     * Initialize payment with Paystack
     */
    initializePayment: (email: string, amount: number, metadata: Record<string, any>) => {
      return {
        email,
        amount: Math.round(amount * 100), // Convert to cents
        publicKey: getPaystackPublicKey(),
        ref: `${Date.now()}`,
        onClose: () => {
          console.log('Payment window closed');
        },
        onSuccess: (response: any) => {
          console.log('Payment successful:', response);
        },
        metadata,
      };
    },
  };
}
