import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import TwoFaScreen from '../screens/auth/TwoFaScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import SignupScreen from '../screens/auth/SignupScreen';

export type AuthStackParamList = {
  LoginScreen: undefined;
  TwoFaScreen: { phone: string };
  ForgotPasswordScreen: undefined;
  SignupScreen: undefined;
  RegistrationStatusScreen: { registration: any };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="TwoFaScreen" component={TwoFaScreen} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
    </Stack.Navigator>
  );
}
