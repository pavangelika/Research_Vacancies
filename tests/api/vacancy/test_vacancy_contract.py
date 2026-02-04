import json
import time
import pytest
import allure
import jsonschema
from tests.api.utils.schemas import validate_vacancy_detail_response, VACANCY_DETAIL_SCHEMA, check_data_types


@allure.epic("API")
@allure.feature("Get Vacancy")
@allure.suite("Contract testing")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancy",
             name="Документация: Поиск вакансии")
@allure.tag("contract", "vacancy")
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.vacancy
class TestVacancyContract:

    @allure.title("Валидация JSON Schema ответа")
    def test_vacancy_validation(self, api_client, attach_headers_request_response):
        """Контрактный тест - проверка соответствия JSON Schema"""
        with allure.step(f"Получение динамического vacancy_id из запроса к /vacancies"):
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

            if list_vacancies["found"] == 0:
                pytest.skip("Нет вакансий для тестирования")

            vacancy_id = list_vacancies["items"][0]["id"]

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

            allure.attach(
                body=f"vacancy_id,{vacancy_id}",
                name="Vacancy_id",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step(f"2. Отправить динамический GET запрос to /vacancies/{vacancy_id}"):
            response_detail = api_client.session.get(f"https://api.hh.ru/vacancies/{vacancy_id}")
            detail_vacancy = response_detail.json()

            attach_headers_request_response(
                "GET",
                "https://api.hh.ru/vacancies",
                params,
                dict(api_client.session.headers),
                response)

            allure.attach(
                body=json.dumps(detail_vacancy, indent=2, ensure_ascii=False),
                name="Response Body",
                attachment_type=allure.attachment_type.JSON
            )

        with allure.step("3. Код ответа 200"):
            assert response_detail.status_code == 200, f"Expected 200, received {response_detail.status_code}"
            allure.attach(
                body=f"Status code,{response_detail.status_code}",
                name="Status code of response",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("4. Ответ в формате JSON "):
            assert 'application/json' in response_detail.headers.get('Content-Type', '').lower()
            allure.attach(
                body=f"Response type,{response_detail.headers.get('Content-Type', '').lower()}",
                name="Response type",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("5. Структура ответа соответсвует JSON схеме"):
            try:
                validate_vacancy_detail_response(detail_vacancy)
            except Exception as e:
                allure.attach(
                    body=json.dumps(detail_vacancy, indent=2, ensure_ascii=False),
                    name="Invalid Response",
                    attachment_type=allure.attachment_type.JSON
                )
                pytest.fail(f"Ошибка валидации схемы: {str(e)}")

        with allure.step("6. В ответе присутсвуют обязательные поля"):
            required_fields = VACANCY_DETAIL_SCHEMA.get("required", [])
            response_required_exists = {}
            response_required_not_exists = {}
            for field in required_fields:
                if field in detail_vacancy:
                    response_required_exists[field] = detail_vacancy[field]
                else:
                    # Логируем отсутствующее поле
                    response_required_not_exists[field] = None

            allure.attach(
                body=json.dumps(response_required_exists, indent=2, ensure_ascii=False),
                name="Required fields filled in response",
                attachment_type=allure.attachment_type.JSON
            )

            allure.attach(
                body=json.dumps(response_required_not_exists, indent=2, ensure_ascii=False),
                name="Required fields don't filled in response",
                attachment_type=allure.attachment_type.JSON
            )


        with allure.step("7. Типы данных обязательных полей соответсвуют JSON схеме"):

            validation_results = check_data_types(detail_vacancy, VACANCY_DETAIL_SCHEMA)

            csv_rows = ["Поле, Статус, ФР, ОР"]
            for result in validation_results:
                csv_rows.append(
                    f"{result['field']}, "
                    f"{result['status']}, "
                    f"{result['actual_type']}, "
                    f"{result['expected_type']}, "
                )

            allure.attach(
                body="\n".join(csv_rows),
                name="Field Validation Summary",
                attachment_type=allure.attachment_type.CSV
            )

            required_fields = VACANCY_DETAIL_SCHEMA.get("required", [])
            missing_fields = [field for field in required_fields
                              if field not in detail_vacancy]

            if missing_fields:
                allure.attach(
                    body=f"Отсутствующие обязательные поля: {missing_fields}",
                    name="Missing Required Fields",
                    attachment_type=allure.attachment_type.TEXT
                )
                assert not missing_fields, f"Отсутствуют обязательные поля: {missing_fields}"

