import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Platform, KeyboardAvoidingView, Alert, Linking, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { SUPPORT_PHONE, SUPPORT_EMAIL } from '@/constants/support';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };
type Field = 'name' | 'email';

/** "9876543210" → "98765 43XXX", as on the Profile header. */
function maskMobile(m?: string) {
  const d = String(m || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5, 7)}XXX` : m || '';
}

/**
 * Figma "Edit Profile": Name, Phone number and Email shown read-only, each with an edit icon. Editing one
 * opens just that field with Update / Cancel under it; Update saves it to the server (PUT /customers/profile,
 * via saveProfile) and the field closes again. The mobile number is the login, so it can only be changed
 * through support.
 */
export default function EditProfileScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { customer, saveProfile, isAuthenticated, isAuthLoading } = useSawari();

  useFocusEffect(
    useCallback(() => {
      if (!isAuthLoading && isAuthenticated === false) {
        router.replace('/profile');
      }
    }, [isAuthenticated, isAuthLoading])
  );

  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Field | null>(null);
  const input = useRef<TextInput>(null);

  const start = (f: Field) => {
    if (saving) return;
    Haptics.selectionAsync();
    setEditing(f);
    setDraft(f === 'name' ? customer.name || '' : customer.email || '');
    setError(null);
    setSaved(null);
    setTimeout(() => input.current?.focus(), 50);
  };

  const cancel = () => {
    Haptics.selectionAsync();
    setEditing(null);
    setError(null);
  };

  const update = async () => {
    if (!editing) return;
    const value = draft.trim();
    if (editing === 'name' && value.length < 2) { setError('Please enter your full name.'); return; }
    if (editing === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError('Please enter a valid email address.'); return; }
    const unchanged = value === (editing === 'name' ? (customer.name || '').trim() : (customer.email || '').trim());
    if (unchanged) { setEditing(null); return; }
    setSaving(true);
    setError(null);
    try {
      // The other fields go along unchanged (the server replaces the profile it is sent).
      await saveProfile({
        name: editing === 'name' ? value : customer.name,
        email: editing === 'email' ? value : customer.email,
        dob: customer.dob,
        gender: customer.gender,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(editing);
      setEditing(null);
    } catch (e: any) {
      setError(e?.message || "Couldn't update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const changeMobile = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Change mobile number',
      'Your mobile number is how you log in, so it can only be changed by our support team.',
      [
        { text: 'Call support', onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`) },
        { text: 'Email support', onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Change my mobile number')}`) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const renderField = (f: Field | 'mobile', label: string, value: string, placeholder: string) => {
    const open = f !== 'mobile' && editing === f;
    return (
      <View style={styles.group}>
        <Text style={[styles.label, { color: p.sub }]}>{label}</Text>
        {open ? (
          <>
            <TextInput
              ref={input}
              value={draft}
              onChangeText={(t) => { setDraft(t); if (error) setError(null); }}
              placeholder={placeholder}
              placeholderTextColor={p.muted}
              style={[styles.box, styles.input, { borderColor: error ? p.red : p.strongBorder, backgroundColor: p.page, color: p.fg }]}
              autoCapitalize={f === 'email' ? 'none' : 'words'}
              keyboardType={f === 'email' ? 'email-address' : 'default'}
              autoComplete={f === 'email' ? 'email' : 'name'}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={update}
              editable={!saving}
              selectionColor={p.navy}
              accessibilityLabel={label}
            />
            {!!error && <Text style={[styles.error, { color: p.red }]}>{error}</Text>}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={update}
                disabled={saving}
                style={({ pressed }) => [styles.btn, { backgroundColor: p.navy }, (pressed || saving) && { opacity: 0.85 }]}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Update</Text>}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={cancel}
                disabled={saving}
                style={({ pressed }) => [styles.btn, { backgroundColor: p.iconBg }, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.btnText, { color: p.fg }]}>Cancel</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}${value ? `, ${value}` : ''}. Edit`}
            onPress={() => (f === 'mobile' ? changeMobile() : start(f))}
            style={[styles.box, styles.readRow, { borderColor: p.border, backgroundColor: p.soft }]}
          >
            <Text style={[styles.value, { color: value ? p.sub : p.muted }]} numberOfLines={1}>{value || placeholder}</Text>
            {saved === f ? (
              <Feather name="check" size={16} color={p.green} />
            ) : (
              <Feather name="edit" size={15} color={p.purple} />
            )}
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: p.page }]}>
      <View style={[styles.header, { borderBottomColor: p.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={[styles.back, { backgroundColor: p.iconBg }]}>
          <Feather name="chevron-left" size={18} color={p.muted} />
        </Pressable>
        <Text style={[styles.title, { color: p.fg }]}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {renderField('name', 'NAME', customer.name || '', 'Enter your full name')}
          {renderField('mobile', 'PHONE NUMBER', maskMobile(customer.mobile), 'Add your mobile number')}
          {renderField('email', 'EMAIL ADDRESS', customer.email || '', 'Enter your email address')}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  back: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.medium, fontSize: 16 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  group: { marginBottom: 18 },
  label: { fontFamily: FONT.medium, fontSize: 10, letterSpacing: 0.3, marginBottom: 6 },
  box: { height: 46, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, fontFamily: FONT.regular, fontSize: 14 },
  input: { fontFamily: FONT.regular, fontSize: 14, paddingVertical: 0 },
  error: { fontFamily: FONT.regular, fontSize: 12, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { flex: 1, height: 42, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: FONT.medium, fontSize: 14 },
});