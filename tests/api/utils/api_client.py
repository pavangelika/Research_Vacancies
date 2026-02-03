import requests
import time


class HHAPIClient:
    def __init__(self, base_url="https://api.hh.ru", timeout=10):
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "HH-API-Tester/1.0",
            "Accept": "application/json"
        })

    def get_vacancies(self, **params):
        """GET запрос к /vacancies"""
        url = f"{self.base_url}/vacancies"
        return self.session.get(url, params=params, timeout=self.timeout)
    # https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies

    def get_vacancy_detail(self, vacancy_id):
        """GET запрос к /vacancies/{id}"""
        url = f"{self.base_url}/vacancies/{vacancy_id}"
        return self.session.get(url, timeout=self.timeout)
    # https://api.hh.ru/openapi/redoc#tag/Upravlenie-vakansiyami/operation/get-vacancy

    def get_employers(self):
        """GET запрос к /employers"""
        url = f"{self.base_url}/employers"
        return self.session.get(url, timeout=self.timeout)
    # https://api.hh.ru/openapi/redoc#tag/Rabotodatel

    def get_employer_detail(self, employer_id):
        """GET запрос к /employers/{employer_id}"""
        url = f"{self.base_url}/employers/{employer_id}"
        return self.session.get(url, timeout=self.timeout)
    # https://api.hh.ru/openapi/redoc#tag/Rabotodatel/operation/get-employer-info

    def get_resumes(self):
        """GET запрос к /resumes"""
        url = f"{self.base_url}/resumes"
        return self.session.get(url, timeout=self.timeout)
    # https://api.hh.ru/openapi/redoc#tag/Poisk-rezyume/operation/search-for-resumes

