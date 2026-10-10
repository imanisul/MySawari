import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { UpdateStatus } from '@/hooks/useAppUpdates';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type UpdateModalProps = {
  visible: boolean;
  status: UpdateStatus;
  errorMessage: string | null;
  onUpdateNow: () => void;
  onLater: () => void;
  onRetry: () => void;
};

export function UpdateModal({
  visible,
  status,
  errorMessage,
  onUpdateNow,
  onLater,
  onRetry,
}: UpdateModalProps) {
  const colors = useColors();
  // Spinner rotation
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'downloading' || status === 'restarting') {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      spinAnim.setValue(0);
    }
  }, [status, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isProcessing = status === 'downloading' || status === 'downloaded' || status === 'restarting';
  const isError = status === 'error';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isProcessing ? undefined : onLater}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* ── Header Icon ── */}
          <View style={styles.iconContainer}>
            {isError ? (
              <View style={[styles.iconCircle, styles.iconCircleError]}>
                <Feather name="alert-triangle" size={28} color={colors.destructive} />
              </View>
            ) : isProcessing ? (
              <Animated.View style={[styles.iconCircle, styles.iconCircleProcessing, { transform: [{ rotate: spin }] }]}>
                <Feather name="refresh-cw" size={28} color={colors.blue} />
              </Animated.View>
            ) : (
              <View style={[styles.iconCircle, styles.iconCircleAvailable]}>
                <Feather name="download-cloud" size={28} color={colors.primaryText} />
              </View>
            )}
          </View>

          {/* ── Title ── */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isError
              ? 'Update Failed'
              : status === 'restarting'
              ? 'Restarting MySawari...'
              : status === 'downloaded'
              ? 'Update Installed'
              : status === 'downloading'
              ? 'Downloading Update...'
              : 'New Update Available'}
          </Text>

          {/* ── Subtitle ── */}
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {isError
              ? errorMessage || 'Something went wrong. Please try again.'
              : status === 'restarting'
              ? 'Please wait while MySawari restarts with the latest version.'
              : status === 'downloaded'
              ? 'Update installed successfully. Restarting MySawari...'
              : status === 'downloading'
              ? 'Please wait while we download the latest improvements.'
              : "We've improved MySawari with new features, performance improvements and bug fixes."}
          </Text>

          {/* ── Progress Bar (downloading) ── */}
          {status === 'downloading' && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                <Animated.View style={[styles.progressBarFill, { width: '100%' }]} />
              </View>
            </View>
          )}

          {/* ── Buttons ── */}
          {!isProcessing && (
            <View style={styles.buttonContainer}>
              {isError ? (
                <>
                  <Pressable
                    style={[styles.button, styles.primaryButton]}
                    onPress={onRetry}
                  >
                    <Feather name="refresh-cw" size={16} color={colors.primaryForeground} style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.secondaryButton]}
                    onPress={onLater}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>Later</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={[styles.button, styles.primaryButton]}
                    onPress={onUpdateNow}
                  >
                    <Feather name="download" size={16} color={colors.primaryForeground} style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>Update Now</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.secondaryButton]}
                    onPress={onLater}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>Later</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 25, 34, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 56, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleAvailable: {
    backgroundColor: 'rgba(183, 245, 46, 0.15)',
  },
  iconCircleProcessing: {
    backgroundColor: 'rgba(97, 120, 216, 0.12)',
  },
  iconCircleError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#142033',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#78808F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7E2',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#B7F52E',
    borderRadius: 2,
    // Animated indeterminate shimmer effect via width animation
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#B7F52E',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#142033',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#78808F',
  },
});
