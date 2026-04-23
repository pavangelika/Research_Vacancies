from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9000",
        "http://127.0.0.1:9000",
        "http://localhost:63342",
        "http://127.0.0.1:63342",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta_router, prefix="/api/v1/meta", tags=["meta"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(vacancies_router, prefix="/api/v1/vacancies", tags=["vacancies"])
app.include_router(responses_router, prefix="/api/v1/responses", tags=["responses"])


@app.get("/health")
def healthcheck() -> dict:
    return {"ok": True}
