import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, AppState, Linking, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { CustomAlert } from '@/components';
import { useSawari } from '@/context/SawariContext';
import Notifications from '@/utils/notifications';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { getContactPrefs, setContactPrefs, ContactPrefs } from '@/utils/contactPreferences';
import { ACCOUNT_EMAIL } from '@/constants/support';
import { Dashes, DesignToggle } from '@/components/profile/ProfileParts';
import { ModalBlur } from '@/components/common/ModalBlur';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };

/**
 * Figma "Settings": Recommendations & Reminder (SMS / WhatsApp switches with the note), Notifications &
 * Location (the real phone permissions, in the same box style), and Account Deletion (a popup that points to the support team).
 */
export default function SettingsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { isAuthenticated, customer } = useSawari();

  const [prefs, setPrefs] = useState<ContactPrefs>({ sms: true, whatsapp: true });
  const [showDelete, setShowDelete] = useState(false);

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

      {/* Account deactivation: handled by the support team, so this only says how to reach them. */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={() => setShowDelete(false)} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.overlay}>
          <ModalBlur />
          <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={() => setShowDelete(false)} />
          <View style={[styles.popup, { backgroundColor: p.page }]} accessibilityViewIsModal>
            <Text style={[styles.popupTitle, { color: p.fg }]} accessibilityRole="header">Need to deactivate your account?</Text>
            <Text style={[styles.popupBody, { color: p.muted }]}>Account deactivation requests can only be made through our support team.</Text>
            <View style={[styles.popupBox, { borderColor: p.segBorder }]}>
              <Text style={[styles.popupBoxText, { color: p.muted }]}>
                Please call us or email{' '}
                <Text
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(`mailto:${ACCOUNT_EMAIL}?subject=${encodeURIComponent('Account deactivation request')}`)}
                  style={[styles.link, { color: p.navy }]}
                >
                  {ACCOUNT_EMAIL}
                </Text>{' '}
                to request account deactivation.
              </Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowDelete(false)} hitSlop={8} style={[styles.close, { backgroundColor: p.iconBg }]}>
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
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36, gap: 8 },
  // Figma "deactivate": 320 wide card (very light pink edge), title 17, grey 12 text, a bordered box with the contact line.
  popup: { width: '100%', maxWidth: 320, borderRadius: 12, borderWidth: 1, borderColor: '#FCEEEE', paddingHorizontal: 13, paddingTop: 20, paddingBottom: 13 },
  popupTitle: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 26, textAlign: 'center' },
  popupBody: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
  popupBox: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, marginTop: 14 },
  popupBoxText: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  link: { textDecorationLine: 'underline', fontFamily: FONT.regular },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});