import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { exclusiveOffersQueryOptions, isOfferLive, nextFlashSaleQueryOptions } from '@/services/api/offers';
import { getIndiaDateParts } from '@/utils/sawari';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';

/**
 * Figma "Frame 2147226271": the Flash Sale banner, 361 × 106 on #3E2DC8, radius 16 (tap opens the Flash Sale screen).
 * `Lettering`, `Bolt` and `BannerRays` below are shared with the Flash Sale screen and are unchanged.
 */

// React Native has no text stroke: the black outline is four black copies nudged around the white text,
// and the hard offset shadow is one more copy behind them.
const NUDGE = [[-1, 0], [1, 0], [0, -1], [0, 1], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]];

/**
 * Outlined lettering with a hard offset shadow. `near`: offset of the thin black shadow (default 0.4 × the main one);
 * `outline`: outline thickness; `skew` / `scaleY`: slant and vertical stretch (the Figma font is taller than ours).
 */
export function Lettering({ text, width, size, shadow, font = 'Anton_400Regular', near, outline = 1, skew = '-6deg', scaleY = 1 }: {
  text: string; width?: number; size: number; shadow: { dx: number; dy: number; color: string }; font?: string;
  near?: number; outline?: number; skew?: string; scaleY?: number;
}) {
  const base = { fontFamily: font, fontSize: size, lineHeight: size * 1.15, width, textAlign: 'center' as const, includeFontPadding: false };
  const copy = (color: string, dx: number, dy: number, key: string) => (
    <Text key={key} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit={width !== undefined} style={[base, { position: 'absolute', left: dx, top: dy, color }]}>{text}</Text>
  );
  const nx = near !== undefined ? Math.sign(shadow.dx) * near : shadow.dx * 0.4;
  const ny = near !== undefined ? Math.sign(shadow.dy) * near : shadow.dy * 0.4;
  return (
    <View style={{ width, height: size * 1.15, transform: [{ skewX: skew }, { scaleY }] }}>
      {copy(shadow.color, shadow.dx, shadow.dy, 's')}
      {copy('#000000', nx, ny, 'sb')}
      {NUDGE.map(([dx, dy], i) => copy('#000000', dx * outline, dy * outline, `o${i}`))}
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit={width !== undefined} style={[base, { color: '#FFFFFF' }]}>{text}</Text>
    </View>
  );
}

/** Gold bolt (Figma Vector): 1.2px black outline, then a 1px black and a 3px #E58900 hard shadow down-right. */
export function Bolt({ style, width = 13, line = 1.2, near = 1, far = 3 }: { style?: object; width?: number; line?: number; near?: number; far?: number }) {
  const d = 'M8.94014 0.575406C7.05022 0.360281 5.142 0.360281 3.25209 0.575406L1.29556 0.798659C1.15518 0.814791 1.02468 0.878901 0.92611 0.980149C0.827543 1.0814 0.76696 1.21358 0.754602 1.35434L0.603722 3.04959C0.350843 5.89926 0.350843 8.76572 0.603722 11.6154L0.754602 13.3106C0.768093 13.4634 0.838288 13.6055 0.951357 13.709C1.06443 13.8125 1.21217 13.87 1.36548 13.87H3.9059V22.9498C3.90613 23.0767 3.94573 23.2004 4.01924 23.3039C4.09275 23.4074 4.19655 23.4855 4.31633 23.5275C4.43611 23.5695 4.56597 23.5733 4.68799 23.5383C4.81002 23.5034 4.91821 23.4315 4.99764 23.3325L5.47726 22.7314C8.33492 19.1541 10.6105 15.1485 12.2202 10.8622L12.4533 10.2403C12.4882 10.1475 12.5001 10.0476 12.4879 9.9492C12.4758 9.8508 12.4399 9.75681 12.3835 9.67529C12.3271 9.59377 12.2517 9.52714 12.1639 9.48113C12.0761 9.43511 11.9784 9.41107 11.8792 9.41107H8.55128L11.4033 1.6193C11.4353 1.53211 11.447 1.43879 11.4377 1.34639C11.4283 1.25399 11.3981 1.16492 11.3494 1.08589C11.3006 1.00686 11.2345 0.939948 11.1561 0.890192C11.0776 0.840436 10.9889 0.809138 10.8967 0.798659L8.94014 0.575406Z';
  const u = 14 / width; // screen px → drawing units
  return (
    <Svg width={width + far} height={(width * 26) / 14 + far} viewBox={`0 0 ${14 + far * u} ${26 + far * u}`} style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Path d={d} fill="#E58900" transform={`translate(${far * u},${far * u})`} />
      <Path d={d} fill="#000000" transform={`translate(${near * u},${near * u})`} />
      <Path d={d} fill="#FBC422" stroke="#000000" strokeWidth={line * u} />
    </Svg>
  );
}

/**
 * Figma "Repeat group 1": 18 rays (one every 20°) of white 70% → 0, laid over the banner with mix-blend overlay.
 * Drawn in code: the exported SVG repeats the ray through `<use href="#Repeat%20group…">`, an id react-native-svg
 * can't resolve, and it has no blend modes, so the overlay's lightening is matched with a lower opacity instead.
 */
const RAY = 'M260.716 0.687536H299.959L285.057 280.338H275.619L260.716 0.687536Z';
export function BannerRays({ style }: { style?: object }) {
  return (
    <Svg width={560.68} height={560.68} viewBox="0 0 560.675 560.675" style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id="bannerRay" x1="280.338" y1="0.6875" x2="280.338" y2="280.338" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G opacity={0.33}>
        {Array.from({ length: 18 }, (_, i) => (
          <Path key={i} d={RAY} fill="url(#bannerRay)" transform={`rotate(${i * 20} 280.3375 280.3375)`} />
        ))}
      </G>
    </Svg>
  );
}

/* ───────────────────────────── The banner, drawn from the Figma export ───────────────────────────── */

const CARD_W = 361;
const CARD_H = 106;

// Figma vector shapes (exported outlines, in card coordinates). The lettering is drawn from these, not from a font:
// in the design each letter is tilted along a gentle arc, which text can't do.
const FS_BOLT_L = 'M100.214 29.4309C98.3237 29.2158 96.4154 29.2158 94.5255 29.4309L92.569 29.6541C92.4286 29.6703 92.2981 29.7344 92.1995 29.8356C92.101 29.9369 92.0404 30.069 92.028 30.2098L91.8772 31.9051C91.6243 34.7547 91.6243 37.6212 91.8772 40.4709L92.028 42.1661C92.0415 42.3188 92.1117 42.4609 92.2248 42.5645C92.3379 42.668 92.4856 42.7254 92.6389 42.7255H95.1793V51.8052C95.1796 51.9322 95.2192 52.0559 95.2927 52.1594C95.3662 52.2628 95.47 52.341 95.5898 52.3829C95.7095 52.4249 95.8394 52.4287 95.9614 52.3938C96.0835 52.3589 96.1916 52.287 96.2711 52.188L96.7507 51.5869C99.6084 48.0096 101.884 44.004 103.494 39.7177L103.727 39.0958C103.762 39.003 103.774 38.9031 103.761 38.8047C103.749 38.7063 103.713 38.6123 103.657 38.5308C103.601 38.4492 103.525 38.3826 103.437 38.3366C103.349 38.2906 103.252 38.2665 103.153 38.2665H99.8247L102.677 30.4748C102.709 30.3876 102.72 30.2943 102.711 30.2019C102.702 30.1095 102.672 30.0204 102.623 29.9414C102.574 29.8623 102.508 29.7954 102.429 29.7457C102.351 29.6959 102.262 29.6646 102.17 29.6541L100.214 29.4309Z';
const FS_BOLT_R = 'M264.362 29.4348C262.472 29.2197 260.564 29.2197 258.674 29.4348L256.717 29.658C256.577 29.6742 256.447 29.7383 256.348 29.8395C256.249 29.9408 256.189 30.073 256.176 30.2137L256.026 31.909C255.773 34.7586 255.773 37.6251 256.026 40.4748L256.176 42.17C256.19 42.3227 256.26 42.4649 256.373 42.5684C256.486 42.6719 256.634 42.7294 256.787 42.7294H259.328V51.8091C259.328 51.9361 259.368 52.0598 259.441 52.1633C259.515 52.2667 259.618 52.3449 259.738 52.3869C259.858 52.4288 259.988 52.4326 260.11 52.3977C260.232 52.3628 260.34 52.2909 260.42 52.1919L260.899 51.5908C263.757 48.0135 266.032 44.0079 267.642 39.7216L267.875 39.0997C267.91 39.0069 267.922 38.907 267.91 38.8086C267.898 38.7102 267.862 38.6162 267.805 38.5347C267.749 38.4531 267.674 38.3865 267.586 38.3405C267.498 38.2945 267.4 38.2704 267.301 38.2704H263.973L266.825 30.4787C266.857 30.3915 266.869 30.2982 266.86 30.2058C266.85 30.1134 266.82 30.0243 266.771 29.9453C266.722 29.8662 266.656 29.7993 266.578 29.7496C266.5 29.6998 266.411 29.6685 266.319 29.658L264.362 29.4348Z';
const FS_TITLE = 'M113.172 49.878L112.406 31.8793L124.728 31.3551L124.866 34.6166L116.29 34.9815L116.484 39.5476L123.853 39.2341L123.991 42.4957L116.623 42.8091L116.917 49.7187L113.172 49.878ZM126.869 49.3034L126.193 31.301L129.939 31.1605L130.492 45.9007L138.103 45.6151L138.226 48.8773L126.869 49.3034ZM138.271 48.8776L143.822 30.6879L148.801 30.5385L155.432 48.3627L151.347 48.4852L150.028 44.8476L143.43 45.0456L142.332 48.7557L138.271 48.8776ZM144.371 41.7514L148.891 41.6158L145.881 33.1905L146.896 33.16L144.371 41.7514ZM163.142 48.5109C162.013 48.5324 160.946 48.3512 159.939 47.9673C158.948 47.5669 158.082 46.9949 157.342 46.2512C156.619 45.5071 156.07 44.6227 155.696 43.5979L158.74 42.1614C159.21 43.136 159.845 43.8978 160.646 44.4469C161.462 44.9957 162.354 45.2609 163.321 45.2424C163.837 45.2326 164.279 45.1436 164.646 44.9753C165.014 44.8071 165.3 44.584 165.504 44.306C165.708 44.0119 165.807 43.6714 165.799 43.2846C165.791 42.8655 165.656 42.5134 165.392 42.2282C165.128 41.9268 164.721 41.6927 164.17 41.5259L160.618 40.4326C159.174 39.9925 158.082 39.3523 157.34 38.5118C156.598 37.6553 156.216 36.6226 156.193 35.4137C156.173 34.3499 156.413 33.4102 156.913 32.5945C157.43 31.7785 158.151 31.1359 159.077 30.6668C160.02 30.1974 161.103 29.951 162.328 29.9277C163.408 29.9071 164.411 30.0734 165.337 30.4266C166.263 30.7799 167.062 31.2886 167.736 31.953C168.426 32.6171 168.949 33.4213 169.306 34.3659L166.286 35.802C165.931 34.9703 165.411 34.3272 164.725 33.8726C164.039 33.402 163.261 33.175 162.39 33.1915C161.891 33.2011 161.449 33.2901 161.065 33.4586C160.682 33.6272 160.388 33.8666 160.184 34.1768C159.98 34.4709 159.882 34.8114 159.889 35.1982C159.897 35.6173 160.041 35.9854 160.321 36.3025C160.601 36.6035 161.017 36.8375 161.568 37.0043L165.047 38.0506C166.506 38.4904 167.598 39.1226 168.324 39.9473C169.065 40.7716 169.447 41.7881 169.47 42.997C169.49 44.0447 169.234 44.9847 168.701 45.8172C168.169 46.6335 167.423 47.2846 166.465 47.7704C165.523 48.2398 164.415 48.4867 163.142 48.5109ZM171.754 48.0838L171.717 30.0688L175.466 30.0611L175.482 37.8474L182.494 37.833L182.478 30.0467L186.226 30.039L186.263 48.054L182.515 48.0617L182.501 41.0975L175.488 41.1119L175.503 48.0761L171.754 48.0838ZM199.389 48.5225C198.261 48.5018 197.2 48.2808 196.209 47.8595C195.233 47.4223 194.39 46.8183 193.678 46.0475C192.983 45.2769 192.467 44.3726 192.132 43.3345L195.228 42.0128C195.661 43.0043 196.267 43.7893 197.047 44.368C197.842 44.9469 198.723 45.2453 199.691 45.263C200.206 45.2725 200.651 45.2 201.025 45.0457C201.398 44.8913 201.693 44.679 201.907 44.4089C202.122 44.1226 202.233 43.786 202.24 43.3992C202.248 42.9801 202.125 42.6231 201.873 42.3283C201.62 42.0173 201.222 41.7681 200.677 41.5808L197.169 40.3555C195.743 39.8617 194.675 39.181 193.965 38.3135C193.256 37.4298 192.912 36.3835 192.935 35.1746C192.954 34.1108 193.229 33.1807 193.76 32.3843C194.306 31.5881 195.051 30.973 195.994 30.5389C196.954 30.105 198.046 29.8993 199.271 29.9218C200.351 29.9417 201.347 30.1454 202.259 30.5329C203.171 30.9205 203.951 31.4589 204.599 32.148C205.264 32.8373 205.756 33.6606 206.077 34.6178L203.006 35.94C202.683 35.0956 202.187 34.4335 201.519 33.9537C200.851 33.4577 200.081 33.2017 199.211 33.1857C198.711 33.1766 198.267 33.249 197.877 33.4031C197.487 33.5572 197.184 33.7854 196.969 34.0878C196.754 34.3741 196.643 34.7106 196.636 35.0975C196.629 35.5165 196.759 35.8898 197.027 36.2172C197.295 36.5284 197.702 36.7778 198.247 36.9651L201.684 38.1408C203.126 38.6348 204.194 39.3074 204.887 40.1586C205.597 41.01 205.941 42.0402 205.919 43.2491C205.9 44.2967 205.609 45.2266 205.045 46.0385C204.483 46.8344 203.713 47.4571 202.738 47.9068C201.778 48.3406 200.662 48.5459 199.389 48.5225ZM206.446 48.3648L213.071 30.5382L218.05 30.6858L223.607 48.8734L219.523 48.7523L218.423 45.0426L211.824 44.847L210.507 48.4852L206.446 48.3648ZM212.96 41.6148L217.48 41.7487L214.977 33.159L215.992 33.1891L212.96 41.6148ZM224.995 48.9265L225.664 30.9239L229.41 31.0632L228.862 45.8036L236.474 46.0866L236.352 49.3488L224.995 48.9265ZM237.726 49.4085L238.492 31.4097L250.596 31.9247L250.457 35.1862L242.098 34.8306L241.924 38.9135L249.8 39.2485L249.661 42.5101L241.785 42.175L241.61 46.3063L249.969 46.6619L249.83 49.9234L237.726 49.4085Z';
const FS_EVERY_SUNDAY_8AM = 'M65.1673 79.3755L64.6955 61.3667L76.8061 61.0494L76.8916 64.3127L68.5278 64.5319L68.6348 68.6171L76.5152 68.4106L76.6007 71.674L68.7203 71.8804L68.8286 76.014L77.1924 75.7949L77.2779 79.0582L65.1673 79.3755ZM83.7531 78.8886L77.1171 61.0412L81.2265 60.9336L86.2465 75.2674L85.4246 75.2889L89.6871 60.7119L93.7965 60.6043L88.1042 78.7746L83.7531 78.8886ZM95.6442 78.5825L95.2343 60.5722L107.346 60.2965L107.42 63.5601L99.0557 63.7505L99.1487 67.8361L107.03 67.6567L107.104 70.9203L99.2229 71.0997L99.317 75.2336L107.682 75.0432L107.756 78.3069L95.6442 78.5825ZM109.397 78.2738L109.035 60.2624L115.925 60.1241C117.166 60.0992 118.267 60.2948 119.226 60.7109C120.202 61.1266 120.973 61.7561 121.538 62.5993C122.103 63.4426 122.398 64.4928 122.423 65.7499C122.448 66.9749 122.187 68.0282 121.64 68.9099C121.093 69.7754 120.349 70.4353 119.407 70.8896L123.661 77.9875L119.454 78.0719L114.846 70.2072L117.292 71.5851L113.013 71.671L113.144 78.1986L109.397 78.2738ZM112.947 68.4071L116.114 68.3436C116.646 68.3329 117.104 68.2189 117.486 68.0016C117.869 67.7843 118.161 67.4882 118.363 67.1133C118.581 66.7381 118.686 66.3087 118.676 65.8252C118.666 65.3255 118.544 64.8926 118.311 64.5264C118.094 64.1599 117.79 63.8758 117.399 63.674C117.008 63.4723 116.547 63.3767 116.015 63.3874L112.848 63.451L112.947 68.4071ZM129.469 77.8869L129.331 70.0292L123.157 59.9797L127.437 59.9047L131.922 67.4685L130.399 67.4952L134.593 59.7793L138.873 59.7043L133.078 69.9393L133.216 77.8212L129.469 77.8869ZM150.981 77.8594C149.852 77.8733 148.786 77.685 147.781 77.2944C146.793 76.8874 145.931 76.3096 145.197 75.561C144.478 74.8121 143.935 73.9241 143.568 72.8968L146.621 71.4806C147.085 72.4583 147.715 73.2244 148.512 73.7788C149.325 74.333 150.215 74.6041 151.182 74.5922C151.698 74.5858 152.14 74.4997 152.509 74.3339C152.878 74.1681 153.165 73.9469 153.371 73.6703C153.577 73.3776 153.678 73.0378 153.673 72.6509C153.668 72.2318 153.535 71.8787 153.273 71.5918C153.011 71.2887 152.605 71.0519 152.055 70.8814L148.511 69.7644C147.07 69.3147 145.982 68.6672 145.246 67.8218C144.51 66.9603 144.134 65.9251 144.119 64.7161C144.106 63.6522 144.352 62.7141 144.858 61.9017C145.38 61.0892 146.106 60.4514 147.035 59.9885C147.981 59.5254 149.066 59.2863 150.291 59.2711C151.371 59.2578 152.373 59.4308 153.296 59.7901C154.22 60.1495 155.016 60.6636 155.685 61.3325C156.371 62.0011 156.889 62.8089 157.239 63.7558L154.209 65.1717C153.86 64.3377 153.345 63.6911 152.662 63.232C151.979 62.7568 151.202 62.5246 150.332 62.5353C149.832 62.5415 149.39 62.6276 149.005 62.7936C148.62 62.9596 148.324 63.197 148.119 63.5058C147.913 63.7986 147.812 64.1384 147.817 64.5253C147.822 64.9444 147.964 65.3134 148.242 65.6324C148.52 65.9353 148.934 66.172 149.484 66.3426L152.955 67.412C154.412 67.8616 155.5 68.501 156.22 69.3305C156.955 70.1597 157.331 71.1788 157.346 72.3878C157.359 73.4356 157.096 74.3739 156.558 75.2028C156.02 76.0155 155.27 76.6616 154.309 77.1411C153.364 77.6042 152.254 77.8436 150.981 77.8594ZM166.755 77.7184C165.337 77.7272 164.07 77.4368 162.954 76.8472C161.838 76.2576 160.954 75.4489 160.303 74.4212C159.668 73.3773 159.346 72.1944 159.338 70.8725L159.267 59.4592L163.015 59.436L163.084 70.6075C163.089 71.3168 163.246 71.9607 163.556 72.5391C163.882 73.1013 164.32 73.542 164.87 73.861C165.42 74.18 166.041 74.3374 166.734 74.3331C167.444 74.3287 168.063 74.1637 168.593 73.838C169.14 73.5122 169.564 73.0662 169.867 72.5001C170.186 71.9178 170.343 71.272 170.338 70.5627L170.269 59.3912L174.017 59.368L174.088 70.7813C174.096 72.1032 173.781 73.2901 173.143 74.3419C172.52 75.3775 171.655 76.1969 170.546 76.8003C169.438 77.4036 168.174 77.7096 166.755 77.7184ZM176.61 77.3797L176.639 59.3647L179.516 59.3693L189.169 72.128L187.621 72.4883L187.641 59.3821L191.389 59.388L191.361 77.403L188.459 77.3984L178.976 64.5432L180.379 64.1827L180.359 77.3856L176.61 77.3797ZM194.074 77.4183L194.227 59.404L200.103 59.454C202.053 59.4706 203.743 59.8719 205.171 60.6579C206.599 61.4439 207.702 62.5173 208.48 63.8781C209.259 65.239 209.641 66.7899 209.626 68.5308C209.611 70.2718 209.203 71.8241 208.401 73.1876C207.6 74.5349 206.478 75.5894 205.037 76.3509C203.596 77.1125 201.9 77.485 199.949 77.4684L194.074 77.4183ZM197.849 74.1859L200.074 74.2048C201.251 74.2149 202.268 73.9898 203.127 73.5296C203.985 73.0532 204.652 72.3899 205.126 71.5395C205.617 70.6731 205.868 69.6596 205.878 68.4989C205.888 67.3221 205.655 66.3045 205.178 65.446C204.718 64.5877 204.063 63.9211 203.212 63.4463C202.362 62.9716 201.348 62.7292 200.172 62.7192L197.947 62.7002L197.849 74.1859ZM209.403 77.5501L215.733 59.6165L220.714 59.6817L226.571 77.775L222.484 77.7215L221.324 74.0304L214.723 73.9439L213.466 77.6033L209.403 77.5501ZM215.805 70.6934L220.327 70.7526L217.682 62.2054L218.697 62.2187L215.805 70.6934ZM230.925 77.8597L231.063 70.0021L225.245 59.7425L229.524 59.8174L233.742 67.5338L232.219 67.5071L236.681 59.9428L240.96 60.0178L234.811 70.0435L234.673 77.9254L230.925 77.8597ZM251.918 78.5487C250.564 78.5199 249.401 78.2452 248.428 77.7246C247.472 77.2044 246.745 76.5197 246.247 75.6706C245.749 74.8215 245.511 73.9054 245.532 72.9223C245.557 71.7457 245.884 70.7691 246.513 69.9924C247.158 69.2161 248.09 68.6393 249.307 68.2621L249.046 69.1756C248.197 68.8996 247.524 68.3531 247.025 67.5363C246.542 66.7198 246.312 65.82 246.333 64.8368C246.353 63.8698 246.621 63.0128 247.137 62.266C247.653 61.5191 248.359 60.9456 249.254 60.5454C250.15 60.1291 251.17 59.9332 252.314 59.9576C253.458 59.9819 254.461 60.221 255.322 60.6747C256.2 61.1126 256.88 61.7157 257.364 62.4838C257.863 63.2523 258.103 64.1201 258.082 65.0871C258.061 66.0702 257.792 66.9594 257.275 67.7546C256.759 68.5498 256.062 69.0752 255.186 69.3306L254.989 68.359C256.188 68.836 257.094 69.4761 257.705 70.2792C258.318 71.0662 258.611 72.048 258.586 73.2246C258.565 74.2077 258.28 75.1127 257.73 75.9394C257.197 76.7504 256.433 77.3952 255.439 77.8739C254.446 78.3526 253.272 78.5776 251.918 78.5487ZM251.985 75.4059C252.549 75.4179 253.043 75.3236 253.466 75.123C253.89 74.9224 254.218 74.6392 254.452 74.2733C254.702 73.9077 254.832 73.4832 254.842 72.9997C254.852 72.5 254.741 72.0704 254.506 71.7106C254.289 71.3351 253.972 71.0462 253.557 70.8439C253.143 70.6254 252.654 70.5102 252.089 70.4982C251.541 70.4865 251.056 70.581 250.632 70.7816C250.225 70.9664 249.897 71.2416 249.647 71.6071C249.414 71.9569 249.292 72.3816 249.281 72.8812C249.271 73.3647 249.375 73.7943 249.593 74.1698C249.826 74.5456 250.143 74.8426 250.541 75.0607C250.956 75.2791 251.437 75.3942 251.985 75.4059ZM252.156 67.3553C252.592 67.3646 252.964 67.2758 253.275 67.0889C253.601 66.9024 253.856 66.6498 254.041 66.3313C254.225 66.0127 254.321 65.66 254.329 65.2732C254.338 64.8703 254.257 64.5057 254.086 64.1796C253.916 63.8535 253.672 63.5984 253.353 63.4142C253.051 63.2143 252.682 63.1097 252.247 63.1004C251.828 63.0915 251.455 63.1803 251.129 63.3668C250.803 63.5373 250.548 63.7818 250.363 64.1003C250.179 64.4189 250.083 64.7796 250.074 65.1826C250.066 65.5694 250.147 65.9258 250.318 66.252C250.488 66.5781 250.732 66.8413 251.05 67.0415C251.369 67.2418 251.737 67.3464 252.156 67.3553ZM259.366 78.4181L265.905 60.5601L270.885 60.6839L276.529 78.8448L272.444 78.7432L271.326 75.0388L264.727 74.8747L263.427 78.519L259.366 78.4181ZM265.848 71.6371L270.368 71.7495L267.824 63.1718L268.839 63.197L265.848 71.6371ZM277.917 78.8815L278.389 60.8726L282.015 60.9676L288.525 70.0883L286.833 70.044L293.618 61.2716L297.244 61.3666L296.772 79.3755L293.025 79.2773L293.389 65.402L294.878 65.7797L287.707 74.5419L287.223 74.5293L280.762 65.4099L282.027 65.1044L281.664 78.9796L277.917 78.8815Z';
const FS_UNDERLINE = 'M247 84.8009C247 84.8009 261.166 84.4814 269.776 84.8015C279.11 85.1484 292.855 86.0375 292.855 86.0375';
// Repeat group 1: one ray, repeated every 20° around the card's ray centre (180.3375, 52.3375).
const FS_RAY = 'M160.715 -227.312H199.958L185.056 52.3377H175.617L160.715 -227.312Z';

/**
 * Figma draws the outline on the outside only (inside half masked away) and its drop shadows as hard copies behind.
 * Here: the shadow copies (filled + stroked so they match the outlined shape), the black outline, then the fill on top
 * so the inner half of the outline is covered.
 */
function OutlinedShape({ d, fill, line, shadows }: {
  d: string; fill: string; line: number; shadows: { dx: number; dy: number; color: string }[];
}) {
  return (
    <G>
      {shadows.map((s, i) => (
        <Path key={i} d={d} fill={s.color} stroke={s.color} strokeWidth={line} transform={`translate(${s.dx} ${s.dy})`} />
      ))}
      <Path d={d} fill="none" stroke="#000000" strokeWidth={line} />
      <Path d={d} fill={fill} />
    </G>
  );
}

// Figma effects, in drawing order (furthest first).
const BOLT_SHADOWS = [{ dx: 1.039, dy: 1.039, color: '#E58900' }, { dx: 0.346, dy: 0.346, color: '#000000' }];
const TITLE_SHADOWS = [{ dx: -2.328, dy: 2.328, color: '#FF008B' }, { dx: -0.776, dy: 0.776, color: '#000000' }];
const LINE2_SHADOWS = [{ dx: -0.776, dy: 0.776, color: '#000000' }];

/**
 * The card, rays, bolts, "FLASH SALE" and (for the weekly default) "EVERY SUNDAY 8AM" with its underline.
 * Rays: white 70% → 0 in overlay blend. On the solid #3E2DC8 card, white in overlay is exactly #7C5AFF
 * (each channel doubled, blue capped), so they are drawn in #7C5AFF at the same 70% → 0, an exact match without blend
 * modes (which react-native-svg doesn't have).
 */
function BannerArt({ width: W, showDefaultLine }: { width: number; showDefaultLine: boolean }) {
  // Figma lays everything out on a 361-wide card; a wider card keeps it all centred (rays from the middle).
  const dx = (W - CARD_W) / 2;
  return (
    <Svg width={W} height={CARD_H} viewBox={`0 0 ${W} ${CARD_H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <ClipPath id="fsbCard">
          <Rect width={W} height={CARD_H} rx={16} />
        </ClipPath>
        <LinearGradient id="fsbRay" x1="180.337" y1="-227.313" x2="180.337" y2="52.3377" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#7C5AFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#7C5AFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G clipPath="url(#fsbCard)">
        <Rect width={W} height={CARD_H} fill="#3E2DC8" />
        <G transform={`translate(${dx} 0)`}>
        {Array.from({ length: 18 }, (_, i) => (
          <Path key={i} d={FS_RAY} fill="url(#fsbRay)" transform={`rotate(${i * 20} 180.3375 52.3375)`} />
        ))}
        <OutlinedShape d={FS_BOLT_L} fill="#FBC422" line={0.831} shadows={BOLT_SHADOWS} />
        <OutlinedShape d={FS_TITLE} fill="#FFFFFF" line={1.862} shadows={TITLE_SHADOWS} />
        <OutlinedShape d={FS_BOLT_R} fill="#FBC422" line={0.831} shadows={BOLT_SHADOWS} />
        {showDefaultLine ? (
          <G>
            <OutlinedShape d={FS_EVERY_SUNDAY_8AM} fill="#FFFFFF" line={1.862} shadows={LINE2_SHADOWS} />
            {/* Vector 3: white 1.55 hand-drawn line, black shadow straight down 0.78 */}
            <Path d={FS_UNDERLINE} stroke="#000000" strokeWidth={1.552} fill="none" transform="translate(0 0.776)" />
            <Path d={FS_UNDERLINE} stroke="#FFFFFF" strokeWidth={1.552} fill="none" />
          </G>
        ) : null}
        </G>
      </G>
    </Svg>
  );
}

/* ───────────────────────────── When the next sale is ───────────────────────────── */

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DEFAULT_WHEN = { lead: 'EVERY SUNDAY', time: '8AM' };

/** "EVERY SUNDAY" + "8AM" from the next sale's real start, in India time. Null when it isn't in the future. */
function saleWhen(startsAt: string | null | undefined, now: number): { lead: string; time: string } | null {
  const ms = startsAt ? new Date(startsAt).getTime() : NaN;
  if (!Number.isFinite(ms) || ms <= now) return null;
  const p = getIndiaDateParts(ms);
  const h = p.hours % 12 || 12;
  const time = `${h}${p.minutes ? `:${String(p.minutes).padStart(2, '0')}` : ''}${p.hours >= 12 ? 'PM' : 'AM'}`;
  return { lead: `EVERY ${WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()]}`, time };
}

/** Current time, refreshed every 30 s so LIVE / upcoming switches on its own without waiting for a refetch. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ───────────────────────────── Line 2 as text (any other day/time, or LIVE) ───────────────────────────── */

// Matched to the Figma line: caps 18 high from y 61.4, centred on the card, 0.93 outline, 0.78 black shadow.
const LINE2_TEXT = { size: 22.4, shadow: { dx: -0.776, dy: 0.776, color: '#000000' }, near: 0.776, outline: 0.93, skew: '0deg', scaleY: 1.15, font: 'PlusJakartaSans_700Bold' };

/** Figma "Vector 3" for a text time: the hand-drawn line under it (stretches to the time's width). */
function TextUnderline() {
  return (
    <Svg width="100%" height={3.7} viewBox="246.6 84 46.7 2.9" preserveAspectRatio="none" pointerEvents="none">
      <Path d={FS_UNDERLINE} stroke="#000000" strokeWidth={1.552} fill="none" transform="translate(0 0.776)" />
      <Path d={FS_UNDERLINE} stroke="#FFFFFF" strokeWidth={1.552} fill="none" />
    </Svg>
  );
}

function Line2Text({ when }: { when: { lead: string; time: string } | null }) {
  return (
    <View style={styles.line2} pointerEvents="none">
      {when ? (
        <View style={styles.line2Row}>
          <Lettering text={when.lead} {...LINE2_TEXT} />
          <View>
            <Lettering text={when.time} {...LINE2_TEXT} />
            {/* In Figma the line runs under the time from 3% in to 92% of its width, 5 below the letters. */}
            <View style={styles.textUnderline}>
              <TextUnderline />
            </View>
          </View>
        </View>
      ) : (
        <Lettering text="LIVE NOW · BOOK DEALS" {...LINE2_TEXT} />
      )}
    </View>
  );
}

/* ───────────────────────────── Banner ───────────────────────────── */

export function FlashSaleBanner() {
  const router = useRouter();
  const now = useNow();
  const { data: offers = [] } = useQuery(exclusiveOffersQueryOptions);
  // Always loaded (not only when nothing is live) so the Flash Sale page opens with it already known.
  const { data: nextSale } = useQuery(nextFlashSaleQueryOptions);

  // Only offers running right now: a cached offer that has ended never shows as LIVE.
  const isLive = offers.some((o: any) => isOfferLive(o, now, true));
  // Live → "LIVE NOW · BOOK DEALS"; else the next scheduled sale (Operation App); else the weekly default.
  const when = isLive ? null : saleWhen(nextSale?.startsAt, now) ?? DEFAULT_WHEN;
  // The weekly default is drawn exactly as in Figma; anything else is set in type in the same style.
  const isDefault = !!when && when.lead === DEFAULT_WHEN.lead && when.time === DEFAULT_WHEN.time;

  // Figma (393 frame): the card runs 16 → 377, i.e. full width with 16 each side, like the date field and the panels.
  // Wider phones: the card stretches to that width, artwork centred. Narrower than 361 + 32: the 361 card scales down.
  const { width: screenW } = useWindowDimensions();
  const avail = screenW - 32;
  const cardW = Math.max(CARD_W, avail);
  const k = Math.min(1, avail / CARD_W);
  const a11y = when ? `Flash Sale, ${when.lead.toLowerCase()} at ${when.time}` : 'Flash Sale, live now, book deals';

  return (
    <View style={[styles.row, { height: CARD_H * k }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPress={() => { Haptics.selectionAsync(); router.push('/flash-sale'); }}
        style={({ pressed }) => [
          styles.card,
          { width: cardW },
          k < 1 && { transform: [{ scale: k }], marginHorizontal: -(CARD_W * (1 - k)) / 2, marginVertical: -(CARD_H * (1 - k)) / 2 },
          pressed && { opacity: 0.92 },
        ]}
      >
        <BannerArt width={cardW} showDefaultLine={isDefault} />
        {!isDefault && <Line2Text when={when} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  // Figma Frame 2147226271: 361 × 106, #3E2DC8, radius 16 (the art inside draws and clips the same rounded card).
  card: { height: CARD_H, borderRadius: 16, backgroundColor: '#3E2DC8', overflow: 'hidden' },
  // Line 2 text: box top 54 puts 22.4 caps at 59.5–79.5, where Figma's "EVERY SUNDAY 8AM" sits; centred on the card.
  line2: { position: 'absolute', left: 0, right: 0, top: 54, alignItems: 'center' },
  line2Row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  textUnderline: { position: 'absolute', left: '3%', width: '89%', top: 30, transform: [{ rotate: '0.8deg' }] },
});