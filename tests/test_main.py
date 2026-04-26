from pathlib import Path
import sys
import importlib
from datetime import datetime, timedelta, timezone


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def test_main_skips_archive_check_when_fetch_is_incomplete(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    calls = {
        "create_database": 0,
        "init_table": 0,
        "save_vacancies": [],
        "update_archived_status": 0,
        "init_employers": 0,
        "update_employers": [],
    }

    monkeypatch.setattr(app_main, "create_database", lambda: calls.__setitem__("create_database", calls["create_database"] + 1))
    monkeypatch.setattr(app_main, "init_table", lambda: calls.__setitem__("init_table", calls["init_table"] + 1))
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: calls["save_vacancies"].append(vacancies))
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: calls.__setitem__("update_archived_status", calls["update_archived_status"] + 1))
    monkeypatch.setattr(app_main, "init_employers", lambda: calls.__setitem__("init_employers", calls["init_employers"] + 1))
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: calls["update_employers"].append(vacancies))
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 0)
    monkeypatch.setattr(app_main, "set_hh_search_cooldown_state", lambda cooldown_until, failure_count: None)
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=False),
    )

    app_main.main()

    assert calls["create_database"] == 1
    assert calls["init_table"] == 1
    assert calls["save_vacancies"] == [[]]
    assert calls["update_archived_status"] == 0
    assert calls["init_employers"] == 1
    assert calls["update_employers"] == [[]]


def test_main_advances_role_batch_offset_only_after_successful_fetch(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    set_offset_calls = []

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 4)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: set_offset_calls.append(offset))
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 0)
    monkeypatch.setattr(app_main, "set_hh_search_cooldown_state", lambda cooldown_until, failure_count: None)
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["36", "10", "12"],
            next_offset=2,
            total_roles=5,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=True),
    )

    app_main.main()

    assert set_offset_calls == [2]


def test_main_does_not_advance_role_batch_offset_after_failed_fetch(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    set_offset_calls = []

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 4)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: set_offset_calls.append(offset))
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 0)
    monkeypatch.setattr(app_main, "set_hh_search_cooldown_state", lambda cooldown_until, failure_count: None)
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["36", "10", "12"],
            next_offset=2,
            total_roles=5,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=False),
    )

    app_main.main()

    assert set_offset_calls == []


def test_main_skips_hh_fetch_when_search_cooldown_is_active(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    future_cooldown = datetime.now(timezone.utc) + timedelta(hours=2)
    get_vacancies_calls = []

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: future_cooldown)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 0)
    monkeypatch.setattr(app_main, "set_hh_search_cooldown_state", lambda cooldown_until, failure_count: None)
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: get_vacancies_calls.append(professional_roles),
    )

    app_main.main()

    assert get_vacancies_calls == []


def test_main_sets_search_cooldown_after_failed_fetch(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    cooldown_calls = []

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 0)
    monkeypatch.setattr(
        app_main,
        "set_hh_search_cooldown_state",
        lambda cooldown_until, failure_count: cooldown_calls.append((cooldown_until, failure_count)),
    )
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=False),
    )

    app_main.main()

    assert len(cooldown_calls) == 1
    assert isinstance(cooldown_calls[0][0], datetime)
    assert cooldown_calls[0][0] > datetime.now(timezone.utc)
    assert cooldown_calls[0][1] == 1


def test_main_clears_search_cooldown_after_successful_fetch(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    clear_calls = []

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: datetime.now(timezone.utc) - timedelta(minutes=1))
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 2)
    monkeypatch.setattr(app_main, "set_hh_search_cooldown_state", lambda cooldown_until, failure_count: None)
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: clear_calls.append(True))
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=True),
    )

    app_main.main()

    assert clear_calls == [True]


def test_main_escalates_search_cooldown_after_repeated_failed_fetches(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    recorded = {}

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 1)
    monkeypatch.setattr(
        app_main,
        "set_hh_search_cooldown_state",
        lambda cooldown_until, failure_count: recorded.update(
            {"cooldown_until": cooldown_until, "failure_count": failure_count}
        ),
    )
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=False),
    )
    monkeypatch.setenv("HH_BLOCK_COOLDOWN_SCHEDULE_SECONDS", "3600,10800,21600")

    before = datetime.now(timezone.utc)
    app_main.main()
    after = datetime.now(timezone.utc)

    assert recorded["failure_count"] == 2
    min_expected = before + timedelta(seconds=10800)
    max_expected = after + timedelta(seconds=10800)
    assert min_expected <= recorded["cooldown_until"] <= max_expected


def test_main_caps_search_cooldown_at_last_schedule_slot(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    recorded = {}

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 5)
    monkeypatch.setattr(
        app_main,
        "set_hh_search_cooldown_state",
        lambda cooldown_until, failure_count: recorded.update(
            {"cooldown_until": cooldown_until, "failure_count": failure_count}
        ),
    )
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: None)
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=False),
    )
    monkeypatch.setenv("HH_BLOCK_COOLDOWN_SCHEDULE_SECONDS", "3600,10800,21600")

    before = datetime.now(timezone.utc)
    app_main.main()
    after = datetime.now(timezone.utc)

    assert recorded["failure_count"] == 6
    min_expected = before + timedelta(seconds=21600)
    max_expected = after + timedelta(seconds=21600)
    assert min_expected <= recorded["cooldown_until"] <= max_expected


def test_main_successful_fetch_clears_cooldown_and_failure_count(monkeypatch):
    app_main = importlib.import_module("main")
    app_main = importlib.reload(app_main)
    fetch_vacancies = importlib.import_module("scripts.fetch_vacancies")

    clear_calls = []

    monkeypatch.setattr(app_main, "create_database", lambda: None)
    monkeypatch.setattr(app_main, "init_table", lambda: None)
    monkeypatch.setattr(app_main, "save_vacancies", lambda vacancies: None)
    monkeypatch.setattr(app_main, "update_archived_status", lambda current_ids: None)
    monkeypatch.setattr(app_main, "init_employers", lambda: None)
    monkeypatch.setattr(app_main, "update_employers", lambda vacancies: None)
    monkeypatch.setattr(app_main, "get_role_batch_offset", lambda: 0)
    monkeypatch.setattr(app_main, "set_role_batch_offset", lambda offset: None)
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_until", lambda: datetime.now(timezone.utc) - timedelta(minutes=1))
    monkeypatch.setattr(app_main, "get_hh_search_cooldown_failure_count", lambda: 3)
    monkeypatch.setattr(app_main, "set_hh_search_cooldown_state", lambda cooldown_until, failure_count: None)
    monkeypatch.setattr(app_main, "clear_hh_search_cooldown", lambda: clear_calls.append(True))
    monkeypatch.setattr(
        app_main,
        "build_role_batch",
        lambda professional_roles, batch_size, offset: fetch_vacancies.RoleBatchSelection(
            selected_roles=["10"],
            next_offset=1,
            total_roles=28,
        ),
    )
    monkeypatch.setattr(
        app_main,
        "get_vacancies",
        lambda professional_roles: fetch_vacancies.VacancyFetchResult(vacancies=[], complete=True),
    )

    app_main.main()

    assert clear_calls == [True]
