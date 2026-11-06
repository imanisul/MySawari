import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image as CachedImage } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { useSawari } from '@/context/SawariContext';
import { formatCurrency } from '@/services/backend/pricingEngine';
import {
  ExclusiveOffer,
  exclusiveOffersQueryOptions,
  recordOfferView,
} from '@/services/api/offers';
import { ExclusiveOfferDetailModal } from '@/components/offers/ExclusiveOfferDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

export function ExclusiveOffersSection() {
  const p = useDetailsPalette();
  const { membership } = useSawari();
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
      badgeLabel = 'LIMITED TIME';
    }

    const imageUrl = item.image?.url || item.image?.uri;

    return (
      <TouchableOpacity
        onPress={() => handleCardPress(item)}
        style={[styles.card, { backgroundColor: p.page, borderColor: p.border }]}
        activeOpacity={0.9}
      >
        {/* Banner Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {imageUrl ? (
            <CachedImage
              source={{ uri: imageUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: '#EDE9FE' }]}>
              <Feather name="gift" size={32} color="#6152D8" />
            </View>
          )}

          {/* Top Left Badge */}
          <View
            style={[
              styles.dealTag,
              { backgroundColor: isMemberDeal ? '#2563EB' : '#6152D8' },
            ]}
          >
            {isMemberDeal && <Ionicons name="star" size={10} color="#FFFFFF" />}
            <Text style={styles.dealTagText}>{badgeLabel}</Text>
          </View>

          {/* Top Right Discount Tag */}
          {discountBadgeText ? (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>{discountBadgeText}</Text>
            </View>
          ) : null}
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
          ) : null}

          {/* Price Block */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.dealPrice}>{promoPriceDisplay}</Text>
              {origPriceDisplay ? (
                <Text style={styles.originalPrice}>{origPriceDisplay}</Text>
              ) : null}
            </View>
            <View style={styles.claimArrowBtn}>
              <Feather name="arrow-right" size={14} color="#6152D8" />
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
        <View style={styles.titleWithIcon}>
          <Feather name="zap" size={18} color="#6152D8" />
          <Text style={[styles.sectionTitle, { color: p.fg }]}>Exclusive Offers</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>MEMBER SPECIALS</Text>
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
        snapToInterval={CARD_WIDTH + 14}
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

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6152D8',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumbnailContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  dealTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  discountTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  claimArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
