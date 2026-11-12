import React, { useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingImage } from '@/components/common/LoadingImage';

/**
 * Full-screen photo viewer used for every photo in the app (vehicle gallery, guest trips, review photos):
 * the whole photo on black (never cropped), swipe between photos, "3 / 8" counter and a close button under the
 * status bar, and pinch-to-zoom where the phone supports it (iOS). Android's back button closes it.
 */
export function PhotoViewer({ images, initialIndex = 0, onClose }: { images: any[]; initialIndex?: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0)));
  const list = useRef<FlatList>(null);

  if (images.length === 0) return null;

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <FlatList
          ref={list}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index}
          getItemLayout={(_d, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(_it, i) => String(i)}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            // iOS zooms inside a ScrollView; on Android it is simply the full photo.
            <ScrollView
              style={{ width, height }}
              contentContainerStyle={{ width, height, alignItems: 'center', justifyContent: 'center' }}
              maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
              minimumZoomScale={1}
              bouncesZoom
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent
            >
              <LoadingImage source={item} style={{ width, height: height * 0.8 }} contentFit="contain" transition={150} />
            </ScrollView>
          )}
        />

        <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.counter} accessibilityLiveRegion="polite">{images.length > 1 ? `${index + 1} / ${images.length}` : ''}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={onClose} hitSlop={12} style={styles.close}>
            <Feather name="x" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  counter: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
});
