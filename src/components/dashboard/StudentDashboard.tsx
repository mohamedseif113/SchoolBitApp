import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';
import { Icon } from '../common/Icon';
import {
  getStudentSchedule,
  getStudentGrades,
  getStudentHomework,
  getStudentAttendance,
  getStudentBehavior,
  getStudentFees,
  getStudentTeachers,
  sendStudentMessage,
  getStudentRequests,
  createStudentRequest,
  getStudentSummons,
  confirmStudentSummons,
  getStudentAlerts,
  submitStudentHomework,
} from '../../api/portal';

export type PortalTab =
  | 'homework'
  | 'grades'
  | 'attendance'
  | 'behavior'
  | 'schedule'
  | 'summons'
  | 'notifications'
  | 'teachers'
  | 'fees'
  | 'requests'
  | 'report'
  | 'profile';

interface StudentDashboardProps {
  studentId?: number | string;
  studentName?: string;
  classNumber?: string;
  schoolName?: string;
  onRefresh?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentId: propStudentId,
  studentName: propStudentName,
  classNumber: propClassNumber,
  schoolName: propSchoolName,
}) => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const queryClient = useQueryClient();

  const { user, school, selectedStudent, logout } = useAuthStore();
  const { theme, lang, toggleLang } = useUiStore();
  const isDark = theme === 'dark';

  const studentId = propStudentId || selectedStudent?.id || user?.id || 1;
  const studentName = propStudentName || selectedStudent?.name || user?.name || '—';
  const classNumber = propClassNumber || selectedStudent?.class_number || user?.class_number || 'أول/أ';
  const schoolName = propSchoolName || selectedStudent?.school || school?.name || 'مدرسة تجربة الواجهات';

  const [activeTab, setActiveTab] = useState<PortalTab>('schedule');
  const [chatMessage, setChatMessage] = useState('');

  // Request Modal State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('إجازة اضطرارية');
  const [requestDescription, setRequestDescription] = useState('');

  // Homework Submit Modal State
  const [submitHwModalVisible, setSubmitHwModalVisible] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [hwAnswerText, setHwAnswerText] = useState('');

  // Portal Sub-queries
  const scheduleQuery = useQuery({
    queryKey: ['portal', 'schedule', studentId],
    queryFn: () => getStudentSchedule(studentId),
    enabled: activeTab === 'schedule',
  });

  const gradesQuery = useQuery({
    queryKey: ['portal', 'grades', studentId],
    queryFn: () => getStudentGrades(studentId),
    enabled: activeTab === 'grades',
  });

  const homeworkQuery = useQuery({
    queryKey: ['portal', 'homework', studentId],
    queryFn: () => getStudentHomework(studentId),
    enabled: activeTab === 'homework',
  });

  const attendanceQuery = useQuery({
    queryKey: ['portal', 'attendance', studentId],
    queryFn: () => getStudentAttendance(studentId),
    enabled: activeTab === 'attendance',
  });

  const behaviorQuery = useQuery({
    queryKey: ['portal', 'behavior', studentId],
    queryFn: () => getStudentBehavior(studentId),
    enabled: activeTab === 'behavior',
  });

  const feesQuery = useQuery({
    queryKey: ['portal', 'fees', studentId],
    queryFn: () => getStudentFees(studentId),
    enabled: activeTab === 'fees',
  });

  const teachersQuery = useQuery({
    queryKey: ['portal', 'teachers', studentId],
    queryFn: () => getStudentTeachers(studentId),
    enabled: activeTab === 'teachers',
  });

  const requestsQuery = useQuery({
    queryKey: ['portal', 'requests', studentId],
    queryFn: () => getStudentRequests(studentId),
    enabled: activeTab === 'requests',
  });

  const summonsQuery = useQuery({
    queryKey: ['portal', 'summons', studentId],
    queryFn: () => getStudentSummons(studentId),
    enabled: activeTab === 'summons',
  });

  const alertsQuery = useQuery({
    queryKey: ['portal', 'alerts', studentId],
    queryFn: () => getStudentAlerts(studentId),
    enabled: activeTab === 'notifications',
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (body: string) => sendStudentMessage(studentId, body),
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['portal', 'teachers', studentId] });
    },
    onError: (err: any) => {
      Alert.alert(t('common.error', 'خطأ'), err?.message || 'تعذر إرسال الرسالة');
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: { type: string; description: string }) =>
      createStudentRequest(studentId, data),
    onSuccess: () => {
      setRequestModalVisible(false);
      setRequestDescription('');
      queryClient.invalidateQueries({ queryKey: ['portal', 'requests', studentId] });
      Alert.alert(t('common.success', 'نجاح'), 'تم تقديم الطلب إلى إدارة المدرسة بنجاح');
    },
    onError: (err: any) => {
      Alert.alert(t('common.error', 'خطأ'), err?.message || 'تعذر تقديم الطلب');
    },
  });

  const confirmSummonsMutation = useMutation({
    mutationFn: (summonId: number | string) => confirmStudentSummons(studentId, summonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'summons', studentId] });
      Alert.alert(t('common.success', 'نجاح'), 'تم تأكيد استلام الاستدعاء');
    },
    onError: (err: any) => {
      Alert.alert(t('common.error', 'خطأ'), err?.message || 'تعذر تأكيد الاستلام');
    },
  });

  const submitHomeworkMutation = useMutation({
    mutationFn: (data: { submissionId: number | string; answer: string }) =>
      submitStudentHomework(studentId, data.submissionId, { answer: data.answer }),
    onSuccess: () => {
      setSubmitHwModalVisible(false);
      setHwAnswerText('');
      queryClient.invalidateQueries({ queryKey: ['portal', 'homework', studentId] });
      Alert.alert(t('common.success', 'نجاح'), 'تم تسليم الواجب بنجاح');
    },
    onError: (err: any) => {
      Alert.alert(t('common.error', 'خطأ'), err?.message || 'تعذر تسليم الواجب');
    },
  });

  const tabs: { key: PortalTab; labelAr: string; labelEn: string }[] = [
    { key: 'homework', labelAr: 'واجباتي', labelEn: 'Homework' },
    { key: 'grades', labelAr: 'درجاتي', labelEn: 'Grades' },
    { key: 'attendance', labelAr: 'حضوري', labelEn: 'Attendance' },
    { key: 'behavior', labelAr: 'سلوكي', labelEn: 'Behavior' },
    { key: 'schedule', labelAr: 'جدولي', labelEn: 'Schedule' },
    { key: 'summons', labelAr: 'استدعاءاتي', labelEn: 'Summons' },
    { key: 'notifications', labelAr: 'التنبيهات', labelEn: 'Alerts' },
    { key: 'teachers', labelAr: 'معلموني', labelEn: 'Teachers' },
    { key: 'fees', labelAr: 'رسومي', labelEn: 'Fees' },
    { key: 'requests', labelAr: 'طلباتي', labelEn: 'Requests' },
    { key: 'report', labelAr: 'تقريري', labelEn: 'Report' },
    { key: 'profile', labelAr: 'ملفي', labelEn: 'Profile' },
  ];

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'schedule':
        return { title: isRTL ? 'جدولي' : 'My Schedule', subtitle: isRTL ? 'الجدول الأسبوعي' : 'Weekly Timetable' };
      case 'grades':
        return { title: isRTL ? 'درجاتي' : 'My Grades', subtitle: isRTL ? 'الدرجات بالمواد' : 'Subject Grades' };
      case 'teachers':
        return { title: isRTL ? 'معلموني' : 'My Teachers', subtitle: isRTL ? 'محادثة مع المدرسة' : 'School Communication' };
      case 'fees':
        return { title: isRTL ? 'رسومي' : 'My Fees', subtitle: isRTL ? 'الرسوم والمسدد والمتبقي' : 'Tuition & Balance' };
      case 'requests':
        return { title: isRTL ? 'طلباتي' : 'My Requests', subtitle: isRTL ? 'ما رفعته إلى المدرسة' : 'Submitted Requests' };
      case 'homework':
        return { title: isRTL ? 'واجباتي' : 'My Homework', subtitle: isRTL ? 'الواجبات والمهام' : 'Tasks & Homework' };
      case 'attendance':
        return { title: isRTL ? 'حضوري' : 'My Attendance', subtitle: isRTL ? 'سجل الحضور والغياب' : 'Attendance Log' };
      case 'behavior':
        return { title: isRTL ? 'سلوكي' : 'My Behavior', subtitle: isRTL ? 'السجل الانضباطي' : 'Discipline Record' };
      case 'summons':
        return { title: isRTL ? 'استدعاءاتي' : 'My Summons', subtitle: isRTL ? 'استدعاءات ولي الأمر' : 'Guardian Summons' };
      case 'notifications':
        return { title: isRTL ? 'التنبيهات' : 'My Alerts', subtitle: isRTL ? 'إشعارات المدرسة' : 'School Alerts' };
      default:
        return { title: isRTL ? 'بوابتي' : 'My Portal', subtitle: schoolName };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Portal Brand Top Bar */}
      <View style={[styles.topHeaderCard, isDark && styles.darkCard]}>
        <View style={[styles.topHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.brandGroup, isRTL ? styles.alignEnd : styles.alignStart]}>
            <View style={[styles.brandTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.brandIconBox}>
                <Icon name="school" size={18} color="#FFFFFF" />
              </View>
              <View style={[styles.brandTextGroup, isRTL ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.brandTitle, isDark && styles.darkText, isRTL ? styles.rtlText : undefined]}>{headerMeta.title}</Text>
                <Text style={[styles.brandSubtitle, isDark && styles.darkSubtext, isRTL ? styles.rtlText : undefined]}>{headerMeta.subtitle}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.headerControlsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => toggleLang()}
            >
              <Text style={styles.langBtnText}>{(lang || i18n.language) === 'ar' ? 'English' : 'عربي'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutBtnText}>{isRTL ? 'خروج' : 'Logout'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student & Class Pill Banner */}
        <View style={[styles.studentBanner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.studentAvatarCircle}>
            <Text style={styles.studentAvatarText}>{studentName.charAt(0)}</Text>
          </View>
          <View style={[styles.studentBannerInfo, isRTL ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.studentBannerName, isDark && styles.darkText, isRTL ? styles.rtlText : undefined]}>{studentName}</Text>
            <Text style={[styles.studentBannerClass, isRTL ? styles.rtlText : undefined]}>{`${isRTL ? 'الصف' : 'Class'}: ${classNumber} · ${schoolName}`}</Text>
          </View>
        </View>
      </View>

      {/* 2. Portal Horizontal Scrollable Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsScrollContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabChip,
                isSelected && styles.tabChipSelected,
                isDark && styles.darkTabChip,
                isSelected && isDark && styles.darkTabChipSelected,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabChipText,
                  isSelected && styles.tabChipTextSelected,
                  isDark && styles.darkSubtext,
                  isSelected && isDark && styles.darkTabChipTextSelected,
                ]}
              >
                {isRTL ? tab.labelAr : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Portal Tab Content Views */}
      <View style={[styles.tabContentCard, isDark && styles.darkCard]}>
        {/* TAB 1: SCHEDULE (جدولي) */}
        {activeTab === 'schedule' && (
          <View style={styles.contentSection}>
            <View style={[styles.sectionHeaderRow]}>
              <Text style={[styles.sectionHeaderTitle, isDark && styles.darkText]}>
                {`${isRTL ? 'الصف' : 'Class'}: ${classNumber}`}
              </Text>
            </View>

            {scheduleQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} style={{ marginVertical: 20 }} />
            ) : Array.isArray(scheduleQuery.data) && scheduleQuery.data.length > 0 ? (
              scheduleQuery.data.map((item: any, idx: number) => (
                <View key={String(item.id || idx)} style={[styles.scheduleCard, isDark && styles.darkSubCard]}>
                  <View style={[styles.scheduleCardHeader]}>
                    <Text style={[styles.scheduleDayTitle, isDark && styles.darkText]}>{item.day || (isRTL ? 'الأحد' : 'Sunday')}</Text>
                  </View>
                  <View style={[styles.scheduleItemRow]}>
                    <Text style={styles.periodTag}>{item.period_label || `الحصة ${item.period || 1}`}</Text>
                    <Text style={[styles.subjectNameText, isDark && styles.darkText]}>{item.subject_name || item.subject || 'رياضيات'}</Text>
                    <Text style={styles.teacherNameText}>{item.teacher_name || 'معلم المادة'}</Text>
                    <Text style={styles.timeRangeText}>{item.time || '07:30:00 — 08:15:00'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.scheduleCard, isDark && styles.darkSubCard]}>
                <View style={[styles.scheduleCardHeader]}>
                  <Text style={[styles.scheduleDayTitle, isDark && styles.darkText]}>{isRTL ? 'الأحد' : 'Sunday'}</Text>
                </View>
                <View style={[styles.scheduleItemRow]}>
                  <Text style={styles.periodTag}>{isRTL ? 'الحصة الأولى' : 'Period 1'}</Text>
                  <Text style={[styles.subjectNameText, isDark && styles.darkText]}>{isRTL ? 'رياضيات' : 'Math'}</Text>
                  <Text style={styles.teacherNameText}>{isRTL ? 'معلم الاختبار' : 'Teacher'}</Text>
                  <Text style={styles.timeRangeText}>07:30:00 — 08:15:00</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: GRADES (درجاتي) */}
        {activeTab === 'grades' && (
          <View style={styles.contentSection}>
            <View style={[styles.gpaOverviewCard, isDark && styles.darkSubCard]}>
              <Text style={[styles.gpaValue, isDark && styles.darkText]}>
                {gradesQuery.data?.gpa || gradesQuery.data?.average || '—'}
              </Text>
              <Text style={[styles.gpaLabel, isDark && styles.darkSubtext]}>{isRTL ? 'المعدل العام' : 'General GPA'}</Text>
              <Text style={styles.gpaHint}>
                {isRTL ? 'المعدل محسوب على مجموع الدرجات العظمى — لا متوسط نسب متساوية' : 'GPA is calculated on total maximum points'}
              </Text>
            </View>

            {gradesQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(gradesQuery.data?.subjects) && gradesQuery.data.subjects.length > 0 ? (
              gradesQuery.data.subjects.map((sub: any, idx: number) => (
                <View key={String(sub.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <Text style={[styles.itemTitle, isDark && styles.darkText]}>{sub.name}</Text>
                  <Text style={styles.itemSubtitle}>{`${isRTL ? 'الدرجة' : 'Score'}: ${sub.score} / ${sub.max_score}`}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="barChart" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'لا درجات مرصودة بعد.' : 'No grades recorded yet.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: TEACHERS & CHAT (معلموني) */}
        {activeTab === 'teachers' && (
          <View style={styles.contentSection}>
            {teachersQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(teachersQuery.data) && teachersQuery.data.length > 0 ? (
              teachersQuery.data.map((msg: any, idx: number) => (
                <View
                  key={String(msg.id || idx)}
                  style={[
                    styles.messageBubble,
                    msg.is_outgoing ? styles.messageOutgoing : styles.messageIncoming,
                    isDark && styles.darkSubCard,
                  ]}
                >
                  <Text style={[styles.messageSender, isDark && styles.darkText]}>{msg.sender_name || 'المدرسة'}</Text>
                  <Text style={[styles.messageBody, isDark && styles.darkSubtext]}>{msg.body || msg.content}</Text>
                  <Text style={styles.messageTime}>{msg.created_at || 'الآن'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="message" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'لا رسائل بعد — اكتب أوّل رسالة.' : 'No messages yet — write the first message.'}
                </Text>
              </View>
            )}

            <View style={[styles.chatInputRow]}>
              <TextInput
                style={[styles.chatTextInput, isDark && styles.darkInput, isRTL && styles.rtlText]}
                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={chatMessage}
                onChangeText={setChatMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, sendMessageMutation.isPending && styles.btnDisabled]}
                onPress={() => {
                  if (chatMessage.trim()) sendMessageMutation.mutate(chatMessage.trim());
                }}
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendBtnText}>{isRTL ? 'أرسل' : 'Send'}</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.chatDisclaimer, isDark && styles.darkSubtext, isRTL && styles.rtlText]}>
              {isRTL ? 'تُقرأ الرسائل في أوقات الدوام. وللأمر العاجل اتصل بالمدرسة مباشرة.' : 'Messages are read during school hours. For urgent matters contact the school directly.'}
            </Text>
          </View>
        )}

        {/* TAB 4: FEES (رسومي) */}
        {activeTab === 'fees' && (
          <View style={styles.contentSection}>
            <View style={[styles.feesRow]}>
              <Text style={[styles.feesLabel, isDark && styles.darkSubtext]}>{isRTL ? 'إجمالي الرسوم' : 'Total Fees'}</Text>
              <Text style={[styles.feesValue, isDark && styles.darkText]}>
                {`${feesQuery.data?.total || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
              </Text>
            </View>
            <View style={[styles.feesRow]}>
              <Text style={[styles.feesLabel, isDark && styles.darkSubtext]}>{isRTL ? 'الخصومات' : 'Discounts'}</Text>
              <Text style={[styles.feesValue, isDark && styles.darkText]}>
                {`${feesQuery.data?.discounts || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
              </Text>
            </View>
            <View style={[styles.feesRow]}>
              <Text style={[styles.feesLabel, isDark && styles.darkSubtext]}>{isRTL ? 'المسدد' : 'Paid'}</Text>
              <Text style={[styles.feesValue, isDark && styles.darkText]}>
                {`${feesQuery.data?.paid || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
              </Text>
            </View>
            <View style={[styles.feesRow, styles.feesRowLast]}>
              <Text style={[styles.feesLabelBold, isDark && styles.darkText]}>{isRTL ? 'المتبقي' : 'Remaining Balance'}</Text>
              <Text style={[styles.feesValueBold, isDark && styles.darkText]}>
                {`${feesQuery.data?.remaining || 0} ${isRTL ? 'ر.س' : 'SAR'}`}
              </Text>
            </View>
          </View>
        )}

        {/* TAB 5: REQUESTS (طلباتي) */}
        {activeTab === 'requests' && (
          <View style={styles.contentSection}>
            <View style={[styles.requestsHeaderRow]}>
              <TouchableOpacity
                style={styles.newRequestBtn}
                onPress={() => setRequestModalVisible(true)}
              >
                <Text style={styles.newRequestBtnText}>{isRTL ? '+ طلب جديد' : '+ New Request'}</Text>
              </TouchableOpacity>
              <Text style={[styles.requestsCountText, isDark && styles.darkSubtext]}>
                {Array.isArray(requestsQuery.data) ? `${requestsQuery.data.length} ${isRTL ? 'طلبات' : 'requests'}` : isRTL ? '0 قيد الدراسة' : '0 Pending'}
              </Text>
            </View>

            {requestsQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(requestsQuery.data) && requestsQuery.data.length > 0 ? (
              requestsQuery.data.map((req: any, idx: number) => (
                <View key={String(req.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <View style={[styles.requestRowHeader]}>
                    <Text style={[styles.itemTitle, isDark && styles.darkText]}>{req.type || req.title}</Text>
                    <Text style={[styles.statusBadge, req.status === 'approved' ? styles.statusApproved : styles.statusPending]}>
                      {req.status_label || req.status || (isRTL ? 'قيد المراجعة' : 'Pending')}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{req.description || req.details}</Text>
                  <Text style={styles.dateSmall}>{req.created_at || '—'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="edit" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'لا طلبات.' : 'No requests submitted.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 6: HOMEWORK (واجباتي) */}
        {activeTab === 'homework' && (
          <View style={styles.contentSection}>
            {homeworkQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(homeworkQuery.data) && homeworkQuery.data.length > 0 ? (
              homeworkQuery.data.map((hw: any, idx: number) => (
                <View key={String(hw.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <View style={[styles.requestRowHeader]}>
                    <Text style={[styles.itemTitle, isDark && styles.darkText]}>{hw.title}</Text>
                    <TouchableOpacity
                      style={styles.actionBtnSmall}
                      onPress={() => {
                        setSelectedHomework(hw);
                        setSubmitHwModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionBtnSmallText}>{isRTL ? 'تسليم الواجب' : 'Submit'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemSubtitle}>{`${hw.subject_name || '—'} · ${isRTL ? 'الموعد' : 'Due'}: ${hw.due_date || '—'}`}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="clipboard" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'لا توجد واجبات معلقة حالياً' : 'No pending homework assignments'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 7: ATTENDANCE (حضوري) */}
        {activeTab === 'attendance' && (
          <View style={styles.contentSection}>
            {attendanceQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(attendanceQuery.data) && attendanceQuery.data.length > 0 ? (
              attendanceQuery.data.map((att: any, idx: number) => (
                <View key={String(att.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <Text style={[styles.itemTitle, isDark && styles.darkText]}>{att.date}</Text>
                  <Text style={[styles.itemSubtitle, att.status === 'absent' ? styles.statusAbsentText : styles.statusPresentText]}>
                    {att.status_label || att.status}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="chart" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'سجل الحضور مكتمل بدون غياب' : 'Attendance record is 100%'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 8: BEHAVIOR (سلوكي) */}
        {activeTab === 'behavior' && (
          <View style={styles.contentSection}>
            {behaviorQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(behaviorQuery.data) && behaviorQuery.data.length > 0 ? (
              behaviorQuery.data.map((beh: any, idx: number) => (
                <View key={String(beh.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <Text style={[styles.itemTitle, isDark && styles.darkText]}>{beh.title || beh.action}</Text>
                  <Text style={styles.itemSubtitle}>{beh.description || beh.note}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="shieldCheck" size={32} color="#12B76A" />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'السجل السلوكي متميز وبدون مخالفات' : 'Excellent behavioral record with zero violations'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 9: SUMMONS (استدعاءاتي) */}
        {activeTab === 'summons' && (
          <View style={styles.contentSection}>
            {summonsQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(summonsQuery.data) && summonsQuery.data.length > 0 ? (
              summonsQuery.data.map((sum: any, idx: number) => (
                <View key={String(sum.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <View style={[styles.requestRowHeader]}>
                    <Text style={[styles.itemTitle, isDark && styles.darkText]}>{sum.reason || sum.title}</Text>
                    {!sum.is_confirmed && (
                      <TouchableOpacity
                        style={styles.actionBtnSmall}
                        onPress={() => confirmSummonsMutation.mutate(sum.id)}
                        disabled={confirmSummonsMutation.isPending}
                      >
                        <Text style={styles.actionBtnSmallText}>{isRTL ? 'تأكيد الاستلام' : 'Confirm'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.itemSubtitle}>{`${isRTL ? 'التاريخ' : 'Date'}: ${sum.date || sum.scheduled_at}`}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="email" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'لا توجد استدعاءات لولي الأمر' : 'No guardian summons on record'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 10: ALERTS / NOTIFICATIONS (التنبيهات) */}
        {activeTab === 'notifications' && (
          <View style={styles.contentSection}>
            {alertsQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.blue} />
            ) : Array.isArray(alertsQuery.data) && alertsQuery.data.length > 0 ? (
              alertsQuery.data.map((al: any, idx: number) => (
                <View key={String(al.id || idx)} style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
                  <Text style={[styles.itemTitle, isDark && styles.darkText]}>{al.title}</Text>
                  <Text style={styles.itemSubtitle}>{al.message || al.body}</Text>
                  <Text style={styles.dateSmall}>{al.created_at || '—'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxLarge}>
                <Icon name="info" size={32} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptyTextLarge, isDark && styles.darkSubtext]}>
                  {isRTL ? 'لا توجد تنبيهات جديدة' : 'No new notifications'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 11 & 12: REPORT & PROFILE */}
        {['report', 'profile'].includes(activeTab) && (
          <View style={styles.contentSection}>
            <View style={[styles.genericItemCard, isDark && styles.darkSubCard]}>
              <Text style={[styles.itemTitle, isDark && styles.darkText]}>{studentName}</Text>
              <Text style={styles.itemSubtitle}>{`${isRTL ? 'الصف' : 'Class'}: ${classNumber}`}</Text>
              <Text style={styles.itemSubtitle}>{`${isRTL ? 'المدرسة' : 'School'}: ${schoolName}`}</Text>
            </View>
          </View>
        )}
      </View>

      {/* NEW REQUEST MODAL */}
      <Modal visible={requestModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              {isRTL ? 'تقديم طلب جديد للمدرسة' : 'Submit New Request'}
            </Text>

            <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, isRTL && styles.rtlText]}>
              {isRTL ? 'نوع الطلب' : 'Request Type'}
            </Text>
            <View style={styles.typeOptionsRow}>
              {['إجازة اضطرارية', 'تظلم درجات', 'استفسار مالي', 'طلب مستند'].map((tName) => (
                <TouchableOpacity
                  key={tName}
                  style={[styles.typeOptionChip, requestType === tName && styles.typeOptionChipActive]}
                  onPress={() => setRequestType(tName)}
                >
                  <Text style={[styles.typeOptionText, requestType === tName && styles.typeOptionTextActive]}>
                    {tName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, isRTL && styles.rtlText]}>
              {isRTL ? 'تفاصيل الطلب' : 'Request Details'} *
            </Text>
            <TextInput
              style={[styles.modalTextInput, isDark && styles.darkInput, isRTL && styles.rtlText]}
              placeholder={isRTL ? 'اكتب تفاصيل طلبك بدقة...' : 'Enter your request details...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={requestDescription}
              onChangeText={setRequestDescription}
              multiline
              numberOfLines={4}
            />

            <View style={[styles.modalBtnRow]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, createRequestMutation.isPending && styles.btnDisabled]}
                onPress={() => {
                  if (!requestDescription.trim()) {
                    Alert.alert(t('common.required', 'مطلوب'), 'يرجى كتابة تفاصيل الطلب');
                    return;
                  }
                  createRequestMutation.mutate({ type: requestType, description: requestDescription.trim() });
                }}
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{isRTL ? 'إرسال الطلب' : 'Submit'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRequestModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SUBMIT HOMEWORK MODAL */}
      <Modal visible={submitHwModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              {`${isRTL ? 'تسليم الواجب' : 'Submit Homework'}: ${selectedHomework?.title || ''}`}
            </Text>

            <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, isRTL && styles.rtlText]}>
              {isRTL ? 'إجابة الواجب أو الملاحظات' : 'Homework Answer / Notes'} *
            </Text>
            <TextInput
              style={[styles.modalTextInput, isDark && styles.darkInput, isRTL && styles.rtlText]}
              placeholder={isRTL ? 'اكتب إجابتك هنا...' : 'Type your answers here...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={hwAnswerText}
              onChangeText={setHwAnswerText}
              multiline
              numberOfLines={4}
            />

            <View style={[styles.modalBtnRow]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitHomeworkMutation.isPending && styles.btnDisabled]}
                onPress={() => {
                  if (!hwAnswerText.trim()) {
                    Alert.alert(t('common.required', 'مطلوب'), 'يرجى كتابة الإجابة');
                    return;
                  }
                  submitHomeworkMutation.mutate({
                    submissionId: selectedHomework?.id || 1,
                    answer: hwAnswerText.trim(),
                  });
                }}
                disabled={submitHomeworkMutation.isPending}
              >
                {submitHomeworkMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{isRTL ? 'تأكيد التسليم' : 'Confirm Submission'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSubmitHwModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, gap: 14 },
  topHeaderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E1E7F0' },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  rtlText: { textAlign: 'right' },
  brandGroup: { flex: 1, minWidth: 180 },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1246B7', justifyContent: 'center', alignItems: 'center' },
  brandTextGroup: { justifyContent: 'center' },
  brandTitle: { fontSize: 16, fontWeight: '800', color: '#0A1D3D' },
  brandSubtitle: { fontSize: 11, color: '#77839B', marginTop: 1 },
  headerControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E1E7F0', backgroundColor: '#F8FAFC' },
  langBtnText: { fontSize: 11, fontWeight: '700', color: '#1246B7' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FEE4E2', backgroundColor: '#FEF3F2' },
  logoutBtnText: { fontSize: 11, fontWeight: '700', color: '#F04438' },
  studentBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F2F4F7' },
  studentAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF4FF', justifyContent: 'center', alignItems: 'center' },
  studentAvatarText: { fontSize: 16, fontWeight: '800', color: '#1246B7' },
  studentBannerInfo: { flex: 1 },
  studentBannerName: { fontSize: 14, fontWeight: '700', color: '#0A1D3D' },
  studentBannerClass: { fontSize: 11, color: '#77839B', marginTop: 2 },
  tabsScrollContainer: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1E7F0' },
  tabChipSelected: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  darkTabChip: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  darkTabChipSelected: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabChipText: { fontSize: 12, fontWeight: '600', color: '#475467' },
  tabChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  darkTabChipTextSelected: { color: '#FFFFFF' },
  tabContentCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E1E7F0', minHeight: 280 },
  contentSection: { gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#0A1D3D' },
  scheduleCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  darkSubCard: { backgroundColor: '#091A38', borderColor: '#1E3A6E' },
  scheduleCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  scheduleDayTitle: { fontSize: 14, fontWeight: '800', color: '#0A1D3D' },
  scheduleItemRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  periodTag: { fontSize: 12, fontWeight: '700', color: '#1246B7' },
  subjectNameText: { fontSize: 13, fontWeight: '700', color: '#0A1D3D' },
  teacherNameText: { fontSize: 12, color: '#77839B' },
  timeRangeText: { fontSize: 11, fontWeight: '600', color: '#475467' },
  gpaOverviewCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  gpaValue: { fontSize: 28, fontWeight: '800', color: '#0A1D3D' },
  gpaLabel: { fontSize: 12, fontWeight: '700', color: '#475467', marginTop: 4 },
  gpaHint: { fontSize: 10, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  emptyBoxLarge: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTextLarge: { fontSize: 13, fontWeight: '500', color: '#77839B', textAlign: 'center' },
  chatInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  chatTextInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#0A1D3D' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  sendBtn: { backgroundColor: '#1246B7', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  chatDisclaimer: { fontSize: 10, color: '#94A3B8', marginTop: 6 },
  feesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  feesRowLast: { borderBottomWidth: 0 },
  feesLabel: { fontSize: 12, color: '#475467' },
  feesValue: { fontSize: 13, fontWeight: '600', color: '#0A1D3D' },
  feesLabelBold: { fontSize: 13, fontWeight: '800', color: '#0A1D3D' },
  feesValueBold: { fontSize: 14, fontWeight: '800', color: '#1246B7' },
  requestsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  newRequestBtn: { backgroundColor: '#1246B7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newRequestBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  requestsCountText: { fontSize: 11, color: '#77839B', fontWeight: '600' },
  genericItemCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#0A1D3D' },
  itemSubtitle: { fontSize: 11, color: '#77839B' },
  statusPresentText: { color: '#12B76A', fontWeight: '700' },
  statusAbsentText: { color: '#F04438', fontWeight: '700' },
  dateSmall: { fontSize: 10, color: '#94A3B8' },
  requestRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 10, fontWeight: '700' },
  statusApproved: { backgroundColor: '#D1FADF', color: '#027A48' },
  statusPending: { backgroundColor: '#FEF0C7', color: '#B54708' },
  actionBtnSmall: { backgroundColor: '#1246B7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionBtnSmallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  messageBubble: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 },
  messageIncoming: { alignSelf: 'flex-start', maxWidth: '85%' },
  messageOutgoing: { alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: '#EEF4FF', borderColor: '#C7D7FE' },
  messageSender: { fontSize: 11, fontWeight: '700', color: '#1246B7' },
  messageBody: { fontSize: 12, color: '#344054' },
  messageTime: { fontSize: 9, color: '#94A3B8', alignSelf: 'flex-end' },
  darkText: { color: '#F8FAFC' },
  darkSubtext: { color: '#94A3B8' },
  btnDisabled: { opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0A1D3D', marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#344054' },
  typeOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeOptionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  typeOptionChipActive: { backgroundColor: '#EEF4FF', borderColor: '#1246B7' },
  typeOptionText: { fontSize: 11, color: '#475467', fontWeight: '600' },
  typeOptionTextActive: { color: '#1246B7', fontWeight: '700' },
  modalTextInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, padding: 12, fontSize: 13, color: '#0A1D3D', textAlignVertical: 'top' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalSubmitBtn: { flex: 1, backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalSubmitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  modalCancelBtn: { flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelBtnText: { color: '#475467', fontSize: 13, fontWeight: '700' },
});

export default StudentDashboard;
