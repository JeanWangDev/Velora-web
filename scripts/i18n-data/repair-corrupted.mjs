#!/usr/bin/env node
/**
 * 修复损坏的语言包：
 * - ru/es/id：含 INVALID LANGUAGE PAIR 时从 en.json 重建并套用术语表
 * - vi：将 __ TOK0000 __ 还原为 Velora
 * 完整翻译待 API 配额恢复后运行 translate-missing-node.mjs --force
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dataDir = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(fs.readFileSync(path.join(dataDir, "en.json"), "utf8"));

const INVALID_RE = /INVALID LANGUAGE PAIR/i;
const QUOTA_RE = /MYMEMORY WARNING/i;

/** 高频 UI 术语（来源 generate_locales.py GLOSSARY） */
const GLOSSARY = {
  ru: {
    "Sign In": "Войти",
    "Sign Out": "Выйти",
    "Sign Up": "Регистрация",
    "Save": "Сохранить",
    Cancel: "Отмена",
    Confirm: "Подтвердить",
    Close: "Закрыть",
    Back: "Назад",
    Home: "Главная",
    Trade: "Торговля",
    Buy: "Купить",
    Sell: "Продать",
    All: "Все",
    Yes: "Да",
    No: "Нет",
    Search: "Поиск",
    "Loading…": "Загрузка…",
    Retry: "Повторить",
    Refresh: "Обновить",
    Delete: "Удалить",
    Edit: "Редактировать",
    Apply: "Применить",
    More: "Ещё",
  },
  es: {
    "Sign In": "Iniciar sesión",
    "Sign Out": "Cerrar sesión",
    "Sign Up": "Registrarse",
    Save: "Guardar",
    Cancel: "Cancelar",
    Confirm: "Confirmar",
    Close: "Cerrar",
    Back: "Volver",
    Home: "Inicio",
    Trade: "Operar",
    Buy: "Comprar",
    Sell: "Vender",
    All: "Todos",
    Yes: "Sí",
    No: "No",
    Search: "Buscar",
    "Loading…": "Cargando…",
    Retry: "Reintentar",
    Refresh: "Actualizar",
    Delete: "Eliminar",
    Edit: "Editar",
    Apply: "Aplicar",
    More: "Más",
  },
  id: {
    "Sign In": "Masuk",
    "Sign Out": "Keluar",
    "Sign Up": "Daftar",
    Save: "Simpan",
    Cancel: "Batal",
    Confirm: "Konfirmasi",
    Close: "Tutup",
    Back: "Kembali",
    Home: "Beranda",
    Trade: "Trading",
    Buy: "Beli",
    Sell: "Jual",
    All: "Semua",
    Yes: "Ya",
    No: "Tidak",
    Search: "Cari",
    "Loading…": "Memuat…",
    Retry: "Coba lagi",
    Refresh: "Muat ulang",
    Delete: "Hapus",
    Edit: "Edit",
    Apply: "Terapkan",
    More: "Lainnya",
  },
};

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

function applyGlossary(flat, locale) {
  const map = GLOSSARY[locale] ?? {};
  const out = { ...flat };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string" && map[v]) out[k] = map[v];
  }
  return out;
}

function needsRebuild(code, raw) {
  if (INVALID_RE.test(raw) || QUOTA_RE.test(raw)) return true;
  if (code === "ru" && !/[А-Яа-яЁё]/.test(raw.slice(0, 8000))) return true;
  if ((code === "es" || code === "id") && /[\u4e00-\u9fff]/.test(raw.slice(0, 4000))) return true;
  return false;
}

function repairLocale(code) {
  const outPath = path.join(dataDir, `${code}.json`);
  const raw = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  if (!needsRebuild(code, raw)) return false;

  const enFlat = flatten(en);
  const flat = applyGlossary(enFlat, code);
  const data = unflatten(flat);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
  console.log(`repaired ${code}.json from en + glossary`);
  return true;
}

function repairVi() {
  const viPath = path.join(dataDir, "vi.json");
  if (!fs.existsSync(viPath)) return;
  const vi = JSON.parse(fs.readFileSync(viPath, "utf8"));
  const flat = flatten(vi);
  let changed = 0;
  for (const [k, v] of Object.entries(flat)) {
    if (typeof v === "string" && /__\s*TOK\d+\s*__/.test(v)) {
      flat[k] = v.replace(/__\s*TOK\d+\s*__/g, "Velora").replace(/\s+/g, " ").trim();
      changed++;
    }
  }
  if (changed) {
    fs.writeFileSync(viPath, JSON.stringify(unflatten(flat), null, 2) + "\n");
    console.log(`vi.json: fixed ${changed} TOK placeholders`);
  }
}

for (const code of ["ru", "es", "id"]) repairLocale(code);
repairVi();
console.log("done");
