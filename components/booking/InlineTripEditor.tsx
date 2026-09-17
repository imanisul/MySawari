import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { PrimaryButton } from '../common/PrimaryButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  const displayM = i % 2 === 0 ? '00' : '30';
  return `${displayH}:${displayM} ${ampm}`;
});

export function InlineTripEditor({ onSave }: { onSave: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const {
    dateRange, pickupTime, returnTime, setDates, setTimes,
    isDeliveryRequested, setIsDeliveryRequested,
    deliveryMode, setDeliveryMode,
    pickup, returnAddress, pricingQuote
  } = useSawari();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDateStr = (dateStr: string) => {
    if (!dateStr || dateStr === 'Select') return null;
    const [day, month] = dateStr.split(' ');
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return null;
    const d = new Date(today.getFullYear(), monthIndex, parseInt(day));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const initialStart = parseDateStr(dateRange.split(' – ')[0]);
  const initialEnd = parseDateStr(dateRange.split(' – ')[1]);

  const [start, setStart] = useState<Date | null>(initialStart && initialStart >= today ? initialStart : null);
  const [end, setEnd] = useState<Date | null>(initialEnd && initialStart && initialEnd > initialStart ? initialEnd : null);
  
  const [tempPickupTime, setTempPickupTime] = useState(pickupTime || '8:00 AM');
  const [tempReturnTime, setTempReturnTime] = useState(returnTime || '8:00 AM');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const pickupScrollRef = useRef<ScrollView>(null);
  const returnScrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    setTimeout(() => {
      pickupScrollRef.current?.scrollTo({ x: 1280, animated: false });
      returnScrollRef.current?.scrollTo({ x: 1280, animated: false });
    }, 100);
  }, []);

  const generateDays = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const d = [];
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) d.push(null);
    while (date.getMonth() === month) {
      d.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return d;
  };

  const days = generateDays(currentMonth.getFullYear(), currentMonth.getMonth());

  const handlePress = (date: Date) => {
    if (date < today) return; 
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (start && end) {
      setStart(date);
      setEnd(null);
      return;
    }
    if (start && !end) {
      if (date < start) setStart(date);
      else setEnd(date);
      return;
    }
    setStart(date);
    setEnd(null);
  };

  const formatDateStr = (date: Date | null) => {
    if (!date) return 'Select';
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const canApply = start && end && start < end;
  
  let isMissingLocation = false;
  if (isDeliveryRequested) {
    if ((deliveryMode === 'delivery' || deliveryMode === 'both') && !pickup?.name) isMissingLocation = true;
    if ((deliveryMode === 'return' || deliveryMode === 'both') && !returnAddress?.name) isMissingLocation = true;
  }

  const applyChanges = () => {
    if (!canApply) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDates(formatDateStr(start), formatDateStr(end));
    setTimes(tempPickupTime, tempReturnTime);
    onSave();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      
      {/* 1. Dates Selection */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Dates</Text>
      
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => {
            const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setCurrentMonth(prev);
          }} style={styles.navBtn}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.monthText, { color: colors.foreground }]}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Pressable onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={styles.navBtn}>
            <Feather name="chevron-right" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        
        <View style={styles.weekDaysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={[styles.weekDayText, { color: colors.mutedForeground }]}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            if (!date) return <View key={index} style={styles.dateCell} />;
            
            const isPast = date < today;
            const isStart = start && date.getTime() === start.getTime();
            const isEnd = end && date.getTime() === end.getTime();
            const selected = isStart || isEnd;
            const inRange = start && end && date > start && date < end;
            
            return (
              <View key={index} style={styles.dateCell}>
                {inRange && <View style={[styles.highlight, { backgroundColor: colors.tintLight }]} />}
                {isStart && end && <View style={[styles.highlightStart, { backgroundColor: colors.tintLight }]} />}
                {isEnd && start && <View style={[styles.highlightEnd, { backgroundColor: colors.tintLight }]} />}
                
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePress(date)}
                  disabled={isPast}
                  style={[styles.dateCircle, selected && { backgroundColor: colors.primary }]}
                >
                  <Text style={[
                    styles.dateText,
                    { color: selected ? colors.primaryForeground : isPast ? colors.mutedForeground : colors.foreground },
                    isPast && { opacity: 0.3 }
                  ]}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Times Selection */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Select Times</Text>
      
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Pickup Time</Text>
          <ScrollView horizontal ref={pickupScrollRef} showsHorizontalScrollIndicator={false} style={[styles.timeScroll, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {ALL_TIMES.map(t => {
              const active = t === tempPickupTime;
              return (
                <Pressable key={t} onPress={() => setTempPickupTime(t)} style={[styles.timeItem, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={{ fontSize: 13, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular', color: active ? colors.primaryForeground : colors.foreground }}>{t}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Drop-off Time</Text>
          <ScrollView horizontal ref={returnScrollRef} showsHorizontalScrollIndicator={false} style={[styles.timeScroll, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {ALL_TIMES.map(t => {
              const active = t === tempReturnTime;
              return (
                <Pressable key={t} onPress={() => setTempReturnTime(t)} style={[styles.timeItem, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={{ fontSize: 13, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular', color: active ? colors.primaryForeground : colors.foreground }}>{t}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 3. Delivery Options */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>Home Delivery</Text>
        <Pressable 
          onPress={() => {
            Haptics.selectionAsync();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsDeliveryRequested(!isDeliveryRequested);
          }}
          style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: isDeliveryRequested ? colors.primary : colors.muted, justifyContent: 'center', paddingHorizontal: 2 }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignSelf: isDeliveryRequested ? 'flex-end' : 'flex-start' }} />
        </Pressable>
      </View>

      {isDeliveryRequested && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {(['delivery', 'return', 'both'] as const).map(m => {
              const label = m === 'delivery' ? 'Deliver to Me' : m === 'return' ? 'Collect From Me' : 'Both';
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    Haptics.selectionAsync();
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setDeliveryMode(m);
                  }}
                  style={{
                    flex: 1, paddingVertical: 10, alignItems: 'center',
                    backgroundColor: deliveryMode === m ? colors.primary : 'transparent',
                    borderRadius: 8, borderWidth: 1, borderColor: deliveryMode === m ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: deliveryMode === m ? 'Inter_600SemiBold' : 'Inter_500Medium', color: deliveryMode === m ? '#000' : colors.mutedForeground }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 12 }}>
            {(deliveryMode === 'delivery' || deliveryMode === 'both') && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/location');
                }}
                style={({ pressed }) => [
                  styles.field, { borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
                ]}
              >
                <Feather name="map-pin" size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedForeground }}>Deliver To</Text>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: pickup?.name ? colors.foreground : colors.mutedForeground }}>
                    {pickup?.name || 'Search address...'}
                  </Text>
                </View>
                {!!pickup?.name && !!pricingQuote?.pickupCharge && (
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primaryText }}>
                    {pricingQuote.pickupDistanceKm} km × ₹20 = ₹{pricingQuote.pickupCharge}
                  </Text>
                )}
              </Pressable>
            )}

            {(deliveryMode === 'return' || deliveryMode === 'both') && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/return-location');
                }}
                style={({ pressed }) => [
                  styles.field, { borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
                ]}
              >
                <Feather name="map-pin" size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedForeground }}>Collect From</Text>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: returnAddress?.name ? colors.foreground : colors.mutedForeground }}>
                    {returnAddress?.name || 'Search address...'}
                  </Text>
                </View>
                {!!returnAddress?.name && !!pricingQuote?.dropCharge && (
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primaryText }}>
                    {pricingQuote.dropDistanceKm} km × ₹20 = ₹{pricingQuote.dropCharge}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* 4. Save Button */}
      <PrimaryButton 
        label="Confirm Trip Details" 
        onPress={applyChanges} 
        disabled={!canApply || isMissingLocation} 
      />
      {!canApply && (
        <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#DC2626', fontFamily: 'Inter_500Medium' }}>
          Please select valid start and end dates.
        </Text>
      )}
      {canApply && isMissingLocation && (
        <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#DC2626', fontFamily: 'Inter_500Medium' }}>
          Please provide addresses for delivery/pickup.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 12,
  },
  subLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  // Calendar styles
  calendarContainer: { marginBottom: 8 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  navBtn: { padding: 4 },
  monthText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  weekDaysRow: { flexDirection: 'row', marginBottom: 12 },
  weekDayText: { flex: 1, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 13 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center', marginVertical: 2, position: 'relative' },
  highlight: { position: 'absolute', top: 4, bottom: 4, left: 0, right: 0 },
  highlightStart: { position: 'absolute', top: 4, bottom: 4, left: '50%', right: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  highlightEnd: { position: 'absolute', top: 4, bottom: 4, left: 0, right: '50%', borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  dateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  // Time styles
  timeScroll: { borderWidth: 1, borderRadius: 8, padding: 4 },
  timeItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 4, borderWidth: 1, borderColor: 'transparent' },
  // Field styles
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
});
