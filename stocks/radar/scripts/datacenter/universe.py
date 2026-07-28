"""
AI data-center universe — loads curated layers from src/data/datacenter-universe.json.

Edit that JSON to add/remove holdings. This module mirrors the original
screener helpers used by fetch-screener.py at build time.
"""

from __future__ import annotations

import json
import os

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_UNIVERSE_PATH = os.path.join(_ROOT, "src", "data", "datacenter-universe.json")

with open(_UNIVERSE_PATH, encoding="utf-8") as f:
    _DATA = json.load(f)

EXPOSURE_LEVELS = _DATA.get("exposureLevels") or ["pure", "high", "moderate", "diversified"]
DATA_OVERRIDES = _DATA.get("dataOverrides") or {}
LAYERS = _DATA["layers"]


def is_excluded(ticker: str) -> bool:
    return bool(DATA_OVERRIDES.get(ticker, {}).get("exclude"))


def market_overrides(ticker: str) -> dict:
    return {k: v for k, v in DATA_OVERRIDES.get(ticker, {}).items() if k != "exclude"}


def exposure_rank(level: str) -> int:
    try:
        return EXPOSURE_LEVELS.index(level)
    except ValueError:
        return len(EXPOSURE_LEVELS)


def all_tickers() -> list[str]:
    seen: list[str] = []
    for layer in LAYERS:
        for h in layer["holdings"]:
            if h["ticker"] in seen or is_excluded(h["ticker"]):
                continue
            seen.append(h["ticker"])
    return seen


def layer_index() -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for layer in LAYERS:
        for h in layer["holdings"]:
            idx.setdefault(h["ticker"], []).append(layer["id"])
    return idx
