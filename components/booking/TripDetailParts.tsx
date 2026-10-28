import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SUPPORT_PHONE } from '@/constants/support';
import { useTripColors } from '@/components/booking/tripColors';
import { BookingSnapshot } from '@/services/backend/api';
import { MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { LoadingImage } from '@/components/common/LoadingImage';

/**
 * Shared building blocks for the Booking flow (Figma "Booking" section): the booking card, status tag,
 * trip timeline, refund timeline and pricing summary. Used by BookingsScreen, BookingDetailScreen and
 * CancelBookingSheet so every screen draws them the same way.
 */

export const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const rupees = (n: number | undefined | null) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** "Office" (or nothing) means the customer collects / returns the vehicle at the hub. */
export const placeName = (name?: string) => (!name || name === 'Office' ? MYSAWARI_HUB_NAME : name);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "13 Oct 2026" or "13 Oct" -> "13 Oct" (the year is not shown on these screens). */
export const shortDate = (label?: string) => {
  if (!label) return '—';
  const parts = label.trim().split(' ');
  return parts.length >= 2 ? `${parts[0]} ${parts[1].slice(0, 3)}` : label;
};

/** Pickup moment from the booking's date label + time ("10:00 AM"). Null when it can't be read. */
export function pickupMoment(b: Pick<BookingSnapshot, 'pickupDate' | 'pickupTime'>): Date | null {
  const parts = (b.pickupDate || '').trim().split(' ');
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTHS.indexOf(parts[1].slice(0, 3));
  if (isNaN(day) || month === -1) return null;
  const year = parts[2] && /^\d{4}$/.test(parts[2]) ? parseInt(parts[2], 10) : new Date().getFullYear();
  const d = new Date(year, month, day, 10, 0, 0, 0);
  const m = (b.pickupTime || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const ap = m[3]?.toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    d.setHours(h, parseInt(m[2], 10));
  }
  return d;
}

/** The cancellation rule the app already used: a full refund of the booking amount 24 h or more before pickup. */
export function refundQuote(b: BookingSnapshot) {
  const at = pickupMoment(b);
  const hours = at ? (at.getTime() - Date.now()) / 3600000 : 0;
  const eligible = hours >= 24;
  return { eligible, refund: eligible ? b.onlinePayableNow : 0, fee: eligible ? 0 : b.onlinePayableNow };
}

/** Whole trip cost after discounts = booking amount + what is (or was) paid at pickup. */
/** "with-driver" / "With Driver" → "With Driver"; anything else is a self-drive trip. */
export const driverLabel = (mode?: string) => (/with/i.test(mode || '') ? 'With Driver' : 'Self Drive');

export function tripTotal(b: BookingSnapshot) {
  return Math.max(b.onlinePayableNow + b.remainingRentalAmount, b.totalCollected || 0);
}

// ── Status tag ────────────────────────────────────────────────────────────────

export type TagKind = 'upcoming' | 'pending' | 'active' | 'overdue' | 'completed' | 'cancelled';

export function tagFor(b: BookingSnapshot): TagKind {
  if (b.status === 'ONGOING') return b.rawEndDate && new Date() > new Date(b.rawEndDate) ? 'overdue' : 'active';
  if (b.status === 'COMPLETED') return 'completed';
  if (b.status === 'CANCELLED' || b.status === 'FAILED') return 'cancelled';
  if (b.status === 'PENDING') return 'pending';
  return 'upcoming';
}

const TAG_LABEL: Record<TagKind, string> = {
  upcoming: 'Upcoming', pending: 'Pending', active: 'Active', overdue: 'Overdue', completed: 'Completed', cancelled: 'Cancelled',
};

export function StatusTag({ kind }: { kind: TagKind }) {
  const c = useTripColors();
  // Figma: Active green, Upcoming navy (filled); Completed navy outline; Cancelled grey outline.
  const tone: Record<TagKind, { bg: string; fg: string; border?: string }> = {
    upcoming: { bg: c.navy, fg: '#FFFFFF' },
    pending: { bg: c.warning + '1F', fg: c.warning },
    active: { bg: c.success, fg: '#FFFFFF' },
    overdue: { bg: c.destructive, fg: '#FFFFFF' },
    completed: { bg: c.background, fg: c.navy, border: c.navy },
    cancelled: { bg: c.background, fg: c.mutedForeground, border: '#D4D4D4' },
  };
  return (
    <View style={[styles.tag, { backgroundColor: tone[kind].bg, borderColor: tone[kind].border || tone[kind].bg }]}>
      <Text style={[styles.tagText, { color: tone[kind].fg }]}>{TAG_LABEL[kind]}</Text>
    </View>
  );
}

// ── Booking card (image + name + mode · days + booking ID + price) ───────────

export function BookingCard({
  booking, image, compact, showPrice = true, footer, onPress,
}: {
  booking: BookingSnapshot;
  image?: any;
  /** Cancellation-request variant: shorter image, pickup line instead of tag and price. */
  compact?: boolean;
  showPrice?: boolean;
  footer?: React.ReactNode;
  onPress?: () => void;
}) {
  const c = useTripColors();
  const days = booking.rentalDays || 1;
  const body = (
    <>
      <View style={styles.cardRow}>
        <View style={[styles.carBox, { height: compact ? 86 : 116, backgroundColor: c.muted }]}>
          {image ? (
            <LoadingImage source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <View style={styles.center}><Feather name="truck" size={28} color={c.mutedForeground} /></View>
          )}
        </View>
        <View style={[styles.cardInfo, { minHeight: compact ? 86 : 116 }]}>
          {!compact && <StatusTag kind={tagFor(booking)} />}
          <View style={{ gap: 0 }}>
            <Text style={[styles.carName, { color: c.foreground }]} numberOfLines={1}>{booking.vehicleName}</Text>
            <View style={styles.dotRow}>
              <Text style={[styles.meta, { color: c.mutedForeground }]}>{driverLabel(booking.driverMode)}</Text>
              <View style={[styles.dot, { backgroundColor: c.mutedForeground }]} />
              <Text style={[styles.meta, { color: c.mutedForeground }]}>{days} day{days === 1 ? '' : 's'}</Text>
            </View>
            {compact && (
              <Text style={[styles.meta, { color: c.mutedForeground }]}>
                Pickup: {shortDate(booking.pickupDate)}, {booking.pickupTime || '10:00 AM'}
              </Text>
            )}
          </View>
          <View style={[styles.idChip, { backgroundColor: c.segBorder }]}>
            <Text style={[styles.idText, { color: c.navy }]} numberOfLines={1}>
              Booking ID: {booking.bookingCode || booking.id.slice(-6).toUpperCase()}
            </Text>
          </View>
          {!compact && showPrice && (
            <Text style={[styles.price, { color: c.foreground }]}>{rupees(tripTotal(booking))}</Text>
          )}
        </View>
      </View>
      {footer}
    </>
  );
  const box = [styles.card, { backgroundColor: c.background, borderColor: c.segBorder }];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [box, { opacity: pressed ? 0.85 : 1 }]} accessibilityRole="button">
      {body}
    </Pressable>
  ) : (
    <View style={box}>{body}</View>
  );
}

// ── Section heading ("Your trip"  ·  "Pricing Summary >") ─────────────────────

export function SectionTitle({ title, linkLabel, onLink }: { title: string; linkLabel?: string; onLink?: () => void }) {
  const c = useTripColors();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
      {!!linkLabel && (
        <Pressable onPress={onLink} hitSlop={8} style={styles.linkRow}>
          <Text style={[styles.link, { color: c.mutedForeground }]}>{linkLabel}</Text>
          <Feather name="chevron-down" size={13} color={c.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

// ── Vertical timeline (used for the trip and for the refund) ─────────────────

export type TimelineStep = { title: string; lines: string[]; done: boolean; tone?: 'danger'; /** Ring colour once done (default navy). */ color?: string };
const IDLE = '#D4D4D4';

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  const c = useTripColors();
  return (
    <View style={{ gap: 12 }}>
      {steps.map((st, i) => {
        const first = i === 0;
        const last = i === steps.length - 1;
        // Figma: 11px ring dots (white centre; navy-ish once reached, light grey while waiting). The dashed line only
        // joins a reached step to the next one, so nothing is drawn below a step that is still waiting.
        const dot = st.tone === 'danger' ? c.destructive : st.done ? (st.color || c.navy) : IDLE;
        const lineDown = st.done && !last;
        const lineUp = !first && !!steps[i - 1].done;
        return (
          <View key={`${st.title}-${i}`} style={styles.refundRow}>
            {lineDown && (
              <View style={[styles.refundLine, { top: '50%', bottom: -12 }]} pointerEvents="none">
                {Array.from({ length: 30 }, (_, k) => <View key={k} style={styles.stopsBit} />)}
              </View>
            )}
            {lineUp && (
              <View style={[styles.refundLine, { top: 0, bottom: '50%' }]} pointerEvents="none">
                {Array.from({ length: 30 }, (_, k) => <View key={k} style={styles.stopsBit} />)}
              </View>
            )}
            <View style={[styles.stopRing, { borderColor: dot, backgroundColor: c.card }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.refundTitle, { color: st.tone === 'danger' ? c.destructive : c.foreground }]}>{st.title}</Text>
              {st.lines.filter(Boolean).map((l, j) => (
                <Text key={j} style={[styles.refundLineText, { color: c.mutedForeground }]}>{l}</Text>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Pickup → Destination → Drop-off, with "- Completed" once the ops team has handed over / taken back the car. */
export function TripTimeline({ booking }: { booking: BookingSnapshot }) {
  const c = useTripColors();
  const pickedUp = booking.status === 'ONGOING' || booking.status === 'COMPLETED';
  const dropped = booking.status === 'COMPLETED';
  // Figma: filled 11px dots (navy once done, green destination, grey while waiting) on one dashed line.
  const stops = [
    { title: pickedUp ? 'Pickup - Completed' : 'Pickup', date: shortDate(booking.pickupDate), time: booking.pickupTime || '10:00 AM', place: placeName(booking.pickupLocationName), color: pickedUp ? c.navy : IDLE },
    ...(booking.destination ? [{ title: 'Destination', date: '', time: '', place: booking.destination, color: pickedUp ? '#008758' : IDLE }] : []),
    { title: dropped ? 'Drop-off - Completed' : 'Drop-off', date: shortDate(booking.returnDate), time: booking.dropTime || '10:00 AM', place: placeName(booking.dropLocationName || booking.dropoffLocationName), color: dropped ? c.navy : IDLE },
  ];
  return (
    <View style={[styles.stops, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* From the first dot's centre to the last one's (both rows are 51px tall). */}
      <View style={styles.stopsLine} pointerEvents="none">
        {Array.from({ length: 40 }, (_, k) => <View key={k} style={styles.stopsBit} />)}
      </View>
      {stops.map((st) => (
        <View key={st.title} style={styles.stop}>
          <View style={[styles.stopDot, { backgroundColor: st.color }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.stopTitle, { color: c.foreground }]}>{st.title}</Text>
            {!!st.date && (
              <View style={styles.stopWhen}>
                <Text style={[styles.stopLine, { color: c.mutedForeground }]}>{st.date}</Text>
                <View style={[styles.stopSep, { backgroundColor: c.mutedForeground }]} />
                <Text style={[styles.stopLine, { color: c.mutedForeground }]}>{st.time}</Text>
              </View>
            )}
            <Text style={[styles.stopLine, { color: c.mutedForeground }]} numberOfLines={1}>{st.place}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Where a cancelled booking's refund stands, from the refund record on the server. */
export function refundStage(b: BookingSnapshot): 'none' | 'received' | 'approved' | 'refunded' | 'rejected' {
  if (!((b.refundAmount || 0) > 0) && !b.pendingRefund) return 'none';
  const st = String(b.pendingRefund?.status || b.refundStatus || 'pending').toLowerCase();
  if (st === 'rejected') return 'rejected';
  if (st === 'refunded' || st === 'completed' || st === 'processed') return 'refunded';
  if (st === 'approved') return 'approved';
  return 'received';
}

/** Request received → Refund approved → Refund completed (design), driven by the refund record from the server. */
export function RefundTimeline({ booking }: { booking: BookingSnapshot }) {
  const stage = refundStage(booking);
  const RECEIVED = '#596591';
  // Cancelled with nothing to refund (less than 24 hours before pickup): no refund steps to wait for.
  if (stage === 'none') {
    return (
      <Timeline
        steps={[
          { title: 'Request Received', lines: ['Your cancellation request has been received.'], done: true, color: RECEIVED },
          { title: 'No refund due', lines: [`Cancelled less than 24 hours before pickup, so the ${rupees(booking.onlinePayableNow)} booking amount is non-refundable.`], done: true, color: '#A3A3A3' },
        ]}
      />
    );
  }
  const approved = stage === 'approved' || stage === 'refunded';
  const refunded = stage === 'refunded';
  const rejected = stage === 'rejected';
  const steps: TimelineStep[] = [
    { title: 'Request Received', lines: ['Your cancellation request has been received.'], done: true, color: RECEIVED },
    rejected
      ? { title: 'Refund Rejected', lines: [booking.pendingRefund?.rejectionReason || 'Your refund request was not approved.'], done: true, tone: 'danger' }
      : { title: 'Refund Approved', lines: [approved ? 'Your refund has been approved.' : 'Your cancellation request will be reviewed.'], done: approved },
  ];
  if (!rejected) {
    steps.push({ title: 'Refund Completed', lines: ['Your refund has reached your original payment method.'], done: refunded, color: '#008758' });
  }
  return <Timeline steps={steps} />;
}

// ── Pricing summary ──────────────────────────────────────────────────────────

function Row({ label, value, strong, accent, quiet }: { label: string; value: string; strong?: boolean; accent?: boolean; quiet?: boolean }) {
  const c = useTripColors();
  return (
    <View style={styles.priceRow}>
      <Text style={[strong ? styles.rowStrongLabel : styles.rowLabel, { color: c.mutedForeground, flex: 1 }]}>{label}</Text>
      <Text style={[strong ? styles.rowStrongValue : styles.rowValue, { color: accent ? c.success : strong || quiet ? c.mutedForeground : c.foreground }]}>{value}</Text>
    </View>
  );
}

/** Figma dashed 1px divider (a 2px dashed box clipped to its top edge). */
function Dash() {
  return (
    <View style={{ height: 1, overflow: 'hidden' }}>
      <View style={{ height: 2, borderWidth: 1, borderStyle: 'dashed', borderColor: '#BFC3D4' }} />
    </View>
  );
}

export function PricingSummary({ booking }: { booking: BookingSnapshot }) {
  const c = useTripColors();
  const b = booking;
  const cancelled = b.status === 'CANCELLED' || b.status === 'FAILED';
  const total = tripTotal(b);
  const atPickup = Math.max(0, total - b.onlinePayableNow);
  const paidAtPickup = b.status === 'COMPLETED' || (b.status === 'ONGOING' && b.remainingRentalAmount <= 0);
  const minus = (n?: number) => `−${rupees(n)}`;
  return (
    <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border, borderRadius: 8, gap: 12 }]}>
      <View style={{ gap: 10 }}>
        <Row label={`Rental charges (${b.dailyRate.toLocaleString('en-IN')} x ${b.rentalDays} day${b.rentalDays === 1 ? '' : 's'})`} value={rupees(b.rentalAmount)} />
        {(b.driverCharge || 0) > 0 && <Row label="Driver charges" value={rupees(b.driverCharge)} />}
        {(b.pickupCharge || 0) > 0 && <Row label={`Pickup service${b.pickupDistanceKm ? ` (${b.pickupDistanceKm} km)` : ''}`} value={rupees(b.pickupCharge)} />}
        {(b.dropCharge || 0) > 0 && <Row label={`Drop service${b.dropDistanceKm ? ` (${b.dropDistanceKm} km)` : ''}`} value={rupees(b.dropCharge)} />}
        {(b.fastagAmount || 0) > 0 && <Row label="FASTag" value={rupees(b.fastagAmount)} />}
        {(b.securityDeposit || 0) > 0 && <Row label="Security deposit" value={rupees(b.securityDeposit)} />}
        {(b.membershipDiscount || 0) > 0 && <Row label="Membership discount" value={minus(b.membershipDiscount)} accent />}
        {(b.couponDiscount || 0) > 0 && <Row label={`Coupon discount${b.couponCode ? ` (${b.couponCode})` : ''}`} value={minus(b.couponDiscount)} accent />}
        {(b.manualDiscount || 0) > 0 && <Row label="Special discount" value={minus(b.manualDiscount)} accent />}
        {(b.sawariCashUsed || 0) > 0 && <Row label="SawariCash" value={minus(b.sawariCashUsed)} accent />}
      </View>
      <Dash />
      <Row label="Total trip cost" value={rupees(total)} strong />
      <Dash />
      <Row label="Booking amount paid" value={rupees(b.onlinePayableNow)} quiet />
      {cancelled ? (
        <>
          {(b.cancellationFee || 0) > 0 && <Row label="Cancellation fee" value={rupees(b.cancellationFee)} quiet />}
          <Row label="Refund amount" value={rupees(b.refundAmount)} accent={(b.refundAmount || 0) > 0} quiet />
        </>
      ) : (
        <Row label={paidAtPickup ? 'Paid at pickup' : 'Pay at pickup'} value={rupees(paidAtPickup ? atPickup : b.remainingRentalAmount)} quiet />
      )}
      {!cancelled && (
        b.remainingRentalAmount > 0 && !paidAtPickup ? (
          <>
            <View style={[styles.payBadge, { backgroundColor: c.background, borderWidth: 1, borderColor: c.segBorder, height: 38 }]}>
              <Feather name="clock" size={20} color={c.foreground} />
              <Text style={[styles.payBadgeText, { color: c.foreground }]}>Payment due at pickup</Text>
            </View>
            <Text style={[styles.payNote, { color: c.mutedForeground }]}>
              Pay {rupees(b.remainingRentalAmount)} when you collect your vehicle.
            </Text>
          </>
        ) : (
          <View style={[styles.payBadge, { backgroundColor: c.success + '1A' }]}>
            <Feather name="check-circle" size={20} color={c.success} />
            <Text style={[styles.payBadgeText, { color: c.success }]}>Payment completed</Text>
          </View>
        )
      )}
    </View>
  );
}

// ── Tappable info row ("Need to change your plans…  >") ──────────────────────

export function ActionRow({ title, subtitle, onPress, icon = 'chevron-right' }: { title: string; subtitle?: string; onPress?: () => void; icon?: any }) {
  const c = useTripColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.box, styles.actionRow, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4', opacity: pressed ? 0.85 : 1 }]}>
      <View style={{ flex: 1, gap: 0 }}>
        <Text style={[styles.actionTitle, { color: c.foreground }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.stepLine, { color: c.mutedForeground }]}>{subtitle}</Text>}
      </View>
      <Feather name={icon} size={16} color={c.mutedForeground} />
    </Pressable>
  );
}

/** Figma "Contact Section": green-to-white card with round Call and WhatsApp buttons. */
export function HelpCard({ onWhatsApp, compact }: { onWhatsApp: () => void; /** Sheet variant: 8px top/bottom padding. */ compact?: boolean }) {
  const c = useTripColors();
  // linear-gradient(262.31deg, #E6F3EE 40.76%, #FFFFFF 104.76%): runs right to left; the stop at 100% is #FDFEFE.
  return (
    <LinearGradient colors={['#E6F3EE', '#E6F3EE', '#FDFEFE']} locations={[0, 0.4076, 1]} start={{ x: 1, y: 0.4 }} end={{ x: 0, y: 0.6 }} style={[styles.help, compact && { paddingVertical: 8 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.actionTitle, { color: c.foreground }]}>Need help with your booking?</Text>
        <Text style={[styles.stepLine, { color: c.mutedForeground }]}>Have a question? We’re here to help</Text>
      </View>
      <View style={styles.helpBtns}>
        <Pressable accessibilityRole="button" accessibilityLabel="Call support" onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {})} hitSlop={4} style={[styles.round, { backgroundColor: c.navy }]}>
          <FontAwesome name="phone" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="WhatsApp support" onPress={onWhatsApp} hitSlop={4} style={[styles.round, { backgroundColor: '#25D366' }]}>
          <FontAwesome name="whatsapp" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 0.8, paddingHorizontal: 8, height: 18, justifyContent: 'center' },
  tagText: { fontFamily: FONT.semibold, fontSize: 8, lineHeight: 12 },

  card: { borderWidth: 1, borderRadius: 12, padding: 8 },
  cardRow: { flexDirection: 'row', gap: 12 },
  carBox: { width: 120, borderRadius: 6, overflow: 'hidden' },
  cardInfo: { flex: 1, minWidth: 0, paddingTop: 2, paddingBottom: 2, paddingRight: 4, gap: 6 },
  carName: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  meta: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  idChip: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, height: 22, justifyContent: 'center', maxWidth: '100%' },
  idText: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 16 },
  price: { fontFamily: FONT.bold, fontSize: 11, lineHeight: 17 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17, textDecorationLine: 'underline' },

  box: { borderWidth: 1, borderRadius: 12, padding: 12 },
  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center', paddingTop: 3 },
  stepDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5 },
  // Absolutely placed so the dashes never make a step taller than its text.
  railDash: { position: 'absolute', top: 18, bottom: -1, left: 0, right: 0, alignItems: 'center', gap: 2.5, overflow: 'hidden' },
  railBit: { width: 1.5, height: 3.5, borderRadius: 1 },
  stepBody: { flex: 1, minWidth: 0 },
  stepTitle: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 },
  stepLine: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },

  stops: { borderWidth: 1, borderRadius: 12, padding: 8, gap: 8 },
  stopsLine: { position: 'absolute', left: 13, top: 33.5, bottom: 33.5, width: 1, overflow: 'hidden', gap: 3 },
  stopsBit: { width: 1, height: 4, backgroundColor: '#9FA6C0' },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  refundRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  refundLine: { position: 'absolute', left: 5, width: 1, overflow: 'hidden', gap: 3, opacity: 0.9 },
  stopDot: { width: 11, height: 11, borderRadius: 6 },
  // Figma refund timeline: 11px ring, 2.5px border, white centre.
  stopRing: { width: 11, height: 11, borderRadius: 6, borderWidth: 2.5 },
  refundTitle: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 18 },
  refundLineText: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 16 },
  stopTitle: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17 },
  stopWhen: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stopSep: { width: 3, height: 3, borderRadius: 2 },
  stopLine: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  rowValue: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17, textAlign: 'right', fontVariant: ['tabular-nums'] },
  rowStrongLabel: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 20 },
  rowStrongValue: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20, textAlign: 'right', fontVariant: ['tabular-nums'] },
  payBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, height: 36 },
  payBadgeText: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  payNote: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17, textAlign: 'center' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8 },
  help: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E6F3EE', borderRadius: 8, padding: 12 },
  helpBtns: { flexDirection: 'row', gap: 8 },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17 },
});