# Research_Vacancies - API Testing & Automation

### 🧠 Идея
1. Получаем вакансии с HH API
2. Сохраняем их в PostgreSQL
3. Тестируем API
4. Тестируем БД
5. Запускаем тесты по расписанию
6. Генерируем отчет о тестировании с историей
7. Все это крутится автоматически через GitHub Actions

### 🌐 Источник данных
#### HH API:  https://api.hh.ru/vacancies
параметры запроса:
host=hh.ru
per_page=100
page=0
period=1
order_by=salary_desc
professional_role=124
work_format=REMOTE

### 🚀 Быстрый старт

Ручной запуск автоотчета с историей

Первый запуск и создание отчета о тестировании
pytest -m smoke --alluredir=allure-results
pytest -m contract --alluredir=allure-results
pytest -m regression --alluredir=allure-results
allure serve allure-results
Создание папки для хранения истории
allure generate allure-results -o allure-report --clean

Второй и следующие запуски
cp -r allure-report/history allure-results/

Copy-Item -Recurse -Force "allure-report/history" "allure-results/" -ErrorAction Ignore
pytest -m smoke --alluredir=allure-results
pytest -m contract --alluredir=allure-results
pytest -m regression --alluredir=allure-results
allure generate allure-results -o allure-report --clean
allure serve allure-results



### 🛠️ Стек технологий
* Парсинг API HH и создание БД PostgreSQL
* Анализ и работа с PostgreSQL + SQL
* Docker + Git + GitHub Actions (CI pipeline)
* Тестирование API: smoke, contract, regress
* Ручное тестирование API: Postman + Newman
* Автотестирование API: Python + Pytest + Allure 

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