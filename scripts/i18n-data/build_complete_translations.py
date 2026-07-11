#!/usr/bin/env python3
"""Build _complete_translations.json from part1 + ui_terms, then emit locale files."""
import json
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path

ROOT = Path(__file__).parent
EN_PATH = ROOT / "en.json"
MAP_PATH = ROOT / "_complete_translations.json"


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


def load_module(name, path):
    return SourceFileLoader(name, str(path)).load_module()


def main():
    p1 = load_module("p1", ROOT / "tdata_part1.py")
    terms = load_module("terms", ROOT / "ui_terms.py")
    phrases = load_module("phrases", ROOT / "ui_phrases.py")

    all_data = {}
    all_data.update(p1.DATA)
    all_data.update(terms.DATA)
    all_data.update(phrases.DATA)

    en_strings = sorted({v for v in flatten(json.load(EN_PATH.open(encoding="utf-8"))).values() if isinstance(v, str)})
    missing = [s for s in en_strings if s not in all_data]
    if missing:
        print(f"ERROR: {len(missing)} strings still untranslated", file=sys.stderr)
        for s in missing[:20]:
            print(f"  - {s!r}", file=sys.stderr)
        sys.exit(1)

    maps = {loc: {} for loc in ("es", "ru", "vi", "id")}
    for en, tup in all_data.items():
        for i, loc in enumerate(("es", "ru", "vi", "id")):
            maps[loc][en] = tup[i]

    with MAP_PATH.open("w", encoding="utf-8") as f:
        json.dump(maps, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Wrote {MAP_PATH} ({len(all_data)} strings x 4 locales)")

    # emit locale json files
    emit = load_module("emit", ROOT / "emit_locales.py")
    emit.main()


if __name__ == "__main__":
    main()
