from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app


client = TestClient(app)


def test_local_report_origin_is_allowed_for_api_requests():
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:9000"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:9000"
