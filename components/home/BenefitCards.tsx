import React, { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const ITEMS = [
  {
    image: require('@/assets/images/hero_benefit_zero_deposit.png'),
    label: 'Security\nDeposit',
    imgStyle: { width: '100%' as const, height: 54.33 },
  },
  {
    image: require('@/assets/images/hero_benefit_unlimited_km.png'),
    label: 'Unlimited\nKilometer',
    imgStyle: { width: 60, height: 55.21 },
  },
  {
    image: require('@/assets/images/hero_benefit_maintained.png'),
    label: 'Expertly\nMaintained',
    imgStyle: { width: '100%' as const, height: 54.33 },
  },
  {
    image: require('@/assets/images/hero_benefit_doorstep.png'),
    label: 'DoorStep\nDelivery',
    imgStyle: { width: '100%' as const, height: 55.21 },
  },
];

/**
 * Hero slide: the four promises as high-res 3D PNG icon cards matching Figma Frame 2147226213
 * (padding 0/16, gap 9, height 107.21, radial-gradient #FFFFFF 47.58% -> #E3E8F2 100%, 1px #BFC3D4 border, #2B386A label).
 */
export default function BenefitCards({ width }: { width: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <View
      style={[styles.row, { width }]}
      accessible
      accessibilityLabel="Zero security deposit, unlimited kilometre, expertly maintained, doorstep delivery"
    >
      {ITEMS.map(({ image, label, imgStyle }, idx) => {
        const gradId = `heroCard_${uid}_${idx}`;
        return (
          <View key={label} style={styles.card}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                  <Stop offset="0.4758" stopColor="#FFFFFF" />
                  <Stop offset="1" stopColor="#E3E8F2" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
            </Svg>
            <Image source={image} style={imgStyle} contentFit="contain" transition={0} />
            <Text style={styles.label} numberOfLines={2} allowFontScaling={false}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 9,
    height: 107.21,
  },
  card: {
    flex: 1,
    height: 107.21,
    backgroundColor: '#E3E8F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFC3D4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 4,
  },
  label: {
    width: '100%',
    minHeight: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 13,
    color: '#2B386A',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
