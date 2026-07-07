/** 主流币种图标 CDN（spothq/cryptocurrency-icons） */
export function getCoinIconUrl(base: string): string {
  const symbol = base.trim().toLowerCase();
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${symbol}.png`;
}
