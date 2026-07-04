import { apiClient } from "./api-client";
import type { RoleOption } from "@/types/auth";
import type { AdminUser } from "@/types/admin-user";
import type { RoleKey } from "@/types/auth";

const BASE = "/api/v1/admin";

export class AdminUsersService {
  static listRoles() {
    return apiClient.sendRequest<{ data: RoleOption[] }>({
      url: `${BASE}/roles`,
      method: "GET",
    });
  }

  static list(params?: { page?: number; pageSize?: number; query?: string }) {
    return apiClient.sendRequest<{
      data: AdminUser[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${BASE}/users`,
      method: "GET",
      params,
    });
  }

  static updateRole(id: number, roleKey: RoleKey) {
    return apiClient.sendRequest<AdminUser>({
      url: `${BASE}/users/update-role`,
      method: "POST",
      data: { id, roleKey },
    });
  }

  static updateStatus(id: number, status: 0 | 1) {
    return apiClient.sendRequest<AdminUser>({
      url: `${BASE}/users/update-status`,
      method: "POST",
      data: { id, status },
    });
  }

  static create(body: {
    email: string;
    password: string;
    nickname?: string;
    roleKey: RoleKey;
  }) {
    return apiClient.sendRequest<AdminUser>({
      url: `${BASE}/users`,
      method: "POST",
      data: body,
    });
  }
}
