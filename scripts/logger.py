import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Папка для логов
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "app.log"

LOG_FORMAT = (
    "%(asctime)s "
    "[%(levelname)s] "
    "[%(name)s:%(lineno)d] "
    "%(message)s"
)

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logger():
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # 🔹 Очистка, чтобы не было дублей логов
    if root_logger.handlers:
        root_logger.handlers.clear()

    formatter = logging.Formatter(LOG_FORMAT, DATE_FORMAT)

    # ===== Console handler (UTF-8) =====
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Для Windows (Python 3.7+)
    try:
        console_handler.stream.reconfigure(encoding="utf-8")
    except Exception:
        pass

    # ===== File handler (ротация) =====
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
