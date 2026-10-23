import React from 'react';
import { Modal, StyleSheet, View, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { WriteReviewBottomSheet } from '@/components/vehicle/details/WriteReviewBottomSheet';

export type ReviewTrip = { bookingId: string; carId: string; vehicleName: string };

/** Bottom-sheet modal for reviewing a completed trip (rating, place visited, photos). */
export function ReviewModal({ trip, onClose }: { trip: ReviewTrip | null; onClose: () => void }) {
  const colors = useColors();

  return (
    <Modal visible={!!trip} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close review" />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {trip && (
            <WriteReviewBottomSheet
              carId={trip.carId}
              bookingId={trip.bookingId}
              vehicleName={trip.vehicleName}
              onClose={onClose}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { height: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
});
