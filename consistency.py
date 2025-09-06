import os
import hashlib
from typing import Optional, Tuple

import numpy as np
from PIL import Image

# InsightFace
# Downloads models on first use into ~/.insightface by default
from insightface.app import FaceAnalysis


_APP: Optional[FaceAnalysis] = None
_CACHE_DIR = os.getenv("CACHE_DIR", ".cache")
os.makedirs(_CACHE_DIR, exist_ok=True)


def _get_app() -> FaceAnalysis:
    global _APP
    if _APP is None:
        _APP = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        _APP.prepare(ctx_id=0, det_size=(640, 640))
    return _APP


def _pil_to_bgr(np_img: np.ndarray) -> np.ndarray:
    # PIL gives RGB; InsightFace expects BGR
    return np_img[..., ::-1].copy()


def _load_array(img) -> np.ndarray:
    if isinstance(img, Image.Image):
        arr = np.array(img.convert("RGB"))
    elif isinstance(img, np.ndarray):
        if img.ndim == 2:
            arr = np.stack([img, img, img], axis=-1)
        else:
            arr = img[..., :3]
    else:
        raise TypeError("img must be PIL.Image or numpy array")
    return arr


def _largest_face(faces) -> Optional[int]:
    if not faces:
        return None
    areas = []
    for i, f in enumerate(faces):
        x1, y1, x2, y2 = f.bbox.astype(int)
        areas.append(((x2 - x1) * (y2 - y1), i))
    areas.sort(reverse=True)
    return areas[0][1]


def _embed(img) -> Optional[np.ndarray]:
    app = _get_app()
    bgr = _pil_to_bgr(_load_array(img))
    faces = app.get(bgr)
    idx = _largest_face(faces)
    if idx is None:
        return None
    face = faces[idx]
    emb = getattr(face, "normed_embedding", None)
    if emb is None:
        # Some builds have 'embedding' unnormalized; normalize if needed
        emb = getattr(face, "embedding", None)
        if emb is None:
            return None
        emb = np.asarray(emb, dtype=np.float32)
        n = np.linalg.norm(emb) + 1e-8
        emb = emb / n
    return np.asarray(emb, dtype=np.float32)


def _hash_image(img: Image.Image) -> str:
    with Image.new("RGB", img.size) as _:
        pass
    # Stable hash of bytes
    buf = img.convert("RGB").tobytes()
    return hashlib.sha1(buf).hexdigest()


def score_identity(reference_img, candidate_img) -> Optional[float]:
    """
    Returns cosine similarity [0..1] between the largest face in reference and candidate.
    None if no face detected in either image.
    """
    # Tiny on-disk cache per-image to avoid recomputing embeddings repeatedly
    def cached_embed(pil_img: Image.Image) -> Optional[np.ndarray]:
        h = _hash_image(pil_img)
        path = os.path.join(_CACHE_DIR, f"arcface_{h}.npy")
        if os.path.exists(path):
            try:
                return np.load(path)
            except Exception:
                pass
        emb = _embed(pil_img)
        if emb is not None:
            try:
                np.save(path, emb)
            except Exception:
                pass
        return emb

    if not isinstance(reference_img, Image.Image):
        reference_img = Image.fromarray(_load_array(reference_img))
    if not isinstance(candidate_img, Image.Image):
        candidate_img = Image.fromarray(_load_array(candidate_img))

    e1 = cached_embed(reference_img)
    e2 = cached_embed(candidate_img)
    if e1 is None or e2 is None:
        return None
    # embeddings are L2-normalized; cosine is dot product clipped to [0,1]
    sim = float(np.dot(e1, e2))
    # Numerical safety
    sim = max(-1.0, min(1.0, sim))
    # Map [-1,1] to [0,1] if needed, but ArcFace cosine should be ≥0 for similar faces
    return (sim + 1.0) / 2.0 if sim < 0 else sim