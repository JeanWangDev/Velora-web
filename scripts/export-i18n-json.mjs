/**
 * 导出 en / zh 字典为 JSON，供多语言生成脚本使用。
 * 运行: node scripts/export-i18n-json.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// 通过 tsx 注册 ts
const require = createRequire(import.meta.url);

async function main() {
  // 动态 import TS（需 tsx）
  const { register } = await import("tsx/esm/api");
  register();

  const dict = await import(path.join(root, "src/i18n/dictionaries.ts"));
  const exchange = await import(path.join(root, "src/i18n/exchange-dict.ts"));

  const outDir = path.join(root, "scripts/i18n-data");
  fs.mkdirSync(outDir, { recursive: true });

  const enFlat = { ...dict.en, exchange: exchange.exchangeEn };
  const zhFlat = { ...dict.zh, exchange: exchange.exchangeZh };

  fs.writeFileSync(path.join(outDir, "en.json"), JSON.stringify(enFlat, null, 2));
  fs.writeFileSync(path.join(outDir, "zh-CN.json"), JSON.stringify(zhFlat, null, 2));
  console.log("Exported en.json and zh-CN.json to scripts/i18n-data/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
