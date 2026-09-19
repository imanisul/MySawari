import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Car, Review, getCarHighlights } from '@/utils/sawari';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { WriteReviewBottomSheet } from './WriteReviewBottomSheet';
import { Modal } from 'react-native';

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
                { color: isActive ? colors.primary : colors.mutedForeground },
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
  const highlights = getCarHighlights(car);

  return (
    <View style={styles.tabSection}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this {car.type.toLowerCase()}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {car.description || "A well-maintained vehicle perfect for your trips. Reliable, comfortable, and spacious."}
      </Text>

      {highlights.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 32 }]}>Why this {car.type.toLowerCase()}?</Text>
          <View style={styles.featuresGrid}>
            {highlights.map(tag => (
              <View key={tag} style={[styles.featureItem, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
                <Feather name="check" size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 32 }]}>Vehicle Details</Text>
      <View style={[styles.grid, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <DetailRow label="Transmission" value={car.transmission} />
        <DetailRow label="Fuel" value={car.fuel} />
        <DetailRow label="Seats" value={car.seats} />
        {car.mileage && <DetailRow label="Mileage" value={car.mileage} />}
        {car.luggage && <DetailRow label="Luggage" value={car.luggage} />}
        {car.doors && <DetailRow label="Doors" value={car.doors} />}
        {car.modelYear && <DetailRow label="Model Year" value={car.modelYear} />}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 32 }]}>Features & Amenities</Text>
      <View style={styles.featuresGrid}>
        {(car.features || ['Air Conditioning', 'Power Steering', 'Bluetooth']).map(feature => (
          <View key={feature} style={[styles.featureItem, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
            <Feather name="check" size={16} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text>
          </View>
        ))}
      </View>
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
  const images = car.images || [car.image];
  
  return (
    <View style={styles.tabSection}>
      <View style={styles.galleryGrid}>
        {images.map((img, i) => (
          <View key={i} style={styles.galleryImageWrap}>
            <Image source={img} style={styles.galleryImage} resizeMode="cover" />
          </View>
        ))}
      </View>
    </View>
  );
}

// --- TAB: REVIEWS ---
function ReviewsTab({ car }: { car: Car }) {
  const colors = useColors();
  const { isAuthenticated } = useSawari();
  const [dbReviews, setDbReviews] = React.useState<Review[]>([]);
  const [isWriteModalVisible, setIsWriteModalVisible] = React.useState(false);
  const [showAllReviews, setShowAllReviews] = React.useState(false);

  React.useEffect(() => {
    API.reviews.fetchByCarId(car.id).then((res) => {
      if (res && res.length > 0) {
        setDbReviews(res);
      }
    }).catch(() => {});
  }, [car.id]);

  const reviews = [...(car.reviews || []), ...dbReviews];
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
        {visibleReviews.map((r, i) => <ReviewCard key={r.id || i} review={r} />)}
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
            <Feather key={i} name="star" size={14} color={i < review.rating ? "#F59E0B" : colors.muted} />
          ))}
        </View>
      </View>
      <Text style={[styles.reviewText, { color: colors.foreground }]}>"{review.text}"</Text>
      <View style={styles.reviewCardFooter}>
        <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>{review.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: '60%',
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
