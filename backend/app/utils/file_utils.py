import os
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

SAFE_FILENAME_RE = re.compile(r"[^\w.\-]")


def sanitize_filename(filename: str) -> str:
    """Strip unsafe characters and prevent path traversal."""
    name = os.path.basename(filename)  # strip any directory
    name = SAFE_FILENAME_RE.sub("_", name)
    name = name.lstrip(".")
    if not name:
        name = "upload"
    return name[:200]  # limit length


def ensure_dirs(dirs: list):
    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)


def human_readable_size(num_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"
