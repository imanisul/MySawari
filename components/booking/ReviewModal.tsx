import React from 'react';
import { Modal, StyleSheet, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripReviewSheet } from './TripReviewSheet';
import { ModalBlur } from '@/components/common/ModalBlur';

export type ReviewTrip = { bookingId: string; carId: string; vehicleName: string };

/**
 * Figma "How was your trip?" bottom sheet over the trip (Activity, Trip Details, and the automatic prompt
 * after a trip is completed), with the round ✕ floating above its top-right corner.
 */
export function ReviewModal({ trip, onClose }: { trip: ReviewTrip | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!trip} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <ModalBlur />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={styles.close}>
          <Feather name="x" size={20} color="#737373" />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {trip && <TripReviewSheet carId={trip.carId} bookingId={trip.bookingId} vehicleName={trip.vehicleName} onClose={onClose} />}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  // Figma: 32px #FAFAFA round ✕, 12 from the right, 8 above the sheet.
  close: { alignSelf: 'flex-end', marginRight: 12, marginBottom: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' },
  // Figma: white sheet, 1px #E7EAF4 border, 24 top corners, padding 20/16.
  sheet: { maxHeight: '90%', backgroundColor: '#FFFFFF', borderWidth: 1, borderBottomWidth: 0, borderColor: '#E7EAF4', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20 },
});