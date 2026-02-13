import pytest
import requests
import allure
import time
import json
from datetime import datetime
from utils.api_client import HHAPIClient


@pytest.fixture(scope="session")
def api_client():
    """Базовая фикстура клиента API для всех тестов"""
    return HHAPIClient(base_url="https://api.hh.ru")


@pytest.fixture
def attach_headers_request_response():
    """Фикстура для прикрепления заголовков запроса и ответа в Allure"""

    def _attach(method, url, params=None, headers=None, response=None, response_time=None):
        # Прикрепляем информацию о запросе
        request_info = {
            "method": method,
            "url": url,
            "params": params,
            "headers": headers,
            "timestamp": datetime.now().isoformat()
        }
        allure.attach(
            json.dumps(request_info, indent=2, ensure_ascii=False),
            name="Request Headers",
            attachment_type=allure.attachment_type.JSON
        )

        # Прикрепляем информацию о ответе
        if response:
            response_info = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "response_time_ms": response_time
            }
            allure.attach(
                body = json.dumps(response_info, indent=2, ensure_ascii=False),
                name="Response Headers",
                attachment_type=allure.attachment_type.JSON
            )

    return _attach

@pytest.fixture(params=[
    {"professional_role": 124, "work_format": "REMOTE"},
    {"professional_role": 96, "work_format": "OFFICE"},
    {"professional_role": 156, "work_format": "HYBRID"}
])
def filter_params(request):
    """Параметризованная фикстура для тестирования фильтров"""
    return request.param
