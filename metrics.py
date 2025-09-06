from typing import Optional, Tuple

import numpy as np
from PIL import Image

# SSIM
from skimage.metrics import structural_similarity as ssim

# LPIPS (optional; requires torch)
try:
    import torch
    import lpips as lpips_lib
    _LPIPS_NET = lpips_lib.LPIPS(net="alex")
    _LPIPS_OK = True
except Exception:
    _LPIPS_NET = None
    _LPIPS_OK = False


def _ensure_same_size(a: Image.Image, b: Image.Image) -> Tuple[Image.Image, Image.Image]:
    if a.size == b.size:
        return a, b
    # Resize b to a's size
    return a, b.resize(a.size, Image.BICUBIC)


def ssim_score(img_a: Image.Image, img_b: Image.Image) -> float:
    """
    Returns SSIM in [0..1]. Images auto-resized to same shape.
    """
    a, b = _ensure_same_size(img_a.convert("RGB"), img_b.convert("RGB"))
    a_np = np.array(a)
    b_np = np.array(b)
    # channel_axis for skimage >= 0.19
    val = ssim(a_np, b_np, channel_axis=2, data_range=255)
    return float(val)


def lpips_distance(img_a: Image.Image, img_b: Image.Image) -> Optional[float]:
    """
    Returns LPIPS distance (lower is more similar). None if lpips/torch unavailable.
    """
    if not _LPIPS_OK:
        return None
    a, b = _ensure_same_size(img_a.convert("RGB"), img_b.convert("RGB"))
    # To torch tensors in [-1,1]
    def to_tensor(pil_img: Image.Image):
        arr = np.asarray(pil_img).astype("float32") / 255.0
        arr = arr.transpose(2, 0, 1)  # CHW
        t = torch.from_numpy(arr)[None, ...]  # NCHW
        return t * 2.0 - 1.0
    with torch.no_grad():
        d = _LPIPS_NET(to_tensor(a), to_tensor(b))
    return float(d.item())