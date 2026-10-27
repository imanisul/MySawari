import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, LayoutAnimation, Animated } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Rect, Path } from 'react-native-svg';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { LoadingImage } from '@/components/common/LoadingImage';
import { API } from '@/services/backend/api';
import { BOOKING_ADVANCE_AMOUNT, formatCurrency } from '@/services/backend/pricingEngine';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { Car, Review, MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';
import { useDetailsPalette, DetailsPalette } from './detailsPalette';
import { useSawari } from '@/context/SawariContext';
import { MembershipCelebration } from './MembershipSavedPopup';

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
    <View>
      {items.map((t) => (
        <View key={t} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: p.muted }]} />
          <Text style={[styles.bulletText, { color: p.muted }]}>{t}</Text>
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

const TL_GAP = 10; // Figma: 10 between the cancellation steps

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

/** The round icon on a mileage row: the design's artwork (calendar "1" at 18px, road at 20px) centred in the circle. */
function MileageIcon({ source, size, p }: { source: ImageSourcePropType; size: number; p: DetailsPalette }) {
  return (
    <View style={[styles.calCircle, { backgroundColor: p.iconBg }]}>
      <Image source={source} style={{ width: size, height: size }} contentFit="contain" />
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
    // Figma frame: padding 8/16/12, 12 between the title and the card.
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 12 }]}>
      <SectionTitle>Mileage limits</SectionTitle>
      <View style={[styles.card, styles.mileCard, { backgroundColor: p.soft, borderColor: p.strongBorder }]}>
        <View style={styles.mileRow}>
          <MileageIcon source={require('@/assets/images/mileage_calendar.png')} size={18} p={p} />
          <View style={{ flex: 1 }}>
            <View style={styles.mileHead}>
              <Text style={[styles.mileTitle, { color: p.fg }]}>1-Day Booking</Text>
              {oneDayOn && <View style={[styles.mileTag, { backgroundColor: p.navy }]}><Text style={styles.mileTagText}>Your booking</Text></View>}
            </View>
            <Text style={[styles.mileSub, { color: p.muted }]}>Incl. {INCLUDED_KM_ONE_DAY} km  •  Extra km at ₹{EXTRA_KM_RATE}/km.</Text>
          </View>
        </View>
        <View style={styles.mileRow}>
          <MileageIcon source={require('@/assets/images/mileage_road.png')} size={20} p={p} />
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
    // Figma frame: padding 12/16/8, 12 between the title and the table (7 rows × 36 + 2 border = 254; 309 in all).
    <View style={[styles.block, { paddingTop: 12, paddingBottom: 8 }]}>
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
    { size: 24, image: require('@/assets/images/benefit_save_more.png'), title: 'Save more', sub: 'Save up to ₹25,000 a year on rentals.' },
    { size: 20, image: require('@/assets/images/benefit_exclusive_discounts.png'), title: 'Exclusive discounts', sub: 'Get up to 12.5% off car and bike rentals.', route: '/membership' },
    { size: 24, image: require('@/assets/images/benefit_special_rewards.png'), title: 'Special rewards', sub: 'Up to 15% off standard tariffs across all fleets.', route: '/membership' },
  ];
  return (
    <View style={[styles.block, { paddingTop: 8 }]}>
      <SectionTitle>More benefits with every journey</SectionTitle>
      <View style={{ gap: 12 }}>
        {items.map((it) => {
          const content = (
            <>
              {/* Figma: 37px circle in Gold/Bg around the artwork (24px, the discount one 20px). */}
              <View style={[styles.benefitIcon, { backgroundColor: p.demandBg }]}>
                <Image source={it.image} style={{ width: it.size, height: it.size }} contentFit="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: p.fg }]}>{it.title}</Text>
                <Text style={[styles.itemSub, { color: p.muted }]}>{it.sub}</Text>
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

/**
 * Plan picker on car details (design "Choose your membership" / "Upgrade your membership"). Picking a plan does
 * not leave the page: it is added to this booking (its discount applies to the trip price straight away and its
 * yearly price is paid together with the booking amount), with a celebration popup. Tapping it again removes it.
 * "Learn More" opens the Membership page. `tripRent` (rent for the chosen days) drives the "Save ₹X" chips.
 */
function PlanOptions({ title, plans, tripRent }: { title: string; plans: typeof PLANS; tripRent: number }) {
  const p = useDetailsPalette();
  const router = useRouter();
  const { planToBuy, setPlanToBuy } = useSawari();
  const [celebrate, setCelebrate] = useState<{ plan: (typeof PLANS)[number]; save: number } | null>(null);

  const pick = (plan: (typeof PLANS)[number]) => {
    if (planToBuy === plan.key) {
      Haptics.selectionAsync();
      setPlanToBuy(null);
      return;
    }
    setPlanToBuy(plan.key as 'starter' | 'plus' | 'pro');
    setCelebrate({ plan, save: Math.min(plan.perTripCap, Math.round(tripRent * plan.pct)) });
  };
  const chosen = plans.find((pl) => pl.key === planToBuy);

  return (
    <View style={[styles.block, { paddingTop: 15.5 }]}>
      <View style={[styles.memberWrap, { backgroundColor: p.purpleBg, borderColor: p.memberBorder }]}>
        <View style={[styles.titleRow, { paddingRight: 3, marginBottom: 10 }]}>
          <Text style={[styles.sectionTitle, { color: p.fg }]}>{title}</Text>
          <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); router.push('/membership'); }} hitSlop={8} style={styles.linkRow}>
            <Text style={[styles.link, { color: p.muted }]}>Learn More</Text>
            <Feather name="chevron-right" size={12} color={p.muted} />
          </Pressable>
        </View>
        <View style={{ gap: 8 }} accessibilityRole="radiogroup">
          {plans.map((plan) => {
            const on = plan.key === planToBuy;
            const save = Math.min(plan.perTripCap, Math.round(tripRent * plan.pct));
            // Each plan keeps its own colours (Starter white, Plus purple, Pro mint); the radio shows the pick.
            const purple = plan.key === 'plus';
            const bg = purple ? p.purple : plan.key === 'pro' ? p.greenBg : p.page;
            const border = purple ? p.purple : plan.key === 'pro' ? p.proBorder : p.memberBorder;
            const text = purple ? '#FFFFFF' : p.fg;
            const sub = purple ? 'rgba(255,255,255,0.85)' : p.muted;
            const ring = purple ? '#FFFFFF' : plan.key === 'pro' ? p.green : p.purple;
            return (
              <Pressable
                key={plan.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${plan.name} membership, ${formatCurrency(plan.price)} a year${save > 0 ? `, save ${formatCurrency(save)} on this trip` : ''}${on ? ', added to this booking' : ''}`}
                onPress={() => pick(plan)}
                style={({ pressed }) => [styles.planCard, { backgroundColor: bg, borderColor: border }, on && styles.planOn, pressed && { opacity: 0.9 }]}
              >
                <View style={[styles.planRadio, { borderColor: on ? ring : purple ? '#FFFFFF' : p.radioRing, backgroundColor: on ? ring : '#FFFFFF' }]}>
                  {on && <View style={[styles.planRadioDot, { backgroundColor: purple ? p.purple : '#FFFFFF' }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.planNameRow}>
                    <Image source={plan.image} style={{ width: plan.imageSize, height: plan.imageSize }} contentFit="contain" />
                    <Text style={[styles.planName, { color: text }]}>{plan.name}</Text>
                    {save > 0 && (
                      <View style={[styles.saveChip, { backgroundColor: p.green }]}>
                        <Text style={styles.saveChipText}>{on ? `${formatCurrency(save)} Saved` : `Save ${formatCurrency(save)} on this trip`}</Text>
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
        {!!chosen && (
          <View style={styles.addedRow}>
            <Ionicons name="checkmark-circle" size={14} color={p.green} />
            <Text style={[styles.addedText, { color: p.sub }]}>
              {chosen.name} membership ({formatCurrency(chosen.price)}/year) is added to your payment. Tap it again to remove.
            </Text>
          </View>
        )}
      </View>

      {celebrate && (
        <MembershipCelebration
          visible
          confetti
          plan={celebrate.plan.name}
          amount={celebrate.save > 0 ? celebrate.save : null}
          title={`${celebrate.plan.name} Membership Applied!`}
          note={celebrate.save > 0
            ? `${formatCurrency(celebrate.plan.price)} for 1 year, paid with your booking`
            : `${celebrate.plan.pctLabel} off every trip · ${formatCurrency(celebrate.plan.price)}/year with your booking`}
          onClose={() => setCelebrate(null)}
        />
      )}
    </View>
  );
}

/** For customers without a membership: all three plans. */
export function MembershipPicker({ tripRent }: { tripRent: number }) {
  return <PlanOptions title="Choose your membership" plans={PLANS} tripRent={tripRent} />;
}

/** For a Starter or Plus member: only the higher plans ("Upgrade your membership"). */
export function MembershipUpgrade({ tripRent, currentPlan }: { tripRent: number; currentPlan: 'starter' | 'plus' }) {
  const order = ['starter', 'plus', 'pro'];
  return <PlanOptions title="Upgrade your membership" plans={PLANS.filter((pl) => order.indexOf(pl.key) > order.indexOf(currentPlan))} tripRent={tripRent} />;
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
    // Figma frame: padding 8/16, 12 between title and cards (8 + 23 + 12 + 97 + 8 = 148).
    <View style={[styles.block, styles.bleed, { paddingTop: 8, paddingBottom: 8 }]}>
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
    // Figma frame: padding 8/16, 12 between title and photos (8 + 23 + 12 + 120 + 8 = 171).
    <View style={[styles.block, styles.bleed, { paddingTop: 8, paddingBottom: 8 }]}>
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
  if (/central\s*lock/.test(s)) return 'lock';
  return s.trim();
}

// Figma shows these first, in this order and under these short names; anything else follows as listed.
const FEATURE_LABELS: [key: string, label?: string][] = [
  ['carplay', 'Apple CarPlay / Android Auto'], ['bluetooth', 'Bluetooth Connectivity'], ['screen', 'Touchscreen Infotainment'],
  ['sensor', 'Rear Parking Sensors'], ['lock', 'Central Locking'], ['ac', 'Air Conditioning'], ['usb', 'USB Charging'], ['airbag'],
];

/** The listed features plus the ones recorded on the vehicle (safety / tech / comfort), without repeats. */
function allFeatures(car: Car) {
  const raw = [...(car.features || []), ...(car.techFeatures || []), ...(car.safetyFeatures || []), ...(car.comfortFeatures || [])];
  const seen = new Set<string>();
  const out: { key: string; name: string }[] = [];
  for (const f of raw) {
    const name = f?.trim();
    if (!name) continue;
    const key = featureKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, name });
  }
  const rank = (key: string) => { const i = FEATURE_LABELS.findIndex(([k]) => k === key); return i < 0 ? FEATURE_LABELS.length : i; };
  return out
    .map((f, i) => ({ ...f, i }))
    .sort((x, y) => rank(x.key) - rank(y.key) || x.i - y.i)
    .map((f) => FEATURE_LABELS.find(([k]) => k === f.key)?.[1] ?? (/^(2|dual|two)\s+(front\s+)?airbags?( protection)?$/i.test(f.name) ? '2 Front Airbags' : f.name));
}

export function FeatureList({ car }: { car: Car }) {
  const p = useDetailsPalette();
  const [expanded, setExpanded] = useState(false);
  const features = allFeatures(car);
  if (features.length === 0) return null;

  const shown = expanded ? features : features.slice(0, FEATURES_COLLAPSED);
  const canToggle = features.length > FEATURES_COLLAPSED;

  return (
    // Figma frame: padding 8/16, 12 between the title and the grid (8 + 23 + 12 + 80 + 8 = 131).
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 8 }]}>
      <SectionTitle
        action={canToggle ? (expanded ? 'View Less' : 'View More') : undefined}
        actionIcon={expanded ? 'chevron-up' : 'chevron-down'}
        onAction={() => { LayoutAnimation.easeInEaseOut(); setExpanded((v) => !v); }}
      >
        Features
      </SectionTitle>
      {/* Design: two columns, filled row by row (CarPlay | Bluetooth, Touchscreen | Parking sensors, …).
          Explicit rows of two: a % width + gap grid added up to just over 100% and fell into one column. */}
      <View style={styles.featureGrid}>
        {Array.from({ length: Math.ceil(shown.length / 2) }, (_, r) => (
          <View key={r} style={styles.featureRow}>
            {[shown[r * 2], shown[r * 2 + 1]].map((f, c) => (
              <View key={c} style={styles.featureItem}>
                {!!f && (
                  <>
                    <Ionicons name="checkmark-circle" size={12.5} color={p.green} />
                    <Text style={[styles.featureText, { color: p.muted }]} numberOfLines={1}>{f}</Text>
                  </>
                )}
              </View>
            ))}
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
      {/* linear-gradient(236.34deg, #D1CCF9 -14.94%, #F0EFFD 67.82%) on a 361×307 card: the line runs from
          (1.04, 0.08) to (-0.04, 0.92) of the card, and the colour at its start is #D1CCF9 already 15% of the way
          to #F0EFFD (#D7D2FA), reaching #F0EFFD at 67.82%. */}
      <LinearGradient
        colors={['#D7D2FA', p.purpleBg, p.purpleBg]}
        locations={[0, 0.6782, 1]}
        start={{ x: 1.042, y: 0.075 }}
        end={{ x: -0.042, y: 0.925 }}
        style={[styles.whyCard, { borderColor: p.memberBorder }]}
      >
        {/* Figma "Ellipse 4": a 151×147 #9C90F3 blob, blurred 67, centred about 58 in from the right edge and 13 above the
            card's top. Drawn as a soft radial wash from that point (SVG filters are unreliable on Android). */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="whyGlow" cx="84%" cy="-4%" rx="42%" ry="48%" fx="84%" fy="-4%">
              <Stop offset="0" stopColor={p.purpleGlow} stopOpacity="0.6" />
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
            contentContainerStyle={{ gap: 10 }}
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
    // Figma frame: padding 8/16 around the 83px card (99px in all).
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 8 }]}>
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
          {/* The pin from the design's "Frame 110" (50×50): a green #008758 drop with a white dot. */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 50 50">
            <Path
              d="M25.601 34.799C27.461 33.193 33 27.993 33 23C33 20.8783 32.1571 18.8434 30.6569 17.3431C29.1566 15.8429 27.1217 15 25 15C22.8783 15 20.8434 15.8429 19.3431 17.3431C17.8429 18.8434 17 20.8783 17 23C17 27.993 22.539 33.193 24.399 34.799C24.5723 34.9293 24.7832 34.9998 25 34.9998C25.2168 34.9998 25.4277 34.9293 25.601 34.799Z"
              fill="#008758"
              stroke="#008758"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M25 26C26.6569 26 28 24.6569 28 23C28 21.3431 26.6569 20 25 20C23.3431 20 22 21.3431 22 23C22 24.6569 23.3431 26 25 26Z" fill="#FFFFFF" />
          </Svg>
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
    // Figma frame: padding 8/16, 12 between the title, the timeline and the link.
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 8 }]}>
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
      <Pressable accessibilityRole="link" onPress={() => router.push('/policies')} hitSlop={8} style={[styles.linkRow, { marginTop: 12 }]}>
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
    // Figma frame: padding 8/16, 12 between the two cards.
    <View style={[styles.block, { gap: 12, paddingTop: 8, paddingBottom: 8 }]}>
      {/* linear-gradient(180deg, #FFFFFF 30%, …) — white through the top third, then down to the tint. */}
      <LinearGradient colors={[p.page, p.page, p.greenBg]} locations={[0, 0.3, 1]} style={[styles.card, styles.incCard, { borderColor: p.greenBorder }]}>
        <View style={styles.incHead}>
          <Ionicons name="thumbs-up" size={16} color={p.green} />
          <Text style={[styles.incTitle, { color: p.fg }]}>Inclusions</Text>
        </View>
        <Bullets items={INCLUDED} p={p} />
      </LinearGradient>
      <LinearGradient colors={[p.page, p.redBg]} style={[styles.card, styles.incCard, { borderColor: p.redBorder }]}>
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
    // Figma frame: padding 8/16 around the card (143px = 8 + 127 + 8).
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 8 }]}>
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

/** Accordion list of questions; the first one starts open (unless openFirst={false}), any number can be open at once. */
export function FaqList({ items, openFirst = true }: { items: { q: string; a: string }[]; openFirst?: boolean }) {
  const p = useDetailsPalette();
  const [open, setOpen] = useState<Set<number>>(() => new Set(openFirst ? [0] : []));
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
            style={[styles.faq, isOpen && { paddingVertical: 8 }, { borderColor: p.strongBorder, backgroundColor: p.page }]}
          >
            <View style={styles.faqHead}>
              <Text style={[styles.faqQ, { color: p.fg }]}>{f.q}</Text>
              <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={p.fg} />
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
    // Figma frame: padding 8/16, 12 between the title and the list.
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 8 }]}>
      <SectionTitle action="View More" onAction={() => router.push('/faqs')}>FAQs</SectionTitle>
      <FaqList items={FAQS.slice(0, FAQS_ON_DETAILS)} />
    </View>
  );
}

// ── Help + policy agreement ───────────────────────────────────────────────────

export function HelpCard() {
  const p = useDetailsPalette();
  return (
    // Figma frame: padding 8/16/12 around the card (86px = 8 + 66 + 12).
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 12 }]}>
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
          style={({ pressed }) => [styles.helpBtn, { backgroundColor: p.whatsapp, marginLeft: 10 }, pressed && { opacity: 0.85 }]}
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
    // Figma frame: padding 8/16/16, 12 between the title and the checkbox row (99px with a two-line agreement).
    <View style={[styles.block, { paddingTop: 8, paddingBottom: 16 }]}>
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
  sectionTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, letterSpacing: -0.2, flexShrink: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, textDecorationLine: 'underline' },
  card: { borderWidth: 1, borderRadius: 10, padding: 13 },
  itemTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  itemSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },

  mileCard: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  mileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 37 },
  mileHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mileTag: { borderRadius: 9, paddingHorizontal: 7, height: 17, justifyContent: 'center' },
  mileTagText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, color: '#FFFFFF', letterSpacing: 0.2 },
  mileTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  mileSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 4 },
  calCircle: { width: 36.5, height: 36.5, borderRadius: 18.25, alignItems: 'center', justifyContent: 'center' },
  addDayCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 12, paddingRight: 10, paddingVertical: 12, marginTop: 12, gap: 12 },
  addDayTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  addDaySub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 17 },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, paddingHorizontal: 10, height: 36 },
  addDayBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },

  // Figma "Car Details Navigation": 393×50, padding 4/16/10, 4 between the pills (so a 36px pill).
  pills: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, gap: 4 },
  pill: { borderRadius: 18, paddingHorizontal: 13, height: 36, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },

  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 12 },
  tableLabelCol: { width: '52.2%', flexDirection: 'row', alignItems: 'center', gap: 7 },
  tableLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
  tableValue: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },

  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 37, height: 37, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },

  memberWrap: { borderWidth: 1, borderRadius: 16, padding: 8, paddingTop: 12 },
  planCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 10.5, paddingLeft: 8, paddingRight: 9, gap: 9 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, backgroundColor: '#FFFFFF' },
  radioOn: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8.5, flexWrap: 'wrap' },
  planName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  planOn: { shadowColor: '#6152D8', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  planRadio: { width: 15, height: 15, borderRadius: 7.5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  planRadioDot: { width: 5.5, height: 5.5, borderRadius: 3 },
  addedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, paddingHorizontal: 2 },
  addedText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16 },
  saveChip: { borderRadius: 10, paddingHorizontal: 8, height: 19.5, justifyContent: 'center', marginLeft: 0.5 },
  saveChipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8.5, color: '#FFFFFF' },
  planSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 6.5 },
  planPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15.5 },

  reviewCard: { width: 257, minHeight: 97, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 9.5 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  stars: { flexDirection: 'row', gap: 1.5 },
  reviewRating: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, marginLeft: 6.5, flex: 1 },
  reviewer: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, maxWidth: 110 },
  reviewText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, lineHeight: 17 },

  tripCard: { width: 216, height: 120, borderRadius: 10, overflow: 'hidden' },
  // Figma chip: 8 in from the corner, padding 4/9/4/8, 4 between the pin and the text, 0.6px white-12% border, radius 40.
  placeChip: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.6, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 40, overflow: 'hidden', paddingTop: 4, paddingRight: 9, paddingBottom: 4, paddingLeft: 8, height: 21.2, maxWidth: 200 },
  placeText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 8, lineHeight: 12, color: '#FFFFFF' },

  // Figma: two 172.5px columns 16 apart, rows 21 apart (17px lines + 4), 12px icon then 4 to the 11/16.5 text.
  featureGrid: { gap: 4 },
  featureRow: { flexDirection: 'row', gap: 16 },
  featureItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, flexShrink: 1 },

  // Figma "Why my Sawari": 361×307 border-box, padding 12/16/12/12, 12 between the title and the list.
  whyCard: { borderWidth: 1, borderRadius: 10, paddingTop: 12, paddingRight: 16, paddingBottom: 12, paddingLeft: 12, overflow: 'hidden' },
  whyThumb: { position: 'absolute', top: 0, right: -8.5, width: 4, borderRadius: 2, backgroundColor: '#A3A3A3' },
  whyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, marginBottom: 12 },
  whyRow: { flexDirection: 'row', gap: 8 },
  // Figma: a 24px badge with 4 above it (a 28px box), 8 before the text.
  whyCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  whyItemTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5 },
  whyItemDesc: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },

  // Figma "Location": 361×83 border-box, padding 10/12/12, 8 between the text and the map tile.
  locCard: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 83, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12 },
  // Figma: "Location" 15/22.5 weight 600, then the address 11/16.5 weight 500, 2 apart.
  locTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  locAddr: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, marginTop: 2 },
  mapTile: { width: 50, height: 50, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E8EFEA' },
  mapImage: { width: 50, height: 50 },

  tlRow: { flexDirection: 'row' },
  tlRail: { width: 22, alignItems: 'flex-start' },
  tlDot: { width: 10, height: 10, borderRadius: 5 },
  tlLine: { width: 1, flex: 1, marginLeft: 4.5 },
  tlHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tlTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  tlDesc: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },
  // Figma "Overlay": 20px pill, padding 4/8, text 8/12 weight 700.
  badge: { borderRadius: 24, paddingHorizontal: 8, height: 20, justifyContent: 'center' },
  badgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF' },
  // Figma Payment Schedule: padding 10/12/12, 6 between the heading and the rows.
  payCard: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12 },
  payHeading: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, marginBottom: 6 },
  payTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5 },
  payDesc: { fontSize: 11, lineHeight: 16.5 },

  // Figma Include/Exclude cards: padding 10/12/12, 12 between the title and the list; list text 13/20 weight 500.
  incCard: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12 },
  incHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  incTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 6 },
  bulletDot: { width: 3, height: 3, borderRadius: 1.5, marginTop: 8.5, marginRight: 9 },
  bulletText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },

  // Figma Q/A: 40px closed (padding 9/12), 86px open with a two-line answer (padding 8/12, 8 between the question and the answer).
  faq: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  faqA: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, marginTop: 8 },

  // Figma "Contact Section": 361×66 border-box, padding 10/12/12, a 42px row.
  helpCard: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, minHeight: 66 },
  helpTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  helpSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 6 },
  helpBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8.5 },
  checkbox: { width: 13, height: 13, borderRadius: 2.5, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', marginTop: 3.5 },
  agreeText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20 },
});