import requests
import pytest
import allure

@allure.feature("Smoke API")
@allure.story("Smoke: API is alive")
@pytest.mark.smoke
def test_api_is_alive():
    response = requests.get("https://api.hh.ru/status")
    assert response.status_code == 200
