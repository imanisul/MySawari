import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { API } from '@/services/backend/api';
import { MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';

const MAX_PHOTOS = 4;
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

type Photo = { uri: string; mimeType?: string };

export function WriteReviewBottomSheet({
  carId,
  bookingId,
  vehicleName,
  onClose,
  onSubmitted,
}: {
  carId: string;
  /** Set when reviewing a completed trip — this is what unlocks photos and "where you visited". */
  bookingId?: string;
  vehicleName?: string;
  onClose: () => void;
  /** Called once the review has been saved and is publicly visible. */
  onSubmitted?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [placeVisited, setPlaceVisited] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [progress, setProgress] = useState('');
  const queryClient = useQueryClient();
  const [bodyHeight, setBodyHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const needsScroll = contentHeight > bodyHeight + 1;

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) =>
    setPhotos(prev => [...prev, ...assets.map(a => ({ uri: a.uri, mimeType: a.mimeType ?? undefined }))].slice(0, MAX_PHOTOS));

  const addFromLibrary = async (remaining: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7, // keeps uploads small
      });
      if (!result.canceled) addAssets(result.assets);
    } catch (e) {
      setError('Could not open your photos. Please check the app has photo access.');
    }
  };

  const addFromCamera = async () => {
    try {
      // Asks the first time; if it was refused before, the system won't ask again — send them to Settings.
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera access needed',
          'Allow MySawari to use the camera in Settings to take trip photos.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled) addAssets(result.assets);
    } catch (e) {
      setError('Could not open the camera on this device.');
    }
  };

  const pickPhotos = async () => {
    Haptics.selectionAsync();
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    setError('');
    // Check up front that uploads are available, instead of failing after the customer has picked photos.
    const access = await API.reviews.canAddPhotos();
    if (!access.allowed) {
      setError(access.message || 'Photos are not available right now');
      return;
    }
    Alert.alert('Add a trip photo', undefined, [
      { text: 'Take photo', onPress: addFromCamera },
      { text: 'Choose from gallery', onPress: () => addFromLibrary(remaining) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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

    if (photos.length > 0 && placeVisited.trim().length < 2) {
      setError('Please tell us where these photos were taken');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Upload photos first (one by one, so a failure is clear), then save the review.
      const uploaded: { url: string; publicId: string }[] = [];
      for (let i = 0; i < photos.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${photos.length}…`);
        uploaded.push(await API.reviews.uploadImage(photos[i].uri, photos[i].mimeType));
      }
      setProgress('Saving your review…');
      await API.reviews.submit(carId, rating, text, {
        bookingId,
        placeVisited: placeVisited.trim() || undefined,
        images: uploaded,
      });
      queryClient.invalidateQueries({ queryKey: ['pendingReviews'] });
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['carReviews'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      onSubmitted?.();
    } catch (e: any) {
      setError(e.message || 'Failed to submit review');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setProgress('');
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
            <Feather name="check" size={28} color={colors.primaryText} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Thanks for your feedback!</Text>
          <Text style={[styles.successText, { color: colors.mutedForeground }]}>
            {rating < MIN_PUBLIC_REVIEW_RATING
              ? 'Your feedback has been sent to our team. We use it to keep improving.'
              : photos.length > 0
              ? 'Your review and trip photos are published. The photos now appear in this vehicle\'s gallery.'
              : 'Your review has been published and is now visible on this page.'}
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
        <Text style={[styles.title, { color: colors.foreground }]}>
          {bookingId ? 'How was your trip?' : 'Write a Review'}
        </Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={needsScroll}
        onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
      >
        {!!vehicleName && (
          <Text numberOfLines={1} style={[styles.intro, { color: colors.mutedForeground }]}>
            Thanks for riding with the {vehicleName}. Tell others how it went.
          </Text>
        )}

        {/* Rating: big, clearly filled stars with a visible outline for the unselected ones */}
        <View style={styles.ratingBlock}>
          <View style={styles.ratingHeader}>
            <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>Rating</Text>
            <Text style={[styles.ratingWord, { color: rating > 0 ? colors.warning : colors.mutedForeground }]}>
              {rating > 0 ? RATING_WORDS[rating] : 'Tap a star'}
            </Text>
          </View>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                accessibilityRole="button"
                accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
                accessibilityState={{ selected: rating >= star }}
                onPress={() => handleStarPress(star)}
                style={styles.starWrap}
              >
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={36}
                  color={rating >= star ? '#F59E0B' : '#9CA3AF'}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Your feedback</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceSoft, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Tell us about your experience with this vehicle..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          value={text}
          onChangeText={(val) => {
            setText(val);
            if (error) setError('');
          }}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.foreground }]}>
          Where did you visit?{' '}
          <Text style={[styles.labelHint, { color: colors.mutedForeground }]}>{photos.length > 0 ? '(required for photos)' : '(optional)'}</Text>
        </Text>
        <TextInput
          style={[styles.singleInput, { backgroundColor: colors.surfaceSoft, borderColor: colors.border, color: colors.foreground }]}
          placeholder="e.g. Shillong, Cherrapunji, Kaziranga"
          placeholderTextColor={colors.mutedForeground}
          value={placeVisited}
          onChangeText={setPlaceVisited}
          maxLength={120}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>
          Trip photos <Text style={[styles.labelHint, { color: colors.mutedForeground }]}>(optional, up to {MAX_PHOTOS})</Text>
        </Text>
        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={p.uri + i} style={styles.photoWrap}>
              <Image source={{ uri: p.uri }} style={styles.photo} />
              <Pressable
                accessibilityLabel="Remove photo"
                disabled={loading}
                onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                style={styles.photoRemove}
                hitSlop={6}
              >
                <Feather name="x" size={12} color="#FFF" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable
              accessibilityLabel="Add photos"
              disabled={loading}
              onPress={pickPhotos}
              style={[styles.photoAdd, { borderColor: colors.border, backgroundColor: colors.surfaceSoft }]}
            >
              <Feather name="camera" size={18} color={colors.mutedForeground} />
              <Text style={[styles.photoAddText, { color: colors.mutedForeground }]}>Add</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Pinned footer: the submit button is always on screen, whatever the form height */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={colors.primaryForeground} />
              {!!progress && <Text style={[styles.submitText, { color: colors.primaryForeground, fontSize: 14 }]}>{progress}</Text>}
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starWrap: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 84,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  singleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  photoWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  intro: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#6B7280', marginBottom: 10 },
  ratingBlock: { marginBottom: 14 },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ratingWord: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  labelHint: { fontFamily: 'Inter_400Regular', color: '#6B7280' },
  photoAddText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: '#6B7280', marginTop: 2 },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
