import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { usePressAnimation } from '@/hooks/usePressAnimation';

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-right',
  isLoading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const colors = useColors();
  const { scaleAnim, opacityAnim, onPressIn, onPressOut } = usePressAnimation(1, 0.97, 1, 0.8);

  const isDisabled = isLoading || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
    >
      <Animated.View
        style={[
          styles.primaryButton,
          { 
            backgroundColor: isDisabled ? colors.disabledBg : colors.primary,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.mutedForeground} style={{ marginRight: 8 }} />
        ) : null}
        <Text 
          style={[
            styles.primaryButtonText, 
            { color: isDisabled ? colors.disabledText : colors.primaryForeground }
          ]}
        >
          {label}
        </Text>
        {icon && !isLoading && (
          <Feather 
            name={icon} 
            size={18} 
            color={isDisabled ? colors.disabledText : '#000'} 
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', height: 56, justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginRight: 10 },
});
