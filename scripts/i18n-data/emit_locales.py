#!/usr/bin/env python3
"""Emit vi/ru/es/id locale JSON from complete hand-crafted translation maps."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"
MAP_PATH = ROOT / "_complete_translations.json"

PLACEHOLDERS = {
    "nickname", "seconds", "total", "symbol", "date", "count", "days",
    "bullish", "bearish", "neutral", "apply", "copy",
}


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


def validate(en_flat, loc_flat):
    errors = []
    if len(en_flat) != len(loc_flat):
        errors.append("key count mismatch")
    for key, en_val in en_flat.items():
        loc_val = loc_flat.get(key, "")
        if not isinstance(en_val, str):
            continue
        for ph in PLACEHOLDERS:
            if f"{{{ph}}}" in en_val and f"{{{ph}}}" not in str(loc_val):
                errors.append(f"{key}: missing {{{ph}}}")
        if "Velora" in en_val and "Velora" not in str(loc_val):
            errors.append(f"{key}: Velora missing")
    return errors


def main():
    en_flat = flatten(json.load(EN_PATH.open(encoding="utf-8")))
    maps = json.load(MAP_PATH.open(encoding="utf-8"))
    unique = {v for v in en_flat.values() if isinstance(v, str)}

    for locale in ("es", "ru", "vi", "id"):
        loc_map = maps[locale]
        missing = [s for s in unique if s not in loc_map]
        if missing:
            raise SystemExit(f"{locale}: missing {len(missing)} translations, e.g. {missing[0]!r}")
        out_flat = {k: loc_map[v] if isinstance(v, str) else v for k, v in en_flat.items()}
        data = unflatten(out_flat)
        out = ROOT / f"{locale}.json"
        with out.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        json.load(out.open(encoding="utf-8"))
        errs = validate(en_flat, out_flat)
        same = sum(1 for k in en_flat if isinstance(en_flat[k], str) and en_flat[k] == out_flat[k])
        print(f"{locale}.json: keys={len(out_flat)} same_as_en={same} errors={len(errs)}")
        for e in errs[:5]:
            print(f"  ! {e}")


if __name__ == "__main__":
    main()
