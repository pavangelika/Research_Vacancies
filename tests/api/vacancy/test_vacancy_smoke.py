import json
import time
import pytest
import allure
from tests.api.utils.schemas import validate_vacancies_response, validate_vacancy_detail_response, VACANCY_DETAIL_SCHEMA


@allure.epic("API")
@allure.feature("Get Vacancy")
@allure.story("Smoke Testing")
@allure.suite("Get Vacancy")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancy", name="Documentation: GET vacancy")
@allure.tag("smoke", "vacancy")
@pytest.mark.smoke
class TestVacancySmoke:

    @allure.severity(allure.severity_level.CRITICAL)
    @allure.title("Get details about a vacancy from list of vacancies")
    def test_get_vacancy(self, api_client, attach_headers_request_response):
        """Test get vacancy details /vacancies/{vacancy_id}"""
        params = {
            "host": "hh.ru",
            "per_page": 100,
            "page": 0,
            "period": 1,
            "order_by": "salary_desc",
            "professional_role": 124,
            "work_format": "REMOTE"
        }

        with allure.step("Send GET request to /vacancies with params"):
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

        with allure.step("Check structure of response"):
            list_vacancies = response.json()
            validate_vacancies_response(list_vacancies)

            response_body = {
                "items": list_vacancies["items"][0],
                "found": list_vacancies["found"],
                "page": list_vacancies["page"],
                "per_page":  list_vacancies["per_page"],
                "pages": list_vacancies["pages"]
            }
            allure.attach(
                body=json.dumps(response_body, indent=2, ensure_ascii=False),
                name="Response Body",
                attachment_type=allure.attachment_type.JSON
            )
            vacancy_id = list_vacancies["items"][0]["id"]

        with allure.step(f"Send dynamic GET request to /vacancies/{vacancy_id}"):
            start_time = time.time()
            response = api_client.session.get(f"https://api.hh.ru/vacancies/{vacancy_id}")
            response_time = (time.time() - start_time) * 1000

            allure.attach(
                body=f"Vacancy_id,{vacancy_id}",
                name="Vacancy_id",
                attachment_type=allure.attachment_type.CSV
            )

            attach_headers_request_response(
                "GET",
                f"https://api.hh.ru/vacancies/{vacancy_id}",
                params,
                dict(api_client.session.headers),
                response,
                response_time)

        with allure.step("Check status code of response"):
            assert response.status_code == 200, f"Expected 200, received {response.status_code}"
            allure.attach(
                body=f"Status code,{response.status_code}",
                name="Status code of response",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("Check structure of response"):
            detail_vacancy = response.json()
            validate_vacancy_detail_response(detail_vacancy)

            allure.attach(
                body = json.dumps(detail_vacancy, indent=2, ensure_ascii=False),
                name = "Response Body",
                attachment_type = allure.attachment_type.JSON
            )

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
                body = json.dumps(response_required_exists, indent=2, ensure_ascii=False),
                name = "Required fields are filled in response",
                attachment_type = allure.attachment_type.JSON
            )

            allure.attach(
                body = json.dumps(response_required_not_exists, indent=2, ensure_ascii=False),
                name = "Required fields are not filled in response",
                attachment_type = allure.attachment_type.JSON
            )

        with allure.step("Check time of response"):
            assert response_time < 2000, f"Time of response {response_time}ms > 2 sec"

            allure.attach(
                body=f"Time of response, {response_time}",
                name="Time of response",
                attachment_type=allure.attachment_type.CSV
            )




