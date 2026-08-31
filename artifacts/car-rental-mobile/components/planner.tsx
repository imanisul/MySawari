import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function SheetFrame({
  children,
  centered = false,
  height,
}: {
  children: React.ReactNode;
  centered?: boolean;
  height?: number;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheetScreen, { backgroundColor: colors.overlay }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      <View
        style={[
          styles.sheet,
          centered && styles.centeredSheet,
          { backgroundColor: colors.card, paddingBottom: insets.bottom + 18 },
          height ? { minHeight: height } : undefined,
        ]}
      >
        {!centered && <View style={[styles.grabber, { backgroundColor: colors.border }]} />}
        {children}
      </View>
    </View>
  );
}

export function SheetHeader({
  title,
  subtitle,
  onClose = () => router.back(),
}: {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sheetHeader}>
      <View style={styles.sheetHeaderCopy}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle && <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        testID="close-sheet"
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.secondary }]}
      >
        <Feather name="x" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-right',
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{label}</Text>
      {icon && <Feather name={icon} size={18} color={colors.primaryForeground} />}
    </Pressable>
  );
}

export function TripField({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tripField, pressed && styles.pressed]}
    >
      <Feather name={icon} size={23} color={colors.foreground} />
      <View style={styles.tripFieldCopy}>
        <Text style={[styles.tripFieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.tripFieldValue, { color: colors.foreground }]}>{value}</Text>
      </View>
      <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function PlannerSheet() {
  const colors = useColors();
  const router = useRouter();
  const { pickup, dateRange, pickupTime, returnTime, mode } = useSawari();
  return (
    <SheetFrame height={660}>
      <SheetHeader title="Where do you want to go?" subtitle="Find the right car for your journey." />
      <View style={styles.fields}>
        <TripField icon="map-pin" label="Pickup location" value={pickup} onPress={() => router.push('/location')} />
        <TripField icon="calendar" label="Dates" value={dateRange} onPress={() => router.push('/dates')} />
        <TripField icon="clock" label="Time" value={`${pickupTime} – ${returnTime}`} onPress={() => router.push('/times')} />
        <TripField icon="disc" label="Driving Option" value={mode} onPress={() => router.push('/driver-option')} />
      </View>
      <Pressable
        accessibilityRole="button"
        testID="driver-charges"
        onPress={() => router.push('/driver-charges')}
        style={[styles.driverHint, { backgroundColor: colors.secondary }]}
      >
        <View style={[styles.hintDot, { backgroundColor: colors.blue }]} />
        <Text style={[styles.driverHintText, { color: colors.foreground }]}>
          {mode === 'Self Drive' ? 'No driver charges' : 'Driver charges apply'}
        </Text>
      </Pressable>
      <PrimaryButton label="Search cars" onPress={() => router.replace('/search')} />
    </SheetFrame>
  );
}

export function LocationSheet() {
  const colors = useColors();
  const { pickup, setPickup } = useSawari();
  const locations = ['Bikaner', 'Jaipur', 'Delhi', 'Jodhpur'];
  return (
    <SheetFrame height={700}>
      <SheetHeader title="Pickup location" />
      <View style={[styles.searchInput, { backgroundColor: colors.secondary }]}>
        <Feather name="search" size={21} color={colors.mutedForeground} />
        <TextInput
          placeholder="Search city or location"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchText, { color: colors.foreground }]}
          testID="location-search"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setPickup('Bikaner')}
        style={({ pressed }) => [styles.currentLocation, pressed && styles.pressed]}
      >
        <View style={[styles.currentLocationIcon, { backgroundColor: colors.lightBlue }]}>
          <Feather name="crosshair" size={22} color={colors.foreground} />
        </View>
        <Text style={[styles.currentLocationText, { color: colors.foreground }]}>Use current location</Text>
      </Pressable>
      <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>Recent</Text>
      {locations.slice(0, 2).map((location) => (
        <LocationRow key={location} location={location} selected={pickup === location} onPress={() => setPickup(location)} />
      ))}
      <Text style={[styles.listLabel, { color: colors.mutedForeground, marginTop: 23 }]}>Popular locations</Text>
      {locations.slice(0, 4).map((location) => (
        <LocationRow key={`popular-${location}`} location={location} selected={pickup === location} onPress={() => setPickup(location)} />
      ))}
    </SheetFrame>
  );
}

function LocationRow({ location, selected, onPress }: { location: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onPress();
        router.back();
      }}
      style={({ pressed }) => [styles.locationRow, { borderBottomColor: colors.border }, pressed && styles.pressed]}
    >
      <Feather name="map-pin" size={19} color={selected ? colors.foreground : colors.mutedForeground} />
      <Text style={[styles.locationText, { color: colors.foreground }]}>{location}</Text>
      {selected && <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />}
    </Pressable>
  );
}

export function DatesSheet() {
  const colors = useColors();
  const { setDates } = useSawari();
  const dates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  return (
    <SheetFrame height={700}>
      <SheetHeader title="Where do you want to go?" subtitle="Find the right car for your journey." />
      <View style={styles.weekHeader}>
        {['S', 'M', 'T', 'W', 'TH', 'F', 'S'].map((day) => (
          <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>{day}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {Array.from({ length: 6 }).map((_, index) => <View key={`empty-${index}`} style={styles.dateCell} />)}
        {dates.map((date) => {
          const selected = date === 17 || date === 20;
          const inRange = date > 17 && date < 20;
          return (
            <View key={date} style={[styles.dateCell, inRange && { backgroundColor: colors.lightBlue }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={[styles.dateCircle, selected && { backgroundColor: colors.navy }]}
              >
                <Text style={[styles.dateText, { color: selected ? colors.warmWhite : colors.foreground }]}>{date}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={[styles.dateSummary, { borderTopColor: colors.border }]}>
        <Text style={[styles.dateDuration, { color: colors.mutedForeground }]}>3 days</Text>
        <Text style={[styles.dateRange, { color: colors.foreground }]}>17 Aug – 20 Aug</Text>
      </View>
      <PrimaryButton label="Apply Dates" icon={undefined} onPress={() => { setDates('17 Aug – 20 Aug', '3 days'); router.back(); }} />
    </SheetFrame>
  );
}

export function TimesSheet() {
  const colors = useColors();
  const { setTimes } = useSawari();
  const options = ['06:00 AM', '08:00 AM', '09:00 AM', '10:00 AM'];
  return (
    <SheetFrame height={430}>
      <SheetHeader title="Select pickup & return time" />
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Pickup</Text>
      <TimePills options={options} selected="10:00 AM" />
      <Text style={[styles.timeLabel, { color: colors.mutedForeground, marginTop: 23 }]}>Return</Text>
      <TimePills options={options} selected="10:00 AM" />
      <PrimaryButton label="Apply Time" icon={undefined} onPress={() => { setTimes('10:00 AM', '10:00 AM'); router.back(); }} />
    </SheetFrame>
  );
}

function TimePills({ options, selected }: { options: string[]; selected: string }) {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePills}>
      {options.map((option) => (
        <Pressable key={option} style={[styles.timePill, { borderColor: option === selected ? colors.navy : colors.border, backgroundColor: option === selected ? colors.navy : colors.card }]}>
          <Text style={[styles.timeText, { color: option === selected ? colors.warmWhite : colors.foreground }]}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function DriverOptionSheet() {
  const colors = useColors();
  const { mode, setMode } = useSawari();
  return (
    <SheetFrame height={530}>
      <SheetHeader title="Driving option" subtitle="Choose how you want to travel" />
      <OptionCard
        title="Self Drive"
        description="You drive the vehicle yourself."
        price="No driver charges"
        icon="disc"
        selected={mode === 'Self Drive'}
        onPress={() => setMode('Self Drive')}
      />
      <OptionCard
        title="With Driver"
        description="Travel with a professional driver."
        price="From ₹800/day"
        icon="user"
        selected={mode === 'With Driver'}
        onPress={() => setMode('With Driver')}
      />
      <PrimaryButton label="Confirm Option" icon={undefined} onPress={() => router.back()} />
    </SheetFrame>
  );
}

function OptionCard({
  title,
  description,
  price,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.optionSurface : colors.card },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: selected ? colors.card : colors.secondary }]}>
        <Feather name={icon} size={21} color={colors.foreground} />
      </View>
      <View style={styles.optionCopy}>
        <View style={styles.optionTitleRow}>
          <Text style={[styles.optionTitle, { color: colors.foreground }]}>{title}</Text>
          {title === 'With Driver' && <Feather name="info" size={15} color={colors.mutedForeground} />}
        </View>
        <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{description}</Text>
        <Text style={[styles.optionPrice, { color: colors.foreground }]}>{price}</Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.navy : colors.border, backgroundColor: selected ? colors.navy : colors.card }]}>
        {selected && <Feather name="check" size={13} color={colors.primary} />}
      </View>
    </Pressable>
  );
}

export function DriverChargesSheet() {
  const colors = useColors();
  return (
    <SheetFrame centered height={185}>
      <View style={styles.chargesHeader}>
        <Text style={[styles.chargesTitle, { color: colors.foreground }]}>Driver charges</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close">
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={[styles.chargesCopy, { color: colors.mutedForeground }]}>
        Driver charges are calculated based on the rental duration and applicable service conditions.
      </Text>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  sheetScreen: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 30, paddingTop: 14 },
  centeredSheet: { alignSelf: 'center', borderRadius: 28, justifyContent: 'center', marginHorizontal: 8, paddingTop: 28, width: '96%' },
  grabber: { alignSelf: 'center', borderRadius: 99, height: 6, marginBottom: 20, width: 53 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  sheetHeaderCopy: { flex: 1, paddingRight: 18 },
  sheetTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 28, letterSpacing: -0.8, lineHeight: 33 },
  sheetSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 4 },
  closeButton: { alignItems: 'center', borderRadius: 99, height: 44, justifyContent: 'center', width: 44 },
  fields: { marginTop: 28 },
  tripField: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', minHeight: 96, paddingVertical: 13 },
  tripFieldCopy: { flex: 1, marginLeft: 24 },
  tripFieldLabel: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  tripFieldValue: { fontFamily: 'Inter_600SemiBold', fontSize: 23, marginTop: 3 },
  driverHint: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', marginTop: 16, minHeight: 54, paddingHorizontal: 20 },
  hintDot: { borderRadius: 99, height: 10, marginRight: 10, width: 10 },
  driverHintText: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  primaryButton: { alignItems: 'center', borderRadius: 17, flexDirection: 'row', height: 70, justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { fontFamily: 'Inter_500Medium', fontSize: 20, marginRight: 12 },
  searchInput: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', height: 60, marginTop: 22, paddingHorizontal: 20 },
  searchText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 17, marginLeft: 14 },
  currentLocation: { alignItems: 'center', flexDirection: 'row', marginTop: 27, paddingVertical: 16 },
  currentLocationIcon: { alignItems: 'center', borderRadius: 99, height: 49, justifyContent: 'center', width: 49 },
  currentLocationText: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginLeft: 17 },
  listLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 24 },
  locationRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', minHeight: 60 },
  locationText: { fontFamily: 'Inter_400Regular', fontSize: 17, marginLeft: 19 },
  locationDot: { borderRadius: 99, height: 10, marginLeft: 'auto', width: 10 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 27 },
  weekDay: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', width: 33 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18 },
  dateCell: { alignItems: 'center', height: 59, justifyContent: 'center', width: '14.2857%' },
  dateCircle: { alignItems: 'center', borderRadius: 99, height: 43, justifyContent: 'center', width: 43 },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  dateSummary: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 22 },
  dateDuration: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  dateRange: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  timeLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 22 },
  timePills: { gap: 12, paddingTop: 11 },
  timePill: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 56, justifyContent: 'center', minWidth: 118, paddingHorizontal: 18 },
  timeText: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  optionCard: { alignItems: 'center', borderRadius: 19, borderWidth: 1.5, flexDirection: 'row', marginTop: 16, minHeight: 124, padding: 20 },
  optionIcon: { alignItems: 'center', borderRadius: 15, height: 55, justifyContent: 'center', width: 55 },
  optionCopy: { flex: 1, marginLeft: 20 },
  optionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  optionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  optionDescription: { fontFamily: 'Inter_400Regular', fontSize: 15, marginTop: 7 },
  optionPrice: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 7 },
  radio: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 30, justifyContent: 'center', width: 30 },
  chargesHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  chargesTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  chargesCopy: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 27, marginTop: 10 },
  pressed: { opacity: 0.7 },
});