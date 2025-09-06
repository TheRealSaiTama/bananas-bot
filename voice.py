import os
import requests


def narrate(text: str) -> bytes:
    key = os.getenv("ELEVENLABS_API_KEY")
    voice = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    if not text or not text.strip():
        text = "Bananas bot response"

    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
        headers={
            "xi-api-key": key,
            "accept": "audio/mpeg",
            "content-type": "application/json",
        },
        json={
            "text": text.strip(),
            "model_id": "eleven_multilingual_v2",
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.content

