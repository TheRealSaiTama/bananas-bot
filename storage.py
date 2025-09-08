import json
import os
import time
from typing import Any, Dict
from zoneinfo import ZoneInfo

STATE_PATH = os.path.join(os.getcwd(), ".config", "bananas_state.json")


def _ensure_dir(path: str) -> None:
    d = os.path.dirname(path)
    if d and not os.path.isdir(d):
        os.makedirs(d, exist_ok=True)


def _load() -> Dict[str, Any]:
    try:
        with open(STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"processed": [], "usage": {}, "user_last_call": {}}
    except Exception:
        # Corrupt file; reset
        return {"processed": [], "usage": {}, "user_last_call": {}}


def _save(state: Dict[str, Any]) -> None:
    _ensure_dir(STATE_PATH)
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f)
    os.replace(tmp, STATE_PATH)


def is_processed(comment_id: str) -> bool:
    state = _load()
    processed = state.get("processed", [])
    return comment_id in processed


def mark_processed(comment_id: str) -> None:
    state = _load()
    processed = state.setdefault("processed", [])
    # keep a cap to avoid unbounded growth
    if comment_id not in processed:
        processed.append(comment_id)
        if len(processed) > 5000:
            processed[:] = processed[-3000:]
    _save(state)


def today_pt_key() -> str:
    tz = ZoneInfo("America/Los_Angeles")
    t = time.time()
    dt = time.strftime("%Y-%m-%d", time.localtime(t))
    # Using zoneinfo for exact date in PT
    from datetime import datetime
    d = datetime.fromtimestamp(t, tz)
    return d.strftime("%Y-%m-%d")


def get_usage(day_key: str | None = None) -> int:
    if not day_key:
        day_key = today_pt_key()
    state = _load()
    usage = state.get("usage", {})
    return int(usage.get(day_key, 0))


def increment_usage(day_key: str | None = None, by: int = 1) -> int:
    if not day_key:
        day_key = today_pt_key()
    state = _load()
    usage = state.setdefault("usage", {})
    cur = int(usage.get(day_key, 0))
    usage[day_key] = cur + by
    _save(state)
    return usage[day_key]


def get_user_last_call(username: str) -> float:
    state = _load()
    u = state.get("user_last_call", {})
    return float(u.get(username.lower(), 0.0))


def set_user_last_call(username: str, ts: float | None = None) -> None:
    if ts is None:
        ts = time.time()
    state = _load()
    u = state.setdefault("user_last_call", {})
    u[username.lower()] = float(ts)
    # cap size
    if len(u) > 5000:
        # naive trim; keep latest approx entries by converting to list and last N
        items = list(u.items())[-3000:]
        state["user_last_call"] = dict(items)
    _save(state)

