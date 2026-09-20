import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBrandColors } from './useBrandColors';

export type EmptyKind = 'dates' | 'filters' | 'error';

type Action = { label: string; onPress: () => void };

/** Empty / error result states, each with clear next actions (all ≥44px tall). */
export function SearchEmptyState({
  kind,
  vehicle,
  nearby,
  onNearby,
  onChangeDates,
  onClearFilters,
  onRetry,
  hasActiveFilters,
}: {
  kind: EmptyKind;
  /** "car" | "bike" */
  vehicle: string;
  /** Label of a real nearby range that has availability, e.g. "24 Sep – 25 Sep". */
  nearby?: string | null;
  onNearby: () => void;
  onChangeDates: () => void;
  onClearFilters: () => void;
  onRetry: () => void;
  hasActiveFilters: boolean;
}) {
  const { colors, navy, onNavy } = useBrandColors();

  const copy = {
    dates: {
      icon: 'calendar' as const,
      title: `No ${vehicle}s available for these dates`,
      body: 'Every vehicle is booked or unavailable for your trip dates.',
    },
    filters: {
      icon: 'sliders' as const,
      title: `No ${vehicle}s match your filters`,
      body: 'Try removing a filter to see more vehicles.',
    },
    error: {
      icon: 'wifi-off' as const,
      title: 'Could not load vehicles',
      body: 'Check your connection and try again.',
    },
  }[kind];

  const primary: Action | null =
    kind === 'error'
      ? { label: 'Retry', onPress: onRetry }
      : kind === 'filters'
      ? { label: 'Clear filters', onPress: onClearFilters }
      : nearby
      ? { label: 'Try nearby dates', onPress: onNearby }
      : { label: 'Change dates', onPress: onChangeDates };

  const secondary: Action[] = [];
  if (kind === 'dates') {
    if (nearby) secondary.push({ label: 'Change dates', onPress: onChangeDates });
    if (hasActiveFilters) secondary.push({ label: 'Clear filters', onPress: onClearFilters });
  }
  if (kind === 'filters') secondary.push({ label: 'Change dates', onPress: onChangeDates });

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
        <Feather name={copy.icon} size={26} color={kind === 'error' ? colors.destructive : colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{copy.title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{copy.body}</Text>
      {kind === 'dates' && !!nearby && (
        <Text style={[styles.hint, { color: colors.foreground }]}>Available {nearby}</Text>
      )}

      {primary && (
        <Pressable
          accessibilityRole="button"
          onPress={primary.onPress}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: navy }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.primaryText, { color: onNavy }]}>{primary.label}</Text>
        </Pressable>
      )}
      {secondary.map((a) => (
        <Pressable
          key={a.label}
          accessibilityRole="button"
          onPress={a.onPress}
          style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.secondaryText, { color: colors.foreground }]}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, paddingBottom: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  hint: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 10 },
  primaryBtn: {
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondaryBtn: {
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
