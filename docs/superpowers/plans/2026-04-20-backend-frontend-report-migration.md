# Backend/Frontend Report Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current heavy server-rendered report with a thin frontend and a FastAPI backend that owns analytics, vacancy search, responses, and Swagger-based contracts.

**Architecture:** Keep one repository and split runtime responsibilities into `jobs` for ingestion/refresh, `backend` for API/contracts, and `frontend` for UI rendering only. Migrate feature-by-feature so the current report remains usable until all tabs are served by API responses.

**Tech Stack:** Python, FastAPI, Pydantic, PostgreSQL, Pytest, existing JS frontend, Docker Compose

---

## File Structure

**Create**
- `backend/app.py` - FastAPI entrypoint and router wiring
- `backend/api/meta.py` - metadata endpoints
- `backend/api/analytics.py` - analytics endpoints
- `backend/api/vacancies.py` - vacancy search and actions
- `backend/api/responses.py` - responses and calendar endpoints
- `backend/schemas/common.py` - shared query/response primitives
- `backend/schemas/meta.py` - metadata DTOs
- `backend/schemas/analytics.py` - analytics DTOs
- `backend/schemas/vacancies.py` - vacancy DTOs
- `backend/schemas/responses.py` - responses DTOs
- `backend/services/analytics_service.py` - analytics orchestration
- `backend/services/vacancy_search_service.py` - vacancy search orchestration
- `backend/services/responses_service.py` - responses orchestration
- `backend/repositories/analytics_repo.py` - analytics SQL access
- `backend/repositories/vacancies_repo.py` - vacancy search SQL access
- `backend/repositories/responses_repo.py` - responses SQL access
- `jobs/hh_ingestion.py` - wrapper around current HH loading flow
- `jobs/aggregates_refresh.py` - scheduled aggregate/materialized-view refresh
- `tests/backend/test_openapi_smoke.py` - OpenAPI availability checks
- `tests/backend/test_meta_contract.py` - meta contract tests
- `tests/backend/test_responses_contract.py` - responses contract tests
- `tests/backend/test_vacancies_contract.py` - vacancy search contract tests
- `tests/backend/test_analytics_contract.py` - analytics contract tests

**Modify**
- `requirements.txt` - add FastAPI stack
- `docker-compose.yml` - add backend service and frontend/static serving path
- `Dockerfile` - support backend runtime instead of only report generation
- `scripts/db.py` - keep data logic, but extract reusable functions or thin wrappers
- `scripts/generate_report.py` - gradually reduce to legacy compatibility mode
- `scripts/report_server.py` - keep only as fallback during migration or deprecate
- `reports/templates/report_template.html` - remove embedded bulk datasets, keep shell only
- `reports/static/report.utils.js` - point to new backend base URL config
- `reports/static/report.data.js` - remove client aggregations and switch to API adapters
- `reports/static/report.analysis-switch.js` - call API-backed render flows
- `reports/static/report.ui.js` - replace local data assembly with backend calls
- `reports/static/report.events.js` - retarget actions to new `/api/v1/...`

**Reference Source Files**
- `scripts/generate_report.py` - source of current analytics SQL and response shaping
- `scripts/db.py` - source of responses and vacancy detail persistence
- `reports/static/report.data.js` - source of client-side aggregations to remove
- `reports/static/report.ui.js` - source of current UI scenarios

---

### Task 1: Prepare Backend Skeleton

**Files:**
- Create: `backend/app.py`
- Create: `backend/api/meta.py`
- Create: `backend/api/analytics.py`
- Create: `backend/api/vacancies.py`
- Create: `backend/api/responses.py`
- Modify: `requirements.txt`
- Modify: `docker-compose.yml`
- Test: `tests/backend/test_openapi_smoke.py`

- [ ] **Step 1: Add backend dependencies**

Update `requirements.txt` to include:

```txt
fastapi==0.115.12
uvicorn==0.34.2
pydantic==2.11.4
```

- [ ] **Step 2: Create FastAPI entrypoint**

Create `backend/app.py` with:

```python
from fastapi import FastAPI

from backend.api.analytics import router as analytics_router
from backend.api.meta import router as meta_router
from backend.api.responses import router as responses_router
from backend.api.vacancies import router as vacancies_router


app = FastAPI(
    title="Research Vacancies API",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(meta_router, prefix="/api/v1/meta", tags=["meta"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(vacancies_router, prefix="/api/v1/vacancies", tags=["vacancies"])
app.include_router(responses_router, prefix="/api/v1/responses", tags=["responses"])


@app.get("/health")
def healthcheck() -> dict:
    return {"ok": True}
```

- [ ] **Step 3: Create placeholder routers**

Create one router per file returning `501` placeholders so frontend integration can begin before SQL migration.

Example for `backend/api/meta.py`:

```python
from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/roles")
def get_roles():
    raise HTTPException(status_code=501, detail="not_implemented")
```

Repeat same style for `analytics.py`, `vacancies.py`, `responses.py`.

- [ ] **Step 4: Wire backend service into Docker Compose**

Add a new service to `docker-compose.yml`:

```yaml
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env
    depends_on:
      - postgres
    ports:
      - "8000:8000"
    command: >
      sh -c "
      uvicorn backend.app:app --host 0.0.0.0 --port 8000
      "
```

- [ ] **Step 5: Add OpenAPI smoke test**

Create `tests/backend/test_openapi_smoke.py`:

```python
from fastapi.testclient import TestClient

from backend.app import app


client = TestClient(app)


def test_openapi_available():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    payload = response.json()
    assert payload["openapi"]
    assert payload["info"]["title"] == "Research Vacancies API"
```

- [ ] **Step 6: Run smoke test**

Run: `pytest tests/backend/test_openapi_smoke.py -v`

Expected: `1 passed`

- [ ] **Step 7: Commit**

```bash
git add requirements.txt docker-compose.yml backend tests/backend
git commit -m "feat: scaffold fastapi backend for report migration"
```

---

### Task 2: Define Shared Schemas And Query Model

**Files:**
- Create: `backend/schemas/common.py`
- Create: `backend/schemas/meta.py`
- Create: `backend/schemas/analytics.py`
- Create: `backend/schemas/vacancies.py`
- Create: `backend/schemas/responses.py`
- Test: `tests/backend/test_meta_contract.py`

- [ ] **Step 1: Create common query enums and models**

Create `backend/schemas/common.py` with:

```python
from enum import Enum

from pydantic import BaseModel, Field


class ScopeEnum(str, Enum):
    single = "single"
    selection = "selection"
    all = "all"


class PeriodEnum(str, Enum):
    today = "today"
    last_3 = "last_3"
    last_7 = "last_7"
    last_14 = "last_14"
    summary = "summary"


class PageParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=50, ge=1, le=200)
```

- [ ] **Step 2: Create metadata DTOs**

Create `backend/schemas/meta.py` with DTOs for roles, filters, periods, and system metadata.

- [ ] **Step 3: Create analytics DTOs**

Define response models for:
- activity
- weekday
- skills cost
- salary range
- employers

Each response must include `scope`, `role_ids`, and `period_label` where relevant.

- [ ] **Step 4: Create vacancy DTOs**

Define:
- `VacancyEmployerDto`
- `VacancyLocationDto`
- `VacancySalaryDto`
- `VacancyItemDto`
- `VacancyListResponseDto`
- `SkillSuggestionDto`

- [ ] **Step 5: Create responses DTOs**

Define:
- `ResponseItemDto`
- `ResponseListResponseDto`
- `ResponseCalendarDayDto`
- `ResponseCalendarResponseDto`
- `ResponseDetailsDto`
- `UpdateResponseDetailsRequestDto`

- [ ] **Step 6: Add metadata contract test**

Create `tests/backend/test_meta_contract.py`:

```python
from fastapi.testclient import TestClient

from backend.app import app


client = TestClient(app)


def test_roles_endpoint_declared_in_openapi():
    payload = client.get("/openapi.json").json()
    assert "/api/v1/meta/roles" in payload["paths"]
```

- [ ] **Step 7: Run schema contract tests**

Run: `pytest tests/backend/test_openapi_smoke.py tests/backend/test_meta_contract.py -v`

Expected: `2 passed`

- [ ] **Step 8: Commit**

```bash
git add backend/schemas tests/backend/test_meta_contract.py
git commit -m "feat: add backend api schemas for report migration"
```

---

### Task 3: Migrate Responses Domain First

**Files:**
- Create: `backend/repositories/responses_repo.py`
- Create: `backend/services/responses_service.py`
- Modify: `backend/api/responses.py`
- Modify: `scripts/db.py`
- Test: `tests/backend/test_responses_contract.py`

- [ ] **Step 1: Extract responses repository methods**

Move SQL-backed methods from `scripts/db.py` into `backend/repositories/responses_repo.py`:
- list sent responses
- get response details
- mark resume sent
- update response details

Keep `scripts/db.py` temporarily delegating to the new repository to avoid breaking legacy flows.

- [ ] **Step 2: Implement responses service**

Create `backend/services/responses_service.py` to normalize:
- list filters
- response calendar grouping
- detail merging
- write semantics for update vs overwrite

- [ ] **Step 3: Implement responses endpoints**

In `backend/api/responses.py`, add:

```python
@router.get("")
def list_responses(...):
    ...


@router.get("/calendar")
def get_responses_calendar(...):
    ...


@router.get("/{vacancy_id}")
def get_response_details(vacancy_id: str):
    ...


@router.put("/{vacancy_id}")
def update_response_details(vacancy_id: str, payload: UpdateResponseDetailsRequestDto):
    ...


@router.patch("/{vacancy_id}/resume")
def mark_resume_sent(vacancy_id: str):
    ...
```

- [ ] **Step 4: Keep compatibility bridge**

Update `scripts/report_server.py` so legacy endpoints either:
- proxy to new service, or
- remain temporarily while frontend tabs are switched one by one.

- [ ] **Step 5: Add responses contract tests**

Create tests for:
- `/api/v1/responses`
- `/api/v1/responses/calendar`
- `/api/v1/responses/{vacancy_id}`

Validate:
- HTTP 200 shape
- fields declared in OpenAPI
- empty-state compatibility

- [ ] **Step 6: Run responses tests**

Run: `pytest tests/backend/test_responses_contract.py -v`

Expected: contract tests pass against seeded or mocked data

- [ ] **Step 7: Commit**

```bash
git add backend scripts/db.py scripts/report_server.py tests/backend/test_responses_contract.py
git commit -m "feat: migrate responses domain to fastapi backend"
```

---

### Task 4: Migrate Vacancy Search And Vacancy Actions

**Files:**
- Create: `backend/repositories/vacancies_repo.py`
- Create: `backend/services/vacancy_search_service.py`
- Modify: `backend/api/vacancies.py`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/static/report.events.js`
- Test: `tests/backend/test_vacancies_contract.py`

- [ ] **Step 1: Implement vacancy search repository**

Create SQL queries that support:
- scope-aware role filtering
- period filtering
- experience filtering
- status filtering
- country filtering
- currency filtering
- include/exclude skills with `and|or`
- pagination and sorting

- [ ] **Step 2: Implement vacancy search service**

Normalize frontend filters into repository arguments and return paginated DTOs only.

- [ ] **Step 3: Implement vacancies endpoints**

Add endpoints:
- `GET /api/v1/vacancies`
- `GET /api/v1/vacancies/{vacancy_id}`
- `GET /api/v1/vacancies/skills/suggest`
- `POST /api/v1/vacancies/{vacancy_id}/resume`

- [ ] **Step 4: Switch skills-search UI to backend**

In `reports/static/report.ui.js` and `report.events.js`:
- stop deriving vacancy results from embedded role datasets
- call `/api/v1/vacancies`
- call `/api/v1/vacancies/skills/suggest`
- call new resume action endpoint

- [ ] **Step 5: Keep modal details API backend-driven**

Make vacancy modal and employer modal fetch their detailed row payloads from the backend instead of embedded HTML datasets.

- [ ] **Step 6: Add vacancies contract tests**

Test:
- list endpoint
- details endpoint
- skills suggestions endpoint
- resume action endpoint

- [ ] **Step 7: Run vacancies contract tests**

Run: `pytest tests/backend/test_vacancies_contract.py -v`

Expected: all vacancy contract tests pass

- [ ] **Step 8: Commit**

```bash
git add backend reports/static/report.ui.js reports/static/report.events.js tests/backend/test_vacancies_contract.py
git commit -m "feat: migrate vacancy search to backend api"
```

---

### Task 5: Migrate Analytics Read Models

**Files:**
- Create: `backend/repositories/analytics_repo.py`
- Create: `backend/services/analytics_service.py`
- Modify: `backend/api/analytics.py`
- Modify: `scripts/generate_report.py`
- Test: `tests/backend/test_analytics_contract.py`

- [ ] **Step 1: Extract activity analytics SQL**

Move the logic behind `fetch_data()` from `scripts/generate_report.py` into `analytics_repo.get_activity(...)`.

- [ ] **Step 2: Extract weekday analytics SQL**

Move the logic behind `fetch_weekday_data()` into `analytics_repo.get_weekday(...)`.

- [ ] **Step 3: Extract skills cost analytics SQL**

Take the skills aggregation logic from:
- `fetch_skills_monthly_data()`
- client-side `skills-monthly-all`

and produce backend DTOs for skills cost tables/charts.

- [ ] **Step 4: Extract salary range analytics SQL**

Move salary rollups from `fetch_salary_data()` into `analytics_repo.get_salary_range(...)`.

- [ ] **Step 5: Extract employer analytics SQL**

Move `fetch_employer_analysis_data()` into `analytics_repo.get_employers(...)`.

- [ ] **Step 6: Implement analytics service**

Create `backend/services/analytics_service.py` that accepts:
- `scope`
- `role_ids`
- `period`
- optional filters

and returns ready-to-render DTOs.

- [ ] **Step 7: Implement analytics endpoints**

Add:
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/activity`
- `GET /api/v1/analytics/weekday`
- `GET /api/v1/analytics/skills-cost`
- `GET /api/v1/analytics/salary-range`
- `GET /api/v1/analytics/employers`

- [ ] **Step 8: Keep legacy report generator in compatibility mode**

Modify `scripts/generate_report.py` so it no longer needs to embed full datasets into HTML. During transition, it may still generate a shell page and call the same service layer internally if needed.

- [ ] **Step 9: Add analytics contract tests**

Create tests covering:
- single role
- selected roles
- all roles
- empty result shape

- [ ] **Step 10: Run analytics contract tests**

Run: `pytest tests/backend/test_analytics_contract.py -v`

Expected: analytics contracts pass

- [ ] **Step 11: Commit**

```bash
git add backend scripts/generate_report.py tests/backend/test_analytics_contract.py
git commit -m "feat: migrate analytics read models to backend api"
```

---

### Task 6: Remove Frontend Aggregations And Embedded Datasets

**Files:**
- Modify: `reports/templates/report_template.html`
- Modify: `reports/static/report.data.js`
- Modify: `reports/static/report.analysis-switch.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/static/report.utils.js`
- Test: `tests/ui`

- [ ] **Step 1: Reduce report template to frontend shell**

Remove `data-vacancies`, `data-entries`, `data-skills-monthly`, and other large embedded payloads from `report_template.html`.

- [ ] **Step 2: Replace local aggregations with fetch adapters**

In `report.data.js`, delete or deprecate functions that aggregate:
- activity
- weekday
- skills
- salary
- all roles

Replace them with API client helpers like:
- `fetchActivityData`
- `fetchWeekdayData`
- `fetchSkillsCostData`
- `fetchSalaryRangeData`
- `fetchEmployerAnalysisData`

- [ ] **Step 3: Update analysis switch handlers**

In `report.analysis-switch.js`, each tab switch should:
- show loading state
- call backend endpoint
- render returned DTO

- [ ] **Step 4: Keep only UI state on frontend**

Frontend should own:
- selected roles
- active tab
- filters
- pagination

Frontend should no longer own analytics computation.

- [ ] **Step 5: Verify HTML output size reduction**

Run a local generation path and confirm:
- `report.html` is shell-sized rather than tens of MB
- no embedded bulk JSON remains

- [ ] **Step 6: Run UI regression subset**

Run: `pytest tests/ui -m "ui" -v`

Expected: critical UI tests pass or are updated to backend-driven behavior

- [ ] **Step 7: Commit**

```bash
git add reports/templates/report_template.html reports/static/report.data.js reports/static/report.analysis-switch.js reports/static/report.ui.js reports/static/report.utils.js
git commit -m "refactor: remove client-side analytics aggregation from report ui"
```

---

### Task 7: Add Aggregate Refresh Jobs And Performance Safeguards

**Files:**
- Create: `jobs/aggregates_refresh.py`
- Modify: `docker-compose.yml`
- Modify: `backend/repositories/analytics_repo.py`

- [ ] **Step 1: Identify expensive analytics queries**

Measure the following endpoint SQL:
- activity
- skills cost
- salary range
- employers

Record which ones need materialized views or summary tables.

- [ ] **Step 2: Create aggregate refresh job**

Implement `jobs/aggregates_refresh.py` to refresh materialized views or summary tables on schedule.

- [ ] **Step 3: Add scheduled runtime**

Add a compose service or cron-style loop for aggregates refresh.

- [ ] **Step 4: Point analytics repo to refreshed read models**

Switch heavy endpoints to use aggregate tables/views where beneficial.

- [ ] **Step 5: Add response compression and cache headers**

Enable:
- gzip/brotli at serving layer
- safe cache for metadata
- `no-store` for user actions/responses where needed

- [ ] **Step 6: Commit**

```bash
git add jobs docker-compose.yml backend/repositories/analytics_repo.py
git commit -m "perf: add aggregate refresh workflow for analytics api"
```

---

### Task 8: Retire Legacy Report Server And Finalize Contract-Driven Flow

**Files:**
- Modify: `scripts/report_server.py`
- Modify: `README.md`
- Modify: `docs/документация.md`
- Test: `tests/backend`, `tests/ui`

- [ ] **Step 1: Deprecate legacy server routes**

Once frontend is fully migrated, remove or redirect:
- `/api/vacancies/responses`
- `/api/vacancies/details`
- `/api/vacancies/send-resume`

in favor of `/api/v1/...`.

- [ ] **Step 2: Update documentation**

Document:
- new backend startup flow
- Swagger location
- endpoint groups
- migration status

- [ ] **Step 3: Run full verification**

Run:

```bash
pytest tests/backend -v
pytest tests/ui -m "ui" -v
```

Expected:
- backend contract tests pass
- critical UI tests pass against backend-driven frontend

- [ ] **Step 4: Commit**

```bash
git add scripts/report_server.py README.md docs
git commit -m "chore: finalize backend frontend split for report system"
```

---

## Notes For Execution

- Migrate `responses` first, because those workflows are already server-oriented and isolated.
- Migrate `vacancies` second, because `skills-search` currently depends on large embedded datasets.
- Migrate analytics third, because that is where the biggest HTML weight reduction happens.
- Do not remove legacy report generation until equivalent API-backed tabs are verified.
- Swagger is the contract source of truth; tests should validate response shapes against OpenAPI-declared models, not ad hoc dict assertions.

## Verification Checklist

- `report.html` no longer embeds raw vacancy arrays
- frontend does not aggregate analytics from raw vacancy lists
- `/openapi.json` fully describes all public endpoints
- backend responses for analytics, vacancies, and responses are covered by contract tests
- current report user journeys still work during staged migration
