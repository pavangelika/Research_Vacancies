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

### 🚀 Быстрый старт


### 🛠️ Стек технологий
* Парсинг API HH и создание БД PostgreSQL
* Анализ и работа с PostgreSQL + SQL
* Docker + Git + GitHub Actions (CI pipeline)
* Тестирование API: smoke, contract, regress
* Ручное тестирование API: Postman + Newman
* Автотестирование API: Python + Pytest + Allure 

### 📁 Структура проекта
[Docker-образ с тестами, скриптами и Allure]
         |
         v
[CI Runner (GitLab)]
         |
         +-- запуск по расписанию (cron)
         |
         v
[Контейнер: pytest + Allure]
         |
         +-- сохраняет allure-results
         |
         v
[Генерация отчёта Allure с историей]
         |
         v
[Публикация статического отчёта (Nginx/S3/GitHub Pages)]

### 🗄️ Схема базы данных

### 🐍 Python: что тестируем

### 📬 Postman: что тестируем

### 🔍 Контракт (пример schema)

### 🐳 Docker Desktop

### 📊 SQL аналитика

### 🤖 GitHub Actions (CI)

### 📈 Автоотчет

## Playwright UI smoke

UI-тесты встроены в текущий `pytest`-проект и запускаются отдельно от API-набора.

### 1. Установить зависимости и браузер

```powershell
pip install -r requirements.txt
python -m playwright install chromium
```

### 2. Добавить UI-конфиг в `.env`

```env
UI_BASE_URL=https://example.com
UI_EXPECTED_TITLE=Example Domain
UI_READY_SELECTOR=body
UI_PRIMARY_LINK_SELECTOR=a
UI_SMOKE_PATHS=/,/docs
```

Минимально обязателен только `UI_BASE_URL`. Остальные параметры опциональны и нужны для более точных smoke-проверок.

### 3. Локальный запуск

Headless smoke:

```powershell
pytest tests/ui -m "ui and smoke" --browser chromium --tracing retain-on-failure --video retain-on-failure --screenshot only-on-failure --output test-results --html=reports/ui/ui-report.html --self-contained-html --alluredir=allure-results-ui
```

Headed/debug:

```powershell
$env:PWDEBUG="1"
pytest tests/ui -m "ui and smoke" --browser chromium --headed --tracing on --video on --screenshot on --output test-results
```

Просмотр trace:

```powershell
python -m playwright show-trace .\test-results\<trace-folder>\trace.zip
```

### 4. Артефакты

- `test-results/` — trace, video, screenshots Playwright
- `reports/ui/ui-report.html` — HTML-отчёт
- `allure-results-ui/` — результаты для Allure
