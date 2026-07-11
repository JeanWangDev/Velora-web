/**
 * 从 scripts/i18n-data/*.json 生成 src/i18n/messages/*.ts
 * 运行: node scripts/generate-locale-files.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(__dirname, "i18n-data");
const outDir = path.join(root, "src/i18n/messages");

/** fileName → export const name */
const LOCALES = {
  "zh-TW": "zhTW",
  vi: "vi",
  ru: "ru",
  es: "es",
  id: "id",
  fr: "fr",
  ko: "ko",
  ja: "ja",
  pt: "pt",
  de: "de",
  it: "it",
  tr: "tr",
  uk: "uk",
  ar: "ar",
  th: "th",
  pl: "pl",
};

function writeLocale(file, constName, data) {
  const json = JSON.stringify(data, null, 2);
  const content = `import type { en } from "./en";

/** Auto-generated — ${file} */
export const ${constName} = ${json} satisfies typeof en;
`;
  fs.writeFileSync(path.join(outDir, `${file}.ts`), content);
  console.log(`Wrote ${file}.ts (${constName})`);
}

function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const entries = Object.entries(LOCALES).filter(
    ([file]) => only.length === 0 || only.includes(file),
  );
  for (const [file, constName] of entries) {
    const jsonPath = path.join(dataDir, `${file}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.warn(`SKIP missing ${jsonPath}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    writeLocale(file, constName, data);
  }
  console.log("Done.");
}

main();
