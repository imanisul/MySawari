import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, AppState, Linking, Pressable, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { CustomAlert } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import Notifications from '@/utils/notifications';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { getContactPrefs, setContactPrefs, ContactPrefs } from '@/utils/contactPreferences';
import { ACCOUNT_EMAIL, SUPPORT_PHONE } from '@/constants/support';
import { Dashes, DesignToggle } from '@/components/profile/ProfileParts';
import { ModalBlur } from '@/components/common/ModalBlur';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };

/**
 * Figma "Settings": Recommendations & Reminder (SMS / WhatsApp switches with the note), Notifications &
 * Location (the real phone permissions, in the same box style), and Account Deletion (Apple Guideline 5.1.1(v) compliant).
 */
export default function SettingsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { isAuthenticated, customer, logout } = useSawari();

  const [prefs, setPrefs] = useState<ContactPrefs>({ sms: true, whatsapp: true });
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: p.page }]}>
      <View style={[styles.header, { borderBottomColor: p.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={[styles.back, { backgroundColor: p.iconBg }]}>
          <Feather name="chevron-left" size={18} color={p.muted} />
        </Pressable>
        <Text style={[styles.title, { color: p.fg }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isAuthenticated === true && (
          <>
            <Text style={[styles.section, { color: p.muted }]}>Recommendations & Reminder</Text>
            {group('*Note: Keep this on to receive offers/coupons and timely reminders based on your interests', [
              switchRow('SMS', prefs.sms, (v) => setPref('sms', v)),
              switchRow('WhatsApp', prefs.whatsapp, (v) => setPref('whatsapp', v)),
            ])}
          </>
        )}

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

      {/* ── Apple Guideline 5.1.1(v) Compliant Account Deletion ── */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={() => !isDeleting && setShowDelete(false)}>
        <View style={styles.overlay}>
          <ModalBlur />
          <View style={[styles.popup, { backgroundColor: p.page, borderColor: p.redBorder }]} accessibilityViewIsModal>
            <Text style={[styles.popupTitle, { color: p.fg }]}>Delete MySawari Account</Text>
            <Text style={[styles.popupBody, { color: p.muted }]}>
              Deleting your account is permanent. All your personal details, rental history, and wallet balances will be permanently erased. This cannot be undone.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm permanent account deletion"
              disabled={isDeleting}
              onPress={() => {
                CustomAlert.alert(
                  'Permanent Account Deletion',
                  'Are you absolutely sure you want to permanently delete your account? You will be logged out immediately.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete My Account',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          setIsDeleting(true);
                          await API.deleteAccount();
                          await logout();
                          setShowDelete(false);
                          CustomAlert.alert('Account Deleted', 'Your MySawari account and associated data have been permanently deleted.');
                          router.replace('/');
                        } catch (err: any) {
                          CustomAlert.alert('Error', err?.message || 'Failed to delete account. Please try again.');
                        } finally {
                          setIsDeleting(false);
                        }
                      },
                    },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.confirmDeleteBtn,
                { backgroundColor: p.red },
                pressed && { opacity: 0.85 },
                isDeleting && { opacity: 0.6 },
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmDeleteText}>Permanently Delete Account</Text>
              )}
            </Pressable>

            <View style={[styles.popupBox, { borderColor: p.border, marginTop: 12 }]}>
              <Text style={[styles.popupBoxText, { color: p.muted }]}>
                Need help or have an active booking?{' '}
                <Text
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(`mailto:${ACCOUNT_EMAIL}?subject=${encodeURIComponent('Account assistance')}`)}
                  style={[styles.link, { color: p.navy }]}
                >
                  Contact Support
                </Text>
              </Text>
            </View>
          </View>
          {!isDeleting && (
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowDelete(false)} hitSlop={8} style={[styles.close, { backgroundColor: p.iconBg }]}>
              <Feather name="x" size={17} color={p.sub} />
            </Pressable>
          )}
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
  overlay: { flex: 1, backgroundColor: 'rgba(38,38,38,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 },
  popup: { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingTop: 22, paddingBottom: 13 },
  popupTitle: { fontFamily: FONT.medium, fontSize: 17.5, lineHeight: 25, textAlign: 'center' },
  popupBody: { fontFamily: FONT.regular, fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 10, paddingHorizontal: 10 },
  popupBox: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 17, marginTop: 17 },
  popupBoxText: { fontFamily: FONT.regular, fontSize: 12.5, lineHeight: 19, textAlign: 'center' },
  link: { textDecorationLine: 'underline', fontFamily: FONT.regular },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  confirmDeleteBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingHorizontal: 16 },
  confirmDeleteText: { fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' },
});