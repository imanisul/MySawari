import React from 'react';
import Svg, { Line, Path } from 'react-native-svg';

/**
 * The Explore / Search icons, drawn to the Figma artwork rather than the closest Feather glyph:
 * - SortLinesIcon: three centred lines getting shorter (14, 9 and 4.5 wide, 4.5 apart, 1pt stroke).
 * - FunnelIcon: Lucide "funnel" outline (flat top, slanted stem end), 1pt stroke.
 */
export function SortLinesIcon({ color = '#737373', width = 16 }: { color?: string; width?: number }) {
  const h = width * 11 / 16;
  return (
    <Svg width={width} height={h} viewBox="0 0 16 11" fill="none">
      <Line x1={1} y1={1} x2={15} y2={1} stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1={3.5} y1={5.5} x2={12.5} y2={5.5} stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1={5.75} y1={10} x2={10.25} y2={10} stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

/** Sort: an up arrow beside a down arrow (Lucide "arrow-up-down"), so it no longer looks like the filter icon. */
export function SortArrowsIcon({ color = '#737373', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FunnelIcon({ color = '#737373', size = 17 }: { color?: string; size?: number }) {
  // 24-unit Lucide path; strokeWidth scales with size so the line stays 1pt.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"
        stroke={color}
        strokeWidth={24 / size}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}