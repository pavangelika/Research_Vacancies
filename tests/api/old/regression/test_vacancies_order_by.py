import allure
import pytest
import requests

BASE_URL = "https://api.hh.ru/vacancies"
HEADERS = {"User-Agent": "Mozilla/5.0 (-compatible; HH-Testing/1.0)"}

@allure.epic("API HH")
@allure.feature("Поиск вакансий")
@allure.story("Смоук-тест получения списка вакансий c сортировкой по зарплате")
@allure.title("Отправка GET-запроса /vacancies?order_by=salary_desc")
@allure.description("ОР: 200 OK, вакансии отсортированы в порядке убывания, вакансии без указания зп последние в списке")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies", name="Документация hh.ru")
@allure.severity(allure.severity_level.NORMAL)
@allure.tag("regress", "api", "filter")
@pytest.mark.regression
def test_vacancies():
    # Подготовка параметров
    params = {
        "host": "hh.ru",
        "order_by": "salary_desc"
    }


    with allure.step("Отправить GET-запрос /vacancies?order_by=salary_desc"):
        # Прикрепляем параметры запроса
        allure.attach(
            body=str(params),
            name="Параметры запроса",
            attachment_type=allure.attachment_type.TEXT
        )
        response = requests.get(BASE_URL, params=params, headers=HEADERS)

    with allure.step("Проверить код ответа и ответ серавера "):
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

    with allure.step("Проверить ответ на наличие обязательных полей"):
        data = response.json()

        required_fields = ["items", "found", "page", "pages", "per_page"]
        for field in required_fields:
            assert field in data, f"Отсутствует поле '{field}' в ответе"

        assert data["found"] > 0, "Нет вакансий для указанных параметров"

        items = data["items"]
        count_id = len(items)
        per_page = data["per_page"]
        pages = data["pages"]
        page= data["page"]
        found = data["found"]


        allure.attach(
            body=f"items={count_id}, \n"
                 f"found = {found},\n"
                 f"page = {page}, \n"
                 f"pages = {pages}, \n"
                 f"per_page = {per_page}",
            name=f"Проверка наличия обязательных полей",
            attachment_type=allure.attachment_type.TEXT
        )

    with allure.step("Проверяем сортировку по зарплате"):
        """Проверка, что зарплаты отсортированы по убыванию (при наличии)"""
        items = data.get("items", [])
        salaries = []

        for item in items:
            salary = item.get("salary")
            if salary and salary.get("from") is not None:
                if salary.get("currency") == "RUB":
                    salaries.append(salary["from"])

        # Проверяем, что список зарплат отсортирован по убыванию
        assert salaries == sorted(salaries, reverse=True), "Сортировка зарплаты не по убыванию"










