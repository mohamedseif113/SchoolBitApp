import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { signup } from '../../services/auth';
import { useUiStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { AuthLayout } from '../../components/auth/AuthLayout';

export default function SignupScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    schoolType: 'private',
    sectorType: 'boys',
    schoolName: '',
    region: '',
    city: '',
    district: '',
    educationDepartment: '',
    licenseNumber: '',
    stages: [] as string[],
    repName: '',
    repPosition: '',
    repNationalId: '',
    repMobile: '',
    repEmail: '',
    password: '',
    termsAccepted: true,
    licenseFile: null as string | null,
  });

  const toggleStage = (stage: string) => {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    }));
  };

  const handlePickDocument = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          isRTL ? 'إذن الوصول مطلوب' : 'Permission Required',
          isRTL ? 'يرجى تفعيل إذن الصور لإرفاق صورة الترخيص.' : 'Please allow access to photos to upload license.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setForm((prev) => ({ ...prev, licenseFile: result.assets[0].uri }));
      }
    } catch (err) {
      console.log('Error picking document:', err);
    }
  };

  const handleSignup = async () => {
    if (!form.schoolName.trim() || !form.repEmail.trim() || !form.password.trim()) {
      Alert.alert(
        t('common.required', 'مطلوب'),
        isRTL
          ? 'يرجى إكمال البيانات الأساسية (اسم المدرسة، البريد الرسمي، وكلمة المرور).'
          : 'Please complete required fields (School name, Official email, and Password).'
      );
      return;
    }

    if (!form.termsAccepted) {
      Alert.alert(
        t('common.required', 'مطلوب'),
        isRTL ? 'يرجى الموافقة على شروط الاستخدام.' : 'Please accept the terms of service.'
      );
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      Alert.alert(
        t('common.success', 'نجاح'),
        isRTL
          ? 'تم تسجيل طلب مدرستك بنجاح! سيتم مراجعة الطلب وتفعيل الحساب.'
          : 'School registration submitted successfully! Your account is pending activation.',
        [
          {
            text: t('common.done', 'تم'),
            onPress: () => navigation.navigate('LoginScreen'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        t('common.error', 'خطأ'),
        err?.message || (isRTL ? 'تعذر إتمام تسجيل المدرسة' : 'Failed to register school')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="signup"
      onSelectTab={(tab) => {
        if (tab === 'login') {
          navigation.navigate('LoginScreen');
        }
      }}
    >
      <View style={[styles.card, isDark && styles.darkCard]}>
        {/* Header Title */}
        <View style={styles.cardHeader}>
          <AppText variant="hero" weight="bold" color={isDark ? '#FFFFFF' : '#0B1938'} style={styles.title}>
            {isRTL ? 'تسجيل مدرسة جديدة' : 'Register New School'}
          </AppText>
          <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#64748B'}>
            {isRTL ? 'سجّل مدرستك، وتبدأ تجربتك المجانية فور إنشاء الحساب.' : 'Register your school and start your free trial immediately.'}
          </AppText>
        </View>

        {/* Step Indicator Bar matching Screenshot 2 */}
        <View style={styles.stepsBarContainer}>
          <View style={[styles.stepItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stepBadge, styles.stepBadgeActive]}>
              <AppText variant="captionBold" color="#FFFFFF">1</AppText>
            </View>
            <AppText
              variant="captionBold"
              color={isDark ? '#FFFFFF' : colors.brandPrimary}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.stepText}
            >
              {isRTL ? 'بيانات المدرسة' : 'School Details'}
            </AppText>
          </View>

          <View style={[styles.stepLine, isDark && styles.darkStepLine]} />

          <View style={[styles.stepItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stepBadge, isDark && styles.darkStepBadge]}>
              <AppText variant="captionBold" color={isDark ? '#94A3B8' : '#64748B'}>2</AppText>
            </View>
            <AppText
              variant="caption"
              color={isDark ? '#94A3B8' : '#64748B'}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.stepText}
            >
              {isRTL ? 'بيانات المفوض' : 'Commissioner'}
            </AppText>
          </View>

          <View style={[styles.stepLine, isDark && styles.darkStepLine]} />

          <View style={[styles.stepItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stepBadge, isDark && styles.darkStepBadge]}>
              <AppText variant="captionBold" color={isDark ? '#94A3B8' : '#64748B'}>3</AppText>
            </View>
            <AppText
              variant="caption"
              color={isDark ? '#94A3B8' : '#64748B'}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.stepText}
            >
              {isRTL ? 'التفعيل' : 'Activation'}
            </AppText>
          </View>
        </View>

        {/* Required Fields Subnote */}
        <AppText variant="caption" color={isDark ? '#64748B' : '#77839B'} style={styles.fieldsNote}>
          {isRTL
            ? 'الحقول المعلمة بـ * مطلوبة، ولا يُستغل منها سوى لأغراض التوثيق والترخيص.'
            : 'Fields marked with * are required for verification & licensing.'}
        </AppText>

        {/* SECTION 1: SCHOOL DETAILS */}
        <View style={styles.sectionBlock}>
          {/* School Type Selector */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                {isRTL ? 'نوع المدرسة' : 'School Type'}
              </AppText>
              <AppText variant="label" color="#D92D20">*</AppText>
            </View>

            <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {[
                { id: 'private', ar: 'أهلية', en: 'Private' },
                { id: 'international', ar: 'عالمية', en: 'International' },
                { id: 'government', ar: 'حكومية', en: 'Government' },
              ].map((type) => {
                const isSelected = form.schoolType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.selectorPill,
                      isDark && styles.darkSelectorPill,
                      isSelected && [styles.selectorPillActive, isDark && styles.darkSelectorPillActive],
                    ]}
                    onPress={() => setForm({ ...form, schoolType: type.id })}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color={isSelected ? (isDark ? '#6EC5FF' : colors.brandPrimary) : isDark ? '#94A3B8' : '#475467'}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.selectorPillText}
                    >
                      {isRTL ? type.ar : type.en}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sector Type Selector (Gender/Boys/Girls) */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                {isRTL ? 'نوع القطاع' : 'Sector Type'}
              </AppText>
              <AppText variant="label" color="#D92D20">*</AppText>
            </View>

            <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {[
                { id: 'boys', ar: 'بنين', en: 'Boys' },
                { id: 'girls', ar: 'بنات', en: 'Girls' },
                { id: 'coed', ar: 'مشترك', en: 'Co-ed' },
              ].map((sector) => {
                const isSelected = form.sectorType === sector.id;
                return (
                  <TouchableOpacity
                    key={sector.id}
                    style={[
                      styles.selectorPill,
                      isDark && styles.darkSelectorPill,
                      isSelected && [styles.selectorPillActive, isDark && styles.darkSelectorPillActive],
                    ]}
                    onPress={() => setForm({ ...form, sectorType: sector.id })}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color={isSelected ? (isDark ? '#6EC5FF' : colors.brandPrimary) : isDark ? '#94A3B8' : '#475467'}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.selectorPillText}
                    >
                      {isRTL ? sector.ar : sector.en}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* School Name Input */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                {isRTL ? 'اسم المدرسة' : 'School Name'}
              </AppText>
              <AppText variant="label" color="#D92D20">*</AppText>
            </View>
            <TextInput
              style={[
                styles.input,
                isDark && styles.darkInput,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
              placeholder={isRTL ? 'مدرسة الرواد الأهلية...' : 'e.g. Al-Rowad Private School...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={form.schoolName}
              onChangeText={(val) => setForm({ ...form, schoolName: val })}
            />
          </View>

          {/* Region & City Row */}
          <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'المنطقة' : 'Region'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={isRTL ? 'منطقة الرياض' : 'Riyadh Region'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.region}
                onChangeText={(val) => setForm({ ...form, region: val })}
              />
            </View>

            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'المدينة' : 'City'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={isRTL ? 'الرياض' : 'Riyadh'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.city}
                onChangeText={(val) => setForm({ ...form, city: val })}
              />
            </View>
          </View>

          {/* Education Department & License Number Row */}
          <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'إدارة التعليم' : 'Education Dept'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={isRTL ? 'إدارة تعليم الرياض' : 'Riyadh Edu Admin'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.educationDepartment}
                onChangeText={(val) => setForm({ ...form, educationDepartment: val })}
              />
            </View>

            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'رقم الترخيص' : 'License No.'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder="LIC-88214"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.licenseNumber}
                onChangeText={(val) => setForm({ ...form, licenseNumber: val })}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Educational Stages Multi-select Pills */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                {isRTL ? 'المراحل الدراسية' : 'Educational Stages'}
              </AppText>
              <AppText variant="label" color="#D92D20">*</AppText>
            </View>

            <View style={[styles.stagesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {[
                { id: 'kindergarten', ar: 'رياض الأطفال', en: 'Kindergarten' },
                { id: 'primary', ar: 'إبتدائية', en: 'Primary' },
                { id: 'intermediate', ar: 'متوسطة', en: 'Intermediate' },
                { id: 'secondary', ar: 'ثانوية', en: 'Secondary' },
              ].map((stage) => {
                const isSelected = form.stages.includes(stage.id);
                return (
                  <TouchableOpacity
                    key={stage.id}
                    style={[
                      styles.stagePill,
                      isDark && styles.darkStagePill,
                      isSelected && styles.stagePillActive,
                    ]}
                    onPress={() => toggleStage(stage.id)}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#475467'}
                    >
                      {isRTL ? stage.ar : stage.en}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <AppText variant="caption" color={isDark ? '#64748B' : '#94A3B8'}>
              {isRTL ? 'اختر مرحلة واحدة على الأقل — يمكن تعديلها لاحقاً' : 'Select at least one stage — customizable later'}
            </AppText>
          </View>
        </View>

        <View style={[styles.sectionDivider, isDark && styles.darkSectionDivider]} />

        {/* SECTION 2: COMMISSIONER DETAILS */}
        <View style={styles.sectionBlock}>
          <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0B1938'}>
            {isRTL ? 'تفاصيل المفوض / مسؤول المدرسة' : 'Commissioner / Admin Details'}
          </AppText>

          {/* Full Name */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                {isRTL ? 'الاسم الكامل للمفوض' : 'Full Name'}
              </AppText>
              <AppText variant="label" color="#D92D20">*</AppText>
            </View>
            <TextInput
              style={[
                styles.input,
                isDark && styles.darkInput,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
              placeholder={isRTL ? 'قاسم عبدالله الشهري...' : 'Full name...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={form.repName}
              onChangeText={(val) => setForm({ ...form, repName: val })}
            />
          </View>

          {/* Position & National ID Row */}
          <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'الصفة الوظيفية' : 'Position'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={isRTL ? 'مدير المدرسة / المالك' : 'Principal / Owner'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.repPosition}
                onChangeText={(val) => setForm({ ...form, repPosition: val })}
              />
            </View>

            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'رقم الهوية' : 'National ID'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder="1042071560"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.repNationalId}
                onChangeText={(val) => setForm({ ...form, repNationalId: val })}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Mobile & Email Row */}
          <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'رقم الجوال' : 'Mobile'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder="0566214870"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.repMobile}
                onChangeText={(val) => setForm({ ...form, repMobile: val })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.flexField}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'البريد الرسمي' : 'Official Email'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder="name@school.sa"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.repEmail}
                onChangeText={(val) => setForm({ ...form, repEmail: val })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                {isRTL ? 'كلمة المرور' : 'Password'}
              </AppText>
              <AppText variant="label" color="#D92D20">*</AppText>
            </View>
            <TextInput
              style={[
                styles.input,
                isDark && styles.darkInput,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
              placeholder={isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={form.password}
              onChangeText={(val) => setForm({ ...form, password: val })}
              secureTextEntry
            />
          </View>
        </View>

        {/* Upload License Dropzone Card matching Screenshot 2 */}
        <TouchableOpacity
          style={[styles.uploadDropzone, isDark && styles.darkUploadDropzone]}
          onPress={handlePickDocument}
          activeOpacity={0.8}
        >
          <View style={[styles.uploadIconBadge, isDark && styles.darkUploadIconBadge]}>
            <Icon name="fileText" size={24} color={colors.brandPrimary} />
          </View>

          <AppText variant="bodyBold" color={isDark ? '#FFFFFF' : '#0A1D3D'} align="center">
            {form.licenseFile
              ? (isRTL ? '✓ تم إرفاق صورة الترخيص' : '✓ License Document Attached')
              : (isRTL ? 'ارفع صورة الترخيص أو السجل' : 'Upload License or Registration Image')}
          </AppText>

          <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} align="center">
            {isRTL ? 'PDF أو صورة · حتى 5 MB · يمكن إرفاقها لاحقاً' : 'PDF or image · up to 5 MB · can attach later'}
          </AppText>
        </TouchableOpacity>

        {/* Info Notice Box matching Screenshot 2 */}
        <View style={[styles.infoNoticeBox, isDark && styles.darkInfoNoticeBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Icon name="info" size={16} color={isDark ? '#6EC5FF' : colors.brandPrimary} />
          <AppText variant="caption" color={isDark ? '#94A3B8' : '#475467'} style={{ flex: 1 }}>
            {isRTL
              ? 'هذا هو حساب المدرسة الرئيسي. بعد اعتماد الترخيص تُنشئ منه حسابات المعلمين والطلاب وأولياء الأمور وتوزّع الصلاحيات.'
              : 'This is the main school admin account. Once approved, you create teacher, student, and parent accounts.'}
          </AppText>
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          style={[styles.checkboxRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => setForm({ ...form, termsAccepted: !form.termsAccepted })}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, form.termsAccepted && styles.checkboxChecked]}>
            {form.termsAccepted && <Icon name="check" size={14} color="#FFFFFF" />}
          </View>
          <AppText variant="captionBold" color={isDark ? '#E2E8F0' : '#344054'}>
            {isRTL ? 'أوافق على شروط الاستخدام وسياسة الخصوصية' : 'I agree to the Terms of Service & Privacy Policy'}
          </AppText>
        </TouchableOpacity>

        {/* Primary Submit Button */}
        <TouchableOpacity
          style={[styles.primarySubmitBtn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <AppText variant="button" color="#FFFFFF">
              {isRTL ? 'ابدأ التجربة المجانية' : 'Start Free Trial'}
            </AppText>
          )}
        </TouchableOpacity>

        <AppText variant="caption" color={isDark ? '#64748B' : '#94A3B8'} align="center" style={styles.approvalNote}>
          {isRTL
            ? 'يرجى مراجعة الترخيص خلال يوم عمل، ثم يتم تفعيل حسابك وتبدأ أيام التجربة السبعة — لا يلزم بطاقة بنكية.'
            : 'License review takes 1 business day, then trial begins — no credit card required.'}
        </AppText>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(10, 29, 61, 0.05)',
      },
      default: {
        shadowColor: '#0A1D3D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  darkCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  cardHeader: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  stepsBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: colors.brandPrimary,
  },
  darkStepBadge: {
    backgroundColor: '#1E3A6E',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  darkStepLine: {
    backgroundColor: '#1E3A6E',
  },
  stepText: {
    fontSize: 11,
  },
  fieldsNote: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionBlock: {
    gap: 14,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  darkSectionDivider: {
    backgroundColor: '#1E3A6E',
  },
  fieldBlock: {
    gap: 6,
  },
  labelRow: {
    alignItems: 'center',
    gap: 4,
  },
  pillsRow: {
    gap: 6,
  },
  selectorPill: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPillText: {
    fontSize: 12,
    textAlign: 'center',
  },
  darkSelectorPill: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  selectorPillActive: {
    backgroundColor: '#EFF4FF',
    borderColor: colors.brandPrimary,
  },
  darkSelectorPillActive: {
    backgroundColor: '#1E3A6E',
    borderColor: '#6EC5FF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0A1D3D',
  },
  darkInput: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
    color: '#FFFFFF',
  },
  rowGrid: {
    gap: 12,
  },
  flexField: {
    flex: 1,
    gap: 6,
  },
  stagesRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  stagePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkStagePill: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  stagePillActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  uploadDropzone: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  darkUploadDropzone: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  uploadIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  darkUploadIconBadge: {
    backgroundColor: '#1E3A6E',
  },
  infoNoticeBox: {
    backgroundColor: '#EFF4FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D5E2F8',
  },
  darkInfoNoticeBox: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  checkboxRow: {
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  primarySubmitBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  approvalNote: {
    fontSize: 11,
    lineHeight: 16,
  },
});
