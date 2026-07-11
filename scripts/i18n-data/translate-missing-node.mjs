#!/usr/bin/env node
/**
 * 使用 MyMemory HTTP API 并行翻译缺失语言包
 * node scripts/i18n-data/translate-missing-node.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dataDir, "en.json"), "utf8"));

const TARGETS = {
  ru: "en|ru",
  es: "en|es",
  id: "en|id",
};

const INVALID_RE = /INVALID LANGUAGE PAIR/i;
const QUOTA_RE = /MYMEMORY WARNING/i;

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

function unflatten(flat) {
  const root = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = [];
    let buf = "";
    let i = 0;
    while (i < path.length) {
      if (path[i] === "[") {
        if (buf) parts.push(buf), (buf = "");
        const j = path.indexOf("]", i);
        parts.push(parseInt(path.slice(i + 1, j), 10));
        i = j + 1;
      } else if (path[i] === ".") {
        if (buf) parts.push(buf), (buf = "");
        i++;
      } else {
        buf += path[i++];
      }
    }
    if (buf) parts.push(buf);
    let cur = root;
    for (let idx = 0; idx < parts.length; idx++) {
      const part = parts[idx];
      const last = idx === parts.length - 1;
      const nxt = parts[idx + 1];
      if (last) {
        if (typeof part === "number") {
          while (cur.length <= part) cur.push(null);
          cur[part] = value;
        } else cur[part] = value;
      } else if (typeof nxt === "number") {
        if (typeof part === "number") {
          if (!cur[part]) cur[part] = [];
          cur = cur[part];
        } else {
          if (!cur[part]) cur[part] = [];
          cur = cur[part];
        }
      } else {
        if (typeof part === "number") {
          if (!cur[part]) cur[part] = {};
          cur = cur[part];
        } else {
          if (!cur[part]) cur[part] = {};
          cur = cur[part];
        }
      }
    }
  }
  return root;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateText(text, langPair) {
  if (!text?.trim()) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${langPair}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      const out = data?.responseData?.translatedText;
      if (out && !INVALID_RE.test(out) && !QUOTA_RE.test(out)) return out;
    } catch {
      /* retry */
    }
    await sleep(300 * (attempt + 1));
  }
  return text;
}

async function buildLocale(langPair, code) {
  const flat = flatten(en);
  const unique = [...new Set(Object.values(flat).filter((v) => typeof v === "string"))];
  const cache = new Map();
  console.log(`[${code}] ${unique.length} unique strings`);

  let done = 0;
  const concurrency = 6;
  const queue = [...unique];

  async function worker() {
    while (queue.length) {
      const s = queue.shift();
      if (!s) break;
      cache.set(s, await translateText(s, langPair));
      done++;
      if (done % 50 === 0) console.log(`[${code}] ${done}/${unique.length}`);
      await sleep(120);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const outFlat = {};
  for (const [k, v] of Object.entries(flat)) {
    outFlat[k] = typeof v === "string" ? (cache.get(v) ?? v) : v;
  }
  return unflatten(outFlat);
}

function isCorruptedJson(filePath) {
  if (!fs.existsSync(filePath)) return true;
  const raw = fs.readFileSync(filePath, "utf8");
  return INVALID_RE.test(raw) || QUOTA_RE.test(raw);
}

async function main() {
  const force = process.argv.includes("--force");
  for (const [code, pair] of Object.entries(TARGETS)) {
    const outPath = path.join(dataDir, `${code}.json`);
    if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 30000 && !isCorruptedJson(outPath)) {
      console.log("skip", code);
      continue;
    }
    if (isCorruptedJson(outPath)) console.log("rebuild corrupted", code);
    console.log("start", code);
    const data = await buildLocale(pair, code);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
    console.log("wrote", outPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
