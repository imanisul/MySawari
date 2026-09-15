import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, TouchableWithoutFeedback, Keyboard, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function LoginBottomSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { login } = useSawari();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  
  const slideAnim = useRef(new Animated.Value(400)).current;

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
      setStep(2);
    } else if (step === 2 && otp.length === 4) {
      setStep(3);
    } else if (step === 3 && name.trim().length > 0) {
      // Complete login
      await login(name, mobile);
      onClose();
    }
  };

  const isButtonEnabled = () => {
    if (step === 1) return mobile.length >= 10;
    if (step === 2) return otp.length === 4;
    if (step === 3) return name.trim().length > 0;
    return false;
  };

  const getButtonText = () => {
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
              
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {step === 1 
                  ? 'We will send a 4-digit code to verify.' 
                  : step === 2 
                    ? `Sent to +91 ${mobile}` 
                    : 'We need your name to complete your profile.'}
              </Text>

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
                style={[styles.actionBtn, { backgroundColor: isButtonEnabled() ? colors.primary : colors.muted }]} 
                disabled={!isButtonEnabled()}
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
