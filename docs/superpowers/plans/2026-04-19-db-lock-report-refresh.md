# DB Lock Report Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent report refresh stalls caused by long-lived DB transactions and runtime schema DDL in normal request paths.

**Architecture:** Keep schema enforcement in initialization code only, and ensure `update_archived_status()` reads candidate ids in one short transaction before doing slow HH API work. Apply deletes and archive updates in separate short transactions so readers and writers do not block the report generator.

**Tech Stack:** Python, psycopg2, pytest, monkeypatch-based unit tests

---

### Task 1: Add regression coverage

**Files:**
- Modify: `tests/test_db_connection_pool.py`
- Test: `tests/test_db_connection_pool.py`

- [ ] Add a failing test proving `get_sent_resume_vacancies()` does not execute `ALTER TABLE`.
- [ ] Run `pytest tests/test_db_connection_pool.py -k "runtime_ddl or releases_initial_connection" -v` and confirm the new assertion fails before the code change.

### Task 2: Remove runtime DDL and preserve short transactions

**Files:**
- Modify: `scripts/db.py`
- Test: `tests/test_db_connection_pool.py`

- [ ] Remove `ensure_get_vacancies_tracking_columns()` calls from request-time read/write helpers.
- [ ] Keep schema setup in initialization code only.
- [ ] Preserve `update_archived_status()` behavior with short DB transactions around select/delete/update work only.

### Task 3: Verify the fix

**Files:**
- Modify: `tests/test_db_connection_pool.py`
- Modify: `scripts/db.py`
- Test: `tests/test_db_connection_pool.py`

- [ ] Run `pytest tests/test_db_connection_pool.py -v`.
- [ ] Review output for passing regressions and no new failures in the touched coverage.
