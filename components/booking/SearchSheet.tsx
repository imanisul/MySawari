import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SearchCard } from './SearchCard';
import { PrimaryButton } from '../common/PrimaryButton';
import { useSawari } from '@/context/SawariContext';

export function SearchSheet({
  visible,
  onClose,
  onContinue
}: {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const colors = useColors();
  const { dateRange, dropoff, selectedCar, isDeliveryRequested, pickup, deliveryMode, returnAddress } = useSawari();
  
  const [startStr, endStr] = dateRange.split(' – ');
  const hasValidDates = !!(startStr && endStr && startStr !== 'Select' && endStr !== 'Select');
  
  let isSearchDisabled = !dropoff?.name || !hasValidDates;
  if (isDeliveryRequested) {
    if ((deliveryMode === 'delivery' || deliveryMode === 'both') && !pickup?.name) isSearchDisabled = true;
    if ((deliveryMode === 'return' || deliveryMode === 'both') && !returnAddress?.name) isSearchDisabled = true;
  }

  // Check if selected car is available on these dates
  const isAvailable = selectedCar?.availabilityDate === undefined || (hasValidDates && (selectedCar.availabilityDate === startStr || selectedCar.availabilityDate === 'Available Now'));
  // Note: in a real app, this date validation logic would be more robust.
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trip Details</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={[styles.instruction, { color: colors.foreground }]}>Please enter your destination and dates to check availability and continue booking.</Text>
            
            <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SearchCard mode="Self Drive" onModeChange={() => {}} onSearch={() => {}} isModal={true} />
            </View>

            {hasValidDates && !isAvailable && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>This {selectedCar?.category.toLowerCase()} is not available on your selected dates. It is available on: {selectedCar?.availabilityDate}.</Text>
              </View>
            )}
            
            {hasValidDates && isAvailable && (
              <View style={styles.successBox}>
                <Feather name="check-circle" size={16} color="#16A34A" />
                <Text style={styles.successText}>Available! You can proceed to booking.</Text>
              </View>
            )}

          </View>

          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <PrimaryButton 
              label="Continue to Booking" 
              onPress={onContinue} 
              disabled={isSearchDisabled || (hasValidDates && !isAvailable)} 
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  closeBtn: { position: 'absolute', right: 20, padding: 4 },
  content: { padding: 20, flex: 1 },
  instruction: { fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  searchWrapper: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginTop: 24, gap: 8 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#DC2626', flex: 1, lineHeight: 18 },
  successBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#DCFCE7', padding: 12, borderRadius: 12, marginTop: 24, gap: 8 },
  successText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#16A34A', flex: 1, lineHeight: 18 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  }
});
