const test = require('node:test');
const assert = require('node:assert/strict');

// Baseline design dimensions: iPhone 14/15/16
const DESIGN_W = 393;
const DESIGN_H = 852;

function computeScale(winW, winH) {
  const screenW = Math.min(winW, winH);
  const screenH = Math.max(winW, winH);
  const wScale = screenW / DESIGN_W;
  const hScale = screenH / DESIGN_H;
  const blendedScale = hScale < 1 ? Math.min(wScale, wScale * 0.45 + hScale * 0.55) : wScale;
  return Math.min(Math.max(blendedScale, 0.78), 1);
}

const DEVICES = [
  { name: 'iPhone 5s / SE 1 (Compact)', w: 320, h: 568 },
  { name: 'Budget Android (16:9)', w: 360, h: 640 },
  { name: 'iPhone SE 2/3 / 6/7/8', w: 375, h: 667 },
  { name: 'iPhone 8 Plus (Wide Short)', w: 414, h: 736 },
  { name: 'Galaxy S22 (Compact Flagship)', w: 360, h: 780 },
  { name: 'iPhone 13 mini', w: 375, h: 812 },
  { name: 'iPhone 12/13/14', w: 390, h: 844 },
  { name: 'iPhone 14/15/16 (Design Base)', w: 393, h: 852 },
  { name: 'iPhone 11 / XR', w: 414, h: 896 },
  { name: 'Google Pixel 7', w: 412, h: 915 },
  { name: 'iPhone 15/16 Pro Max (Large)', w: 430, h: 932 },
  { name: 'Sony Xperia (Tall 21:9)', w: 360, h: 960 },
];

test('Device Scaling: All phone heights scale smoothly within bounds [0.78, 1.00]', () => {
  for (const d of DEVICES) {
    const k = computeScale(d.w, d.h);
    assert.ok(k >= 0.78, `${d.name} (${d.w}x${d.h}) scale ${k} below min 0.78`);
    assert.ok(k <= 1.00, `${d.name} (${d.w}x${d.h}) scale ${k} exceeds max 1.00`);
  }
});

test('Device Scaling: Design base (393x852) has exact 1.00 scale factor', () => {
  const k = computeScale(393, 852);
  assert.equal(k, 1);
});

test('Device Scaling: Taller devices do not scale up beyond 1.00 (protecting fixed Figma boxes)', () => {
  const proMax = computeScale(430, 932);
  const pixel7 = computeScale(412, 915);
  const xperia = computeScale(360, 960);
  assert.equal(proMax, 1);
  assert.equal(pixel7, 1);
  assert.ok(xperia <= 1);
});

test('Device Scaling: Shorter devices scale down proportionally to avoid vertical text clipping', () => {
  const se = computeScale(375, 667);
  const budget = computeScale(360, 640);
  const se1 = computeScale(320, 568);

  // SE (667px height) scales to ~0.86, allowing words to fit on shorter screens
  assert.ok(se < 0.90 && se >= 0.85, `iPhone SE scale ${se} should be ~0.86`);
  // Budget Android (640px height) scales to ~0.825
  assert.ok(budget < 0.85 && budget >= 0.80, `Budget Android scale ${budget} should be ~0.825`);
  // Smallest phone (568px height) hits protected lower bound 0.78
  assert.equal(se1, 0.78, `iPhone 5s scale should equal lower bound 0.78`);
});

test('Typography Fitting: Standard font sizes scale properly across device heights', () => {
  const sampleFonts = [11, 13, 14, 16, 18, 19, 24, 28];
  for (const d of DEVICES) {
    const k = computeScale(d.w, d.h);
    for (const size of sampleFonts) {
      const scaled = Math.round(size * k * 10) / 10;
      assert.ok(scaled > 0, `Scaled font for size ${size} must be positive`);
      assert.ok(scaled <= size, `Scaled font (${scaled}) must not exceed design base (${size})`);
      // Minimum readability check: no font size in sample drops below 8px
      assert.ok(scaled >= 8, `Scaled font ${scaled} for size ${size} on ${d.name} must be >= 8px`);
    }
  }
});

test('Style Scaling Implementation: Prevents double-scaling and scales inline styles', () => {
  const SCALED_MARKER = Symbol('__mysawari_scaled__');
  const k = 0.86;

  function scaleStyleObject(s) {
    if (!s || typeof s !== 'object' || s[SCALED_MARKER]) return s;
    if (typeof s.fontSize === 'number' || typeof s.lineHeight === 'number') {
      const rawFs = typeof s.fontSize === 'number' ? Math.round(s.fontSize * k * 10) / 10 : undefined;
      let rawLh = typeof s.lineHeight === 'number' ? Math.round(s.lineHeight * k * 10) / 10 : undefined;

      if (typeof rawFs === 'number' && typeof rawLh === 'number' && rawLh < rawFs * 1.2) {
        rawLh = Math.round(rawFs * 1.25 * 10) / 10;
      }

      const scaled = {
        ...s,
        ...(rawFs !== undefined ? { fontSize: rawFs } : null),
        ...(rawLh !== undefined ? { lineHeight: rawLh } : null),
      };
      Object.defineProperty(scaled, SCALED_MARKER, { value: true, enumerable: false, configurable: true });
      return scaled;
    }
    return s;
  }

  function scalePropStyle(style) {
    if (!style || k >= 0.99) return style;
    if (Array.isArray(style)) {
      return style.map((item) => (item ? scalePropStyle(item) : item));
    }
    return scaleStyleObject(style);
  }

  // 1. StyleSheet style scaled once
  const sheetStyle = scaleStyleObject({ fontSize: 16, lineHeight: 24, color: '#000' });
  assert.equal(sheetStyle.fontSize, 13.8);
  assert.equal(sheetStyle.lineHeight, 20.6);

  // 2. Passing already scaled StyleSheet style through Text prop style does NOT scale twice
  const processed = scalePropStyle(sheetStyle);
  assert.equal(processed.fontSize, 13.8, 'Must not scale already-scaled styles twice');

  // 3. Inline style is scaled
  const inline = scalePropStyle({ fontSize: 20 });
  assert.equal(inline.fontSize, 17.2, 'Inline font size must be scaled');

  // 4. Mixed array with nulls/falsy values
  const mixed = scalePropStyle([sheetStyle, null, false, { fontSize: 14 }]);
  assert.equal(mixed[0].fontSize, 13.8);
  assert.equal(mixed[1], null);
  assert.equal(mixed[2], false);
  assert.equal(mixed[3].fontSize, 12.0);

  // 5. Vertical clipping protection: tight lineHeight is expanded to at least 1.25x fontSize
  const tightStyle = scaleStyleObject({ fontSize: 16, lineHeight: 18 });
  assert.equal(tightStyle.fontSize, 13.8);
  assert.equal(tightStyle.lineHeight, 17.3, 'Tight lineHeight must expand to 1.25x fontSize to prevent vertical clipping');
});

test('Accessibility & Font Scaling: Max multiplier resolution caps gracefully', () => {
  const maxFontMultiplier = 1.2;
  function resolveEffectiveMax(props) {
    const userMax = typeof props?.maxFontSizeMultiplier === 'number' ? props.maxFontSizeMultiplier : undefined;
    return userMax !== undefined ? Math.min(userMax, 1.25) : maxFontMultiplier;
  }

  // 1. Default (no user multiplier): caps at 1.2 (20% increase for accessibility without layout breaking)
  assert.equal(resolveEffectiveMax({}), 1.2);
  assert.equal(resolveEffectiveMax(null), 1.2);
  assert.equal(resolveEffectiveMax({ maxFontSizeMultiplier: undefined }), 1.2);

  // 2. Explicit smaller multiplier preserved (e.g. badges, tab bars)
  assert.equal(resolveEffectiveMax({ maxFontSizeMultiplier: 1.0 }), 1.0);
  assert.equal(resolveEffectiveMax({ maxFontSizeMultiplier: 1.15 }), 1.15);

  // 3. Extreme multiplier (e.g. 2.0x on Android 14) safely capped at 1.25
  assert.equal(resolveEffectiveMax({ maxFontSizeMultiplier: 1.4 }), 1.25);
  assert.equal(resolveEffectiveMax({ maxFontSizeMultiplier: 2.0 }), 1.25);
});
