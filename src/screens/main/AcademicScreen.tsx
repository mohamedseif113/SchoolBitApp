/**
 * AcademicScreen.tsx
 * Rebuilt & Redesigned Academic (الأكاديمي) section matching Web screenshots 1:1.
 *
 * 5 Sub-sections:
 * 1. المواد الدراسية (Subjects) — Ref: media_1789474402287.png
 * 2. الجدول الدراسي (Timetable) — Ref: media_1789474402461.png
 * 3. الواجبات الدراسية (Homework) — Ref: media_1789474402476.png
 * 4. أرقام الجلوس (Exam Seating) — Ref: media_1789474402508.png
 * 5. توزيع لجان الاختبارات (Exam Committees) — Ref: media_1789474402513.png
 *
 * CRITICAL: 100% Real API data. No mock/demo/fake/hardcoded data.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useUiStore } from '../../store/uiStore';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { shadows } from '../../theme/spacing';

// Sub-components matching Web Screenshots
import { SubjectsSection } from '../../components/academic/SubjectsSection';
import { TimetableSection } from '../../components/academic/TimetableSection';
import { HomeworkSection } from '../../components/academic/HomeworkSection';
import { SeatNumbersSection } from '../../components/academic/SeatNumbersSection';
import { ExamDistributionSection } from '../../components/academic/ExamDistributionSection';

type AcademicTab = 'subjects' | 'timetable' | 'homework' | 'seats' | 'exam_dist';

export default function AcademicScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const queryClient = useQueryClient();
  const initialTab = (route.params?.tab || 'subjects') as AcademicTab;
  const [activeTab, setActiveTab] = useState<AcademicTab>(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab as AcademicTab);
    }
  }, [route.params?.tab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subjects'] }),
        queryClient.invalidateQueries({ queryKey: ['schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['homework'] }),
        queryClient.invalidateQueries({ queryKey: ['examDistribution'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const tabs: { key: AcademicTab; label_ar: string; label_en: string; icon: string }[] = [
    { key: 'subjects', label_ar: 'المواد الدراسية', label_en: 'Subjects', icon: '📚' },
    { key: 'timetable', label_ar: 'الجدول الدراسي', label_en: 'Timetable', icon: '📅' },
    { key: 'homework', label_ar: 'الواجبات الدراسية', label_en: 'Homework', icon: '🎒' },
    { key: 'seats', label_ar: 'أرقام الجلوس', label_en: 'Seat Numbers', icon: '🪑' },
    { key: 'exam_dist', label_ar: 'توزيع لجان الاختبارات', label_en: 'Exam Committees', icon: '🏛️' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]} edges={['top']}>
      {/* ── Header Matching Web Top Bar ── */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>
              {isRTL ? 'البنية الأكاديمية' : 'Academic Structure'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isRTL ? 'المواد + الحصص + المراحل' : 'Subjects • Periods • Stages'}
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>SchoolBit</Text>
          </View>
        </View>

        {/* ── Sub-navigation Tabs (Web Screenshot Match) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={isRTL ? tab.label_ar : tab.label_en}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {tab.icon} {isRTL ? tab.label_ar : tab.label_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Scroll Content ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {activeTab === 'subjects' && <SubjectsSection isDark={isDark} />}
        {activeTab === 'timetable' && <TimetableSection isDark={isDark} />}
        {activeTab === 'homework' && <HomeworkSection isDark={isDark} />}
        {activeTab === 'seats' && <SeatNumbersSection isDark={isDark} />}
        {activeTab === 'exam_dist' && <ExamDistributionSection isDark={isDark} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  darkSafeArea: {
    backgroundColor: '#07132B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
    ...shadows.card,
  },
  darkHeader: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  headerTopRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
  },
  darkText: {
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#1E40AF',
  },
  tabsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#475569',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 30,
  },
});
