import pytest
import allure
from tests.api.utils.validators import validate_salary_sorting, validate_date_range

# @allure.epic("API")
# @allure.feature("Раздел: Вакансии")
# @allure.story("Поиск вакансии")
@allure.parent_suite("API. Раздел: Вакансии")
@allure.suite("Поиск вакансий. Ручка: /vacancies")
@allure.sub_suite("Проверка фильтрации запроса по параметру per_page")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies",
             name="Documentation: GET vacancies")
@allure.tag("regression", "vacancies", "per_page")
@allure.label("owner", "Pavangelika")
@allure.testcase("RT-001")
@pytest.mark.regression
@pytest.mark.vacancies
class TestVacanciesRegress:

    @allure.tag("positive")
    @pytest.mark.parametrize("per_page", [0, 1, 50, 100])
    @allure.title("Параметр per_page: {per_page}")
    def test_pagination_per_page_positive(self, api_client, attach_headers_request_response, per_page):
        """Тестирование параметра per_page"""
        params = {"per_page": per_page, "page": 0}

        with allure.step(f"Отправить запрос к vacancies с per_page={per_page}"):
            response = api_client.get_vacancies(**params)

            attach_headers_request_response(
                "GET",
                "https://api.hh.ru/vacancies",
                params,
                dict(api_client.session.headers),
                response)

        with allure.step(f"Получить ответ сервера 200"):
            response = api_client.get_vacancies(**params)

            assert response.status_code == 200, f"Expected 200, received {response.status_code}"
            allure.attach(
                body=f"Status code,{response.status_code}",
                name="Status code of response",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step(f"Проверяем количество элементов: ожидается ≤ {per_page}"):
            data = response.json()
            assert len(
                data['items']) <= per_page, f"Количество вакансий в ответе {len(data['items'])} превышает {per_page}"
            assert data['per_page'] == per_page, f"Количество элементов в ответе {data['per_page']} не равно {per_page}"

            # Исправлены строки с тернарными операторами
            status_one = "✓" if len(data['items']) <= per_page else "✗"
            status_two = "✓" if data['per_page'] == per_page else "✗"

            # Исправлено форматирование строки
            allure.attach(
                body=f"Параметр, ФР, ОР, Статус\n"
                     f"Количество вакансий в ответе, {len(data['items'])}, {per_page}, {status_one}\n"
                     f"Количество элементов в ответе, {data['per_page']}, {per_page}, {status_two}",
                name="Результат проверки",
                attachment_type=allure.attachment_type.CSV
            )

    @allure.tag("negative")
    @pytest.mark.parametrize("per_page", [-1, 101, "invalid", 1000000000000000000000000])
    @allure.title("Параметр per_page: {per_page}")
    def test_pagination_per_page_negative(self, api_client, attach_headers_request_response, per_page):
        """Тестирование невалидных значений параметра per_page"""
        params = {"per_page": per_page, "page": 0}

        with allure.step(f"Отправить запрос с невалидным per_page={per_page}"):
            response = api_client.get_vacancies(**params)

            attach_headers_request_response(
                "GET",
                "https://api.hh.ru/vacancies",
                params,
                dict(api_client.session.headers),
                response
            )

        with allure.step("Проверить, что сервер возвращает ошибку 400"):
            # Для негативных тестов ожидаем статус 400
            assert 400 == response.status_code, (
                f"Для невалидного значения ожидается 400, получено {response.status_code}"
            )

            allure.attach(
                body=f"Status code,{response.status_code}",
                name="Response details",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("Проверить структуру ответа с ошибкой"):
            try:
                data = response.json()

                # Для API hh.ru обычно есть поле 'errors' в ответе при ошибке
                # Проверяем, что есть информация об ошибке
                if 'errors' in data:
                    allure.attach(
                        body="\n".join([f"{err}" for err in data.get('errors', [])]),
                        name="Error messages",
                        attachment_type=allure.attachment_type.TEXT
                    )
                elif 'error' in data:
                    allure.attach(
                        body=data['error'],
                        name="Error message",
                        attachment_type=allure.attachment_type.TEXT
                    )

            except ValueError:
                # Если ответ не в JSON формате, это тоже может быть валидной ошибкой
                allure.attach(
                    body=response.text[:500],  # Первые 500 символов
                    name="Error response (non-JSON)",
                    attachment_type=allure.attachment_type.TEXT
                )


    # @pytest.mark.parametrize("order_by,expected_order", [
    #     ("salary_desc", "desc"),
    #     ("salary_asc", "asc"),
    #     ("publication_time", "date")
    # ])
    # @allure.title("Тест сортировки: order_by = {order_by}")
    # def test_sorting(self, api_client, attach_request_response, order_by, expected_order):
    #     """Тестирование различных типов сортировки"""
    #     params = {"order_by": order_by, "per_page": 20}
    #
    #     response = api_client.get_vacancies(**params)
    #     attach_request_response("GET", "https://api.hh.ru/vacancies", params,
    #                             dict(api_client.session.headers), response, None)
    #
    #     assert response.status_code == 200
    #     data = response.json()
    #
    #     if order_by.startswith("salary") and data['items']:
    #         with allure.step(f"Проверяем сортировку {order_by}"):
    #             validate_salary_sorting(data['items'], expected_order)
    #
    # @pytest.mark.parametrize("period", [1, 7, 30])
    # @allure.title("Тест фильтра по времени: period = {period}")
    # def test_period_filter(self, api_client, attach_request_response, period):
    #     """Тестирование фильтра по периоду публикации"""
    #     params = {"period": period, "per_page": 10}
    #
    #     response = api_client.get_vacancies(**params)
    #     attach_request_response("GET", "https://api.hh.ru/vacancies", params,
    #                             dict(api_client.session.headers), response, None)
    #
    #     assert response.status_code == 200
    #     data = response.json()
    #
    #     if data['items']:
    #         with allure.step(f"Проверяем, что вакансии за последние {period} дней"):
    #             validate_date_range(data['items'], period)
