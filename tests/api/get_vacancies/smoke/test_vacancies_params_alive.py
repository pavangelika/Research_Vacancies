import allure
import pytest
import requests

BASE_URL = "https://api.hh.ru/vacancies"
HEADERS = {"User-Agent": "Mozilla/5.0 (-compatible; HH-Testing/1.0)"}

@allure.epic("API HH")
@allure.feature("Поиск вакансий")
@allure.story("Смоук-тест получения списка вакансий c параметрами фильтрации")
@allure.title("Отправка GET-запроса /vacancies с дополнительными параметрами")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies", name="Документация hh.ru")
@allure.severity(allure.severity_level.CRITICAL)
@allure.tag("smoke", "api", "alive")
@pytest.mark.smoke
def test_vacancies():
    # Подготовка параметров
    params = {
        "host": "hh.ru",
        "per_page": 100,
        "page": 0,
        "period": 1,
        "order_by": "salary_desc",
        "professional_role": 124,
        "work_format": "REMOTE",
    }


    with allure.step("Отправить GET-запрос /vacancies с параметрами"):
        # Прикрепляем параметры запроса
        allure.attach(
            body=str(params),
            name="Параметры запроса",
            attachment_type=allure.attachment_type.TEXT
        )
        response = requests.get(BASE_URL, params=params, headers=HEADERS)



    with allure.step("Проверить код ответа и ответ сервера "):
        allure.attach(
            body=f"Получен код ответа: {response.status_code}",
            name="Код ответа",
            attachment_type=allure.attachment_type.TEXT
        )
        assert response.status_code == 200, f"Ожидался 200, получено {response.status_code}"

        # Прикрепляем ответ API
        allure.attach(
            body=response.text,
            name="Ответ сервера",
            attachment_type=allure.attachment_type.JSON
        )











