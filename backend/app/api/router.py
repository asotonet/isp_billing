from fastapi import APIRouter

from app.api import (
    auth,
    clientes,
    contratos,
    instalaciones,
    pagos,
    planes,
    role_permissions,
    router_events,
    routers,
    settings,
    usuarios,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(usuarios.router)
api_router.include_router(clientes.router)
api_router.include_router(planes.router)
api_router.include_router(contratos.router)
api_router.include_router(pagos.router)
api_router.include_router(instalaciones.router)
api_router.include_router(role_permissions.router)
api_router.include_router(routers.router)
api_router.include_router(router_events.router)
api_router.include_router(settings.router)
