import { apiClient } from "@/services/api-client";
import type { AuthSession, AuthUser } from "@/types/auth";

const BASE = "/api/v1/auth";

export class AuthService {
  static sendCode(input: { email: string; purpose: "register" | "reset_password" }) {
    return apiClient.sendRequest<{ message: string; devCode?: string }>({
      url: `${BASE}/send-code`,
      method: "POST",
      data: input,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  /** 只校验验证码是否正确（不消费），用于多步表单在输入验证码时就给出真实反馈 */
  static verifyCode(input: {
    email: string;
    purpose: "register" | "reset_password";
    code: string;
  }) {
    return apiClient.sendRequest<{ valid: boolean }>({
      url: `${BASE}/verify-code`,
      method: "POST",
      data: input,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static register(input: {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiClient.sendRequest<AuthSession>({
      url: `${BASE}/register`,
      method: "POST",
      data: input,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static login(input: { email: string; password: string }) {
    return apiClient.sendRequest<AuthSession>({
      url: `${BASE}/login`,
      method: "POST",
      data: input,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static forgotPassword(input: { email: string }) {
    return apiClient.sendRequest<{ message: string; devCode?: string }>({
      url: `${BASE}/forgot-password`,
      method: "POST",
      data: input,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static resetPassword(input: {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiClient.sendRequest<AuthSession>({
      url: `${BASE}/reset-password`,
      method: "POST",
      data: input,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static me() {
    return apiClient.sendRequest<{ user: AuthUser }>({
      url: `${BASE}/me`,
      method: "GET",
      showErrorToast: false,
    });
  }

  static updateProfile(input: { nickname: string }) {
    return apiClient.sendRequest<{ user: AuthUser }>({
      url: `${BASE}/update-profile`,
      method: "POST",
      data: input,
    });
  }
}
