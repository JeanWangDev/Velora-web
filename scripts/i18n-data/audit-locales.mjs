#!/usr/bin/env node
/**
 * 审计全部 17 种语言包：结构、污染、TS/JSON 同步。
 * 运行: node scripts/i18n-data/audit-locales.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dataDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dataDir, "..", "..");
const msgDir = path.join(root, "src/i18n/messages");

const URL_LOCALES = [
  "zh-CN", "zh-TW", "en", "vi", "ru", "es", "id", "fr", "ko", "ja",
  "pt", "de", "it", "tr", "uk", "ar", "th", "pl",
];
const GENERATED_JSON = URL_LOCALES.filter((l) => !["zh-CN", "en"].includes(l));

const INVALID_RE = /INVALID LANGUAGE|MYMEMORY WARNING|__\s*TOK\d+\s*__/i;
const CJK_RE = /[\u4e00-\u9fff]/;

function flatten(obj, prefix = "") {
  if (typeof obj === "string") return { [prefix]: obj };
  if (Array.isArray(obj)) {
    const out = {};
    obj.forEach((v, i) => Object.assign(out, flatten(v, `${prefix}[${i}]`)));
    return out;
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
    }
    return out;
  }
  return { [prefix]: obj };
}

function tsFile(loc) {
  return path.join(msgDir, `${loc}.ts`);
}

function jsonFile(loc) {
  return path.join(dataDir, `${loc}.json`);
}

const enFlat = flatten(
  JSON.parse(fs.readFileSync(jsonFile("en"), "utf8")),
);
const frFlat = flatten(
  JSON.parse(fs.readFileSync(jsonFile("fr"), "utf8")),
);
const enKeys = Object.keys(enFlat);

const issues = [];
let ok = 0;

for (const loc of URL_LOCALES) {
  const locIssues = [];

  if (loc !== "zh-CN" && loc !== "en" && !fs.existsSync(jsonFile(loc))) {
    locIssues.push("missing-json");
  }
  if (!fs.existsSync(tsFile(loc))) {
    locIssues.push("missing-ts");
  }

  let jsonRaw = "";
  let jsonFlat = {};
  if (fs.existsSync(jsonFile(loc))) {
    jsonRaw = fs.readFileSync(jsonFile(loc), "utf8");
    jsonFlat = flatten(JSON.parse(jsonRaw));
    if (INVALID_RE.test(jsonRaw)) locIssues.push("api-error-in-json");
    const missing = enKeys.filter((k) => !(k in jsonFlat));
    if (missing.length) locIssues.push(`missing-keys(${missing.length})`);
  }

  if (loc !== "zh-CN" && loc !== "zh-TW" && loc !== "ja") {
    let cjk = 0;
    for (const v of Object.values(jsonFlat)) {
      if (typeof v === "string" && CJK_RE.test(v)) cjk++;
    }
    if (cjk) locIssues.push(`chinese-leak(${cjk})`);
  }

  if (loc !== "fr") {
    let sameFr = 0;
    for (const k of enKeys) {
      if (jsonFlat[k] === frFlat[k]) sameFr++;
    }
    if (sameFr > 80) locIssues.push(`french-copy(${sameFr})`);
  }

  if (GENERATED_JSON.includes(loc) && fs.existsSync(tsFile(loc)) && jsonFlat["nav.markets"]) {
    const tsRaw = fs.readFileSync(tsFile(loc), "utf8");
    const expected = jsonFlat["nav.markets"];
    if (!tsRaw.includes(expected)) locIssues.push("ts-json-out-of-sync");
    if (INVALID_RE.test(tsRaw)) locIssues.push("api-error-in-ts");
    const tsCjk = (tsRaw.match(CJK_RE) || []).length;
    const jsonCjk = (jsonRaw.match(CJK_RE) || []).length;
    if (tsCjk !== jsonCjk) locIssues.push(`cjk-mismatch(ts:${tsCjk},json:${jsonCjk})`);
  }

  if (locIssues.length) {
    issues.push({ loc, issues: locIssues });
  } else {
    ok++;
  }
}

console.log(`\n=== Locale audit (${URL_LOCALES.length} languages) ===\n`);
for (const row of issues) {
  console.log(`✗ ${row.loc}: ${row.issues.join(", ")}`);
}
if (ok) console.log(`✓ ${ok} locales OK`);
console.log(`\nTotal issues: ${issues.length}`);
process.exit(issues.length ? 1 : 0);
