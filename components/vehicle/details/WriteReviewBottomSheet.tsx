import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { API } from '@/services/backend/api';

export function WriteReviewBottomSheet({
  carId,
  onClose,
  onSubmitted,
}: {
  carId: string;
  onClose: () => void;
  /** Called once the review has been accepted for moderation (not yet shown publicly). */
  onSubmitted?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleStarPress = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(idx);
    setError('');
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (text.trim().length < 10) {
      setError('Please write at least 10 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await API.reviews.submit(carId, rating, text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      onSubmitted?.();
    } catch (e: any) {
      setError(e.message || 'Failed to submit review');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Review Submitted</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={[styles.content, { alignItems: 'center', paddingVertical: 32 }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.tintLight }]}>
            <Feather name="check" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Thanks for your feedback!</Text>
          <Text style={[styles.successText, { color: colors.mutedForeground }]}>
            Your review has been submitted and is awaiting approval by our team. It will appear on this page once approved.
          </Text>
          <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, width: '100%', marginTop: 24 }]} onPress={onClose}>
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Write a Review</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.foreground }]}>Rating</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => handleStarPress(star)} style={styles.starWrap}>
              <Feather 
                name="star" 
                size={32} 
                color={rating >= star ? '#F59E0B' : colors.muted} 
              />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Your Feedback</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: colors.surfaceSoft, 
              borderColor: colors.border,
              color: colors.foreground 
            }
          ]}
          placeholder="Tell us about your experience with this vehicle..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={(val) => {
            setText(val);
            if (error) setError('');
          }}
          textAlignVertical="top"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable 
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
            loading && { opacity: 0.5 }
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Submit Review</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  starWrap: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
