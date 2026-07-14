import { apiClient } from "./api-client";

const BASE = "/api/v1/auth";

export class SecurityService {
  static status2fa() {
    return apiClient.sendRequest<{ enabled: boolean }>({
      url: `${BASE}/2fa/status`,
      method: "GET",
    });
  }

  static setup2fa() {
    return apiClient.sendRequest<{ secret: string; otpauthUrl: string }>({
      url: `${BASE}/2fa/setup`,
      method: "POST",
    });
  }

  static verify2fa(code: string) {
    return apiClient.sendRequest<{ enabled: boolean }>({
      url: `${BASE}/2fa/verify`,
      method: "POST",
      data: { code },
    });
  }

  static disable2fa(code: string) {
    return apiClient.sendRequest<{ enabled: boolean }>({
      url: `${BASE}/2fa/disable`,
      method: "POST",
      data: { code },
    });
  }

  static changePassword(currentPassword: string, newPassword: string) {
    return apiClient.sendRequest<{ ok: boolean }>({
      url: `${BASE}/change-password`,
      method: "POST",
      data: { currentPassword, newPassword },
    });
  }

  static loginHistory() {
    return apiClient.sendRequest<{
      rows: { ip: string; device: string; ts: number; success: boolean }[];
    }>({
      url: `${BASE}/login-history`,
      method: "GET",
    });
  }

  static listSessions() {
    return apiClient.sendRequest<{
      rows: { id: number; ip: string; device: string; ts: number }[];
    }>({
      url: `${BASE}/sessions`,
      method: "GET",
    });
  }

  static revokeSession(id: number) {
    return apiClient.sendRequest<{ ok: boolean }>({
      url: `${BASE}/sessions/revoke`,
      method: "POST",
      data: { id },
    });
  }

  static revokeAllSessions() {
    return apiClient.sendRequest<{ ok: boolean }>({
      url: `${BASE}/sessions/revoke-all`,
      method: "POST",
    });
  }

  static loginTotp(totpToken: string, code: string) {
    return apiClient.sendRequest<{
      accessToken: string;
      expiresAt: number;
      user: unknown;
    }>({
      url: `${BASE}/login/totp`,
      method: "POST",
      data: { totpToken, code },
      skipAuth: true,
    });
  }
}
