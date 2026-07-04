/** 手机区号 / 居住国家（注册与登录共用） */
export interface PhoneCountry {
  iso: string;
  dial: string;
  flag: string;
  nameZh: string;
  nameEn: string;
  /** 不含区号的手机号位数 */
  phoneLength: number;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "CN", dial: "86", flag: "🇨🇳", nameZh: "中国", nameEn: "China", phoneLength: 11 },
  { iso: "TW", dial: "886", flag: "🇹🇼", nameZh: "中国台湾", nameEn: "Taiwan", phoneLength: 9 },
  { iso: "HK", dial: "852", flag: "🇭🇰", nameZh: "中国香港", nameEn: "Hong Kong", phoneLength: 8 },
  { iso: "MO", dial: "853", flag: "🇲🇴", nameZh: "中国澳门", nameEn: "Macao", phoneLength: 8 },
  { iso: "US", dial: "1", flag: "🇺🇸", nameZh: "美国", nameEn: "United States", phoneLength: 10 },
  { iso: "CA", dial: "1", flag: "🇨🇦", nameZh: "加拿大", nameEn: "Canada", phoneLength: 10 },
  { iso: "GB", dial: "44", flag: "🇬🇧", nameZh: "英国", nameEn: "United Kingdom", phoneLength: 10 },
  { iso: "IE", dial: "353", flag: "🇮🇪", nameZh: "爱尔兰", nameEn: "Ireland", phoneLength: 9 },
  { iso: "JP", dial: "81", flag: "🇯🇵", nameZh: "日本", nameEn: "Japan", phoneLength: 10 },
  { iso: "KR", dial: "82", flag: "🇰🇷", nameZh: "韩国", nameEn: "South Korea", phoneLength: 10 },
  { iso: "SG", dial: "65", flag: "🇸🇬", nameZh: "新加坡", nameEn: "Singapore", phoneLength: 8 },
  { iso: "MY", dial: "60", flag: "🇲🇾", nameZh: "马来西亚", nameEn: "Malaysia", phoneLength: 9 },
  { iso: "TH", dial: "66", flag: "🇹🇭", nameZh: "泰国", nameEn: "Thailand", phoneLength: 9 },
  { iso: "VN", dial: "84", flag: "🇻🇳", nameZh: "越南", nameEn: "Vietnam", phoneLength: 9 },
  { iso: "PH", dial: "63", flag: "🇵🇭", nameZh: "菲律宾", nameEn: "Philippines", phoneLength: 10 },
  { iso: "ID", dial: "62", flag: "🇮🇩", nameZh: "印度尼西亚", nameEn: "Indonesia", phoneLength: 10 },
  { iso: "IN", dial: "91", flag: "🇮🇳", nameZh: "印度", nameEn: "India", phoneLength: 10 },
  { iso: "PK", dial: "92", flag: "🇵🇰", nameZh: "巴基斯坦", nameEn: "Pakistan", phoneLength: 10 },
  { iso: "BD", dial: "880", flag: "🇧🇩", nameZh: "孟加拉", nameEn: "Bangladesh", phoneLength: 10 },
  { iso: "AU", dial: "61", flag: "🇦🇺", nameZh: "澳大利亚", nameEn: "Australia", phoneLength: 9 },
  { iso: "NZ", dial: "64", flag: "🇳🇿", nameZh: "新西兰", nameEn: "New Zealand", phoneLength: 9 },
  { iso: "RU", dial: "7", flag: "🇷🇺", nameZh: "俄罗斯", nameEn: "Russia", phoneLength: 10 },
  { iso: "UA", dial: "380", flag: "🇺🇦", nameZh: "乌克兰", nameEn: "Ukraine", phoneLength: 9 },
  { iso: "KZ", dial: "7", flag: "🇰🇿", nameZh: "哈萨克斯坦", nameEn: "Kazakhstan", phoneLength: 10 },
  { iso: "TR", dial: "90", flag: "🇹🇷", nameZh: "土耳其", nameEn: "Turkey", phoneLength: 10 },
  { iso: "SA", dial: "966", flag: "🇸🇦", nameZh: "沙特阿拉伯", nameEn: "Saudi Arabia", phoneLength: 9 },
  { iso: "AE", dial: "971", flag: "🇦🇪", nameZh: "阿联酋", nameEn: "UAE", phoneLength: 9 },
  { iso: "IL", dial: "972", flag: "🇮🇱", nameZh: "以色列", nameEn: "Israel", phoneLength: 9 },
  { iso: "EG", dial: "20", flag: "🇪🇬", nameZh: "埃及", nameEn: "Egypt", phoneLength: 10 },
  { iso: "ZA", dial: "27", flag: "🇿🇦", nameZh: "南非", nameEn: "South Africa", phoneLength: 9 },
  { iso: "NG", dial: "234", flag: "🇳🇬", nameZh: "尼日利亚", nameEn: "Nigeria", phoneLength: 10 },
  { iso: "FR", dial: "33", flag: "🇫🇷", nameZh: "法国", nameEn: "France", phoneLength: 9 },
  { iso: "DE", dial: "49", flag: "🇩🇪", nameZh: "德国", nameEn: "Germany", phoneLength: 10 },
  { iso: "IT", dial: "39", flag: "🇮🇹", nameZh: "意大利", nameEn: "Italy", phoneLength: 10 },
  { iso: "ES", dial: "34", flag: "🇪🇸", nameZh: "西班牙", nameEn: "Spain", phoneLength: 9 },
  { iso: "PT", dial: "351", flag: "🇵🇹", nameZh: "葡萄牙", nameEn: "Portugal", phoneLength: 9 },
  { iso: "NL", dial: "31", flag: "🇳🇱", nameZh: "荷兰", nameEn: "Netherlands", phoneLength: 9 },
  { iso: "BE", dial: "32", flag: "🇧🇪", nameZh: "比利时", nameEn: "Belgium", phoneLength: 9 },
  { iso: "CH", dial: "41", flag: "🇨🇭", nameZh: "瑞士", nameEn: "Switzerland", phoneLength: 9 },
  { iso: "AT", dial: "43", flag: "🇦🇹", nameZh: "奥地利", nameEn: "Austria", phoneLength: 10 },
  { iso: "SE", dial: "46", flag: "🇸🇪", nameZh: "瑞典", nameEn: "Sweden", phoneLength: 9 },
  { iso: "NO", dial: "47", flag: "🇳🇴", nameZh: "挪威", nameEn: "Norway", phoneLength: 8 },
  { iso: "DK", dial: "45", flag: "🇩🇰", nameZh: "丹麦", nameEn: "Denmark", phoneLength: 8 },
  { iso: "FI", dial: "358", flag: "🇫🇮", nameZh: "芬兰", nameEn: "Finland", phoneLength: 9 },
  { iso: "PL", dial: "48", flag: "🇵🇱", nameZh: "波兰", nameEn: "Poland", phoneLength: 9 },
  { iso: "CZ", dial: "420", flag: "🇨🇿", nameZh: "捷克", nameEn: "Czechia", phoneLength: 9 },
  { iso: "RO", dial: "40", flag: "🇷🇴", nameZh: "罗马尼亚", nameEn: "Romania", phoneLength: 10 },
  { iso: "GR", dial: "30", flag: "🇬🇷", nameZh: "希腊", nameEn: "Greece", phoneLength: 10 },
  { iso: "HU", dial: "36", flag: "🇭🇺", nameZh: "匈牙利", nameEn: "Hungary", phoneLength: 9 },
  { iso: "BR", dial: "55", flag: "🇧🇷", nameZh: "巴西", nameEn: "Brazil", phoneLength: 11 },
  { iso: "AR", dial: "54", flag: "🇦🇷", nameZh: "阿根廷", nameEn: "Argentina", phoneLength: 10 },
  { iso: "CL", dial: "56", flag: "🇨🇱", nameZh: "智利", nameEn: "Chile", phoneLength: 9 },
  { iso: "CO", dial: "57", flag: "🇨🇴", nameZh: "哥伦比亚", nameEn: "Colombia", phoneLength: 10 },
  { iso: "MX", dial: "52", flag: "🇲🇽", nameZh: "墨西哥", nameEn: "Mexico", phoneLength: 10 },
  { iso: "PE", dial: "51", flag: "🇵🇪", nameZh: "秘鲁", nameEn: "Peru", phoneLength: 9 },
];

export function getPhoneCountry(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0];
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(digits: string, country: PhoneCountry): boolean {
  return digits.length === country.phoneLength;
}
