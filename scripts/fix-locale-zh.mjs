#!/usr/bin/env node
/**
 * 批量将 locale === "zh" 替换为 isChineseLocale(locale)
 * 运行: node scripts/fix-locale-zh.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const IMPORT = 'import { isChineseLocale } from "@/i18n/locale-helpers";';

const files = [
  "app/announcements/page.tsx",
  "app/announcements/[id]/page.tsx",
  "app/assets/page.tsx",
  "app/legal/risk/page.tsx",
  "app/legal/terms/page.tsx",
  "app/login/page.tsx",
  "app/user/page.tsx",
  "app/user/kyc/page.tsx",
  "app/user/security/page.tsx",
  "app/user/preferences/page.tsx",
  "app/trade/_components/tv-chart/tv-chart.tsx",
  "components/auth/auth-shell.tsx",
  "components/auth/register-kyc-modal.tsx",
  "components/user/kyc/kyc-wizard.tsx",
  "components/user/kyc/kyc-didit-flow.tsx",
  "components/exchange/terminal/notifications-dropdown.tsx",
  "components/exchange/terminal/bottom-desk.tsx",
  "components/exchange/terminal/depth-book.tsx",
  "components/exchange/terminal/market-side-panel.tsx",
  "components/exchange/terminal/instrument-bar.tsx",
  "components/exchange/okx/symbol-picker-dropdown.tsx",
  "components/exchange/okx/okx-order-book-panel.tsx",
  "components/exchange/okx/chart-stage.tsx",
  "components/exchange/okx/okx-spot-order-form.tsx",
  "components/exchange/okx/chart-indicator-bar.tsx",
  "components/exchange/okx/indicator-settings-modal.tsx",
  "components/exchange/okx/news-modal.tsx",
  "app/news/_utils/event-display.ts",
];

const replacements = [
  [/const isZh = locale === "zh"/g, "const isZh = isChineseLocale(locale)"],
  [/locale === "zh"/g, "isChineseLocale(locale)"],
];

for (const rel of files) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) continue;
  let src = fs.readFileSync(fp, "utf8");
  if (!src.includes('locale === "zh"') && !src.includes("locale === 'zh'")) continue;
  let changed = false;
  for (const [re, rep] of replacements) {
    if (re.test(src)) {
      src = src.replace(re, rep);
      changed = true;
    }
  }
  if (!changed) continue;
  if (!src.includes("isChineseLocale")) {
    const lines = src.split("\n");
    let insertAt = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ")) insertAt = i + 1;
      else if (insertAt > 0 && !lines[i].startsWith("import ")) break;
    }
    lines.splice(insertAt, 0, IMPORT);
    src = lines.join("\n");
  }
  fs.writeFileSync(fp, src);
  console.log("fixed", rel);
}

console.log("done");
