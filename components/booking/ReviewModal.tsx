import React from 'react';
import { Modal, StyleSheet, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { TripReviewSheet } from './TripReviewSheet';
import { ModalBlur } from '@/components/common/ModalBlur';

export type ReviewTrip = { bookingId: string; carId: string; vehicleName: string };

/**
 * Figma "How was your trip?" bottom sheet over the trip (Activity, Trip Details, and the automatic prompt
 * after a trip is completed), with the round ✕ floating above its top-right corner.
 */
export function ReviewModal({ trip, onClose }: { trip: ReviewTrip | null; onClose: () => void }) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!trip} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <ModalBlur />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={[styles.close, { backgroundColor: p.page }]}>
          <Feather name="x" size={15} color={p.sub} />
        </Pressable>
        <View style={[styles.sheet, { backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {trip && <TripReviewSheet carId={trip.carId} bookingId={trip.bookingId} vehicleName={trip.vehicleName} onClose={onClose} />}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(38,38,38,0.45)' },
  close: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 10, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 22 },
});