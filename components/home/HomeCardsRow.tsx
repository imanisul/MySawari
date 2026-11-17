import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useDealCars, dealPricing, dealWhenLabel, nextIstHourMs } from '@/hooks/useDealCars';
import HomeCardSunburst from '@/assets/images/home_card_sunburst.svg';
import HomeDealsTitle from '@/assets/images/home_deals_title.svg';
import { createUnscaled } from '@/utils/scaleText';

/** Figma Frame 2147226269: a row of 340 × 248 purple cards (price, Today's Deals, "Find the Perfect Ride"), gap 12. */
const W = 340;
const H = 248;
const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const TILES = [
  { label: 'Security Deposit', img: require('@/assets/images/hero_benefit_zero_deposit.png'), w: 69 },
  { label: 'Unlimited Kilometer', img: require('@/assets/images/hero_benefit_unlimited_km.png'), w: 60 },
  { label: 'Expertly Maintained', img: require('@/assets/images/hero_benefit_maintained.png'), w: 69 },
  { label: 'DoorStep Delivery', img: require('@/assets/images/hero_benefit_doorstep.png'), w: 68 },
];

/*
 * Price card (Figma 1855:15782, 340 × 248). Drawn in three layers:
 * 1. home_price_card_bg.webp — the card's background worked out with Figma's own maths: the #6152D8 → #CEC9F3
 *    gradient, the 18 sunburst rays (#E2E0FB → white in *color-burn* blend, which React Native can't do), the
 *    soft ground shadow under the cars (#0E0E0E 30%, blur 14.4) and the shadows of "Your ride, / from just".
 * 2. "Your ride, / from just" from Figma's exact letter shapes (white), and the price as text (it changes).
 * 3. The cars picture from the Figma file, at Figma's spot (−16.5, 102), 372 × 124: the cars span x 9–331, y 118–215.
 */
const YOUR_RIDE = 'M35.576 83.9844V74.4748L28.3361 62.5806H32.6743L38.2479 71.9178H36.6965L42.2701 62.5806H46.5796L39.3683 74.446V83.9844H35.576ZM53.0568 84.3291C51.5245 84.3291 50.1359 83.9748 48.891 83.2661C47.646 82.5575 46.65 81.5902 45.9031 80.3644C45.1752 79.1386 44.8113 77.7404 44.8113 76.1698C44.8113 74.5993 45.1752 73.2107 45.9031 72.004C46.65 70.7782 47.646 69.8109 48.891 69.1023C50.1359 68.3936 51.5245 68.0393 53.0568 68.0393C54.5891 68.0393 55.9681 68.3936 57.1939 69.1023C58.4389 69.7918 59.4253 70.7495 60.1531 71.9753C60.9001 73.2011 61.2736 74.5993 61.2736 76.1698C61.2736 77.7404 60.9001 79.1482 60.1531 80.3931C59.4061 81.6189 58.4102 82.5862 57.1652 83.2949C55.9394 83.9844 54.5699 84.3291 53.0568 84.3291ZM53.0568 80.9677C53.9187 80.9677 54.6753 80.7666 55.3265 80.3644C55.9777 79.943 56.4948 79.3684 56.8779 78.6406C57.261 77.9128 57.4525 77.0892 57.4525 76.1698C57.4525 75.2505 57.261 74.4365 56.8779 73.7278C56.4948 73 55.9777 72.4349 55.3265 72.0327C54.6753 71.6114 53.9187 71.4007 53.0568 71.4007C52.1949 71.4007 51.4288 71.6114 50.7584 72.0327C50.0881 72.4349 49.5613 73 49.1783 73.7278C48.7952 74.4365 48.6037 75.2505 48.6037 76.1698C48.6037 77.0892 48.7952 77.9128 49.1783 78.6406C49.5613 79.3684 50.0881 79.943 50.7584 80.3644C51.4288 80.7666 52.1949 80.9677 53.0568 80.9677ZM69.1842 84.3291C67.9775 84.3291 66.9241 84.061 66.0239 83.5247C65.1428 82.9884 64.4629 82.2414 63.9841 81.2838C63.5244 80.3261 63.2945 79.2152 63.2945 77.9511V68.384H66.9432V77.6351C66.9432 78.3054 67.0773 78.8896 67.3455 79.3876C67.6136 79.8856 67.9871 80.2782 68.4659 80.5655C68.9639 80.8337 69.5289 80.9677 70.161 80.9677C70.793 80.9677 71.3485 80.8337 71.8273 80.5655C72.3253 80.2782 72.7084 79.876 72.9765 79.3589C73.2447 78.8417 73.3787 78.2384 73.3787 77.5489V68.384H77.0562V83.9844H73.5799V80.9103L73.8959 81.4274C73.532 82.3851 72.9286 83.1129 72.0859 83.6109C71.2623 84.0897 70.2951 84.3291 69.1842 84.3291ZM80.0102 83.9844V68.384H83.4578V71.7742L83.1705 71.2857C83.5152 70.1365 84.0803 69.3417 84.8656 68.9012C85.6508 68.4415 86.5798 68.2116 87.6524 68.2116H88.6004V71.4581H87.2501C86.1776 71.4581 85.3061 71.7933 84.6357 72.4637C83.9845 73.1149 83.6589 74.0342 83.6589 75.2217V83.9844H80.0102ZM94.6288 83.9844V68.384H98.0764V71.7742L97.7891 71.2857C98.1338 70.1365 98.6989 69.3417 99.4841 68.9012C100.269 68.4415 101.198 68.2116 102.271 68.2116H103.219V71.4581H101.869C100.796 71.4581 99.9247 71.7933 99.2543 72.4637C98.6031 73.1149 98.2775 74.0342 98.2775 75.2217V83.9844H94.6288ZM104.744 83.9844V68.384H108.392V83.9844H104.744ZM104.744 66.5453V62.5806H108.392V66.5453H104.744ZM118.62 84.3291C117.126 84.3291 115.775 83.9748 114.569 83.2661C113.381 82.5383 112.443 81.5615 111.753 80.3357C111.083 79.0907 110.748 77.7117 110.748 76.1986C110.748 74.6471 111.092 73.2585 111.782 72.0327C112.471 70.8069 113.41 69.8397 114.597 69.131C115.785 68.4032 117.116 68.0393 118.591 68.0393C119.798 68.0393 120.87 68.2787 121.809 68.7575C122.747 69.2363 123.485 69.8971 124.021 70.7399L123.446 71.5156V62.2358H127.124V83.9844H123.647V80.939L124.05 81.6573C123.513 82.5191 122.757 83.1799 121.78 83.6396C120.822 84.0993 119.769 84.3291 118.62 84.3291ZM119.022 80.9677C119.884 80.9677 120.64 80.7666 121.292 80.3644C121.962 79.943 122.489 79.378 122.872 78.6693C123.255 77.9415 123.446 77.1179 123.446 76.1986C123.446 75.2601 123.255 74.4365 122.872 73.7278C122.489 73 121.962 72.4349 121.292 72.0327C120.64 71.6114 119.884 71.4007 119.022 71.4007C118.16 71.4007 117.384 71.6114 116.695 72.0327C116.024 72.4349 115.498 73 115.115 73.7278C114.732 74.4365 114.54 75.2601 114.54 76.1986C114.54 77.1179 114.732 77.9415 115.115 78.6693C115.498 79.378 116.024 79.943 116.695 80.3644C117.384 80.7666 118.16 80.9677 119.022 80.9677ZM137.464 84.3291C135.874 84.3291 134.476 83.9652 133.269 83.2374C132.062 82.5096 131.124 81.5328 130.453 80.3069C129.783 79.062 129.448 77.6734 129.448 76.1411C129.448 74.5897 129.783 73.2011 130.453 71.9753C131.143 70.7495 132.072 69.7918 133.24 69.1023C134.409 68.3936 135.73 68.0393 137.205 68.0393C138.392 68.0393 139.455 68.2404 140.394 68.6426C141.333 69.0448 142.118 69.6003 142.75 70.3089C143.401 70.9984 143.899 71.8029 144.244 72.7222C144.589 73.6416 144.761 74.6184 144.761 75.6527C144.761 75.9208 144.742 76.1986 144.703 76.4859C144.684 76.754 144.636 77.003 144.56 77.2328H132.436V74.4173H142.491L140.767 75.7102C140.94 74.8291 140.892 74.0438 140.624 73.3543C140.356 72.6456 139.925 72.0902 139.331 71.688C138.737 71.2666 138.029 71.0559 137.205 71.0559C136.381 71.0559 135.654 71.257 135.021 71.6592C134.409 72.0615 133.939 72.6456 133.614 73.4118C133.288 74.1779 133.164 75.0972 133.24 76.1698C133.164 77.1658 133.298 78.0373 133.642 78.7843C133.987 79.5121 134.495 80.0867 135.165 80.5081C135.836 80.9103 136.611 81.1114 137.492 81.1114C138.373 81.1114 139.12 80.9294 139.733 80.5655C140.346 80.1824 140.835 79.6845 141.198 79.0716L144.158 80.5081C143.851 81.2359 143.372 81.8967 142.721 82.4904C142.07 83.065 141.294 83.5151 140.394 83.8407C139.513 84.1663 138.536 84.3291 137.464 84.3291ZM148.217 88.4088V86.6275C148.849 86.4743 149.357 86.1774 149.74 85.7369C150.123 85.2964 150.362 84.7122 150.458 83.9844H148.792V80.0196H152.498V82.4904C152.498 84.1376 152.134 85.4592 151.406 86.4552C150.698 87.4703 149.635 88.1215 148.217 88.4088Z';
const FROM_JUST = 'M35.9105 115.012V102.658H33.1525V99.4114H35.9105V98.8368C35.9105 97.6493 36.15 96.6437 36.6288 95.8201C37.1268 94.9965 37.8163 94.3645 38.6973 93.924C39.5784 93.4834 40.6031 93.2632 41.7714 93.2632C42.0204 93.2632 42.279 93.2823 42.5472 93.3206C42.8153 93.3398 43.0451 93.3685 43.2367 93.4068V96.5671C43.0643 96.5288 42.8919 96.5096 42.7195 96.5096C42.5472 96.4905 42.3939 96.4809 42.2599 96.4809C41.4171 96.4809 40.7563 96.6724 40.2775 97.0555C39.8178 97.4386 39.588 98.0323 39.588 98.8368V99.4114H43.0643V102.658H39.588V115.012H35.9105ZM45.114 115.012V99.4114H48.5616V102.801L48.2743 102.313C48.619 101.164 49.1841 100.369 49.9694 99.9285C50.7546 99.4688 51.6836 99.239 52.7562 99.239H53.7042V102.485H52.3539C51.2814 102.485 50.4099 102.821 49.7395 103.491C49.0883 104.142 48.7627 105.062 48.7627 106.249V115.012H45.114ZM62.8424 115.356C61.3101 115.356 59.9215 115.002 58.6765 114.293C57.4316 113.585 56.4356 112.618 55.6886 111.392C54.9608 110.166 54.5969 108.768 54.5969 107.197C54.5969 105.627 54.9608 104.238 55.6886 103.031C56.4356 101.806 57.4316 100.838 58.6765 100.13C59.9215 99.4209 61.3101 99.0666 62.8424 99.0666C64.3746 99.0666 65.7537 99.4209 66.9795 100.13C68.2245 100.819 69.2108 101.777 69.9387 103.003C70.6856 104.228 71.0591 105.627 71.0591 107.197C71.0591 108.768 70.6856 110.176 69.9387 111.42C69.1917 112.646 68.1957 113.614 66.9508 114.322C65.7249 115.012 64.3555 115.356 62.8424 115.356ZM62.8424 111.995C63.7043 111.995 64.4608 111.794 65.112 111.392C65.7633 110.97 66.2804 110.396 66.6635 109.668C67.0465 108.94 67.2381 108.117 67.2381 107.197C67.2381 106.278 67.0465 105.464 66.6635 104.755C66.2804 104.027 65.7633 103.462 65.112 103.06C64.4608 102.639 63.7043 102.428 62.8424 102.428C61.9805 102.428 61.2144 102.639 60.544 103.06C59.8736 103.462 59.3469 104.027 58.9638 104.755C58.5808 105.464 58.3892 106.278 58.3892 107.197C58.3892 108.117 58.5808 108.94 58.9638 109.668C59.3469 110.396 59.8736 110.97 60.544 111.392C61.2144 111.794 61.9805 111.995 62.8424 111.995ZM73.3961 115.012V99.4114H76.8437V102.974L76.4415 102.399C76.7288 101.288 77.3034 100.455 78.1653 99.8998C79.0272 99.3443 80.0423 99.0666 81.2107 99.0666C82.4748 99.0666 83.5953 99.4018 84.5721 100.072C85.5489 100.723 86.1905 101.604 86.497 102.715L85.434 102.801C85.9128 101.537 86.6311 100.599 87.5887 99.986C88.5464 99.3731 89.6477 99.0666 90.8927 99.0666C91.9844 99.0666 92.9612 99.3156 93.8231 99.8136C94.7042 100.312 95.3937 101.001 95.8917 101.882C96.4088 102.763 96.6674 103.788 96.6674 104.956V115.012H93.0187V105.847C93.0187 105.138 92.8846 104.535 92.6165 104.037C92.3675 103.52 92.0131 103.127 91.5535 102.859C91.1129 102.572 90.5766 102.428 89.9446 102.428C89.3317 102.428 88.7858 102.572 88.307 102.859C87.8473 103.127 87.493 103.52 87.244 104.037C86.995 104.535 86.8705 105.138 86.8705 105.847V115.012H83.193V105.847C83.193 105.138 83.0686 104.535 82.8196 104.037C82.5706 103.52 82.2162 103.127 81.7565 102.859C81.2969 102.572 80.751 102.428 80.1189 102.428C79.506 102.428 78.9697 102.572 78.5101 102.859C78.0504 103.127 77.6865 103.52 77.4183 104.037C77.1693 104.535 77.0448 105.138 77.0448 105.847V115.012H73.3961ZM101.626 121.361C101.397 121.361 101.148 121.351 100.879 121.332C100.611 121.313 100.391 121.284 100.219 121.246V118.057C100.563 118.115 100.908 118.143 101.253 118.143C102.057 118.143 102.689 117.952 103.149 117.569C103.609 117.186 103.839 116.611 103.839 115.845V99.4114H107.487V115.845C107.487 117.013 107.248 118.009 106.769 118.833C106.29 119.676 105.61 120.308 104.729 120.729C103.848 121.15 102.814 121.361 101.626 121.361ZM103.839 97.5726V93.6079H107.487V97.5726H103.839ZM116.048 115.356C114.842 115.356 113.788 115.088 112.888 114.552C112.007 114.016 111.327 113.269 110.848 112.311C110.388 111.353 110.159 110.243 110.159 108.978V99.4114H113.807V108.662C113.807 109.333 113.941 109.917 114.209 110.415C114.478 110.913 114.851 111.306 115.33 111.593C115.828 111.861 116.393 111.995 117.025 111.995C117.657 111.995 118.213 111.861 118.691 111.593C119.189 111.306 119.572 110.903 119.841 110.386C120.109 109.869 120.243 109.266 120.243 108.576V99.4114H123.92V115.012H120.444V111.938L120.76 112.455C120.396 113.412 119.793 114.14 118.95 114.638C118.126 115.117 117.159 115.356 116.048 115.356ZM132.764 115.356C131.117 115.356 129.68 114.964 128.454 114.179C127.229 113.374 126.386 112.302 125.926 110.961L128.655 109.639C129.077 110.52 129.642 111.21 130.351 111.708C131.078 112.206 131.883 112.455 132.764 112.455C133.473 112.455 134.038 112.302 134.459 111.995C134.88 111.689 135.091 111.267 135.091 110.731C135.091 110.405 135.005 110.147 134.832 109.955C134.66 109.745 134.43 109.563 134.143 109.409C133.856 109.256 133.549 109.141 133.224 109.065L130.695 108.346C129.374 107.963 128.368 107.379 127.679 106.594C127.008 105.809 126.673 104.88 126.673 103.807C126.673 102.869 126.913 102.045 127.391 101.336C127.889 100.628 128.569 100.072 129.431 99.6699C130.312 99.2677 131.299 99.0666 132.39 99.0666C133.865 99.0666 135.168 99.4209 136.298 100.13C137.428 100.838 138.223 101.825 138.682 103.089L135.895 104.41C135.627 103.683 135.168 103.108 134.516 102.687C133.884 102.265 133.166 102.055 132.362 102.055C131.71 102.055 131.193 102.208 130.81 102.514C130.446 102.801 130.264 103.185 130.264 103.663C130.264 103.97 130.341 104.228 130.494 104.439C130.667 104.65 130.896 104.832 131.184 104.985C131.471 105.119 131.787 105.234 132.132 105.33L134.66 106.077C135.943 106.46 136.93 107.044 137.619 107.829C138.309 108.595 138.653 109.524 138.653 110.616C138.653 111.555 138.404 112.378 137.907 113.087C137.409 113.795 136.719 114.351 135.838 114.753C134.976 115.155 133.951 115.356 132.764 115.356ZM148.068 115.184C146.325 115.184 144.975 114.705 144.017 113.748C143.079 112.79 142.609 111.44 142.609 109.697V102.658H139.909V99.4114H140.225C140.972 99.4114 141.556 99.2103 141.977 98.808C142.399 98.3867 142.609 97.8025 142.609 97.0555V95.8489H146.258V99.4114H149.849V102.658H146.258V109.496C146.258 110.032 146.344 110.482 146.517 110.846C146.708 111.21 146.996 111.488 147.379 111.679C147.781 111.871 148.288 111.966 148.901 111.966C149.035 111.966 149.189 111.957 149.361 111.938C149.553 111.918 149.734 111.899 149.907 111.88V115.012C149.639 115.05 149.332 115.088 148.988 115.127C148.662 115.165 148.355 115.184 148.068 115.184Z';

function PriceCard({ fromRate }: { fromRate: number }) {
  return (
    <View style={styles.card} accessible accessibilityRole="header" accessibilityLabel={`Your ride, from just ${formatCurrency(fromRate)}`}>
      {/* shortcut: home_price_card_bg.webp was never added; gradient + sunburst until it is, then swap back */}
      <LinearGradient colors={['#6152D8', '#CEC9F3']} style={StyleSheet.absoluteFill} />
      <HomeCardSunburst style={styles.cardSunburst} pointerEvents="none" />
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={YOUR_RIDE} fill="#FFFFFF" />
        <Path d={FROM_JUST} fill="#FFFFFF" />
      </Svg>
      {/* Figma: Bold 62.25, −2% letter spacing, #FAC64C, 20% shadow 3.8 down; centred on x 235, baseline 113 */}
      <Text style={styles.priceAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={false}>{formatCurrency(fromRate)}</Text>
      <Image source={require('@/assets/images/home_hero_cars.png') /* shortcut: home_price_card_cars.webp never added */} style={styles.priceCars} contentFit="fill" transition={0} />
    </View>
  );
}

function TimerBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ width: 27, alignItems: 'center' }}>
      <View style={styles.timerBox}><Text style={styles.timerNum} allowFontScaling={false}>{pad2(value)}</Text></View>
      <Text style={styles.timerLabel} allowFontScaling={false}>{label}</Text>
    </View>
  );
}

// How long each deal car stays up before the next (WhatsApp-status style).
const STORY_MS = 4000;

function DealsCard({ onAvailabilityChange, panRef }: { onAvailabilityChange: (available: boolean) => void; panRef: React.MutableRefObject<any> }) {
  const router = useRouter();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { dealCars, targetEndMs } = useDealCars(nowMs);
  // Every car and bike in Today's Deals, one after another like WhatsApp status.
  const shown = dealCars;
  useEffect(() => {
    onAvailabilityChange(shown.length > 0);
  }, [shown.length, onAvailabilityChange]);
  // The shown car's bar fills over STORY_MS, then the next car comes up (back to the first after the last).
  const progress = useRef(new Animated.Value(0)).current;
  const runRef = useRef<Animated.CompositeAnimation | null>(null);
  const countRef = useRef(0);
  countRef.current = shown.length;
  useEffect(() => {
    if (active >= shown.length && shown.length) setActive(0);
  }, [active, shown.length]);
  // Fill the bar from `from` (0–1) to full in the time left, then move to the next car.
  const runFrom = useCallback((from: number) => {
    runRef.current?.stop();
    progress.setValue(from);
    const run = Animated.timing(progress, { toValue: 1, duration: STORY_MS * (1 - from), easing: Easing.linear, useNativeDriver: false });
    runRef.current = run;
    run.start(({ finished }) => { if (finished && countRef.current > 1) setActive((a) => (a + 1) % countRef.current); });
  }, [progress]);
  useEffect(() => {
    if (!shown.length) return;
    runFrom(0);
    return () => runRef.current?.stop();
  }, [active, shown.length, runFrom]);

  // On the car: hold = pause (carries on from the same spot on release); swipe left / right = next / previous car.
  // A tap does nothing (no details page). This pan wins over the cards row's scroll (it waits for `panRef`).
  const gesture = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .withRef(panRef)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onBegin(() => runRef.current?.stop())
    .onEnd((e) => {
      const n = countRef.current;
      if (n > 1 && Math.abs(e.translationX) > 40) {
        Haptics.selectionAsync();
        setActive((a) => (a + (e.translationX < 0 ? 1 : -1) + n) % n);
      }
    })
    .onFinalize(() => progress.stopAnimation((v) => runFrom(v))), [panRef, progress, runFrom]);

  // Deals closed (8 AM – 2 PM) or nothing free until 8 AM: no card (no placeholder car).
  if (!shown.length) return null;
  const car: any = shown[Math.min(active, shown.length - 1)];

  // This hour's price ends at the next whole hour (then the deal is an hour shorter and cheaper): at most 1 hour.
  const left = Math.max(0, Math.min(targetEndMs, nextIstHourMs(nowMs)) - nowMs);
  const startMs = (car.dealStartMs || 0) > nowMs ? car.dealStartMs : Math.floor(nowMs / 60000) * 60000;
  const hours = Math.max(1, Math.ceil(Math.max(0, (car.dealEndMs || targetEndMs) - startMs) / 3600000));
  const { price } = dealPricing(car, hours);
  const seats = parseInt(String(car.seats || ''), 10);
  const specs = [car.transmission, car.fuel || car.fuelType, car.type === 'Bike' || !seats ? null : `${seats} seats`].filter(Boolean) as string[];
  const name = car.displayName || car.vehicleName || car.name || 'Vehicle';
  const photo = car.images?.[0] || car.image;
  const open = () => { Haptics.selectionAsync(); router.push('/top-deals'); };

  return (
    <LinearGradient colors={['#6152D8', '#ADA4F4']} style={[styles.card, styles.dealsCard]}>
      <View style={styles.dealsTop}>
        <View style={styles.dealsTitle}>
          <HomeDealsTitle style={styles.dealsArtwork} pointerEvents="none" />
        </View>
        <View style={styles.endsIn}>
          <Text style={styles.endsInText} allowFontScaling={false}>ENDS IN</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TimerBox value={left / 3600000} label="Hrs" />
            <TimerBox value={(left % 3600000) / 60000} label="Min" />
            <TimerBox value={(left % 60000) / 1000} label="Sec" />
          </View>
        </View>
      </View>

      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        {/* One bar per deal car: seen ones full, the shown one filling, the rest empty (Figma 3px bars, 10 apart) */}
        <View style={[styles.bars, { gap: shown.length > 6 ? 4 : 10 }]}>
          {shown.map((v: any, i) => {
            const at = Math.min(active, shown.length - 1);
            return (
              <View key={String(v.id || v._id || i)} style={styles.bar}>
                {i < at && <View style={styles.barFill} />}
                {i === at && (
                  <Animated.View style={[styles.barFill, { width: shown.length > 1 ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : '100%' }]} />
                )}
              </View>
            );
          })}
        </View>
        <View style={{ gap: 6 }}>
          <GestureDetector gesture={gesture}>
          <View accessible accessibilityLabel={`${name}, ${formatCurrency(price)} for ${hours} hours`} style={styles.booking}>
            <Image source={photo} style={styles.carPhoto} contentFit="cover" transition={150} />
            {/* Frame 2147225778: 174 × 92, padding 2/4/4/0, gap 10 — [brand + name, specs] 2 apart (62), then the price (14) */}
            <View style={styles.bookingText}>
              <View style={{ gap: 2, alignSelf: 'stretch' }}>
              <View>
                {!!car.brand && <Text allowFontScaling={false} style={styles.brand} numberOfLines={1}>{car.brand}</Text>}
                <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{name}</Text>
              </View>
              <View style={styles.specs}>
                {specs.map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && <View style={styles.dot} />}
                    <Text allowFontScaling={false} style={styles.spec} numberOfLines={1}>{s}</Text>
                  </React.Fragment>
                ))}
              </View>
              </View>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.dealPrice}>{formatCurrency(price)}</Text>
              </View>
              <Text allowFontScaling={false} style={styles.spec} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {dealWhenLabel(startMs, car.dealEndMs || targetEndMs, nowMs)}
              </Text>
            </View>
          </View>
          </GestureDetector>
          <Pressable onPress={open} accessibilityRole="button" style={styles.seeAll}>
            <Text allowFontScaling={false} style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

function FindCard() {
  return (
    <LinearGradient colors={['#6152D8', '#CEC9F3']} style={[styles.card, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, gap: 12 }]}>
      <HomeCardSunburst style={styles.cardSunburst} pointerEvents="none" />
      <Text style={styles.findTitle} allowFontScaling={false}>Find the Perfect Ride</Text>
      <View style={styles.tiles}>
        {TILES.map((t) => (
          <View key={t.label} style={styles.tile}>
            <Image source={t.img} style={{ width: t.w, height: 46 }} contentFit="contain" transition={0} />
            <Text style={styles.tileLabel} allowFontScaling={false}>{t.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

export function HomeCardsRow({ fromRate }: { fromRate?: number }) {
  const scrollRef = useRef<any>(null);
  const dealsPanRef = useRef<any>(null);
  const [dealsAvailable, setDealsAvailable] = useState(false);
  const positionedAtDeals = useRef(false);
  const onAvailabilityChange = useCallback((available: boolean) => setDealsAvailable(available), []);
  // Cards are drawn at the Figma 340 × 248. On a 393 phone the next card peeks 37 in; narrower screens (Moto Edge with
  // a larger display size, small phones) shrink the whole card to keep that peek instead of running off the edge.
  const { width: winW } = useWindowDimensions();
  const k = Math.min(1, (winW - 53) / W);
  const step = W * k + 12;
  const fit = (card: React.ReactNode) => (
    <View style={{ width: W * k, height: H * k }}>
      <View style={{ width: W, height: H, transform: [{ scale: k }], marginLeft: -(W * (1 - k)) / 2, marginTop: -(H * (1 - k)) / 2 }}>
        {card}
      </View>
    </View>
  );

  // Stops: the first card's left edge on the page's 16px margin and the last card's right edge on it (in line with the
  // tiles above); any card between them centred on the screen.
  const count = (fromRate ? 1 : 0) + (dealsAvailable ? 1 : 0) + 1;
  const maxX = 32 + count * W * k + (count - 1) * 12 - winW;
  const offsets = Array.from({ length: count }, (_, i) =>
    i === 0 ? 0 : i === count - 1 ? maxX : 16 + i * step - (winW - W * k) / 2);

  useEffect(() => {
    if (!fromRate || !dealsAvailable || positionedAtDeals.current) return;
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: offsets[1], y: 0, animated: false }));
    positionedAtDeals.current = true;
    return () => cancelAnimationFrame(frame);
  }, [fromRate, dealsAvailable, step]); // eslint-disable-line react-hooks/exhaustive-deps -- offsets follows step/winW

  return (
    <ScrollView
      ref={scrollRef}
      waitFor={dealsPanRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      // One swipe moves exactly one card (a quick flick can't fly past one).
      snapToOffsets={offsets}
      disableIntervalMomentum
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      style={{ height: H * k, flexGrow: 0 }}
    >
      {!!fromRate && fit(<PriceCard fromRate={fromRate} />)}
      {/* Always mounted (it reports whether there are deals); takes no room while there are none (8 AM – 2 PM). */}
      {dealsAvailable
        ? fit(<DealsCard onAvailabilityChange={onAvailabilityChange} panRef={dealsPanRef} />)
        : <View style={{ width: 0, overflow: 'hidden', marginRight: -12 }}><DealsCard onAvailabilityChange={onAvailabilityChange} panRef={dealsPanRef} /></View>}
      {fit(<FindCard />)}
    </ScrollView>
  );
}

const F700 = 'PlusJakartaSans_700Bold';
// Unscaled: this block shrinks as a whole to fit the screen, so its text must not be shrunk a second time.
const styles = createUnscaled({
  card: { width: W, height: H, borderRadius: 12, overflow: 'hidden' },
  cardSunburst: { position: 'absolute', left: -110.5, top: -156.5, opacity: 0.18 },
  // price card (see PriceCard). The price's line box (93 high) puts its baseline at y 113, centred on x 235.06.
  priceCars: { position: 'absolute', left: -16.5, top: 102, width: 372, height: 124 },
  priceAmount: {
    position: 'absolute', left: 235.06 - 76, top: 41.1, width: 152,
    fontFamily: F700, fontSize: 62.25, lineHeight: 93, letterSpacing: -1.245, color: '#FAC64C', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 3.83 }, textShadowRadius: 3.83, includeFontPadding: false,
  },
  // deals card
  dealsCard: { padding: 8, justifyContent: 'space-between', gap: 12 },
  dealsTop: { height: 53.38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, alignSelf: 'stretch' },
  dealsTitle: { width: 118, height: 53, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  dealsArtwork: { position: 'absolute', top: -5, left: 0 },
  endsIn: { width: 97, gap: 2, justifyContent: 'center' },
  endsInText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF', textAlign: 'center', includeFontPadding: false },
  timerBox: { width: 27, height: 27, borderRadius: 6, backgroundColor: '#FFFBF0', borderWidth: 1, borderColor: '#F9D774', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16, color: '#6152D8', textAlign: 'center', includeFontPadding: false },
  timerLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8, lineHeight: 12, color: '#FFFFFF', textAlign: 'center', includeFontPadding: false },
  bars: { flexDirection: 'row', gap: 10, height: 3 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.49)', overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', borderRadius: 2, backgroundColor: '#FFFFFF' },
  // Booking Card (110 high, padding 8) holding Frame 2147225883: photo + text, 12 apart, centred both ways in 306 × 92.
  booking: { height: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 12, backgroundColor: '#FBFAFE', borderWidth: 1, borderColor: '#DEDAFB', borderRadius: 8 },
  carPhoto: { width: 120, height: 92, borderRadius: 6, backgroundColor: '#EEEAFD' },
  // Frame 2147225778: 174 × 92 column, top-aligned content and bottom price, left-aligned, padding 2/4/4/0.
  bookingText: { flex: 1, height: 92, justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 2, paddingRight: 4, paddingBottom: 2 },
  brand: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373', includeFontPadding: false },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 22, color: '#262626', includeFontPadding: false },
  specs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spec: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373', flexShrink: 1, includeFontPadding: false },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#737373' },
  // Frame 2147225958: price and "for N hours" baseline-aligned with exact 6px gap.
  priceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6, alignSelf: 'stretch' },
  dealPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 24, color: '#262626', includeFontPadding: false },
  forHours: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 18, color: '#737373', includeFontPadding: false },
  seeAll: { height: 31, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: '#FBFAFE', borderWidth: 1, borderColor: '#E7EAF4', borderRadius: 6 },
  seeAllText: { fontFamily: F700, fontSize: 11, lineHeight: 16.5, color: '#6152D8', textTransform: 'uppercase', includeFontPadding: false },
  // find the perfect ride
  findTitle: { fontFamily: F700, fontSize: 24, lineHeight: 26.4, letterSpacing: -0.48, color: '#FFFFFF', textAlign: 'center', alignSelf: 'stretch', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6 },
  tiles: { flexDirection: 'row', gap: 4, alignSelf: 'stretch' },
  tile: { flex: 1, height: 92, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 8, gap: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFC3D4', borderRadius: 12 },
  tileLabel: { width: 71, fontFamily: F700, fontSize: 9, lineHeight: 10.8, color: '#2B386A', textAlign: 'center' },
});