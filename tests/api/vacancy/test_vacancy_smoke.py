import json
import time
from itertools import count

import pytest
import allure
from tests.api.utils.schemas import validate_vacancies_response, validate_vacancy_detail_response, VACANCY_DETAIL_SCHEMA

@allure.epic("API")
@allure.feature("Get Vacancy")
@allure.suite("Smoke testing")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancy",
             name="Документация: Поиск вакансии")
@allure.tag("smoke", "vacancy")
@pytest.mark.smoke
@pytest.mark.vacancy
class TestVacancySmoke:

    @allure.severity(allure.severity_level.CRITICAL)
    @allure.title("Просмотр вакансии из списка вакансии")
    def test_get_vacancy(self, api_client, attach_headers_request_response):
        """Проверка доступности просмотра вакансии, полученной из списка вакансий /vacancies/"""
        params = {
            "host": "hh.ru",
            "per_page": 100,
            "page": 0,
            "period": 1,
            "order_by": "salary_desc",
            "professional_role": 124,
            "work_format": "REMOTE"
        }

        with allure.step("1. Отправить GET запрос to /vacancies с параметрами фильтрации"):
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

        with allure.step("2. Список вакансий не пустой"):
            list_vacancies = response.json()
            items_count = len(list_vacancies["items"])

            error_2 = f"Список items пустой. Отсутствуют вакансии для выбора. Найдено вакансий: {items_count}"
            assert items_count > 0, error_2

            allure.attach(
                body=f"Количество найденных вакансий: {items_count}",
                name="Количество вакансий",
                attachment_type=allure.attachment_type.TEXT
            )

        with allure.step("3. Получить id первой вакансии из списка"):
            vacancy_id = list_vacancies["items"][0]["id"]
            allure.attach(
                body=f"Vacancy_id,{vacancy_id}",
                name="ID вакансии",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step(f"4. Отправить динамический запрос для получения детальной информации о вакансии ID:{vacancy_id}"):
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

        with allure.step("5. Код ответа 200"):
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
