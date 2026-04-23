from pydantic import BaseModel


class ResponseItemDto(BaseModel):
    vacancy_id: str
    role_id: str | None = None
    role_name: str | None = None
    name: str
    employer: str | None = None
    city: str | None = None
    salary_from: int | None = None
    salary_to: int | None = None
    currency: str | None = None
    resume_at: str | None = None
    published_at: str | None = None
    archived: bool = False
    archived_at: str | None = None
    interview_filled: bool = False
    offer_salary: str | None = None
    updated_at: str | None = None
    interview_date: str | None = None
    result: str | None = None
    country: str | None = None


class ResponseListResponseDto(BaseModel):
    items: list[ResponseItemDto]
    page: int
    per_page: int
    total: int


class ResponseCalendarItemDto(BaseModel):
    vacancy_id: str
    name: str
    employer: str | None = None
    interview_date: str | None = None
    result: str | None = None
    is_pending_result: bool = False


class ResponseCalendarDayDto(BaseModel):
    date: str
    count: int
    items: list[ResponseCalendarItemDto]


class ResponseCalendarResponseDto(BaseModel):
    month: str
    days: list[ResponseCalendarDayDto]


class ResponseSummaryDto(BaseModel):
    name: str | None = None
    employer: str | None = None
    city: str | None = None
    country: str | None = None
    salary_from: int | None = None
    salary_to: int | None = None
    currency: str | None = None
    resume_at: str | None = None
    published_at: str | None = None
    archived: bool = False
    archived_at: str | None = None


class ResponseDetailsPayloadDto(BaseModel):
    skills: str | None = None
    requirement: str | None = None
    responsibility: str | None = None
    description: str | None = None
    hr_name: str | None = None
    interview_date: str | None = None
    interview_stages: str | None = None
    company_type: str | None = None
    result: str | None = None
    feedback: str | None = None
    offer_salary: str | None = None
    pros: str | None = None
    cons: str | None = None
    updated_at: str | None = None


class ResponseDetailsDto(BaseModel):
    vacancy_id: str
    summary: ResponseSummaryDto
    details: ResponseDetailsPayloadDto


class UpdateResponseDetailsRequestDto(BaseModel):
    hr_name: str | None = None
    interview_date: str | None = None
    interview_stages: str | None = None
    company_type: str | None = None
    result: str | None = None
    feedback: str | None = None
    offer_salary: str | None = None
    pros: str | None = None
    cons: str | None = None
    force_overwrite: bool = False


class UpdateResponseDetailsResultDto(BaseModel):
    ok: bool
    updated: bool
    requires_overwrite: bool = False
    unchanged: bool = False
    updated_at: str | None = None
