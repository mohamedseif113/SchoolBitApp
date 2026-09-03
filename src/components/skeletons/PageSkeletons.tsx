import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SkeletonBlock, SkeletonCircle, SkeletonText } from '../common/Skeleton';
import { useUiStore } from '../../store/uiStore';

export const DashboardSkeleton: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {/* Header Title Skeleton */}
      <View style={styles.headerBlock}>
        <SkeletonBlock width={180} height={26} borderRadius={6} />
        <SkeletonBlock width={260} height={14} borderRadius={4} />
      </View>

      {/* Top 4 Stat Cards */}
      <View style={[styles.grid4, isDesktop && styles.grid4Desktop]}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.card, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <SkeletonCircle size={38} />
              <SkeletonBlock width={60} height={20} borderRadius={10} />
            </View>
            <SkeletonBlock width={100} height={28} borderRadius={6} style={styles.my8} />
            <SkeletonBlock width={140} height={12} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Chart & Activity Section */}
      <View style={[styles.twoColRow, !isDesktop && styles.stackCol]}>
        {/* Main Chart Box */}
        <View style={[styles.card, styles.flex2, isDark && styles.darkCard]}>
          <View style={styles.cardHeaderRow}>
            <SkeletonBlock width={160} height={20} borderRadius={6} />
            <SkeletonBlock width={80} height={28} borderRadius={8} />
          </View>
          <SkeletonBlock width="100%" height={200} borderRadius={12} style={styles.my14} />
        </View>

        {/* Recent Activity List */}
        <View style={[styles.card, styles.flex1, isDark && styles.darkCard]}>
          <SkeletonBlock width={140} height={20} borderRadius={6} style={styles.mb14} />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.listItemRow}>
              <SkeletonCircle size={32} />
              <View style={styles.flex1}>
                <SkeletonBlock width="85%" height={14} borderRadius={4} />
                <SkeletonBlock width="50%" height={10} borderRadius={4} style={styles.mt4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const TablePageSkeleton: React.FC = () => {
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {/* Header & Filter Bar */}
      <View style={[styles.card, isDark && styles.darkCard]}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBlock width={200} height={24} borderRadius={6} />
          <SkeletonBlock width={120} height={36} borderRadius={10} />
        </View>

        <View style={styles.filterRow}>
          <SkeletonBlock width={220} height={38} borderRadius={10} />
          <SkeletonBlock width={100} height={38} borderRadius={10} />
          <SkeletonBlock width={100} height={38} borderRadius={10} />
        </View>
      </View>

      {/* Data Table Rows */}
      <View style={[styles.card, isDark && styles.darkCard]}>
        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <SkeletonBlock width={140} height={16} borderRadius={4} />
          <SkeletonBlock width={100} height={16} borderRadius={4} />
          <SkeletonBlock width={100} height={16} borderRadius={4} />
          <SkeletonBlock width={80} height={16} borderRadius={4} />
        </View>

        {/* 6 Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.cellUser}>
              <SkeletonCircle size={32} />
              <View>
                <SkeletonBlock width={120} height={14} borderRadius={4} />
                <SkeletonBlock width={80} height={10} borderRadius={4} style={styles.mt4} />
              </View>
            </View>
            <SkeletonBlock width={90} height={14} borderRadius={4} />
            <SkeletonBlock width={80} height={22} borderRadius={12} />
            <SkeletonCircle size={28} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const CardsGridSkeleton: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.cardHeaderRow}>
        <SkeletonBlock width={180} height={24} borderRadius={6} />
        <SkeletonBlock width={130} height={36} borderRadius={10} />
      </View>

      {/* Grid of Cards */}
      <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.gridCardItem, isDark && styles.darkCard]}>
            <View style={styles.cardHeaderRow}>
              <SkeletonCircle size={44} />
              <SkeletonBlock width={70} height={22} borderRadius={12} />
            </View>
            <SkeletonText lines={2} style={styles.my14} />
            <View style={styles.cardFooterRow}>
              <SkeletonBlock width={90} height={12} borderRadius={4} />
              <SkeletonBlock width={80} height={30} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const FormPageSkeleton: React.FC = () => {
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[styles.card, isDark && styles.darkCard]}>
        <SkeletonBlock width={220} height={26} borderRadius={6} />
        <SkeletonBlock width={300} height={14} borderRadius={4} style={styles.mt4} />

        <View style={styles.formGroup}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.fieldBlock}>
              <SkeletonBlock width={120} height={14} borderRadius={4} />
              <SkeletonBlock width="100%" height={42} borderRadius={10} />
            </View>
          ))}
          <SkeletonBlock width={140} height={42} borderRadius={10} style={styles.mt14} />
        </View>
      </View>
    </View>
  );
};

export interface PageSkeletonSelectorProps {
  routeName?: string;
}

export const PageSkeletonSelector: React.FC<PageSkeletonSelectorProps> = ({ routeName = '' }) => {
  const r = routeName.toLowerCase();
  if (r.includes('dashboard') || r === 'main' || r === 'maintabs') {
    return <DashboardSkeleton />;
  }
  if (
    r.includes('student') ||
    r.includes('attendance') ||
    r.includes('finance') ||
    r.includes('report') ||
    r.includes('summons') ||
    r.includes('noor')
  ) {
    return <TablePageSkeleton />;
  }
  if (
    r.includes('task') ||
    r.includes('hr') ||
    r.includes('staff') ||
    r.includes('committee') ||
    r.includes('homework') ||
    r.includes('portfolio')
  ) {
    return <CardsGridSkeleton />;
  }
  if (r.includes('setting') || r.includes('integration') || r.includes('behavior') || r.includes('atrisk')) {
    return <FormPageSkeleton />;
  }
  return <TablePageSkeleton />;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    width: '100%',
  },
  headerBlock: {
    gap: 6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  grid4: {
    gap: 14,
  },
  grid4Desktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stackCol: {
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cellUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardsGrid: {
    gap: 14,
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCardItem: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formGroup: {
    gap: 16,
    marginTop: 20,
  },
  fieldBlock: {
    gap: 6,
  },
  my8: {
    marginVertical: 8,
  },
  my14: {
    marginVertical: 14,
  },
  mb14: {
    marginBottom: 14,
  },
  mt4: {
    marginTop: 4,
  },
  mt14: {
    marginTop: 14,
  },
});

export default PageSkeletonSelector;
