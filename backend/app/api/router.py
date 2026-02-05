from fastapi import APIRouter

from app.api import auth, clientes, contratos, instalaciones, pagos, planes

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(clientes.router)
api_router.include_router(planes.router)
api_router.include_router(contratos.router)
api_router.include_router(pagos.router)
api_router.include_router(instalaciones.router)
