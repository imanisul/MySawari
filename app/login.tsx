import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { PrimaryButton } from '@/components';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useSawari(); // We will modify SawariContext to support OTP flow

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Mock network delay
      await new Promise(r => setTimeout(r, 1000));
      setStep('otp');
    } catch (e) {
      setError('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Mock network delay
      await new Promise(r => setTimeout(r, 1000));
      
      // Accept any OTP for demo purposes
      const mockToken = 'mock-jwt-token-12345';
      const mockUser = {
        id: 'u123',
        mobile: '+91' + mobile,
        name: name || 'Demo User',
        createdAt: new Date().toISOString()
      };
      
      await login(mockToken, 'mock-refresh-token', mockUser);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (e) {
      setError('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tintLight }]}>
          <Feather name="shield" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === 'mobile' ? 'Welcome to MySawari' : 'Enter Verification Code'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {step === 'mobile' 
            ? 'Enter your mobile number to get started' 
            : `We've sent an OTP to +91 ${mobile}`}
        </Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

        {step === 'mobile' ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Mobile Number</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.prefix, { color: colors.foreground }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={(t) => { setMobile(t); setError(''); }}
                placeholder="9999999999"
                placeholderTextColor={colors.mutedForeground}
                maxLength={10}
                autoFocus
              />
            </View>
            
            <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>Full Name (Optional)</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, paddingLeft: 16 }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>OTP Code</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, paddingLeft: 16, letterSpacing: 8, fontSize: 24 }]}
                keyboardType="number-pad"
                value={otp}
                onChangeText={(t) => { setOtp(t); setError(''); }}
                placeholder="----"
                placeholderTextColor={colors.mutedForeground}
                maxLength={4}
                autoFocus
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label={loading ? "Please wait..." : (step === 'mobile' ? "Send OTP" : "Verify & Login")}
          onPress={() => {
            Haptics.selectionAsync();
            step === 'mobile' ? handleSendOtp() : handleVerifyOtp();
          }}
        />
        {step === 'otp' && (
          <Pressable onPress={() => setStep('mobile')} style={{ marginTop: 16, padding: 8 }}>
            <Text style={{ textAlign: 'center', color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
              Change Mobile Number
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    flex: 1,
  },
  error: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prefix: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  }
});
