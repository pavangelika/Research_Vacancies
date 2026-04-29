from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_runtime_source_files_do_not_contain_known_mojibake_snippets():
    checks = {
        "scripts/db.py": [
            "Подключение к БД по умолчанию успешно",
            "База данных",
            "Проверка таблицы get_vacancies...",
            "Сохранение вакансий в БД...",
            "Проверка статуса вакансий на архивирование/удаление...",
            "Инициализация таблицы employers...",
        ],
        "backend/services/analytics_service.py": [
            "\"label\": \"Роли\"",
            "\"label\": \"Всего вакансий\"",
            "\"label\": \"Активные вакансии\"",
            "\"label\": \"Зарплатные срезы\"",
            "\"Не указан\"",
            "startswith(\"За \")",
            "\"Всего\"",
            "\"—\"",
        ],
    }

    for relative_path, expected_snippets in checks.items():
        content = (PROJECT_ROOT / relative_path).read_text(encoding="utf-8")
        for snippet in expected_snippets:
            assert snippet in content, f"Missing expected UTF-8 snippet in {relative_path}: {snippet}"


def test_dockerfile_sets_utf8_locale_for_runtime_logs():
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "ENV LANG=C.UTF-8" in dockerfile
    assert "ENV LC_ALL=C.UTF-8" in dockerfile
