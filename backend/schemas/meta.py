from pydantic import BaseModel


class RoleItemDto(BaseModel):
    id: str
    name: str


class RolesResponseDto(BaseModel):
    items: list[RoleItemDto]


class FilterOptionDto(BaseModel):
    id: str
    label: str


class FiltersResponseDto(BaseModel):
    experiences: list[FilterOptionDto]
    currencies: list[str]
    statuses: list[FilterOptionDto]
    countries: list[FilterOptionDto]


class PeriodItemDto(BaseModel):
    id: str
    label: str


class PeriodsResponseDto(BaseModel):
    items: list[PeriodItemDto]


class SystemMetaResponseDto(BaseModel):
    data_updated_at: str | None = None
    report_generated_at: str | None = None
    api_version: str
