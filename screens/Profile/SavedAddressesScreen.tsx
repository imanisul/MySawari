import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, Share, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { getSavedAddresses, removeSavedAddress, updateSavedAddress, SavedAddress } from '@/utils/savedAddresses';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, PF } from '@/components/profile/ProfileParts';
import { ModalBlur } from '@/components/common/ModalBlur';
import { BlurTargetProvider } from '@/components/common/BlurTargetContext';

/**
 * Figma "Saved Addresses": "+ Add Address", then each saved place (tag, full address, contact number) with
 * a ⋯ menu — Edit Address (search + map again, replaces it), Edit Phone Number, Delete Address (confirm) —
 * and Share. Kept on the device per account; the same list the address search offers first.
 */
export default function SavedAddressesScreen() {
  const blurTarget = useRef<View | null>(null);
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customer, isAuthenticated } = useSawari();
  const userId = isAuthenticated ? customer?.id : null;
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [menuFor, setMenuFor] = useState<SavedAddress | null>(null);
  const [deleteFor, setDeleteFor] = useState<SavedAddress | null>(null);
  const [phoneFor, setPhoneFor] = useState<SavedAddress | null>(null);

  // Reloaded whenever the page shows again (e.g. back from adding or editing one).
  useFocusEffect(useCallback(() => { getSavedAddresses(userId).then(setList); }, [userId]));

  const add = () => {
    Haptics.selectionAsync();
    router.push({ pathname: '/address-search', params: { kind: 'save' } });
  };

  const share = (a: SavedAddress) => {
    Haptics.selectionAsync();
    Share.share({
      message: `${a.label ? `${a.label}: ` : ''}${a.name}${a.address ? `, ${a.address}` : ''}\nhttps://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`,
    }).catch(() => {});
  };

  const icon = (label?: string) => (/home/i.test(label || '') ? 'home-outline' : /work|office/i.test(label || '') ? 'briefcase-outline' : 'location-outline');

  return (
    <BlurTargetProvider target={blurTarget}>
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
        <BlurTargetView ref={blurTarget} style={styles.screen}>
          <ScreenHeader title="Saved Addresses" />

          <FlatList
            data={list || []}
            keyExtractor={(a) => a.id}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListHeaderComponent={
              <>
                <Pressable accessibilityRole="button" onPress={add} style={({ pressed }) => [styles.addRow, { borderColor: p.border }, pressed && { backgroundColor: p.soft }]}>
                  <Feather name="plus" size={16} color={p.navy} />
                  <Text style={[styles.addText, { color: p.navy }]}>Add Address</Text>
                  <Feather name="chevron-right" size={16} color={p.muted} />
                </Pressable>
                {!!list?.length && <Text style={[styles.section, { color: p.sub }]}>Your saved address</Text>}
              </>
            }
            renderItem={({ item: a }) => (
              <View style={[styles.card, { borderColor: p.border }]}>
                <View style={[styles.icon, { backgroundColor: p.iconBg }]}>
                  <Ionicons name={icon(a.label) as any} size={17} color={p.sub} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: p.fg }]} numberOfLines={1}>{a.label || a.name}</Text>
                  <Text style={[styles.addr, { color: p.muted }]} numberOfLines={3}>{a.label ? `${a.name}, ${a.address}` : a.address}</Text>
                  {!!a.phone && <Text style={[styles.addr, { color: p.muted }]}>Phone number: +91 {a.phone}</Text>}
                </View>
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Options for ${a.label || a.name}`} onPress={() => { Haptics.selectionAsync(); setMenuFor(a); }} hitSlop={8}>
                    <Feather name="more-horizontal" size={17} color={p.fg} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Share ${a.label || a.name}`} onPress={() => share(a)} hitSlop={8}>
                    <Feather name="share" size={15} color={p.fg} />
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={list ? (
              <View style={styles.empty}>
                <Feather name="map-pin" size={22} color={p.fg} />
                <Text style={[styles.emptyTitle, { color: p.fg }]}>No saved addresses yet</Text>
                <Text style={[styles.emptySub, { color: p.muted }]}>Save your home, work or hotel to pick it in one tap for doorstep delivery.</Text>
              </View>
            ) : null}
          />
        </BlurTargetView>
      </SafeAreaView>

      {/* ── Select option ── */}
      <Modal visible={!!menuFor} transparent animationType="slide" onRequestClose={() => setMenuFor(null)}>
        <View style={styles.sheetWrap}>
          <ModalBlur />
          <View  style={[StyleSheet.absoluteFill, styles.dim]}/>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuFor(null)} accessibilityLabel="Close" />
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setMenuFor(null)} style={[styles.closeBubble, { backgroundColor: p.page }]}>
            <Feather name="x" size={16} color={p.sub} />
          </Pressable>
          <View style={[styles.sheet, { backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={[styles.sheetTitle, { color: p.fg }]}>Select option</Text>
            <View style={[styles.optCard, { borderColor: p.border }]}>
              {[
                { icon: 'edit-2', label: 'Edit Address', onPress: () => { const a = menuFor!; setMenuFor(null); router.push({ pathname: '/address-search', params: { kind: 'save', editId: a.id } }); } },
                { icon: 'phone', label: 'Edit Phone Number', onPress: () => { const a = menuFor!; setMenuFor(null); setTimeout(() => setPhoneFor(a), 250); } },
                { icon: 'trash-2', label: 'Delete Address', onPress: () => { const a = menuFor!; setMenuFor(null); setTimeout(() => setDeleteFor(a), 250); } },
              ].map((o, i) => (
                <Pressable
                  key={o.label}
                  accessibilityRole="button"
                  onPress={() => { Haptics.selectionAsync(); o.onPress(); }}
                  style={({ pressed }) => [styles.opt, i > 0 && { borderTopWidth: 1, borderTopColor: p.divider }, pressed && { backgroundColor: p.soft }]}
                >
                  <View style={[styles.optIcon, { backgroundColor: p.iconBg }]}>
                    <Feather name={o.icon as any} size={15} color={p.fg} />
                  </View>
                  <Text style={[styles.optText, { color: p.fg }]}>{o.label}</Text>
                  <Feather name="chevron-right" size={16} color={p.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete this address? ── */}
      <Modal visible={!!deleteFor} transparent animationType="fade" onRequestClose={() => setDeleteFor(null)}>
        <View style={styles.dialogWrap}>
          <ModalBlur />
          <View  style={[StyleSheet.absoluteFill, styles.dim]}/>
          <View style={[styles.dialog, { backgroundColor: p.page }]} accessibilityViewIsModal>
            <Text style={[styles.dialogTitle, { color: p.fg }]}>Delete this address?</Text>
            <Text style={[styles.dialogBody, { color: p.muted }]}>You won't be able to recover this address once deleted. Do you want to continue?</Text>
            <View style={styles.dialogBtns}>
              <Pressable
                accessibilityRole="button"
                onPress={async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); const a = deleteFor!; setDeleteFor(null); setList(await removeSavedAddress(userId, a.id)); }}
                style={({ pressed }) => [styles.dialogBtn, { backgroundColor: p.redBg }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.dialogBtnText, { color: p.red }]}>Delete address</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setDeleteFor(null)} style={({ pressed }) => [styles.dialogBtn, { backgroundColor: p.iconBg }, pressed && { opacity: 0.8 }]}>
                <Text style={[styles.dialogBtnText, { color: p.navy }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <PhoneSheet
        address={phoneFor}
        onClose={() => setPhoneFor(null)}
        onSave={async (phone) => {
          const a = phoneFor!;
          setPhoneFor(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setList(await updateSavedAddress(userId, a.id, { phone }));
        }}
      />
    </BlurTargetProvider>
  );
}

/**
 * "Edit Phone Number": a contact number for the person at this address (for the delivery executive).
 * The design verifies it with a WhatsApp OTP; the server has no endpoint to verify a non-login number yet,
 * so it is saved as entered.
 */
function PhoneSheet({ address, onClose, onSave }: { address: SavedAddress | null; onClose: () => void; onSave: (phone: string) => void }) {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => { if (address) { setValue(address.phone || ''); setError(''); } }, [address]);

  const save = () => {
    const d = value.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(d)) { setError('Enter a valid 10-digit mobile number.'); return; }
    onSave(d);
  };

  return (
    <Modal visible={!!address} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <ModalBlur />
        <View  style={[StyleSheet.absoluteFill, styles.dim]}/>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.closeBubble, { backgroundColor: p.page }]}>
          <Feather name="x" size={16} color={p.sub} />
        </Pressable>
        <View style={[styles.sheet, { backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={[styles.sheetTitle, { color: p.fg }]}>Edit Phone Number</Text>
          <Text style={[styles.sheetSub, { color: p.muted }]}>Add a contact number for this saved address.</Text>
          <View style={[styles.phoneBox, { backgroundColor: p.soft, borderColor: error ? p.red : p.border }]}>
            <Text style={[styles.cc, { color: p.muted }]}>+91</Text>
            <TextInput
              value={value}
              onChangeText={(t) => { setValue(t.replace(/\D/g, '').slice(0, 10)); if (error) setError(''); }}
              placeholder="Mobile number"
              placeholderTextColor={p.muted}
              keyboardType="phone-pad"
              autoFocus
              maxLength={10}
              style={[styles.phoneInput, { color: p.fg }]}
              selectionColor={p.navy}
              accessibilityLabel="Contact number"
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
          {!!error && <Text style={[styles.error, { color: p.red }]}>{error}</Text>}
          <Text style={[styles.legal, { color: p.muted }]}>
            By continuing, you agree to our{' '}
            <Text style={{ color: p.navy }} onPress={() => { onClose(); router.push({ pathname: '/policies', params: { policy: 'terms' } }); }}>Terms & Conditions</Text>
            {' '}and Privacy Policy.
          </Text>
          <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [styles.primary, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
            <Text style={styles.primaryText}>Save Number</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14 },
  addText: { flex: 1, fontFamily: PF.medium, fontSize: 14 },
  section: { fontFamily: PF.regular, fontSize: 12.5, marginTop: 16, marginBottom: 8 },
  card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  icon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: PF.medium, fontSize: 13.5 },
  addr: { fontFamily: PF.regular, fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: PF.medium, fontSize: 16, marginTop: 10 },
  emptySub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(38,38,38,0.45)' },
  closeBubble: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 10, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 18 },
  sheetTitle: { fontFamily: PF.medium, fontSize: 18 },
  sheetSub: { fontFamily: PF.regular, fontSize: 13, marginTop: 6 },
  optCard: { borderWidth: 1, borderRadius: 10, marginTop: 14, paddingHorizontal: 10 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 56 },
  optIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optText: { flex: 1, fontFamily: PF.medium, fontSize: 14.5 },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.32)' },
  dialogWrap: { flex: 1, backgroundColor: 'rgba(38,38,38,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  dialog: { borderRadius: 12, paddingHorizontal: 12, paddingTop: 20, paddingBottom: 12 },
  dialogTitle: { fontFamily: PF.semibold, fontSize: 19, textAlign: 'center' },
  dialogBody: { fontFamily: PF.medium, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  dialogBtns: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dialogBtn: { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dialogBtnText: { fontFamily: PF.semibold, fontSize: 15 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginTop: 14 },
  cc: { fontFamily: PF.regular, fontSize: 15 },
  phoneInput: { flex: 1, fontFamily: PF.medium, fontSize: 15, paddingVertical: 0 },
  error: { fontFamily: PF.regular, fontSize: 12, marginTop: 6 },
  legal: { fontFamily: PF.regular, fontSize: 12, lineHeight: 18, marginTop: 12 },
  primary: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { fontFamily: PF.semibold, fontSize: 16, color: '#FFFFFF' },
});