import os
import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.instalacion import EstadoInstalacion
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.instalacion import (
    InstalacionActivarRequest,
    InstalacionDetailResponse,
    InstalacionSolicitudCreate,
    InstalacionUpdate,
)
from app.services import instalaciones as instalaciones_service
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/instalaciones", tags=["Instalaciones"])


@router.get("/", response_model=PaginatedResponse[InstalacionDetailResponse])
async def list_instalaciones(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    estado: EstadoInstalacion | None = None,
    plan_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """List installations with pagination and filters"""
    return await instalaciones_service.list_instalaciones(db, page, page_size, estado, plan_id)


@router.get("/{instalacion_id}", response_model=InstalacionDetailResponse)
async def get_instalacion(
    instalacion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Get installation by ID"""
    return await instalaciones_service.get_instalacion(db, instalacion_id)


@router.post("/solicitud", response_model=InstalacionDetailResponse, status_code=201)
async def create_solicitud(
    data: InstalacionSolicitudCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Create installation request with temporary client data"""
    return await instalaciones_service.create_solicitud(db, data)


@router.put("/{instalacion_id}", response_model=InstalacionDetailResponse)
async def update_instalacion(
    instalacion_id: uuid.UUID,
    data: InstalacionUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Update installation"""
    return await instalaciones_service.update_instalacion(db, instalacion_id, data)


@router.post("/{instalacion_id}/activar", response_model=InstalacionDetailResponse)
async def activar_instalacion(
    instalacion_id: uuid.UUID,
    data: InstalacionActivarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """Activate installation by creating client and contract"""
    return await instalaciones_service.activar_instalacion(
        db, instalacion_id, data, current_user.id
    )


@router.get("/{instalacion_id}/pdf-solicitud")
async def download_pdf_solicitud(
    instalacion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Generate and download installation request PDF"""
    instalacion = await instalaciones_service.get_instalacion(db, instalacion_id)

    # If PDF exists, return it
    if instalacion.pdf_solicitud_path and os.path.exists(instalacion.pdf_solicitud_path):
        return FileResponse(
            instalacion.pdf_solicitud_path,
            media_type="application/pdf",
            filename=f"{instalacion.numero_instalacion}.pdf",
        )

    # Generate and save PDF
    pdf_bytes = await instalaciones_service.generate_pdf_solicitud(db, instalacion_id)
    pdf_path = await instalaciones_service.save_pdf_solicitud(db, instalacion_id, pdf_bytes)
    await db.commit()

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"{instalacion.numero_instalacion}.pdf",
    )
