#!/usr/bin/env python3
"""Generate professional es/ru/vi/id from fr/en using comprehensive phrase maps."""
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

# Protect placeholders and brand during replacement
PH_RE = re.compile(
    r"\{(" + "|".join(sorted(PLACEHOLDERS, key=len, reverse=True)) + r")\}"
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


def load_maps():
    with (ROOT / "_string_maps.json").open(encoding="utf-8") as f:
        return json.load(f)


def apply_map(text: str, mapping: dict) -> str:
    if text in mapping:
        return mapping[text]
    return text


def validate(en_flat, loc_flat):
    errors = []
    if len(en_flat) != len(loc_flat):
        errors.append("count")
    for key, en_val in en_flat.items():
        loc_val = loc_flat.get(key, "")
        if not isinstance(en_val, str):
            continue
        for ph in PLACEHOLDERS:
            if f"{{{ph}}}" in en_val and f"{{{ph}}}" not in str(loc_val):
                errors.append(f"{key}:{{{ph}}}")
        if "Velora" in en_val and "Velora" not in str(loc_val):
            errors.append(f"{key}:Velora")
    return errors


def main():
    en_flat = flatten(json.load(EN_PATH.open(encoding="utf-8")))
    fr_flat = flatten(json.load(FR_PATH.open(encoding="utf-8")))
    maps = load_maps()

    locales = {
        "es": (en_flat, maps["en_es"]),
        "ru": (fr_flat, maps["fr_ru"]),
        "vi": (fr_flat, maps["fr_vi"]),
        "id": (fr_flat, maps["fr_id"]),
    }

    for locale, (src_flat, mapping) in locales.items():
        out_flat = {k: apply_map(src_flat[k], mapping) if isinstance(src_flat[k], str) else src_flat[k] for k in en_flat}
        data = unflatten(out_flat)
        out = ROOT / f"{locale}.json"
        with out.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        errs = validate(en_flat, out_flat)
        unmapped = sum(1 for k in en_flat if isinstance(src_flat[k], str) and src_flat[k] not in mapping)
        print(f"{locale}.json: keys={len(out_flat)} map_size={len(mapping)} unmapped_src={unmapped} errors={len(errs)}")
        for e in errs[:8]:
            print(f"  ! {e}")


if __name__ == "__main__":
    main()
