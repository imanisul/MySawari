import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
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
  const c = useColors();
  const tone: Record<TagKind, { bg: string; fg: string }> = {
    upcoming: { bg: c.lightBlue, fg: c.blue },
    pending: { bg: c.warning + '1F', fg: c.warning },
    active: { bg: c.primary, fg: c.primaryForeground },
    overdue: { bg: c.destructive + '1F', fg: c.destructive },
    completed: { bg: c.success + '1F', fg: c.success },
    cancelled: { bg: c.destructive + '1F', fg: c.destructive },
  };
  return (
    <View style={[styles.tag, { backgroundColor: tone[kind].bg }]}>
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
  const c = useColors();
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
              <Text style={[styles.meta, { color: c.mutedForeground }]}>{booking.driverMode || 'Self Drive'}</Text>
              <View style={[styles.dot, { backgroundColor: c.mutedForeground }]} />
              <Text style={[styles.meta, { color: c.mutedForeground }]}>{days} day{days === 1 ? '' : 's'}</Text>
            </View>
            {compact && (
              <Text style={[styles.meta, { color: c.mutedForeground }]}>
                Pickup: {shortDate(booking.pickupDate)}, {booking.pickupTime || '10:00 AM'}
              </Text>
            )}
          </View>
          <View style={[styles.idChip, { backgroundColor: c.muted }]}>
            <Text style={[styles.idText, { color: c.foreground }]} numberOfLines={1}>
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
  const box = [styles.card, { backgroundColor: c.card, borderColor: c.border }];
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
  const c = useColors();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
      {!!linkLabel && (
        <Pressable onPress={onLink} hitSlop={8} style={styles.linkRow}>
          <Text style={[styles.link, { color: c.blue }]}>{linkLabel}</Text>
          <Feather name="chevron-right" size={13} color={c.blue} />
        </Pressable>
      )}
    </View>
  );
}

// ── Vertical timeline (used for the trip and for the refund) ─────────────────

export type TimelineStep = { title: string; lines: string[]; done: boolean; tone?: 'danger' };

export function Timeline({ steps, boxed = true }: { steps: TimelineStep[]; boxed?: boolean }) {
  const c = useColors();
  return (
    <View style={boxed ? [styles.box, { backgroundColor: c.card, borderColor: c.border }] : undefined}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const fill = s.tone === 'danger' ? c.destructive : s.done ? c.success : 'transparent';
        const ring = s.tone === 'danger' ? c.destructive : s.done ? c.success : c.mutedForeground;
        return (
          <View key={`${s.title}-${i}`} style={styles.stepRow}>
            <View style={styles.rail}>
              <View style={[styles.stepDot, { backgroundColor: fill, borderColor: ring }]} />
              {!last && <View style={[styles.railLine, { backgroundColor: s.done ? c.success : c.border }]} />}
            </View>
            <View style={[styles.stepBody, !last && { paddingBottom: 12 }]}>
              <Text style={[styles.stepTitle, { color: s.tone === 'danger' ? c.destructive : c.foreground }]}>{s.title}</Text>
              {s.lines.filter(Boolean).map((l, j) => (
                <Text key={j} style={[styles.stepLine, { color: c.mutedForeground }]}>{l}</Text>
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
  const pickedUp = booking.status === 'ONGOING' || booking.status === 'COMPLETED';
  const dropped = booking.status === 'COMPLETED';
  const steps: TimelineStep[] = [
    {
      title: pickedUp ? 'Pickup - Completed' : 'Pickup',
      lines: [`${shortDate(booking.pickupDate)}  ·  ${booking.pickupTime || '10:00 AM'}`, placeName(booking.pickupLocationName)],
      done: pickedUp,
    },
  ];
  if (booking.destination) steps.push({ title: 'Destination', lines: [booking.destination], done: dropped });
  steps.push({
    title: dropped ? 'Drop-off - Completed' : 'Drop-off',
    lines: [`${shortDate(booking.returnDate)}  ·  ${booking.dropTime || '10:00 AM'}`, placeName(booking.dropLocationName || booking.dropoffLocationName)],
    done: dropped,
  });
  return <Timeline steps={steps} />;
}

/** Request received → Refund approved → Refund completed, driven by the refund record from the server. */
export function RefundTimeline({ booking }: { booking: BookingSnapshot }) {
  const st = String(booking.pendingRefund?.status || booking.refundStatus || 'pending').toLowerCase();
  const approved = st === 'approved' || st === 'refunded' || st === 'completed' || st === 'processed';
  const refunded = st === 'refunded' || st === 'completed' || st === 'processed';
  const rejected = st === 'rejected';
  const steps: TimelineStep[] = [
    { title: 'Request Received', lines: ['Your cancellation request has been received.'], done: true },
    rejected
      ? { title: 'Refund Rejected', lines: [booking.pendingRefund?.rejectionReason || 'Your refund request was not approved.'], done: true, tone: 'danger' }
      : { title: 'Refund Approved', lines: [approved ? 'Your refund has been approved.' : 'Your cancellation request will be reviewed.'], done: approved },
  ];
  if (!rejected) {
    steps.push({ title: 'Refund Completed', lines: ['Your refund has reached your original payment method.'], done: refunded });
  }
  return <Timeline steps={steps} boxed={false} />;
}

// ── Pricing summary ──────────────────────────────────────────────────────────

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.priceRow}>
      <Text style={[strong ? styles.rowStrong : styles.rowLabel, { color: strong ? c.foreground : c.mutedForeground, flex: 1 }]}>{label}</Text>
      <Text style={[strong ? styles.rowStrong : styles.rowValue, { color: accent ? c.success : c.foreground }]}>{value}</Text>
    </View>
  );
}

export function PricingSummary({ booking }: { booking: BookingSnapshot }) {
  const c = useColors();
  const b = booking;
  const cancelled = b.status === 'CANCELLED' || b.status === 'FAILED';
  const total = tripTotal(b);
  const atPickup = Math.max(0, total - b.onlinePayableNow);
  const paidAtPickup = b.status === 'COMPLETED' || (b.status === 'ONGOING' && b.remainingRentalAmount <= 0);
  const minus = (n?: number) => `−${rupees(n)}`;
  return (
    <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border, gap: 0 }]}>
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
      <View style={[styles.hr, { backgroundColor: c.border }]} />
      <Row label="Total trip cost" value={rupees(total)} strong />
      <View style={[styles.hr, { backgroundColor: c.border }]} />
      <View style={{ gap: 12 }}>
        <Row label="Booking amount paid" value={rupees(b.onlinePayableNow)} />
        {cancelled ? (
          <>
            {(b.cancellationFee || 0) > 0 && <Row label="Cancellation fee" value={rupees(b.cancellationFee)} />}
            <Row label="Refund amount" value={rupees(b.refundAmount)} accent={(b.refundAmount || 0) > 0} />
          </>
        ) : (
          <Row label={paidAtPickup ? 'Paid at pickup' : 'Pay at pickup'} value={rupees(paidAtPickup ? atPickup : b.remainingRentalAmount)} />
        )}
      </View>
      {!cancelled && (
        b.remainingRentalAmount > 0 && !paidAtPickup ? (
          <>
            <View style={[styles.payBadge, { backgroundColor: c.warning + '14' }]}>
              <Feather name="clock" size={18} color={c.warning} />
              <Text style={[styles.payBadgeText, { color: c.warning }]}>Payment due at pickup</Text>
            </View>
            <Text style={[styles.payNote, { color: c.mutedForeground }]}>
              Pay {rupees(b.remainingRentalAmount)} when you collect your vehicle.
            </Text>
          </>
        ) : (
          <View style={[styles.payBadge, { backgroundColor: c.success + '14', marginBottom: 0 }]}>
            <Feather name="check-circle" size={18} color={c.success} />
            <Text style={[styles.payBadgeText, { color: c.success }]}>Payment completed</Text>
          </View>
        )
      )}
    </View>
  );
}

// ── Tappable info row ("Need to change your plans…  >") ──────────────────────

export function ActionRow({ title, subtitle, onPress, icon = 'chevron-right' }: { title: string; subtitle?: string; onPress?: () => void; icon?: any }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.box, styles.actionRow, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.actionTitle, { color: c.foreground }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.stepLine, { color: c.mutedForeground }]}>{subtitle}</Text>}
      </View>
      <Feather name={icon} size={16} color={c.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, height: 18, justifyContent: 'center' },
  tagText: { fontFamily: FONT.semibold, fontSize: 11 },

  card: { borderWidth: 1, borderRadius: 16, padding: 9 },
  cardRow: { flexDirection: 'row', gap: 12 },
  carBox: { width: 120, borderRadius: 12, overflow: 'hidden' },
  cardInfo: { flex: 1, minWidth: 0, paddingVertical: 2, justifyContent: 'space-between', gap: 6 },
  carName: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 20 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  meta: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 17 },
  idChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, height: 22, justifyContent: 'center', maxWidth: '100%' },
  idText: { fontFamily: FONT.medium, fontSize: 12 },
  price: { fontFamily: FONT.bold, fontSize: 14, lineHeight: 17 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 23 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { fontFamily: FONT.medium, fontSize: 13 },

  box: { borderWidth: 1, borderRadius: 16, padding: 13 },
  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 11, alignItems: 'center', paddingTop: 3 },
  stepDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5 },
  railLine: { flex: 1, width: 1.5, marginTop: 2, marginBottom: -1 },
  stepBody: { flex: 1, minWidth: 0 },
  stepTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 17 },
  stepLine: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 17 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 17 },
  rowValue: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 17, fontVariant: ['tabular-nums'] },
  rowStrong: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20 },
  hr: { height: 1, marginVertical: 12 },
  payBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, height: 38, marginTop: 12 },
  payBadgeText: { fontFamily: FONT.semibold, fontSize: 14 },
  payNote: { fontFamily: FONT.regular, fontSize: 13, textAlign: 'center', marginTop: 12 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 17 },
});