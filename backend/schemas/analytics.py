from pydantic import BaseModel

from backend.schemas.common import ScopeEnum


class ActivityEntryDto(BaseModel):
    experience: str
    total: int
    active: int
    archived: int
    avg_age_days: float | None = None


class ActivityMonthDto(BaseModel):
    month: str
    entries: list[ActivityEntryDto]


class ActivitySummaryDto(BaseModel):
    total: int
    active: int
    archived: int


class ActivityRoleRowDto(BaseModel):
    role_id: str
    name: str
    total: int
    active: int
    archived: int
    avg_age: float | None = None


class ActivityResponseDto(BaseModel):
    scope: ScopeEnum
    role_ids: list[str]
    period_label: str
    months: list[ActivityMonthDto]
    summary: ActivitySummaryDto
    role_rows: list[ActivityRoleRowDto] = []


class WeekdayItemDto(BaseModel):
    weekday: str
    publications: int
    archives: int
    avg_pub_hour: str
    avg_arch_hour: str


class WeekdayRoleRowDto(BaseModel):
    role_id: str
    name: str
    avg_pub: float
    avg_arch: float


class WeekdayResponseDto(BaseModel):
    scope: ScopeEnum
    role_ids: list[str]
    period_label: str
    items: list[WeekdayItemDto]
    role_rows: list[WeekdayRoleRowDto] = []


class SkillRoleShareDto(BaseModel):
    role_id: str
    role_name: str
    share: float


class SkillsMonthSkillDto(BaseModel):
    skill: str
    count: int
    coverage: float
    rank: int


class SkillsMonthExperienceDto(BaseModel):
    experience: str
    total_vacancies: int
    skills: list[SkillsMonthSkillDto]


class SkillsMonthDto(BaseModel):
    month: str
    experiences: list[SkillsMonthExperienceDto]


class SkillsCostItemDto(BaseModel):
    skill: str
    mention_count: int
    avg_skill_cost: float | None = None
    median_skill_cost: float | None = None
    roles: list[SkillRoleShareDto]


class SkillsCostResponseDto(BaseModel):
    scope: ScopeEnum
    role_ids: list[str]
    period_label: str
    currency: str
    items: list[SkillsCostItemDto]
    months: list[SkillsMonthDto] = []


class SalaryRangeItemDto(BaseModel):
    role_id: str
    role_name: str
    month: str | None = None
    experience: str | None = None
    status: str | None = None
    currency: str
    count: int
    total_vacancies: int | None = None
    avg_salary: float | None = None
    median_salary: float | None = None
    mode_salary: float | None = None
    min_salary: float | None = None
    max_salary: float | None = None
    top_skills: str | None = None


class SalaryRangeResponseDto(BaseModel):
    scope: ScopeEnum
    role_ids: list[str]
    period_label: str
    items: list[SalaryRangeItemDto]


class EmployerSalaryDto(BaseModel):
    currency: str
    avg: float | None = None
    count: int


class EmployerAnalysisItemDto(BaseModel):
    month: str
    factor: str
    factor_value: str
    group_n: int
    salary: EmployerSalaryDto


class EmployerAnalysisResponseDto(BaseModel):
    scope: ScopeEnum
    role_ids: list[str]
    period_label: str
    items: list[EmployerAnalysisItemDto]


class DashboardMetricDto(BaseModel):
    key: str
    label: str
    value: int | float | str | None = None


class DashboardSalaryRowDto(BaseModel):
    currency: str
    total: int
    withSalary: int
    coverage: float
    avg: float | None = None
    median: float | None = None
    mode: float | None = None
    min: float | None = None
    max: float | None = None


class DashboardCurrencyCoverageDto(BaseModel):
    count: int
    share: float


class DashboardSalaryCoverageDto(BaseModel):
    total: int
    withSalary: int
    withoutSalary: int
    withSalaryShare: float
    withoutSalaryShare: float
    currencies: dict[str, DashboardCurrencyCoverageDto]


class DashboardPeriodStatsDto(BaseModel):
    total: int
    active: int
    archived: int
    avgLifetimeDays: float | None = None


class DashboardResponseFunnelDto(BaseModel):
    responses: int
    interview: int
    result: int
    offer: int


class DashboardBurnupSeriesDto(BaseModel):
    labels: list[str]
    newPublished: list[int]
    archived: list[int]
    publishedAndArchived: list[int]
    active: list[int]


class DashboardTopRowDto(BaseModel):
    employer: str
    total: int
    accredited: str | None = None
    rating: str | None = None
    trusted: str | None = None
    url: str | None = None
    avg: float | None = None
    median: float | None = None
    mode: float | None = None
    min: float | None = None
    max: float | None = None


class DashboardTopSkillDto(BaseModel):
    skill: str
    mentions: int
    avg: float | None = None
    median: float | None = None
    mode: float | None = None
    min: float | None = None
    max: float | None = None


class DashboardTopVacancyDto(BaseModel):
    id: str
    name: str
    employer: str
    employerAccredited: str | None = None
    employerRating: str | None = None
    employerTrusted: str | None = None
    employerUrl: str | None = None
    salary: float
    currency: str
    responded: bool


class DashboardEmployerOverviewDto(BaseModel):
    currency: str
    metric: str
    labels: list[str]
    values: list[float | None]


class DashboardMarketTrendsSalaryStatsDto(BaseModel):
    min: float | None = None
    max: float | None = None
    avg: float | None = None
    median: float | None = None
    mode: float | None = None


class DashboardMarketTrendsMetricDto(BaseModel):
    id: str
    name: str
    roleAxisId: str
    experience: str | None = None
    recentCount: int
    prevCount: int
    demandDelta: int
    demandPct: float
    recentSalary: DashboardMarketTrendsSalaryStatsDto
    prevSalary: DashboardMarketTrendsSalaryStatsDto


class DashboardMarketTrendsDto(BaseModel):
    currency: str
    salary_metric: str
    recent_days: int
    baseline_days: int
    recent_start_label: str
    recent_end_label: str
    prev_start_label: str
    prev_end_label: str
    has_salary_for_currency: bool
    metrics: list[DashboardMarketTrendsMetricDto]
    focus_metrics: DashboardMarketTrendsMetricDto | None = None


class DashboardSalaryEntryDto(BaseModel):
    status: str
    currency: str
    total_vacancies: int
    vacancies_with_salary: int
    vacancies_without_salary: int
    coverage: float
    avg_salary: float | None = None
    median_salary: float | None = None
    mode_salary: float | None = None
    min_salary: float | None = None
    max_salary: float | None = None


class DashboardSalaryExperienceDto(BaseModel):
    experience: str
    entries: list[DashboardSalaryEntryDto]


class DashboardSalaryMonthDto(BaseModel):
    month: str
    experiences: list[DashboardSalaryExperienceDto]


class DashboardResponseDto(BaseModel):
    scope: ScopeEnum
    role_ids: list[str]
    period_label: str
    metrics: list[DashboardMetricDto]
    salary_rows: list[DashboardSalaryRowDto] = []
    salary_coverage: DashboardSalaryCoverageDto | None = None
    period_stats: DashboardPeriodStatsDto | None = None
    response_funnel: DashboardResponseFunnelDto | None = None
    burnup_series: DashboardBurnupSeriesDto | None = None
    skills_rows: list[DashboardTopSkillDto] = []
    company_rows: list[DashboardTopRowDto] = []
    closing_rows: list[DashboardTopRowDto] = []
    top_vacancies: list[DashboardTopVacancyDto] = []
    salary_month_data: DashboardSalaryMonthDto | None = None
    employer_overview: DashboardEmployerOverviewDto | None = None
    market_trends: DashboardMarketTrendsDto | None = None
