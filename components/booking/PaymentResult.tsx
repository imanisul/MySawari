import React from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };
const RED = '#DC2626';
const WHATSAPP_GREEN = '#33A174';

/**
 * Figma "Payment Failed": red "!" badge, title, reason, a "Need help?" card (Call support / Chat with us /
 * email) and one button at the bottom. Used by payment processing and the /payment-error route.
 */
export function PaymentFailed({ title = 'Payment Failed', message = 'Your booking is Failed. Try again', buttonLabel = 'Try again', onButton }: {
  title?: string;
  message?: string;
  buttonLabel?: string;
  onButton: () => void;
}) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();

  // The badge pops in with a small shake, then the help card rises in.
  const pop = React.useRef(new Animated.Value(0)).current;
  const shake = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.sequence([6, -6, 4, -4, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 55, useNativeDriver: true }))),
      Animated.timing(rise, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [pop, shake, rise]);

  return (
    <View style={[styles.screen, { backgroundColor: p.page }]}>
      <View style={[styles.body, { paddingTop: insets.top + 128 }]}>
        <Animated.View
          style={[styles.badge, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { translateX: shake }] }]}
          accessibilityElementsHidden
        >
          <View style={styles.bang} />
          <View style={styles.bangDot} />
        </Animated.View>
        <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">{title}</Text>
        <Text style={[styles.sub, { color: p.sub }]}>{message}</Text>

        <Animated.View style={[styles.help, { opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <LinearGradient colors={['#FFFFFF', '#FFF8F8']} style={StyleSheet.absoluteFill} />
          <Text style={[styles.helpTitle, { color: p.fg }]}>Need help?</Text>
          <Text style={[styles.helpSub, { color: p.sub }]}>Having trouble with your payment? Contact our support team for assistance.</Text>
          <View style={styles.helpRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {})}
              style={({ pressed }) => [styles.helpBtn, { backgroundColor: p.summary, borderColor: p.deliveryBorder }, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="call" size={17} color={p.navy} />
              <Text style={[styles.helpBtnText, { color: p.navy }]}>Call support</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {})}
              style={({ pressed }) => [styles.helpBtn, { backgroundColor: WHATSAPP_GREEN, borderColor: WHATSAPP_GREEN }, pressed && { opacity: 0.85 }]}
            >
              <FontAwesome name="whatsapp" size={19} color="#FFFFFF" />
              <Text style={[styles.helpBtnText, { color: '#FFFFFF' }]}>Chat with us</Text>
            </Pressable>
          </View>
          <View style={[styles.mail, { borderColor: p.deliveryBorder }]}>
            <Text style={[styles.mailText, { color: p.sub }]}>
              Call us or email us at{' '}
              <Text style={{ color: p.navy, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>{SUPPORT_EMAIL}</Text> .
            </Text>
          </View>
        </Animated.View>
      </View>

      <LinearGradient pointerEvents="none" colors={['rgba(229,231,240,0)', 'rgba(229,231,240,0.55)']} style={styles.fade} />
      <View style={[styles.footer, { backgroundColor: p.page, borderTopColor: p.deliveryBorder, paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <Pressable accessibilityRole="button" onPress={onButton} style={({ pressed }) => [styles.cta, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
          <Text style={styles.ctaText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  badge: { width: 82, height: 82, borderRadius: 41, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  bang: { width: 4, height: 27, borderRadius: 2, backgroundColor: '#FFFFFF' },
  bangDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF', marginTop: 6 },
  title: { fontFamily: FONT.semibold, fontSize: 25, lineHeight: 33, marginTop: 30, textAlign: 'center', letterSpacing: -0.2 },
  sub: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 20, marginTop: 6, textAlign: 'center', paddingHorizontal: 12 },
  help: { alignSelf: 'stretch', borderWidth: 1, borderColor: '#FBEEEE', borderRadius: 16, paddingHorizontal: 12, paddingTop: 22, paddingBottom: 12, marginTop: 30, alignItems: 'center', overflow: 'hidden' },
  helpTitle: { fontFamily: FONT.medium, fontSize: 17, lineHeight: 24 },
  helpSub: { fontFamily: FONT.regular, fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  helpRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch', marginTop: 16 },
  helpBtn: { flex: 1, height: 37, borderRadius: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  helpBtnText: { fontFamily: FONT.medium, fontSize: 13 },
  mail: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 10, backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 8, marginTop: 18 },
  mailText: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  fade: { height: 64 },
  footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, boxShadow: '0px -6px 18px rgba(47, 62, 117, 0.07)' },
  cta: { height: 53, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.medium, fontSize: 16, color: '#FFFFFF' },
});