export type AuthFieldErrors = Partial<
  Record<
    | "email"
    | "password"
    | "confirmPassword"
    | "verificationCode"
    | "nickname"
    | "_form",
    string
  >
>;

const STRONG_PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validateEmailField(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "邮箱不能为空";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "邮箱格式不正确";
  return undefined;
}

function validatePasswordField(password: string): string | undefined {
  if (!password) return "密码不能为空";
  if (!STRONG_PASSWORD_RE.test(password)) {
    return "密码至少8位，且需包含大写、小写、数字和特殊字符";
  }
  return undefined;
}

export function validateLoginForm(input: {
  email: string;
  password: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const emailErr = validateEmailField(input.email);
  if (emailErr) errors.email = emailErr;
  if (!input.password.trim()) errors.password = "密码不能为空";
  return errors;
}

function validateVerificationCodeField(code: string): string | undefined {
  const value = code.trim();
  if (!value) return "请输入邮箱验证码";
  if (!/^\d{6}$/.test(value)) return "验证码为 6 位数字";
  return undefined;
}

export function validateRegisterForm(input: {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const emailErr = validateEmailField(input.email);
  if (emailErr) errors.email = emailErr;

  const codeErr = validateVerificationCodeField(input.code);
  if (codeErr) errors.verificationCode = codeErr;

  const pwdErr = validatePasswordField(input.password);
  if (pwdErr) errors.password = pwdErr;

  if (!input.confirmPassword.trim()) {
    errors.confirmPassword = "请再次输入密码";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "两次输入的密码不一致";
  }

  return errors;
}

export function validateForgotForm(input: { email: string }): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const emailErr = validateEmailField(input.email);
  if (emailErr) errors.email = emailErr;
  return errors;
}

export function validateResetForm(input: {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const emailErr = validateEmailField(input.email);
  if (emailErr) errors.email = emailErr;

  const codeErr = validateVerificationCodeField(input.code);
  if (codeErr) errors.verificationCode = codeErr;

  const pwdErr = validatePasswordField(input.password);
  if (pwdErr) errors.password = pwdErr;

  if (!input.confirmPassword.trim()) {
    errors.confirmPassword = "请再次输入密码";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "两次输入的密码不一致";
  }

  return errors;
}

export function validateProfileForm(input: {
  nickname: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const value = input.nickname.trim();

  if (!value) {
    errors.nickname = "昵称不能为空";
  } else if (value.length > 64) {
    errors.nickname = "昵称最多64个字符";
  }

  return errors;
}

export function hasFieldErrors(errors: AuthFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Map backend `details` array to field errors when present. */
export function mapApiValidationDetails(
  details: unknown,
): AuthFieldErrors {
  if (!Array.isArray(details)) return {};

  const errors: AuthFieldErrors = {};
  for (const item of details) {
    if (
      item &&
      typeof item === "object" &&
      "field" in item &&
      "message" in item &&
      typeof (item as { field: string }).field === "string" &&
      typeof (item as { message: string }).message === "string"
    ) {
      const { field, message } = item as { field: string; message: string };
      errors[field as keyof AuthFieldErrors] = message;
    }
  }
  return errors;
}
