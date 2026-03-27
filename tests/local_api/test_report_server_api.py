import json
import shutil
import sys
import threading
import uuid
from pathlib import Path

import allure
import pytest
import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts import report_server


LOCAL_API_PARENT_SUITE = "API. Р Р°Р·РґРµР»: Local API"
LOCAL_API_SUITE = "Р Р°Р·РґРµР»: Р’Р°РєР°РЅСЃРёРё"
LOCAL_API_OWNER = "Pavangelika"
LOCAL_API_DOC_LINK = "scripts/report_server.py"


@pytest.fixture
def report_server_app(monkeypatch):
    state = {
        "mark_result": True,
        "responses_items": [{"id": "100", "name": "Python Developer", "send_resume": True}],
        "details_item": {"id": "100", "hr_name": "QA Lead", "result": "interview"},
        "save_result": {"ok": True, "updated": True, "requires_overwrite": False},
    }

    temp_root = PROJECT_ROOT / ".pytest_tmp" / f"report_server_{uuid.uuid4().hex}"
    temp_root.mkdir(parents=True, exist_ok=True)
    (temp_root / "report.html").write_text("<html><body>report</body></html>", encoding="utf-8")

    monkeypatch.setattr(report_server, "REPORTS_DIR", temp_root)
    monkeypatch.setattr(report_server, "mark_resume_sent", lambda vacancy_id: state["mark_result"])
    monkeypatch.setattr(report_server, "get_sent_resume_vacancies", lambda: state["responses_items"])
    monkeypatch.setattr(report_server, "get_vacancy_details", lambda vacancy_id: state["details_item"])
    monkeypatch.setattr(
        report_server,
        "save_vacancy_details",
        lambda vacancy_id, fields, force_overwrite: state["save_result"],
    )

    server = report_server.ThreadingHTTPServer(("127.0.0.1", 0), report_server.ReportHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        yield {"base_url": f"http://127.0.0.1:{server.server_port}", "state": state}
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
        shutil.rmtree(temp_root, ignore_errors=True)


@pytest.fixture
def http_session():
    with requests.Session() as session:
        yield session


def attach_request_info(method, url, payload=None, params=None):
    request_info = {
        "method": method,
        "url": url,
        "params": params,
        "payload": payload,
    }
    allure.attach(
        body=json.dumps(request_info, indent=2, ensure_ascii=False),
        name="Request",
        attachment_type=allure.attachment_type.JSON,
    )


def attach_json_payload(name, payload):
    allure.attach(
        body=json.dumps(payload, indent=2, ensure_ascii=False),
        name=name,
        attachment_type=allure.attachment_type.JSON,
    )


def attach_local_api_response(response):
    allure.attach(
        body=response.text,
        name="Response",
        attachment_type=allure.attachment_type.JSON,
    )


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: GET /api/vacancies/responses")
@allure.story("Р”С‹РјРѕРІРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "responses")
@allure.testcase("LAPI-001")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° РІР°РєР°РЅСЃРёР№ СЃ РѕС‚РїСЂР°РІР»РµРЅРЅС‹Рј СЂРµР·СЋРјРµ")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_responses_returns_items(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° СѓСЃРїРµС€РЅРѕРіРѕ РѕС‚РІРµС‚Р° СЂСѓС‡РєРё GET /api/vacancies/responses."""
    url = f"{report_server_app['base_url']}/api/vacancies/responses"

    with allure.step("#1 РћС‚РїСЂР°РІРёС‚СЊ GET Р·Р°РїСЂРѕСЃ Рє /api/vacancies/responses"):
        attach_request_info("GET", url)
        response = http_session.get(url, timeout=5)
        attach_local_api_response(response)

    with allure.step("#2 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 200"):
        assert response.status_code == 200

    with allure.step("#3 РџСЂРѕРІРµСЂРёС‚СЊ СЃС‚СЂСѓРєС‚СѓСЂСѓ Рё СЃРѕРґРµСЂР¶РёРјРѕРµ РѕС‚РІРµС‚Р°"):
        assert response.json() == {"ok": True, "items": report_server_app["state"]["responses_items"]}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: GET /api/vacancies/details")
@allure.story("РќРµРіР°С‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "details")
@allure.testcase("LAPI-002")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Р—Р°РїСЂРѕСЃ РґРµС‚Р°Р»РµР№ РІР°РєР°РЅСЃРёРё Р±РµР· vacancy_id")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_details_requires_vacancy_id(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° РѕС€РёР±РєРё 400, РµСЃР»Рё vacancy_id РЅРµ РїРµСЂРµРґР°РЅ."""
    url = f"{report_server_app['base_url']}/api/vacancies/details"

    with allure.step("#1 РћС‚РїСЂР°РІРёС‚СЊ GET Р·Р°РїСЂРѕСЃ Рє /api/vacancies/details Р±РµР· vacancy_id"):
        attach_request_info("GET", url)
        response = http_session.get(url, timeout=5)
        attach_local_api_response(response)

    with allure.step("#2 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 400"):
        assert response.status_code == 400

    with allure.step("#3 РџСЂРѕРІРµСЂРёС‚СЊ С‚РµРєСЃС‚ РѕС€РёР±РєРё vacancy_id_required"):
        assert response.json() == {"ok": False, "error": "vacancy_id_required"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: GET /api/vacancies/details")
@allure.story("РџРѕР·РёС‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "details")
@allure.testcase("LAPI-003")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("РџРѕР»СѓС‡РµРЅРёРµ РґРµС‚Р°Р»РµР№ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ РІР°РєР°РЅСЃРёРё")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_details_returns_item(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° СѓСЃРїРµС€РЅРѕРіРѕ РѕС‚РІРµС‚Р° 200 РґР»СЏ GET /api/vacancies/details."""
    url = f"{report_server_app['base_url']}/api/vacancies/details"
    params = {"vacancy_id": "100"}

    with allure.step("#1 РџРѕРґРіРѕС‚РѕРІРёС‚СЊ mock details_item РґР»СЏ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ РІР°РєР°РЅСЃРёРё"):
        attach_json_payload("Mock Details Item", report_server_app["state"]["details_item"])

    with allure.step("#2 РћС‚РїСЂР°РІРёС‚СЊ GET Р·Р°РїСЂРѕСЃ СЃ РІР°Р»РёРґРЅС‹Рј vacancy_id"):
        attach_request_info("GET", url, params=params)
        response = http_session.get(url, params=params, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 200"):
        assert response.status_code == 200

    with allure.step("#4 РџСЂРѕРІРµСЂРёС‚СЊ, С‡С‚Рѕ РІ РѕС‚РІРµС‚Рµ РІРѕР·РІСЂР°С‰Р°РµС‚СЃСЏ item"):
        assert response.json() == {
            "ok": True,
            "item": report_server_app["state"]["details_item"],
        }


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: GET /api/vacancies/details")
@allure.story("РќРµРіР°С‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "details")
@allure.testcase("LAPI-004")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Р—Р°РїСЂРѕСЃ РґРµС‚Р°Р»РµР№ РЅРµРёР·РІРµСЃС‚РЅРѕР№ РІР°РєР°РЅСЃРёРё")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_details_returns_not_found(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° РѕС€РёР±РєРё 404, РµСЃР»Рё РІР°РєР°РЅСЃРёСЏ РЅРµ РЅР°Р№РґРµРЅР°."""
    report_server_app["state"]["details_item"] = None
    url = f"{report_server_app['base_url']}/api/vacancies/details"
    params = {"vacancy_id": "404"}

    with allure.step("#1 РџРѕРґРіРѕС‚РѕРІРёС‚СЊ СЃРѕСЃС‚РѕСЏРЅРёРµ, РІ РєРѕС‚РѕСЂРѕРј details_item РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚"):
        attach_json_payload("Mock State", report_server_app["state"])

    with allure.step("#2 РћС‚РїСЂР°РІРёС‚СЊ GET Р·Р°РїСЂРѕСЃ СЃ РЅРµРёР·РІРµСЃС‚РЅС‹Рј vacancy_id"):
        attach_request_info("GET", url, params=params)
        response = http_session.get(url, params=params, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 404"):
        assert response.status_code == 404

    with allure.step("#4 РџСЂРѕРІРµСЂРёС‚СЊ С‚РµРєСЃС‚ РѕС€РёР±РєРё not_found"):
        assert response.json() == {"ok": False, "error": "not_found"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: POST /api/vacancies/send-resume")
@allure.story("РќРµРіР°С‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "send_resume")
@allure.testcase("LAPI-005")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("РћС‚РїСЂР°РІРєР° РЅРµРІР°Р»РёРґРЅРѕРіРѕ JSON РІ send-resume")
@pytest.mark.local_api
@pytest.mark.integration
def test_send_resume_rejects_invalid_json(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° РѕС€РёР±РєРё 400 РїСЂРё РЅРµРІР°Р»РёРґРЅРѕРј JSON РІ POST /api/vacancies/send-resume."""
    url = f"{report_server_app['base_url']}/api/vacancies/send-resume"
    payload = "{bad json"

    with allure.step("#1 РћС‚РїСЂР°РІРёС‚СЊ POST Р·Р°РїСЂРѕСЃ СЃ РЅРµРІР°Р»РёРґРЅС‹Рј JSON"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
        attach_local_api_response(response)

    with allure.step("#2 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 400"):
        assert response.status_code == 400

    with allure.step("#3 РџСЂРѕРІРµСЂРёС‚СЊ С‚РµРєСЃС‚ РѕС€РёР±РєРё invalid_json"):
        assert response.json() == {"ok": False, "error": "invalid_json"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: POST /api/vacancies/send-resume")
@allure.story("РќРµРіР°С‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "send_resume")
@allure.testcase("LAPI-006")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("РћС‚РјРµС‚РєР° РѕС‚РїСЂР°РІРєРё СЂРµР·СЋРјРµ РґР»СЏ РЅРµРёР·РІРµСЃС‚РЅРѕР№ РІР°РєР°РЅСЃРёРё")
@pytest.mark.local_api
@pytest.mark.integration
def test_send_resume_returns_not_found_for_unknown_vacancy(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° РѕС€РёР±РєРё 404, РµСЃР»Рё mark_resume_sent РІРѕР·РІСЂР°С‰Р°РµС‚ False."""
    report_server_app["state"]["mark_result"] = False
    url = f"{report_server_app['base_url']}/api/vacancies/send-resume"
    payload = {"vacancy_id": "999"}

    with allure.step("#1 РџРѕРґРіРѕС‚РѕРІРёС‚СЊ СЃРѕСЃС‚РѕСЏРЅРёРµ, РІ РєРѕС‚РѕСЂРѕРј mark_resume_sent РІРѕР·РІСЂР°С‰Р°РµС‚ False"):
        attach_json_payload("Mock State", report_server_app["state"])

    with allure.step("#2 РћС‚РїСЂР°РІРёС‚СЊ POST Р·Р°РїСЂРѕСЃ РґР»СЏ РЅРµРёР·РІРµСЃС‚РЅРѕР№ РІР°РєР°РЅСЃРёРё"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(url, json=payload, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 404"):
        assert response.status_code == 404

    with allure.step("#4 РџСЂРѕРІРµСЂРёС‚СЊ С‚РµРєСЃС‚ РѕС€РёР±РєРё vacancy_not_found Рё vacancy_id"):
        assert response.json() == {
            "ok": False,
            "updated": False,
            "error": "vacancy_not_found",
            "vacancy_id": "999",
        }


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: POST /api/vacancies/send-resume")
@allure.story("РџРѕР·РёС‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "send_resume")
@allure.testcase("LAPI-007")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("РЈСЃРїРµС€РЅР°СЏ РѕС‚РјРµС‚РєР° РѕС‚РїСЂР°РІРєРё СЂРµР·СЋРјРµ")
@pytest.mark.local_api
@pytest.mark.integration
def test_send_resume_returns_success(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР° СѓСЃРїРµС€РЅРѕРіРѕ РѕС‚РІРµС‚Р° 200 РґР»СЏ POST /api/vacancies/send-resume."""
    url = f"{report_server_app['base_url']}/api/vacancies/send-resume"
    payload = {"vacancy_id": "100"}
    report_server_app["state"]["mark_result"] = {
        "updated": True,
        "vacancy_id": "100",
        "resume_at": "2026-03-27T10:00:00",
        "updated_at": "2026-03-27T10:00:00",
    }

    with allure.step("#1 РћС‚РїСЂР°РІРёС‚СЊ POST Р·Р°РїСЂРѕСЃ СЃ РІР°Р»РёРґРЅС‹Рј vacancy_id"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(url, json=payload, timeout=5)
        attach_local_api_response(response)

    with allure.step("#2 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 200"):
        assert response.status_code == 200

    with allure.step("#3 РџСЂРѕРІРµСЂРёС‚СЊ СѓСЃРїРµС€РЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ РѕР±РЅРѕРІР»РµРЅРёСЏ"):
        assert response.json() == {
            "ok": True,
            "updated": True,
            "vacancy_id": "100",
            "resume_at": "2026-03-27T10:00:00",
            "updated_at": "2026-03-27T10:00:00",
        }


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Р СѓС‡РєР°: POST /api/vacancies/details")
@allure.story("РџРѕР·РёС‚РёРІРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ")
@allure.link(LOCAL_API_DOC_LINK, name="Р РµР°Р»РёР·Р°С†РёСЏ report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "details")
@allure.testcase("LAPI-008")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("РЎРѕС…СЂР°РЅРµРЅРёРµ РґРµС‚Р°Р»РµР№ РІР°РєР°РЅСЃРёРё СЃ РІРѕР·РІСЂР°С‚РѕРј service result")
@pytest.mark.local_api
@pytest.mark.integration
def test_save_details_returns_service_result(report_server_app, http_session):
    """РџСЂРѕРІРµСЂРєР°, С‡С‚Рѕ POST /api/vacancies/details РІРѕР·РІСЂР°С‰Р°РµС‚ СЂРµР·СѓР»СЊС‚Р°С‚ save_vacancy_details."""
    report_server_app["state"]["save_result"] = {
        "ok": True,
        "updated": False,
        "requires_overwrite": True,
    }
    url = f"{report_server_app['base_url']}/api/vacancies/details"
    payload = {
        "vacancy_id": "100",
        "fields": {"hr_name": "New HR", "result": "offer"},
        "force_overwrite": False,
    }

    with allure.step("#1 РџРѕРґРіРѕС‚РѕРІРёС‚СЊ mock service result РґР»СЏ save_vacancy_details"):
        attach_json_payload("Mock Save Result", report_server_app["state"]["save_result"])

    with allure.step("#2 РћС‚РїСЂР°РІРёС‚СЊ POST Р·Р°РїСЂРѕСЃ СЃ РґРµС‚Р°Р»СЏРјРё РІР°РєР°РЅСЃРёРё"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(url, json=payload, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 РџРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° 200"):
        assert response.status_code == 200

    with allure.step("#4 РџСЂРѕРІРµСЂРёС‚СЊ, С‡С‚Рѕ РѕС‚РІРµС‚ СЃРѕРІРїР°РґР°РµС‚ СЃ service result"):
        assert response.json() == report_server_app["state"]["save_result"]
