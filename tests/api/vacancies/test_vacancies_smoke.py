import json
import time
import pytest
import allure
from tests.api.utils.schemas import validate_vacancies_response

@allure.epic("API")
@allure.feature("Get Vacancies")
@allure.story("Smoke Testing")
@allure.suite("Get Vacancies")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies", name="Documentation: GET vacancies")
@allure.tag("smoke", "vacancies")
@pytest.mark.smoke
@pytest.mark.vacancies
class TestVacanciesSmoke:

    @allure.severity(allure.severity_level.CRITICAL)
    @allure.title("Get list of vacancies from /vacancies without params")
    def test_basic_request(self, api_client, attach_headers_request_response):
        """Test get vacancies /vacancies without params"""
        with allure.step("Send GET request to /vacancies"):
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

        with allure.step("Check status code of response"):
            assert response.status_code == 200, f"Expected 200, received {response.status_code}"
            allure.attach(
                body=f"Status code,{response.status_code}",
                name="Status code of response",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("Check structure of response"):
            data = response.json()
            validate_vacancies_response(data)

            response_body = {
                "items": response.json()["items"][0],
                "found": response.json()["found"],
                "page": response.json()["page"],
                "per_page": response.json()["per_page"],
                "pages": response.json()["pages"]
            }
            allure.attach(
                body = json.dumps(response_body, indent=2, ensure_ascii=False),
                name = "Response Body",
                attachment_type = allure.attachment_type.JSON
            )

        with allure.step("Check time of response"):
            assert response_time < 2000, f"Time of response {response_time}ms > 2 sec"

            allure.attach(
                body=f"Time of response, {response_time}",
                name="Time of response",
                attachment_type=allure.attachment_type.CSV
            )

    @allure.severity(allure.severity_level.CRITICAL)
    @allure.title("Get list of vacancies from /vacancies with params for search vacancies")
    def test_example_parameters(self, api_client, attach_headers_request_response):
        """Test get vacancies /vacancies with params: professional_role, period, order_desc, work_format"""
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

        with allure.step("Check status code of response"):
            assert response.status_code == 200, f"Expected 200, received {response.status_code}"
            allure.attach(
                body=f"Status code,{response.status_code}",
                name="Status code of response",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("Check structure of response"):
            data = response.json()
            validate_vacancies_response(data)

            response_body = {
                "items": response.json()["items"][0],
                "found": response.json()["found"],
                "page": response.json()["page"],
                "per_page": response.json()["per_page"],
                "pages": response.json()["pages"]
            }
            allure.attach(
                body = json.dumps(response_body, indent=2, ensure_ascii=False),
                name = "Response Body",
                attachment_type = allure.attachment_type.JSON
            )

        with allure.step("Check time of response"):
            assert response_time < 2000, f"Time of response {response_time}ms > 2 sec"

            allure.attach(
                body=f"Time of response, {response_time}",
                name="Time of response",
                attachment_type=allure.attachment_type.CSV
            )
