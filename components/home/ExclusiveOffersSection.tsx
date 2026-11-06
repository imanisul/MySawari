import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { formatCurrency } from '@/services/backend/pricingEngine';
import {
  ExclusiveOffer,
  exclusiveOffersQueryOptions,
  recordOfferView,
} from '@/services/api/offers';
import { ExclusiveOfferDetailModal } from '@/components/offers/ExclusiveOfferDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 246; // same width as the Top Picks cards

export function ExclusiveOffersSection() {
  const p = useDetailsPalette();
  const { membership } = useSawari();
  const { data: vehicles = [] } = useVehicles();
  const params = useLocalSearchParams<{ openExclusiveOfferId?: string }>();

  const [selectedOffer, setSelectedOffer] = useState<ExclusiveOffer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: offers = [], refetch } = useQuery(exclusiveOffersQueryOptions);

  // Auto-open modal if deep-linked via push notification
  useEffect(() => {
    if (params?.openExclusiveOfferId && offers.length > 0) {
      const match = offers.find(
        (o) => String(o._id || o.id) === String(params.openExclusiveOfferId)
      );
      if (match) {
        setSelectedOffer(match);
        setModalVisible(true);
      }
    }
  }, [params?.openExclusiveOfferId, offers]);

  if (!offers || offers.length === 0) {
    return null;
  }

  const userTier = (membership?.plan || '').toLowerCase().trim();
  const isMember = Boolean(userTier && userTier !== 'none');

  const handleCardPress = (offer: ExclusiveOffer) => {
    recordOfferView(offer._id || offer.id);
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const renderOfferCard = ({ item }: { item: ExclusiveOffer }) => {
    const pricingUnit = item.pricingUnit === 'per_trip' ? '/trip' : '/day';
    let promoPriceDisplay = '';
    let origPriceDisplay = '';
    let discountBadgeText = '';

    if (item.pricingType === 'promotional_price') {
      promoPriceDisplay = `${formatCurrency(item.promotionalPrice || 1)}${pricingUnit}`;
      if (item.originalPrice) {
        origPriceDisplay = `${formatCurrency(item.originalPrice)}${pricingUnit}`;
        const discountPct = Math.round(
          ((item.originalPrice - (item.promotionalPrice || 1)) / item.originalPrice) * 100
        );
        discountBadgeText = `${discountPct}% OFF`;
      } else {
        discountBadgeText = 'EXCLUSIVE';
      }
    } else if (item.pricingType === 'fixed_discount') {
      promoPriceDisplay = `FLAT ${formatCurrency(item.promotionalPrice || 500)} OFF`;
      discountBadgeText = 'DISCOUNT';
    } else if (item.pricingType === 'percentage_discount') {
      promoPriceDisplay = `${item.discountPercent || 50}% OFF`;
      discountBadgeText = `${item.discountPercent || 50}% OFF`;
    } else {
      promoPriceDisplay = 'Custom Deal';
      discountBadgeText = 'SPECIAL';
    }

    // Membership badge logic
    let isMemberDeal = false;
    let badgeLabel = '';
    if (item.membershipEligibility === 'members_only') {
      isMemberDeal = true;
      badgeLabel = 'CLUB EXCLUSIVE';
    } else if (item.membershipEligibility === 'tier_specific') {
      isMemberDeal = true;
      badgeLabel = `${(item.eligibleTiers || []).join(' & ').toUpperCase()} ONLY`;
    } else if (item.membershipEligibility === 'non_members_only') {
      badgeLabel = 'FIRST RIDE';
    } else {
      badgeLabel = 'SPECIAL OFFER';
    }

    const isOvernight = Boolean(
      item.isOvernight ||
      (item.pickupTime && item.returnTime && item.pickupTime.includes('PM') && item.returnTime.includes('AM'))
    );
    const isAllCars = Boolean(item.allVehicles || item.applicableType === 'all');

    // Resolve car image with priority: item.image -> specific vehicle photo -> first fleet vehicle photo
    const vehicleImage =
      (typeof item.vehicleId === 'object' ? item.vehicleId?.images?.[0] : null) ||
      (typeof item.vehicleId === 'string'
        ? vehicles.find((v: any) => String(v.id || v._id) === item.vehicleId)?.image
        : null) ||
      (Array.isArray(item.vehiclePrices) && item.vehiclePrices.length > 0
        ? vehicles.find((v: any) => String(v.id || v._id) === String(item.vehiclePrices![0].vehicleId))?.image
        : null) ||
      vehicles[0]?.image;

    const imageUrl = item.image?.url || item.image?.uri || vehicleImage;

    return (
      <TouchableOpacity
        onPress={() => handleCardPress(item)}
        style={[styles.card, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}
        activeOpacity={0.9}
      >
        {/* Banner Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {imageUrl ? (
            <Image
              source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: '#EDE9FE' }]}>
              <Feather name="gift" size={32} color="#6152D8" />
            </View>
          )}

          {/* Single clean floating badge on top-left - uncluttered & prominent */}
          <View
            style={[
              styles.dealTag,
              {
                backgroundColor: isOvernight
                  ? '#4338CA'
                  : isAllCars
                  ? '#059669'
                  : isMemberDeal
                  ? '#2563EB'
                  : '#6152D8',
              },
            ]}
          >
            {isOvernight ? (
              <Feather name="moon" size={10} color="#FFFFFF" />
            ) : isAllCars ? (
              <Ionicons name="car-sport" size={10} color="#FFFFFF" />
            ) : isMemberDeal ? (
              <Ionicons name="star" size={10} color="#FFFFFF" />
            ) : (
              <Feather name="tag" size={10} color="#FFFFFF" />
            )}
            <Text style={styles.dealTagText} numberOfLines={1}>
              {isOvernight
                ? '8 PM – 8 AM Deal'
                : isAllCars
                ? 'All Fleet Cars'
                : discountBadgeText || badgeLabel}
            </Text>
          </View>
        </View>

        {/* Content Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: p.fg }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.cardSubtitle, { color: p.sub }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : isOvernight ? (
            <Text style={[styles.cardSubtitle, { color: '#7E22CE' }]} numberOfLines={1}>
              Tonight 8 PM to 8 AM • Auto-applied code
            </Text>
          ) : isAllCars ? (
            <Text style={[styles.cardSubtitle, { color: '#059669' }]} numberOfLines={1}>
              Applicable on all fleet cars
            </Text>
          ) : null}

          {/* Price Block */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.dealPrice} numberOfLines={1}>{promoPriceDisplay}</Text>
              {origPriceDisplay ? (
                <Text style={styles.originalPrice}>{origPriceDisplay}</Text>
              ) : null}
            </View>
            <View style={styles.claimArrowBtn}>
              <Feather name="arrow-right" size={13} color="#6152D8" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: p.fg }]} accessibilityRole="header">Exclusive Offers</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>Special deals</Text>
        </View>
      </View>

      {/* Cards List */}
      <FlatList
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item._id || item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToInterval={CARD_WIDTH + 8}
        decelerationRate="fast"
      />

      {/* Detail Modal */}
      <ExclusiveOfferDetailModal
        offer={selectedOffer}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedOffer(null);
        }}
        onClaimSuccess={() => {
          refetch();
        }}
      />
    </View>
  );
}

const F = { semi: 'PlusJakartaSans_600SemiBold', med: 'PlusJakartaSans_500Medium' };

// Mirrors the Top Picks card (HomeSections `pick*`): 246 wide, 12 radius, 2 inset, 144 photo with 8 radius.
const styles = StyleSheet.create({
  container: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: F.semi, fontSize: 15, lineHeight: 22.5 },
  verifiedBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, minHeight: 20, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  verifiedBadgeText: { fontFamily: F.semi, fontSize: 9, lineHeight: 12, color: '#6152D8' },
  listContainer: { paddingHorizontal: 16, gap: 8 },
  card: { width: CARD_WIDTH, borderRadius: 12, borderWidth: 1, padding: 2, overflow: 'hidden' },
  thumbnailContainer: { width: '100%', height: 144, borderRadius: 8, overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  dealTag: { position: 'absolute', top: 6, left: 6, minHeight: 22, maxWidth: '85%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderRadius: 20, gap: 4 },
  dealTagText: { fontFamily: F.semi, fontSize: 9.5, lineHeight: 13, color: '#FFFFFF' },
  cardInfo: { paddingHorizontal: 6, paddingTop: 8, paddingBottom: 6 },
  cardTitle: { fontFamily: F.semi, fontSize: 13, lineHeight: 19.5 },
  cardSubtitle: { fontFamily: F.med, fontSize: 11, lineHeight: 16.5, marginTop: 1 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 },
  dealPrice: { fontFamily: F.semi, fontSize: 15, lineHeight: 22.5, color: '#059669' },
  originalPrice: { fontFamily: F.med, fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  claimArrowBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
});
