import React from 'react';
import { Text, View } from 'react-native';

// shortcut: plain-text stand-in so the Flash Sale screen builds; replace with the Figma 1717:15185 lettering when it is drawn.
/** Figma frame size of the scheduled header (the screen caps its width to this). */
export const SCHEDULED_HEADER_VIEW = { w: 393, h: 96 };

/** "FLASH SALE" with "Schedule on <Day>" (cars still hidden) or "STARTS <DAY> <TIME>" (preview day) under it. */
export function FlashSaleScheduledHeader({ line, day, time, width }: {
  line: 'scheduleOn' | 'starts';
  day: string;
  time: string;
  width: number;
}) {
  const sub = line === 'scheduleOn'
    ? `Schedule on ${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()}`
    : `STARTS ${day.toUpperCase()} ${time.toUpperCase()}`;
  return (
    <View style={{ width, height: SCHEDULED_HEADER_VIEW.h * (width / SCHEDULED_HEADER_VIEW.w), alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 32, color: '#FAC64C', textShadowColor: '#FF008B', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 }}>
        FLASH SALE
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, color: '#FFFFFF', textShadowColor: '#000000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 }}>
        {sub}
      </Text>
    </View>
  );
}
