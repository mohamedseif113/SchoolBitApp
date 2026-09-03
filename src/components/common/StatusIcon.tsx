import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon';

export interface StatusIconProps {
  status: 'success' | 'warning' | 'danger' | 'info';
  size?: number;
  style?: ViewStyle;
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = 18,
  style,
}) => {
  let iconName: IconName = 'info';
  let iconColor = '#027A48';
  let bgColor = '#ECFDF3';

  if (status === 'success') {
    iconName = 'check';
    iconColor = '#027A48';
    bgColor = '#ECFDF3';
  } else if (status === 'warning') {
    iconName = 'alertTriangle';
    iconColor = '#B54708';
    bgColor = '#FFFAEB';
  } else if (status === 'danger') {
    iconName = 'close';
    iconColor = '#D92D20';
    bgColor = '#FEF3F2';
  } else if (status === 'info') {
    iconName = 'info';
    iconColor = '#175CD3';
    bgColor = '#EFF4FF';
  }

  return (
    <View style={[styles.container, { width: size * 1.6, height: size * 1.6, borderRadius: (size * 1.6) / 2, backgroundColor: bgColor }, style]}>
      <Icon name={iconName} size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatusIcon;
