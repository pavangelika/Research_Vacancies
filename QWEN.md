  # QWEN.md — Research_Vacancies

## Обзор проекта

**Research_Vacancies** — это проект для автоматизированного сбора, хранения и тестирования вакансий с HH.ru API. Проект включает:

1. **Парсинг HH API** — сбор вакансий по заданным профессиональным ролям с фильтрацией по формату работы (удалённая/офис/гибрид)
2. **Хранение в PostgreSQL** — сохранение вакансий, работодателей и аналитики
3. **API-тестирование** — smoke, contract и регрессионные тесты HH API через pytest + Allure
4. **UI-тестирование** — smoke-тесты через Playwright
5. **Генерация отчётов** — аналитические отчёты (Jinja2 + HTML) с визуализацией данных
6. **CI/CD** — автоматический запуск тестов через GitHub Actions (cron + push/PR)

### Стек технологий

- **Python 3.13** (Docker-образ `python:3.13-slim`)
- **PostgreSQL 15**
- **pytest** + **Allure** — тестирование API
- **Playwright** — UI smoke-тесты
- **Docker + Docker Compose** — контейнеризация
- **GitHub Actions** — CI pipeline
- **Jinja2** — генерация HTML-отчётов
- **requests**, **psycopg2-binary**, **jsonschema**, **beautifulsoup4**

## Структура проекта

```
Research_Vacancies/
├── main.py                      # Точка входа: сбор вакансий → сохранение в БД
├── docker-compose.yml           # 5 сервисов: postgres, mcp, app, report-generator, report-to-db
├── Dockerfile                   # Образ для app и report-сервисов
├── requirements.txt             # Python-зависимости
├── pytest.ini                   # Конфигурация pytest (маркеры, пути тестов)
├── mcp.yaml                     # Конфигурация Postgres MCP-сервера
│
├── scripts/
│   ├── db.py                    # Работа с БД: создание БД, таблиц, сохранение вакансий
│   ├── fetch_vacancies.py       # Сбор вакансий с HH API (пагинация, retry, rate limiting)
│   ├── generate_report.py       # Генерация аналитических отчётов (Jinja2 + SQL)
│   ├── report_server.py         # HTTP-сервер для отправки результатов в БД
│   ├── logger.py                # Настройка логирования
│   └── professional_roles.py    # Сохранение профессиональных ролей в JSON
│
├── tests/
│   ├── api/
│   │   ├── conftest.py          # Фикстуры: api_client, attach_headers, filter_params
│   │   ├── vacancies/           # Тесты для /vacancies (smoke, contract, filter)
│   │   │   ├── test_vacancies_smoke.py
│   │   │   ├── test_vacancies_contract.py
│   │   │   ├── test_vacancies_filter_per_page.py
│   │   │   └── test_vacancies_filter_period.py
│   │   ├── vacancy/             # Тесты для /vacancies/{id} (smoke, contract)
│   │   │   ├── test_vacancy_smoke.py
│   │   │   └── test_vacancy_contract.py
│   │   └── utils/               # Утилиты (API-клиент и др.)
│   └── ui/                      # Playwright UI smoke-тесты
│
├── reports/
│   ├── templates/               # Jinja2 шаблоны для отчётов
│   └── static/                  # Статические файлы (CSS, JS)
│
├── data/                        # JSON-данные (professional_roles.json и др.)
├── analys/                      # SQL-аналитика (текстовые файлы с запросами)
├── backups/                     # Бэкапы БД
├── .github/workflows/
│   ├── CI.yml                   # Smoke + Contract тесты при push/PR
│   └── run-tests.yml            # Nightly regression + Allure history (cron: 0 3 * * *)
```

## Схема базы данных

Основная таблица `get_vacancies`:
- `id` (TEXT, PK), `url`, `professional_role`, `name`, `employer`, `city`
- `salary_from`, `salary_to`, `currency`
- `experience`, `skills`, `schedule`, `requirement`, `responsibility`, `description`
- `published_at`, `created_at`, `updated_at`
- `archived`, `archived_at`
- `has_test`, `response_letter_required`, `apply_alternate_url`
- Трекинг-поля: `hr_name`, `interview_date`, `interview_stages`, `company_type`, `result`, `feedback`, `offer_salary`, `pros`, `cons`, `send_resume`, `resume_at`

Таблица `employers`:
- `employer_id`, `name` (PK), `inn`, `accredited_it_employer`, `rating`, `trusted`, `employer_url`, `type`, `checked_at`, `registration_at`

## Сборка и запуск

### Предварительные требования

- Docker + Docker Compose
- Python 3.11+
- Файл `.env` с переменными:
  ```env
  DB_USER=postgres
  DB_PASS=password
  DB_NAME=mydb
  DB_HOST=postgres
  DB_PORT=5432
  HH_API_URL=https://api.hh.ru/vacancies
  PROFESSIONAL_ROLES=10,12,25,34,36,40,73,96,104,107,112,113,114,116,121,124,125,126,140,148,150,155,156,157,160,163,164,165
  ```

### Docker Compose

```bash
docker-compose up -d
```

Запускает 5 сервисов:
- **postgres** — PostgreSQL 15
- **mcp** — Postgres MCP-сервер (порт 8080)
- **app** — основной цикл сбора вакансий (каждый час)
- **report-generator** — генерация отчётов (каждый час)
- **report-to-db** — HTTP-сервер отправки результатов в БД (порт 9000)

### Локальный запуск приложения

```bash
pip install -r requirements.txt
python main.py
```

### Запуск тестов

**API-тесты (все):**
```bash
pytest tests/api --alluredir=allure-results
```

**Smoke-тесты:**
```bash
pytest -m smoke --alluredir=allure-results-smoke
```

**Contract-тесты:**
```bash
pytest -m contract --alluredir=allure-results-contract
```

**Regression-тесты:**
```bash
pytest -m regression --alluredir=allure-results
```

**UI smoke-тесты (Playwright):**
```bash
# Предварительно установить браузер:
python -m playwright install chromium

# Запуск headless:
pytest tests/ui -m "ui and smoke" --browser chromium --screenshot only-on-failure --output test-results
```

### Генерация Allure-отчёта

```bash
allure generate allure-results --clean -o allure-report
allure open allure-report
```

## Маркеры pytest

Определены в `pytest.ini`:

| Маркер | Описание |
|--------|----------|
| `smoke` | Smoke-тесты |
| `contract` | Contract-тесты (схема JSON) |
| `regression` | Регрессионные тесты |
| `ui` | UI-тесты (Playwright) |
| `positive` | Позитивные тесты |
| `negative` | Негативные тесты |
| `vacancy` | Тесты для `/vacancies/{vacancy_id}` |
| `vacancies` | Тесты для `/vacancies` (поиск) |

## CI/CD (GitHub Actions)

### CI.yml — при push/PR
- Запускает **smoke** и **contract** тесты последовательно
- Артефакты загружаются как `allure-results-smoke` и `allure-results-contract`

### run-tests.yml — nightly (cron: `0 3 * * *`)
- Запускает **regression** тесты
- Устанавливает Allure бинарник
- Поддерживает историю Allure через ветку `gh-pages`
- Деплоит отчёт на GitHub Pages

## Генерация отчётов

Скрипт `scripts/generate_report.py` формирует аналитические HTML-отчёты:
- Динамика вакансий по месяцам/ролям/опыту
- Активность публикаций по дням недели
- Навыки по уровням опыта
- Анализ зарплат (медиана, перцентили, топ-навыки)
- Анализ работодателей

Используются Jinja2-шаблоны из `reports/templates/` и SQL-запросы к PostgreSQL.

## Конвенции разработки

- **Именование тестов:** файлы `test_*.py`, классы `Test*`, функции `test_*`
- **Фикстуры:** `conftest.py` с общим клиентом API (`HHAPIClient`)
- **Allure:** каждый тест прикрепляет request/response headers и время ответа
- **Работа с БД:** через `psycopg2` с контекстными менеджерами (`with conn.cursor() as cur`)
- **Логирование:** стандартный `logging`, logger по имени модуля
- **Rate limiting:** задержки между запросами к HH API (`vacancy_delay=1.2s`, `request_delay=0.2s`)
- **Retry логика:** экспоненциальный backoff при 403/429 ошибках
