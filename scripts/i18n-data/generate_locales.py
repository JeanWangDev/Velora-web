#!/usr/bin/env python3
"""Generate vi, ru, es, id locale JSON files from en.json with protected terms."""
import json
import re
import sys
import time
from pathlib import Path

from deep_translator import MyMemoryTranslator

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"

LOCALES = {
    "vi": ("vietnamese", "vi"),
    "ru": ("russian", "ru"),
    "es": ("spanish", "es"),
    "id": ("indonesian", "id"),
}

# Manual glossary for short UI strings MyMemory may leave in English
GLOSSARY: dict[str, dict[str, str]] = {
    "vi": {
        "Sign In": "Đăng nhập",
        "Sign Out": "Đăng xuất",
        "Sign Up": "Đăng ký",
        "Save": "Lưu",
        "Cancel": "Hủy",
        "Confirm": "Xác nhận",
        "Close": "Đóng",
        "Back": "Quay lại",
        "Home": "Trang chủ",
        "Trade": "Giao dịch",
        "Buy": "Mua",
        "Sell": "Bán",
        "All": "Tất cả",
        "Yes": "Có",
        "No": "Không",
        "Search": "Tìm kiếm",
        "Loading…": "Đang tải…",
        "Retry": "Thử lại",
        "Refresh": "Làm mới",
        "Delete": "Xóa",
        "Edit": "Chỉnh sửa",
        "Apply": "Áp dụng",
        "More": "Thêm",
        "Pro": "Pro",
        "d": "ng",
        "H": "G",
        "M": "P",
        "S": "G",
        "applies": "lượt áp dụng",
        " copies": " lượt sao chép",
    },
    "ru": {
        "Sign In": "Войти",
        "Sign Out": "Выйти",
        "Sign Up": "Регистрация",
        "Save": "Сохранить",
        "Cancel": "Отмена",
        "Confirm": "Подтвердить",
        "Close": "Закрыть",
        "Back": "Назад",
        "Home": "Главная",
        "Trade": "Торговля",
        "Buy": "Купить",
        "Sell": "Продать",
        "All": "Все",
        "Yes": "Да",
        "No": "Нет",
        "Search": "Поиск",
        "Loading…": "Загрузка…",
        "Retry": "Повторить",
        "Refresh": "Обновить",
        "Delete": "Удалить",
        "Edit": "Редактировать",
        "Apply": "Применить",
        "More": "Ещё",
        "Pro": "Pro",
        "d": "д",
        "H": "Ч",
        "M": "М",
        "S": "С",
        "applies": "применений",
        " copies": " копий",
    },
    "es": {
        "Sign In": "Iniciar sesión",
        "Sign Out": "Cerrar sesión",
        "Sign Up": "Registrarse",
        "Save": "Guardar",
        "Cancel": "Cancelar",
        "Confirm": "Confirmar",
        "Close": "Cerrar",
        "Back": "Volver",
        "Home": "Inicio",
        "Trade": "Operar",
        "Buy": "Comprar",
        "Sell": "Vender",
        "All": "Todos",
        "Yes": "Sí",
        "No": "No",
        "Search": "Buscar",
        "Loading…": "Cargando…",
        "Retry": "Reintentar",
        "Refresh": "Actualizar",
        "Delete": "Eliminar",
        "Edit": "Editar",
        "Apply": "Aplicar",
        "More": "Más",
        "Pro": "Pro",
        "d": "d",
        "H": "H",
        "M": "M",
        "S": "S",
        "applies": "aplicaciones",
        " copies": " copias",
    },
    "id": {
        "Sign In": "Masuk",
        "Sign Out": "Keluar",
        "Sign Up": "Daftar",
        "Save": "Simpan",
        "Cancel": "Batal",
        "Confirm": "Konfirmasi",
        "Close": "Tutup",
        "Back": "Kembali",
        "Home": "Beranda",
        "Trade": "Trading",
        "Buy": "Beli",
        "Sell": "Jual",
        "All": "Semua",
        "Yes": "Ya",
        "No": "Tidak",
        "Search": "Cari",
        "Loading…": "Memuat…",
        "Retry": "Coba lagi",
        "Refresh": "Muat ulang",
        "Delete": "Hapus",
        "Edit": "Edit",
        "Apply": "Terapkan",
        "More": "Lainnya",
        "Pro": "Pro",
        "d": "h",
        "H": "J",
        "M": "M",
        "S": "D",
        "applies": "penerapan",
        " copies": " salinan",
    },
}

PLACEHOLDERS = {
    "nickname",
    "seconds",
    "total",
    "symbol",
    "date",
    "count",
    "days",
    "bullish",
    "bearish",
    "neutral",
    "apply",
    "copy",
}

# Terms to keep unchanged (longest first for greedy matching)
PROTECTED_TERMS = [
    "TRC20-USDT",
    "TradeIntent",
    "ChainAdapter",
    "MockPerp",
    "Heikin Ashi",
    "Point & figure",
    "Line break",
    "Hollow candles",
    "Google Play",
    "App Store",
    "MetaMask",
    "LunarCrush",
    "Glassnode",
    "CoinGlass",
    "Binance",
    "Polaris",
    "Velora",
    "Solana",
    "Didit",
    "Sharpe",
    "BTCB",
    "tBNB",
    "TRC20",
    "TP/SL",
    "OKX",
    "USDT",
    "WEBP",
    "JPEG",
    "BSC",
    "RSS",
    "API",
    "KYC",
    "2FA",
    "VIP",
    "BTC",
    "JPG",
    "PNG",
    "pm2",
    "yarn",
    "VPS",
]

PH_RE = re.compile(
    r"\{(" + "|".join(re.escape(p) for p in sorted(PLACEHOLDERS, key=len, reverse=True)) + r")\}"
)


def flatten(obj, prefix=""):
    items = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{prefix}.{k}" if prefix else k
            items.update(flatten(v, p))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            items.update(flatten(v, f"{prefix}[{i}]"))
    else:
        items[prefix] = obj
    return items


def unflatten(flat: dict):
    root = {}
    for path, value in flat.items():
        parts = []
        buf = ""
        i = 0
        while i < len(path):
            if path[i] == "[":
                if buf:
                    parts.append(buf)
                    buf = ""
                j = path.index("]", i)
                parts.append(int(path[i + 1 : j]))
                i = j + 1
            elif path[i] == ".":
                if buf:
                    parts.append(buf)
                    buf = ""
                i += 1
            else:
                buf += path[i]
                i += 1
        if buf:
            parts.append(buf)
        cur = root
        for idx, part in enumerate(parts):
            is_last = idx == len(parts) - 1
            nxt = parts[idx + 1] if not is_last else None
            if is_last:
                if isinstance(part, int):
                    while len(cur) <= part:
                        cur.append(None)
                    cur[part] = value
                else:
                    cur[part] = value
            else:
                if isinstance(nxt, int):
                    if isinstance(part, int):
                        if cur[part] is None:
                            cur[part] = []
                        cur = cur[part]
                    else:
                        if part not in cur or cur[part] is None:
                            cur[part] = []
                        cur = cur[part]
                else:
                    if isinstance(part, int):
                        if cur[part] is None:
                            cur[part] = {}
                        cur = cur[part]
                    else:
                        if part not in cur:
                            cur[part] = {}
                        cur = cur[part]
    return root


def protect(text: str) -> tuple[str, dict[str, str]]:
    """Replace placeholders and protected terms with tokens."""
    tokens: dict[str, str] = {}
    counter = 0

    def add_token(original: str) -> str:
        nonlocal counter
        key = f"__TOK{counter:04d}__"
        tokens[key] = original
        counter += 1
        return key

    def ph_sub(m: re.Match) -> str:
        return add_token(m.group(0))

    protected = PH_RE.sub(ph_sub, text)

    for term in PROTECTED_TERMS:
        if term in protected:
            token = add_token(term)
            protected = protected.replace(term, token)

    return protected, tokens


def restore(text: str, tokens: dict[str, str]) -> str:
    for token, original in tokens.items():
        text = text.replace(token, original)
    return text


def translate_text(text: str, locale: str, translator: MyMemoryTranslator) -> str:
    if not text or not text.strip():
        return text
    glossary = GLOSSARY.get(locale, {})
    if text in glossary:
        return glossary[text]
    protected, tokens = protect(text)
    for attempt in range(4):
        try:
            translated = translator.translate(protected)
            result = restore(translated, tokens)
            if result == text and text in glossary:
                return glossary[text]
            return result
        except Exception as exc:
            if attempt == 3:
                if text in glossary:
                    return glossary[text]
                raise
            time.sleep(1.0 * (attempt + 1))
            print(f"  retry {attempt + 1} for {locale!r}: {exc}", file=sys.stderr)
    return text


def translate_locale(en_flat: dict, locale: str) -> dict:
    target_name, _ = LOCALES[locale]
    translator = MyMemoryTranslator(source="english", target=target_name)
    unique_strings = sorted({v for v in en_flat.values() if isinstance(v, str)})
    cache: dict[str, str] = {}
    total_unique = len(unique_strings)
    print(f"  [{locale}] {total_unique} unique strings", flush=True)
    for i, text in enumerate(unique_strings, 1):
        cache[text] = translate_text(text, locale, translator)
        if i % 30 == 0 or i == total_unique:
            print(f"  [{locale}] translated {i}/{total_unique}", flush=True)
        if i % 10 == 0:
            time.sleep(0.15)
    return {k: cache[v] if isinstance(v, str) else v for k, v in en_flat.items()}


def validate(en_flat: dict, locale_flat: dict, locale: str) -> list[str]:
    errors = []
    if len(en_flat) != len(locale_flat):
        errors.append(f"key count mismatch: en={len(en_flat)} {locale}={len(locale_flat)}")
    missing = set(en_flat) - set(locale_flat)
    extra = set(locale_flat) - set(en_flat)
    if missing:
        errors.append(f"missing keys: {list(missing)[:5]}")
    if extra:
        errors.append(f"extra keys: {list(extra)[:5]}")
    for key, en_val in en_flat.items():
        loc_val = locale_flat.get(key, "")
        if not isinstance(en_val, str):
            continue
        for ph in PLACEHOLDERS:
            en_has = f"{{{ph}}}" in en_val
            loc_has = f"{{{ph}}}" in loc_val
            if en_has and not loc_has:
                errors.append(f"{key}: missing placeholder {{{ph}}}")
        if "Velora" in en_val and "Velora" not in loc_val:
            errors.append(f"{key}: Velora not preserved")
    return errors


def write_locale(locale: str, data: dict) -> Path:
    path = ROOT / f"{locale}.json"
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return path


def main():
    with EN_PATH.open(encoding="utf-8") as f:
        en = json.load(f)
    en_flat = flatten(en)
    print(f"Source: {len(en_flat)} leaf keys")

    summary = []
    for locale in LOCALES:
        print(f"\nTranslating {locale}...")
        locale_flat = translate_locale(en_flat, locale)
        errors = validate(en_flat, locale_flat, locale)
        out = unflatten(locale_flat)
        path = write_locale(locale, out)
        json.load(path.open(encoding="utf-8"))  # parse check
        status = "OK" if not errors else f"WARN: {errors[:3]}"
        summary.append((locale, len(locale_flat), path, status, errors))
        print(f"  -> {path} [{status}]")

    print("\n=== Summary ===")
    for locale, count, path, status, errors in summary:
        print(f"{locale}.json: {count} keys, {status}")
        if errors:
            for e in errors[:10]:
                print(f"  - {e}")


if __name__ == "__main__":
    main()
