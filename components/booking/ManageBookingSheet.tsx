import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BookingSnapshot } from '@/services/backend/api';
import { SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { ActionRow, FONT, refundQuote } from '@/components/booking/TripDetailParts';

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
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { eligible } = refundQuote(booking);
  const code = booking.bookingCode || booking.id.slice(-6).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.wrap}>
          <View style={styles.closeRow}>
            <Pressable onPress={onClose} style={[styles.close, { backgroundColor: c.card }]} accessibilityLabel="Close">
              <Feather name="x" size={20} color={c.foreground} />
            </Pressable>
          </View>
          <View style={[styles.sheet, { backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <View style={{ gap: 8 }}>
              <Text style={[styles.title, { color: c.foreground }]}>Need to cancel your trip?</Text>
              <Text style={[styles.sub, { color: c.mutedForeground }]}>Your {booking.vehicleName} booking</Text>
            </View>

            <View style={[styles.notice, { backgroundColor: eligible ? c.success + '12' : c.destructive + '10', borderColor: eligible ? c.success + '40' : c.destructive + '35' }]}>
              <Text style={[styles.noticeTitle, { color: eligible ? c.success : c.destructive }]}>
                {eligible ? 'Eligible for refund' : 'Not eligible for refund'}
              </Text>
              <Text style={[styles.noticeBody, { color: c.foreground }]}>
                {eligible
                  ? 'You’re cancelling more than 24 hours before your trip. Your booking amount is refundable under the applicable cancellation policy.'
                  : 'You’re cancelling less than 24 hours before your trip. As per our cancellation policy, the booking amount is non-refundable.'}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={[styles.subhead, { color: c.foreground }]}>Update your dates or choose a different vehicle.</Text>
              <ActionRow
                title="Talk to our team"
                subtitle={`We’ll change booking ${code} for you on WhatsApp.`}
                icon="message-circle"
                onPress={() => Linking.openURL(`${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(`Hi, I'd like to change my booking ${code}.`)}`).catch(() => { })}
              />
            </View>

            <Pressable
              onPress={onCancelBooking}
              style={({ pressed }) => [styles.cta, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.ctaText, { color: c.primaryForeground }]}>Cancel booking</Text>
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
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  title: { fontFamily: FONT.bold, fontSize: 22, lineHeight: 29 },
  sub: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 20 },
  notice: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9, gap: 4 },
  noticeTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 17 },
  noticeBody: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 18 },
  subhead: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 23 },
  cta: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.semibold, fontSize: 16 },
});