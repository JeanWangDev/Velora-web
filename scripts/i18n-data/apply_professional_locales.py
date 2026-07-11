#!/usr/bin/env python3
"""Apply professional key-level translations for vi, ru, es, id from en.json structure."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"
FR_PATH = ROOT / "fr.json"

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


def load_overlays():
    path = ROOT / "_professional_overlays.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def validate(en_flat, loc_flat, locale):
    errors = []
    if len(en_flat) != len(loc_flat):
        errors.append(f"count {len(loc_flat)} vs {len(en_flat)}")
    for key, en_val in en_flat.items():
        loc_val = loc_flat.get(key, "")
        if not isinstance(en_val, str):
            continue
        for ph in PLACEHOLDERS:
            if f"{{{ph}}}" in en_val and f"{{{ph}}}" not in str(loc_val):
                errors.append(f"{key}: missing {{{ph}}}")
        if "Velora" in en_val and "Velora" not in str(loc_val):
            errors.append(f"{key}: Velora")
    return errors


def main():
    en_flat = flatten(json.load(EN_PATH.open(encoding="utf-8")))
    overlays = load_overlays()
    for locale in ("vi", "ru", "es", "id"):
        ov = overlays[locale]
        missing = [k for k in en_flat if k not in ov]
        if missing:
            raise SystemExit(f"{locale} missing {len(missing)} keys, e.g. {missing[:3]}")
        flat = {k: ov[k] for k in en_flat}
        data = unflatten(flat)
        out = ROOT / f"{locale}.json"
        with out.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        json.load(out.open(encoding="utf-8"))
        errs = validate(en_flat, flat, locale)
        print(f"{locale}.json: {len(flat)} keys, {len(errs)} issues")
        for e in errs[:5]:
            print(f"  ! {e}")


if __name__ == "__main__":
    main()
