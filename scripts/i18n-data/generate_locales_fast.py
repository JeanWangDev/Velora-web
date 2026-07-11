#!/usr/bin/env python3
"""Generate vi/ru/es/id from zh-TW source (professional crypto exchange tone)."""
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from deep_translator import MyMemoryTranslator

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"
TW_PATH = ROOT / "zh-TW.json"

LOCALES = {
    "vi": "vietnamese",
    "ru": "russian",
    "es": "spanish",
    "id": "indonesian",
}

PLACEHOLDERS = {
    "nickname", "seconds", "total", "symbol", "date", "count", "days",
    "bullish", "bearish", "neutral", "apply", "copy",
}

PROTECTED_TERMS = [
    "TRC20-USDT", "TradeIntent", "ChainAdapter", "MockPerp", "Heikin Ashi",
    "Point & figure", "Line break", "Hollow candles", "Google Play", "App Store",
    "MetaMask", "LunarCrush", "Glassnode", "CoinGlass", "Binance", "Polaris",
    "Velora", "Solana", "Didit", "Sharpe", "BTCB", "tBNB", "TRC20", "TP/SL",
    "OKX", "USDT", "WEBP", "JPEG", "BSC", "RSS", "API", "KYC", "2FA", "VIP",
    "BTC", "JPG", "PNG", "pm2", "yarn", "VPS", "Pro",
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
                        while len(cur) <= part:
                            cur.append(None)
                        if cur[part] is None:
                            cur[part] = []
                        cur = cur[part]
                    else:
                        if part not in cur or cur[part] is None:
                            cur[part] = []
                        cur = cur[part]
                else:
                    if isinstance(part, int):
                        while len(cur) <= part:
                            cur.append(None)
                        if cur[part] is None:
                            cur[part] = {}
                        cur = cur[part]
                    else:
                        if part not in cur:
                            cur[part] = {}
                        cur = cur[part]
    return root


def protect(text: str) -> tuple[str, dict[str, str]]:
    tokens: dict[str, str] = {}
    counter = 0

    def add_token(original: str) -> str:
        nonlocal counter
        key = f"__TOK{counter:04d}__"
        tokens[key] = original
        counter += 1
        return key

    protected = PH_RE.sub(lambda m: add_token(m.group(0)), text)
    for term in PROTECTED_TERMS:
        if term in protected:
            token = add_token(term)
            protected = protected.replace(term, token)
    return protected, tokens


def restore(text: str, tokens: dict[str, str]) -> str:
    for token, original in tokens.items():
        text = text.replace(token, original)
    return text


def translate_one(text: str, target: str) -> str:
    protected, tokens = protect(text)
    translator = MyMemoryTranslator(source="chinese traditional", target=target)
    for attempt in range(5):
        try:
            translated = translator.translate(protected)
            return restore(translated, tokens)
        except Exception:
            time.sleep(0.4 * (attempt + 1))
    return text


def translate_locale(tw_flat: dict, locale: str, workers: int = 8) -> dict:
    target = LOCALES[locale]
    cache_path = ROOT / f"_cache_{locale}.json"
    cache: dict[str, str] = {}
    if cache_path.exists():
        cache = json.load(cache_path.open(encoding="utf-8"))
    unique = sorted({v for v in tw_flat.values() if isinstance(v, str)})
    pending = [t for t in unique if t not in cache]
    print(f"[{locale}] {len(unique)} unique, {len(pending)} to translate", flush=True)

    def job(text: str) -> tuple[str, str]:
        return text, translate_one(text, target)

    done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(job, t): t for t in pending}
        for fut in as_completed(futures):
            text, translated = fut.result()
            cache[text] = translated
            done += 1
            if done % 80 == 0 or done == len(pending):
                print(f"  [{locale}] {done}/{len(pending)}", flush=True)
                with cache_path.open("w", encoding="utf-8") as f:
                    json.dump(cache, f, ensure_ascii=False)
    with cache_path.open("w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)
    return {k: cache[v] if isinstance(v, str) else v for k, v in tw_flat.items()}


def validate(en_flat: dict, locale_flat: dict, locale: str) -> list[str]:
    errors = []
    if len(en_flat) != len(locale_flat):
        errors.append(f"key count: en={len(en_flat)} {locale}={len(locale_flat)}")
    if set(en_flat) != set(locale_flat):
        errors.append("key set mismatch")
    for key, en_val in en_flat.items():
        loc_val = locale_flat.get(key, "")
        if not isinstance(en_val, str):
            continue
        for ph in PLACEHOLDERS:
            if f"{{{ph}}}" in en_val and f"{{{ph}}}" not in loc_val:
                errors.append(f"{key}: missing {{{ph}}} in '{loc_val}'")
        if "Velora" in en_val and "Velora" not in loc_val:
            errors.append(f"{key}: Velora missing")
    return errors


def main():
    en_flat = flatten(json.load(EN_PATH.open(encoding="utf-8")))
    tw_flat = flatten(json.load(TW_PATH.open(encoding="utf-8")))
    assert set(en_flat) == set(tw_flat), "en/zh-TW key mismatch"
    print(f"Keys: {len(en_flat)}")

    for locale in LOCALES:
        flat = translate_locale(tw_flat, locale)
        data = unflatten(flat)
        out = ROOT / f"{locale}.json"
        with out.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        json.load(out.open(encoding="utf-8"))
        errs = validate(en_flat, flat, locale)
        print(f"Wrote {out.name}: {len(flat)} keys, {len(errs)} validation issues")
        for e in errs[:12]:
            print(f"  ! {e}")


if __name__ == "__main__":
    main()
