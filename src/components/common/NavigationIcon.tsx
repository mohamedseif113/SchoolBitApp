import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../../theme/colors';

export interface NavigationIconProps {
  name: IconName;
  focused?: boolean;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle;
}

export const NavigationIcon: React.FC<NavigationIconProps> = ({
  name,
  focused = false,
  size = 20,
  activeColor = colors.brandPrimary,
  inactiveColor = '#77839B',
  style,
}) => {
  const color = focused ? activeColor : inactiveColor;

  return (
    <View style={[styles.container, focused && styles.focusedContainer, style]}>
      <Icon name={name} size={size} color={color} strokeWidth={focused ? 2.2 : 1.8} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  focusedContainer: {
    transform: [{ scale: 1.05 }],
  },
});

export default NavigationIcon;
