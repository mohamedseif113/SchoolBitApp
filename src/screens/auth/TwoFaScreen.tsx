import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { resendOtp } from '../../api/auth';

export default function TwoFaScreen() {
  const { t, i18n } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sessionId, maskedPhone } = route.params || {};

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const verifyOtpStoreAction = useAuthStore((s) => s.verifyOtp);

  const { isRTL } = useAppDirection();

  useEffect(() => {
    // Auto-focus first digit
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length !== 6) {
      setErrorMsg(i18n.language === 'ar' ? 'يرجى إدخال 6 أرقام' : 'Please enter 6 digits');
      shake();
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await verifyOtpStoreAction({ session_id: sessionId, code: otp });
    } catch (err: any) {
      shake();
      setErrorMsg(
        err?.message ||
          (i18n.language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code')
      );
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    setErrorMsg(null);
    if (text.length > 1) {
      const chars = text.slice(0, 6).split('');
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      inputs.current[Math.min(5, index + chars.length)]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      setErrorMsg(null);
      await resendOtp(sessionId);
      setCountdown(30);
    } catch (err: any) {
      setErrorMsg(err?.message || (i18n.language === 'ar' ? 'فشل إعادة إرسال الرمز' : 'Failed to resend code'));
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t('auth.twoFaTitle')}</Text>
      <Text style={[styles.desc, isRTL && styles.rtlText]}>
        {t('auth.twoFaSentTo')} {maskedPhone || t('auth.twoFaYourMobile')}
      </Text>

      {errorMsg ? (
        <View style={styles.alert}>
          <Text style={styles.alertText}>{errorMsg}</Text>
        </View>
      ) : null}

      <Animated.View style={[styles.otpContainer, { transform: [{ translateX: shakeAnimation }] }]}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={styles.otpInput}
            value={digit}
            onChangeText={(t) => handleChange(t, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
          />
        ))}
      </Animated.View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('auth.verify')}</Text>}
      </TouchableOpacity>

      <View style={[styles.resendContainer]}>
        <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending}>
          <Text style={[styles.resendText, (countdown > 0 || resending) && styles.disabledText]}>
            {resending ? (i18n.language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...') : t('auth.resend_code')}
          </Text>
        </TouchableOpacity>
        {countdown > 0 && <Text style={styles.timer}> ({countdown}s)</Text>}
      </View>

      <TouchableOpacity style={styles.ghostButton} onPress={() => navigation.goBack()}>
        <Text style={styles.ghostText}>{t('auth.back_to_login')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#101828', marginBottom: 8 },
  desc: { fontSize: 16, color: '#475467', marginBottom: 24 },
  alert: { backgroundColor: '#FEE4E2', padding: 12, borderRadius: 8, marginBottom: 24 },
  alertText: { color: '#D92D20', textAlign: 'center' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, direction: 'ltr' },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, backgroundColor: '#fff', fontSize: 24, textAlign: 'center', color: '#101828' },
  primaryButton: { backgroundColor: '#1246B7', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  resendText: { color: '#1246B7', fontWeight: '500' },
  disabledText: { color: '#98A2B3' },
  timer: { color: '#98A2B3' },
  ghostButton: { padding: 16, alignItems: 'center' },
  ghostText: { color: '#475467', fontWeight: '500' },
  rtlText: { textAlign: 'right' },
});
