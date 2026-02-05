import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.redis import close_redis, init_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create upload directories
    os.makedirs("/app/uploads/instalaciones/solicitudes", exist_ok=True)
    os.makedirs("/app/uploads/contratos/firmados", exist_ok=True)

    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title="ISP Billing API",
    description="Sistema de facturación para ISP - Costa Rica",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


# Import and include API router (added after routes are created)
from app.api.router import api_router  # noqa: E402

app.include_router(api_router, prefix="/api/v1")
