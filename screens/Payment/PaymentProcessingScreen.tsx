import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';

export default function PaymentProcessingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { pricingQuote, quoteParams, createBookingSnapshot, confirmBooking } = useSawari();

  const [status, setStatus] = useState<'INITIATING' | 'PAYMENT_PENDING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('INITIATING');
  const [razorpayOrder, setRazorpayOrder] = useState<{ orderId: string, amountPaise: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function startPaymentFlow() {
      if (!pricingQuote) {
        setErrorMsg('Booking quote not found. Please try again.');
        setStatus('ERROR');
        return;
      }
      try {
        // Step 1: Create Order
        const order = await API.createRazorpayOrder(quoteParams);
        setRazorpayOrder(order);
        setStatus('PAYMENT_PENDING'); // Show Mock Razorpay UI
      } catch (err: any) {
        // Handle 100% sawari cash / zero online payable flow
        if (err.message.includes('No Razorpay order required')) {
          completeBookingFlow(null); // Bypass Razorpay entirely
        } else {
          setErrorMsg(err.message || 'Failed to initiate payment');
          setStatus('ERROR');
        }
      }
    }
    startPaymentFlow();
  }, [quoteParams, pricingQuote]);

  const simulateRazorpaySuccess = async () => {
    if (!razorpayOrder) return;
    setStatus('VERIFYING');
    
    try {
      // Step 2: Customer completes payment, backend verifies signature
      const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      const mockSignature = `mock_sig_${Math.random().toString(36).substring(2, 10)}`;
      
      const isVerified = await API.verifyPayment(razorpayOrder.orderId, mockPaymentId, mockSignature);
      if (isVerified) {
        completeBookingFlow({ razorpayOrderId: razorpayOrder.orderId, razorpayPaymentId: mockPaymentId });
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Payment verification failed');
      setStatus('ERROR');
    }
  };
  
  const completeBookingFlow = async (paymentDetails: { razorpayOrderId?: string, razorpayPaymentId?: string } | null) => {
    setStatus('VERIFYING');
    try {
      // Step 3: Create Booking Snapshot securely
      const snapshot = await createBookingSnapshot(paymentDetails || {});
      if (snapshot) {
        confirmBooking();
        setStatus('SUCCESS');
        setTimeout(() => {
          router.replace('/confirmation');
        }, 1500);
      } else {
        throw new Error('Failed to capture booking snapshot');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to confirm booking');
      setStatus('ERROR');
    }
  }

  const handleCancel = () => {
    router.back(); // Go back to payment page to retry
  };

  if (status === 'PAYMENT_PENDING' && razorpayOrder) {
    return (
      <View style={[styles.screen, { backgroundColor: '#101010' }]}>
        <View style={styles.razorpayMock}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#3399cc', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
             <Feather name="shield" size={24} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 8 }}>Secure Payment</Text>
          <Text style={{ color: '#aaa', fontFamily: 'Inter_500Medium', marginBottom: 24, fontSize: 16 }}>Payable: ₹{(razorpayOrder.amountPaise / 100).toLocaleString('en-IN')}</Text>
          
          <Pressable onPress={simulateRazorpaySuccess} style={[styles.btn, { backgroundColor: '#3399cc', marginBottom: 12 }]}>
            <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Simulate Success</Text>
          </Pressable>
          <Pressable onPress={handleCancel} style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444' }]}>
            <Text style={{ color: '#aaa', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Cancel Transaction</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (status === 'ERROR') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Feather name="x-circle" size={48} color={colors.destructive} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.foreground }]}>Payment Failed</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: 'center', marginHorizontal: 32 }]}>{errorMsg}</Text>
        <Pressable onPress={handleCancel} style={[styles.btn, { backgroundColor: colors.primary, marginTop: 32 }]}>
          <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Back to Checkout</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'SUCCESS') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Feather name="check-circle" size={48} color={colors.success} />
        <Text style={[styles.title, { color: colors.foreground, marginTop: 16 }]}>Booking Confirmed!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 24 }} />
      <Text style={[styles.title, { color: colors.foreground }]}>
        {status === 'INITIATING' ? 'Initiating Payment...' : 'Verifying Payment...'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Please do not close this window.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  razorpayMock: { padding: 32, backgroundColor: '#1A1A1A', borderRadius: 20, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 15, borderWidth: 1, borderColor: '#333' },
  btn: { width: '100%', paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, marginTop: 8 },
});