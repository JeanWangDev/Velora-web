#!/usr/bin/env node
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

function endOfImportBlock(lines) {
  let end = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("import ") || line.startsWith('import "') || line.startsWith("import type")) {
      end = i + 1;
      i++;
      while (i < lines.length && (lines[i].startsWith("  ") || lines[i].startsWith("\t"))) {
        end = i + 1;
        i++;
      }
      continue;
    }
    if (line.trim() === "" && end > 0) {
      end = i + 1;
      i++;
      continue;
    }
    break;
  }
  return end;
}

for (const fp of walk(root)) {
  if (fp.endsWith("locale-helpers.ts")) continue;
  let src = fs.readFileSync(fp, "utf8");
  if (!src.includes("isChineseLocale")) continue;
  if (src.includes('from "@/i18n/locale-helpers"')) continue;
  const lines = src.split("\n");
  const at = endOfImportBlock(lines);
  lines.splice(at, 0, IMPORT);
  fs.writeFileSync(fp, lines.join("\n"));
  console.log("added:", path.relative(root, fp));
}

console.log("done");
