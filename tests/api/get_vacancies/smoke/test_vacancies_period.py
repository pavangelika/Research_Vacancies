import allure
import pytest
import requests

BASE_URL = "https://api.hh.ru/vacancies"
HEADERS = {"User-Agent": "Mozilla/5.0 (-compatible; HH-Testing/1.0)"}

@allure.epic("API HH")
@allure.feature("Поиск вакансий")
@allure.story("Смоук-тест получения списка вакансий за выбранное количество дней ")
@allure.title("Отправка GET-запроса /vacancies?period=1")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies", name="Документация hh.ru")
@allure.severity(allure.severity_level.NORMAL)
@allure.tag("smoke", "api", "filter")
@pytest.mark.smoke
def test_vacancies():
    # Подготовка параметров
    params = {
        "host": "hh.ru",
        "period": 1
    }


    with allure.step("Отправить GET-запрос /vacancies?period=1"):
        # Прикрепляем параметры запроса
        allure.attach(
            body=str(params),
            name="Параметры запроса",
            attachment_type=allure.attachment_type.TEXT
        )
        response = requests.get(BASE_URL, params=params, headers=HEADERS)



    with allure.step("Проверить код ответа "):
        allure.attach(
            body=f"Получен код ответа: {response.status_code}",
            name="Код ответа",
            attachment_type=allure.attachment_type.TEXT
        )
        assert response.status_code == 200, f"Ожидался 200, получено {response.status_code}"

    with allure.step("Проверить структуру ответа на наличие обязательных полей"):
        # Прикрепляем ответ API
        allure.attach(
            body=response.text,
            name="Ответ сервера",
            attachment_type=allure.attachment_type.JSON
        )
        data = response.json()

        required_fields = ["items", "found", "page", "pages", "per_page"]
        for field in required_fields:
            assert field in data, f"Отсутствует поле '{field}' в ответе"

        assert data["found"] > 0, "Нет вакансий для указанных параметров"





