#!/usr/bin/env node
/**
 * 将 exchange 组件中 isChineseLocale 中英硬编码替换为 useExchangeT / useTranslation 字典键
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const files = [
  "components/exchange/terminal/instrument-bar.tsx",
  "components/exchange/okx/symbol-picker-dropdown.tsx",
  "components/exchange/okx/okx-order-book-panel.tsx",
  "components/exchange/terminal/market-side-panel.tsx",
  "components/exchange/terminal/depth-book.tsx",
  "components/exchange/terminal/bottom-desk.tsx",
  "components/exchange/okx/okx-spot-order-form.tsx",
  "components/exchange/okx/chart-stage.tsx",
  "components/exchange/okx/news-modal.tsx",
];

const replacements = [
  [/isChineseLocale\(locale\) \? `\$\{meta\?\.base \?\? ""\} 价格` : `\$\{meta\?\.base \?\? ""\} Price`/g,
   '`${meta?.base ?? ""} ${t("trade.price")}`'],
  [/isChineseLocale\(locale\) \? "24h 额" : "24h Turnover"/g,
   'tt("trade.ticker.quoteVol24h")'],
  [/isChineseLocale\(locale\) \? "平台币" : "Platform"/g,
   't("trade.categories.platform")'],
  [/isChineseLocale\(locale\) \? "选择交易对" : "Select pair"/g,
   't("markets.search")'],
  [/isChineseLocale\(locale\)\s*\?\s*"输入币种或合约地址"\s*:\s*"Search coin or address"/g,
   't("trade.commandHint")'],
  [/isChineseLocale\(locale\) \? "合约" : "Perp"/g, 't("trade.futures")'],
  [/isChineseLocale\(locale\) \? "现货" : "Spot"/g, 't("trade.spot")'],
  [/isChineseLocale\(locale\) \? "最新价" : "Last"/g, 't("markets.price")'],
  [/isChineseLocale\(locale\) \? "24H涨跌幅" : "24H %"/g, 't("markets.change")'],
  [/isChineseLocale\(locale\) \? "成交额" : "Turnover"/g, 't("markets.volume")'],
  [/isChineseLocale\(locale\) \? "价格" : "Price"/g, 't("trade.price")'],
  [/isChineseLocale\(locale\) \? "数量" : "Amount"/g, 't("trade.amount")'],
  [/isChineseLocale\(locale\) \? "合计" : "Total"/g, 't("trade.total")'],
  [/isChineseLocale\(locale\) \? "均价" : "Avg"/g, 't("trade.bestPrice")'],
  [/isChineseLocale\(locale\) \? "名称" : "Name"/g, 't("markets.pair")'],
  [/isChineseLocale\(locale\) \? "布局设置" : "Layout settings"/g, 't("trade.settings")'],
  [/isChineseLocale\(locale\) \? "标签切换" : "Tabs"/g, 't("trade.tradeTab")'],
  [/isChineseLocale\(locale\) \? "上下布局" : "Stack"/g, 't("trade.toolsTab")'],
  [/isChineseLocale\(locale\) \? "显示买卖对比" : "Show buy\/sell ratio"/g, 't("trade.maxBuy")'],
  [/mode === "futures"\s*\?\s*isChineseLocale\(locale\) \? "合约" : "Perp"\s*:\s*isChineseLocale\(locale\) \? "现货" : "Spot"/g,
   'mode === "futures" ? t("trade.futures") : t("trade.spot")'],
];

for (const rel of files) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) continue;
  let src = fs.readFileSync(fp, "utf8");
  let changed = false;
  for (const [re, rep] of replacements) {
    if (re.test(src)) {
      src = src.replace(re, rep);
      changed = true;
    }
  }
  if (!changed) continue;

  if (src.includes('tt("trade.ticker') && !src.includes("useTranslation")) {
    src = src.replace(
      /import \{ useLocale \} from "@\/i18n\/use-translation";/,
      'import { useLocale, useTranslation } from "@/i18n/use-translation";',
    );
    if (!src.includes("const tt = useTranslation")) {
      src = src.replace(
        /(const locale = useLocale\(\);)/,
        "$1\n  const tt = useTranslation();",
      );
    }
  }

  if (src.includes('isChineseLocale') && !src.match(/isChineseLocale\(/)) {
    src = src.replace(/import \{ isChineseLocale \} from "@\/i18n\/locale-helpers";\n/, "");
  }

  fs.writeFileSync(fp, src);
  console.log("patched", rel);
}

console.log("done");
