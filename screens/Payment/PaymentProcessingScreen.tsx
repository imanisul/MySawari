import React, { useEffect, useRef, useState } from 'react';
import { View, BackHandler, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari, useQuote } from '@/context/SawariContext';
import { API } from '@/services/backend/api';

import { RazorpayCheckoutWebView } from '@/components/payment/RazorpayCheckoutWebView';
import { PaymentFailed } from '@/components/booking/PaymentResult';
import { PaymentProgress } from '@/components/booking/PaymentProgress';

const STEPS = ['Reserving your car', 'Opening secure payment', 'Confirming your booking'];

export default function PaymentProcessingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, createBookingSnapshot, confirmBookingPayment, confirmBooking, customer } = useSawari();
  const { pricingQuote, quoteParams } = useQuote();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated === false) {
      router.replace('/');
    }
  }, [isAuthenticated, isAuthLoading]);

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
  const holdPromiseRef = useRef<Promise<any> | null>(null);
  const paid = useRef(false);
  // Unique idempotency key generated per payment attempt to prevent double-charging or double-booking
  const idempotencyKey = useRef<string>('pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9));
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
    if (!isAuthLoading && isAuthenticated === false) {
      router.replace('/');
      return;
    }
    // The quote can refresh while this screen is open — only ever start one payment.
    if (started.current || !isAuthenticated) return;
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
        // Step 1: Kick off vehicle hold concurrently in background (does not block opening Razorpay!)
        const holdPromise = createBookingSnapshot(idempotencyKey.current);
        holdPromiseRef.current = holdPromise;
        holdPromise.then((snapshot) => {
          if (snapshot) holdId.current = snapshot.id;
          if (left.current) releaseHold();
        }).catch((err) => {
          if (!paid.current) {
            setErrorMsg(err?.message || 'Failed to secure vehicle lock.');
            setStatus('ERROR');
          }
        });

        // Step 2: Fetch or reuse prefetched Razorpay order (sub-millisecond from preloaded cache)
        const order = await API.createRazorpayOrder(
          { onlinePayableNow: pricingQuote.onlinePayableNow, idempotencyKey: idempotencyKey.current },
          idempotencyKey.current
        );

        if (left.current) { releaseHold(); return; }

        setSetupStep(1);
        setRazorpayOrder(order);
        // Show opening screen with 'Opening secure payment' then reveal Razorpay in milliseconds
        setTimeout(() => {
          if (!left.current) {
            setStatus('PAYMENT_PENDING');
          }
        }, 250);
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
    if (holdPromiseRef.current) {
      try {
        const snapshot = await holdPromiseRef.current;
        if (snapshot) holdId.current = snapshot.id;
      } catch {}
    }
    // One call: the server checks the signature and the payment with Razorpay as it confirms the booking
    // (a separate verify-signature call first cost an extra round trip).
    completeBookingFlow({ razorpayOrderId: data.razorpay_order_id, razorpayPaymentId: data.razorpay_payment_id, razorpaySignature: data.razorpay_signature });
  };

  const completeBookingFlow = async (paymentDetails: { razorpayOrderId?: string, razorpayPaymentId?: string, razorpaySignature?: string } | null) => {
    // Confirmation is under way (paid online, or fully covered by Sawari Cash): never release this hold now.
    paid.current = true;
    setStatus('VERIFYING');
    // The confirm call is safe to repeat (the server answers "already confirmed"). A timeout or dropped
    // connection — common while the server wakes up — does not mean it failed, so it is retried, never cancelled.
    const isConnectionError = (e: any) => /connect|taking too long|network/i.test(String(e?.message || ''));
    const confirmWithRetry = async () => {
      for (let attempt = 1; ; attempt++) {
        try {
          return await confirmBookingPayment(paymentDetails || {}, holdId.current || undefined, idempotencyKey.current);
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
      }, 600);
    } catch (e: any) {
      const reason = e.message || 'Failed to confirm booking';
      
      if (paymentDetails?.razorpayPaymentId) {
        // Money has moved. The app never cancels this booking itself: when the car was lost or the checkout
        // had closed, the server has already cancelled the hold and handled the refund (its message says
        // so), and when the server simply couldn't be reached the booking may well be confirmed.
        import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('payment_unconfirmed', 'PaymentProcessingScreen', { reason, paymentId: paymentDetails?.razorpayPaymentId })); // not 'payment_failed': that sends a "try again" push, wrong once money has moved

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

  const payNow = pricingQuote?.onlinePayableNow;

  // The payment page is mounted (hidden) while the car is held and the order created, so checkout.js is already
  // loaded when the order arrives and the sheet opens straight away.
  if (status === 'INITIATING' || (status === 'PAYMENT_PENDING' && razorpayOrder)) {
    const pending = status === 'PAYMENT_PENDING';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <PaymentProgress
          title={pending ? 'Opening secure payment' : setupStep === 0 ? 'Reserving your car' : 'Initiating payment'}
          subtitle={pending ? 'Connecting to Razorpay. Please don’t close the app or press back.' : 'Hold on, this only takes a few seconds. Please don’t press back.'}
          steps={STEPS}
          current={pending ? 1 : setupStep}
          amount={payNow}
        />
        <View style={pending ? StyleSheet.absoluteFill : { position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents={pending ? 'auto' : 'none'}>
          <RazorpayCheckoutWebView
            visible={pending}
            orderId={razorpayOrder?.orderId}
            amount={razorpayOrder?.amountPaise}
            currency="INR"
            name="MySawari"
            description="Vehicle Rental Booking"
            themeColor={colors.navy || '#111A2B'}
            razorpayKey={razorpayOrder?.keyId}
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

  // Checking the payment with the server.
  return (
    <PaymentProgress
      title="Verifying payment"
      subtitle="We’re confirming your payment with the bank. Please don’t close the app or press back."
      steps={STEPS}
      current={2}
      amount={payNow}
    />
  );
}
