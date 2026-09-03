import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { AuthLayout } from '../../components/auth/AuthLayout';

type PortalAuthMethod = 'otp' | 'password';

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const { login, portalRequestCode, portalVerifyCode } = useAuthStore();

  const [authMethod, setAuthMethod] = useState<PortalAuthMethod>('password');

  // Staff / Credential Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Portal OTP State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  // 1. Staff / Credential Login Handler
  const handleCredentialLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(
        isRTL
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter your email and password'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await login({ email: trimmedEmail, password });

      if (res?.requires_2fa) {
        navigation.navigate('TwoFaScreen', {
          sessionId: res.session_id,
          maskedPhone: res.phone_masked || res.masked_phone,
        });
      }
    } catch (err: any) {
      if (err?.status === 403 && err?.registration) {
        navigation.navigate('RegistrationStatusScreen', { registration: err.registration });
      } else if (err?.status === 422) {
        setError(isRTL ? 'البيانات المدخلة غير صحيحة' : 'Invalid login credentials.');
      } else if (err?.status === 429) {
        setError(isRTL ? 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة بعد قليل' : 'Too many attempts. Please try again later.');
      } else {
        const arabicMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        const localizedMsg = t('auth.login_error', arabicMsg);
        setError(localizedMsg || arabicMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Portal Request Code (OTP Step 1)
  const handleRequestOtp = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setError(
        isRTL
          ? 'يرجى إدخال رقم جوال صحيح مسجل لدى المدرسة (مثال: 05xxxxxxxx)'
          : 'Please enter a valid registered phone number (e.g. 05xxxxxxxx)'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInfoMessage(null);

      const res = await portalRequestCode(cleanPhone);
      const expiresIn = res?.data?.expires_in || 300;
      setCountdown(expiresIn);
      setOtpStep('verify');
      setInfoMessage(
        isRTL
          ? `تم إرسال رمز التحقق المكون من 6 أرقام إلى الرقم ${cleanPhone}`
          : `A 6-digit verification code has been sent to ${cleanPhone}`
      );
    } catch (err: any) {
      if (err?.status === 429) {
        setError(
          isRTL
            ? 'تم تجاوز حد إرسال الرموز. يرجى الانتظار دقيقة'
            : 'Rate limit reached. Please wait a minute.'
        );
      } else {
        setError(
          isRTL
            ? 'تعذر إرسال رمز التحقق. يرجى التأكد من صحة رقم الجوال المسجل'
            : 'Could not send verification code. Please ensure phone is registered.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Portal Verify Code (OTP Step 2)
  const handleVerifyOtp = async () => {
    const cleanPhone = phone.trim();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError(
        isRTL
          ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام'
          : 'Please enter the 6-digit verification code'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await portalVerifyCode(cleanPhone, cleanCode);
    } catch (err: any) {
      if (err?.status === 422 || err?.status === 401) {
        setError(isRTL ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired verification code.');
      } else if (err?.status === 429) {
        setError(isRTL ? 'تم تجاوز عدد المحاولات المسموحة' : 'Too many attempts.');
      } else {
        setError(isRTL ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during verification.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="login"
      onSelectTab={(tab) => {
        if (tab === 'signup') {
          navigation.navigate('SignupScreen');
        }
      }}
    >
      <View style={[styles.card, isDark && styles.darkCard]}>
        {/* Main Card Header */}
        <View style={styles.cardHeader}>
          <AppText variant="hero" weight="bold" color={isDark ? '#FFFFFF' : '#0B1938'} style={styles.title}>
            {isRTL ? 'تسجيل الدخول' : 'Sign In'}
          </AppText>
          <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#64748B'}>
            {isRTL ? 'أدخل بيانات حسابك للوصول إلى لوحتك في المنصة.' : 'Enter your credentials to access your portal.'}
          </AppText>
        </View>

        {/* Error Alert */}
        {error && (
          <View style={[styles.alertBox, styles.errorAlert, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon name="alertTriangle" size={18} color="#D92D20" />
            <AppText variant="captionBold" color="#D92D20" style={styles.alertText}>
              {error}
            </AppText>
          </View>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <View style={[styles.alertBox, styles.infoAlert, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon name="check" size={18} color="#027A48" />
            <AppText variant="captionBold" color="#027A48" style={styles.alertText}>
              {infoMessage}
            </AppText>
          </View>
        )}

        {/* STAFF & PASSWORD LOGIN FORM */}
        {authMethod === 'password' && (
          <View style={styles.formGroup}>
            {/* Email / Username Field */}
            <View style={styles.fieldBlock}>
              <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </AppText>
                <AppText variant="label" color="#D92D20">*</AppText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.darkInput,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
                placeholder={isRTL ? 'name@school.sa' : 'name@school.sa'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Field with Forgot Password Link */}
            <View style={styles.fieldBlock}>
              <View style={[styles.labelRowWithLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                    {isRTL ? 'كلمة المرور' : 'Password'}
                  </AppText>
                  <AppText variant="label" color="#D92D20">*</AppText>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen')}>
                  <AppText variant="captionBold" color={isDark ? '#6EC5FF' : colors.brandPrimary}>
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </AppText>
                </TouchableOpacity>
              </View>

              <View style={[styles.passwordInputContainer, isDark && styles.darkInput, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TextInput
                  style={[
                    styles.passwordInnerInput,
                    isDark && styles.darkInputText,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.showHideBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <AppText variant="captionBold" color={isDark ? '#94A3B8' : '#64748B'}>
                    {showPassword ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              style={[styles.primarySubmitBtn, loading && styles.btnDisabled]}
              onPress={handleCredentialLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText variant="button" color="#FFFFFF">
                  {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STUDENT / PARENT OTP FLOW */}
        {authMethod === 'otp' && (
          <View style={styles.formGroup}>
            {otpStep === 'request' ? (
              /* Phone Input Step */
              <View style={styles.fieldBlock}>
                <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                    {isRTL ? 'رقم الجوال المسجل' : 'Registered Phone Number'}
                  </AppText>
                  <AppText variant="label" color="#D92D20">*</AppText>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.darkInput,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                  placeholder="05xxxxxxxx"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <TouchableOpacity
                  style={[styles.primarySubmitBtn, loading && styles.btnDisabled]}
                  onPress={handleRequestOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <AppText variant="button" color="#FFFFFF">
                      {isRTL ? 'إرسال رمز التحقق' : 'Send Verification Code'}
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* OTP Verification Step */
              <View style={styles.fieldBlock}>
                <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <AppText variant="label" color={isDark ? '#E2E8F0' : '#344054'}>
                    {isRTL ? 'رمز التحقق (٦ أرقام)' : '6-Digit Verification Code'}
                  </AppText>
                  <AppText variant="label" color="#D92D20">*</AppText>
                </View>

                <TextInput
                  style={[styles.input, styles.otpInput, isDark && styles.darkInput]}
                  placeholder="••••••"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                {countdown > 0 ? (
                  <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} align="center">
                    {isRTL
                      ? `إعادة الإرسال متاحة خلال ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
                      : `Resend code in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
                  </AppText>
                ) : (
                  <TouchableOpacity onPress={handleRequestOtp} disabled={loading}>
                    <AppText variant="captionBold" color={colors.brandPrimary} align="center">
                      {isRTL ? 'إعادة إرسال رمز جديد' : 'Resend new code'}
                    </AppText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.primarySubmitBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <AppText variant="button" color="#FFFFFF">
                      {isRTL ? 'تأكيد ودخول البوابة' : 'Verify & Enter Portal'}
                    </AppText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.textActionBtn}
                  onPress={() => {
                    setOtpStep('request');
                    setOtpCode('');
                    setError(null);
                    setInfoMessage(null);
                  }}
                >
                  <AppText variant="captionBold" color={isDark ? '#94A3B8' : '#64748B'} align="center">
                    {isRTL ? '← تغيير رقم الجوال' : '← Change Phone Number'}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Secondary Family Login Option Card matching screenshot 1 */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, isDark && styles.darkDividerLine]} />
          <AppText variant="caption" color={isDark ? '#64748B' : '#94A3B8'} style={styles.dividerText}>
            {isRTL ? 'أو' : 'Or'}
          </AppText>
          <View style={[styles.dividerLine, isDark && styles.darkDividerLine]} />
        </View>

        <TouchableOpacity
          style={[styles.secondaryOptionCard, isDark && styles.darkSecondaryCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => {
            setError(null);
            setInfoMessage(null);
            setOtpStep('request');
            setOtpCode('');
            setAuthMethod(authMethod === 'otp' ? 'password' : 'otp');
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.secondaryBadgeIcon, isDark && styles.darkSecondaryBadgeIcon]}>
            {authMethod === 'password' ? (
              <AppText variant="h3" color={colors.brandPrimary}>
                أ
              </AppText>
            ) : (
              <Icon name="school" size={20} color={colors.brandPrimary} />
            )}
          </View>

          <View style={styles.secondaryCardTextContent}>
            <AppText variant="bodyBold" color={isDark ? '#FFFFFF' : '#0A1D3D'}>
              {authMethod === 'password'
                ? (isRTL ? 'دخول الأسرة' : 'Family Sign In')
                : (isRTL ? 'تسجيل الدخول بكلمة المرور' : 'Credential Sign In')}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'}>
              {authMethod === 'password'
                ? (isRTL ? 'للطالب وولي الأمر — برقم الجوال ورمز تحقق' : 'For student & parent — via mobile phone & OTP')
                : (isRTL ? 'تسجيل الدخول بالبريد الإلكتروني وكلمة المرور' : 'Sign in using email & password')}
            </AppText>
          </View>
        </TouchableOpacity>
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
    marginBottom: 24,
    gap: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  alertBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorAlert: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FEE4E2',
  },
  infoAlert: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  alertText: {
    flex: 1,
    fontSize: 12,
  },
  formGroup: {
    gap: 16,
  },
  fieldBlock: {
    gap: 6,
  },
  labelRow: {
    alignItems: 'center',
    gap: 4,
  },
  labelRowWithLink: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0A1D3D',
  },
  darkInput: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
    color: '#FFFFFF',
  },
  darkInputText: {
    color: '#FFFFFF',
  },
  passwordInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  passwordInnerInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0A1D3D',
  },
  showHideBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  primarySubmitBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  textActionBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  darkDividerLine: {
    backgroundColor: '#1E3A6E',
  },
  dividerText: {
    fontSize: 12,
  },
  secondaryOptionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 14,
  },
  darkSecondaryCard: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  secondaryBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkSecondaryBadgeIcon: {
    backgroundColor: '#1E3A6E',
  },
  secondaryCardTextContent: {
    flex: 1,
    gap: 2,
  },
});
