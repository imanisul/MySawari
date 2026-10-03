import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Car, MIN_PUBLIC_REVIEW_RATING, dayNumToLabel, todayDayNum } from '@/utils/sawari';
import { useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';

export function VehicleSummary({ car, isAvailable, availabilityNote }: { car: Car, isAvailable: boolean, availabilityNote?: string }) {
  const colors = useColors();

  // Fetch actual reviews from DB (cached by react-query, same key as ReviewsTab — no extra network call)
  const { data: dbReviews = [] } = useQuery({
    queryKey: ['carReviews', car.id],
    queryFn: () => API.reviews.fetchByCarId(car.id),
    staleTime: 60 * 1000,
  });

  // Combine seeded reviews (hardcoded in baseCars) + real DB reviews
  const allReviews = [...(car.reviews || []), ...dbReviews].filter(r => r.rating >= MIN_PUBLIC_REVIEW_RATING);
  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : null;
  // Use seeded rating only if the car has one (e.g. demo Creta), otherwise use computed average
  const displayRating = car.rating ?? averageRating;
  const displayCount = car.reviewCount ? car.reviewCount + dbReviews.length : totalReviews;

  // Parse the availability note to decide display
  const isOnTrip = !isAvailable && availabilityNote && !availabilityNote.includes('SERVICE');
  const isInService = !isAvailable && availabilityNote && availabilityNote.includes('SERVICE');

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>{car.name}</Text>
      </View>
      
      <View style={styles.subRow}>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{car.category}</Text>
        
        {!!car.color && (
          <>
            <View style={styles.dot} />
            <Text style={[styles.category, { color: colors.mutedForeground }]}>{car.color}</Text>
          </>
        )}
        
        {/* Only show rating if we actually have reviews */}
        {displayRating !== null && displayCount > 0 && (
          <>
            <View style={styles.dot} />
            <View style={styles.ratingRow}>
              <Feather name="star" size={15} color="#F59E0B" style={{ marginTop: -1 }} />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>{displayRating.toFixed(1)}</Text>
              <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({displayCount} {displayCount === 1 ? 'review' : 'reviews'})</Text>
            </View>
          </>
        )}
      </View>

      {/* Availability status */}
      {isAvailable && (
        <View style={[styles.availBanner, { backgroundColor: colors.tintLight, borderColor: colors.primary + '30' }]}>
          <Feather name="check-circle" size={15} color={colors.primaryText} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primaryText, flex: 1 }}>
            {(() => {
              const a = car.availability;
              if (!a) return 'Available';
              if (a.freeUntil) {
                if (a.startDate === a.freeUntil || (a.startDate === 'Today' && a.freeUntil === dayNumToLabel(todayDayNum()))) {
                  return a.startDate === 'Today' ? 'Avail only for today' : `Avail only for ${a.startDate}`;
                }
                return `Avail · ${a.startDate} – ${a.freeUntil}`;
              }
              return `Avail · ${a.startDate || 'Today'} – Onwards`;
            })()}
          </Text>
        </View>
      )}

      {isOnTrip && (
        <View style={[styles.availBanner, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '30' }]}>
          <Feather name="navigation" size={15} color={colors.destructive} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.destructive, flex: 1 }}>
            Currently on a trip
          </Text>
        </View>
      )}

      {isInService && (
        <View style={[styles.availBanner, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B30' }]}>
          <Feather name="tool" size={15} color="#B45309" />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#B45309', flex: 1 }}>
            Under maintenance
          </Text>
        </View>
      )}

      {/* Next availability for unavailable vehicles */}
      {!isAvailable && !!car.availability?.nextAvailableFrom && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 }}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.mutedForeground }}>
            Next available from {car.availability.nextAvailableFrom}
          </Text>
        </View>
      )}

      {isAvailable && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 }}>
          <Feather name="map-pin" size={14} color={colors.primaryText} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.mutedForeground }}>
            MySawari, Kahilipara, Guwahati
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  category: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  reviewCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  availBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
