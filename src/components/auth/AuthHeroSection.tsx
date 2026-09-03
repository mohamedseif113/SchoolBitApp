import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { Logo } from '../common/Logo';
import { colors } from '../../theme/colors';

interface AuthHeroSectionProps {
  isRTL: boolean;
  mode?: 'login' | 'signup';
}

export const AuthHeroSection: React.FC<AuthHeroSectionProps> = ({ isRTL, mode = 'login' }) => {
  const title = mode === 'login'
    ? isRTL ? 'مستقبل التعليم يبدأ من هنا' : 'The Future of Education Starts Here'
    : isRTL ? 'تواصل أسهل.. أثر أكبر' : 'Easier Communication... Greater Impact';

  const subtitle = mode === 'login'
    ? isRTL ? 'سكول بت — منصة تجمع التقنية والتعليم في تجربة واحدة' : 'SchoolBit — A platform uniting technology & education'
    : isRTL ? 'رسائل وتنبيهات ونظام مترابط لإدارة كافة العمليات المدرسة' : 'Connected system for seamless school management & communication';

  const pagination = mode === 'login' ? '04 / 05' : '01 / 03';

  return (
    <View style={styles.heroContainer}>
      {/* Top Header Row with Trial Badge & Logo */}
      <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.badgePill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Icon name="zap" size={12} color="#6EC5FF" />
          <AppText variant="captionBold" color="#6EC5FF">
            {isRTL ? 'تجربة مجانية 7 أيام' : '7 Days Free Trial'}
          </AppText>
        </View>

        <Logo size="small" />
      </View>

      {/* Main Glassmorphic Showcase Card */}
      <View style={styles.showcaseCard}>
        {/* Banner Image Preview */}
        <View style={styles.imageBox}>
          <Image
            source={require('../../../assets/firstbackground.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />

          {/* Overlay Text Inside Card */}
          <View style={styles.cardOverlayContent}>
            <AppText variant="h1" color="#FFFFFF" align="center" style={styles.heroCardTitle}>
              {title}
            </AppText>
            <AppText variant="caption" color="#CBD5E1" align="center" style={styles.heroCardSubtitle}>
              {subtitle}
            </AppText>
          </View>
        </View>

        {/* Feature Pills inside showcase card */}
        <View style={[styles.featurePillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.miniFeaturePill}>
            <Icon name="shield" size={12} color="#6EC5FF" />
            <AppText variant="captionBold" color="#E2E8F0">
              {isRTL ? 'رؤية ثاقبة' : 'Insights'}
            </AppText>
          </View>
          <View style={styles.miniFeaturePill}>
            <Icon name="message" size={12} color="#6EC5FF" />
            <AppText variant="captionBold" color="#E2E8F0">
              {isRTL ? 'تواصل فعال' : 'Chat'}
            </AppText>
          </View>
          <View style={styles.miniFeaturePill}>
            <Icon name="staff" size={12} color="#6EC5FF" />
            <AppText variant="captionBold" color="#E2E8F0">
              {isRTL ? 'إدارة سهلة' : 'Management'}
            </AppText>
          </View>
          <View style={styles.miniFeaturePill}>
            <Icon name="school" size={12} color="#6EC5FF" />
            <AppText variant="captionBold" color="#E2E8F0">
              {isRTL ? 'تعليم آلي' : 'AI Education'}
            </AppText>
          </View>
        </View>
      </View>

      {/* Carousel Dots & Number */}
      <View style={[styles.paginationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <AppText variant="captionBold" color="#94A3B8" isNumeric>
          {pagination}
        </AppText>
        <View style={[styles.progressSegments, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.segment, styles.segmentActive]} />
          <View style={styles.segment} />
          <View style={styles.segment} />
          <View style={styles.segment} />
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.statItem}>
            <AppText variant="h1" color="#FFFFFF" align="center" isNumeric style={styles.statVal}>
              +20,000
            </AppText>
            <AppText variant="caption" color="#94A3B8" align="center">
              {isRTL ? 'جهة تعتمد على كوربت' : 'Entities Trust Corbit'}
            </AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText variant="h1" color="#FFFFFF" align="center" isNumeric style={styles.statVal}>
              +20
            </AppText>
            <AppText variant="caption" color="#94A3B8" align="center">
              {isRTL ? 'سنة خبرة في التعليم' : 'Years Experience'}
            </AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText variant="h1" color="#FFFFFF" align="center" isNumeric style={styles.statVal}>
              99%
            </AppText>
            <AppText variant="caption" color="#94A3B8" align="center">
              {isRTL ? 'نسبة رضا العملاء' : 'Client Satisfaction'}
            </AppText>
          </View>
        </View>

        {/* 24/7 Banner */}
        <View style={styles.supportBanner}>
          <AppText variant="h2" color="#6EC5FF" align="center" isNumeric style={styles.support247Title}>
            24/7
          </AppText>
          <AppText variant="captionBold" color="#CBD5E1" align="center">
            {isRTL ? 'دعم فني على مدار الساعة' : 'Round the Clock Technical Support'}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    flex: 1,
    backgroundColor: '#07132B',
    padding: 28,
    justifyContent: 'space-between',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E3A6E',
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 136, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 197, 255, 0.3)',
  },
  showcaseCard: {
    backgroundColor: '#0B1938',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3A6E',
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  imageBox: {
    height: 220,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 19, 43, 0.65)',
  },
  cardOverlayContent: {
    padding: 16,
    zIndex: 2,
  },
  heroCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroCardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  featurePillsRow: {
    padding: 12,
    backgroundColor: '#091630',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 6,
  },
  miniFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  paginationRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  progressSegments: {
    gap: 6,
    alignItems: 'center',
  },
  segment: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1E3A6E',
  },
  segmentActive: {
    width: 36,
    backgroundColor: colors.brandPrimary,
  },
  statsGrid: {
    gap: 16,
    backgroundColor: 'rgba(15, 36, 74, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A6E',
  },
  statsRow: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E3A6E',
  },
  supportBanner: {
    borderTopWidth: 1,
    borderTopColor: '#1E3A6E',
    paddingTop: 10,
    alignItems: 'center',
  },
  support247Title: {
    fontSize: 22,
    fontWeight: '900',
  },
});

export default AuthHeroSection;
