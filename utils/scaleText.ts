import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

const { width: winW, height: winH } = Dimensions.get('window');
// In portrait (the standard orientation), width is the narrower dimension and height is the taller dimension.
const screenW = Math.min(winW, winH);
const screenH = Math.max(winW, winH);

// Design base is a 393 × 852 phone (Figma baseline: iPhone 14/15/16).
const DESIGN_W = 393;
const DESIGN_H = 852;

const wScale = screenW / DESIGN_W;
const hScale = screenH / DESIGN_H;

// Every StyleSheet and inline font size & line height is scaled according to device dimensions:
// 1. Shorter phones (e.g. iPhone SE / 6/7/8 at 667, 16:9 budget Android at 640, or 700-750px phones):
//    Because vertical space is constrained (up to 25% shorter than baseline), words and line heights
//    are scaled in step with the height so titles, cards, buttons and lists fit comfortably without
//    pushing elements off-screen or causing awkward wrapping.
// 2. Narrower phones (e.g. 320 to 360 wide):
//    Text scales down in step with width down to 0.78 so words never overflow horizontal boxes.
// 3. Taller / wider phones (e.g. Pixel 7 at 412, Pro Max at 430, tall 21:9 at 960):
//    Text is capped at 1.0 (never scaled UP): the boxes around the text (cards, pills, tabs, buttons)
//    keep their exact Figma sizes, preventing text from spilling out.
// Must load before any screen creates its styles, so index.js imports this first.
const blendedScale = hScale < 1 ? Math.min(wScale, wScale * 0.45 + hScale * 0.55) : wScale;
const k = Math.min(Math.max(blendedScale, 0.78), 1);

export const fontScaleFactor = k;
export const deviceWidth = screenW;
export const deviceHeight = screenH;

/**
 * StyleSheet.create WITHOUT the font scaling, for blocks that already scale as a whole to fit the
 * screen (Flash Sale ticket/header, Home cards row, Home price banner): with the global scaling too, their text was
 * shrunk twice (0.82 × 0.6 ≈ half size on a 320-wide phone).
 */
const originalCreate = StyleSheet.create.bind(StyleSheet);
export const createUnscaled: typeof StyleSheet.create = ((styles: any) => originalCreate(styles)) as any;

const SCALED_MARKER = typeof Symbol !== 'undefined' ? Symbol('__mysawari_scaled__') : '__mysawari_scaled__';

function scaleStyleObject(s: any): any {
  if (!s || typeof s !== 'object' || (s as any)[SCALED_MARKER]) return s;
  if (typeof s.fontSize === 'number' || typeof s.lineHeight === 'number') {
    const scaled: any = {
      ...s,
      ...(typeof s.fontSize === 'number' ? { fontSize: Math.round(s.fontSize * k * 10) / 10 } : null),
      ...(typeof s.lineHeight === 'number' ? { lineHeight: Math.round(s.lineHeight * k * 10) / 10 } : null),
    };
    try {
      Object.defineProperty(scaled, SCALED_MARKER, { value: true, enumerable: false, configurable: true });
    } catch {
      (scaled as any)[SCALED_MARKER] = true;
    }
    return scaled;
  }
  return s;
}

function scalePropStyle(style: any): any {
  if (!style || k >= 0.99) return style;
  if (Array.isArray(style)) {
    return style.map((item) => (item ? scalePropStyle(item) : item));
  }
  return scaleStyleObject(style);
}

if (Math.abs(k - 1) > 0.01) {
  const create = StyleSheet.create as any;
  (StyleSheet as any).create = (styles: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const name of Object.keys(styles)) {
      out[name] = scaleStyleObject(styles[name]);
    }
    return create(out);
  };
}

// System font scaling cap:
// - On short screens (< 720px height), cap at 1.15 to ensure words don't overflow compact cards
// - On standard/tall screens, cap at 1.2
const maxFontMultiplier = screenH < 720 ? 1.15 : 1.2;

try {
  const RN = require('react-native');
  for (const name of ['Text', 'TextInput']) {
    const Base = RN[name];
    const Capped: any = React.forwardRef((props: any, ref: any) => {
      const scaledStyle = scalePropStyle(props?.style);
      return React.createElement(Base, {
        maxFontSizeMultiplier: maxFontMultiplier,
        ...props,
        ...(scaledStyle !== props?.style ? { style: scaledStyle } : null),
        ref,
      });
    });
    try { Object.assign(Capped, Base); } catch {} // keep statics such as TextInput.State
    Capped.displayName = name;
    Object.defineProperty(RN, name, { configurable: true, enumerable: true, get: () => Capped });
  }
} catch {}

