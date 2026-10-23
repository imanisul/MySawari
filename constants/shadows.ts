import { Platform } from 'react-native';

export const shadows = {
  // Level 1: Resting cards, default states
  level1: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  // Level 2: Hovered/Pressed cards, sticky headers
  level2: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  // Level 3: Modals, Popups, Overlays
  level3: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  // Level 0: Flat
  none: Platform.select({
    ios: {
      shadowOpacity: 0,
      elevation: 0,
    },
    android: {
      elevation: 0,
      shadowOpacity: 0,
    },
    default: {},
  }),
};
