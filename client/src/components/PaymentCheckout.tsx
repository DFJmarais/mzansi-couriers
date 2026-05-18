import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface PaymentCheckoutProps {
  amount: number;
  deliveryId: string;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
}

export function PaymentCheckout({
  amount,
  deliveryId,
  onSuccess,
  onError,
}: PaymentCheckoutProps) {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const initPayment = trpc.payments.initializeDeliveryPayment.useMutation();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await initPayment.mutateAsync({
        customer_email: email,
        amount,
        delivery_id: deliveryId,
        customer_name: email.split('@')[0],
      });

      if (result.success && result.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = result.authorization_url;
        onSuccess?.(result.reference);
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Payment failed';
        toast.error(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">Total Amount</p>
        <p className="text-3xl font-bold text-orange-600">R{(amount / 100).toFixed(2)}</p>
      </div>

      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isProcessing}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isProcessing ? 'Processing...' : 'Pay with Paystack'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          You will be redirected to Paystack to complete your payment securely.
        </p>
      </form>
    </Card>
  );
}
