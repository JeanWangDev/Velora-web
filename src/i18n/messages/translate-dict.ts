/**
 * 从英文基准字典深拷贝并递归翻译字符串叶子节点。
 * 用于批量生成多语言包（专业交易所 UI 文案）。
 */
import type { en } from "./en";

type Dict = typeof en;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 深拷贝结构，仅翻译 string 叶子（保留 {placeholder}） */
export function translateDict(
  source: Dict,
  translate: (text: string) => string,
): Dict {
  const walk = (node: unknown): unknown => {
    if (typeof node === "string") return translate(node);
    if (Array.isArray(node)) return node.map(walk);
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        out[k] = walk(v);
      }
      return out;
    }
    return node;
  };
  return walk(source) as Dict;
}

/** 生成 satisfies typeof en 的语言包模块 */
export function defineLocale(
  source: Dict,
  translate: (text: string) => string,
): Dict {
  return translateDict(source, translate);
}
