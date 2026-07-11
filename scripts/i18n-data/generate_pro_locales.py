#!/usr/bin/env python3
"""Generate professional vi/ru/es/id locale files from en.json via batched translation."""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"

LOCALES = {
    "vi": "vi",
    "ru": "ru",
    "es": "es",
    "id": "id",
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
    "Polaris Pro",
    "Focus Deck",
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
    "ETH",
    "JPG",
    "PNG",
    "pm2",
    "yarn",
    "VPS",
    "Pro",
    "Renko",
    "Kagi",
    "Meme",
    "BSC Testnet",
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


def google_translate(text: str, target: str) -> str:
    q = urllib.parse.quote(text)
    url = (
        "https://translate.googleapis.com/translate_a/single"
        f"?client=gtx&sl=en&tl={target}&dt=t&q={q}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    parts = [chunk[0] for chunk in data[0] if chunk[0]]
    return "".join(parts)


def translate_text(text: str, target: str) -> str:
    if not text or not text.strip():
        return text
    protected, tokens = protect(text)
    for attempt in range(5):
        try:
            translated = google_translate(protected, target)
            return restore(translated, tokens)
        except Exception as exc:
            if attempt == 4:
                print(f"  FAIL: {text[:60]!r} -> {exc}", file=sys.stderr)
                return text
            time.sleep(0.8 * (attempt + 1))
    return text


def build_cache(locale: str, strings: list[str]) -> dict[str, str]:
    cache_path = ROOT / f"_pro_cache_{locale}.json"
    cache: dict[str, str] = {}
    if cache_path.exists():
        cache = json.load(cache_path.open(encoding="utf-8"))
    pending = [s for s in strings if s not in cache]
    print(f"[{locale}] {len(strings)} unique, {len(pending)} pending", flush=True)
    for i, text in enumerate(pending, 1):
        cache[text] = translate_text(text, LOCALES[locale])
        if i % 25 == 0 or i == len(pending):
            print(f"  [{locale}] {i}/{len(pending)}", flush=True)
            with cache_path.open("w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
                f.write("\n")
        time.sleep(0.12)
    with cache_path.open("w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return cache


def validate(en_flat: dict, locale_flat: dict) -> list[str]:
    errors = []
    if len(en_flat) != len(locale_flat):
        errors.append(f"key count mismatch")
    for key, en_val in en_flat.items():
        loc_val = locale_flat.get(key, "")
        if not isinstance(en_val, str):
            continue
        for ph in PLACEHOLDERS:
            if f"{{{ph}}}" in en_val and f"{{{ph}}}" not in str(loc_val):
                errors.append(f"{key}: missing {{{ph}}}")
        if "Velora" in en_val and "Velora" not in str(loc_val):
            errors.append(f"{key}: Velora missing")
    return errors


def main():
    force = "--force" in sys.argv
    only = [a for a in sys.argv[1:] if a in LOCALES]
    targets = only or list(LOCALES)

    en_flat = flatten(json.load(EN_PATH.open(encoding="utf-8")))
    strings = sorted({v for v in en_flat.values() if isinstance(v, str)})
    print(f"Source keys: {len(en_flat)}, unique strings: {len(strings)}")

    for locale in targets:
        out = ROOT / f"{locale}.json"
        cache = build_cache(locale, strings)
        flat = {k: cache[v] if isinstance(v, str) else v for k, v in en_flat.items()}
        data = unflatten(flat)
        with out.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        json.load(out.open(encoding="utf-8"))
        errs = validate(en_flat, flat)
        same = sum(1 for k in en_flat if isinstance(en_flat[k], str) and en_flat[k] == flat[k])
        print(f"Wrote {out.name}: keys={len(flat)} same_as_en={same} errors={len(errs)}")
        for e in errs[:8]:
            print(f"  ! {e}")


if __name__ == "__main__":
    main()
