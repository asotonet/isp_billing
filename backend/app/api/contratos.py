import os
import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.contrato import EstadoContrato
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoCreate, ContratoDetailResponse, ContratoUpdate
from app.services import contratos as contratos_service

router = APIRouter(prefix="/contratos", tags=["Contratos"])


@router.get("/", response_model=PaginatedResponse[ContratoDetailResponse])
async def list_contratos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    cliente_id: uuid.UUID | None = None,
    estado: EstadoContrato | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await contratos_service.list_contratos(db, page, page_size, cliente_id, estado)


@router.get("/{contrato_id}", response_model=ContratoDetailResponse)
async def get_contrato(
    contrato_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await contratos_service.get_contrato(db, contrato_id)


@router.post("/", response_model=ContratoDetailResponse, status_code=201)
async def create_contrato(
    data: ContratoCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await contratos_service.create_contrato(db, data)


@router.put("/{contrato_id}", response_model=ContratoDetailResponse)
async def update_contrato(
    contrato_id: uuid.UUID,
    data: ContratoUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    return await contratos_service.update_contrato(db, contrato_id, data)


@router.post("/{contrato_id}/pdf-firmado", response_model=ContratoDetailResponse)
async def upload_pdf_firmado(
    contrato_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Upload signed PDF for contract"""
    return await contratos_service.upload_pdf_firmado(db, contrato_id, file)


@router.get("/{contrato_id}/pdf-firmado")
async def download_pdf_firmado(
    contrato_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """Download signed PDF for contract"""
    contrato = await contratos_service.get_contrato(db, contrato_id)

    if not contrato.pdf_firmado_path:
        raise NotFoundError("PDF firmado no disponible")

    if not os.path.exists(contrato.pdf_firmado_path):
        raise NotFoundError("Archivo PDF no encontrado")

    return FileResponse(
        contrato.pdf_firmado_path,
        media_type="application/pdf",
        filename=f"{contrato.numero_contrato}_firmado.pdf",
    )
