# Research_Vacancies

Проект для работы с вакансиями HH: сбор данных, хранение, API-тесты, локальный backend для отчетов и UI-регрессии для фронтенда отчета.

<!-- Replace <OWNER> and <REPO> with the real GitHub repository path if needed. -->
[![CI Safe Suite](https://github.com/<OWNER>/<REPO>/actions/workflows/CI.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/CI.yml)
[![External HH API Suite](https://github.com/<OWNER>/<REPO>/actions/workflows/run-tests.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/run-tests.yml)

## Stack

- Python
- Pytest
- FastAPI
- PostgreSQL
- PowerShell
- Node.js для локальных UI regression tests

## Main Test Modes

В репозитории сейчас есть три основных набора тестов:

- `tests/backend` — локальные backend/unit/contract тесты проекта
- `tests/ui/*.test.js` — локальные JS regression tests для report UI
- `tests/api` — live-тесты против внешнего `https://api.hh.ru`

По умолчанию внешний HH API suite отключен и запускается только по явному opt-in через `RUN_EXTERNAL_API_TESTS=1`.

## CI

В репозитории настроены два GitHub Actions workflow:

- `CI Safe Suite` — основной безопасный workflow для `push` и `pull_request`
- `External HH API Suite` — ручной workflow для live-тестов против `api.hh.ru`

`CI Safe Suite` запускает только локально безопасные проверки:

- `pytest tests/test_external_api_gate.py -q`
- `pytest tests/backend -q`
- `.\scripts\test_local.ps1 ui`

`External HH API Suite` запускается только вручную через `workflow_dispatch` и выставляет `RUN_EXTERNAL_API_TESTS=1` для `tests/api`.

## Local Test Runner

Для удобного локального запуска используй:

```powershell
.\scripts\test_local.ps1 help
```

Доступные команды:

- `backend` — запускает `pytest tests/backend -q`
- `ui` — запускает все `node tests/ui/*.test.js`
- `api-external` — запускает `pytest tests/api -q`, но только если `RUN_EXTERNAL_API_TESTS=1`
- `all-safe` — запускает безопасный локальный набор: gate tests, backend, UI
- `all` — запускает `all-safe`, затем `api-external`
- `help` — печатает справку

## Examples

Безопасный локальный прогон:

```powershell
.\scripts\test_local.ps1 all-safe
```

Только backend:

```powershell
.\scripts\test_local.ps1 backend
```

Только UI regression tests:

```powershell
.\scripts\test_local.ps1 ui
```

Запуск внешнего HH API suite:

```powershell
$env:RUN_EXTERNAL_API_TESTS="1"
.\scripts\test_local.ps1 api-external
```

Полный прогон:

```powershell
$env:RUN_EXTERNAL_API_TESTS="1"
.\scripts\test_local.ps1 all
```

## Direct Commands

Если нужно запускать наборы напрямую:

```powershell
pytest tests/backend -q
pytest tests/test_external_api_gate.py -q
pytest tests/api -q
```

Для UI regression tests:

```powershell
Get-ChildItem tests\ui\*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
```

## Notes

- В `pytest.ini` отключен автоплагин `playwright`, потому что внешний `pytest-playwright` в текущем окружении ломал запуск обычного `pytest`.
- `tests/api` помечаются как `external` и пропускаются по умолчанию.
- Локальный `pytest -q` должен проходить без доступа в интернет, кроме явно включенного внешнего suite.
