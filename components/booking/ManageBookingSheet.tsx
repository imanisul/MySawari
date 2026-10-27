import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripColors } from '@/components/booking/tripColors';
import { BookingSnapshot } from '@/services/backend/api';
import { SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { FONT, HelpCard, refundQuote } from '@/components/booking/TripDetailParts';
import { ModalBlur } from '@/components/common/ModalBlur';

/**
 * "Need to cancel your trip?" bottom sheet (Figma: Trip Details → "Need to change your plans or request refund?").
 * Shows whether the booking amount is refundable, offers changing dates / vehicle through support, and leads
 * to the cancellation request.
 */
export function ManageBookingSheet({
  visible, onClose, booking, onCancelBooking,
}: {
  visible: boolean;
  onClose: () => void;
  booking: BookingSnapshot;
  onCancelBooking: () => void;
}) {
  const c = useTripColors();
  const insets = useSafeAreaInsets();
  const { eligible } = refundQuote(booking);
  const code = booking.bookingCode || booking.id.slice(-6).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(38, 38, 38, 0.32)' }]}>
        <ModalBlur />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.wrap}>
          <View style={styles.closeRow}>
            <Pressable onPress={onClose} style={[styles.close, { backgroundColor: c.card }]} accessibilityLabel="Close">
              <Feather name="x" size={20} color={c.mutedForeground} />
            </Pressable>
          </View>
          <View style={[styles.sheet, { backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <View style={{ gap: 8 }}>
              <Text style={[styles.title, { color: c.foreground }]}>Need to cancel your trip?</Text>
              <Text style={[styles.sub, { color: c.mutedForeground }]}>Your {booking.vehicleName} booking</Text>
            </View>

            <View style={[styles.notice, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4' }]}>
              <Text style={[styles.noticeTitle, { color: eligible ? c.foreground : c.destructive }]}>
                {eligible ? 'Eligible for refund' : 'Not eligible for refund'}
              </Text>
              <Text style={[styles.noticeBody, { color: c.mutedForeground }]}>
                {eligible
                  ? 'You’re cancelling more than 24 hours before your trip. Your booking amount is refundable under the applicable cancellation policy.'
                  : 'You’re cancelling less than 24 hours before your trip. As per our cancellation policy, the booking amount is non-refundable.'}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={[styles.subhead, { color: c.foreground }]}>Update your dates or choose a different vehicle.</Text>
              <HelpCard compact onWhatsApp={() => Linking.openURL(`${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(`Hi, I'd like to change my booking ${code}.`)}`).catch(() => {})} />
            </View>

            <Pressable
              onPress={onCancelBooking}
              style={({ pressed }) => [styles.cta, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.ctaText, { color: c.primaryForeground }]}>Next</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  wrap: { gap: 8 },
  closeRow: { alignItems: 'flex-end', paddingHorizontal: 12 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: '#E7EAF4', paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  title: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 28, textAlign: 'center' },
  sub: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  notice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  noticeTitle: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17 },
  noticeBody: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  subhead: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  cta: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 26 },
});