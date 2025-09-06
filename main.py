import os
import time
import logging
import sys

import re
import praw
from dotenv import load_dotenv

load_dotenv()


def create_reddit_client() -> praw.Reddit | None:
    required_vars = [
        "REDDIT_CLIENT_ID",
        "REDDIT_CLIENT_SECRET",
        "REDDIT_USER_AGENT",
        "REDDIT_USERNAME",
        "REDDIT_PASSWORD",
    ]
    missing = [name for name in required_vars if not os.getenv(name)]
    if missing:
        logging.error("Missing environment variables: %s", ", ".join(missing))
        return None

    try:
        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent=os.getenv("REDDIT_USER_AGENT"),
            username=os.getenv("REDDIT_USERNAME"),
            password=os.getenv("REDDIT_PASSWORD"),
            check_for_async=False,
        )
        return reddit
    except Exception:
        logging.exception("Failed to initialize Reddit client")
        return None


def _extract_instruction(text: str) -> str | None:
    """Extract user instruction following a @bananas or u/bananas mention.

    Heuristics:
    - Prefer the first quoted segment after the mention ("..." or '...').
    - Otherwise, take the remainder of the line after the mention.
    - Return None if nothing meaningful is found.
    """
    if not text:
        return None

    lowered = text.lower()
    # Find first mention index
    m = re.search(r"(@bananas|u/bananas)", lowered)
    if not m:
        return None
    start = m.end()
    tail = text[start:]

    # Try to find a quoted instruction after the mention
    quote_match = re.search(r"[\"'“”](.*?)[\"'“”]", tail)
    if quote_match and quote_match.group(1).strip():
        candidate = quote_match.group(1).strip()
    else:
        candidate = tail.strip(" \t:-—,>\n\r\f\v")

    # Sanitize and bound length
    if not candidate:
        return None
    candidate = re.sub(r"\s+", " ", candidate).strip()
    if not candidate:
        return None
    return candidate[:300]


def stream_and_reply(reddit: praw.Reddit) -> None:
    # Config: scope and guardrails
    subreddits = os.getenv("SUBREDDITS", "test")  # e.g. "test+pics+funny"
    max_calls_per_hour = int(os.getenv("MAX_CALLS_PER_HOUR", "10"))
    user_cooldown_sec = int(os.getenv("USER_COOLDOWN_SECONDS", "120"))
    rate_limit_mode = os.getenv("RATE_LIMIT_MODE", "skip").lower()  # skip|reply
    rate_limit_message = os.getenv(
        "RATE_LIMIT_MESSAGE",
        "🍌 I'm at capacity right now. Try again in a bit!",
    )
    # Optional allowlist (comma-separated reddit usernames). If set, only these users can trigger.
    allowed_users_env = os.getenv("ALLOWED_USERS", "")
    allowed_users = {
        u.strip().lower()
        for u in allowed_users_env.split(",")
        if u.strip()
    }

    # Tracking
    processed_comment_ids: set[str] = set()
    user_last_call: dict[str, float] = {}
    window_start = time.time()
    calls_this_hour = 0

    for comment in reddit.subreddit(subreddits).stream.comments(skip_existing=True):
        body = getattr(comment, "body", "")
        print(f"RAW >>>{repr(body)}<<<")          # exact bytes
        if "u/bananas" in body.lower() or "@bananas" in body.lower():           # simple test
            print("MATCH!")
            import requests, base64, tempfile  # noqa: F401
            try:
                # De-dupe
                if getattr(comment, "id", None) in processed_comment_ids:
                    continue
                processed_comment_ids.add(comment.id)

                # Reset hourly window
                now = time.time()
                if now - window_start >= 3600:
                    window_start = now
                    calls_this_hour = 0

                # Per-user cooldown and allowlist
                author = getattr(getattr(comment, "author", None), "name", None) or "anonymous"
                if allowed_users and author.lower() not in allowed_users:
                    continue
                last_call = user_last_call.get(author, 0)
                if now - last_call < user_cooldown_sec:
                    if rate_limit_mode == "reply":
                        try:
                            comment.reply("🍌 cooldown active — try again soon!")
                        except Exception:
                            pass
                    continue

                # Global hourly cap
                if max_calls_per_hour >= 0 and calls_this_hour >= max_calls_per_hour:
                    if rate_limit_mode == "reply":
                        try:
                            comment.reply(rate_limit_message)
                        except Exception:
                            pass
                    continue

                # Update trackers before heavy work
                user_last_call[author] = now
                calls_this_hour += 1

                url = getattr(getattr(comment, "submission", None), "url_overridden_by_dest", None)
                if not url:
                    raise ValueError("No image URL found")
                ext = url.split("?")[0].split("#")[0].rsplit(".", 1)[-1].lower()
                if ext not in ("jpg", "jpeg", "png"):
                    raise ValueError("Unsupported image type")
                mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png"

                MAX_SIZE = 5 * 1024 * 1024
                r = requests.get(url, stream=True, timeout=30)
                r.raise_for_status()
                cl = r.headers.get("Content-Length") or r.headers.get("content-length")
                if cl and int(cl) > MAX_SIZE:
                    raise ValueError("Image too large")
                chunks, total = [], 0
                for chunk in r.iter_content(8192):
                    if not chunk:
                        continue
                    total += len(chunk)
                    if total > MAX_SIZE:
                        raise ValueError("Image too large")
                    chunks.append(chunk)
                img_bytes = b"".join(chunks)

                b64_in = base64.b64encode(img_bytes).decode("ascii")
                from google import genai
                from io import BytesIO

                client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

                # Determine transformation instruction from the comment text
                user_instruction = _extract_instruction(body) or "convert the image to grayscale"
                prompt = (
                    "Transform the provided image according to this instruction: "
                    f"{user_instruction}. "
                    "Requirements: output an edited image only; return ONLY a PNG image as inline data; no textual responses; keep resolution similar to the input."
                )

                response = client.models.generate_content(
                    model="gemini-2.5-flash-image-preview",
                    contents=[prompt, {"inline_data": {"mime_type": mime, "data": b64_in}}],
                )

                # Extract bytes
                for part in response.candidates[0].content.parts:
                    if part.inline_data:          # image part
                        b64_png = base64.b64encode(part.inline_data.data).decode("ascii")
                        break
                else:                           # safety fallback
                    raise RuntimeError("No image data returned")
                # Upload to GitHub via Contents API
                import datetime, hashlib
                token = os.getenv("GITHUB_TOKEN")
                repo = os.getenv("GITHUB_REPO")  # format: owner/repo, e.g. therealsaitama/kiskax-images
                branch = os.getenv("GITHUB_BRANCH", "main")

                if not token:
                    raise RuntimeError("GITHUB_TOKEN is not set in environment")
                if not repo or repo.startswith("your-github-username/"):
                    raise RuntimeError("GITHUB_REPO is not set (expected 'owner/repo')")

                path = f"{datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{hashlib.md5(b64_png.encode()).hexdigest()[:8]}.png"
                url = f"https://api.github.com/repos/{repo}/contents/{path}"
                payload = {
                    "message": f"auto-upload {path}",
                    "content": b64_png,
                    "branch": branch,
                }
                gh = requests.put(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"token {token}",
                        "Accept": "application/vnd.github+json",
                    },
                    timeout=30,
                )
                gh.raise_for_status()
                img_url = gh.json().get("content", {}).get("download_url") or gh.json().get("content", {}).get("html_url")
                if not img_url:
                    raise RuntimeError("GitHub upload did not return a download URL")
                comment.reply(f"🍌 edited: {img_url}")
            except Exception as e:
                logging.exception("Image pipeline failed: %s", e)
            time.sleep(6)
        else:
            print("no match")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        stream=sys.stdout,
        force=True,
    )

    while True:
        reddit = create_reddit_client()
        if reddit is None:
            time.sleep(15)
            continue
        try:
            stream_and_reply(reddit)
        except KeyboardInterrupt:
            logging.info("Interrupted by user; exiting.")
            break
        except Exception:
            logging.exception("Unhandled error; reinitializing client in 10 seconds")
            time.sleep(10)


if __name__ == "__main__":
    main()
