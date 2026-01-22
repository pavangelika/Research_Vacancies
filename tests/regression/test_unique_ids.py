import requests
import pytest
import allure

@allure.feature("Regression API")
@allure.story("Regression: ID is unique")
@pytest.mark.regression
def test_unique_vacancy_ids():
    """Проверка уникальности ID вакансий"""
    response = requests.get("https://api.hh.ru/vacancies", params={"per_page": 50})
    items = response.json()["items"]

    ids = [item["id"] for item in items]
    assert len(ids) == len(set(ids))
