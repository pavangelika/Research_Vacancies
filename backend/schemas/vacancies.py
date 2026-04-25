from pydantic import BaseModel


class VacancyEmployerDto(BaseModel):
    name: str
    accredited: bool | None = None
    trusted: bool | None = None
    rating: str | None = None
    url: str | None = None


class VacancyLocationDto(BaseModel):
    city: str | None = None
    country: str | None = None


class VacancySalaryDto(BaseModel):
    from_value: int | None = None
    to_value: int | None = None
    currency: str | None = None


class VacancyItemDto(BaseModel):
    id: str
    name: str
    employer: VacancyEmployerDto
    location: VacancyLocationDto
    salary: VacancySalaryDto
    experience: str | None = None
    status: str | None = None
    skills: list[str]
    requirement: str | None = None
    responsibility: str | None = None
    published_at: str | None = None
    archived_at: str | None = None
    apply_alternate_url: str | None = None
    send_resume: bool = False
    work_format: str | None = None


class VacancyListResponseDto(BaseModel):
    items: list[VacancyItemDto]
    page: int
    per_page: int
    total: int


class SkillSuggestionDto(BaseModel):
    skill: str
    count: int


class SkillSuggestionResponseDto(BaseModel):
    items: list[SkillSuggestionDto]


class ResumeActionResponseDto(BaseModel):
    ok: bool
    vacancy_id: str
    updated: bool
    resume_at: str | None = None
