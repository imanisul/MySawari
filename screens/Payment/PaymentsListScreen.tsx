import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PaymentMethodItem = { id: string; title: string; subtitle?: string; icon: string };

export default function PaymentsScreen() {
  const colors = useColors();
  const { paymentMethod, setPaymentMethod, sawariCash, customer } = useSawari();

  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'upi'|'card'>('upi');
  
  // UPI State
  const [upiId, setUpiId] = useState('');
  
  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Wallet Transactions
  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => API.getWallet(true), // always fresh when the customer opens their wallet history
    enabled: !!customer?.id
  });

  const transactions = walletData?.transactions || [];

  useEffect(() => {
    loadSavedMethods();
  }, [customer?.id]); // Reload when customer changes

  const getStorageKey = () => `@saved_payment_methods_v2_${customer?.id || 'guest'}`;

  const loadSavedMethods = async () => {
    try {
      const saved = await AsyncStorage.getItem(getStorageKey());
      if (saved) {
        setMethods(JSON.parse(saved));
      } else {
        setMethods([]); // Clear on new user
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelect = (methodId: string) => {
    Haptics.selectionAsync();
    setPaymentMethod(methodId);
  };

  const handleAddMethod = async () => {
    if (isSaving) return;
    let newMethod: PaymentMethodItem | null = null;

    if (newMethodType === 'upi') {
      if (!upiId.includes('@') || upiId.trim().length < 5) {
        Alert.alert('Invalid UPI', 'Please enter a valid UPI ID (e.g., name@bank)');
        return;
      }
      newMethod = {
        id: `upi-${Date.now()}`,
        title: `UPI: ${upiId.trim()}`,
        icon: 'smartphone'
      };
    } else {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 15 || cleanCard.length > 19) {
        Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (cardName.trim().length < 3) {
        Alert.alert('Invalid Name', 'Please enter the name on the card.');
        return;
      }
      if (expiry.length < 5 || !expiry.includes('/')) {
        Alert.alert('Invalid Expiry', 'Please enter expiry date as MM/YY.');
        return;
      }
      if (cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid 3 or 4 digit CVV.');
        return;
      }
      
      newMethod = {
        id: `card-${Date.now()}`,
        title: `Card ending in ${cleanCard.slice(-4)}`,
        subtitle: `Expires ${expiry}`,
        icon: 'credit-card'
      };
    }

    if (!newMethod) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedMethods = [...methods, newMethod];

    setIsSaving(true);
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(updatedMethods));
      setMethods(updatedMethods);
      setPaymentMethod(newMethod.id);

      // Reset Modal State
      setShowAddModal(false);
      setUpiId('');
      setCardNumber('');
      setCardName('');
      setExpiry('');
      setCvv('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save payment method.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    setCardNumber(match ? match.join(' ') : cleaned);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Header title="Payment Methods" back={true} />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* SawariCash Top Card */}
          <LinearGradient 
            colors={['#1F2937', '#111827']} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.cashCard}
          >
            <View style={styles.cashHeader}>
              <View style={[styles.cashIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={{ color: '#10B981', fontSize: 16, fontFamily: 'Inter_700Bold' }}>₹</Text>
              </View>
              <Text style={styles.cashTitle}>SawariCash Balance</Text>
            </View>
            <Text style={styles.cashBalance}>₹{sawariCash.toLocaleString('en-IN')}</Text>
            <Text style={styles.cashSubtitle}>Use up to ₹200 on your next booking automatically</Text>
          </LinearGradient>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Payment Methods</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Select your preferred way to pay for rides.
          </Text>

          {methods.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: colors.border }]}>
              <Feather name="credit-card" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved methods</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Add a card or UPI ID to easily pay for your rides.</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {methods.map((method, index) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodRow,
                    index !== methods.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                  onPress={() => handleSelect(method.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                    <Feather name={method.icon as any} size={20} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={[styles.methodTitle, { color: colors.foreground }]}>{method.title}</Text>
                    {method.subtitle && (
                      <Text style={[styles.methodSubtitle, { color: colors.mutedForeground }]}>{method.subtitle}</Text>
                    )}
                  </View>
                  
                  {/* Radio button indicating selection */}
                  <View style={[
                    styles.radio, 
                    { borderColor: paymentMethod === method.id ? colors.primary : colors.border },
                    paymentMethod === method.id && { backgroundColor: colors.primary }
                  ]}>
                    {paymentMethod === method.id && <Feather name="check" size={14} color={colors.primaryForeground} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Backend Wallet Transactions Section */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 32 }]}>Wallet History</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Recent SawariCash credits and debits.
          </Text>

          {isLoadingWallet ? (
            <ActivityIndicator color={colors.primaryText} style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: colors.border }]}>
              <Feather name="clock" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Transactions</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Your SawariCash history will appear here.</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }]}>
              {transactions.map((tx: any, index: number) => (
                <View
                  key={tx.id}
                  style={[
                    styles.methodRow,
                    { justifyContent: 'space-between' },
                    index !== transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={[styles.methodTitle, { color: colors.foreground }]}>{tx.description}</Text>
                    <Text style={[styles.methodSubtitle, { color: colors.mutedForeground }]}>
                      {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 15,
                    color: tx.type === 'credit' ? colors.success : colors.destructive
                  }}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
          >
            <LinearGradient
               colors={[colors.primary, colors.primary + 'dd']}
               style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Feather name="plus-circle" size={20} color={colors.primaryForeground} style={{ zIndex: 1 }} />
            <Text style={[styles.addButtonText, { color: colors.primaryForeground, zIndex: 1 }]}>Add New Payment Method</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Add Payment Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalOverlayBg}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowAddModal(false)} />
          </View>
          
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, newMethodType === 'upi' ? { backgroundColor: colors.primary } : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setNewMethodType('upi')}
              >
                <Text style={[styles.typeBtnText, { color: newMethodType === 'upi' ? colors.primaryForeground : colors.foreground }]}>UPI</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, newMethodType === 'card' ? { backgroundColor: colors.primary } : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setNewMethodType('card')}
              >
                <Text style={[styles.typeBtnText, { color: newMethodType === 'card' ? colors.primaryForeground : colors.foreground }]}>Card</Text>
              </TouchableOpacity>
            </View>

            {newMethodType === 'upi' ? (
              <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="at-sign" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Enter UPI ID (e.g. name@okhdfc)"
                  placeholderTextColor={colors.mutedForeground}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="credit-card" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Card Number"
                    placeholderTextColor={colors.mutedForeground}
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="user" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Name on Card"
                    placeholderTextColor={colors.mutedForeground}
                    value={cardName}
                    onChangeText={setCardName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background, flex: 1 }]}>
                    <Feather name="calendar" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.mutedForeground}
                      value={expiry}
                      onChangeText={formatExpiry}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background, flex: 1 }]}>
                    <Feather name="lock" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder="CVV"
                      placeholderTextColor={colors.mutedForeground}
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
              onPress={handleAddMethod}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.saveBtnText}>Save Securely</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 4, marginTop: 24 },
  cashCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cashHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cashIconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cashTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#D1D5DB' },
  cashBalance: { fontFamily: 'Inter_700Bold', fontSize: 28, color: '#F9FAFB', marginBottom: 4 },
  cashSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9CA3AF' },
  sectionSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 20 },
  
  emptyCard: { padding: 32, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 4 },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },

  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  methodSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, overflow: 'hidden' },
  addButtonText: { fontFamily: 'Inter_700Bold', fontSize: 16, marginLeft: 10 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalOverlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 16 },
  input: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 16, height: '100%' },
  saveBtn: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#101B2E' }
});
