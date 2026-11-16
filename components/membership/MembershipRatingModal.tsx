import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalBlur } from '@/components/common/ModalBlur';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { recordMembershipRatingAction, requestStoreReview } from '@/services/rateApp';

interface MembershipRatingModalProps {
  visible: boolean;
  customerId?: string;
  onClose: () => void;
}

export function MembershipRatingModal({
  visible,
  customerId,
  onClose,
}: MembershipRatingModalProps) {
  const p = useDetailsPalette();
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await recordMembershipRatingAction(customerId, 'rated');
      onClose();
      await requestStoreReview();
    } catch (err) {
      console.warn('[MembershipRatingModal] Rating review error:', err);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (submitting) return;
    try {
      await recordMembershipRatingAction(customerId, 'dismissed');
    } catch (err) {
      console.warn('[MembershipRatingModal] Dismiss error:', err);
    } finally {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <ModalBlur />
        <View style={[styles.card, { backgroundColor: p.page }]}>
          {/* Stars icon cluster badge */}
          <View style={styles.starClusterWrap}>
            <View style={styles.starClusterBg}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={star === 3 ? 24 : 18}
                  color="#F59E0B"
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>
          </View>

          {/* Heading */}
          <Text style={[styles.title, { color: p.fg }]}>Enjoying MySawari?</Text>

          {/* Prompt copy */}
          <Text style={[styles.body, { color: p.muted }]}>
            Your membership is now active! We'd love to know about your experience. Please consider rating us on the app store.
          </Text>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable
              onPress={handleRate}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: p.navy },
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Rate MySawari"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Rate MySawari</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleDismiss}
              disabled={submitting}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.65 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Maybe Later"
            >
              <Text style={[styles.secondaryBtnText, { color: p.sub }]}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  starClusterWrap: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starClusterBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 28,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 6,
  },
  actionsContainer: {
    alignSelf: 'stretch',
    marginTop: 24,
    gap: 8,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
});

