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
