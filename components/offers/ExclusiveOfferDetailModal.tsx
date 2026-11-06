import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image as CachedImage } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { LoginBottomSheet } from '@/components/auth/LoginBottomSheet';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { ExclusiveOffer, claimExclusiveOffer, recordOfferView } from '@/services/api/offers';

interface ExclusiveOfferDetailModalProps {
  offer: ExclusiveOffer | null;
  visible: boolean;
  onClose: () => void;
  onClaimSuccess?: (claim: any) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ExclusiveOfferDetailModal({
  offer,
  visible,
  onClose,
  onClaimSuccess,
}: ExclusiveOfferDetailModalProps) {
  const router = useRouter();
  const p = useDetailsPalette();
  const { isAuthenticated, membership, applyCoupon, selectCar } = useSawari();
  const { data: vehicles = [] } = useVehicles();

  const [claiming, setClaiming] = useState(false);
  const [claimData, setClaimData] = useState<any>(offer?.activeClaim || null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (offer) {
      setClaimData(offer.activeClaim || null);
      setClaimError(null);
      recordOfferView(offer._id || offer.id);

      if (offer.vehiclePrices && offer.vehiclePrices.length > 0) {
        setSelectedVehicleId(offer.vehiclePrices[0].vehicleId);
      } else if (offer.vehicleId) {
        setSelectedVehicleId(typeof offer.vehicleId === 'object' ? offer.vehicleId._id : offer.vehicleId);
      } else if (offer.applicableVehicleIds && offer.applicableVehicleIds.length > 0) {
        setSelectedVehicleId(offer.applicableVehicleIds[0]);
      }
    }
  }, [offer]);

  if (!offer) return null;

  // Check membership tier eligibility
  const userTier = (membership?.plan || '').toLowerCase().trim();
  const isMember = Boolean(userTier && userTier !== 'none');

  let isTierEligible = true;
  let eligibilityNote = '';

  if (offer.membershipEligibility === 'members_only') {
    isTierEligible = isMember;
    eligibilityNote = 'Exclusive to active MySawari Club members';
  } else if (offer.membershipEligibility === 'tier_specific') {
    const requiredTiers = (offer.eligibleTiers || []).map((t) => t.toLowerCase().trim());
    isTierEligible = isMember && requiredTiers.includes(userTier);
    eligibilityNote = `Exclusive to ${requiredTiers.map((t) => t.toUpperCase()).join(' & ')} members`;
  } else if (offer.membershipEligibility === 'non_members_only') {
    isTierEligible = !isMember;
    eligibilityNote = 'Welcome special for new / non-member customers';
  }

  // Price formatting
  const pricingType = offer.pricingType || 'promotional_price';
  const pricingUnit = offer.pricingUnit === 'per_trip' ? '/trip' : '/day';

  let promoPriceDisplay = '';
  if (pricingType === 'promotional_price') {
    promoPriceDisplay = `${formatCurrency(offer.promotionalPrice || 1)}${pricingUnit}`;
  } else if (pricingType === 'fixed_discount') {
    promoPriceDisplay = `FLAT ${formatCurrency(offer.promotionalPrice || 500)} OFF`;
  } else if (pricingType === 'percentage_discount') {
    promoPriceDisplay = `${offer.discountPercent || 50}% OFF`;
  } else {
    promoPriceDisplay = 'Special Deal';
  }

  // Format expiry date
  let formattedExpiry = '';
  if (offer.expiryDate) {
    const d = new Date(offer.expiryDate);
    formattedExpiry = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Available vehicles list
  const vehiclesList = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    if (offer.vehiclePrices && offer.vehiclePrices.length > 0) {
      return offer.vehiclePrices.map((vp) => {
        const found = vehicles.find(
          (v: any) => String(v.id || v._id) === String(vp.vehicleId)
        );
        return {
          vehicleId: vp.vehicleId,
          vehicleName: vp.vehicleName || found?.name || found?.vehicleName || 'Vehicle',
          image: found?.image,
          dealPrice: vp.dealPrice,
          originalPrice: vp.originalPrice || found?.perDay || found?.pricePerDay,
          carObj: found,
        };
      });
    }

    if (offer.applicableVehicleIds && offer.applicableVehicleIds.length > 0) {
      return offer.applicableVehicleIds.map((vId) => {
        const found = vehicles.find(
          (v: any) => String(v.id || v._id) === String(vId)
        );
        return {
          vehicleId: vId,
          vehicleName: found?.name || found?.vehicleName || 'Vehicle',
          image: found?.image,
          dealPrice: offer.promotionalPrice || 1,
          originalPrice: found?.perDay || found?.pricePerDay,
          carObj: found,
        };
      }).filter((item) => item.carObj);
    }

    if (offer.vehicleId) {
      const vId = typeof offer.vehicleId === 'object' ? offer.vehicleId._id : offer.vehicleId;
      const found = vehicles.find(
        (v: any) => String(v.id || v._id) === String(vId)
      );
      if (found) {
        return [{
          vehicleId: String(vId),
          vehicleName: found.name || found.vehicleName,
          image: found.image,
          dealPrice: offer.promotionalPrice || 1,
          originalPrice: found.perDay || found.pricePerDay,
          carObj: found,
        }];
      }
    }

    return [];
  }, [offer, vehicles]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    if (!isTierEligible) {
      onClose();
      router.push('/membership');
      return;
    }

    setClaiming(true);
    setClaimError(null);
    try {
      const res = await claimExclusiveOffer(offer._id || offer.id);
      if (res.success && res.claim) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setClaimData(res.claim);
        onClaimSuccess?.(res.claim);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setClaimError(res.message || 'Could not claim this offer. It may be out of stock.');
      }
    } catch (err: any) {
      setClaimError(err.message || 'Error claiming offer');
    } finally {
      setClaiming(false);
    }
  };

  const handleProceedToBooking = () => {
    const couponToApply = claimData?.couponCode || claimData?.claimToken || offer.code;
    if (couponToApply) {
      applyCoupon(couponToApply);
    }

    if (selectedVehicleId && vehicles) {
      const match = vehicles.find(
        (v: any) => String(v.id || v._id) === String(selectedVehicleId)
      );
      if (match) {
        selectCar(match);
      }
    }

    onClose();
    router.push({
      pathname: '/dates',
      params: { fromDestination: 'true', forSpecificCar: 'true' },
    });
  };

  const imageUrl = offer.image?.url || offer.image?.uri;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: p.page }]}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.exclusiveBadge}>
                <Feather name="award" size={13} color="#FFFFFF" />
                <Text style={styles.exclusiveBadgeText}>EXCLUSIVE OFFER</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: p.soft }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x" size={20} color={p.fg} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Main Banner / Image */}
            {imageUrl ? (
              <View style={styles.imageContainer}>
                <CachedImage
                  source={{ uri: imageUrl }}
                  style={styles.bannerImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.dealOverlayBadge}>
                  <Text style={styles.dealOverlayText}>{promoPriceDisplay}</Text>
                </View>
              </View>
            ) : null}

            {/* Title & Subtitle */}
            <Text style={[styles.title, { color: p.fg }]}>{offer.title}</Text>
            {offer.subtitle ? (
              <Text style={[styles.subtitle, { color: p.sub }]}>{offer.subtitle}</Text>
            ) : null}

            {/* Membership badge note */}
            {offer.membershipEligibility !== 'all' ? (
              <View style={[styles.eligibilityStrip, { backgroundColor: isTierEligible ? '#EFF6FF' : '#FEF2F2' }]}>
                <Ionicons
                  name={isTierEligible ? 'star' : 'lock-closed'}
                  size={16}
                  color={isTierEligible ? '#2563EB' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.eligibilityText,
                    { color: isTierEligible ? '#1D4ED8' : '#B91C1C' },
                  ]}
                >
                  {eligibilityNote}
                </Text>
              </View>
            ) : null}

            {/* Transparent Pricing Notice */}
            <View style={[styles.pricingTransparencyBox, { backgroundColor: p.soft }]}>
              <View style={styles.pricingHeaderRow}>
                <Feather name="info" size={15} color="#6152D8" />
                <Text style={[styles.pricingNoticeTitle, { color: p.fg }]}>Pricing Transparency</Text>
              </View>
              <Text style={[styles.pricingNoticeBody, { color: p.sub }]}>
                The promotional rate ({promoPriceDisplay}) applies strictly to the base vehicle rental. Security deposit, fuel, GST, and doorstep delivery fees are calculated separately at checkout.
              </Text>
              {!offer.allowMembershipStacking ? (
                <Text style={styles.noStackNote}>
                  • Cannot be combined with standard club membership percentage discounts.
                </Text>
              ) : null}
            </View>

            {/* Multi-vehicle picker if applicable */}
            {vehiclesList.length > 0 ? (
              <View style={styles.vehicleSection}>
                <Text style={[styles.sectionHeading, { color: p.fg }]}>Select Vehicle</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
                  {vehiclesList.map((item) => {
                    const isSelected = String(item.vehicleId) === String(selectedVehicleId);
                    return (
                      <TouchableOpacity
                        key={item.vehicleId}
                        onPress={() => setSelectedVehicleId(item.vehicleId)}
                        style={[
                          styles.vehicleCard,
                          { backgroundColor: p.soft, borderColor: isSelected ? '#6152D8' : p.border },
                          isSelected && styles.vehicleCardSelected,
                        ]}
                      >
                        {item.image ? (
                          <CachedImage
                            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                            style={styles.vehicleThumb}
                            contentFit="contain"
                          />
                        ) : (
                          <View style={styles.vehicleThumbPlaceholder}>
                            <Feather name="truck" size={24} color="#6152D8" />
                          </View>
                        )}
                        <Text style={[styles.vehicleName, { color: p.fg }]} numberOfLines={1}>
                          {item.vehicleName}
                        </Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.dealPriceText}>
                            {formatCurrency(item.dealPrice)}{pricingUnit}
                          </Text>
                          {item.originalPrice ? (
                            <Text style={styles.origPriceText}>
                              {formatCurrency(item.originalPrice)}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Description & Rules */}
            {offer.description ? (
              <View style={styles.descSection}>
                <Text style={[styles.sectionHeading, { color: p.fg }]}>Offer Details & Terms</Text>
                <Text style={[styles.descText, { color: p.sub }]}>{offer.description}</Text>
              </View>
            ) : null}

            {/* Validity */}
            {formattedExpiry ? (
              <View style={styles.expiryRow}>
                <Feather name="clock" size={14} color={p.sub} />
                <Text style={[styles.expiryText, { color: p.sub }]}>
                  Valid till {formattedExpiry}
                </Text>
              </View>
            ) : null}

            {claimError ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={15} color="#DC2626" />
                <Text style={styles.errorText}>{claimError}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={[styles.footerArea, { borderTopColor: p.border }]}>
            {claimData ? (
              <View style={styles.claimedFooter}>
                <View style={styles.claimedBadgeRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.claimedBadgeText}>
                    Offer Claimed! (Code: {claimData.couponCode || claimData.claimToken})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleProceedToBooking}
                  style={styles.primaryBtn}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>Book Now with Offer</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : !isTierEligible ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push('/membership');
                }}
                style={[styles.primaryBtn, { backgroundColor: '#2563EB' }]}
                activeOpacity={0.88}
              >
                <Ionicons name="star" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Upgrade Membership to Unlock</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleClaim}
                style={styles.primaryBtn}
                disabled={claiming}
                activeOpacity={0.88}
              >
                {claiming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="gift" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Claim Exclusive Offer</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <LoginBottomSheet
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => setShowLogin(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6152D8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  exclusiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dealOverlayBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dealOverlayText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  eligibilityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  eligibilityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pricingTransparencyBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  pricingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pricingNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  pricingNoticeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  noStackNote: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 6,
  },
  vehicleSection: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  vehicleRow: {
    gap: 12,
  },
  vehicleCard: {
    width: 140,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  vehicleCardSelected: {
    backgroundColor: '#F5F3FF',
  },
  vehicleThumb: {
    width: 100,
    height: 60,
    marginBottom: 6,
  },
  vehicleThumbPlaceholder: {
    width: 100,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  origPriceText: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  descSection: {
    marginBottom: 14,
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  footerArea: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  claimedFooter: {
    gap: 10,
  },
  claimedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  claimedBadgeText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 12,
  },
  primaryBtn: {
    height: 50,
    backgroundColor: '#6152D8',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
