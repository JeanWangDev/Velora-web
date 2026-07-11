#!/usr/bin/env python3
"""Fast locale generation: dedupe strings, parallel translate, rebuild tree."""
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from deep_translator import MyMemoryTranslator

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"

TARGETS = {
    "ru": "russian",
    "es": "spanish",
    "id": "indonesian",
}

PH_RE = re.compile(r"\{(\w+)\}")


def flatten(obj, prefix=""):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            out.update(flatten(v, f"{prefix}.{k}" if prefix else k))
        return out
    if isinstance(obj, list):
        out = {}
        for i, v in enumerate(obj):
            out.update(flatten(v, f"{prefix}[{i}]"))
        return out
    return {prefix: obj}


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
            last = idx == len(parts) - 1
            nxt = parts[idx + 1] if not last else None
            if last:
                if isinstance(part, int):
                    while len(cur) <= part:
                        cur.append(None)
                    cur[part] = value
                else:
                    cur[part] = value
            elif isinstance(nxt, int):
                if isinstance(part, int):
                    if cur[part] is None:
                        cur[part] = []
                    cur = cur[part]
                else:
                    cur.setdefault(part, [])
                    cur = cur[part]
            else:
                if isinstance(part, int):
                    if cur[part] is None:
                        cur[part] = {}
                    cur = cur[part]
                else:
                    cur.setdefault(part, {})
                    cur = cur[part]
    return root


def protect(text: str) -> tuple[str, dict]:
    tokens = {}

    def ph(m):
        k = f"__PH_{len(tokens)}__"
        tokens[k] = m.group(0)
        return k

    t = PH_RE.sub(ph, text)
    for term in (
        "Velora", "USDT", "BTC", "ETH", "OKX", "API", "KYC", "2FA", "VIP",
        "TRC20", "BSC", "TP/SL", "Pro", "Binance", "Didit",
    ):
        if term in t:
            k = f"__TERM_{len(tokens)}__"
            tokens[k] = term
            t = t.replace(term, k)
    return t, tokens


def restore(text: str, tokens: dict) -> str:
    for k, v in tokens.items():
        text = text.replace(k, v)
    return text


def translate_one(text: str, lang: str, cache: dict) -> str:
    if text in cache:
        return cache[text]
    if not text or not text.strip():
        cache[text] = text
        return text
    protected, tokens = protect(text)
    try:
        out = MyMemoryTranslator(source="english", target=lang).translate(protected[:450])
        out = restore(out or text, tokens)
    except Exception:
        out = text
    cache[text] = out
    return out


def build_locale(en_flat: dict, lang: str, workers: int = 8) -> dict:
    strings = {v for v in en_flat.values() if isinstance(v, str)}
    cache: dict[str, str] = {}
    items = list(strings)
    print(f"  unique strings: {len(items)}")

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = [pool.submit(translate_one, s, lang, cache) for s in items]
        done = 0
        for f in as_completed(futs):
            f.result()
            done += 1
            if done % 100 == 0:
                print(f"  translated {done}/{len(items)}")

    flat = {k: cache[v] if isinstance(v, str) else v for k, v in en_flat.items()}
    return unflatten(flat)


def is_corrupted(path: Path) -> bool:
    if not path.exists():
        return True
    text = path.read_text(encoding="utf-8")
    return "INVALID LANGUAGE PAIR" in text


def main():
    force = "--force" in __import__("sys").argv
    en = json.load(EN_PATH.open(encoding="utf-8"))
    en_flat = flatten(en)
    print(f"Total keys: {len(en_flat)}")

    for code, lang in TARGETS.items():
        out = ROOT / f"{code}.json"
        if not force and out.exists() and out.stat().st_size > 30000 and not is_corrupted(out):
            print(f"skip {code} (exists)")
            continue
        if is_corrupted(out):
            print(f"rebuild corrupted {code}")
        print(f"Building {code}...")
        t0 = time.time()
        data = build_locale(en_flat, lang)
        with out.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Wrote {out} in {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
