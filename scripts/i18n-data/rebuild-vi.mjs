#!/usr/bin/env node
/**
 * 仅重建越南语 vi.json：剔除中文/法语污染，保留有效越南语文案。
 * 不修改其他语言文件。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dataDir = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(fs.readFileSync(path.join(dataDir, "en.json"), "utf8"));
const viOld = JSON.parse(fs.readFileSync(path.join(dataDir, "vi.json"), "utf8"));
const fr = JSON.parse(fs.readFileSync(path.join(dataDir, "fr.json"), "utf8"));

const overridesPath = path.join(dataDir, "vi-overrides.json");
const overrides = fs.existsSync(overridesPath)
  ? JSON.parse(fs.readFileSync(overridesPath, "utf8"))
  : {};

const FRENCH_RE =
  /[œæ]|(\b(des|les|une|un|du|de la|avec|pour|dans|sur|Comment|Allez|choisissez|Rétablir|Nouveau|Panneau|Liste|Paire|Trader|Infos|Données|Meilleur|Taux|Achat|Vente|Croisé|Isolé|suspendu|symboles|paires|compte|Pas encore|profil|Système|Langue|Clair|Sombre|Déconnecté|professionnelle|maintenant|Après|vérifiez|soumettez|débloquer|compétitifs|portefeuilles|Contrôles|Retirez|actifs|Intervalle|Hors ligne|stable|Total|Spot|Futures|Funding|Capture|Zoom|Mettre|modèle|Nouveau|ordres|trades|paires|symboles|renseigné|réinitialisé|succès|français|devise|adresse|transférez|inscription|déposer|choisissez|Allez|volontiers)\b)/i;

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
  for (const [pathKey, value] of Object.entries(flat)) {
    const parts = [];
    let buf = "";
    let i = 0;
    while (i < pathKey.length) {
      if (pathKey[i] === "[") {
        if (buf) parts.push(buf), (buf = "");
        const j = pathKey.indexOf("]", i);
        parts.push(parseInt(pathKey.slice(i + 1, j), 10));
        i = j + 1;
      } else if (pathKey[i] === ".") {
        if (buf) parts.push(buf), (buf = "");
        i++;
      } else {
        buf += pathKey[i++];
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

function fixTypos(s) {
  return s
    .replace(/Thị trườngs/g, "Thị trường")
    .replace(/Đơn hàngs/g, "Đơn hàng")
    .replace(/Đăng ký maintenant/g, "Đăng ký ngay")
    .replace(/le profil/g, "hồ sơ")
    .replace(/Menu compte/g, "Menu tài khoản");
}

function hasChinese(s) {
  return /[\u4e00-\u9fff]/.test(s);
}

function hasVietnamese(s) {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
    s,
  );
}

function isFrenchLike(s, frVal) {
  if (s === frVal) return true;
  return FRENCH_RE.test(s);
}

function pickValue(key, enVal, viVal, frVal) {
  if (overrides[key]) return overrides[key];
  if (
    viVal &&
    typeof viVal === "string" &&
    !hasChinese(viVal) &&
    viVal !== frVal &&
    !isFrenchLike(viVal, frVal) &&
    (hasVietnamese(viVal) || (viVal !== enVal && !FRENCH_RE.test(viVal)))
  ) {
    return fixTypos(viVal);
  }
  return enVal;
}

const enFlat = flatten(en);
const viFlat = flatten(viOld);
const frFlat = flatten(fr);

const outFlat = {};
let kept = 0;
let fallbackEn = 0;
let override = 0;

for (const [key, enVal] of Object.entries(enFlat)) {
  if (overrides[key]) {
    outFlat[key] = overrides[key];
    override++;
  } else {
    const picked = pickValue(key, enVal, viFlat[key], frFlat[key]);
    outFlat[key] = picked;
    if (picked === enVal) fallbackEn++;
    else kept++;
  }
}

const out = unflatten(outFlat);
fs.writeFileSync(path.join(dataDir, "vi.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`vi.json rebuilt: kept=${kept} overrides=${override} fallbackEn=${fallbackEn}`);
