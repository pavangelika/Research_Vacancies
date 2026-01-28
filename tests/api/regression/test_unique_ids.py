import requests
import pytest
import allure

@allure.feature("Regression API")
@allure.story("ID is unique")
@allure.title("ID вакансий уникальный")
@pytest.mark.regression
def test_unique_vacancy_ids():
    """Проверка уникальности ID вакансий"""
    with allure.step("Список уникальных ID равен списку ID"):
        response = requests.get("https://api.hh.ru/vacancies", params={"per_page": 50})
        items = response.json()["items"]

        ids = [item["id"] for item in items]
        assert len(ids) == len(set(ids))
