/** 邮箱脱敏：jea***@outlook.com */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  if (local.length <= 3) return `${local[0] ?? ""}***${domain}`;
  return `${local.slice(0, 3)}***${domain}`;
}
