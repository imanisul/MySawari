import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, TouchableWithoutFeedback, Keyboard, Linking, Alert } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import * as Notifications from 'expo-notifications';

export function LoginBottomSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { login } = useSawari();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0 && step === 2) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  // Slide up animation when visible
  useEffect(() => {
    if (visible) {
      setStep(1);
      setMobile('');
      setOtp('');
      setName('');
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNext = async () => {
    if (step === 1 && mobile.length >= 10) {
      try {
        setLoading(true);
        await API.sendOtp(mobile);
        setStep(2);
        setResendTimer(30);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    } else if (step === 2 && otp.length === 4) {
      setStep(3);
    } else if (step === 3 && name.trim().length > 0) {
      try {
        setLoading(true);
        const { token, user } = await API.verifyOtp(mobile, otp, name.trim());
        await login(token, user);
        
        // Request Notifications Permission Just-In-Time
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
        } catch (error) {
          console.warn('Failed to request notification permission:', error);
        }
        
        onClose();
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Invalid OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      setLoading(true);
      await API.sendOtp(mobile);
      setResendTimer(30);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const isButtonEnabled = () => {
    if (step === 1) return mobile.length >= 10;
    if (step === 2) return otp.length === 4;
    if (step === 3) return name.trim().length > 0;
    return false;
  };

  const getButtonText = () => {
    if (loading) return 'Please wait...';
    if (step === 1) return 'Send OTP';
    if (step === 2) return 'Verify OTP';
    if (step === 3) return 'Let\'s Go!';
    return 'Next';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          {/* Background dismiss */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
          >
            <Animated.View style={[
              styles.sheet, 
              { backgroundColor: colors.background, borderColor: colors.border, transform: [{ translateY: slideAnim }] }
            ]}>
              <View style={styles.handleWrap}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {step === 1 ? 'Enter your mobile number' : step === 2 ? 'Verify OTP' : 'What is your name?'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Feather name="x" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                {step === 2 && (
                  <FontAwesome name="whatsapp" size={16} color="#25D366" style={{ marginRight: 6 }} />
                )}
                <Text style={[styles.subtitle, { color: colors.mutedForeground, marginBottom: 0 }]}>
                  {step === 1 
                    ? 'We will send a 4-digit code via WhatsApp.' 
                    : step === 2 
                      ? `Sent via WhatsApp to +91 ${mobile}` 
                      : 'We need your name to complete your profile.'}
                </Text>
              </View>

              {/* Step 1: Mobile */}
              {step === 1 && (
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Text style={[styles.countryCode, { color: colors.foreground }]}>+91</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="99999 99999"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                    autoFocus
                  />
                </View>
              )}

              {/* Step 2: OTP */}
              {step === 2 && (
                <>
                  <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                    <TextInput
                      style={[styles.input, { color: colors.foreground, textAlign: 'center', letterSpacing: 10 }]}
                      placeholder="• • • •"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={otp}
                      onChangeText={setOtp}
                      autoFocus
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24, marginTop: -8 }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', color: colors.mutedForeground, fontSize: 14 }}>
                      Didn't receive it?{' '}
                    </Text>
                    <TouchableOpacity onPress={handleResendOtp} disabled={resendTimer > 0 || loading}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: resendTimer > 0 ? colors.mutedForeground : colors.blue, fontSize: 14 }}>
                        {resendTimer > 0 ? `Wait 00:${resendTimer.toString().padStart(2, '0')}` : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: Name */}
              {step === 3 && (
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="E.g. Anisul Islam"
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: isButtonEnabled() && !loading ? colors.primary : colors.muted }]} 
                disabled={!isButtonEnabled() || loading}
                onPress={handleNext}
              >
                <Text style={[styles.actionText, { color: isButtonEnabled() ? '#000' : colors.mutedForeground }]}>
                  {getButtonText()}
                </Text>
              </TouchableOpacity>
              
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', color: colors.mutedForeground, marginTop: 8, marginBottom: 8 }}>
                By continuing, you agree to our{' '}
                <Text 
                  style={{ textDecorationLine: 'underline', color: colors.foreground }}
                  onPress={() => Linking.openURL('https://mysawari.in/terms/')}
                >
                  Terms and Conditions
                </Text>
                {' '}and{' '}
                <Text 
                  style={{ textDecorationLine: 'underline', color: colors.foreground }}
                  onPress={() => Linking.openURL('https://mysawari.in/privacy/')}
                >
                  Privacy Policy
                </Text>.
              </Text>
              
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  countryCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    height: '100%',
  },
  actionBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  }
});
