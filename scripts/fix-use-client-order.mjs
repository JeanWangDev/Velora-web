#!/usr/bin/env node
/** 将误放在 "use client" 之前的 import 移到其后 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const IMPORT = 'import { isChineseLocale } from "@/i18n/locale-helpers";';

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    if (fs.statSync(fp).isDirectory()) walk(fp, out);
    else if (/\.tsx?$/.test(name)) out.push(fp);
  }
  return out;
}

for (const fp of walk(root)) {
  let src = fs.readFileSync(fp, "utf8");
  if (!src.startsWith(`${IMPORT}\n"use client";`)) continue;
  src = src.replace(`${IMPORT}\n"use client";\n\n`, `"use client";\n\n${IMPORT}\n`);
  fs.writeFileSync(fp, src);
  console.log("fixed:", path.relative(root, fp));
}

console.log("done");
