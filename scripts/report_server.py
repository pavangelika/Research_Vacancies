import json
import logging
import os
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.db import mark_resume_sent


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REPORTS_DIR = Path(os.environ.get("REPORTS_OUTPUT_DIR", str(PROJECT_ROOT / "reports"))).resolve()
HOST = os.environ.get("REPORT_SERVER_HOST", "0.0.0.0")
PORT = int(os.environ.get("REPORT_SERVER_PORT", "8000"))


class ReportHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPORTS_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/vacancies/send-resume":
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not_found"})
            return

        try:
            content_len = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_len = 0
        raw = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "invalid_json"})
            return

        vacancy_id = str(payload.get("vacancy_id") or "").strip()
        if not vacancy_id:
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "vacancy_id_required"})
            return

        try:
            updated = mark_resume_sent(vacancy_id)
        except Exception as exc:
            logger.exception("Failed to mark send_resume for vacancy_id=%s", vacancy_id)
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})
            return

        self._send_json(HTTPStatus.OK, {"ok": True, "updated": bool(updated), "vacancy_id": vacancy_id})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/", ""):
            self.path = "/report.html"
        super().do_GET()


def main():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), ReportHandler)
    logger.info("Report server started at http://%s:%s, serving %s", HOST, PORT, REPORTS_DIR)
    server.serve_forever()


if __name__ == "__main__":
    main()
