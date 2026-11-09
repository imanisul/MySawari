import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

// The app is designed on a 393-wide phone. Every StyleSheet font size and line height is scaled by the real screen
// width (kept within 90%-115%) so text fits small phones and is not tiny on big ones. Must load before any screen
// creates its styles, so index.js imports this first. Sizes set inline (not via StyleSheet.create) are not scaled.
const k = Math.min(Math.max(Dimensions.get('window').width / 393, 0.9), 1.15);

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
