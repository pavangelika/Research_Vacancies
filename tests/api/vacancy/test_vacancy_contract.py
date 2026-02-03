import time

import pytest
import allure
import jsonschema
from tests.api.utils.schemas import validate_vacancy_detail_response, VACANCY_DETAIL_SCHEMA


@allure.epic("API")
@allure.feature("Get Vacancy")
@allure.story("Contract Testing")
@allure.suite("Get Vacancy")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancy", name="Documentation: GET vacancy")
@allure.tag("contract", "vacancy")
@pytest.mark.contract
class TestVacancyContract:

    @allure.title("Валидация JSON Schema ответа")
    def test_response_schema_validation(self, api_client, attach_request_response):
        """Контрактный тест - проверка соответствия JSON Schema"""
        params = {"per_page": 10}

        response = api_client.get_vacancies(**params)
        attach_request_response("GET", "https://api.hh.ru/vacancies", params,
                                dict(api_client.session.headers), response, None)

        assert response.status_code == 200

        data = response.json()

        params = {
            "host": "hh.ru",
            "per_page": 100,
            "page": 0,
            "period": 1,
            "order_by": "salary_desc",
            "professional_role": 124,
            "work_format": "REMOTE"
        }

        start_time = time.time()
        response = api_client.get_vacancies(**params)
        response_time = (time.time() - start_time) * 1000
        list_vacancies = response.json()
        vacancy_id = list_vacancies["items"][0]["id"]


        with allure.step("Send GET request https://api.hh.ru/vacancies/{vacancy_id}"):

            start_time = time.time()
            response = api_client.session.get(f"https://api.hh.ru/vacancies/{vacancy_id}")
            response_time = (time.time() - start_time) * 1000

            detail_vacancy = response.json()


        with allure.step("Валидируем ответ по JSON Schema"):
            try:
                validate_vacancy_detail_response(data)
                allure.attach(
                    str(VACANCY_DETAIL_SCHEMA),
                    name="Expected Schema",
                    attachment_type=allure.attachment_type.JSON
                )
            except jsonschema.ValidationError as e:
                allure.attach(
                    str(e),
                    name="Validation Error",
                    attachment_type=allure.attachment_type.TEXT
                )
                raise

    @allure.title("Проверка обязательных полей")
    def test_required_fields(self, api_client, attach_request_response):
        """Проверка наличия обязательных полей в ответе"""
        response = api_client.get_vacancies(per_page=5)
        attach_request_response("GET", "https://api.hh.ru/vacancies",
                                {"per_page": 5}, dict(api_client.session.headers), response, None)

        assert response.status_code == 200
        data = response.json()

        required_fields = ["items", "found", "pages", "per_page", "page"]
        for field in required_fields:
            with allure.step(f"Проверяем наличие поля '{field}'"):
                assert field in data, f"Обязательное поле '{field}' отсутствует"
