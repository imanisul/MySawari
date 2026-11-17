import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

// The app is designed on a 393-wide phone. Every StyleSheet font size and line height is scaled down on narrower
// screens, in step with the width down to 320 (82%: small phones, curved-edge phones and any phone with a larger
// Display size setting) so text fits small phones. It is never scaled UP: the boxes around the text (cards, pills,
// tabs, buttons) keep their Figma sizes, so on wider phones (Moto Edge / Pixel / Samsung at 412, Pro Max at 430) the
// bigger text spilled out of them. Must load before any screen creates its styles, so index.js imports this first.
// Sizes set inline (not via StyleSheet.create) are not scaled.
const k = Math.min(Math.max(Dimensions.get('window').width / 393, 0.82), 1);

/**
 * StyleSheet.create WITHOUT the narrow-screen font scaling, for blocks that already scale as a whole to fit the
 * screen (Flash Sale ticket/header, Home cards row, Home price banner): with the global scaling too, their text was
 * shrunk twice (0.82 × 0.6 ≈ half size on a 320-wide phone).
 */
const originalCreate = StyleSheet.create.bind(StyleSheet);
export const createUnscaled: typeof StyleSheet.create = ((styles: any) => originalCreate(styles)) as any;

if (Math.abs(k - 1) > 0.01) {
  const create = StyleSheet.create as any;
  (StyleSheet as any).create = (styles: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const name of Object.keys(styles)) {
      const s = styles[name];
      if (s && typeof s === 'object' && (typeof s.fontSize === 'number' || typeof s.lineHeight === 'number')) {
        out[name] = {
          ...s,
          ...(typeof s.fontSize === 'number' ? { fontSize: Math.round(s.fontSize * k * 10) / 10 } : null),
          ...(typeof s.lineHeight === 'number' ? { lineHeight: Math.round(s.lineHeight * k * 10) / 10 } : null),
        };
      } else {
        out[name] = s;
      }
    }
    return create(out);
  };
}

// Large system font sizes (iPhone Larger Text, Android font scale) must not push text out of fixed-size cards, pills and
// buttons: cap at 1.2x. (Setting Text.defaultProps does nothing under React 19's JSX runtime, so Text and TextInput are
// wrapped instead.) An individual text can still set its own maxFontSizeMultiplier.
try {
  const RN = require('react-native');
  for (const name of ['Text', 'TextInput']) {
    const Base = RN[name];
    const Capped: any = React.forwardRef((props: any, ref: any) => React.createElement(Base, { maxFontSizeMultiplier: 1.2, ...props, ref }));
    try { Object.assign(Capped, Base); } catch {} // keep statics such as TextInput.State
    Capped.displayName = name;
    Object.defineProperty(RN, name, { configurable: true, enumerable: true, get: () => Capped });
  }
} catch {}
