import os, re, json, time, base64, hashlib, datetime as dt, pathlib
import requests, praw

STATE_DIR = pathlib.Path(".state"); STATE_DIR.mkdir(exist_ok=True)
SEEN_PATH = STATE_DIR / "seen.json"
USAGE_PATH = STATE_DIR / "usage.json"


def _load_json(p):
    if p.exists():
        try:
            return json.loads(p.read_text())
        except Exception:
            return {}
    return {}


def _save_json(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2))


def create_reddit():
    req = [
        "REDDIT_CLIENT_ID",
        "REDDIT_CLIENT_SECRET",
        "REDDIT_USER_AGENT",
        "REDDIT_USERNAME",
        "REDDIT_PASSWORD",
    ]
    miss = [k for k in req if not os.getenv(k)]
    if miss:
        raise RuntimeError(f"Missing env: {', '.join(miss)}")
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT"),
        username=os.getenv("REDDIT_USERNAME"),
        password=os.getenv("REDDIT_PASSWORD"),
        check_for_async=False,
    )


def _fetch_image(url, max_size=5 * 1024 * 1024):
    ext = url.split("?")[0].split("#")[0].rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png"):
        raise ValueError("Unsupported image type")
    mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png"
    r = requests.get(url, stream=True, timeout=30)
    r.raise_for_status()
    size = int(r.headers.get("content-length", 0))
    if size and size > max_size:
        raise ValueError("Image too large")
    buf, total = bytearray(), 0
    for chunk in r.iter_content(8192):
        if not chunk:
            continue
        total += len(chunk)
        if total > max_size:
            raise ValueError("Image too large")
        buf.extend(chunk)
    return bytes(buf), mime


def _upload_to_github(file_bytes: bytes, ext: str) -> str:
    token = os.getenv("GITHUB_TOKEN")  # token with repo scope for the images repo
    repo = os.getenv("GITHUB_REPO")  # e.g. therealsaitama/kiskax-images
    branch = os.getenv("GITHUB_BRANCH", "main")
    if not token or not repo:
        raise RuntimeError("GITHUB_TOKEN/GITHUB_REPO missing")
    path = f"{dt.datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{hashlib.md5(file_bytes).hexdigest()[:8]}.{ext}"
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    payload = {
        "message": f"auto-upload {path}",
        "content": base64.b64encode(file_bytes).decode("ascii"),
        "branch": branch,
    }
    gh = requests.put(
        url,
        json=payload,
        headers={"Authorization": f"token {token}", "Accept": "application/vnd.github+json"},
        timeout=30,
    )
    gh.raise_for_status()
    return gh.json().get("content", {}).get("download_url") or gh.json().get("content", {}).get("html_url")


def _call_gemini_edit(api_key: str, instruction: str, img_bytes: bytes, mime: str) -> bytes:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key)
    prompt = (
        f"Transform the provided image according to this instruction: {instruction}. "
        "Output only a PNG image; no text in the response; keep resolution similar to input."
    )
    resp = client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[prompt, types.Part.from_bytes(img_bytes, mime_type=mime)],
    )
    for part in resp.candidates[0].content.parts:
        if getattr(part, "inline_data", None):
            return part.inline_data.data
    raise RuntimeError("No image data returned")


def _narrate_optional(text: str):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return None
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "accept": "audio/mpeg",
            "content-type": "application/json",
        },
        json={"text": text, "model_id": "eleven_multilingual_v2"},
        timeout=60,
    )
    r.raise_for_status()
    return r.content


def _extract_instruction(text: str):
    if not text:
        return None
    low = text.lower()
    if "u/bananas" not in low and "@bananas" not in low:
        return None
    m = re.search(r'[\"“](.*?)[\"”]', text)
    if m and m.group(1).strip():
        return m.group(1).strip()[:300]
    tail = re.split(r'(?:u/bananas|@bananas)', text, flags=re.I, maxsplit=1)[-1]
    return re.sub(r"\s+", " ", tail).strip()[:300] or None


def main():
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY missing")
    subreddits = os.getenv("SUBREDDITS", "test")
    max_per_run = int(os.getenv("MAX_PER_RUN", "3"))

    seen = _load_json(SEEN_PATH) or {"ids": []}
    usage = _load_json(USAGE_PATH) or {"day": "", "count": 0}

    # reset daily counter on UTC day switch
    today = dt.datetime.utcnow().strftime("%Y-%m-%d")
    if usage.get("day") != today:
        usage = {"day": today, "count": 0}

    reddit = create_reddit()

    # pull ~200 latest comments once, process unseen ones oldest→newest
    comments = list(reddit.subreddit(subreddits).comments(limit=200))
    comments.reverse()

    processed_now = 0
    for c in comments:
        if processed_now >= max_per_run:
            break
        cid = getattr(c, "id", None)
        body = getattr(c, "body", "") or ""
        if not cid or cid in seen["ids"]:
            continue
        instr = _extract_instruction(body)
        if not instr:
            continue

        # daily budget guard
        max_per_day = int(os.getenv("MAX_CALLS_PER_DAY", "95"))
        if usage["count"] >= max_per_day:
            break

        # find image
        subm = getattr(c, "submission", None)
        url = getattr(subm, "url_overridden_by_dest", None) or getattr(subm, "url", None)
        if not url:
            seen["ids"].append(cid)
            continue
        try:
            img_bytes, mime = _fetch_image(url)
            out_png = _call_gemini_edit(GEMINI_API_KEY, instr or "convert the image to grayscale", img_bytes, mime)
            img_url = _upload_to_github(out_png, "png")
            reply_lines = [
                f"✨ Edit done: {instr or 'grayscale'}",
                f"{img_url}",
                "Made with Gemini 2.5 Flash Image — outputs include SynthID watermark.",
            ]
            mp3 = None
            try:
                if os.getenv("ELEVENLABS_API_KEY"):
                    mp3 = _narrate_optional(f"Edit applied: {instr}")
            except Exception:
                mp3 = None
            if mp3:
                try:
                    aud_url = _upload_to_github(mp3, "mp3")
                    reply_lines.append(f"🔊 Narration: {aud_url}")
                except Exception:
                    pass
            try:
                c.reply("\n\n".join(reply_lines))
            except Exception:
                # ignore reply failures, still count work
                pass
            usage["count"] += 1
            processed_now += 1
        except Exception:
            # swallow individual failures, move on
            pass
        finally:
            seen["ids"].append(cid)  # mark so we don't try next run

    # keep last 5000 ids
    seen["ids"] = seen["ids"][-5000:]
    _save_json(SEEN_PATH, seen)
    _save_json(USAGE_PATH, usage)


if __name__ == "__main__":
    main()

