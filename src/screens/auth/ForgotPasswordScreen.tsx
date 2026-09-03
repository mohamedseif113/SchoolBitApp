import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import { forgotPassword, resetPassword } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { isRTL } = useAppDirection();

  const handleSendCode = async () => {
    try {
      setError('');
      const res = await forgotPassword(email);
      setPhone(res.phone || '***');
      setStep(2);
    } catch (err) {
      setError(t('auth.error_sending_code'));
    }
  };

  const handleReset = async () => {
    if (newPassword.length < 8) return setError(t('auth.password_too_short'));
    if (newPassword !== confirmPassword) return setError(t('auth.passwords_mismatch'));
    
    try {
      setError('');
      await resetPassword(email, code, newPassword);
      navigation.navigate('LoginScreen');
    } catch (err) {
      setError(t('auth.error_resetting'));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t('auth.forgot_password')}</Text>
          
          {error ? <View style={styles.alert}><Text style={styles.alertText}>{error}</Text></View> : null}

          {step === 1 ? (
            <>
              <Text style={[styles.info, isRTL && styles.rtlText]}>{t('auth.forgot_password_info', 'The code goes to the mobile registered on the account — not to the email.')}</Text>
              
              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('auth.email')}</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode}>
                <Text style={styles.primaryButtonText}>{t('auth.send_reset_code')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.phoneBox}>
                <Text style={styles.phoneBoxText}>{t('auth.code_sent_to', { phone })}</Text>
              </View>

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('auth.verification_code')}</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={code} onChangeText={setCode} keyboardType="number-pad" />

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('auth.new_password')}</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('auth.confirm_password')}</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

              <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
                <Text style={styles.primaryButtonText}>{t('auth.set_password')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryButtonText}>{t('auth.change_email')}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.backButtonText}>{t('auth.back_to_login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7' },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#101828', marginBottom: 16 },
  info: { fontSize: 14, color: '#475467', marginBottom: 24, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  phoneBox: { backgroundColor: '#EFF4FF', padding: 12, borderRadius: 8, marginBottom: 24 },
  phoneBoxText: { color: '#175CD3', fontSize: 14, textAlign: 'center' },
  label: { fontSize: 14, color: '#344054', marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  primaryButton: { backgroundColor: '#1246B7', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#1246B7', fontWeight: '600' },
  backButton: { padding: 16, alignItems: 'center', marginTop: 16 },
  backButtonText: { color: '#475467', fontWeight: '500' },
  alert: { backgroundColor: '#FEE4E2', padding: 12, borderRadius: 8, marginBottom: 16 },
  alertText: { color: '#D92D20' },
  rtlText: { textAlign: 'right' }
});
