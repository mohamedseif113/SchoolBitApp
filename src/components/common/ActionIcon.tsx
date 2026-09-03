import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../../theme/colors';

export interface ActionIconProps {
  name: IconName;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ActionIcon: React.FC<ActionIconProps> = ({
  name,
  variant = 'secondary',
  size = 18,
  onPress,
  style,
}) => {
  let bgColor = '#F1F5F9';
  let iconColor = '#475467';

  if (variant === 'primary') {
    bgColor = '#EFF4FF';
    iconColor = colors.brandPrimary;
  } else if (variant === 'danger') {
    bgColor = '#FEF3F2';
    iconColor = '#D92D20';
  } else if (variant === 'success') {
    bgColor = '#ECFDF3';
    iconColor = '#027A48';
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: bgColor }, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
    >
      <Icon name={name} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActionIcon;
