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


LOCAL_API_PARENT_SUITE = "API. Раздел: Local API"
LOCAL_API_SUITE = "Раздел: Вакансии"
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
@allure.sub_suite("Ручка: GET /api/vacancies/responses")
@allure.story("Дымовое тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "responses")
@allure.testcase("LAPI-001")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Получение списка вакансий с отправленным резюме")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_responses_returns_items(report_server_app, http_session):
    """Проверка успешного ответа ручки GET /api/vacancies/responses."""
    url = f"{report_server_app['base_url']}/api/vacancies/responses"

    with allure.step("#1 Отправить GET запрос к /api/vacancies/responses"):
        attach_request_info("GET", url)
        response = http_session.get(url, timeout=5)
        attach_local_api_response(response)

    with allure.step("#2 Получить ответ сервера 200"):
        assert response.status_code == 200

    with allure.step("#3 Проверить структуру и содержимое ответа"):
        assert response.json() == {"ok": True, "items": report_server_app["state"]["responses_items"]}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: GET /api/vacancies/details")
@allure.story("Негативное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "details")
@allure.testcase("LAPI-002")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Запрос деталей вакансии без vacancy_id")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_details_requires_vacancy_id(report_server_app, http_session):
    """Проверка ошибки 400, если vacancy_id не передан."""
    url = f"{report_server_app['base_url']}/api/vacancies/details"

    with allure.step("#1 Отправить GET запрос к /api/vacancies/details без vacancy_id"):
        attach_request_info("GET", url)
        response = http_session.get(url, timeout=5)
        attach_local_api_response(response)

    with allure.step("#2 Получить ответ сервера 400"):
        assert response.status_code == 400

    with allure.step("#3 Проверить текст ошибки vacancy_id_required"):
        assert response.json() == {"ok": False, "error": "vacancy_id_required"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: GET /api/vacancies/details")
@allure.story("Позитивное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "details")
@allure.testcase("LAPI-003")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Получение деталей существующей вакансии")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_details_returns_item(report_server_app, http_session):
    """Проверка успешного ответа 200 для GET /api/vacancies/details."""
    url = f"{report_server_app['base_url']}/api/vacancies/details"
    params = {"vacancy_id": "100"}

    with allure.step("#1 Подготовить mock details_item для существующей вакансии"):
        attach_json_payload("Mock Details Item", report_server_app["state"]["details_item"])

    with allure.step("#2 Отправить GET запрос с валидным vacancy_id"):
        attach_request_info("GET", url, params=params)
        response = http_session.get(url, params=params, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 Получить ответ сервера 200"):
        assert response.status_code == 200

    with allure.step("#4 Проверить, что в ответе возвращается item"):
        assert response.json() == {
            "ok": True,
            "item": report_server_app["state"]["details_item"],
        }


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: GET /api/vacancies/details")
@allure.story("Негативное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "details")
@allure.testcase("LAPI-004")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Запрос деталей неизвестной вакансии")
@pytest.mark.local_api
@pytest.mark.integration
def test_get_details_returns_not_found(report_server_app, http_session):
    """Проверка ошибки 404, если вакансия не найдена."""
    report_server_app["state"]["details_item"] = None
    url = f"{report_server_app['base_url']}/api/vacancies/details"
    params = {"vacancy_id": "404"}

    with allure.step("#1 Подготовить состояние, в котором details_item отсутствует"):
        attach_json_payload("Mock State", report_server_app["state"])

    with allure.step("#2 Отправить GET запрос с неизвестным vacancy_id"):
        attach_request_info("GET", url, params=params)
        response = http_session.get(url, params=params, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 Получить ответ сервера 404"):
        assert response.status_code == 404

    with allure.step("#4 Проверить текст ошибки not_found"):
        assert response.json() == {"ok": False, "error": "not_found"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: POST /api/vacancies/send-resume")
@allure.story("Негативное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "send_resume")
@allure.testcase("LAPI-005")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Отправка невалидного JSON в send-resume")
@pytest.mark.local_api
@pytest.mark.integration
def test_send_resume_rejects_invalid_json(report_server_app, http_session):
    """Проверка ошибки 400 при невалидном JSON в POST /api/vacancies/send-resume."""
    url = f"{report_server_app['base_url']}/api/vacancies/send-resume"
    payload = "{bad json"

    with allure.step("#1 Отправить POST запрос с невалидным JSON"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
        attach_local_api_response(response)

    with allure.step("#2 Получить ответ сервера 400"):
        assert response.status_code == 400

    with allure.step("#3 Проверить текст ошибки invalid_json"):
        assert response.json() == {"ok": False, "error": "invalid_json"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: POST /api/vacancies/send-resume")
@allure.story("Негативное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "negative", "send_resume")
@allure.testcase("LAPI-006")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Отметка отправки резюме для неизвестной вакансии")
@pytest.mark.local_api
@pytest.mark.integration
def test_send_resume_returns_not_found_for_unknown_vacancy(report_server_app, http_session):
    """Проверка ошибки 404, если mark_resume_sent возвращает False."""
    report_server_app["state"]["mark_result"] = False
    url = f"{report_server_app['base_url']}/api/vacancies/send-resume"
    payload = {"vacancy_id": "999"}

    with allure.step("#1 Подготовить состояние, в котором mark_resume_sent возвращает False"):
        attach_json_payload("Mock State", report_server_app["state"])

    with allure.step("#2 Отправить POST запрос для неизвестной вакансии"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(url, json=payload, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 Получить ответ сервера 404"):
        assert response.status_code == 404

    with allure.step("#4 Проверить текст ошибки vacancy_not_found и vacancy_id"):
        assert response.json() == {
            "ok": False,
            "updated": False,
            "error": "vacancy_not_found",
            "vacancy_id": "999",
        }


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: POST /api/vacancies/send-resume")
@allure.story("Позитивное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "send_resume")
@allure.testcase("LAPI-007")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Успешная отметка отправки резюме")
@pytest.mark.local_api
@pytest.mark.integration
def test_send_resume_returns_success(report_server_app, http_session):
    """Проверка успешного ответа 200 для POST /api/vacancies/send-resume."""
    url = f"{report_server_app['base_url']}/api/vacancies/send-resume"
    payload = {"vacancy_id": "100"}

    with allure.step("#1 Отправить POST запрос с валидным vacancy_id"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(url, json=payload, timeout=5)
        attach_local_api_response(response)

    with allure.step("#2 Получить ответ сервера 200"):
        assert response.status_code == 200

    with allure.step("#3 Проверить успешный результат обновления"):
        assert response.json() == {"ok": True, "updated": True, "vacancy_id": "100"}


@allure.parent_suite(LOCAL_API_PARENT_SUITE)
@allure.suite(LOCAL_API_SUITE)
@allure.sub_suite("Ручка: POST /api/vacancies/details")
@allure.story("Позитивное тестирование")
@allure.link(LOCAL_API_DOC_LINK, name="Реализация report_server")
@allure.label("owner", LOCAL_API_OWNER)
@allure.tag("local_api", "integration", "positive", "details")
@allure.testcase("LAPI-008")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Сохранение деталей вакансии с возвратом service result")
@pytest.mark.local_api
@pytest.mark.integration
def test_save_details_returns_service_result(report_server_app, http_session):
    """Проверка, что POST /api/vacancies/details возвращает результат save_vacancy_details."""
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

    with allure.step("#1 Подготовить mock service result для save_vacancy_details"):
        attach_json_payload("Mock Save Result", report_server_app["state"]["save_result"])

    with allure.step("#2 Отправить POST запрос с деталями вакансии"):
        attach_request_info("POST", url, payload=payload)
        response = http_session.post(url, json=payload, timeout=5)
        attach_local_api_response(response)

    with allure.step("#3 Получить ответ сервера 200"):
        assert response.status_code == 200

    with allure.step("#4 Проверить, что ответ совпадает с service result"):
        assert response.json() == report_server_app["state"]["save_result"]
