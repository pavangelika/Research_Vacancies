import pytest
import allure
from tests.api.utils.validators import validate_salary_sorting, validate_date_range

# @allure.epic("API")
# @allure.feature("Раздел: Вакансии")
# @allure.story("Поиск вакансии")
@allure.parent_suite("API. Раздел: Вакансии")
@allure.suite("Поиск вакансий. Ручка: /vacancies")
@allure.sub_suite("Проверка фильтрации запроса по параметрам per_page и page")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies",
             name="Documentation: GET vacancies")
@allure.tag("regression", "vacancies", "per_page")
@allure.label("owner", "Pavangelika")
@allure.testcase("RT-001")
@pytest.mark.regression
@pytest.mark.vacancies
class TestVacanciesRegress:

    @allure.tag("positive")
    @pytest.mark.parametrize("per_page,page", [
        (0,0),
        (1, 0),
        (50, 0),
        (100, 0),
        (1, 1),
        (1, 1000),
        (1, 1999),
        (10, 199),
        (100, 19),
    ])
    @allure.title("Positive. Параметр per_page: {per_page}, page={page}")
    def test_pagination_per_page_positive(self, api_client, attach_headers_request_response, per_page, page):
        """Тестирование параметра per_page"""
        params = {"per_page": per_page, "page": page}

        with allure.step(f"Отправить запрос к vacancies с per_page={per_page}, page={page}"):
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
    @pytest.mark.parametrize("per_page,page", [
        (-1, 0),
        (101, 0),
        ("invalid", 0),
        (1000000000000000000000000, 0),
        (1, 1000000000000000000000000),
        (1, 2000),
        (10, 200),
        (100, 20),
    ])
    @allure.title("Negative. Параметр per_page: {per_page}, page: {page}")
    def test_pagination_per_page_negative(self, api_client, attach_headers_request_response, per_page, page):
        """Тестирование невалидных значений параметра per_page"""
        params = {"per_page": per_page, "page": page}

        with allure.step(f"Отправить запрос с невалидным per_page={per_page}, page={page}"):
            response = api_client.get_vacancies(**params)

            attach_headers_request_response(
                "GET",
                "https://api.hh.ru/vacancies",
                params,
                dict(api_client.session.headers),
                response
            )

        with allure.step("Получить ошибку 400 Bad Request"):
            # Для негативных тестов ожидаем статус 400
            assert 400 == response.status_code, (
                f"Для невалидного значения ожидается 400, получено {response.status_code}"
            )

        with allure.step("Сохранить ПОЛНЫЙ текст ошибки"):
            try:
                error_data = response.json()
                error_text = response.text
                allure.attach(
                    body=error_text,
                    name="Полный ответ с ошибкой (JSON)",
                    attachment_type=allure.attachment_type.JSON
                )

                if 'errors' in error_data:
                    allure.attach(
                        body="\n".join(
                            [f"{e.get('type')}: {e.get('value')} - {e.get('message')}"
                             for e in error_data['errors']]
                        ),
                        name="Детали ошибки (parsed)",
                        attachment_type=allure.attachment_type.TEXT
                    )
                elif 'error' in error_data:
                    allure.attach(
                        body=error_data['error'],
                        name="Error message",
                        attachment_type=allure.attachment_type.TEXT
                    )
            except ValueError:
                allure.attach(
                    body=response.text[:2000],
                    name="Ответ с ошибкой (не JSON)",
                    attachment_type=allure.attachment_type.TEXT
                )
        # Краткий отчёт
        allure.attach(
            body=(
                f"Параметр,Значение\n"
                f"per_page,{per_page}\n"
                f"page,{page}\n"
                f"Статус код,{response.status_code}\n"
                f"Ожидаемый статус,400\n"
                f"Результат,PASSED (ошибка корректна)"
            ),
            name=f"Негативный тест: per_page={per_page}, page={page}",
            attachment_type=allure.attachment_type.CSV
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
