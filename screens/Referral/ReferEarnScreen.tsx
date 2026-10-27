import React, { useEffect, useMemo, useState } from 'react';
import { BlurHost, BlurTarget, BottomBlur } from '@/components/common/BottomBlur';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, Linking, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginBottomSheet } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { FaqList } from '@/components/vehicle/details/CarDetailsSections';
import { PF } from '@/components/profile/ProfileParts';

const REFERRAL_BASE_URL = 'https://mysawari.com/refer';
const PURPLE = '#6152D8';

/** Light rays fanning out from below the avatars (design hero). */
function Rays({ width, height, cy }: { width: number; height: number; cy: number }) {
  const cx = width / 2;
  const n = 22;
  const R = Math.max(width, height) * 1.4;
  const paths = Array.from({ length: n }, (_, i) => {
    const a0 = (Math.PI * 2 * i) / n;
    const a1 = a0 + Math.PI / n / 1.6;
    return `M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} L${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`;
  });
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {paths.map((d, i) => <Path key={i} d={d} fill="#FFFFFF" opacity={0.08} />)}
    </Svg>
  );
}

/**
 * Figma "Refer & Earn": hero ("Invite Friends. Earn 10% Back."), How It Works, a link to the referral history,
 * FAQs, then the invite link (copy) with "Share via WhatsApp" and the system share sheet. The reward and the
 * friend's discount come from the server's app config.
 */
export default function ReferEarnScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { customer, isAuthenticated, updateCustomer } = useSawari();
  const [config, setConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    API.getAppConfig().then(setConfig).catch(() => { });
    // Older saved profiles may lack the code: take it from the server.
    if (isAuthenticated && customer.id && !customer.referralCode) {
      API.getUserProfile(customer.id).then((pr: any) => {
        if (typeof pr?.referralCode === 'string' && pr.referralCode) updateCustomer('referralCode', pr.referralCode);
      }).catch(() => { });
    }
  }, [isAuthenticated, customer.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const code = customer.referralCode || '';
  const link = `${REFERRAL_BASE_URL}?code=${code}`;
  const shortLink = link.replace(/^https?:\/\//, '');
  const pct = config?.referralRewardType === 'PERCENTAGE' && config?.referralRewardAmount ? `${config.referralRewardAmount}%` : '10%';
  const friendGets = config?.referralDiscountType === 'FLAT' && config?.referralDiscountAmount ? `₹${config.referralDiscountAmount}` : '₹100';
  const message = `🚗 Join me on MySawari! Use my code *${code}* when you sign up and get ${friendGets} off your first trip.\n\n${link}`;

  const faqs = useMemo(() => [
    { q: 'How does the Refer & Earn program work?', a: `Share your link or code. When your friend signs up with it and completes their first trip, you get ${pct} of their trip amount as MySawari Cash.` },
    { q: 'Who is eligible for the referral offer?', a: 'Anyone new to MySawari who signs up with your code or link. Existing customers and your own numbers do not count.' },
    { q: 'What if my friend books without using my referral link?', a: 'The referral is only linked when your friend signs up with your code or link, so the reward cannot be added afterwards.' },
    { q: 'Where can I check my referral status?', a: 'Open "See your referral history" on this page, or Profile → Referral Tracking, to follow each friend from sign-up to reward.' },
  ], [pct]);

  const needLogin = () => {
    if (isAuthenticated && code) return false;
    if (!isAuthenticated) setShowLogin(true);
    return true;
  };

  const copy = async () => {
    if (needLogin()) return;
    await Clipboard.setStringAsync(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareWhatsApp = async () => {
    if (needLogin()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      if (await Linking.canOpenURL(url)) { await Linking.openURL(url); return; }
    } catch { }
    try { await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`); } catch { shareAny(); }
  };

  const shareAny = async () => {
    if (needLogin()) return;
    try { await Share.share({ message, title: 'Invite to MySawari' }); } catch { }
  };

  const STEPS = [
    { t: 'Share Your Code or Link', s: 'Send your personal link or code to your friends.' },
    { t: 'They book a Car or Bike', s: `Your friend signs up with your code and gets ${friendGets} off on the final checkout screen.` },
    { t: `You get ${pct} back`, s: `The moment your friend completes their first trip, you get ${pct} of their trip total as MySawari Cash.` },
  ];

  // Measured from the design (393 wide): purple header 182 below the status bar, the white card 88 from its
  // bottom edge, 123 tall; the photos sit 46 above the card.
  const heroH = insets.top + 182;
  const cardTop = heroH - 88;

  return (
    <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
      <StatusBar style="light" />
      <BlurTarget style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }} showsVerticalScrollIndicator={false}>
          {/* ── Hero ── */}
          <View style={{ height: cardTop + 123 }}>
            <LinearGradient colors={['#5546D9', '#9A8EF1']} style={[styles.heroBg, { height: heroH }]}>
              <Rays width={width} height={heroH} cy={cardTop - 14} />
            </LinearGradient>
            <View style={[styles.heroCard, { top: cardTop, backgroundColor: p.page, borderColor: p.purpleBorder }]}>
              <Text style={[styles.heroTitle, { color: PURPLE }]} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>Invite Friends. Earn {pct} Back.</Text>
              <Text style={[styles.heroSub, { color: p.sub }]}>Get {pct} of your friend’s booking amount as wallet cash when they complete their first trip.</Text>
            </View>
            <Image
              source={require('@/assets/images/refer_avatars.svg')}
              style={[styles.avatars, { top: cardTop - 46 }]}
              contentFit="contain"
              accessible={false}
            />
          </View>

          <View style={styles.body}>
            {/* ── How it works ── */}
            <View style={[styles.how, { backgroundColor: p.soft, borderColor: p.border }]}>
              <Text style={[styles.howTitle, { color: p.fg }]}>How It Works</Text>
              {STEPS.map((st, i) => (
                <View key={st.t} style={styles.howRow}>
                  <View style={styles.howRail}>
                    {i < STEPS.length - 1 && <View style={[styles.howLine, { borderColor: p.strongBorder }]} />}
                    <View style={[styles.howDot, { backgroundColor: p.border }]} />
                  </View>
                  <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? 12 : 0 }}>
                    <Text style={[styles.howStep, { color: p.fg }]}>{st.t}</Text>
                    <Text style={[styles.howSub, { color: p.muted }]}>{st.s}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* ── History ── */}
            <Pressable
              accessibilityRole="button"
              onPress={() => { Haptics.selectionAsync(); isAuthenticated ? router.push('/referrals' as any) : setShowLogin(true); }}
              style={({ pressed }) => [styles.history, { borderColor: p.border }, pressed && { backgroundColor: p.soft }]}
            >
              <View style={[styles.historyIcon, { backgroundColor: p.iconBg }]}>
                <MaterialCommunityIcons name="history" size={19} color={p.fg} />
              </View>
              <Text style={[styles.historyText, { color: p.fg }]}>See your referral history</Text>
              <Feather name="chevron-right" size={18} color={p.sub} />
            </Pressable>

            <Text style={[styles.faqTitle, { color: p.fg }]}>FAQs</Text>
            <FaqList items={faqs} openFirst={false} />
          </View>
        </ScrollView>
      </BlurTarget>

      {/* ── Footer: invite link + share, with the page blurring under it ── */}
      <View style={[styles.footer, { backgroundColor: p.page, borderTopColor: p.divider, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <BottomBlur height={56} fadeTo={p.page} style={{ top: -56, bottom: undefined }} />
        {isAuthenticated && !!code && (
          <Pressable accessibilityRole="button" accessibilityLabel={`Copy invite link ${shortLink}`} onPress={copy} style={styles.linkRow} hitSlop={6}>
            <Text style={[styles.linkLabel, { color: p.muted }]}>Invite Link : </Text>
            <Text style={[styles.link, { color: p.navy }]} numberOfLines={1}>{shortLink}</Text>
            <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? p.green : p.navy} />
          </Pressable>
        )}
        <View style={styles.footerBtns}>
          <Pressable accessibilityRole="button" onPress={shareWhatsApp} style={({ pressed }) => [styles.wa, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
            {isAuthenticated ? (
              <>
                <View style={styles.waLogo}>
                  <FontAwesome name="whatsapp" size={17} color="#FFFFFF" />
                </View>
                <Text style={styles.waText}>Share via WhatsApp</Text>
              </>
            ) : (
              <Text style={styles.waText}>Log in to invite friends</Text>
            )}
          </Pressable>
          {isAuthenticated && (
            <Pressable accessibilityRole="button" accessibilityLabel="Share" onPress={shareAny} style={({ pressed }) => [styles.shareBtn, { backgroundColor: p.soft, borderColor: p.border }, pressed && { opacity: 0.8 }]}>
              <Feather name="share" size={21} color={p.navy} />
            </Pressable>
          )}
        </View>
      </View>

      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </BlurHost>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroBg: { position: 'absolute', left: 0, right: 0, top: 0, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: 'hidden' },
  avatars: { position: 'absolute', alignSelf: 'center', width: 153, height: 65 },
  heroCard: { position: 'absolute', left: 33, right: 33, height: 123, borderWidth: 1, borderRadius: 12, paddingTop: 31, paddingHorizontal: 14, alignItems: 'center' },
  heroTitle: { fontFamily: PF.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  heroSub: { fontFamily: PF.regular, fontSize: 12.5, lineHeight: 17.5, textAlign: 'center', marginTop: 14 },
  body: { paddingHorizontal: 16, paddingTop: 9 },
  how: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingTop: 15, paddingBottom: 13 },
  howTitle: { fontFamily: PF.medium, fontSize: 16, lineHeight: 22, marginBottom: 12 },
  howRow: { flexDirection: 'row', gap: 12 },
  howRail: { width: 11, alignItems: 'center' },
  // Dot on the subtitle's first line (design), the dashed line runs from it to the next dot.
  howDot: { position: 'absolute', top: 21, width: 11, height: 11, borderRadius: 5.5 },
  howLine: { position: 'absolute', top: 27, bottom: -27, left: 5, borderLeftWidth: 1, borderStyle: 'dashed' },
  howStep: { fontFamily: PF.medium, fontSize: 12.5, lineHeight: 17 },
  howSub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 17 },
  history: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, height: 57, paddingHorizontal: 12, marginTop: 17 },
  historyIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1, fontFamily: PF.medium, fontSize: 16 },
  faqTitle: { fontFamily: PF.medium, fontSize: 16, marginTop: 20, marginBottom: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 13, boxShadow: '0px -6px 18px rgba(47, 62, 117, 0.07)' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12, paddingHorizontal: 4 },
  linkLabel: { fontFamily: PF.regular, fontSize: 12.5 },
  link: { fontFamily: PF.medium, fontSize: 12.5, textDecorationLine: 'underline', flexShrink: 1, marginRight: 6 },
  footerBtns: { flexDirection: 'row', gap: 12 },
  wa: { flex: 1, height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  waLogo: { width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  waText: { fontFamily: PF.medium, fontSize: 18.5, color: '#FFFFFF' },
  shareBtn: { width: 54, height: 54, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});