import allure
import pytest
import requests

BASE_URL = "https://api.hh.ru/vacancies"
HEADERS = {"User-Agent": "Mozilla/5.0 (HH-Test-Automation/1.0)"}

@allure.epic("API HH")
@allure.feature("Просмотр вакансии")
@allure.story("Смоук-тест получения деталей вакансии")
@allure.title("Отправка GET-запроса /vacancies/{id}")
@allure.description("ОР: Ответ сервера 200, ответ содержит все обязательные поля")
@allure.link("https://api.hh.ru/openapi/redoc#tag/Upravlenie-vakansiyami/operation/get-vacancy", name="Документация hh.ru")
@allure.severity(allure.severity_level.CRITICAL)
@allure.tag("smoke", "api", "alive")
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
    with allure.step("Проверить код ответа и ответ сервера"):
        allure.attach(
            body=f"Получен код ответа: {detail_response.status_code}",
            name="Код ответа",
            attachment_type=allure.attachment_type.TEXT
        )

        assert detail_response.status_code == 200, f"Ожидался 200, получено {detail_response.status_code}"
        # Прикрепляем ответ API
        allure.attach(
            body=detail_response.text,
            name="Ответ сервера",
            attachment_type=allure.attachment_type.JSON
        )

    with allure.step("Проверить ответ на наличие обязательных полей"):
        data = detail_response.json()
        required_fields = ["id", "accept_handicapped", "accept_incomplete_resumes", "allow_messages", "alternate_url","apply_alternate_url", "approved", "archived", "area", "description", "driver_license_types", "experience", "has_test", "initial_created_at", "key_skills", "name", "professional_roles", "published_at", "response_letter_required" ]
        for field in required_fields:
              assert field in data, f"Отсутствует поле '{field}' в ответе"

        id = data["id"]
        accept_handicapped = data["accept_handicapped"]
        accept_incomplete_resumes = data["accept_incomplete_resumes"]
        allow_messages = data["allow_messages"]
        alternate_url = data["alternate_url"]
        apply_alternate_url = data["apply_alternate_url"]
        approved = data["approved"]
        archived = data["archived"]
        area = data["area"]
        description = data["description"]
        driver_license_types = data["driver_license_types"]
        experience = data["experience"]
        has_test = data["has_test"]
        initial_created_at = data["initial_created_at"]
        key_skills = data["key_skills"]
        name = data["name"]
        professional_roles = data["professional_roles"]
        published_at = data["published_at"]
        response_letter_required = data["response_letter_required"]


        allure.attach(
            body=f"id={id},\n"
                 f"accept_handicapped={accept_handicapped},\n"
                 f"accept_incomplete_resumes={accept_incomplete_resumes},\n"
                 f"allow_messages = {allow_messages},\n"
                 f"alternate_url = {alternate_url},\n"
                 f"apply_alternate_url={apply_alternate_url}, \n"
                 f"approved={approved}, \n"
                 f"archived={archived},\n"
                 f"area={area},\n"
                 f"description={description},\n"
                 f"driver_license_types={driver_license_types},\n"
                 f"experien={experience},\n"
                 f"has_test={has_test},\n"
                 f"initial_created_at={initial_created_at},\n"
                 f"key_skill={key_skills},\n"
                 f"name={name},\n"
                 f"professional_roles={professional_roles},\n"
                 f"published_at={published_at},\n"
                 f"response_letter_required={response_letter_required}",
            name=f"Проверка наличия обязательных полей",
            attachment_type=allure.attachment_type.JSON

        )




