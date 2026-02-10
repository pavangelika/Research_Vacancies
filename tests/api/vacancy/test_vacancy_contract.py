import json
import time
import pytest
import allure
import jsonschema
from tests.api.utils.schemas import validate_vacancy_detail_response, VACANCY_DETAIL_SCHEMA, check_data_types


# @allure.epic("API")
# @allure.feature("Раздел: Вакансии")
# @allure.story("Поиск вакансии")
@allure.parent_suite("API. Раздел: Вакансии")
@allure.suite("Поиск вакансий. Ручка: /vacancies/{vacancy_id}")
@allure.sub_suite("Проверка контракта")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancy",
             name="Документация: Поиск вакансии")
@allure.tag("contract", "vacancy")
@allure.label("owner", "Pavangelika")
@allure.testcase("CT-002")
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.contract
@pytest.mark.vacancy
@allure.title("Валидация JSON схемы ответа")
def test_vacancy_validation(api_client, attach_headers_request_response):
    """Контрактный тест - проверка соответствия JSON Schema."""
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
            body=f"vacancy_id,{vacancy_id}",
            name="Vacancy_id",
            attachment_type=allure.attachment_type.CSV
        )

    with allure.step(f"#3 Отправить запрос для просмотра вакансии"):
        response_detail = api_client.session.get(f"https://api.hh.ru/vacancies/{vacancy_id}")
        detail_vacancy = response_detail.json()

        attach_headers_request_response(
            "GET",
            f"https://api.hh.ru/vacancies/{vacancy_id}",
            params,
            dict(api_client.session.headers),
            response)

    with allure.step("#4 Проверить: ответ в формате JSON "):
        assert 'application/json' in response_detail.headers.get('Content-Type', '').lower()
        allure.attach(
            body=f"Response type,{response_detail.headers.get('Content-Type', '').lower()}",
            name="Response type",
            attachment_type=allure.attachment_type.CSV
        )
        allure.attach(
            body=json.dumps(detail_vacancy, indent=2, ensure_ascii=False),
            name="Response Body",
            attachment_type=allure.attachment_type.JSON
        )

    with allure.step("#5 Структура ответа соответсвует JSON схеме"):
        try:
            validate_vacancy_detail_response(detail_vacancy)
        except Exception as e:
            allure.attach(
                body=json.dumps(detail_vacancy, indent=2, ensure_ascii=False),
                name="Invalid Response",
                attachment_type=allure.attachment_type.JSON
            )
            pytest.fail(f"Ошибка валидации схемы: {str(e)}")

    with allure.step("#6 Типы данных обязательных полей и наличие соответсвуют JSON схеме"):

        validation_results = check_data_types(detail_vacancy, VACANCY_DETAIL_SCHEMA)

        csv_rows = ["Поле, Наличие, ФР, ОР"]
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
