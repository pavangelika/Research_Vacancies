# Research_Vacancies - API Testing & Automation

### 🎯 Цель проекта
* Тестирование API: smoke, contract
* работа с Postman
* PostgreSQL + SQL аналитика
* Docker
* Git + GitHub Actions (CI pipeline)
* Автоматический сбор данных
* Автоматический отчет о тестировании

### 🧠 Бизнес-идея
1. Получаем вакансии с HH API
2. Сохраняем их в PostgreSQL
3. Тестируем API
4. Анализируем данные SQL‑запросами
5. Запускаем тесты по расписанию
6. Генерируем отчет
7. Все это крутится автоматически через GitHub Actions

### 🌐 Источник данных
#### HH API:  https://api.hh.ru/vacancies

#### Параметры:
* professional_role=34 — Designer
* professional_role=124 — QA
* work_format=REMOTE
* period=1
* per_page=100

### 🚀 Быстрый старт
Запуск тестов
pytest -m smoke
pytest -m contract
pytest -m regression

Запуск автоотчета
pytest -m smoke --alluredir=allure-results
pytest -m contract --alluredir=allure-results
pytest -m regression --alluredir=allure-results
allure serve allure-results


pytest -m smoke --alluredir=allure-results --clean-alluredir
pytest -m contract --alluredir=allure-results --clean-alluredir
pytest -m regression --alluredir=allure-results --clean-alluredir
allure generate allure-results --clean -o allure-report --history=allure-history


### 🛠️ Стек технологий

### 📁 Структура проекта

### 🗄️ Схема базы данных

### 🐍 Сбор вакансий (Python)

### 📬 Postman: что тестируем

### 🔍 Контракт (пример schema)

### 🐳 Docker Desktop
docker exec -it vacancies_postgres psql -U postgres -d vacancies_db

### 📊 SQL аналитика

### 🤖 GitHub Actions (CI)

### 📈 Автоотчет