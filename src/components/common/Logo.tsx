import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

interface LogoProps {
  variant?: 'full' | 'compact' | 'light';
  size?: 'small' | 'medium' | 'large' | number;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', style }) => {
  let height = 38;
  if (typeof size === 'number') {
    height = size;
  } else if (size === 'small') {
    height = 28;
  } else if (size === 'medium') {
    height = 42;
  } else if (size === 'large') {
    height = 54;
  }

  // SchoolBit logo aspect ratio (~2.5:1)
  const width = Math.round(height * 2.5);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/android-icon-foreground.png')}
        style={[styles.image, { width, height } as ImageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    maxWidth: '100%',
  },
});

export default Logo;
