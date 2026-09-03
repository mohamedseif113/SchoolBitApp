import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUiStore } from '../../store/uiStore';
import { useAppDirection } from '../../hooks/useAppDirection';
import { Icon } from './Icon';
import { AppText } from './AppText';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightAction,
}) => {
  const navigation = useNavigation();
  const { theme } = useUiStore();
  const { isRTL } = useAppDirection();
  const isDark = theme === 'dark';

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.headerContainer, isDark && styles.darkHeaderContainer]}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Start / Back Button — places on leading side */}
        {showBack ? (
          <TouchableOpacity
            style={[styles.backButton, isDark && styles.darkButton]}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? 'رجوع' : 'Back'}
          >
            {/*
              Use a single chevronLeft icon with scaleX(-1) for RTL.
              This mirrors the glyph correctly without switching icon names.
            */}
            <Icon
              name="chevronLeft"
              size={20}
              color={isDark ? '#F8FAFC' : '#0A1D3D'}
              style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* Title & Subtitle — alignStart = leading edge, auto-correct in RTL */}
        <View style={[styles.titleGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <AppText
            variant="h2"
            weight="bold"
            numberOfLines={1}
            style={[styles.headerTitle, isDark ? styles.darkText : undefined]}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="caption"
              weight="medium"
              numberOfLines={1}
              color={isDark ? '#94A3B8' : '#64748B'}
              style={styles.headerSubtitle}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {/* End / Action Slot — native RTL places this on trailing side */}
        <View style={styles.rightActionSlot}>
          {rightAction || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  darkHeaderContainer: {
    backgroundColor: '#0A1D3D',
    borderBottomColor: '#1E3A6E',
  },
  headerRow: {
    flexDirection: 'row',      // native RTL flips this automatically
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkButton: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  titleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  rightActionSlot: {
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 38,
  },
  darkText: {
    color: '#F8FAFC',
  },
});

export default ScreenHeader;
