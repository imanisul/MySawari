import React from 'react';
import { useRouter } from 'expo-router';
import { PaymentFailed } from '@/components/booking/PaymentResult';

/** /payment-error: the same "Payment Failed" page as checkout; Try again returns to the Payment Option page. */
export default function PaymentErrorScreen() {
  const router = useRouter();
  return <PaymentFailed onButton={() => router.replace('/booking')} />;
}