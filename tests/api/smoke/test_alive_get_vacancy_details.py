import allure
import pytest
import requests

BASE_URL = "https://api.hh.ru/vacancies"
HEADERS = {"User-Agent": "Mozilla/5.0 (HH-Test-Automation/1.0)"}

@allure.epic("API HH")
@allure.feature("Поиск вакансий")
@allure.story("Смоук-тест получения деталей вакансии")
@allure.title("Отправка GET-запроса /vacancies/{id} с валидными данными")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies", name="Документация hh.ru")
@allure.severity(allure.severity_level.CRITICAL)
@allure.tag("smoke", "api", "detail")
@pytest.mark.smoke
def test_vacancy_detail():
    # Шаг 1: Получаем список вакансий
    with allure.step("Запросить список вакансий /vacancies"):
        list_params = {
            "host": "hh.ru",
            "per_page": 1  # Получаем только первую вакансию
        }
        list_response = requests.get(
            BASE_URL,
            params=list_params,
            headers=HEADERS
        )

        # Прикрепляем параметры и ответ
        allure.attach(
            body=str(list_params),
            name="Параметры запроса списка",
            attachment_type=allure.attachment_type.TEXT
        )
        allure.attach(
            body=f"Получен код ответа: {list_response.status_code}",
            name="Код ответа",
            attachment_type=allure.attachment_type.TEXT
        )
        allure.attach(
            body=list_response.text,
            name="Ответ списка вакансий",
            attachment_type=allure.attachment_type.JSON
        )

        # Проверяем, что список не пуст
        assert list_response.status_code == 200, "Ошибка при получении списка вакансий"
        vacancy_list = list_response.json()
        assert vacancy_list["found"] > 0, "Нет вакансий для теста"

        # Шаг 2: Извлекаем ID первой вакансии
        vacancy_id = vacancy_list["items"][0]["id"]
        allure.attach(
            body=vacancy_id,
            name="ID выбранной вакансии",
            attachment_type=allure.attachment_type.TEXT
        )

    # Шаг 3: Запрашиваем детали вакансии
    with allure.step(f"Запросить детали вакансии /vacancies/{vacancy_id}"):
        detail_response = requests.get(
            f"{BASE_URL}/{vacancy_id}",
            headers=HEADERS
        )

    # Шаг 4: Валидация ответа
    with allure.step("Проверить код ответа"):
        allure.attach(
            body=f"Получен код ответа: {detail_response.status_code}",
            name="Код ответа",
            attachment_type=allure.attachment_type.TEXT
        )
        allure.attach(
            body=detail_response.text,
            name="Ответ деталей вакансии",
            attachment_type=allure.attachment_type.JSON
        )

        assert detail_response.status_code == 200, f"Ожидался 200, получено {detail_response.status_code}"


