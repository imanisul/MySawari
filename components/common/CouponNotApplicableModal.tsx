import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { PF } from '@/components/profile/ProfileParts';
import * as Haptics from '@/utils/haptics';

type Props = {
  visible: boolean;
  code: string;
  reason: string;
  carName?: string;
  onClose: () => void;
  onViewCoupons?: () => void;
};

/**
 * Branded "Coupon Not Applicable" popup shown whenever a customer tries to apply
 * a coupon that belongs to a different vehicle, doesn't meet minimum booking,
 * is restricted to specific customers/members, or has reached its First-N limit.
 */
export function CouponNotApplicableModal({
  visible,
  code,
  reason,
  carName,
  onClose,
  onViewCoupons,
}: Props) {
  const p = useDetailsPalette();
  const isCarMismatch = /vehicle|selected car|different car|not applicable to/i.test(reason);
  const title = isCarMismatch ? 'Not Valid For This Car' : 'Coupon Not Applicable';
  const cleanCode = String(code || '').trim().toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: p.page,
              borderColor: p.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Close X */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={10}
            style={[styles.closeIcon, { backgroundColor: p.soft }]}
          >
            <Feather name="x" size={16} color={p.muted} />
          </Pressable>

          {/* Icon Medallion */}
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingInner}>
              <MaterialCommunityIcons
                name={isCarMismatch ? 'car-off' : 'ticket-percent-outline'}
                size={28}
                color="#DC2626"
              />
            </View>
            <View style={styles.alertDot}>
              <Feather name="alert-circle" size={14} color="#FFFFFF" />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: p.fg }]}>{title}</Text>

          {/* Code Badge */}
          {!!cleanCode && (
            <View style={[styles.codePill, { backgroundColor: p.soft, borderColor: p.border }]}>
              <MaterialCommunityIcons name="ticket-outline" size={13} color={p.navy} />
              <Text style={[styles.codeText, { color: p.navy }]}>{cleanCode}</Text>
            </View>
          )}

          {/* Reason Box */}
          <View style={[styles.reasonBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={styles.reasonText}>
              {reason || 'This coupon cannot be applied to your current booking.'}
            </Text>
            {isCarMismatch && !!carName && (
              <Text style={styles.carHint}>
                Current vehicle: <Text style={{ fontFamily: PF.bold }}>{carName}</Text>
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {onViewCoupons && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  onClose();
                  onViewCoupons();
                }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { backgroundColor: p.soft, borderColor: p.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: p.navy }]}>
                  View Eligible Coupons
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: p.button },
                pressed && { opacity: 0.88 },
              ]}
            >
              <Text style={styles.primaryBtnText}>Got It</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  closeIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconRingInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: PF.bold,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeText: {
    fontFamily: PF.bold,
    fontSize: 12.5,
    letterSpacing: 1,
  },
  reasonBox: {
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonText: {
    fontFamily: PF.medium,
    fontSize: 13,
    lineHeight: 19,
    color: '#991B1B',
    textAlign: 'center',
  },
  carHint: {
    fontFamily: PF.regular,
    fontSize: 11.5,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 6,
  },
  actions: {
    width: '100%',
    marginTop: 18,
    gap: 8,
  },
  primaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: PF.bold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: PF.semibold,
    fontSize: 13.5,
  },
});
