import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { formatTime12, getIndiaDateParts } from '@/utils/sawari';
import { Bolt, Lettering } from '@/components/home/FlashSaleBanner';
import type { NextFlashSale } from '@/services/api/offers';

/**
 * Figma "Default" (scheduled flash sale): what every customer sees before a flash sale opens. The cars stay hidden
 * (blurred photos), the times come from the scheduled offer: members get the first N minutes, then everyone.
 * Positions are the Figma frame's (393 wide, status bar 59): `dy` moves them with the real status bar height.
 */
const FONT = 'PlusJakartaSans_700Bold';
const GOLD = '#FBC422';
const FROST = 'rgba(89,89,89,0.32)';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z';

/** "Schedule on" + the day the members' window opens (India time): Today / Tomorrow / weekday / "22 Nov". */
function scheduleWords(ms: number): [string, string] {
  const day = (t: number) => { const p = getIndiaDateParts(t); return Date.UTC(p.year, p.month, p.date) / 86400000; };
  const ahead = day(ms) - day(Date.now());
  const p = getIndiaDateParts(ms);
  if (ahead <= 0) return ['Scheduled', 'Today'];
  if (ahead === 1) return ['Scheduled', 'Tomorrow'];
  if (ahead < 7) return ['Schedule on', WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()]];
  return ['Schedule on', `${p.date} ${MONTHS[p.month]}`];
}

function Sparkle({ size, left, top }: { size: number; left: number; top: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left, top }} pointerEvents="none">
      <Path d={STAR} fill={GOLD} />
    </Svg>
  );
}

/** A hidden car: its photo blurred, frosted, with a gold ring (Figma Ellipse 17/18/19). */
function Avatar({ uri, size, ring, left, top }: { uri?: string; size: number; ring: number; left: number; top: number }) {
  return (
    <View style={{ position: 'absolute', left: left - (ring - size) / 2, top: top - (ring - size) / 2, width: ring, height: ring, borderRadius: ring / 2, borderWidth: 1, borderColor: GOLD, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      {!!uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={14} transition={0} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: FROST }]} />
    </View>
  );
}

export function FlashSaleScheduled({ sale, isMember, dy }: { sale: NextFlashSale; isMember: boolean; dy: number }) {
  const router = useRouter();
  const opensMs = new Date(sale.startsAt).getTime();
  const early = sale.earlyAccessMinutes;
  const memberMs = opensMs - early * 60000;
  const [lead, dayWord] = scheduleWords(memberMs);
  const pics = sale.images;
  const pic = (i: number) => (pics.length ? pics[i % pics.length] : undefined);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Group 1171275693 (top 82): bolts around FLASH SALE, then the schedule line with the day underlined. */}
      <View style={[styles.titleRow, { top: 82 + dy }]} accessible accessibilityRole="header" accessibilityLabel={`Flash Sale. ${lead} ${dayWord}`}>
        <Bolt width={17.83} line={0.61} near={0.51} far={1.53} style={{ position: 'relative' }} />
        <Lettering text="FLASH SALE" size={34} shadow={{ dx: -3.44, dy: 3.44, color: '#FF008B' }} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
        <Bolt width={17.83} line={0.61} near={0.51} far={1.53} style={{ position: 'relative' }} />
      </View>
      <View style={[styles.scheduleRow, { top: 128 + dy }]} pointerEvents="none">
        <Lettering text={`${lead} `} size={34.5} shadow={{ dx: -1.15, dy: 1.15, color: '#000000' }} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
        <View>
          <Lettering text={dayWord} size={34.5} shadow={{ dx: -1.15, dy: 1.15, color: '#000000' }} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
          {/* Vector 3: white 2.29 line with a 1.15 black and 2.29 pink drop below */}
          <View style={styles.underline}>
            <View style={[styles.underBar, { top: 2.29, backgroundColor: '#FF008B' }]} />
            <View style={[styles.underBar, { top: 1.15, backgroundColor: '#000000' }]} />
            <View style={[styles.underBar, { top: 0, backgroundColor: '#FFFFFF' }]} />
          </View>
        </View>
      </View>

      {/* Frame 2147226234 (left 20, top 216): the locked ticket, then the membership button. */}
      <View style={[styles.ticketWrap, { top: 216 + dy }]}>
        <View style={styles.ticket}>
          <View style={styles.photo}>
            {!!pic(0) && <Image source={{ uri: pic(0) }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={25} transition={0} />}
          </View>
          {/* Subtract: the frosted layer over the whole ticket */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: FROST }]} pointerEvents="none" />
          <View style={styles.dash} />
          <View style={[styles.notch, { left: -14 }]} />
          <View style={[styles.notch, { right: -14 }]} />

          <View style={styles.memberCard}>
            {early > 0 ? (
              <Text style={styles.memberText}>
                Members Get {early} {early === 1 ? 'Minute' : 'Minutes'}.{'\n'}<Text style={{ color: '#3E2DC8' }}>Exclusive Access.</Text>
              </Text>
            ) : (
              <Text style={styles.memberText}>Opens to everyone at{'\n'}<Text style={{ color: '#3E2DC8' }}>{formatTime12(opensMs)}.</Text></Text>
            )}
          </View>

          <View style={styles.timeCard}>
            {early > 0 && (
              <View style={[styles.timeBox, styles.timeBoxMember]}>
                <Text style={styles.timeText} numberOfLines={1} adjustsFontSizeToFit>{formatTime12(memberMs)} – {formatTime12(opensMs)}</Text>
                <Text style={[styles.timeSub, { color: '#E58900', fontFamily: FONT }]} numberOfLines={1} adjustsFontSizeToFit>Exclusive Member Access</Text>
              </View>
            )}
            <View style={styles.timeBox}>
              <Text style={styles.timeText} numberOfLines={1} adjustsFontSizeToFit>{formatTime12(opensMs)} onwards</Text>
              <Text style={styles.timeSub} numberOfLines={1}>Open to Everyone</Text>
            </View>
          </View>
        </View>

        {isMember ? (
          <View style={styles.cta}>
            <Text style={styles.ctaText} numberOfLines={1} adjustsFontSizeToFit>Your early access opens at {formatTime12(memberMs)}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => { Haptics.selectionAsync(); router.push('/membership'); }}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaText} numberOfLines={1} adjustsFontSizeToFit>Get Membership & Unlock Early Access</Text>
          </Pressable>
        )}

        <Sparkle size={13.87} left={348} top={-9} />
        <Sparkle size={6.93} left={358.07} top={-14} />
        <Sparkle size={13.87} left={-8.87} top={-9} />
        <Sparkle size={6.93} left={-12} top={-14} />
      </View>

      {/* Group 1171275690: the hidden cars on a dashed arc at the bottom (Figma top 675 of 852 → bottom −158). */}
      <View style={styles.arc} pointerEvents="none">
        <Svg width={712} height={300} style={{ position: 'absolute', left: 0, top: 35 }}>
          <Ellipse cx={356} cy={150} rx={355.5} ry={149.5} stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeDasharray="6 6" fill="none" />
        </Svg>
        <View style={styles.arcAvatars}>
          <Avatar uri={pic(3)} size={40} ring={44} left={0} top={35} />
          <Avatar uri={pic(1)} size={44} ring={48} left={60} top={20} />
          <Avatar uri={pic(0)} size={52} ring={56} left={130} top={12} />
          <Avatar uri={pic(2)} size={44} ring={48} left={208} top={20} />
          <Avatar uri={pic(4)} size={40} ring={44} left={272} top={35} />
          <Image source={require('@/assets/images/crown_deal.png')} style={styles.crown} contentFit="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  scheduleRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  underline: { position: 'absolute', left: 7, right: 0, bottom: -4, height: 4.6 },
  underBar: { position: 'absolute', left: 0, right: 0, height: 2.29, borderRadius: 2 },
  ticketWrap: { position: 'absolute', alignSelf: 'center', width: 353, gap: 12 },
  ticket: { width: 353, height: 361, borderRadius: 16, borderWidth: 1, borderColor: GOLD, backgroundColor: '#FEFDF0', overflow: 'hidden' },
  photo: { position: 'absolute', left: 12, top: 12, width: 329, height: 212, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  dash: { position: 'absolute', left: 16.5, top: 240, width: 320, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(107,90,237,0.6)' },
  notch: { position: 'absolute', top: 225.38, width: 28.07, height: 27.92, borderRadius: 14, backgroundColor: '#3E2DC8', borderWidth: 1, borderColor: GOLD },
  memberCard: { position: 'absolute', left: 12, top: 148, width: 329, height: 76, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(251,196,34,0.52)', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  memberText: { fontFamily: FONT, fontSize: 17, lineHeight: 25.5, color: '#262626', textAlign: 'center' },
  timeCard: { position: 'absolute', left: 12, top: 256, width: 329, height: 93, flexDirection: 'row', gap: 4, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(251,196,34,0.52)', backgroundColor: '#FFFFFF' },
  timeBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  timeBoxMember: { backgroundColor: '#FEFEF5', borderWidth: 1, borderColor: 'rgba(251,196,34,0.52)', borderRadius: 6 },
  timeText: { fontFamily: FONT, fontSize: 13, lineHeight: 19.5, color: '#262626' },
  timeSub: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, color: '#737373' },
  cta: { height: 46, borderRadius: 12, borderWidth: 2, borderColor: GOLD, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  ctaText: { fontFamily: FONT, fontSize: 17, lineHeight: 25.5, color: '#3E2DC8', textAlign: 'center' },
  arc: { position: 'absolute', bottom: -158, alignSelf: 'center', width: 712, height: 335 },
  arcAvatars: { position: 'absolute', left: (712 - 312) / 2, top: 0, width: 312, height: 86 },
  crown: { position: 'absolute', left: 130, top: 0, width: 20, height: 20, transform: [{ rotate: '-24.98deg' }] },
});
