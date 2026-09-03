import { authApi, login as apiLogin, verifyOtp as apiVerifyOtp, resendOtp as apiResendOtp, signup as apiSignup } from '../api/auth';
import { LoginResponse, OtpResponse, ResendOtpResponse, ForgotPasswordResponse, ResetPasswordRequest } from '../types/auth';

export type { LoginResponse, OtpResponse as TwoFactorResponse, ForgotPasswordResponse };

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiLogin({ email, password });
}

export async function verifyTwoFactor(sessionId: string, code: string): Promise<OtpResponse> {
  return apiVerifyOtp({ session_id: sessionId, code });
}

export async function resendTwoFactor(sessionId: string): Promise<ResendOtpResponse> {
  return apiResendOtp(sessionId);
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return authApi.forgotPassword(email);
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
  passwordConfirmation?: string
): Promise<{ success: boolean; message?: string }> {
  return authApi.resetPassword({
    email,
    code,
    password,
    password_confirmation: passwordConfirmation || password,
  });
}

export async function signup(data: any): Promise<any> {
  return apiSignup(data);
}

export async function logout(): Promise<void> {
  return authApi.logout();
}

export async function getMe(): Promise<any> {
  return authApi.getMe();
}

export async function getAccessMe(): Promise<any> {
  return authApi.getAccessMe();
}

export { authApi };
export default authApi;
