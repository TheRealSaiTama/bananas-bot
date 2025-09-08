import os
import time
import logging
import sys

import re
import praw
from dotenv import load_dotenv
import storage

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
    if not text:
        return None

    lowered = text.lower()
    m = re.search(r"(@bananas|u/bananas)", lowered)
    if not m:
        return None
    start = m.end()
    tail = text[start:]

    quote_match = re.search(r"[\"'“”](.*?)[\"'“”]", tail)
    if quote_match and quote_match.group(1).strip():
        candidate = quote_match.group(1).strip()
    else:
        candidate = tail.strip(" \t:-—,>\n\r\f\v")

    if not candidate:
        return None
    candidate = re.sub(r"\s+", " ", candidate).strip()
    if not candidate:
        return None
    return candidate[:300]


def stream_and_reply(reddit: praw.Reddit) -> None:
    subreddits = os.getenv("SUBREDDITS", "test")
    max_calls_per_hour = int(os.getenv("MAX_CALLS_PER_HOUR", "10"))
    user_cooldown_sec = int(os.getenv("USER_COOLDOWN_SECONDS", "120"))
    daily_budget_calls = int(os.getenv("DAILY_BUDGET_CALLS", "200"))
    rate_limit_mode = os.getenv("RATE_LIMIT_MODE", "skip").lower()
    rate_limit_message = os.getenv(
        "RATE_LIMIT_MESSAGE",
        "🍌 I'm at capacity right now. Try again in a bit!",
    )
    capacity_reset_msg = "🍌 At capacity for today — capacity resets at PT midnight."
    allowed_users_env = os.getenv("ALLOWED_USERS", "")
    allowed_users = {
        u.strip().lower()
        for u in allowed_users_env.split(",")
        if u.strip()
    }

    window_start = time.time()
    calls_this_hour = 0

    for comment in reddit.subreddit(subreddits).stream.comments(skip_existing=True):
        body = getattr(comment, "body", "")
        print(f"RAW >>>{repr(body)}<<<")
        if "u/bananas" in body.lower() or "@bananas" in body.lower():
            print("MATCH!")
            import requests, base64, tempfile
            try:
                if storage.is_processed(getattr(comment, "id", "")):
                    continue

                now = time.time()
                if now - window_start >= 3600:
                    window_start = now
                    calls_this_hour = 0

                author = getattr(getattr(comment, "author", None), "name", None) or "anonymous"
                if allowed_users and author.lower() not in allowed_users:
                    # Educate and deflect to self-serve
                    try:
                        comment.reply(
                            "🍌 Hey! This instance is limited. Fork & deploy your own: "
                            "https://github.com/TheRealSaiTama/bananas-bot"
                        )
                    except Exception:
                        pass
                    continue
                last_call = storage.get_user_last_call(author)
                if now - last_call < user_cooldown_sec:
                    if rate_limit_mode == "reply":
                        try:
                            comment.reply("🍌 cooldown active — try again soon!")
                        except Exception:
                            pass
                    continue

                # Daily budget (PT). Stop early if out of capacity.
                if daily_budget_calls >= 0:
                    used = storage.get_usage(storage.today_pt_key())
                    if used >= daily_budget_calls:
                        try:
                            comment.reply(capacity_reset_msg + "\nFork & deploy your own: https://github.com/TheRealSaiTama/bananas-bot")
                        except Exception:
                            pass
                        continue

                if max_calls_per_hour >= 0 and calls_this_hour >= max_calls_per_hour:
                    if rate_limit_mode == "reply":
                        try:
                            comment.reply(rate_limit_message)
                        except Exception:
                            pass
                    continue

                storage.set_user_last_call(author, now)
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

                from google import genai
                from google.genai import types
                from io import BytesIO

                client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

                user_instruction = _extract_instruction(body) or "convert the image to grayscale"
                prompt = (
                    "Transform the provided image according to this instruction: "
                    f"{user_instruction}. "
                    "Requirements: output an edited image only; return ONLY a PNG image as inline data; no textual responses; keep resolution similar to the input."
                )

                # pass RAW BYTES, not base64
                img_part = types.Part.from_bytes(img_bytes, mime_type=mime)
                response = client.models.generate_content(
                    model="gemini-2.5-flash-image-preview",
                    contents=[prompt, img_part],
                )

                out_bytes = None
                for part in response.candidates[0].content.parts:
                    if getattr(part, "inline_data", None) is not None:
                        out_bytes = part.inline_data.data
                        break
                else:
                    raise RuntimeError("No image data returned")
                import datetime, hashlib
                def upload_to_github(file_bytes: bytes, ext: str) -> str:
                    token = os.getenv("GITHUB_TOKEN")
                    repo = os.getenv("GITHUB_REPO")
                    branch = os.getenv("GITHUB_BRANCH", "main")
                    path = f"{datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{hashlib.md5(file_bytes).hexdigest()[:8]}.{ext}"
                    url = f"https://api.github.com/repos/{repo}/contents/{path}"
                    payload = {
                        "message": f"auto-upload {path}",
                        "content": base64.b64encode(file_bytes).decode("ascii"),
                        "branch": branch,
                    }
                    last_exc = None
                    for attempt in range(2):
                        try:
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
                            file_url = gh.json().get("content", {}).get("download_url") or gh.json().get("content", {}).get("html_url")
                            if not file_url:
                                raise RuntimeError("GitHub upload did not return a download URL")
                            return file_url
                        except Exception as ex:
                            last_exc = ex
                            time.sleep(1.5)
                    raise RuntimeError(f"GitHub upload failed after retry: {last_exc}")
                
                token = os.getenv("GITHUB_TOKEN")
                repo = os.getenv("GITHUB_REPO")
                branch = os.getenv("GITHUB_BRANCH", "main")

                if not token:
                    raise RuntimeError("GITHUB_TOKEN is not set in environment")
                if not repo or repo.startswith("your-github-username/"):
                    raise RuntimeError("GITHUB_REPO is not set (expected 'owner/repo')")

                # use the helper for the image bytes we got from Gemini
                # Upload image; only after a successful upload do we count usage
                img_url = upload_to_github(out_bytes, "png")

                mp3_url = None
                try:
                    from voice import narrate
                    mp3_bytes = narrate(f"Edit applied: {user_instruction}")
                    mp3_url = upload_to_github(mp3_bytes, "mp3")
                except Exception:
                    mp3_url = None  # TTS is optional; never block image response

                # Increment daily usage on success and mark processed
                storage.increment_usage(storage.today_pt_key(), by=1)
                storage.mark_processed(comment.id)

                footer = "\n\nMade with Gemini 2.5 Flash Image — outputs include SynthID watermark."
                if mp3_url:
                    comment.reply(f"🍌 edited image: {img_url}\n🔊 narrated: {mp3_url}{footer}")
                else:
                    comment.reply(f"🍌 edited image: {img_url}{footer}")
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
