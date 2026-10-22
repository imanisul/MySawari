import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useSawari } from '@/context/SawariContext';
import { Page, Header } from '@/components';
import { useVehicles } from '@/hooks/useVehicles';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// ─── Design tokens (from Figma) ────────────────────────────────────────────────
const T = {
  white: '#FFFFFF',
  cardBg: '#F4F6FA',
  cardBorder: '#E7EAF4',
  neutral800: '#262626',
  neutral600: '#525252',
  neutral500: '#737373',
  neutral300: '#D4D4D4',
  neutral100: '#F5F5F5',
  primary500: '#2F3E75',
  green500: '#008758',
  green400: '#339F79',
  star: '#FBBC04',
  heartActive: '#E11D48',
};

const FONT = {
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

// ─── Car details route ────────────────────────────────────────────────────────
// Set this to the same screen CarListCard opens (the file name in your app/ folder).
const CAR_DETAIL_PATHNAME = '/car-detail';

// ─── Vehicle → card data ──────────────────────────────────────────────────────
// All field mapping lives here. Adjust the names if your vehicle model differs.
type CardData = {
  name: string;
  images: string[];
  tag?: string;
  tagVariant?: 'primary' | 'green';
  transmission?: string;
  fuel?: string;
  seats?: number | string;
  rating?: number;
  reviews?: number;
  price: number;
  originalPrice?: number;
  availableOn?: string;
};

const toNumber = (v: any) => (v == null || v === '' || isNaN(Number(v)) ? undefined : Number(v));

const toImageList = (car: any): string[] => {
  const raw = car.images ?? car.gallery ?? car.photos ?? [car.image ?? car.imageUrl ?? car.thumbnail];
  return (Array.isArray(raw) ? raw : [raw])
    .map((img: any) => (typeof img === 'string' ? img : img?.url ?? img?.uri))
    .filter(Boolean);
};

const formatAvailableOn = (value?: string | number | Date) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime()) || date.getTime() <= Date.now()) return undefined;
  return `${date.getDate()} ${date.toLocaleString('en-IN', { month: 'short' }).toLowerCase()}.`;
};

const toCardData = (car: any): CardData => ({
  name: car.name ?? [car.brand, car.model, car.variant].filter(Boolean).join(' '),
  images: toImageList(car),
  tag: car.tag ?? car.badge ?? car.highlight,
  tagVariant: car.tagVariant,
  transmission: car.transmission,
  fuel: car.fuelType ?? car.fuel,
  seats: car.seats ?? car.seatingCapacity,
  rating: toNumber(car.rating),
  reviews: toNumber(car.reviewCount ?? car.reviewsCount ?? car.totalReviews),
  price: toNumber(car.price ?? car.pricePerDay ?? car.dailyRate) ?? 0,
  originalPrice: toNumber(car.originalPrice ?? car.mrp ?? car.strikePrice),
  availableOn: formatAvailableOn(car.availableFrom ?? car.nextAvailableDate),
});

const formatINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// ─── Vehicle card (Figma) ─────────────────────────────────────────────────────
function FavouriteCarCard({
  data,
  isFavourite,
  onToggleFavourite,
  onPress,
}: {
  data: CardData;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onPress: () => void;
}) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const specs = [data.transmission, data.fuel, data.seats != null ? `${data.seats} Seater` : undefined].filter(
    Boolean
  ) as string[];

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      {/* Image carousel */}
      <View style={styles.media} onLayout={onLayout}>
        {width > 0 && (
          <FlatList
            ref={listRef}
            data={data.images}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height: 212 }} resizeMode="cover" />
            )}
          />
        )}

        {/* Top row: tag + heart */}
        <View style={styles.mediaTop} pointerEvents="box-none">
          {data.tag ? (
            <View style={[styles.tag, { backgroundColor: data.tagVariant === 'green' ? T.green500 : T.primary500 }]}>
              <Text style={styles.tagText}>{data.tag}</Text>
            </View>
          ) : (
            <View />
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={8}
            style={styles.heartBtn}
            onPress={() => {
              Haptics.selectionAsync();
              onToggleFavourite();
            }}
            accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Ionicons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavourite ? T.heartActive : T.neutral800}
            />
          </TouchableOpacity>
        </View>

        {/* Dots */}
        {data.images.length > 1 && (
          <View style={styles.dots} pointerEvents="none">
            {data.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.name} numberOfLines={1}>
              {data.name}
            </Text>
            {specs.length > 0 && (
              <View style={styles.specRow}>
                {specs.map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && <View style={styles.specDot} />}
                    <Text style={styles.specText}>{s}</Text>
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {data.rating != null && (
            <View style={styles.ratingCol}>
              <View style={styles.ratingPill}>
                <Text style={styles.ratingText}>{data.rating.toFixed(1)}</Text>
                <Ionicons name="star" size={11} color={T.star} />
              </View>
              {data.reviews != null && <Text style={styles.reviewsText}>({data.reviews} Reviews)</Text>}
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>{formatINR(data.price)}</Text>
            {data.originalPrice != null && data.originalPrice > data.price && (
              <Text style={styles.originalPrice}>{formatINR(data.originalPrice)}</Text>
            )}
          </View>

          {data.availableOn ? (
            <View style={styles.linkRow}>
              <Text style={[styles.linkText, { color: T.green400 }]}>Available on {data.availableOn}</Text>
              <Feather name="chevron-right" size={13} color={T.green400} />
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.linkRow} onPress={onPress}>
              <Text style={[styles.linkText, styles.underline]}>View Details</Text>
              <Feather name="chevron-right" size={13} color={T.neutral500} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sawari = useSawari();
  const { favorites } = sawari;
  // Same toggle the existing car cards use to save/unsave a vehicle.
  const toggleFavorite: ((id: string) => void) | undefined = (sawari as any).toggleFavorite;

  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  // Saved cars are matched against the live fleet: until it has loaded, show placeholders, not "empty".
  const waitingForFleet = favorites.length > 0 && vehiclesLoading;

  const favoriteCars = useMemo(() => {
    return (vehicles || []).filter(car => favorites.includes(car.id));
  }, [vehicles, favorites]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="heart" size={24} color={T.primary500} />
      </View>
      <Text style={styles.emptyTitle}>No favourite cars yet</Text>
      <Text style={styles.emptyDesc}>Tap the heart on any car to save it here.</Text>
      <Pressable
        style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.85 }]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/explore');
        }}
      >
        <Text style={styles.exploreBtnText}>Explore Vehicles</Text>
      </Pressable>
    </View>
  );

  return (
    <Page bottomNav scroll={false}>
      <Header title="Favourite Cars" hideLogo={true} back={true} />

      <FlatList
        data={favoriteCars}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FavouriteCarCard
            data={toCardData(item)}
            isFavourite={favorites.includes(item.id)}
            onToggleFavourite={() => toggleFavorite?.(item.id)}
            onPress={() => {
              Haptics.selectionAsync();
              router.push({ pathname: CAR_DETAIL_PATHNAME, params: { id: item.id } } as any);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          waitingForFleet ? (
            <View>{[0, 1].map(i => <CarCardSkeleton key={i} index={i} />)}</View>
          ) : (
            renderEmpty
          )
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Card
  card: {
    backgroundColor: T.cardBg,
    borderWidth: 1,
    borderColor: T.cardBorder,
    borderRadius: 12,
    paddingTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 8,
  },
  media: {
    height: 212,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: T.white,
  },
  mediaTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tagText: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    lineHeight: 16,
    color: T.white,
  },
  heartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    height: 4,
    borderRadius: 20,
  },
  dotActive: {
    width: 16,
    backgroundColor: T.white,
  },
  dotInactive: {
    width: 4,
    backgroundColor: T.neutral300,
  },
  details: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  infoLeft: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: FONT.semibold,
    fontSize: 17,
    lineHeight: 26,
    color: T.neutral800,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral500,
  },
  specDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: T.neutral500,
  },
  ratingCol: {
    alignItems: 'center',
    gap: 4,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: T.primary500,
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 9,
    paddingVertical: 4,
  },
  ratingText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: T.white,
  },
  reviewsText: {
    fontFamily: FONT.medium,
    fontSize: 11,
    lineHeight: 16,
    color: T.neutral600,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  price: {
    fontFamily: FONT.semibold,
    fontSize: 19,
    lineHeight: 26,
    color: T.neutral800,
  },
  originalPrice: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: T.neutral500,
    textDecorationLine: 'line-through',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    lineHeight: 16,
    color: T.neutral500,
  },
  underline: {
    textDecorationLine: 'underline',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: FONT.semibold,
    fontSize: 17,
    lineHeight: 26,
    color: T.neutral800,
  },
  emptyDesc: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral500,
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 16,
    height: 47,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: T.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: T.white,
  },
});