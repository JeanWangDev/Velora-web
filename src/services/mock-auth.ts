import type { AuthSession, AuthUser } from "@/types/auth";
import { ApiClientError } from "@/services/api-client-error";

const ACCOUNTS_KEY = "velora-mock-auth-accounts";
const DRAFT_KEY = "velora-register-draft";

export interface MockAuthAccount {
  email: string;
  password: string;
  nickname: string;
  phone?: string;
  phoneIso?: string;
  country?: string;
}

export interface RegisterDraft {
  step: string;
  country: string;
  email: string;
  inviteCode: string;
  phone: string;
  phoneIso: string;
  code: string;
  phoneCode: string;
  savedAt: number;
}

function readAccounts(): MockAuthAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockAuthAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: MockAuthAccount[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/** 后端不可用（无数据库 / 网络错误等）时走本地 mock */
export function isMockAuthFallbackError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    if (error.status >= 500) return true;
    if (error.message.includes("数据库未启用")) return true;
    if (error.message.includes("数据库未连接")) return true;
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("fetch") || msg.includes("Network") || msg.includes("Failed")) {
      return true;
    }
    if (msg.includes("数据库未启用") || msg.includes("数据库未连接")) {
      return true;
    }
  }
  return false;
}

export function saveMockAccount(input: {
  email: string;
  password: string;
  phone?: string;
  phoneIso?: string;
  country?: string;
}): MockAuthAccount {
  const email = input.email.trim().toLowerCase();
  const nickname = email.split("@")[0] || "user";
  const account: MockAuthAccount = {
    email,
    password: input.password,
    nickname,
    phone: input.phone,
    phoneIso: input.phoneIso,
    country: input.country,
  };
  const accounts = readAccounts().filter((a) => a.email !== email);
  accounts.push(account);
  writeAccounts(accounts);
  return account;
}

export function mockLogin(input: {
  email: string;
  password: string;
}): AuthSession | null {
  const email = input.email.trim().toLowerCase();
  const account = readAccounts().find((a) => a.email === email);
  if (!account || account.password !== input.password) return null;

  const user: AuthUser = {
    id: `mock-${email}`,
    email: account.email,
    nickname: account.nickname,
    roleKey: "normal_user",
    roleName: "普通用户",
    roleLevel: 1,
  };

  return {
    accessToken: `mock-token-${Date.now()}`,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    user,
  };
}

export function mockRegister(input: {
  email: string;
  password: string;
  phone?: string;
  phoneIso?: string;
  country?: string;
}): AuthSession {
  const account = saveMockAccount(input);
  const session = mockLogin({
    email: account.email,
    password: input.password,
  });
  if (!session) {
    throw new Error("mock register failed");
  }
  return session;
}

export function saveRegisterDraft(draft: Omit<RegisterDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: RegisterDraft = { ...draft, savedAt: Date.now() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function loadRegisterDraft(): RegisterDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegisterDraft;
  } catch {
    return null;
  }
}

export function clearRegisterDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
