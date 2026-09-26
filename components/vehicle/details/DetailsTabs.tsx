import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Car, Review, getCarHighlights, MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { WriteReviewBottomSheet } from './WriteReviewBottomSheet';
import { Modal, ScrollView } from 'react-native';
import { Reveal } from '@/components/common/Reveal';
import { ReviewListSkeleton } from '@/components/loading/ScreenSkeletons';
import { useQuery } from '@tanstack/react-query';
import { LoadingImage } from '@/components/common/LoadingImage';

type DetailsTab = 'about' | 'gallery' | 'reviews';

export function DetailsTabs({
  car,
  activeTab: controlledActiveTab,
  onTabChange,
}: {
  car: Car;
  /** Optional — lets a parent (e.g. a quick-nav) jump straight to a tab. Falls back to internal state when omitted. */
  activeTab?: DetailsTab;
  onTabChange?: (tab: DetailsTab) => void;
}) {
  const colors = useColors();
  const [internalActiveTab, setInternalActiveTab] = useState<DetailsTab>('about');
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabPress = (tab: DetailsTab) => {
    Haptics.selectionAsync();
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(['about', 'gallery', 'reviews'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
              <Pressable
              key={tab}
              onPress={() => handleTabPress(tab)}
              style={[
                styles.tabItem, 
                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: isActive ? colors.primaryText : colors.mutedForeground },
                isActive && { fontFamily: 'Inter_700Bold' }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'about' && <AboutTab car={car} />}
        {activeTab === 'gallery' && <GalleryTab car={car} />}
        {activeTab === 'reviews' && <ReviewsTab car={car} />}
      </View>
    </View>
  );
}

// --- TAB: ABOUT ---
function AboutTab({ car }: { car: Car }) {
  const colors = useColors();
  const isBike = car.type === 'Bike';
  const highlights = car.highlights || getCarHighlights(car);

  return (
    <View style={styles.tabSection}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this {car.type.toLowerCase()}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {car.description || `A well-maintained ${car.type.toLowerCase()} perfect for your trips. Reliable, comfortable, and ready to go.`}
      </Text>

      {highlights.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>Good for</Text>
          <View style={styles.highlightsRow}>
            {highlights.map(tag => (
              <View key={tag} style={[styles.highlightChip, { backgroundColor: colors.tintLight, borderColor: colors.primary + '30' }]}>
                <Feather name="zap" size={13} color={colors.primaryText} />
                <Text style={[styles.highlightChipText, { color: colors.primaryText }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>
        {isBike ? 'Bike Specifications' : 'Vehicle Specifications'}
      </Text>
      <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Row 1: Core specs */}
        <View style={styles.specsGrid}>
          <SpecBox icon="settings" label="Transmission" value={car.transmission} colors={colors} />
          <SpecBox icon="droplet" label="Fuel Type" value={car.fuel} colors={colors} />
          <SpecBox icon="users" label={isBike ? 'Riders' : 'Seating'} value={car.seats} colors={colors} />
          {car.engine && <SpecBox icon="cpu" label="Engine" value={car.engine} colors={colors} />}
        </View>

        <View style={[styles.specsDivider, { backgroundColor: colors.border }]} />

        {/* Row 2: Performance */}
        <View style={styles.specsGrid}>
          {car.mileage && car.mileage !== 'N/A' && <SpecBox icon="bar-chart-2" label="Mileage" value={car.mileage} colors={colors} />}
          {car.topSpeed && <SpecBox icon="wind" label="Top Speed" value={car.topSpeed} colors={colors} />}
          {car.acceleration && <SpecBox icon="zap" label="0-100 km/h" value={car.acceleration} colors={colors} />}
          {car.tankCapacity && <SpecBox icon="battery" label={car.fuel === 'EV' ? 'Battery' : 'Tank'} value={car.tankCapacity} colors={colors} />}
        </View>

        {/* Row 3: Build (only if we have data) */}
        {(car.groundClearance || car.kerbWeight || car.bootSpace || car.airbags) && (
          <>
            <View style={[styles.specsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.specsGrid}>
              {car.groundClearance && <SpecBox icon="arrow-up" label="Clearance" value={car.groundClearance} colors={colors} />}
              {car.kerbWeight && <SpecBox icon="box" label="Weight" value={car.kerbWeight} colors={colors} />}
              {!isBike && car.bootSpace && <SpecBox icon="briefcase" label="Boot Space" value={car.bootSpace} colors={colors} />}
              {!isBike && car.airbags && <SpecBox icon="shield" label="Airbags" value={car.airbags} colors={colors} />}
            </View>
          </>
        )}

        {/* Row 4: Wheels & Brakes */}
        {(car.brakes || car.tyreSize) && (
          <>
            <View style={[styles.specsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.specsGrid}>
              {car.brakes && <SpecBox icon="disc" label="Brakes" value={car.brakes} colors={colors} />}
              {car.tyreSize && <SpecBox icon="circle" label="Tyre Size" value={car.tyreSize} colors={colors} />}
            </View>
          </>
        )}
      </View>

      {/* Vehicle Info — from DB */}
      {(car.color || car.registrationYear || car.manufacturer || car.variant || (!isBike && car.doors) || car.luggage) && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>Vehicle Info</Text>
          <View style={[styles.grid, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {car.manufacturer && <DetailRow label="Manufacturer" value={car.manufacturer} />}
            {car.variant && <DetailRow label="Variant" value={car.variant} />}
            {car.color && <DetailRow label="Colour" value={car.color} />}
            {car.registrationYear && <DetailRow label="Reg. Year" value={car.registrationYear} />}
            {!isBike && car.doors && <DetailRow label="Doors" value={car.doors} />}
            {car.luggage && <DetailRow label="Luggage" value={car.luggage} />}
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>Features & Amenities</Text>
      <View style={styles.featuresGrid}>
        {(car.features || ['Air Conditioning', 'Power Steering', 'Bluetooth']).map(feature => (
          <View key={feature} style={[styles.featureItem, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Feather name="check" size={16} color={colors.primaryText} />
            <Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SpecBox({ icon, label, value, colors }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; colors: any }) {
  return (
    <View style={styles.specBox}>
      <View style={[styles.specIconWrap, { backgroundColor: colors.tintLight }]}>
        <Feather name={icon} size={16} color={colors.primaryText} />
      </View>
      <Text numberOfLines={1} style={[styles.specLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.specValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

// --- TAB: GALLERY ---
function GalleryTab({ car }: { car: Car }) {
  const colors = useColors();
  const images = car.images || [car.image];
  const { data: reviews = [] } = useCarReviews(car.id);
  const [viewer, setViewer] = useState<string | null>(null);

  // Trip photos customers attached to their reviews.
  const guestPhotos = reviews.flatMap((r: Review) =>
    (r.images || []).map((url) => ({ url, place: r.placeVisited, by: r.userName }))
  );

  return (
    <View style={styles.tabSection}>
      <View style={styles.galleryGrid}>
        {images.map((img, i) => (
          <View key={i} style={styles.galleryImageWrap}>
            <Image source={img} style={styles.galleryImage} resizeMode="cover" />
          </View>
        ))}
      </View>

      {guestPhotos.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>From our guests</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.mutedForeground, marginBottom: 12 }}>
            Photos shared by guests of this {car.type.toLowerCase()}.
          </Text>
          <View style={styles.galleryGrid}>
            {guestPhotos.map((p, i) => (
              <Pressable
                key={p.url + i}
                accessibilityRole="button"
                accessibilityLabel={`Photo from ${p.place || 'a guest trip'}, by ${p.by}`}
                style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setViewer(p.url)}
              >
                <View style={[styles.guestImage, { overflow: 'hidden' }]}>
                  <LoadingImage source={{ uri: p.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                </View>
                <View style={styles.guestCaption}>
                  <View style={styles.guestPlaceRow}>
                    <Feather name="map-pin" size={12} color={colors.primaryText} />
                    <Text numberOfLines={2} style={[styles.guestPlaceName, { color: colors.foreground }]}>
                      {p.place || 'Guest trip'}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.guestBy, { color: colors.mutedForeground }]}>by {p.by}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <PhotoViewer uri={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

/** Reviews for a vehicle, shared by the Gallery and Reviews tabs (and refreshed after a new review). */
function useCarReviews(carId: string) {
  return useQuery({
    queryKey: ['carReviews', carId],
    queryFn: () => API.reviews.fetchByCarId(carId) as Promise<Review[]>,
    staleTime: 60 * 1000,
  });
}

function PhotoViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.viewerOverlay} onPress={onClose}>
        {!!uri && (
          <View style={{ width: '100%', height: '80%' }}>
            <LoadingImage source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
          </View>
        )}
        <View style={styles.viewerClose}><Feather name="x" size={24} color="#FFF" /></View>
      </Pressable>
    </Modal>
  );
}

// --- TAB: REVIEWS ---
function ReviewsTab({ car }: { car: Car }) {
  const colors = useColors();
  const { isAuthenticated } = useSawari();
  const { data: dbReviews = [], isLoading: isLoadingReviews } = useCarReviews(car.id);
  // If the customer has an unreviewed completed trip on this vehicle, reviewing from here counts as that trip (and unlocks photos).
  const { data: pendingTrips = [] } = useQuery({
    queryKey: ['pendingReviews'],
    queryFn: () => API.reviews.pending(),
    enabled: isAuthenticated === true,
    staleTime: 60 * 1000,
  });
  const tripForCar = pendingTrips.find(p => p.carId === car.id);
  const [isWriteModalVisible, setIsWriteModalVisible] = React.useState(false);
  const [showAllReviews, setShowAllReviews] = React.useState(false);

  const reviews = [...(car.reviews || []), ...dbReviews].filter(r => r.rating >= MIN_PUBLIC_REVIEW_RATING);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const dist = car.ratingDistribution;
  const total = car.reviewCount ? car.reviewCount + dbReviews.length : reviews.length;

  // Fall back to an average of the visible reviews when this car has no seeded rating
  // (true for every car except the demo-populated Creta) so the badge is never blank.
  const computedAverage = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;
  const displayRating = car.rating ?? computedAverage;

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      alert('Please login to write a review');
      return;
    }
    setIsWriteModalVisible(true);
  };

  // Wait for the reviews before deciding there are none (car.reviews are the built-in ones and are instant).
  if (isLoadingReviews && reviews.length === 0) {
    return (
      <View style={styles.tabSection}>
        <ReviewListSkeleton />
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={[styles.tabSection, { alignItems: 'center', paddingVertical: 40 }]}>
        <Feather name="message-square" size={40} color={colors.muted} />
        <Text style={[styles.emptyReviewText, { color: colors.mutedForeground, marginTop: 16, marginBottom: 24 }]}>
          No reviews yet.{"\n"}Be the first to review this vehicle after completing your trip.
        </Text>
        <Pressable 
          style={[styles.writeReviewBtn, { borderColor: colors.border }]}
          onPress={handleWriteReview}
        >
          <Feather name="edit-2" size={16} color={colors.foreground} />
          <Text style={[styles.writeReviewBtnText, { color: colors.foreground }]}>Write a Review</Text>
        </Pressable>

        <Modal visible={isWriteModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <WriteReviewBottomSheet
                carId={car.id}
                bookingId={tripForCar?.bookingId}
                vehicleName={tripForCar ? car.name : undefined}
                onClose={() => setIsWriteModalVisible(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.tabSection}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Customer Reviews</Text>
        <Pressable onPress={handleWriteReview} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="edit-2" size={14} color={colors.primaryText} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primaryText }}>Write</Text>
        </Pressable>
      </View>
      
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          <Text style={[styles.reviewBigRating, { color: colors.foreground }]}>{displayRating ? displayRating.toFixed(1) : '—'}</Text>
          <Text style={[styles.reviewCountText, { color: colors.mutedForeground }]}>Based on {total} review{total === 1 ? '' : 's'}</Text>
        </View>
        
        {dist && (
          <View style={styles.reviewBars}>
            {[5, 4, 3, 2, 1].map(stars => {
              const val = dist[stars as keyof typeof dist];
              const pct = total > 0 ? (val / total) * 100 : 0;
              return (
                <View key={stars} style={styles.distRow}>
                  <Text style={[styles.distStars, { color: colors.mutedForeground }]}>{stars} ★</Text>
                  <View style={[styles.distBarWrap, { backgroundColor: colors.surfaceSoft }]}>
                    <View style={[styles.distBarFill, { backgroundColor: colors.primary, width: `${pct}%` }]} />
                  </View>
                  <Text style={[styles.distPct, { color: colors.mutedForeground }]}>{Math.round(pct)}%</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.reviewList}>
        {visibleReviews.map((r, i) => (
          <Reveal key={r.id || i} delay={Math.min(i, 5) * 60}>
            <ReviewCard review={r} />
          </Reveal>
        ))}
      </View>

      {!showAllReviews && reviews.length > 3 && (
        <Pressable
          style={[styles.viewAllBtn, { borderColor: colors.border }]}
          onPress={() => setShowAllReviews(true)}
        >
          <Text style={[styles.viewAllBtnText, { color: colors.foreground }]}>View All Reviews ({reviews.length})</Text>
        </Pressable>
      )}

      <Modal visible={isWriteModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <WriteReviewBottomSheet
              carId={car.id}
              bookingId={tripForCar?.bookingId}
              vehicleName={tripForCar ? car.name : undefined}
              onClose={() => setIsWriteModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const colors = useColors();
  const [viewer, setViewer] = useState<string | null>(null);
  const initials = review.userName.substring(0, 2).toUpperCase();

  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
      <View style={styles.reviewCardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.tintLight }]}>
          <Text style={[styles.avatarText, { color: colors.primaryText }]}>{initials}</Text>
        </View>
        <View style={styles.reviewerInfo}>
          <Text style={[styles.reviewerName, { color: colors.foreground }]}>{review.userName}</Text>
          {review.isVerified && (
            <View style={styles.verifiedRow}>
              <Feather name="check-circle" size={12} color={colors.success} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>Verified Booking</Text>
            </View>
          )}
        </View>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={14} color={i < review.rating ? '#F59E0B' : '#9CA3AF'} />
          ))}
        </View>
      </View>
      {!!review.placeVisited && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Feather name="map-pin" size={12} color={colors.primaryText} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.foreground }}>Visited {review.placeVisited}</Text>
        </View>
      )}
      <Text style={[styles.reviewText, { color: colors.foreground }]}>"{review.text}"</Text>
      {!!review.images && review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
          {review.images.map((url, i) => (
            <Pressable key={url + i} onPress={() => setViewer(url)}>
              <View style={{ width: 88, height: 88, borderRadius: 10, overflow: 'hidden' }}>
                <LoadingImage source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <PhotoViewer uri={viewer} onClose={() => setViewer(null)} />
      <View style={styles.reviewCardFooter}>
        <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>{review.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guestCard: { width: '48%', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  guestImage: { width: '100%', aspectRatio: 1 },
  guestCaption: { paddingHorizontal: 10, paddingVertical: 8, minHeight: 56 },
  guestPlaceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  guestPlaceName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 17 },
  guestBy: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 56, right: 20 },
  container: {
    marginTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  tabContent: {
    padding: 16,
  },
  tabSection: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  grid: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },

  detailRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    padding: 12,
  },
  detailLabel: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'right',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    flexShrink: 1,
  },
  // Highlight chips (Good for)
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  highlightChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  // Specs card
  specsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  specBox: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  specIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  specLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
  },
  specValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  specsDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  galleryImageWrap: {
    width: '48%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  emptyReviewText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewAllBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  viewAllBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  writeReviewBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 24,
  },
  reviewHeaderLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBigRating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    letterSpacing: -1,
  },
  reviewCountText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  reviewBars: {
    flex: 2,
    gap: 4,
    paddingLeft: 16,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distStars: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    width: 24,
  },
  distBarWrap: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  distPct: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    width: 28,
    textAlign: 'right',
  },
  reviewList: {
    gap: 16,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  reviewCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  reviewDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
