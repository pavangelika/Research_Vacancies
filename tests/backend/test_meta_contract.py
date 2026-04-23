from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app


client = TestClient(app)


def test_roles_endpoint_declared_in_openapi():
    payload = client.get("/openapi.json").json()
    assert "/api/v1/meta/roles" in payload["paths"]
