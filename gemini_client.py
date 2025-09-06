import base64
from typing import List, Optional

from google import genai
from google.genai import types


MODEL = "gemini-2.5-flash-image-preview"


def _ensure_client(api_key: str) -> genai.Client:
    return genai.Client(api_key=api_key)


def edit_or_blend(
    api_key: str,
    instruction: str,
    base_img_bytes: bytes,
    base_mime: str,
    blend_img_bytes: Optional[bytes] = None,
    blend_mime: Optional[str] = None,
) -> bytes:
    """
    Perform a single-image edit (if blend_img_bytes is None) or a two-image fusion (blend).
    Returns PNG bytes.
    """
    client = _ensure_client(api_key)
    parts = []
    if blend_img_bytes:
        prompt = (
            f"Transform the base image according to this instruction: {instruction}. "
            "Use the second image as a style/texture/object reference to blend or fuse realistically. "
            "Preserve lighting, perspective, and subject integrity. "
            "Output only a PNG image; no text in the response; keep resolution similar to input."
        )
        parts = [
            prompt,
            types.Part.from_bytes(base_img_bytes, mime_type=base_mime),
            types.Part.from_bytes(blend_img_bytes, mime_type=(blend_mime or base_mime)),
        ]
    else:
        prompt = (
            f"Transform the provided image according to this instruction: {instruction}. "
            "Output only a PNG image; no text in the response; keep resolution similar to input; "
            "keep composition unless explicitly requested to change it."
        )
        parts = [prompt, types.Part.from_bytes(base_img_bytes, mime_type=base_mime)]

    resp = client.models.generate_content(model=MODEL, contents=parts)
    for p in resp.candidates[0].content.parts:
        if getattr(p, "inline_data", None):
            return p.inline_data.data
    raise RuntimeError("No image returned by model")


def comic_panels(
    api_key: str,
    persona_img_bytes: bytes,
    persona_mime: str,
    style: str,
    panel_texts: List[str],
) -> List[bytes]:
    """
    Generate 4 panels using the same persona (consistent identity).
    Returns a list of 4 PNG bytes.
    """
    client = _ensure_client(api_key)
    ref_part = types.Part.from_bytes(persona_img_bytes, mime_type=persona_mime)

    outputs: List[bytes] = []
    for text in panel_texts:
        prompt = (
            f"Using the SAME PERSON as the reference, generate a comic panel in {style} where they: {text}. "
            "Keep face shape, eyes, hair, and skin consistent with the reference across panels. "
            "Stable clothing unless explicitly changed. Output only a PNG image; no text."
        )
        resp = client.models.generate_content(model=MODEL, contents=[prompt, ref_part])
        got = None
        for p in resp.candidates[0].content.parts:
            if getattr(p, "inline_data", None):
                got = p.inline_data.data
                break
        if not got:
            raise RuntimeError("No image returned for a comic panel")
        outputs.append(got)
    return outputs