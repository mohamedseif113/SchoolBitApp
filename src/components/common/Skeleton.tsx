import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { useAppDirection } from '../../hooks/useAppDirection';

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
  const { isRTL } = useAppDirection();
  return (
    <View style={[{ gap, alignItems: isRTL ? 'flex-end' : 'flex-start' }, style]}>
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

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { isRTL } = useAppDirection();
  return (
    <View style={[styles.cardSkeleton, style]}>
      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <SkeletonCircle size={40} />
        <View style={{ flex: 1, gap: 6, marginHorizontal: 10 }}>
          <SkeletonBlock width="70%" height={16} borderRadius={4} />
          <SkeletonBlock width="40%" height={12} borderRadius={4} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={12} borderRadius={4} style={{ marginTop: 10 }} />
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number; style?: ViewStyle }> = ({ count = 5, style }) => {
  return (
    <View style={[{ gap: 12 }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    overflow: 'hidden',
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    alignItems: 'center',
  },
});

export default SkeletonBlock;

