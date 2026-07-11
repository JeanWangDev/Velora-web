#!/usr/bin/env python3
"""Generate vi, ru, es, id locale files from en.json + translation overlays."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"


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


def load_overlay(name: str) -> dict:
    path = ROOT / f"_overlay_{name}.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def build_locale(locale: str, en_flat: dict) -> dict:
    overlay = load_overlay(locale)
    missing = [k for k in en_flat if k not in overlay]
    if missing:
        raise SystemExit(f"[{locale}] Missing {len(missing)} keys, e.g. {missing[:5]}")
    extra = [k for k in overlay if k not in en_flat]
    if extra:
        raise SystemExit(f"[{locale}] Extra keys: {extra[:5]}")
    merged = {k: overlay[k] for k in en_flat}
    return unflatten(merged)


def main():
    with EN_PATH.open(encoding="utf-8") as f:
        en = json.load(f)
    en_flat = flatten(en)
    for locale in ("vi", "ru", "es", "id"):
        out = build_locale(locale, en_flat)
        out_path = ROOT / f"{locale}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Wrote {out_path} ({len(en_flat)} keys)")


if __name__ == "__main__":
    main()
