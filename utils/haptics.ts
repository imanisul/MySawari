import * as ExpoHaptics from 'expo-haptics';

/**
 * The app's one door to the phone's vibration motor (every screen imports this instead of 'expo-haptics').
 * A buzz on every tap gets annoying, so ordinary taps — selection ticks and light impacts — are silent.
 * What still vibrates are moments that mean something: success / warning / error results (booking placed,
 * code copied, payment failed …) and medium or heavy impacts.
 */
export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

/** Silent: it is called on ordinary taps. */
export const selectionAsync = (): Promise<void> => Promise.resolve();

export const impactAsync = (style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium): Promise<void> =>
  style === ExpoHaptics.ImpactFeedbackStyle.Light || style === ExpoHaptics.ImpactFeedbackStyle.Soft
    ? Promise.resolve()
    : ExpoHaptics.impactAsync(style);

export const notificationAsync = (type?: ExpoHaptics.NotificationFeedbackType): Promise<void> => ExpoHaptics.notificationAsync(type);
