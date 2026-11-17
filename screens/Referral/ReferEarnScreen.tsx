import React, { useEffect, useMemo, useState } from 'react';
import { BlurHost, BlurTarget, BottomBlur } from '@/components/common/BottomBlur';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Share, Linking, useWindowDimensions, Platform, Modal } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '@/utils/navigation';
import * as Haptics from '@/utils/haptics';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginBottomSheet } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { API, BACKEND_URL } from '@/services/backend/api';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { FaqList } from '@/components/vehicle/details/CarDetailsSections';
import { PF } from '@/components/profile/ProfileParts';
import { usePartnerQRs } from '@/utils/referrals';

const PURPLE = '#323E71';

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
  const { data: partnerQRs = [] } = usePartnerQRs();
  const [selectedQRIndex, setSelectedQRIndex] = useState(0);
  const activeQR = partnerQRs[selectedQRIndex] || partnerQRs[0];
  const [config, setConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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

  // The store links, fetched from the server's referral settings (Operation App), with the app's own as fallback. The
  // Play link carries the invite code as the install referrer, so it can be picked up on Android after install.
  const playStore = config?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.mysawari.customer';
  const appStore = config?.appStoreUrl || 'https://apps.apple.com/app/id6829408836';
  const link = useMemo(
    () => (code ? `${playStore}${playStore.includes('?') ? '&' : '?'}referrer=${encodeURIComponent(`ref_code=${code}`)}` : ''),
    [code, playStore],
  );

  const shortLink = link.replace(/^https?:\/\//, '');
  const pct = config?.referralRewardType === 'PERCENTAGE' && config?.referralRewardAmount ? `${config.referralRewardAmount}%` : '10%';
  const friendGets = '100 SawariCash';
  const message = `🚗 Join me on MySawari! Use my invite code *${code}* when you sign up to get 100 SawariCash in your wallet.\n\n📲 Download the app:\nAndroid: ${link}\niPhone: ${appStore}\n\n(Referral code: *${code}*)`;

  const faqs = useMemo(() => [
    { q: 'How does the Refer & Earn program work?', a: `Share your personal invite link or code. When your friend signs up and completes their trip, you earn ${pct} commission of their total trip amount directly in your wallet.` },
    { q: 'Can I withdraw my referral earnings to my bank account?', a: 'Yes, absolutely! All referral commissions are credited as real cash to your Wallet balance. You can withdraw directly to your Bank Account or UPI at any time from Profile → Wallet.' },
    { q: 'What does my friend get?', a: 'Your friend signs up with your invite code and gets 100 SawariCash in their wallet to use towards their trip.' },
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
    await Clipboard.setStringAsync(message);
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
    { t: 'Share Your Code or Link', s: 'Send your personal invite link or code to your friends.' },
    { t: 'They Sign Up & Book', s: 'Your friend signs up with your invite code and gets 100 SawariCash in their wallet.' },
    { t: `Earn ${pct} Commission in Wallet`, s: `When your friend completes their trip, you earn ${pct} commission of their total trip amount directly in your wallet, ready to withdraw to your bank account.` },
  ];
  // TODO: Match the Figma step copy; these longer descriptions wrap differently and change the card height.

  // TODO: Match Figma hero geometry (393px frame): 230px background, 265px hero wrapper, card top at 139px.
  // The safe-area-derived values below currently make the hero taller and place the card lower.
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
            <LinearGradient colors={['#332B72', '#6B5AED']} style={[styles.heroBg, { height: heroH }]}>
              <Rays width={width} height={heroH} cy={cardTop - 14} />
            </LinearGradient>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => {
                Haptics.selectionAsync();
                safeBack(router);
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.backBtn, { top: insets.top + 8 }, pressed && { opacity: 0.7 }]}
            >
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={[styles.heroCard, { top: cardTop, backgroundColor: p.page, borderColor: p.purpleBorder }]}>
              <Text style={[styles.heroTitle, { color: PURPLE }]} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>Invite Friends. Earn {pct} Commission.</Text>
              <Text style={[styles.heroSub, { color: p.muted, fontSize: Math.min(12.5, width / 31), lineHeight: Math.min(17.5, width / 22) }]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.85}>Earn {pct} of your friend's total trip amount as wallet cash — withdraw to your bank account anytime!</Text>
            </View>
            <View accessible={false} style={[styles.avatars, { top: cardTop - 46, left: (width - 152) / 2 }]}>
              <Image source={require('@/assets/images/refer_avatar_2.jpg')} style={[styles.avatar, { left: 0, top: 10, borderColor: '#D5D9EA' }]} />
              <Image source={require('@/assets/images/refer_avatar_1.jpg')} style={[styles.avatar, { left: 96, top: 10, borderColor: '#D5D9EA' }]} />
              <Image source={require('@/assets/images/refer_avatar_3.jpg')} style={[styles.avatarMid, { left: 44 }]} />
            </View>
          </View>

          <View style={styles.body}>
            {/* ── Partner QR Sticker (if assigned) ── */}
            {partnerQRs.length > 0 && activeQR && (
              <View style={[styles.partnerCard, { backgroundColor: '#EEF0F7', borderColor: '#D5D9EA' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Feather name="tag" size={17} color="#323E71" />
                    <Text style={{ fontFamily: PF.bold, fontSize: 13.5, color: '#312E81' }}>Partner QR: {activeQR.token}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowQRModal(true);
                      }}
                      style={{ backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                    >
                      <Text style={{ fontFamily: PF.semibold, fontSize: 12, color: '#4338CA' }}>Show QR</Text>
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        await Clipboard.setStringAsync(`https://mysawari.com/r/${activeQR.token}`);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                      style={{ backgroundColor: '#6B5AED', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                    >
                      <Text style={{ fontFamily: PF.semibold, fontSize: 12, color: '#FFFFFF' }}>Copy Link</Text>
                    </Pressable>
                  </View>
                </View>
                {partnerQRs.length > 1 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {partnerQRs.map((q, idx) => (
                      <Pressable
                        key={q.token}
                        onPress={() => setSelectedQRIndex(idx)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: idx === selectedQRIndex ? '#323E71' : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: idx === selectedQRIndex ? '#323E71' : '#CBD5E1',
                        }}
                      >
                        <Text style={{ fontFamily: PF.medium, fontSize: 11, color: idx === selectedQRIndex ? '#FFFFFF' : '#475569' }}>
                          #{idx + 1} {q.token}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <Text style={{ fontFamily: PF.regular, fontSize: 11.5, lineHeight: 16, color: '#323E71', marginTop: 6 }}>
                  Physical QR sticker assigned to your counter. Guests who scan your sticker get automatically linked to your account.
                </Text>
              </View>
            )}

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
            {/* TODO: The Figma frame shows 4 FAQ rows in a different order; this list renders 6 and changes page height. */}
            <FaqList items={faqs} openFirst={false} />
          </View>
        </ScrollView>
      </BlurTarget>

      {/* ── Footer: invite link + share, with the page blurring under it ── */}
      <View style={[styles.footer, { backgroundColor: p.page, borderTopColor: p.divider, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <BottomBlur height={56} fadeTo={p.page} style={{ top: -56, bottom: undefined }} />
        {isAuthenticated && !!code && (
          <Pressable accessibilityRole="button" accessibilityLabel={`Copy invite link ${shortLink}`} onPress={copy} style={styles.linkRow} hitSlop={6}>
            <Text style={[styles.linkLabel, { color: p.muted }]} numberOfLines={1}>Invite Link :</Text>
            <Text style={[styles.link, { color: p.muted }]} numberOfLines={1} ellipsizeMode="tail">{shortLink}</Text>
            <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? p.green : p.navy} />
          </Pressable>
        )}
        <View style={styles.footerBtns}>
          <Pressable accessibilityRole="button" onPress={shareWhatsApp} style={({ pressed }) => [styles.wa, { backgroundColor: p.button }, pressed && { opacity: 0.85 }]}>
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
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show QR Code"
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowQRModal(true);
                }}
                style={({ pressed }) => [
                  styles.shareBtn,
                  { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather name="maximize" size={20} color="#4338CA" />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Share" onPress={shareAny} style={({ pressed }) => [styles.shareBtn, { backgroundColor: p.soft, borderColor: p.border }, pressed && { opacity: 0.8 }]}>
                <Feather name="share" size={21} color={p.navy} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* ── Referral / Partner QR Modal ── */}
      {Boolean(activeQR?.token || code) && (
        <Modal
          visible={showQRModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQRModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowQRModal(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalBrand}>MySawari</Text>
              <Text style={styles.modalSub}>Scan with phone camera to book & get ₹100 SawariCash</Text>

              {partnerQRs.length > 1 && (
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                  {partnerQRs.map((q, idx) => (
                    <Pressable
                      key={q.token}
                      onPress={() => setSelectedQRIndex(idx)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: idx === selectedQRIndex ? '#323E71' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: idx === selectedQRIndex ? '#323E71' : '#CBD5E1',
                      }}
                    >
                      <Text style={{ fontFamily: PF.medium, fontSize: 11, color: idx === selectedQRIndex ? '#FFFFFF' : '#475569' }}>
                        #{idx + 1} {q.token}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.qrContainer}>
                <QRCode
                  value={`https://mysawari.com/r/${activeQR?.token || code}`}
                  size={200}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <View style={styles.modalCodeBox}>
                <Text style={styles.modalCodeLabel}>{activeQR?.token ? 'PARTNER CODE' : 'REFERRAL CODE'}</Text>
                <Text style={styles.modalCode}>{activeQR?.token || code}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' }}>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: '#EEF2FF',
                    borderWidth: 1,
                    borderColor: '#C7D2FE',
                    height: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={async () => {
                    await Clipboard.setStringAsync(`https://mysawari.com/r/${activeQR?.token || code}`);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  <Text style={{ fontFamily: PF.semibold, fontSize: 13, color: '#4338CA' }}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalCloseBtn, { flex: 1, marginTop: 0 }]}
                  onPress={() => setShowQRModal(false)}
                >
                  <Text style={styles.modalCloseText}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </BlurHost>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroBg: { position: 'absolute', left: 0, right: 0, top: 0, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: 'hidden' },
  avatars: { position: 'absolute', width: 152, height: 66 },
  // Three overlapping photos from the design: two side ones lower, the centre one larger, on top, white ring.
  avatar: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 1 },
  avatarMid: { position: 'absolute', top: 0, width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: '#FFFFFF' },
  // TODO: Match Figma hero card: 10px radius, 12px horizontal/32px top/16px bottom padding, 12px content gap;
  // title 19px Bold and subtitle 11px Medium (currently 20px SemiBold and 12.5px Regular).
  heroCard: { position: 'absolute', left: 33, right: 33, height: 123, borderWidth: 1, borderRadius: 12, paddingTop: 24, paddingHorizontal: 14, overflow: 'hidden', alignItems: 'center' },
  heroTitle: { fontFamily: PF.bold, fontSize: 19, lineHeight: 28, textAlign: 'center' },
  heroSub: { fontFamily: PF.medium, fontSize: 11, lineHeight: 17.5, textAlign: 'center', marginTop: 8 },
  body: { paddingHorizontal: 16, paddingTop: 9 },
  partnerCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 14,
  },
  // TODO: Match Figma's 12px card padding and typography: heading 15px/22.5px SemiBold, step title and body 11px/16.5px
  // SemiBold/Medium (currently 13px inset/15px top, 16px Medium, 12.5px/17px Medium, and 12px/17px Regular).
  how: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingTop: 15, paddingBottom: 13 },
  howTitle: { fontFamily: PF.semibold, fontSize: 16, lineHeight: 22, marginBottom: 12 },
  howRow: { flexDirection: 'row', gap: 12 },
  howRail: { width: 11, alignItems: 'center' },
  // Dot on the subtitle's first line (design), the dashed line runs from it to the next dot.
  howDot: { position: 'absolute', top: 21, width: 11, height: 11, borderRadius: 5.5 },
  howLine: { position: 'absolute', top: 27, bottom: -27, left: 5, borderLeftWidth: 1, borderStyle: 'dashed' },
  howStep: { fontFamily: PF.semibold, fontSize: 12.5, lineHeight: 17 },
  howSub: { fontFamily: PF.medium, fontSize: 11, lineHeight: 17 },
  // TODO: Match Figma history row: 12px/10px padding, 8px radius, and 15px SemiBold label (currently fixed 57px height,
  // 10px radius, and 16px Medium label).
  history: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, height: 57, paddingHorizontal: 12, marginTop: 17 },
  historyIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1, fontFamily: PF.medium, fontSize: 16 },
  // TODO: Match Figma FAQ title: 15px SemiBold and 8px section padding (currently 16px Medium and 20px top margin).
  faqTitle: { fontFamily: PF.medium, fontSize: 16, marginTop: 20, marginBottom: 12 },
  // TODO: Match Figma footer spacing: 8px top padding, 4px link-row vertical padding, and an 8px link-to-button gap;
  // current top padding/margin are 13px/12px and the link row has no vertical padding.
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 13, boxShadow: '0px -6px 18px rgba(47, 62, 117, 0.07)' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12, paddingHorizontal: 4 },
  // Figma: Plus Jakarta Sans medium 11/16.5, Neutral/500 (#737373), centred; the whole line is one grey text.
  linkLabel: { fontFamily: PF.medium, fontSize: 11, lineHeight: 16.5 },
  link: { fontFamily: PF.medium, fontSize: 11, lineHeight: 16.5, flexShrink: 1, marginLeft: 2, marginRight: 4 },
  footerBtns: { flexDirection: 'row', gap: 12 },
  wa: { flex: 1, height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  waLogo: { width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  // TODO: Match Figma CTA: 17px SemiBold label and a 50px share button (currently 18.5px Medium and 54px).
  waText: { fontFamily: PF.medium, fontSize: 18.5, color: '#FFFFFF' },
  shareBtn: { width: 54, height: 54, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalBrand: {
    fontFamily: PF.bold,
    fontSize: 22,
    color: '#323E71',
    letterSpacing: 0.5,
  },
  modalSub: {
    fontFamily: PF.medium,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCodeBox: {
    marginTop: 18,
    alignItems: 'center',
  },
  modalCodeLabel: {
    fontFamily: PF.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#94A3B8',
  },
  modalCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#323E71',
    marginTop: 2,
  },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: '#323E71',
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontFamily: PF.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});