import pytest
import allure
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any

@allure.parent_suite("API. Раздел: Вакансии")
@allure.suite("Поиск вакансий. Ручка: /vacancies")
@allure.sub_suite("Проверка фильтрации запроса по параметру period")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies",
             name="Documentation: GET vacancies")
@allure.tag("regression", "vacancies", "period")
@allure.label("owner", "Pavangelika")
@allure.testcase("RT-002")
@pytest.mark.regression
@pytest.mark.vacancies
class TestVacanciesPeriod:
    """
    Тестирование параметра period (фильтрация по дате публикации).
    - Для позитивных кейсов собираются ВСЕ страницы выдачи.
    - Итоговое количество собранных вакансий сравнивается с полем found.
    - Проверяется, что все собранные вакансии имеют дату публикации >= today - period.
    - Формируется детальный отчёт в Allure.
    - Для негативных кейсов выводится ПОЛНЫЙ текст ошибки.
    """

    # ---------- ВСПОМОГАТЕЛЬНЫЙ МЕТОД: СБОР ВСЕХ ВАКАНСИЙ ПО СТРАНИЦАМ ----------
    def _get_all_vacancies(self, api_client, params: Dict[str, Any]) -> Tuple[List[Dict], int]:
        """
        Выполняет запросы к /vacancies, проходя по всем страницам пагинации.
        Возвращает:
            - полный список всех items (вакансий)
            - значение found (общее количество вакансий по запросу)
        """
        all_items = []
        found = 0
        page = 0
        max_pages = 20  # hh.ru отдаёт максимум 2000 вакансий (20 страниц по 100)

        with allure.step(f"Сбор всех вакансий по страницам (per_page={params.get('per_page', 100)})"):
            while True:
                params["page"] = page
                response = api_client.get_vacancies(**params)

                if response.status_code != 200:
                    allure.attach(
                        body=f"Прерывание сбора на странице {page}: статус {response.status_code}",
                        name="Ошибка пагинации",
                        attachment_type=allure.attachment_type.TEXT
                    )
                    break

                data = response.json()
                items = data.get('items', [])
                found = data.get('found', 0)

                all_items.extend(items)
                allure.attach(
                    body=f"Страница {page}: получено {len(items)} вакансий, всего собрано {len(all_items)} из {found}",
                    name=f"Страница {page}",
                    attachment_type=allure.attachment_type.TEXT
                )

                # Условия выхода:
                if not items or len(all_items) >= found or page >= max_pages:
                    break

                page += 1

        return all_items, found

    # ---------- ПОЗИТИВНЫЕ ТЕСТЫ С ПАРАМЕТРИЗАЦИЕЙ ----------
    @allure.tag("positive")
    @pytest.mark.parametrize("period", [1, 7, 30])
    @allure.title("Positive. Фильтрация по period = {period} (полный сбор всех страниц)")
    def test_period_positive_full_collection(self, api_client, attach_headers_request_response, period):
        """
        Полный тест для валидного period:
          - Собирает ВСЕ вакансии по всем страницам.
          - Проверяет, что количество собранных items равно found.
          - Проверяет дату публикации каждой вакансии (не старше period дней).
          - Формирует итоговый отчёт.
        """
        params = {
            "period": period,
            "professional_role": 124,
            "per_page": 100,
            "order_by": "publication_time"
        }

        with allure.step(f"Отправить запрос: period={period}, professional_role=124, per_page=100"):
            allure.attach(
                body="\n".join([f"{k}: {v}" for k, v in params.items()]),
                name="Параметры запроса",
                attachment_type=allure.attachment_type.TEXT
            )

        # Получаем все вакансии
        all_items, found = self._get_all_vacancies(api_client, params.copy())
        items_collected = len(all_items)

        with allure.step("Проверка полноты сбора: собранные items == found"):
            assert items_collected == found, \
                f"Собрано {items_collected} вакансий, но API обещал {found}"

        with allure.step("Проверка дат публикации всех собранных вакансий"):
            today = datetime.now().date()
            cutoff_date = today - timedelta(days=period)
            failed_items = []

            for item in all_items:
                pub_date = datetime.fromisoformat(
                    item['published_at'].replace('Z', '+00:00')
                ).date()
                if pub_date < cutoff_date:
                    failed_items.append((item['id'], item['published_at'], pub_date))

            status = "PASSED"
            if failed_items:
                status = "FAILED"
                allure.attach(
                    body="\n".join([f"ID: {i[0]}, дата: {i[1]}" for i in failed_items[:10]]),
                    name="Примеры вакансий вне периода",
                    attachment_type=allure.attachment_type.TEXT
                )

            # ФИНАЛЬНЫЙ ОТЧЁТ — CSV
            allure.attach(
                body=(
                    f"Параметр,Значение\n"
                    f"Запрошенный период (period),{period} дн.\n"
                    f"Дата отсечки (>=),{cutoff_date}\n"
                    f"Всего вакансий по запросу (found),{found}\n"
                    f"Собрано вакансий (items_collected),{items_collected}\n"
                    f"Вакансий вне периода,{len(failed_items)}\n"
                    f"Статус проверки,{status}"
                ),
                name=f"ИТОГ: period={period}",
                attachment_type=allure.attachment_type.CSV
            )

            assert not failed_items, \
                f"Найдено {len(failed_items)} вакансий старше {cutoff_date} (period={period})"

    # ---------- НЕГАТИВНЫЕ ТЕСТЫ (ПОЛНЫЙ ТЕКСТ ОШИБКИ) ----------
    @allure.tag("negative")
    @pytest.mark.parametrize("period", [
        0,
        -1,
        10000000000,
        "invalid",
        3.14
    ])
    @allure.title("Negative. Невалидный period = {period} (проверка текста ошибки)")
    def test_period_negative_full_error(self, api_client, attach_headers_request_response, period):
        """
        Проверяет, что на невалидные period сервер отвечает 400,
        и выводит ПОЛНЫЙ текст ошибки во вложение.
        """
        params = {
            "period": period,
            "professional_role": 124,
            "per_page": 1
        }

        with allure.step(f"Отправить запрос с невалидным period={period}"):
            response = api_client.get_vacancies(**params)
            attach_headers_request_response(
                "GET",
                "https://api.hh.ru/vacancies",
                params,
                dict(api_client.session.headers),
                response
            )

        with allure.step("Получить ошибку 400 Bad Request"):
            assert response.status_code == 400, \
                f"Для невалидного period ожидается 400, получен {response.status_code}"

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
                f"period,{period}\n"
                f"Статус код,{response.status_code}\n"
                f"Ожидаемый статус,400\n"
                f"Результат,PASSED (ошибка корректна)"
            ),
            name=f"Негативный тест: period={period}",
            attachment_type=allure.attachment_type.CSV
        )

    # ---------- ТЕСТ НА ОТСУТСТВИЕ ПАРАМЕТРА PERIOD ----------
    @allure.tag("positive", "edge")
    @allure.title("Positive. Параметр period отсутствует (сбор всех страниц)")
    def test_period_missing_full_collection(self, api_client, attach_headers_request_response):
        """
        Проверяет запрос без period:
          - Собирает все доступные вакансии (до ограничения API).
          - Сохраняет found и количество собранных items.
          - Не применяет фильтр по дате.
        """
        params = {
            "professional_role": 124,
            "per_page": 100,
            "order_by": "publication_time"
        }

        with allure.step("Запрос без параметра period"):
            allure.attach(
                body="\n".join([f"{k}: {v}" for k, v in params.items()]),
                name="Параметры запроса (period отсутствует)",
                attachment_type=allure.attachment_type.TEXT
            )

        all_items, found = self._get_all_vacancies(api_client, params.copy())
        items_collected = len(all_items)

        with allure.step("Проверка получения данных"):
            assert items_collected > 0, "Не получено ни одной вакансии"
            assert found > 0, "API вернул found=0"

        with allure.step("Итоговый отчёт"):
            allure.attach(
                body=(
                    f"Параметр,Значение\n"
                    f"Всего вакансий по запросу (found),{found}\n"
                    f"Собрано вакансий (items_collected),{items_collected}\n"
                    f"Статус,PASSED (данные получены)"
                ),
                name="ИТОГ: запрос без period",
                attachment_type=allure.attachment_type.CSV
            )

    # ---------- СРАВНЕНИЕ FOUND ДЛЯ РАЗНЫХ ПЕРИОДОВ ----------
    @allure.tag("positive", "comparison")
    @allure.title("Positive. Сравнение found для периодов 1, 7, 30 (логика фильтрации)")
    def test_period_found_monotonicity(self, api_client):
        """
        Выполняет три быстрых запроса (per_page=1) для получения found
        и проверяет, что количество вакансий растёт с увеличением периода:
        found(1) <= found(7) <= found(30)
        """
        periods = [1, 7, 30]
        found_values = {}

        with allure.step("Выполнить запросы для получения found (без выгрузки всех страниц)"):
            for period in periods:
                params = {
                    "period": period,
                    "professional_role": 124,
                    "per_page": 1  # достаточно для получения поля found
                }
                response = api_client.get_vacancies(**params)
                if response.status_code == 200:
                    data = response.json()
                    found_values[period] = data.get('found', 0)
                else:
                    found_values[period] = -1
                    allure.attach(
                        body=f"period={period}: статус {response.status_code}",
                        name="Ошибка при получении found",
                        attachment_type=allure.attachment_type.TEXT
                    )

        with allure.step("Сформировать отчёт со сравнением"):
            allure.attach(
                body=(
                    f"Период,Найдено вакансий (found)\n"
                    f"1 день,{found_values.get(1, 'N/A')}\n"
                    f"7 дней,{found_values.get(7, 'N/A')}\n"
                    f"30 дней,{found_values.get(30, 'N/A')}"
                ),
                name="Сравнение found по периодам",
                attachment_type=allure.attachment_type.CSV
            )

        with allure.step("Проверить монотонность"):
            f1 = found_values.get(1, 0)
            f7 = found_values.get(7, 0)
            f30 = found_values.get(30, 0)

            assert f1 <= f7, f"За 1 день ({f1}) вакансий больше, чем за 7 дней ({f7}) — фильтрация не работает"
            assert f7 <= f30, f"За 7 дней ({f7}) вакансий больше, чем за 30 дней ({f30}) — фильтрация не работает"