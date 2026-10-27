import React, { useEffect, useRef, useState } from 'react';
import { View, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';

import { RazorpayCheckoutWebView } from '@/components/payment/RazorpayCheckoutWebView';
import { PaymentFailed } from '@/components/booking/PaymentResult';
import { PaymentProgress } from '@/components/booking/PaymentProgress';

const STEPS = ['Reserving your car', 'Opening secure payment', 'Confirming your booking'];

export default function PaymentProcessingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { pricingQuote, quoteParams, createBookingSnapshot, confirmBookingPayment, confirmBooking, customer } = useSawari();

  const [status, setStatus] = useState<'INITIATING' | 'PAYMENT_PENDING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('INITIATING');
  const [razorpayOrder, setRazorpayOrder] = useState<{ orderId: string, amountPaise: number, keyId: string } | null>(null);
  // Which of STEPS is under way while setting up: 0 reserving the car, 1 creating the payment order.
  const [setupStep, setSetupStep] = useState(0);
  const started = useRef(false);
  // A plan bought in this payment (named on the success screen).
  const boughtPlan = useRef<string | null>(null);
  if (boughtPlan.current === null && pricingQuote?.membershipPlanToBuy) {
    boughtPlan.current = ({ starter: 'Starter', plus: 'Plus', pro: 'Pro' } as const)[pricingQuote.membershipPlanToBuy];
  }
  const holdId = useRef<string | null>(null);
  const paid = useRef(false);
  // Set once the customer leaves this screen (back button, swipe, app navigation) before paying.
  const left = useRef(false);

  // Keep the car soft-locked for this customer while the payment sheet is open (renewed every 45s,
  // the server caps it at 10 minutes). Stops as soon as the sheet closes or this screen goes away.
  useEffect(() => {
    if (status !== 'PAYMENT_PENDING' || !holdId.current) return;
    const id = holdId.current;
    const timer = setInterval(() => { API.keepHoldAlive(id); }, 45 * 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Leaving checkout without paying frees the car for other customers straight away.
  const releaseHold = () => {
    if (holdId.current && !paid.current) {
      const id = holdId.current;
      holdId.current = null; // release once only
      API.releaseHold(id);
    }
  };

  // However the screen is left before paying (Android back, iOS swipe, closing the sheet), the car is freed
  // and the temporary record is released — it used to stay behind and show up as a booking.
  useEffect(() => () => {
    left.current = true;
    releaseHold();
  }, []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // The quote can refresh while this screen is open — only ever start one payment.
    if (started.current) return;
    // The price can still be on its way (refreshed as this screen opens): wait for it rather than failing
    // straight away; only after 15 seconds without one is it an error.
    if (!pricingQuote) {
      const t = setTimeout(() => {
        if (started.current) return;
        started.current = true;
        setErrorMsg('Couldn’t get the price for this trip. Please try again.');
        setStatus('ERROR');
      }, 15000);
      return () => clearTimeout(t);
    }
    started.current = true;

    async function startPaymentFlow() {
      if (!pricingQuote) {
        setErrorMsg('Booking quote not found. Please try again.');
        setStatus('ERROR');
        return;
      }
      try {
        // Step 1: Secure Vehicle Hold (Atomic OCC)
        const snapshot = await createBookingSnapshot();
        if (!snapshot) throw new Error('Failed to secure vehicle lock. Please try again.');
        holdId.current = snapshot.id;
        // The customer went back while the hold was being created: free it and stop here.
        if (left.current) { releaseHold(); return; }
        setSetupStep(1);

        // Step 2: Create Order
        const order = await API.createRazorpayOrder({ onlinePayableNow: pricingQuote.onlinePayableNow });
        if (left.current) { releaseHold(); return; }
        setRazorpayOrder(order);
        setStatus('PAYMENT_PENDING'); 
      } catch (err: any) {
        // Handle 100% sawari cash / zero online payable flow
        if (left.current) { releaseHold(); return; }
        if (String(err?.message || '').includes('No Razorpay order required')) {
          completeBookingFlow(null); // Bypass Razorpay entirely
        } else {
          setErrorMsg(err.message || 'Failed to initiate payment');
          setStatus('ERROR');
        }
      }
    }
    startPaymentFlow();
  }, [quoteParams, pricingQuote]);

  const handleRazorpaySuccess = async (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
    paid.current = true; // money has moved: never release this hold from the app
    setStatus('VERIFYING');
    try {
      const isVerified = await API.verifyPayment(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
      if (isVerified) {
        completeBookingFlow({ razorpayOrderId: data.razorpay_order_id, razorpayPaymentId: data.razorpay_payment_id });
      } else {
        // Never actually left unresolved: if the payment was really deducted, the ID is shown so support can trace it.
        setErrorMsg(`Payment verification failed for payment ${data.razorpay_payment_id}. If the amount was deducted, please contact support with this payment ID.`);
        setStatus('ERROR');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Payment verification failed');
      setStatus('ERROR');
    }
  };

  const completeBookingFlow = async (paymentDetails: { razorpayOrderId?: string, razorpayPaymentId?: string } | null) => {
    // Confirmation is under way (paid online, or fully covered by Sawari Cash): never release this hold now.
    paid.current = true;
    setStatus('VERIFYING');
    // The confirm call is safe to repeat (the server answers "already confirmed"). A timeout or dropped
    // connection — common while the server wakes up — does not mean it failed, so it is retried, never cancelled.
    const isConnectionError = (e: any) => /connect|taking too long|network/i.test(String(e?.message || ''));
    const confirmWithRetry = async () => {
      for (let attempt = 1; ; attempt++) {
        try {
          return await confirmBookingPayment(paymentDetails || {}, holdId.current || undefined);
        } catch (e: any) {
          if (attempt >= 3 || !isConnectionError(e)) throw e;
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    };
    try {
      // Step 3: Confirm Booking Payment securely
      await confirmWithRetry();
      
      confirmBooking();
      setStatus('SUCCESS');
      
      import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('payment_success', 'PaymentProcessingScreen', { paymentId: paymentDetails?.razorpayPaymentId }));

      setTimeout(() => {
        router.replace('/confirmation');
      }, 1500);
    } catch (e: any) {
      const reason = e.message || 'Failed to confirm booking';
      
      if (paymentDetails?.razorpayPaymentId) {
        // Money has moved. The app never cancels this booking itself: when the car was lost or the checkout
        // had closed, the server has already cancelled the hold and handled the refund (its message says
        // so), and when the server simply couldn't be reached the booking may well be confirmed.
        import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('payment_failed', 'PaymentProcessingScreen', { reason, paymentId: paymentDetails?.razorpayPaymentId }));

        setErrorMsg(isConnectionError(e)
          ? `Your payment (${paymentDetails.razorpayPaymentId}) was received, but we couldn't reach our server to confirm the booking. Please check My Bookings in a minute — if it isn't there, contact support with this payment ID.`
          : `Your payment (${paymentDetails.razorpayPaymentId}) was received, but the booking could not be confirmed: ${reason}`);
        setStatus('ERROR');
      } else {
        import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('payment_failed', 'PaymentProcessingScreen', { reason }));
        setErrorMsg(reason);
        setStatus('ERROR');
      }
    }
  }

  const handleCancel = () => {
    left.current = true;
    releaseHold();
    router.back(); // Go back to payment page to retry
  };

  // Android back button: before payment it cancels the checkout (and frees the hold); while the payment is
  // being verified it is ignored, so a paid booking is never abandoned half-way.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status === 'VERIFYING' || status === 'SUCCESS') return true;
      if (status === 'ERROR' && paid.current) { router.replace('/bookings'); return true; }
      handleCancel();
      return true;
    });
    return () => sub.remove();
  }, [status]);

  if (status === 'PAYMENT_PENDING' && razorpayOrder) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <RazorpayCheckoutWebView
          orderId={razorpayOrder.orderId}
          amount={razorpayOrder.amountPaise}
          currency="INR"
          name="MySawari"
          description="Vehicle Rental Booking"
          themeColor={colors.primary}
          razorpayKey={razorpayOrder.keyId}
          prefill={{
            name: customer?.name || undefined,
            contact: customer?.mobile || undefined,
            email: customer?.email || undefined,
          }}
          onSuccess={handleRazorpaySuccess}
          onFailure={(err) => {
            releaseHold();
            const message = typeof err === 'string'
              ? err
              : (err?.description || err?.message || err?.reason || 'Payment failed or cancelled.');
            setErrorMsg(message);
            setStatus('ERROR');
          }}
          onClose={handleCancel}
        />
      </View>
    );
  }

  if (status === 'ERROR') {
    // Figma "Payment Failed". After money has moved, the button never goes back to checkout (that would
    // invite paying twice): it opens My Bookings, where the booking or the refund shows up.
    return paid.current ? (
      <PaymentFailed
        title="Booking Not Confirmed"
        message={errorMsg || 'Your payment was received but the booking could not be confirmed.'}
        buttonLabel="View My Bookings"
        onButton={() => router.replace('/bookings')}
      />
    ) : (
      <PaymentFailed
        message={errorMsg && !/cancel/i.test(errorMsg) ? `${errorMsg} No money was taken.` : 'Your booking is Failed. Try again'}
        onButton={handleCancel}
      />
    );
  }

  const payNow = pricingQuote?.onlinePayableNow;

  if (status === 'SUCCESS') {
    return (
      <PaymentProgress
        done
        title="Payment successful"
        subtitle={boughtPlan.current
          ? `Your booking is confirmed and your ${boughtPlan.current} membership is active. Taking you to it…`
          : 'Your booking is confirmed. Taking you to it…'}
        steps={STEPS}
        current={STEPS.length}
        amount={payNow}
      />
    );
  }

  // Setting up checkout, or checking the payment with the server.
  return status === 'INITIATING' ? (
    <PaymentProgress
      title={setupStep === 0 ? 'Reserving your car' : 'Initiating payment'}
      subtitle="Hold on, this only takes a few seconds. Please don’t press back."
      steps={STEPS}
      current={setupStep}
      amount={payNow}
    />
  ) : (
    <PaymentProgress
      title="Verifying payment"
      subtitle="We’re confirming your payment with the bank. Please don’t close the app or press back."
      steps={STEPS}
      current={2}
      amount={payNow}
    />
  );
}