import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

const F = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };
const MAX_PHOTOS = 4;
const STAR = '#FBBC04';

type Photo = { key: string; uri: string; mimeType?: string; status: 'uploading' | 'done' | 'error'; url?: string; publicId?: string };

/**
 * Figma "How was your trip?" (completed trip): rate the car and overall experience (required), tell us more
 * (optional), add trip photos (optional — each uploads as soon as it's picked, with its own "Uploading"
 * tile), Submit → "Feedback Submitted". Saved with POST /reviews (photos via the signed Cloudinary upload).
 */
export function TripReviewSheet({ carId, bookingId, vehicleName, onClose, onSubmitted }: {
  carId: string;
  bookingId: string;
  vehicleName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const p = useDetailsPalette();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [needStars, setNeedStars] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const uploading = photos.some((ph) => ph.status === 'uploading');
  const canSubmit = rating > 0 && !uploading && !submitting;

  // ── Photos ──
  const upload = async (ph: Photo) => {
    try {
      const res = await API.reviews.uploadImage(ph.uri, ph.mimeType);
      setPhotos((cur) => cur.map((x) => (x.key === ph.key ? { ...x, status: 'done', url: res.url, publicId: res.publicId } : x)));
    } catch {
      setPhotos((cur) => cur.map((x) => (x.key === ph.key ? { ...x, status: 'error' } : x)));
    }
  };

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const room = MAX_PHOTOS - photos.length;
    const added: Photo[] = assets.slice(0, room).map((a, i) => ({ key: `${Date.now()}_${i}`, uri: a.uri, mimeType: a.mimeType ?? undefined, status: 'uploading' }));
    setPhotos((cur) => [...cur, ...added]);
    added.forEach(upload);
  };

  const fromLibrary = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS - photos.length, quality: 0.7 });
      if (!r.canceled) addAssets(r.assets);
    } catch {
      setError('Could not open your photos. Please allow photo access for MySawari.');
    }
  };

  const fromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera access needed', 'Allow MySawari to use the camera in Settings to take trip photos.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!r.canceled) addAssets(r.assets);
    } catch {
      setError('Could not open the camera on this device.');
    }
  };

  const addPhotos = async () => {
    Haptics.selectionAsync();
    if (photos.length >= MAX_PHOTOS) return;
    setError('');
    const access = await API.reviews.canAddPhotos();
    if (!access.allowed) { setError(access.message || 'Photos are not available right now.'); return; }
    Alert.alert('Add trip photos', undefined, [
      { text: 'Take photo', onPress: fromCamera },
      { text: 'Choose from gallery', onPress: fromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (key: string) => { Haptics.selectionAsync(); setPhotos((cur) => cur.filter((x) => x.key !== key)); };
  const retry = (ph: Photo) => { setPhotos((cur) => cur.map((x) => (x.key === ph.key ? { ...x, status: 'uploading' } : x))); upload(ph); };

  // ── Submit ──
  const submit = async () => {
    if (rating === 0) {
      setNeedStars(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const images = photos.filter((ph) => ph.status === 'done' && ph.url).map((ph) => ({ url: ph.url!, publicId: ph.publicId! }));
      await API.reviews.submit(carId, rating, text, { bookingId, images });
      queryClient.invalidateQueries({ queryKey: ['pendingReviews'] });
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: ['carReviews'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
      onSubmitted?.();
    } catch (e: any) {
      setError(e?.message || "Couldn't submit your feedback. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Feedback Submitted ──
  if (done) {
    return (
      <View>
        <Text style={[styles.title, { color: p.fg }]}>Feedback Submitted</Text>
        <Text style={[styles.sub, { color: p.muted }]}>Your feedback helps us make every trip better.</Text>
        <View style={[styles.thanks, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
          <Text style={[styles.thanksText, { color: p.navy }]}>Thanks for sharing{'\n'}your experience!</Text>
        </View>
        <Text style={[styles.appreciate, { color: p.muted }]}>We appreciate you taking the time to rate your trip with the {vehicleName}.</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.doneBtn, { backgroundColor: p.soft }, pressed && { opacity: 0.8 }]}>
          <Text style={[styles.doneText, { color: p.navy }]}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">How was your trip?</Text>
      <Text style={[styles.sub, { color: p.muted }]}>Your trip with the {vehicleName} is complete. Share your experience to help us improve.</Text>

      <View style={[styles.box, { backgroundColor: p.soft, borderColor: p.border }]}>
        <Text style={[styles.rateTitle, { color: p.fg }]}>Rate the car and overall experience</Text>
        <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating ${rating} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
              hitSlop={6}
              onPress={() => { Haptics.selectionAsync(); setRating(n); setNeedStars(false); }}
            >
              <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={22} color={n <= rating ? STAR : p.muted} />
            </Pressable>
          ))}
        </View>
        {needStars && rating === 0 && <Text style={[styles.hint, { color: p.sub }]}>Please select a star rating to continue.</Text>}

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tell us more (optional)"
          placeholderTextColor={p.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
          maxLength={500}
          style={[styles.input, { backgroundColor: p.page, borderColor: focused ? p.muted : p.border, color: p.fg }]}
          selectionColor={p.navy}
          accessibilityLabel="Tell us more"
        />

        {/* Trip photos */}
        <View style={styles.dashes}>
          {Array.from({ length: 60 }, (_, i) => <View key={i} style={[styles.dash, { backgroundColor: p.strongBorder }]} />)}
        </View>
        <Text style={[styles.photoLabel, { color: p.fg }]}>Add Trip Photos (optional)</Text>
        {photos.length === 0 ? (
          <Pressable accessibilityRole="button" onPress={addPhotos} style={({ pressed }) => [styles.addWide, { backgroundColor: p.page, borderColor: p.border }, pressed && { opacity: 0.8 }]}>
            <Feather name="upload" size={15} color={p.sub} />
            <Text style={[styles.addText, { color: p.sub }]}>Add Photos</Text>
          </Pressable>
        ) : (
          <View style={styles.tiles}>
            {photos.map((ph) => (
              <View key={ph.key} style={[styles.tile, { borderColor: p.border, backgroundColor: p.page }]}>
                {ph.status === 'uploading' ? (
                  <View style={styles.tileCenter}>
                    <ActivityIndicator size="small" color={p.sub} />
                    <Text style={[styles.tileText, { color: p.sub }]}>Uploading</Text>
                  </View>
                ) : ph.status === 'error' ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Retry upload" onPress={() => retry(ph)} style={styles.tileCenter}>
                    <Feather name="refresh-cw" size={14} color={p.red} />
                    <Text style={[styles.tileText, { color: p.red }]}>Retry</Text>
                  </Pressable>
                ) : (
                  <Image source={{ uri: ph.uri }} style={styles.tileImg} />
                )}
                <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={8} onPress={() => removePhoto(ph.key)} style={[styles.remove, { backgroundColor: p.page, borderColor: p.border }]}>
                  <Feather name="x" size={9} color={p.sub} />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable accessibilityRole="button" accessibilityLabel="Add more photos" onPress={addPhotos} style={({ pressed }) => [styles.tile, styles.tileAdd, { borderColor: p.strongBorder, backgroundColor: p.page }, pressed && { opacity: 0.8 }]}>
                <Feather name="upload" size={13} color={p.sub} />
                <Text style={[styles.tileText, { color: p.sub }]}>Add Photos</Text>
              </Pressable>
            )}
          </View>
        )}

        {!!error && <Text style={[styles.error, { color: p.red }]}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          onPress={submit}
          style={({ pressed }) => [styles.submit, { backgroundColor: canSubmit ? p.navy : '#9EA5C4' }, pressed && canSubmit && { opacity: 0.88 }]}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: F.medium, fontSize: 16.5, lineHeight: 23, textAlign: 'center' },
  sub: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 6, paddingHorizontal: 8 },
  box: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 14 },
  rateTitle: { fontFamily: F.medium, fontSize: 13, textAlign: 'center', marginTop: 4 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 9 },
  hint: { fontFamily: F.regular, fontSize: 11, textAlign: 'center', marginTop: 8 },
  input: { minHeight: 36, maxHeight: 90, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingTop: 9, paddingBottom: 9, marginTop: 12, fontFamily: F.regular, fontSize: 12, textAlignVertical: 'top' },
  dashes: { flexDirection: 'row', overflow: 'hidden', gap: 3, marginTop: 12 },
  dash: { width: 4, height: 1 },
  photoLabel: { fontFamily: F.medium, fontSize: 10.5, marginTop: 10 },
  addWide: { height: 52, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  addText: { fontFamily: F.regular, fontSize: 10.5 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  tile: { width: 60, height: 52, borderRadius: 6, borderWidth: 1 },
  tileAdd: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  tileCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tileImg: { width: '100%', height: '100%', borderRadius: 5 },
  tileText: { fontFamily: F.regular, fontSize: 8 },
  remove: { position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: 7.5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 10 },
  submit: { height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  submitText: { fontFamily: F.medium, fontSize: 14, color: '#FFFFFF' },
  thanks: { borderWidth: 1, borderRadius: 10, paddingVertical: 14, marginTop: 14, alignItems: 'center' },
  thanksText: { fontFamily: F.medium, fontSize: 15.5, lineHeight: 21, textAlign: 'center' },
  appreciate: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 14, paddingHorizontal: 12 },
  doneBtn: { height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  doneText: { fontFamily: F.medium, fontSize: 13.5 },
});