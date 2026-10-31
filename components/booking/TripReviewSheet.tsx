import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ModalBlur } from '@/components/common/ModalBlur';

const F = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };
const MAX_PHOTOS = 4;

// Figma "Star 1…5": a 5-point star that fills its 24 × 24 box (top point at the top edge, side points at the
// left/right edges, bottom points on the bottom edge), Gold/Star #FBBC04 fill with a 1px #FBBC04 border and
// 1px corner rounding. Empty stars are the same shape, outlined in Neutral/400.
const STAR_PATH = 'M12 1 L15.06 8.73 L23 9.4 L16.95 14.85 L18.8 23 L12 18.63 L5.2 23 L7.05 14.85 L1 9.4 L8.94 8.73 Z';
function Star({ on }: { on: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {/* A 2px round-joined edge on the filled star = the design's 1px border + 1px corner rounding (fills the 24 box). */}
      <Path d={STAR_PATH} fill={on ? '#FBBC04' : '#FFFFFF00'} stroke={on ? '#FBBC04' : '#A3A3A3'} strokeWidth={on ? 2 : 1.2} strokeLinejoin="round" />
    </Svg>
  );
}
const STAR = '#FBBC04';

type Photo = { key: string; uri: string; mimeType?: string; base64?: string; status: 'uploading' | 'done' | 'error'; url?: string; publicId?: string };

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
  const [focused, setFocused] = useState<'text' | 'place' | null>(null);
  const [needStars, setNeedStars] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [placeVisited, setPlaceVisited] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [chooser, setChooser] = useState(false);

  const uploading = photos.some((ph) => ph.status === 'uploading');
  const canSubmit = rating > 0 && !uploading && !submitting;

  // ── Photos ──
  const upload = async (ph: Photo) => {
    try {
      setError('');
      const res = await API.reviews.uploadImage(ph.uri, ph.mimeType, ph.base64);
      setPhotos((cur) => cur.map((x) => (x.key === ph.key ? { ...x, status: 'done', url: res.url, publicId: res.publicId } : x)));
    } catch (err: any) {
      if (__DEV__) console.warn('Trip photo upload failed:', err?.message);
      const msg = err?.message || 'Photo upload failed. Tap retry.';
      setPhotos((cur) => cur.map((x) => (x.key === ph.key ? { ...x, status: 'error' } : x)));
      setError(msg);
    }
  };

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const room = MAX_PHOTOS - photos.length;
    const added: Photo[] = assets.slice(0, room).map((a, i) => ({
      key: `${Date.now()}_${i}`,
      uri: a.uri,
      mimeType: a.mimeType ?? 'image/jpeg',
      base64: a.base64 ?? undefined,
      status: 'uploading' as const,
    }));
    setPhotos((cur) => [...cur, ...added]);
    added.forEach(upload);
  };

  const fromLibrary = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
        quality: 0.7,
        base64: true,
      });
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
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      });
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
    setChooser(true);
  };

  // The camera / gallery opens once the chooser has slid away (iOS can't show it over a closing sheet).
  const choose = (source: 'camera' | 'library') => {
    Haptics.selectionAsync();
    setChooser(false);
    setTimeout(() => (source === 'camera' ? fromCamera() : fromLibrary()), 350);
  };

  const removePhoto = (key: string) => { Haptics.selectionAsync(); setPhotos((cur) => cur.filter((x) => x.key !== key)); };
  const retry = (ph: Photo) => {
    setError('');
    setPhotos((cur) => cur.map((x) => (x.key === ph.key ? { ...x, status: 'uploading' } : x)));
    upload(ph);
  };

  // ── Submit ──
  const submit = async () => {
    if (rating === 0) {
      setNeedStars(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const images = photos.filter((ph) => ph.status === 'done' && ph.url).map((ph) => ({ url: ph.url!, publicId: ph.publicId! }));
    // Backend requires placeVisited when photos are attached
    if (images.length > 0 && placeVisited.trim().length < 2) {
      setError('Please tell us where these photos were taken');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      // Backend requires non-empty text: use a sensible default when the customer skips the text field
      const reviewText = text.trim() || `${rating} star${rating > 1 ? 's' : ''} for my trip with the ${vehicleName}`;
      await API.reviews.submit(carId, rating, reviewText, {
        bookingId,
        placeVisited: placeVisited.trim() || undefined,
        images,
      });
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

  const Dashes = () => (
    <View style={styles.dashes}>
      {Array.from({ length: 70 }, (_, i) => <View key={i} style={styles.dash} />)}
    </View>
  );

  return (
    <View style={styles.wrap}>
      {/* Figma: 19 semibold title, 13 medium grey line, 8 apart */}
      <View style={{ gap: 8 }}>
        <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">How was your trip?</Text>
        <Text style={[styles.sub, { color: p.muted }]}>Your trip with the {vehicleName} is complete. Share your experience to help us improve.</Text>
      </View>

      {/* Grey card: rating, text, photos, place visited, Submit (16/12/12 padding, 12 between rows) */}
      <View style={styles.box}>
        <Text style={[styles.rateTitle, { color: p.fg }]}>Rate the car and overall experience</Text>
        <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating ${rating} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
              hitSlop={4}
              onPress={() => { Haptics.selectionAsync(); setRating(n); setNeedStars(false); }}
            >
              <Star on={n <= rating} />
            </Pressable>
          ))}
        </View>
        {needStars && rating === 0 && <Text style={[styles.hint, { color: p.red }]}>Please select a star rating to continue.</Text>}

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tell us more"
          placeholderTextColor={p.muted}
          onFocus={() => setFocused('text')}
          onBlur={() => setFocused(null)}
          multiline
          maxLength={500}
          style={[styles.input, { borderColor: focused === 'text' ? '#BFC3D4' : '#EAECF1', color: p.fg }]}
          selectionColor={p.navy}
          accessibilityLabel="Tell us more"
        />

        <Dashes />

        {/* Trip photos: up to 4 tiles in one row (each a quarter wide), the next slot is "Add Photos" */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: p.fg }]}>Add Trip Photos (optional)</Text>
          {photos.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={addPhotos} style={({ pressed }) => [styles.addWide, pressed && { opacity: 0.8 }]}>
              <Feather name="upload" size={16} color="#737373" />
              <Text style={styles.addWideText}>Add Photos</Text>
            </Pressable>
          ) : (
            <View style={styles.tiles}>
              {Array.from({ length: MAX_PHOTOS }, (_, i) => {
                const ph = photos[i];
                if (ph) {
                  return (
                    <View key={ph.key} style={[styles.tile, { borderColor: '#BFC3D4' }]}>
                      {ph.status === 'uploading' ? (
                        <View style={[styles.tileCenter, styles.tileDashed]}>
                          <ActivityIndicator size="small" color="#737373" />
                          <Text style={styles.tileText}>Uploading</Text>
                        </View>
                      ) : ph.status === 'error' ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Retry upload" onPress={() => retry(ph)} style={styles.tileCenter}>
                          <Feather name="refresh-cw" size={14} color={p.red} />
                          <Text style={[styles.tileText, { color: p.red }]}>Retry</Text>
                        </Pressable>
                      ) : (
                        <Image source={{ uri: ph.uri }} style={styles.tileImg} />
                      )}
                      <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={8} onPress={() => removePhoto(ph.key)} style={styles.remove}>
                        <Feather name="x" size={9} color="#A3A3A3" />
                      </Pressable>
                    </View>
                  );
                }
                // The first free slot adds photos; the rest keep the row's spacing (invisible, as in the design).
                if (i === photos.length) {
                  return (
                    <Pressable key={`add-${i}`} accessibilityRole="button" accessibilityLabel="Add more photos" onPress={addPhotos} style={({ pressed }) => [styles.tile, styles.tileDashed, styles.tileCenter, pressed && { opacity: 0.8 }]}>
                      <Feather name="upload" size={16} color="#737373" />
                      <Text style={styles.tileText}>Add Photos</Text>
                    </Pressable>
                  );
                }
                return <View key={`gap-${i}`} style={[styles.tile, { borderWidth: 0, backgroundColor: 'transparent' }]} />;
              })}
            </View>
          )}
        </View>

        {/* Place visited — shown with the photos (the server needs it when photos are attached) */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: p.fg }]}>{photos.length > 0 ? 'Place visited' : 'Place visited (optional)'}</Text>
          <TextInput
            value={placeVisited}
            onChangeText={(t) => { setPlaceVisited(t); if (error) setError(''); }}
            placeholder="e.g. Shillong, Cherrapunji, Kaziranga"
            placeholderTextColor={p.muted}
            onFocus={() => setFocused('place')}
            onBlur={() => setFocused(null)}
            maxLength={120}
            returnKeyType="done"
            style={[styles.input, styles.placeInput, { borderColor: focused === 'place' ? '#BFC3D4' : photos.length > 0 && !!error && placeVisited.trim().length < 2 ? p.red : '#EAECF1', color: p.fg }]}
            selectionColor={p.navy}
            accessibilityLabel="Place visited"
          />
        </View>

        {!!error && <Text style={[styles.error, { color: p.red }]}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          onPress={submit}
          style={({ pressed }) => [styles.submit, { backgroundColor: canSubmit ? p.navy : '#A0A6C2' }, pressed && canSubmit && { opacity: 0.88 }]}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit</Text>}
        </Pressable>
      </View>

      <PhotoSourceSheet visible={chooser} left={MAX_PHOTOS - photos.length} onPick={choose} onClose={() => setChooser(false)} />
    </View>
  );
}

/**
 * "Add trip photos" chooser (same look as the review sheet): round ✕ above a white sheet, title, how many
 * photos can still be added, and two option cards — Take photo / Choose from gallery.
 */
function PhotoSourceSheet({ visible, left, onPick, onClose }: {
  visible: boolean;
  left: number;
  onPick: (source: 'camera' | 'library') => void;
  onClose: () => void;
}) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const Option = ({ icon, title, sub, source }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; sub: string; source: 'camera' | 'library' }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => onPick(source)}
      style={({ pressed }) => [styles.option, pressed && { backgroundColor: '#ECEFF6' }]}
    >
      <View style={styles.optionIcon}>
        <Feather name={icon} size={19} color={p.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, { color: p.fg }]}>{title}</Text>
        <Text style={[styles.optionSub, { color: p.muted }]}>{sub}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#A3A3A3" />
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.chooserOverlay}>
        <ModalBlur />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={styles.chooserClose}>
          <Feather name="x" size={20} color="#737373" />
        </Pressable>
        <View style={[styles.chooserSheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={{ gap: 8 }}>
            <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">Add trip photos</Text>
            <Text style={[styles.sub, { color: p.muted }]}>
              Share the best moments of your trip. You can add {left} more photo{left === 1 ? '' : 's'}.
            </Text>
          </View>
          <View style={{ gap: 12 }}>
            <Option icon="camera" title="Take photo" sub="Use your camera to click a photo now" source="camera" />
            <Option icon="image" title="Choose from gallery" sub={`Pick up to ${left} photo${left === 1 ? '' : 's'} from your phone`} source="library" />
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}>
            <Text style={[styles.cancelText, { color: p.navy }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Sizes and colours from the Figma "How was your trip?" frame (393 wide).
const styles = StyleSheet.create({
  wrap: { gap: 16 },
  title: { fontFamily: F.semibold, fontSize: 19, lineHeight: 28.5, textAlign: 'center' },
  sub: { fontFamily: F.medium, fontSize: 13, lineHeight: 19.5, textAlign: 'center' },
  box: { backgroundColor: '#F4F6FA', borderWidth: 1, borderColor: '#EAECF1', borderRadius: 13, paddingTop: 16, paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  rateTitle: { fontFamily: F.semibold, fontSize: 15, lineHeight: 22.5, textAlign: 'center' },
  // Figma: one 24-tall row, stars 24 × 24, 4 apart, centred.
  stars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, height: 24, alignSelf: 'stretch' },
  hint: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: -4 },
  input: { minHeight: 46, maxHeight: 110, backgroundColor: '#FFFFFF', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingTop: 13, paddingBottom: 13, fontFamily: F.medium, fontSize: 13, lineHeight: 19.5, textAlignVertical: 'top' },
  placeInput: { minHeight: 46, height: 46, paddingTop: 0, paddingBottom: 0, textAlignVertical: 'center' },
  dashes: { flexDirection: 'row', overflow: 'hidden', gap: 3 },
  dash: { width: 5, height: 1, backgroundColor: '#BFC3D4' },
  label: { fontFamily: F.semibold, fontSize: 11, lineHeight: 16.5 },
  addWide: { height: 67, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF1', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addWideText: { fontFamily: F.medium, fontSize: 11, lineHeight: 16.5, color: '#737373' },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, height: 67, borderRadius: 12, borderWidth: 1, backgroundColor: '#FFFFFF' },
  tileDashed: { borderStyle: 'dashed', borderColor: '#BFC3D4', borderWidth: 1, borderRadius: 12 },
  tileCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tileImg: { width: '100%', height: '100%', borderRadius: 11 },
  tileText: { fontFamily: F.medium, fontSize: 8, lineHeight: 12, color: '#737373' },
  remove: { position: 'absolute', top: -3, right: -3.75, width: 19, height: 19, borderRadius: 9.5, borderWidth: 1, borderColor: '#BFC3D4', backgroundColor: '#F9F9FB', alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 16, textAlign: 'center' },
  submit: { height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: F.semibold, fontSize: 17, lineHeight: 25.5, color: '#FFFFFF' },
  thanks: { borderWidth: 1, borderRadius: 13, paddingVertical: 16, marginTop: 16, alignItems: 'center' },
  thanksText: { fontFamily: F.semibold, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  appreciate: { fontFamily: F.medium, fontSize: 13, lineHeight: 19.5, textAlign: 'center', marginTop: 16, paddingHorizontal: 12 },
  doneBtn: { height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  doneText: { fontFamily: F.semibold, fontSize: 17 },

  // Photo source chooser
  chooserOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  chooserClose: { alignSelf: 'flex-end', marginRight: 12, marginBottom: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' },
  chooserSheet: { backgroundColor: '#FFFFFF', borderWidth: 1, borderBottomWidth: 0, borderColor: '#E7EAF4', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F4F6FA', borderWidth: 1, borderColor: '#EAECF1', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 12 },
  optionIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF1', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontFamily: F.semibold, fontSize: 15, lineHeight: 22.5 },
  optionSub: { fontFamily: F.medium, fontSize: 12, lineHeight: 18 },
  cancelBtn: { height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  cancelText: { fontFamily: F.semibold, fontSize: 17 },
});