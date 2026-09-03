import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useUiStore } from '../../store/uiStore';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle | (ViewStyle | undefined)[];
}

export const SkeletonBlock: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.95,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  const backgroundColor = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCircle: React.FC<{ size?: number; style?: ViewStyle }> = ({
  size = 40,
  style,
}) => {
  return <SkeletonBlock width={size} height={size} borderRadius={size / 2} style={style} />;
};

export const SkeletonText: React.FC<{
  lines?: number;
  height?: number;
  gap?: number;
  style?: ViewStyle;
}> = ({ lines = 2, height = 14, gap = 8, style }) => {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          width={index === lines - 1 && lines > 1 ? '65%' : '100%'}
          height={height}
          borderRadius={4}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    overflow: 'hidden',
  },
});

export default SkeletonBlock;
