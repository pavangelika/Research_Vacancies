import json
import time
from itertools import count

import pytest
import allure
from tests.api.utils.schemas import validate_vacancies_response, validate_vacancy_detail_response, VACANCY_DETAIL_SCHEMA


# @allure.epic("API")
# @allure.feature("Раздел: Вакансии")
# @allure.story("Поиск вакансии")
@allure.parent_suite("API")
@allure.suite("Раздел: Вакансии")
@allure.sub_suite("Просмотр вакансии. Ручка: /vacancies/{vacancy_id}")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancy",
             name="Документация: Поиск вакансии")
@allure.tag("smoke", "vacancy")
@allure.label("owner", "Pavangelika")
@allure.testcase("ST-002")
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.smoke
@pytest.mark.vacancy
@allure.title("Просмотр вакансии из списка вакансии")
def test_get_vacancy(api_client, attach_headers_request_response):
    """Проверка доступности вакансии, полученной из списка вакансий /vacancies/"""
    params = {
        "host": "hh.ru",
        "per_page": 100,
        "page": 0,
        "period": 1,
        "order_by": "salary_desc",
        "professional_role": 124,
        "work_format": "REMOTE"
    }

    with allure.step(f"#1 Получить список вакансий с выбранными параметрами фильтрации"):
        params = {
            "host": "hh.ru",
            "per_page": 100,
            "page": 0,
            "period": 1,
            "order_by": "salary_desc",
            "professional_role": 124,
            "work_format": "REMOTE"
        }
        response = api_client.get_vacancies(**params)
        list_vacancies = response.json()

        assert list_vacancies["found"] != 0, f"Нет вакансий для тестирования"

        attach_headers_request_response(
            "GET",
            "https://api.hh.ru/vacancies",
            params,
            dict(api_client.session.headers),
            response)

        allure.attach(
            body=json.dumps(list_vacancies, indent=2, ensure_ascii=False),
            name="Response Body",
            attachment_type=allure.attachment_type.JSON
        )

    with allure.step("#2 Получить id первой вакансии из списка вакансий"):
        vacancy_id = list_vacancies["items"][0]["id"]
        allure.attach(
            body=f"Vacancy_id,{vacancy_id}",
            name="ID вакансии",
            attachment_type=allure.attachment_type.CSV
        )

    with allure.step(f"#3 Отправить запрос для просмотра вакансии"):
        start_time = time.time()
        response = api_client.session.get(f"https://api.hh.ru/vacancies/{vacancy_id}")
        response_time = (time.time() - start_time) * 1000

        attach_headers_request_response(
            "GET",
            f"https://api.hh.ru/vacancies/{vacancy_id}",
            params,
            dict(api_client.session.headers),
            response,
            response_time)

    with allure.step("#4 Проверить: код ответа 200"):
        assert response.status_code == 200, f"Expected 200, received {response.status_code}"
        allure.attach(
            body=f"Status code,{response.status_code}",
            name="Status code of response",
            attachment_type=allure.attachment_type.CSV
        )

        response_body = response.json()
        allure.attach(
            body=json.dumps(response_body, indent=2, ensure_ascii=False),
            name="Response Body",
            attachment_type=allure.attachment_type.JSON
        )

    #
    # with allure.step("Check time of response"):
    #     assert response_time < 2000, f"Time of response {response_time}ms > 2 sec"
    #
    #     allure.attach(
    #         body=f"Time of response, {response_time}",
    #         name="Time of response",
    #         attachment_type=allure.attachment_type.CSV
    #     )
