import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';
import { Icon } from '../common/Icon';
import StudentDashboard from './StudentDashboard';
import { PortalStudent } from '../../types/auth';

interface ParentDashboardProps {
  onRefresh?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

  const { portalStudents, selectedStudent, setSelectedStudent } = useAuthStore();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const studentsList: PortalStudent[] = Array.isArray(portalStudents) && portalStudents.length > 0
    ? portalStudents
    : selectedStudent
    ? [selectedStudent]
    : [
        {
          id: 1,
          name: 'طالب تجريبي',
          class_number: 'أول/أ',
          school: 'مدرسة تجربة الواجهات',
        },
      ];

  const currentStudent = selectedStudent || studentsList[0];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Children Selector Bar (When parent has linked students) */}
      <View style={[styles.childrenCard, isDark && styles.darkCard]}>
        <View style={[styles.childrenHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.childrenTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon name="users" size={16} color={colors.blue} />
            <Text style={[styles.childrenTitle, isDark && styles.darkText]}>
              {isRTL ? 'الأبناء المرتبطون بالحساب' : 'Linked Students'}
            </Text>
          </View>
          <Text style={styles.studentsCountBadge}>{`${studentsList.length} ${isRTL ? 'أبناء' : 'students'}`}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {studentsList.map((st) => {
            const isSelected = currentStudent?.id === st.id;
            return (
              <TouchableOpacity
                key={String(st.id)}
                style={[
                  styles.childChip,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  isSelected && styles.childChipSelected,
                  isDark && styles.darkChip,
                  isSelected && isDark && styles.darkChipSelected,
                ]}
                onPress={() => setSelectedStudent(st)}
              >
                <View style={[styles.childAvatar, isSelected && styles.childAvatarSelected]}>
                  <Text style={[styles.childAvatarText, isSelected && styles.childAvatarTextSelected]}>
                    {st.name?.charAt(0) || 'ط'}
                  </Text>
                </View>
                <View style={[styles.childInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.childName, isSelected && styles.childNameSelected, isDark && styles.darkText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {st.name}
                  </Text>
                  <Text style={[styles.childClass, isSelected && styles.childClassSelected, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {st.class_number ? `الصف ${st.class_number}` : st.school || 'طالب'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Embedded Student Portal for the Active Selected Child */}
      <StudentDashboard
        studentId={currentStudent.id}
        studentName={currentStudent.name}
        classNumber={currentStudent.class_number || 'أول/أ'}
        schoolName={currentStudent.school || 'مدرسة تجربة الواجهات'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, gap: 14 },
  childrenCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E1E7F0' },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  childrenHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
childrenTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  childrenTitle: { fontSize: 13, fontWeight: '700', color: '#0A1D3D' },
  studentsCountBadge: { fontSize: 11, fontWeight: '600', color: '#1246B7', backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipsRow: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  childChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  childChipSelected: { backgroundColor: '#EEF4FF', borderColor: '#1246B7' },
  darkChip: { backgroundColor: '#091A38', borderColor: '#1E3A6E' },
  darkChipSelected: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  childAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  childAvatarSelected: { backgroundColor: '#1246B7' },
  childAvatarText: { fontSize: 13, fontWeight: '700', color: '#475467' },
  childAvatarTextSelected: { color: '#FFFFFF' },
  childInfo: { justifyContent: 'center' },
  childName: { fontSize: 12, fontWeight: '700', color: '#0A1D3D' },
  childNameSelected: { color: '#1246B7' },
  childClass: { fontSize: 10, color: '#77839B', marginTop: 1 },
  childClassSelected: { color: '#1246B7' },
  darkText: { color: '#F8FAFC' },
});

export default ParentDashboard;
