import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { Icon, IconName } from './Icon';
import { AppText } from './AppText';

export interface IconButtonProps {
  name: IconName;
  size?: number;
  color?: string;
  backgroundColor?: string;
  badge?: number | string;
  badgeColor?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | (ViewStyle | undefined)[];
  accessibilityLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 20,
  color = '#0A1D3D',
  backgroundColor,
  badge,
  badgeColor = '#D92D20',
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        backgroundColor ? { backgroundColor } : null,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
    >
      <Icon name={name} size={size} color={color} />
      {badge !== undefined && badge !== null && (
        <View style={[styles.badgeContainer, { backgroundColor: badgeColor }]}>
          <AppText variant="caption" color="#FFFFFF" style={styles.badgeText}>
            {typeof badge === 'number' && badge > 99 ? '99+' : String(badge)}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});

export default IconButton;
