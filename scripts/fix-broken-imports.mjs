#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const IMPORT = 'import { isChineseLocale } from "@/i18n/locale-helpers";';
const BAD = /import \{\s*\nimport \{ isChineseLocale \} from "@\/i18n\/locale-helpers";\n/g;

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
  if (!src.includes('import { isChineseLocale } from "@/i18n/locale-helpers";')) continue;

  // 多行 import 内误插：提到该 import 块之前
  if (BAD.test(src)) {
    src = src.replace(BAD, "import {\n");
    const idx = src.indexOf(IMPORT);
    if (idx >= 0) {
      src = src.slice(0, idx) + src.slice(idx + IMPORT.length + 1);
      const blockStart = src.indexOf("import {");
      src = src.slice(0, blockStart) + IMPORT + "\n" + src.slice(blockStart);
    }
    fs.writeFileSync(fp, src);
    console.log("fixed multiline:", path.relative(root, fp));
    continue;
  }

  // locale-helpers 自引用
  if (fp.endsWith("locale-helpers.ts") && src.includes(IMPORT)) {
    src = src.replace(IMPORT + "\n", "");
    fs.writeFileSync(fp, src);
    console.log("fixed self-import");
  }
}

console.log("done");
