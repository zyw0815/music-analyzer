import os

from app.config import TMP_DIR

NUMBA_CACHE_DIR = TMP_DIR / "numba_cache"
NUMBA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("NUMBA_CACHE_DIR", str(NUMBA_CACHE_DIR))
