import os
import io
import json
import hashlib
import time
from typing import List, Dict, Tuple, Optional

import requests
from PIL import Image

from gemini_client import edit_or_blend, comic_panels
from consistency import score_identity
from metrics import ssim_score, lpips_distance


OUT_DIR = "out"
os.makedirs(OUT_DIR, exist_ok=True)


def _fetch(url: str) -> Tuple[bytes, str]:
    """Fetch bytes from a URL with sane headers to avoid 403s and infer MIME.

    Many CDNs (including Wikimedia) block requests without a browser-like
    User-Agent. We set headers and retry once with a Referer if we see a 403.
    """
    headers = {
        "User-Agent": os.getenv(
            "HTTP_USER_AGENT",
            f"bananabot/1.0 (+https://example.com) requests/{requests.__version__}",
        ),
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    r = requests.get(url, headers=headers, timeout=30)
    if r.status_code == 403 and "upload.wikimedia.org" in url:
        # Some Wikimedia assets may require a Referer; retry once.
        headers_with_ref = {**headers, "Referer": "https://en.wikipedia.org/"}
        r = requests.get(url, headers=headers_with_ref, timeout=30)
    r.raise_for_status()
    data = r.content

    # Infer MIME from extension
    ext = url.split("?")[0].split("#")[0].rsplit(".", 1)[-1].lower()
    if ext in ("jpg", "jpeg"):
        mime = "image/jpeg"
    elif ext == "png":
        mime = "image/png"
    elif ext == "webp":
        mime = "image/webp"
    elif ext == "svg":
        mime = "image/svg+xml"
    else:
        # Default to binary stream of PNG if unknown
        mime = "application/octet-stream"
    return data, mime


def _save_bytes(name: str, data: bytes):
    path = os.path.join(OUT_DIR, name)
    with open(path, "wb") as f:
        f.write(data)
    return path


def _pil_from_bytes(b: bytes) -> Image.Image:
    return Image.open(io.BytesIO(b)).convert("RGB")


def narr_summary_for(mode: str, payload: Dict) -> str:
    if mode == "edit":
        return f"Edit: {payload['instruction']}"
    if mode == "blend":
        return f"Blend: {payload['instruction']}"
    if mode == "comic":
        return f"Comic: {' — '.join(payload['panels'])}"
    return "Result"


def narrate_optional(text: str) -> Optional[bytes]:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return None
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": api_key, "accept": "audio/mpeg", "content-type": "application/json"},
        json={"text": text, "model_id": "eleven_multilingual_v2"},
        timeout=60,
    )
    r.raise_for_status()
    return r.content


def run():
    """
    Runs 6 scenarios (2 edit, 2 blend, 2 comic) and prints metrics.
    Keeps total Gemini calls <= 20 (actual ~12).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    assert api_key, "Set GEMINI_API_KEY in your .env"

    # Images (override with env vars to use your own)
    BASE1 = os.getenv("BASE1_URL", "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png")
    BASE2 = os.getenv("BASE2_URL", "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_2010-10-02_001.jpg")
    BLEND_REF1 = os.getenv("BLEND_REF1_URL", "https://upload.wikimedia.org/wikipedia/commons/3/3a/Checkerboard_pattern.svg")
    BLEND_REF2 = os.getenv("BLEND_REF2_URL", "https://upload.wikimedia.org/wikipedia/commons/0/02/Trophy_cup_icon.svg")
    PERSONA1 = os.getenv("PERSONA1_URL", "https://upload.wikimedia.org/wikipedia/commons/1/12/User_icon_2.svg")
    PERSONA2 = os.getenv("PERSONA2_URL", "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png")

    total_calls = 0
    results: List[Dict] = []

    # Prepare assets
    base1_b, base1_m = _fetch(BASE1)
    base2_b, base2_m = _fetch(BASE2)
    blend1_b, blend1_m = _fetch(BLEND_REF1)
    blend2_b, blend2_m = _fetch(BLEND_REF2)
    persona1_b, persona1_m = _fetch(PERSONA1)
    persona2_b, persona2_m = _fetch(PERSONA2)

    # Scenarios
    scenarios: List[Dict] = [
        # 2x edit
        {"mode": "edit", "name": "edit1", "base": (base1_b, base1_m), "instruction": "make it night with neon rain; keep subject unchanged"},
        {"mode": "edit", "name": "edit2", "base": (base2_b, base2_m), "instruction": "increase contrast slightly and turn the jacket cobalt blue; preserve edges"},
        # 2x blend
        {"mode": "blend", "name": "blend1", "base": (base2_b, base2_m), "blend": (blend1_b, blend1_m), "instruction": "apply this checkerboard pattern subtly to the central clothing; match lighting"},
        {"mode": "blend", "name": "blend2", "base": (base2_b, base2_m), "blend": (blend2_b, blend2_m), "instruction": "insert the trophy in the subject’s right hand; match perspective and cast a soft shadow"},
        # 2x comic (4 panels each => 8 calls)
        {"mode": "comic", "name": "comic1", "persona": (persona1_b, persona1_m), "style": "manga", "panels": [
            "arrives late to the lab with coffee",
            "codes like a beast through the night",
            "panic at submit, fixes last bug",
            "wins the hackathon and celebrates",
        ]},
        {"mode": "comic", "name": "comic2", "persona": (persona2_b, persona2_m), "style": "cinematic", "panels": [
            "reviews the brief with determination",
            "blends reality with imagination on screen",
            "demo day jitters but calm focus",
            "standing ovation, product shipped",
        ]},
    ]

    print("Running 6 scenarios...")
    for sc in scenarios:
        mode = sc["mode"]
        name = sc["name"]
        print(f"\n=== {name.upper()} ({mode}) ===")
        if mode == "edit":
            base_b, base_m = sc["base"]
            instr = sc["instruction"]
            out_png = edit_or_blend(api_key, instr, base_b, base_m)
            total_calls += 1
            png_path = _save_bytes(f"{name}.png", out_png)
            print(f"saved: {png_path}")
            # metrics
            before = _pil_from_bytes(base_b)
            after = _pil_from_bytes(out_png)
            ssim_val = ssim_score(before, after)
            lpips_val = lpips_distance(before, after)
            print(f"SSIM(before/after): {ssim_val:.4f} | LPIPS: {lpips_val if lpips_val is not None else 'n/a'}")
            # narration (optional)
            summary = narr_summary_for("edit", sc)
            if (mp3 := narrate_optional(summary)):
                mp3_path = _save_bytes(f"{name}.mp3", mp3)
                print(f"narration: {mp3_path}")

        elif mode == "blend":
            base_b, base_m = sc["base"]
            blend_b, blend_m = sc["blend"]
            instr = sc["instruction"]
            out_png = edit_or_blend(api_key, instr, base_b, base_m, blend_b, blend_m)
            total_calls += 1
            png_path = _save_bytes(f"{name}.png", out_png)
            print(f"saved: {png_path}")
            # metrics vs base
            before = _pil_from_bytes(base_b)
            after = _pil_from_bytes(out_png)
            ssim_val = ssim_score(before, after)
            lpips_val = lpips_distance(before, after)
            print(f"SSIM(before/after): {ssim_val:.4f} | LPIPS: {lpips_val if lpips_val is not None else 'n/a'}")
            # narration (optional)
            summary = narr_summary_for("blend", sc)
            if (mp3 := narrate_optional(summary)):
                mp3_path = _save_bytes(f"{name}.mp3", mp3)
                print(f"narration: {mp3_path}")

        elif mode == "comic":
            persona_b, persona_m = sc["persona"]
            style = sc["style"]
            panels: List[str] = sc["panels"]
            outs = comic_panels(api_key, persona_b, persona_m, style, panels)
            total_calls += len(outs)
            # Save each panel
            paths = []
            for i, b in enumerate(outs, start=1):
                p = _save_bytes(f"{name}_p{i}.png", b)
                paths.append(p)
            print("panels:", ", ".join(paths))
            # Identity scores vs persona
            persona_img = _pil_from_bytes(persona_b)
            scores = []
            for i, b in enumerate(outs, start=1):
                s = score_identity(persona_img, _pil_from_bytes(b))
                scores.append(None if s is None else round(float(s), 4))
            # Aggregate (ignore None)
            valid = [s for s in scores if s is not None]
            agg = round(sum(valid) / len(valid), 4) if valid else None
            print(f"Identity match scores (vs persona): {scores} | aggregate: {agg}")
            # narration (optional)
            summary = narr_summary_for("comic", sc)
            if (mp3 := narrate_optional(summary)):
                mp3_path = _save_bytes(f"{name}.mp3", mp3)
                print(f"narration: {mp3_path}")

        else:
            print("Unknown mode; skipping")

        # gentle pacing
        time.sleep(1.0)

    print(f"\nTotal Gemini calls: {total_calls} (<= 20 expected)")
    print("\nTransparency: Images created/edited with Gemini 2.5 Flash Image; outputs carry SynthID watermark. See: https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/")

if __name__ == "__main__":
    run()