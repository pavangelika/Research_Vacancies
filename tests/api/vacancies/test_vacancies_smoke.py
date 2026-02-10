import json
import time
import pytest
import allure
from tests.api.utils.schemas import validate_vacancies_response


# @allure.epic("API")
# @allure.feature("Раздел: Вакансии")
# @allure.story("Поиск вакансий")
@allure.parent_suite("API. Раздел: Вакансии")
@allure.suite("Поиск вакансий. Ручка: /vacancies")
@allure.sub_suite("Дымовое тестирование")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies",
             name="Documentation: GET vacancies")
@allure.tag("smoke", "vacancies")
@allure.label("owner", "Pavangelika")
@allure.testcase("ST-001")
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.smoke
@pytest.mark.vacancies
@allure.title("Получение списка вакансий без ввода параметров")
def test_basic_request(api_client, attach_headers_request_response):
    """Проверка получения списка вакансии без применения фильтров"""
    with allure.step("#1 Отправить базовый запрос без параметров"):
        start_time = time.time()
        response = api_client.get_vacancies()
        response_time = (time.time() - start_time) * 1000
        attach_headers_request_response(
            "GET",
            "https://api.hh.ru/vacancies",
            None,
            dict(api_client.session.headers),
            response,
            response_time
        )

    with allure.step("#2 Получить ответ сервера 200"):
        assert response.status_code == 200, f"Expected 200, received {response.status_code}"
        allure.attach(
            body=f"Status code,{response.status_code}",
            name="Status code of response",
            attachment_type=allure.attachment_type.CSV
        )

    with allure.step("#3 Ответ не пустой"):
        response_body = response.json()
        assert response_body["found"] > 0, f'Список вакансий пустой'

        if response_body["found"] > 0:
            allure.attach(
                body=
                f"Количество вакансий:, {response_body["found"]}\n",
                name="Найдено вакансий",
                attachment_type=allure.attachment_type.CSV
            )

        response_attach = {
            "items": response.json()["items"][0],
            "found": response.json()["found"],
            "page": response.json()["page"],
            "per_page": response.json()["per_page"],
            "pages": response.json()["pages"]
        }
        allure.attach(
            body=json.dumps(response_attach, indent=2, ensure_ascii=False),
            name="Response Body",
            attachment_type=allure.attachment_type.JSON
        )


@allure.parent_suite("API. Раздел: Вакансии")
@allure.suite("Поиск вакансий. Ручка: /vacancies")
@allure.sub_suite("Дымовое тестирование")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies",
             name="Documentation: GET vacancies")
@allure.tag("smoke", "vacancies")
@allure.label("owner", "Pavangelika")
@allure.testcase("ST-002")
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.smoke
@pytest.mark.vacancies
@allure.title("Получение списка вакансий с вводом параметров фильтрации")
def test_example_parameters(api_client, attach_headers_request_response):
    """Проверка получения списка вакансии с применением фильтров: формат работы, профессиональная роль, период, сортировка"""
    params = {
        "host": "hh.ru",
        "per_page": 100,
        "page": 0,
        "period": 1,
        "order_by": "salary_desc",
        "professional_role": 124,
        "work_format": "REMOTE"
    }

    with allure.step("#1 Отправить запрос с параметрами"):
        start_time = time.time()
        response = api_client.get_vacancies(**params)
        response_time = (time.time() - start_time) * 1000

        attach_headers_request_response(
            "GET",
            "https://api.hh.ru/vacancies",
            params,
            dict(api_client.session.headers),
            response,
            response_time)

    with allure.step("#2 Получить ответ сервера 200"):
        assert response.status_code == 200, f"Expected 200, received {response.status_code}"
        allure.attach(
            body=f"Status code,{response.status_code}",
            name="Status code of response",
            attachment_type=allure.attachment_type.CSV
        )

    with allure.step("#3 Ответ не пустой"):
        response_body = response.json()
        assert response_body["found"] > 0, f'Список вакансий пустой'

        if response_body["found"] > 0:
            allure.attach(
                body=
                f"Количество вакансий:, {response_body["found"]}\n",
                name="Найдено вакансий",
                attachment_type=allure.attachment_type.CSV
            )

        response_attach = {
            "items": response.json()["items"][0],
            "found": response.json()["found"],
            "page": response.json()["page"],
            "per_page": response.json()["per_page"],
            "pages": response.json()["pages"]
        }
        allure.attach(
            body=json.dumps(response_attach, indent=2, ensure_ascii=False),
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
