import React, { useCallback, useEffect, useState } from 'react';
import { safeBack } from '@/utils/navigation';
import { View, Text, StyleSheet, ScrollView, AppState, Linking, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { CustomAlert } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import Notifications from '@/utils/notifications';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { getContactPrefs, setContactPrefs, ContactPrefs } from '@/utils/contactPreferences';
import { ACCOUNT_EMAIL } from '@/constants/support';
import { Dashes, DesignToggle } from '@/components/profile/ProfileParts';
import { ModalBlur } from '@/components/common/ModalBlur';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };

/**
 * Settings screen: Recommendations & Reminders, Notifications & Location permissions,
 * and Apple Guideline 5.1.1(v) compliant in-app self-service Account Deletion.
 */
export default function SettingsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { isAuthenticated, customer, logout } = useSawari();

  const [prefs, setPrefs] = useState<ContactPrefs>({ sms: true, whatsapp: true });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'otp'>('confirm');
  const [otpId, setOtpId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reflect the real OS permissions (re-read when coming back from the system Settings app).
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const refreshPermissions = useCallback(async () => {
    try { setNotificationsEnabled((await Notifications.getPermissionsAsync()).status === 'granted'); } catch {}
    try { setLocationEnabled((await Location.getForegroundPermissionsAsync()).status === 'granted'); } catch {}
  }, []);
  useEffect(() => {
    refreshPermissions();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') refreshPermissions(); });
    return () => sub.remove();
  }, [refreshPermissions]);

  useEffect(() => { getContactPrefs(customer?.id).then(setPrefs); }, [customer?.id]);

  const setPref = (key: keyof ContactPrefs, on: boolean) => {
    Haptics.selectionAsync();
    const next = { ...prefs, [key]: on };
    setPrefs(next);
    setContactPrefs(customer?.id, next);
  };

  const openSettings = (title: string, message: string) => {
    CustomAlert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]);
  };

  const onNotifications = async (val: boolean) => {
    Haptics.selectionAsync();
    if (!val) return openSettings('Turn Off Notifications', 'This opens system Settings, where you can turn off notifications for MySawari.');
    const res = await Notifications.requestPermissionsAsync();
    if (res.status === 'granted') setNotificationsEnabled(true);
    else openSettings('Enable Notifications', 'MySawari needs permission in Settings to send you trip updates.');
  };

  const onLocation = async (val: boolean) => {
    Haptics.selectionAsync();
    if (!val) return openSettings('Turn Off Location', 'This opens system Settings, where you can turn off location access for MySawari.');
    const res = await Location.requestForegroundPermissionsAsync();
    if (res.status === 'granted') setLocationEnabled(true);
    else openSettings('Enable Location', 'MySawari needs permission in Settings to detect your pickup location.');
  };

  // Plain render functions (not nested components), so the switches keep their state between renders.
  const switchRow = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <View key={label} style={styles.switchRow}>
      <Text style={[styles.switchLabel, { color: p.fg }]}>{label}</Text>
      <DesignToggle value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );

  // Design box: grey card with the note on top, the switches in one white card with dashed lines between.
  const group = (note: string, rows: React.ReactNode[]) => (
    <View style={[styles.card, { backgroundColor: p.soft, borderColor: p.border }]}>
      <Text style={[styles.note, { color: p.muted }]}>{note}</Text>
      <View style={[styles.inner, { backgroundColor: p.page, borderColor: p.border }]}>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Dashes color={p.border} />}
            {r}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const resetDeleteModal = () => {
    setShowDelete(false);
    setDeleteStep('confirm');
    setOtpId('');
    setOtpCode('');
    setIsDeleting(false);
    setDeleteError(null);
  };

  const handleRequestDeletionCode = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const id = await API.sendDeletionCode();
      setOtpId(id);
      setDeleteStep('otp');
    } catch (err: any) {
      setDeleteError(err?.message || 'Could not send verification code. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!otpCode.trim()) {
      setDeleteError('Please enter the verification code.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await API.deleteAccount(otpId, otpCode.trim());
      resetDeleteModal();
      await logout();
      CustomAlert.alert('Account Deleted', 'Your account has been deleted successfully.');
      router.replace('/');
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: p.page }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: p.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => safeBack(router)} style={styles.back}>
          <Feather name="arrow-left" size={20} color={p.fg} />
        </Pressable>
        <Text style={[styles.title, { color: p.fg }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: p.muted, marginTop: 14 }]}>Recommendations & Reminder</Text>
        {group('*Keep these turned on so you don’t miss any updates regarding your vehicle handover or returns.', [
          switchRow('SMS', prefs.sms, (v) => setPref('sms', v)),
          switchRow('WhatsApp', prefs.whatsapp, (v) => setPref('whatsapp', v)),
        ])}

        <Text style={[styles.section, { color: p.muted }]}>Notifications & Location</Text>
        {group('*Note: Keep these on to get trip updates and to find your pickup location quickly', [
          switchRow('Push notifications', notificationsEnabled, onNotifications),
          switchRow('Location access', locationEnabled, onLocation),
        ])}

        {isAuthenticated === true && (
          <>
            <Text style={[styles.section, { color: p.muted }]}>Account Deletion</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => { Haptics.selectionAsync(); setShowDelete(true); }}
              style={({ pressed }) => [styles.deleteRow, { backgroundColor: p.redBg, borderColor: p.redBorder }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.deleteText, { color: p.red }]}>Delete My Sawari account</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Account deletion flow: complies with Apple App Store Guideline 5.1.1(v) */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={resetDeleteModal} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.overlay}>
          <ModalBlur />
          <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={resetDeleteModal} />
          <View style={[styles.popup, { backgroundColor: p.page, maxWidth: 340 }]} accessibilityViewIsModal>
            {deleteStep === 'confirm' ? (
              <>
                <Text style={[styles.popupTitle, { color: p.fg }]} accessibilityRole="header">Delete MySawari Account</Text>
                <Text style={[styles.popupBody, { color: p.muted }]}>
                  This action is permanent and cannot be undone. All your profile information, reviews, and active sessions will be erased.
                </Text>
                <View style={[styles.popupBox, { borderColor: p.segBorder, backgroundColor: p.redBg }]}>
                  <Text style={[styles.popupBoxText, { color: p.red }]}>
                    A verification code will be sent to your registered WhatsApp number (+91 {customer?.mobile || '••••••••••'}) to confirm deletion.
                  </Text>
                </View>

                {deleteError && (
                  <Text style={[styles.errorText, { color: p.red }]}>{deleteError}</Text>
                )}

                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={resetDeleteModal}
                    disabled={isDeleting}
                    style={[styles.btnOutline, { borderColor: p.segBorder }]}
                  >
                    <Text style={[styles.btnOutlineText, { color: p.fg }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleRequestDeletionCode}
                    disabled={isDeleting}
                    style={[styles.btnDanger, { backgroundColor: p.red }]}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.btnDangerText}>Send Code</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.popupTitle, { color: p.fg }]} accessibilityRole="header">Enter Verification Code</Text>
                <Text style={[styles.popupBody, { color: p.muted }]}>
                  Please enter the 6-digit verification code sent to your WhatsApp number.
                </Text>

                <TextInput
                  value={otpCode}
                  onChangeText={(val) => { setOtpCode(val); setDeleteError(null); }}
                  placeholder="123456"
                  placeholderTextColor={p.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={[styles.otpInput, { color: p.fg, borderColor: p.segBorder, backgroundColor: '#F8F9FA' }]}
                />

                {deleteError && (
                  <Text style={[styles.errorText, { color: p.red }]}>{deleteError}</Text>
                )}

                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => { setDeleteStep('confirm'); setDeleteError(null); }}
                    disabled={isDeleting}
                    style={[styles.btnOutline, { borderColor: p.segBorder }]}
                  >
                    <Text style={[styles.btnOutlineText, { color: p.fg }]}>Back</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleConfirmDelete}
                    disabled={isDeleting}
                    style={[styles.btnDanger, { backgroundColor: p.red }]}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.btnDangerText}>Delete Account</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={resetDeleteModal} hitSlop={8} style={[styles.close, { backgroundColor: p.iconBg }]}>
            <Feather name="x" size={18} color={p.sub} />
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  back: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.medium, fontSize: 17 },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 40 },
  section: { fontFamily: FONT.regular, fontSize: 13, marginTop: 22, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  inner: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginTop: 10 },
  note: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 20, paddingHorizontal: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 53, paddingLeft: 12, paddingRight: 12 },
  switchLabel: { fontFamily: FONT.medium, fontSize: 14 },
  deleteRow: { height: 46, borderRadius: 8, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  deleteText: { fontFamily: FONT.medium, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  popup: { width: '100%', borderRadius: 14, borderWidth: 1, borderColor: '#FCEEEE', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  popupTitle: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  popupBody: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  popupBox: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  popupBoxText: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  link: { textDecorationLine: 'underline', fontFamily: FONT.regular },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btnOutline: { flex: 1, height: 42, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { fontFamily: FONT.medium, fontSize: 13 },
  btnDanger: { flex: 1, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnDangerText: { fontFamily: FONT.medium, fontSize: 13, color: '#FFFFFF' },
  errorText: { fontFamily: FONT.regular, fontSize: 12, textAlign: 'center', marginTop: 10 },
  otpInput: { height: 46, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontFamily: FONT.semibold, fontSize: 20, letterSpacing: 4, marginTop: 14 },
});