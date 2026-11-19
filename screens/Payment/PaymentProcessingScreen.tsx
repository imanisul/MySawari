import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, Pressable, BackHandler, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari, useQuote } from '@/context/SawariContext';
import { API } from '@/services/backend/api';

import { RazorpayCheckoutWebView } from '@/components/payment/RazorpayCheckoutWebView';
import { PaymentFailed } from '@/components/booking/PaymentResult';
import { PaymentProgress } from '@/components/booking/PaymentProgress';

const STEPS = ['Reserving your car', 'Opening secure payment', 'Confirming your booking'];
const DEFAULT_LOCK_SECONDS = 120;

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PaymentProcessingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, createBookingSnapshot, confirmBookingPayment, confirmBooking, customer, selectedCar } = useSawari();
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
  const [lockExpiresAtMs, setLockExpiresAtMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_LOCK_SECONDS);
  const started = useRef(false);
  // A plan bought in this payment (named on the success screen).
  const boughtPlan = useRef<string | null>(null);
  if (boughtPlan.current === null && pricingQuote?.membershipPlanToBuy) {
    boughtPlan.current = ({ starter: 'Starter', plus: 'Plus', pro: 'Pro' } as const)[pricingQuote.membershipPlanToBuy];
  }
  const holdId = useRef<string | null>(null);
  const holdPromiseRef = useRef<Promise<any> | null>(null);
  const paid = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Unique idempotency key generated per payment attempt to prevent double-charging or double-booking
  const idempotencyKey = useRef<string>('pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9));
  // Set once the customer leaves this screen (back button, swipe, app navigation) before paying.
  const left = useRef(false);

  // Leaving checkout without paying frees the car for other customers straight away.
  const releaseHold = () => {
    if (holdId.current && !paid.current) {
      const id = holdId.current;
      holdId.current = null; // release once only
      API.releaseHold(id);
    }
  };

  // Track foreground/background transitions: if user switches to GPay/PhonePe/Paytm UPI app,
  // renew the server hold once so UPI PIN completion is never interrupted by timer expiry.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (
        status === 'PAYMENT_PENDING' &&
        !paid.current &&
        holdId.current &&
        prev === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        API.keepHoldAlive(holdId.current);
      }
    });
    return () => sub.remove();
  }, [status]);

  // Live 2:00 countdown timer synchronized with the server lock.
  // When foregrounded and the 2-minute window reaches 00:00 without payment, release the hold cleanly.
  useEffect(() => {
    if (status !== 'PAYMENT_PENDING' || !lockExpiresAtMs) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockExpiresAtMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && !paid.current && !left.current && appStateRef.current === 'active') {
        releaseHold();
        setErrorMsg('Your 2-minute car reservation expired. Tap Try Again to check availability and lock the car again.');
        setStatus('ERROR');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, lockExpiresAtMs]);

  // However the screen is left before paying (Android back, iOS swipe, closing the sheet), the car is freed
  // and the temporary record is released — it used to stay behind and show up as a booking.
  useEffect(() => () => {
    left.current = true;
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
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
        // Step 1 & 2 in parallel, BOTH awaited BEFORE Razorpay opens:
        // Guarantees atomic 2-min car lock wins the race condition before any customer can enter payment details!
        const needsRazorpay = (pricingQuote.onlinePayableNow || 0) > 0;
        const holdPromise = createBookingSnapshot(idempotencyKey.current);
        holdPromiseRef.current = holdPromise;

        const orderPromise = needsRazorpay
          ? API.createRazorpayOrder(
              { onlinePayableNow: pricingQuote.onlinePayableNow, idempotencyKey: idempotencyKey.current, consume: true },
              idempotencyKey.current
            ).catch((err: any) => {
              if (String(err?.message || '').includes('No Razorpay order required')) {
                return null;
              }
              throw err;
            })
          : Promise.resolve(null);

        const [snapshot, initialOrder] = await Promise.all([holdPromise, orderPromise]);

        if (snapshot) {
          holdId.current = snapshot.id;
          const expiresMs = snapshot.lockExpiresAtMs || (Date.now() + DEFAULT_LOCK_SECONDS * 1000);
          setLockExpiresAtMs(expiresMs);
          setSecondsLeft(Math.max(1, Math.ceil((expiresMs - Date.now()) / 1000)));
        }

        if (left.current) { releaseHold(); return; }

        // Ensure the Razorpay order matches the EXACT online amount validated by the server hold
        // (guards against stale prefetched orders or refreshed SawariCash / membership / coupon quotes).
        const serverExpectedOnline = typeof snapshot?.serverExpectedOnline === 'number'
          ? snapshot.serverExpectedOnline
          : Math.round((snapshot?.onlinePayableNow ?? 0) + (pricingQuote.membershipFee || 0));
        const expectedPaise = Math.round(Math.max(0, serverExpectedOnline) * 100);

        let order = initialOrder;
        if (expectedPaise <= 0) {
          // 100% SawariCash / zero online payable flow
          completeBookingFlow(null);
          return;
        }
        if (!order || order.amountPaise !== expectedPaise) {
          order = await API.createRazorpayOrder(
            {
              onlinePayableNow: serverExpectedOnline,
              idempotencyKey: `${idempotencyKey.current}_sync_${expectedPaise}`,
              consume: true,
              forceFresh: true,
            },
            `${idempotencyKey.current}_sync_${expectedPaise}`
          );
          if (left.current) { releaseHold(); return; }
        }

        setSetupStep(1);
        setRazorpayOrder(order);
        const revealTimer = setTimeout(() => {
          if (!left.current) {
            setStatus('PAYMENT_PENDING');
          }
        }, 120);
        timersRef.current.push(revealTimer);
      } catch (err: any) {
        if (left.current) { releaseHold(); return; }
        releaseHold();
        setErrorMsg(err?.message || 'Failed to secure vehicle lock. Please try again.');
        setStatus('ERROR');
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
      } catch { }
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
        // Paid: clear checkout screens from history so Back / iOS swipe can never reach the payment page again.
        router.dismissAll();
        router.push('/confirmation');
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
      if (status === 'ERROR' && paid.current) { router.dismissAll(); router.push('/bookings'); return true; }
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
    const isCritical = secondsLeft <= 20;
    const isWarning = secondsLeft > 20 && secondsLeft <= 45;
    const bannerBg = isCritical ? '#991B1B' : isWarning ? '#92400E' : '#111A2B';
    const pillBg = isCritical ? '#DC2626' : isWarning ? '#D97706' : '#10B981';
    const vehicleLabel = selectedCar?.name ? `${selectedCar.name} locked for you` : 'Car locked for you';

    const lockTimerBanner = (
      <View style={[styles.lockBanner, { backgroundColor: bannerBg }]}>
        <View style={styles.lockBannerLeft}>
          <View style={[styles.lockIconCircle, { backgroundColor: pillBg + '33' }]}>
            <Feather name="lock" size={14} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.lockBannerTitle}>{vehicleLabel}</Text>
            <Text numberOfLines={1} style={styles.lockBannerSub}>
              {isCritical ? 'Hurry! Complete payment before lock expires' : 'Complete payment within 2 min to confirm'}
            </Text>
          </View>
        </View>
        <View style={styles.lockBannerRight}>
          <View style={[styles.timerPill, { backgroundColor: pillBg }]}>
            <Feather name="clock" size={12} color="#FFFFFF" />
            <Text style={styles.timerText}>{formatTimer(secondsLeft)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel payment and release lock"
            onPress={handleCancel}
            hitSlop={8}
            style={styles.cancelLockBtn}
          >
            <Feather name="x" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <PaymentProgress
          title={pending ? 'Opening secure payment' : setupStep === 0 ? 'Reserving your car' : 'Initiating payment'}
          subtitle={pending ? 'Connecting to Razorpay. Please don’t close the app or press back.' : 'Securing your exclusive 2-minute car lock. Please don’t press back.'}
          steps={STEPS}
          current={pending ? 1 : setupStep}
          amount={payNow}
        />
        <View style={pending ? StyleSheet.absoluteFill : { position: 'absolute', width: 1, height: 1, opacity: 0 }} pointerEvents={pending ? 'auto' : 'none'}>
          <RazorpayCheckoutWebView
            visible={pending}
            topBanner={lockTimerBanner}
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
    const isReservationExpired = /reservation expired/i.test(String(errorMsg || ''));
    const isTemporarilyHeld = /another customer is completing payment|already booked|temporarily reserved/i.test(String(errorMsg || ''));
    // Figma "Payment Failed". After money has moved, the button never goes back to checkout (that would
    // invite paying twice): it opens My Bookings, where the booking or the refund shows up.
    return paid.current ? (
      <PaymentFailed
        title="Booking Not Confirmed"
        message={errorMsg || 'Your payment was received but the booking could not be confirmed.'}
        buttonLabel="View My Bookings"
        onButton={() => { router.dismissAll(); router.push('/bookings'); }}
      />
    ) : (
      <PaymentFailed
        title={isReservationExpired ? 'Reservation Expired' : isTemporarilyHeld ? 'Vehicle Currently Locked' : undefined}
        message={errorMsg && !/cancel/i.test(errorMsg) ? `${errorMsg} No money was taken.` : 'Your booking is Failed. Try again'}
        buttonLabel={isReservationExpired || isTemporarilyHeld ? 'Back to Checkout' : undefined}
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

const styles = StyleSheet.create({
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  lockBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  lockIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBannerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  lockBannerSub: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  lockBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timerText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  cancelLockBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
