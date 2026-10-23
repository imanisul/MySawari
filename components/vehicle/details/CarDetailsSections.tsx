import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, LayoutAnimation, Animated } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { LoadingImage } from '@/components/common/LoadingImage';
import { API } from '@/services/backend/api';
import { BOOKING_ADVANCE_AMOUNT, formatCurrency } from '@/services/backend/pricingEngine';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { Car, Review, MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';
import { useDetailsPalette, DetailsPalette } from './detailsPalette';

// Every section of the car details page below the photos, laid out as in the Figma "Car Detail Page" frame.

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=MySawari+-+Self+Drive+Car+Rental+Guwahati,+Kahilipara,+Assam';

// Flat rule, confirmed with operations: every 1-day booking includes 300 km and bills extras at ₹75/km;
// 2+ day bookings are unlimited (see screens/Support/PolicyScreen.tsx). The Figma frame's "₹5/km" is a
// design placeholder and must not be shown as if it were the charged rate.
const INCLUDED_KM_ONE_DAY = 300;
const EXTRA_KM_RATE = 75;

// ── Shared bits ───────────────────────────────────────────────────────────────

function SectionTitle({ children, action, onAction, actionIcon = 'chevron-right' }: {
  children: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const p = useDetailsPalette();
  return (
    <View style={styles.titleRow}>
      <Text style={[styles.sectionTitle, { color: p.fg }]}>{children}</Text>
      {!!action && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.linkRow}>
          <Text style={[styles.link, { color: p.muted }]}>{action}</Text>
          <Feather name={actionIcon} size={13} color={p.muted} />
        </Pressable>
      )}
    </View>
  );
}

function Bullets({ items, p }: { items: string[]; p: DetailsPalette }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((t) => (
        <View key={t} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: p.muted }]} />
          <Text style={[styles.bulletText, { color: p.sub }]}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** Two-step vertical timeline (cancellation policy, payment schedule). */
/** Blend two #RRGGBB colours (t = 0 → a, 1 → b). */
function mix(a: string, b: string, t: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
}

const TL_GAP = 14;

/**
 * Two-step vertical timeline (cancellation policy, payment schedule): each dot is centred on its row,
 * and a 1pt line fades from the first dot's colour to the idle grey.
 */
function Timeline({ steps, activeColor, p, gap = TL_GAP, railWidth = 22.5, descStyle }: {
  steps: { title: React.ReactNode; desc: string; badge?: { text: string; color: string } }[];
  activeColor: string;
  p: DetailsPalette;
  /** Space between the rows (the line runs through it). */
  gap?: number;
  /** Width of the dot column, i.e. where the text starts. */
  railWidth?: number;
  descStyle?: object;
}) {
  const last = steps.length - 1;
  // Colour of the line at each joint: row bottom → gap → next row top.
  const at = (k: number) => mix(activeColor, p.dotIdle, k / (last * 3 || 1));
  return (
    <View>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <View style={styles.tlRow}>
            <View style={[styles.tlRail, { width: railWidth }]}>
              {i > 0 ? <LinearGradient colors={[at(i * 3 - 1), at(i * 3)]} style={styles.tlLine} /> : <View style={{ flex: 1 }} />}
              <View style={[styles.tlDot, { backgroundColor: i === 0 ? activeColor : p.dotIdle }]} />
              {i < last ? <LinearGradient colors={[at(i * 3), at(i * 3 + 1)]} style={styles.tlLine} /> : <View style={{ flex: 1 }} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.tlHead}>
                <View style={{ flex: 1 }}>{s.title}</View>
                {!!s.badge && (
                  <View style={[styles.badge, { backgroundColor: s.badge.color }]}>
                    <Text style={styles.badgeText}>{s.badge.text}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tlDesc, descStyle, { color: p.muted }]}>{s.desc}</Text>
            </View>
          </View>
          {i < last && (
            <View style={[styles.tlRail, { width: railWidth, height: gap }]}>
              <LinearGradient colors={[at(i * 3 + 1), at(i * 3 + 2)]} style={styles.tlLine} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Mileage limits + "Add 1 day" ──────────────────────────────────────────────

function CalendarIcon({ day, p }: { day: string; p: DetailsPalette }) {
  return (
    <View style={[styles.calCircle, { backgroundColor: p.iconBg }]}>
      <View style={styles.calBody}>
        <View style={styles.calTop}>
          {[0, 1, 2].map((r) => <View key={r} style={styles.calRing} />)}
        </View>
        <Text style={styles.calDay}>{day}</Text>
      </View>
    </View>
  );
}

/**
 * `tripDays` is the chosen trip's length; the row that applies to it is marked "Your booking".
 * Without dates both rows stay neutral, since neither one is the customer's rule yet.
 */
export function MileageLimits({ onAddDay, tripDays }: { onAddDay?: () => void; tripDays?: number }) {
  const p = useDetailsPalette();
  const hasTrip = typeof tripDays === 'number' && tripDays >= 1;
  const oneDayOn = hasTrip && tripDays === 1;
  const multiDayOn = hasTrip && (tripDays as number) >= 2;
  return (
    <View style={styles.block}>
      <SectionTitle>Mileage limits</SectionTitle>
      <View style={[styles.card, styles.mileCard, { backgroundColor: p.soft, borderColor: p.strongBorder }]}>
        <View style={styles.mileRow}>
          <CalendarIcon day="1" p={p} />
          <View style={{ flex: 1 }}>
            <View style={styles.mileHead}>
              <Text style={[styles.mileTitle, { color: p.fg }]}>1-Day Booking</Text>
              {oneDayOn && <View style={[styles.mileTag, { backgroundColor: p.navy }]}><Text style={styles.mileTagText}>Your booking</Text></View>}
            </View>
            <Text style={[styles.mileSub, { color: p.muted }]}>Incl. {INCLUDED_KM_ONE_DAY} km  •  Extra km at ₹{EXTRA_KM_RATE}/km.</Text>
          </View>
        </View>
        <View style={styles.mileRow}>
          <CalendarIcon day="3" p={p} />
          <View style={{ flex: 1 }}>
            <View style={styles.mileHead}>
              <Text style={[styles.mileTitle, { color: p.fg }]}>2+ Day Booking</Text>
              {multiDayOn && <View style={[styles.mileTag, { backgroundColor: p.navy }]}><Text style={styles.mileTagText}>Your booking</Text></View>}
            </View>
            <Text style={[styles.mileSub, { color: p.muted }]}>Unlimited kilometres</Text>
          </View>
        </View>
      </View>

      {!!onAddDay && (
        <View style={[styles.addDayCard, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.addDayTitle, { color: p.fg }]}>Need more time on the road?</Text>
            <Text style={[styles.addDaySub, { color: p.muted }]}>Add 1 day to unlock unlimited kilometres.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add 1 day to this trip"
            onPress={onAddDay}
            style={({ pressed }) => [styles.addDayBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}
          >
            <Feather name="plus" size={16} color={p.onNavy} />
            <Text style={[styles.addDayBtnText, { color: p.onNavy }]}>Add 1 day</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Section pills (Overview · Specification · Benefits · Features) ────────────

export function SectionPills<K extends string>({ sections, active, onPress }: {
  sections: { key: K; label: string }[];
  active: K;
  onPress: (key: K) => void;
}) {
  const p = useDetailsPalette();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
      {sections.map(({ key, label }) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onPress(key)}
            style={[styles.pill, on && { backgroundColor: p.navy }]}
          >
            <Text style={[styles.pillText, { color: on ? p.onNavy : p.fg }]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Main specification table ──────────────────────────────────────────────────

export function MainSpecification({ car }: { car: Car }) {
  const p = useDetailsPalette();
  const isBike = car.type === 'Bike';
  const seats = /seat/i.test(car.seats) ? car.seats : `${car.seats} Seater`;
  const vehicleIcon = isBike ? 'motorbike' : 'car-outline';
  // Mileage is approximate, shown as "~15.2 km/l*".
  const rows: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value?: string | null }[] = [
    { icon: 'engine-outline', label: 'Engine', value: car.engine },
    { icon: 'gas-station-outline', label: 'Fuel Type', value: car.fuel },
    { icon: vehicleIcon, label: 'Mileage', value: car.mileage ? `~${car.mileage.replace(/^~|\*$/g, '').replace(/\s*km\/l$/i, ' km/l')}*` : null },
    { icon: 'cog-outline', label: 'Transmission', value: car.transmission },
    { icon: 'account-multiple-outline', label: 'Seats', value: isBike ? null : seats },
    { icon: 'snowflake', label: 'AC', value: isBike || car.ac === undefined ? null : car.ac ? 'Available' : 'Not available' },
    { icon: vehicleIcon, label: isBike ? 'Bike Type' : 'Car Type', value: car.category },
  ];
  const shown = rows.filter((r) => !!r.value);

  return (
    <View style={styles.block}>
      <SectionTitle>Main Specification</SectionTitle>
      <View style={[styles.table, { borderColor: p.border, backgroundColor: p.soft }]}>
        {shown.map((r, i) => (
          <View key={r.label} style={[styles.tableRow, i > 0 && { height: 36, borderTopWidth: 1, borderTopColor: p.border }]}>
            <View style={styles.tableLabelCol}>
              <MaterialCommunityIcons name={r.icon} size={15} color={p.muted} />
              <Text style={[styles.tableLabel, { color: p.muted }]}>{r.label}</Text>
            </View>
            <Text style={[styles.tableValue, { color: p.body }]}>{r.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Benefits + membership ─────────────────────────────────────────────────────

// Same plans as the Membership screen; per-trip caps as in services/backend/pricingEngine.ts (MEMBERSHIP_PLANS),
// which is what the server applies at booking.
const PLANS = [
  { key: 'starter', name: 'Starter', price: 999, pct: 0.05, pctLabel: '5%', annualCap: 10000, perTripCap: 499, icon: 'bookmark' as const, iconSize: 19, iconColor: '#19408E', image: require('@/assets/images/plan_starter.png'), imageSize: 16 },
  { key: 'plus', name: 'Plus', price: 1999, pct: 0.10, pctLabel: '10%', annualCap: 15000, perTripCap: 799, icon: 'shield-star' as const, iconSize: 18, iconColor: '#F59E0B', image: require('@/assets/images/plan_plus.png'), imageSize: 17 },
  { key: 'pro', name: 'Pro', price: 2999, pct: 0.125, pctLabel: '12.5%', annualCap: 20000, perTripCap: 999, icon: 'cards-diamond' as const, iconSize: 17, iconColor: '#5FB31F', image: require('@/assets/images/plan_pro.png'), imageSize: 16 },
];

export function Benefits() {
  const p = useDetailsPalette();
  const router = useRouter();
  const items = [
    { emoji: '🪙', image: require('@/assets/images/benefit_save_more.png'), title: 'Save more', sub: 'Save up to ₹25,000 a year on rentals.' },
    { emoji: '🎁', image: require('@/assets/images/benefit_exclusive_discounts.png'), title: 'Exclusive discounts', sub: 'Get up to 12.5% off car and bike rentals.', route: '/membership' },
    { emoji: '🎫', image: require('@/assets/images/benefit_special_rewards.png'), title: 'Special rewards', sub: 'Up to 15% off standard tariffs across all fleets.', route: '/membership' },
  ];
  return (
    <View style={styles.block}>
      <SectionTitle>More benefits with every journey</SectionTitle>
      <View style={{ gap: 12.5 }}>
        {items.map((it) => {
          const content = (
            <>
              {'image' in it && it.image ? (
                <Image source={it.image} style={styles.benefitIcon} contentFit="contain" />
              ) : (
                <View style={[styles.benefitIcon, { backgroundColor: p.demandBg }]}>
                  <Text style={{ fontSize: 20 }}>{it.emoji}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: p.fg }]}>{it.title}</Text>
                <Text style={[styles.itemSub, { color: p.muted, marginTop: 4 }]}>{it.sub}</Text>
              </View>
              {'route' in it && it.route ? (
                <Feather name="chevron-right" size={15} color={p.muted} />
              ) : null}
            </>
          );

          return 'route' in it && it.route ? (
            <Pressable
              key={it.title}
              accessibilityRole="button"
              accessibilityLabel={it.title}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(it.route as any);
              }}
              style={({ pressed }) => [styles.benefitRow, pressed && { opacity: 0.8 }]}
            >
              {content}
            </Pressable>
          ) : (
            <View key={it.title} style={styles.benefitRow}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Plan picker. `tripRent` (vehicle rent for the chosen days) only drives the "Save ₹X on this trip" chips. */
export function MembershipPicker({ tripRent }: { tripRent: number }) {
  const p = useDetailsPalette();
  const router = useRouter();
  const [selected, setSelected] = useState('plus');

  const open = (key?: string) => {
    Haptics.selectionAsync();
    if (key) setSelected(key);
    // The Membership page opens with this plan picked.
    router.push(key ? { pathname: '/membership', params: { plan: key } } : '/membership');
  };

  return (
    <View style={[styles.block, { paddingTop: 15.5 }]}>
      <View style={[styles.memberWrap, { backgroundColor: p.purpleBg, borderColor: p.memberBorder }]}>
        <View style={[styles.titleRow, { paddingRight: 3, marginBottom: 10 }]}>
          <Text style={[styles.sectionTitle, { color: p.fg }]}>Choose your membership</Text>
          <Pressable accessibilityRole="button" onPress={() => open()} hitSlop={8} style={styles.linkRow}>
            <Text style={[styles.link, { color: p.muted }]}>Learn More</Text>
            <Feather name="chevron-right" size={12} color={p.muted} />
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          {PLANS.map((plan) => {
            const on = plan.key === selected;
            const save = Math.min(plan.perTripCap, Math.round(tripRent * plan.pct));
            const bg = on ? p.purple : plan.key === 'pro' ? p.greenBg : p.page;
            const border = on ? p.purple : plan.key === 'pro' ? p.proBorder : p.memberBorder;
            const text = on ? '#FFFFFF' : p.fg;
            const sub = on ? 'rgba(255,255,255,0.85)' : p.muted;
            return (
              <Pressable
                key={plan.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${plan.name} membership, ${formatCurrency(plan.price)} a year`}
                onPress={() => open(plan.key)}
                style={({ pressed }) => [styles.planCard, { backgroundColor: bg, borderColor: border }, pressed && { opacity: 0.9 }]}
              >
                <View style={[styles.radio, on ? styles.radioOn : { borderColor: plan.key === 'pro' ? p.radioRing : border }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.planNameRow}>
                    {'image' in plan && plan.image ? (
                      <Image source={plan.image} style={{ width: plan.imageSize, height: plan.imageSize }} contentFit="contain" />
                    ) : (
                      <MaterialCommunityIcons name={plan.icon} size={plan.iconSize} color={plan.iconColor} />
                    )}
                    <Text style={[styles.planName, { color: text }]}>{plan.name}</Text>
                    {save > 0 && (
                      <View style={[styles.saveChip, { backgroundColor: p.green }]}>
                        <Text style={styles.saveChipText}>Save {formatCurrency(save)} on this trip</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.planSub, { color: sub }]}>
                    {plan.pctLabel} off every trip • Upto ₹{plan.annualCap / 1000}k annual savings
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.planPrice, { color: text }]} numberOfLines={1}>{formatCurrency(plan.price)}</Text>
                  <Text style={[styles.planSub, { color: sub }]}>/year</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/**
 * Shown instead of MembershipPicker when the user is already a Starter member.
 * Displays only Plus and Pro upgrade options with "Upgrade your membership" header
 * matching the Figma reference.
 */
export function MembershipUpgrade({ tripRent, currentPlan }: { tripRent: number; currentPlan: 'starter' | 'plus' }) {
  const p = useDetailsPalette();
  const router = useRouter();
  const [selected, setSelected] = useState(currentPlan === 'plus' ? 'pro' : 'plus');

  const tierOrder = ['starter', 'plus', 'pro'];
  const currentIdx = tierOrder.indexOf(currentPlan);
  const upgradePlans = PLANS.filter((pl) => tierOrder.indexOf(pl.key) > currentIdx);

  const open = (key?: string) => {
    Haptics.selectionAsync();
    if (key) setSelected(key);
    // The Membership page opens with this plan picked.
    router.push(key ? { pathname: '/membership', params: { plan: key } } : '/membership');
  };

  return (
    <View style={[styles.block, { paddingTop: 15.5 }]}>
      <View style={[styles.memberWrap, { backgroundColor: p.purpleBg, borderColor: p.memberBorder }]}>
        <View style={[styles.titleRow, { paddingRight: 3, marginBottom: 10 }]}>
          <Text style={[styles.sectionTitle, { color: p.fg }]}>Upgrade your membership</Text>
          <Pressable accessibilityRole="button" onPress={() => open()} hitSlop={8} style={styles.linkRow}>
            <Text style={[styles.link, { color: p.muted }]}>Learn More</Text>
            <Feather name="chevron-right" size={12} color={p.muted} />
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          {upgradePlans.map((plan) => {
            const on = plan.key === selected;
            const save = Math.min(plan.perTripCap, Math.round(tripRent * plan.pct));
            const bg = on ? p.purple : plan.key === 'pro' ? p.greenBg : p.page;
            const border = on ? p.purple : plan.key === 'pro' ? p.proBorder : p.memberBorder;
            const text = on ? '#FFFFFF' : p.fg;
            const sub = on ? 'rgba(255,255,255,0.85)' : p.muted;
            return (
              <Pressable
                key={plan.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`Upgrade to ${plan.name} membership, ${formatCurrency(plan.price)} a year`}
                onPress={() => open(plan.key)}
                style={({ pressed }) => [styles.planCard, { backgroundColor: bg, borderColor: border }, pressed && { opacity: 0.9 }]}
              >
                <View style={[styles.radio, on ? styles.radioOn : { borderColor: plan.key === 'pro' ? p.radioRing : border }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.planNameRow}>
                    {'image' in plan && plan.image ? (
                      <Image source={plan.image} style={{ width: plan.imageSize, height: plan.imageSize }} contentFit="contain" />
                    ) : (
                      <MaterialCommunityIcons name={plan.icon} size={plan.iconSize} color={plan.iconColor} />
                    )}
                    <Text style={[styles.planName, { color: text }]}>{plan.name}</Text>
                    {save > 0 && (
                      <View style={[styles.saveChip, { backgroundColor: p.green }]}>
                        <Text style={styles.saveChipText}>Save {formatCurrency(save)} on this trip</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.planSub, { color: sub }]}>
                    {plan.pctLabel} off every trip • Upto ₹{plan.annualCap / 1000}k annual savings
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.planPrice, { color: text }]} numberOfLines={1}>{formatCurrency(plan.price)}</Text>
                  <Text style={[styles.planSub, { color: sub }]}>/year</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── Reviews + guest trip photos ───────────────────────────────────────────────

function useReviews(car: Car) {
  const { data: dbReviews = [] } = useQuery({
    queryKey: ['carReviews', car.id],
    queryFn: () => API.reviews.fetchByCarId(car.id) as Promise<Review[]>,
    staleTime: 60 * 1000,
  });
  return [...(car.reviews || []), ...dbReviews].filter((r) => r.rating >= MIN_PUBLIC_REVIEW_RATING);
}

export function ReviewsStrip({ car }: { car: Car }) {
  const p = useDetailsPalette();
  const reviews = useReviews(car).filter((r) => !!r.text?.trim());
  if (reviews.length === 0) return null;

  return (
    <View style={[styles.block, styles.bleed]}>
      <View style={{ paddingHorizontal: 16 }}><SectionTitle>Reviews</SectionTitle></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {reviews.map((r, i) => (
          <View key={r.id || i} style={[styles.reviewCard, { backgroundColor: p.soft, borderColor: p.strongBorder }]}>
            <View style={styles.reviewHead}>
              <View style={styles.stars}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Ionicons key={s} name={s < Math.round(r.rating) ? 'star' : 'star-outline'} size={12} color={p.star} />
                ))}
              </View>
              <Text style={[styles.reviewRating, { color: p.navy }]}>{r.rating.toFixed(1)}</Text>
              <Text style={[styles.reviewer, { color: p.fg }]} numberOfLines={1}>{r.userName}</Text>
            </View>
            <Text style={[styles.reviewText, { color: p.sub }]} numberOfLines={3}>“{r.text.trim()}”</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/** "Shillong, Meghalaya" → "Shillong • Meghalaya", as on the design's photo chips. */
function formatPlace(place: string) {
  return place.split(/\s*[,•|]\s*/).filter(Boolean).join(' • ');
}

export function RealTrips({ car }: { car: Car }) {
  const p = useDetailsPalette();
  const photos = useReviews(car).flatMap((r) => (r.images || []).map((url) => ({ url, place: r.placeVisited })));
  if (photos.length === 0) return null;

  return (
    <View style={[styles.block, styles.bleed]}>
      <View style={{ paddingHorizontal: 16 }}><SectionTitle>Real trips, real experiences</SectionTitle></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {photos.map((ph, i) => (
          <View key={ph.url + i} style={[styles.tripCard, { backgroundColor: p.soft }]}>
            <LoadingImage source={{ uri: ph.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            {!!ph.place && (
              <BlurView intensity={25} tint="light" style={styles.placeChip}>
                <Ionicons name="location" size={10} color="#FFFFFF" />
                <Text style={styles.placeText} numberOfLines={1}>{formatPlace(ph.place)}</Text>
              </BlurView>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES_COLLAPSED = 8;

// One name per feature, so "Bluetooth" and "Bluetooth Connectivity" don't both show.
function featureKey(text: string) {
  const s = text.toLowerCase();
  if (/(auto\s*ac|air\s*condition|climate\s*control|^ac$|dual\s*zone\s*ac)/.test(s)) return 'ac';
  if (/sunroof/.test(s)) return 'sunroof';
  if (/airbag/.test(s)) return 'airbag';
  if (/(rear|reverse|backup|rear view)\s*(view\s*)?camera/.test(s)) return 'camera';
  if (/(touchscreen|infotainment|hd\s*display)/.test(s)) return 'screen';
  if (/usb/.test(s)) return 'usb';
  if (/(carplay|android\s*auto)/.test(s)) return 'carplay';
  if (/bluetooth/.test(s)) return 'bluetooth';
  if (/parking\s*sensor/.test(s)) return 'sensor';
  if (/(gps|navigation)/.test(s)) return 'gps';
  if (/abs/.test(s)) return 'abs';
  if (/cruise/.test(s)) return 'cruise';
  if (/(push\s*start|keyless)/.test(s)) return 'keyless';
  return s.trim();
}

/** The listed features plus the ones recorded on the vehicle (safety / tech / comfort), without repeats. */
function allFeatures(car: Car) {
  const raw = [...(car.features || []), ...(car.techFeatures || []), ...(car.safetyFeatures || []), ...(car.comfortFeatures || [])];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of raw) {
    const name = f?.trim();
    if (!name) continue;
    const key = featureKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function FeatureList({ car }: { car: Car }) {
  const p = useDetailsPalette();
  const [expanded, setExpanded] = useState(false);
  const features = allFeatures(car);
  if (features.length === 0) return null;

  const shown = expanded ? features : features.slice(0, FEATURES_COLLAPSED);
  const canToggle = features.length > FEATURES_COLLAPSED;

  return (
    <View style={styles.block}>
      <SectionTitle
        action={canToggle ? (expanded ? 'View Less' : 'View More') : undefined}
        actionIcon={expanded ? 'chevron-up' : 'chevron-down'}
        onAction={() => { LayoutAnimation.easeInEaseOut(); setExpanded((v) => !v); }}
      >
        Features
      </SectionTitle>
      <View style={styles.featureGrid}>
        {shown.map((f) => (
          <View key={f} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={13} color={p.green} />
            <Text style={[styles.featureText, { color: p.muted }]} numberOfLines={1}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Why rent from MySawari ────────────────────────────────────────────────────

const WHY = [
  { title: 'Lowest rent in the market', desc: 'Our daily rates are 200-500 lesser than the market rates' },
  { title: 'Well maintained vehicles', desc: 'Being the largest car/bike rental company in Guwahati, we have in-house maintenance team to keep our vehicles maintained all the time' },
  { title: 'True roadside assistance', desc: 'We have a dedicated support and roadside assistance team and we actually provide roadside assistance, not just claim' },
  { title: 'Unlimited kilometres', desc: 'Trips should not have limits, hence we provide unlimited km for all bookings of 2 days or longer duration' },
  { title: 'Zero cancellation/rescheduling fees', desc: 'We provide 100% refund for cancellations till 24 hours prior to trip start time & charge zero fees for rescheduling' },
  { title: 'Wide variety of vehicles', desc: 'Being the largest car/bike rental company, we offer a wide variety of options to choose from' },
  { title: 'No hidden charges', desc: "We don't apply any hidden charges. Our rates are super transparent. What you see is what you pay." },
  { title: 'Zero security deposit', desc: "You won't have to pay any security amount for taking a vehicle on rent from us. We keep just the original DL as a security." },
  { title: 'Doorstep/Airport Delivery', desc: 'We provide doorstep or airport delivery for a nominal delivery charge of Rs.200+Rs.20/km.' },
  { title: 'Lowest booking amount', desc: "While other agencies charge Rs.1,000-Rs.5,000 booking amount, our booking amount is just Rs.500. And it's 100% refundable/adjustable." },
  { title: 'Multiple payment options', desc: 'We accept all payment modes - cash, card, UPI etc.' },
];

const WHY_LIST_HEIGHT = 246;
const WHY_THUMB_HEIGHT = 42;

export function WhyRent() {
  const p = useDetailsPalette();
  // Slim custom scrollbar (the native one can't be coloured or placed like the design's).
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentH, setContentH] = useState(0);
  const viewH = WHY_LIST_HEIGHT;
  const thumbH = contentH > viewH ? WHY_THUMB_HEIGHT : 0; // fixed size, as in the design
  const thumbY = scrollY.interpolate({
    inputRange: [0, Math.max(1, contentH - viewH)],
    outputRange: [0, Math.max(0, viewH - thumbH)],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.block}>
      {/* linear-gradient(236.34deg, #D1CCF9 -14.94%, #F0EFFD 67.82%) — deep lavender at the top-right, pale by two-thirds. */}
      <LinearGradient
        colors={[p.memberBorder, p.purpleBg, p.purpleBg]}
        locations={[0, 0.7, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.whyCard, { borderColor: p.memberBorder }]}
      >
        {/* Purple glow from the top-right corner */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="whyGlow" cx="100%" cy="0%" rx="80%" ry="75%" fx="100%" fy="0%">
              <Stop offset="0" stopColor={p.purpleGlow} stopOpacity="1" />
              <Stop offset="1" stopColor={p.purpleGlow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#whyGlow)" />
        </Svg>
        <Text style={[styles.whyTitle, { color: p.fg }]}>Why rent from MySawari?</Text>
        {/* Fixed-height list that scrolls inside the card (the page keeps scrolling outside it). */}
        <View>
          <Animated.ScrollView
            style={{ height: viewH }}
            contentContainerStyle={{ gap: 11, paddingBottom: 4 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            onContentSizeChange={(_, h) => setContentH(h)}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
          >
            {WHY.map((w) => (
              <View key={w.title} style={styles.whyRow}>
                <View style={[styles.whyCheck, { backgroundColor: p.purpleCheck }]}>
                  <Feather name="check" size={11} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.whyItemTitle, { color: p.fg }]}>{w.title}</Text>
                  <Text style={[styles.whyItemDesc, { color: p.muted }]}>{w.desc}</Text>
                </View>
              </View>
            ))}
          </Animated.ScrollView>
          {thumbH > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.whyThumb, { height: thumbH, transform: [{ translateY: thumbY }] }]}
            />
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Location ──────────────────────────────────────────────────────────────────

export function LocationCard({ deliveryAddress }: { deliveryAddress?: string | null }) {
  const p = useDetailsPalette();
  return (
    <View style={styles.block}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open the pickup location in maps"
        onPress={() => { Haptics.selectionAsync(); Linking.openURL(MAPS_URL); }}
        style={({ pressed }) => [styles.card, styles.locCard, { backgroundColor: p.soft, borderColor: p.deliveryBorder }, pressed && { opacity: 0.85 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.locTitle, { color: p.fg }]}>Location</Text>
          <Text style={[styles.locAddr, { color: p.muted }]} numberOfLines={2}>
            MySawari - Self Drive Car Rental Guwahati, Ganesh Turning, Bongshar, Kahilipara, Guwahati, Assam 781019
          </Text>
          {!!deliveryAddress && (
            <Text style={[styles.locAddr, { color: p.navy, marginTop: 6 }]} numberOfLines={1}>Delivered to: {deliveryAddress}</Text>
          )}
        </View>
        <View style={styles.mapTile}>
          <Image source={require('@/assets/images/location_map.png')} style={styles.mapImage} contentFit="cover" />
          <Image source={require('@/assets/images/location_pin.png')} style={styles.mapPin} contentFit="contain" />
          <Image source={require('@/assets/images/location_pin_dot.png')} style={styles.mapPinDot} contentFit="contain" />
        </View>
      </Pressable>
    </View>
  );
}

// ── Cancellation & policy ─────────────────────────────────────────────────────

/** `freeCancelUntil` is e.g. "13 Nov, 10:00 AM" (24 h before pickup), when trip dates are chosen. */
export function CancellationPolicy({ freeCancelUntil }: { freeCancelUntil?: string | null }) {
  const p = useDetailsPalette();
  const router = useRouter();
  return (
    <View style={styles.block}>
      <SectionTitle>Cancellation & Policy</SectionTitle>
      <Timeline
        p={p}
        activeColor={p.navy}
        steps={[
          {
            title: <Text style={[styles.tlTitle, { color: p.fg }]}>More than 24 Hours Prior</Text>,
            desc: freeCancelUntil
              ? `Cancel before ${freeCancelUntil} for instant full reversal to source account.`
              : 'Cancel more than 24 hours before pickup for instant full reversal to source account.',
            badge: { text: '100% Refund', color: p.green },
          },
          {
            title: <Text style={[styles.tlTitle, { color: p.fg }]}>Within 24 Hours of Start / No-Show</Text>,
            desc: `The ${formatCurrency(BOOKING_ADVANCE_AMOUNT)} booking amount is non-refundable.`,
            badge: { text: 'No Refund', color: p.red },
          },
        ]}
      />
      <Pressable accessibilityRole="link" onPress={() => router.push('/policies')} hitSlop={8} style={[styles.linkRow, { marginTop: 10 }]}>
        <Text style={[styles.link, { color: p.muted }]}>View Terms & Condition</Text>
        <Feather name="chevron-right" size={12} color={p.muted} />
      </Pressable>
    </View>
  );
}

// ── Inclusions / exclusions / payment schedule ────────────────────────────────

const INCLUDED = [
  'Car rental - Vehicle rental for the selected duration',
  '300 km for 1 day booking and unlimited km for 2 days or longer bookings',
  'Roadside assistance - support during your trip',
  'Taxes & applicable charges - Included in the displayed rental price',
];
const NOT_INCLUDED = [
  'Fuel - Fuel costs are paid by the renter',
  'Tolls & parking - Any toll, parking, or entry charges',
  'Traffic fines - Fines or penalties during the rental',
  'Extra kilometres - Charges apply if you exceed included KM limit (only for single day booking)',
  'Damage charges - Charges for damages to the vehicle',
  'Driver fees - Fees for a driver if you need one',
  'Additional services - Any optional add-ons selected during booking',
];

export function Inclusions() {
  const p = useDetailsPalette();
  return (
    <View style={[styles.block, { gap: 12 }]}>
      {/* linear-gradient(180deg, #FFFFFF 30%, …) — white through the top third, then down to the tint. */}
      <LinearGradient colors={[p.page, p.page, p.greenBg]} locations={[0, 0.3, 1]} style={[styles.card, { borderColor: p.greenBorder }]}>
        <View style={styles.incHead}>
          <Ionicons name="thumbs-up" size={16} color={p.green} />
          <Text style={[styles.incTitle, { color: p.fg }]}>Inclusions</Text>
        </View>
        <Bullets items={INCLUDED} p={p} />
      </LinearGradient>
      <LinearGradient colors={[p.page, p.redBg]} style={[styles.card, { borderColor: p.redBorder }]}>
        <View style={styles.incHead}>
          <Ionicons name="thumbs-down" size={16} color={p.red} />
          <Text style={[styles.incTitle, { color: p.fg }]}>What's not included</Text>
        </View>
        <Bullets items={NOT_INCLUDED} p={p} />
      </LinearGradient>
    </View>
  );
}

export function PaymentSchedule() {
  const p = useDetailsPalette();
  return (
    <View style={styles.block}>
      {/* linear-gradient(262.31deg, #E6F3EE 40.76%, #FFFFFF 104.76%) — mint on the left, white by the right edge. */}
      <LinearGradient
        colors={[p.greenBg, p.greenBg, p.page]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.card, styles.payCard, { borderColor: p.proBorder }]}
      >
        <Text style={[styles.payHeading, { color: p.fg }]}>Payment Schedule</Text>
        <Timeline
          p={p}
          activeColor={p.green}
          gap={7}
          railWidth={18}
          descStyle={styles.payDesc}
          steps={[
            { title: <Text style={[styles.payTitle, { color: p.fg }]}>Booking Amount:  {formatCurrency(BOOKING_ADVANCE_AMOUNT)}</Text>, desc: 'To be paid now' },
            { title: <Text style={[styles.payTitle, { color: p.fg }]}>Balance Amount</Text>, desc: 'To be paid while taking the vehicle' },
          ]}
        />
      </LinearGradient>
    </View>
  );
}

// ── FAQs ──────────────────────────────────────────────────────────────────────

// Shared with the full FAQs page (screens/Support/FaqsScreen.tsx); this page shows the first few.
export const FAQS = [
  { q: "What's the rental period?", a: 'Our standard rental period is 8 AM to 8 AM, i.e. 8 AM of a day to 8 AM of the next day is counted as 1 day.' },
  { q: 'What documents do I need to rent this vehicle?', a: "You'll need a valid driving license and Aadhar card." },
  { q: 'What types of vehicles are available for rent?', a: 'We offer a range of vehicles including Hatchback cars, Sedans, SUVs, luxury vehicles all suited for different needs and budgets. We also provide bikes and scooties on rent.' },
  { q: 'Are there any hidden fees?', a: "No, our pricing is transparent and all-inclusive. You'll see the final cost upfront. No surprises!" },
  { q: 'Can I get the car/bike delivered to my location?', a: 'Yes, you can get a car delivered to your home, office or airport or any other location for a nominal one-time delivery+pickup fees.' },
  { q: 'What if I need to cancel my booking?', a: 'You can easily cancel your upcoming bookings from My Bookings section.' },
  { q: 'What if I need to extend my booking?', a: 'You can place extension request from My Bookings section. Extensions are subject to vehicle availability.' },
  { q: 'Do you have a minimum age requirement for renters?', a: "Yes, renters must be at least 18 years old and possess a valid driver's license to rent a vehicle from us." },
  { q: 'What happens if the car breaks down or I need assistance during the rental period?', a: "We provide 24/7 roadside assistance for all our rentals. Simply call our support line, and we'll arrange for help as quickly as possible." },
  { q: 'Can I negotiate the vehicle rent?', a: 'No. Our prices are lowest in Guwahati. You can check with any other agency. Other agency per day rates are 500-2000 more than our rates depending on cars. You may however buy Membership plans to get additional instant discounts.' },
  { q: "Is there any late charge if I'm late in returning the vehicle?", a: 'Yes, a late charge of Rs.500/hour for cars and Rs.200/hour for bikes/scooties are applicable.' },
];
const FAQS_ON_DETAILS = 4;

/** Accordion list of questions; the first one starts open, any number can be open at once. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const p = useDetailsPalette();
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) => {
    LayoutAnimation.easeInEaseOut();
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  return (
    <View style={{ gap: 10 }}>
      {items.map((f, i) => {
        const isOpen = open.has(i);
        return (
          <Pressable
            key={f.q}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
            onPress={() => toggle(i)}
            style={[styles.faq, { borderColor: p.border, backgroundColor: p.page }]}
          >
            <View style={styles.faqHead}>
              <Text style={[styles.faqQ, { color: p.fg }]}>{f.q}</Text>
              <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={p.fg} />
            </View>
            {isOpen && <Text style={[styles.faqA, { color: p.muted }]}>{f.a}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Faqs() {
  const router = useRouter();
  return (
    <View style={styles.block}>
      <SectionTitle action="View More" onAction={() => router.push('/faqs')}>FAQs</SectionTitle>
      <FaqList items={FAQS.slice(0, FAQS_ON_DETAILS)} />
    </View>
  );
}

// ── Help + policy agreement ───────────────────────────────────────────────────

export function HelpCard() {
  const p = useDetailsPalette();
  return (
    <View style={styles.block}>
      {/* Same wash as Payment Schedule: mint on the left → white at the right edge. */}
      <LinearGradient
        colors={[p.greenBg, p.greenBg, p.page]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.card, styles.helpCard, { borderColor: p.proBorder }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.helpTitle, { color: p.fg }]}>Need help with your booking?</Text>
          <Text style={[styles.helpSub, { color: p.muted }]}>Have a question? We're here to help</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call MySawari"
          onPress={() => { Haptics.selectionAsync(); Linking.openURL(`tel:${SUPPORT_PHONE}`); }}
          style={({ pressed }) => [styles.helpBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="call" size={17} color="#FFFFFF" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chat with MySawari on WhatsApp"
          onPress={() => { Haptics.selectionAsync(); Linking.openURL(SUPPORT_WHATSAPP_URL); }}
          style={({ pressed }) => [styles.helpBtn, { backgroundColor: p.whatsapp, marginLeft: 10.5 }, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

export function PolicyAgreement({ agreed, onToggle }: { agreed: boolean; onToggle: () => void }) {
  const p = useDetailsPalette();
  const router = useRouter();
  return (
    <View style={styles.block}>
      <SectionTitle action="Learn More" onAction={() => router.push('/policies')}>Policy Agreement</SectionTitle>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => { Haptics.selectionAsync(); onToggle(); }}
        style={styles.agreeRow}
      >
        <View style={[styles.checkbox, { borderColor: p.navy, backgroundColor: agreed ? p.navy : 'transparent' }]}>
          {agreed && <Feather name="check" size={9} color="#FFFFFF" />}
        </View>
        <Text style={[styles.agreeText, { color: p.muted }]}>I agree to the rental terms, cancellation policy, and vehicle usage guidelines.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 16, paddingTop: 22 },
  bleed: { paddingHorizontal: 0 },
  hScroll: { paddingHorizontal: 16, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, letterSpacing: -0.2, flexShrink: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, textDecorationLine: 'underline' },
  card: { borderWidth: 1, borderRadius: 10, padding: 13 },
  itemTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  itemSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10.5, marginTop: 3 },

  mileCard: { paddingHorizontal: 12, paddingVertical: 11, gap: 12 },
  mileRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  mileHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mileTag: { borderRadius: 9, paddingHorizontal: 7, height: 17, justifyContent: 'center' },
  mileTagText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, color: '#FFFFFF', letterSpacing: 0.2 },
  mileTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  mileSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 4 },
  calCircle: { width: 36.5, height: 36.5, borderRadius: 18.25, alignItems: 'center', justifyContent: 'center' },
  calBody: { width: 17.5, height: 17.5, borderRadius: 3, backgroundColor: '#ECECEC', overflow: 'hidden', alignItems: 'center' },
  calTop: { alignSelf: 'stretch', height: 5.5, backgroundColor: '#E53935', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2.5 },
  calRing: { width: 1.8, height: 1.8, borderRadius: 1, backgroundColor: '#FFFFFF' },
  calDay: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, lineHeight: 11.5, color: '#3D3D3D' },
  addDayCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 13, paddingRight: 10, paddingVertical: 12.5, marginTop: 12.5, gap: 10 },
  addDayTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  addDaySub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 4.5 },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6.5, borderRadius: 6, paddingHorizontal: 10.5, height: 35.5 },
  addDayBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },

  pills: { paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  pill: { borderRadius: 17.75, paddingHorizontal: 13, height: 35.5, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },

  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 35.5, paddingHorizontal: 12 },
  tableLabelCol: { width: '52.2%', flexDirection: 'row', alignItems: 'center', gap: 7 },
  tableLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
  tableValue: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },

  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  benefitIcon: { width: 36.5, height: 36.5, borderRadius: 18.25, alignItems: 'center', justifyContent: 'center' },

  memberWrap: { borderWidth: 1, borderRadius: 16, padding: 8, paddingTop: 12 },
  planCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 10.5, paddingLeft: 8, paddingRight: 9, gap: 9 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, backgroundColor: '#FFFFFF' },
  radioOn: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8.5, flexWrap: 'wrap' },
  planName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  saveChip: { borderRadius: 10, paddingHorizontal: 8, height: 19.5, justifyContent: 'center', marginLeft: 0.5 },
  saveChipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8.5, color: '#FFFFFF' },
  planSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 6.5 },
  planPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15.5 },

  reviewCard: { width: 257, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 9.5 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  stars: { flexDirection: 'row', gap: 1.5 },
  reviewRating: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, marginLeft: 6.5, flex: 1 },
  reviewer: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, maxWidth: 110 },
  reviewText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, lineHeight: 17 },

  tripCard: { width: 216, height: 120, borderRadius: 10, overflow: 'hidden' },
  placeChip: { position: 'absolute', top: 8, left: 7.5, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 11, overflow: 'hidden', paddingLeft: 9.5, paddingRight: 10, height: 21.5, maxWidth: 200 },
  placeText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 9, color: '#FFFFFF' },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 9 },
  featureItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  featureText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, flexShrink: 1 },

  whyCard: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingTop: 14, paddingBottom: 13, overflow: 'hidden' },
  whyThumb: { position: 'absolute', top: 0, right: -8.5, width: 4, borderRadius: 2, backgroundColor: '#A3A3A3' },
  whyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, marginBottom: 11.5 },
  whyRow: { flexDirection: 'row', gap: 11.5 },
  whyCheck: { width: 19.5, height: 19.5, borderRadius: 9.75, alignItems: 'center', justifyContent: 'center', marginTop: 5, marginLeft: 1.5 },
  whyItemTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
  whyItemDesc: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 17, marginTop: 2 },

  locCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  locTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  locAddr: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 17, marginTop: 5.5 },
  mapTile: { width: 49.5, height: 49.5, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E8EFEA' },
  mapImage: { width: 49.5, height: 49.5 },
  mapPin: { position: 'absolute', left: 16.5, top: 14.5, width: 17, height: 21 },
  mapPinDot: { position: 'absolute', left: 21.75, top: 19.75, width: 6, height: 6 },

  tlRow: { flexDirection: 'row' },
  tlRail: { width: 22.5, alignItems: 'flex-start' },
  tlDot: { width: 10, height: 10, borderRadius: 5 },
  tlLine: { width: 1, flex: 1, marginLeft: 4.5 },
  tlHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tlTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  tlDesc: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 17, marginTop: 2.5 },
  badge: { borderRadius: 10, paddingHorizontal: 9, height: 19.5, justifyContent: 'center' },
  badgeText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8.5, color: '#FFFFFF' },
  payCard: { paddingTop: 12, paddingBottom: 12 },
  payHeading: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, marginBottom: 9.5 },
  payTitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  payDesc: { fontSize: 11.5, marginTop: 1 },

  incHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  incTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 6 },
  bulletDot: { width: 3, height: 3, borderRadius: 1.5, marginTop: 8, marginRight: 9 },
  bulletText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 19 },

  faq: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  faqA: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 19, marginTop: 8 },

  helpCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13.5 },
  helpTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  helpSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 6 },
  helpBtn: { width: 35.5, height: 35.5, borderRadius: 17.75, alignItems: 'center', justifyContent: 'center' },

  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8.5 },
  checkbox: { width: 13, height: 13, borderRadius: 2.5, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', marginTop: 3.5 },
  agreeText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20 },
});