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

    # Initialize role permissions if needed (skip if table doesn't exist yet)
    try:
        from app.database import async_session
        from app.services.role_permissions import initialize_default_permissions

        async with async_session() as db:
            await initialize_default_permissions(db)
            await db.commit()
    except Exception as e:
        # Si la tabla no existe (primera vez), ignorar el error
        # La inicialización se puede hacer manualmente después con el endpoint
        print(f"Note: Could not initialize permissions on startup: {e}")

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
