const STRONG_PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function validateStrongPassword(password: string): string | null {
  if (!STRONG_PASSWORD_RE.test(password)) {
    return "密码至少8位，且需包含大写、小写、数字和特殊字符";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "邮箱不能为空";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "邮箱格式不正确";
  return null;
}
