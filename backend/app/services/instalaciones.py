import os
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.cliente import Cliente, TipoIdentificacion
from app.models.contrato import Contrato
from app.models.instalacion import EstadoInstalacion, Instalacion
from app.models.plan import Plan
from app.schemas.cliente import ClienteCreate
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoCreate
from app.schemas.instalacion import (
    InstalacionActivarRequest,
    InstalacionSolicitudCreate,
    InstalacionUpdate,
)
from app.services import clientes as clientes_service
from app.services import contratos as contratos_service
from app.utils.cedula import validate_identificacion
from app.utils.pagination import paginate

# Valid state transitions
VALID_TRANSITIONS = {
    EstadoInstalacion.SOLICITUD: [EstadoInstalacion.PROGRAMADA, EstadoInstalacion.CANCELADA],
    EstadoInstalacion.PROGRAMADA: [EstadoInstalacion.EN_PROGRESO, EstadoInstalacion.CANCELADA],
    EstadoInstalacion.EN_PROGRESO: [
        EstadoInstalacion.COMPLETADA,
        EstadoInstalacion.PROGRAMADA,
        EstadoInstalacion.CANCELADA,
    ],
    EstadoInstalacion.COMPLETADA: [],
    EstadoInstalacion.CANCELADA: [],
}


async def _generate_numero_instalacion(db: AsyncSession) -> str:
    """Generate unique installation number: INS-YYYYMMDD-XXXX"""
    today = date.today().strftime("%Y%m%d")
    prefix = f"INS-{today}-"
    result = await db.execute(
        select(func.count())
        .select_from(Instalacion)
        .where(Instalacion.numero_instalacion.like(f"{prefix}%"))
    )
    count = (result.scalar() or 0) + 1
    return f"{prefix}{count:04d}"


async def list_instalaciones(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    estado: EstadoInstalacion | None = None,
    plan_id: uuid.UUID | None = None,
) -> PaginatedResponse:
    """List installations with pagination and filters"""
    query = (
        select(Instalacion)
        .options(selectinload(Instalacion.plan), selectinload(Instalacion.contrato))
        .order_by(Instalacion.created_at.desc())
    )

    if estado:
        query = query.where(Instalacion.estado == estado)
    if plan_id:
        query = query.where(Instalacion.plan_id == plan_id)

    return await paginate(db, query, page, page_size)


async def get_instalacion(db: AsyncSession, instalacion_id: uuid.UUID) -> Instalacion:
    """Get installation by ID with relationships loaded"""
    result = await db.execute(
        select(Instalacion)
        .options(selectinload(Instalacion.plan), selectinload(Instalacion.contrato))
        .where(Instalacion.id == instalacion_id)
    )
    instalacion = result.scalar_one_or_none()
    if not instalacion:
        raise NotFoundError("Instalación no encontrada")
    return instalacion


async def create_solicitud(
    db: AsyncSession, data: InstalacionSolicitudCreate
) -> Instalacion:
    """Create installation request with temporary client data"""
    # Validate plan exists and is active
    result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise BadRequestError("Plan no encontrado")
    if not plan.is_active:
        raise BadRequestError("Plan inactivo")

    # Validate temporary identification data
    if not validate_identificacion(
        data.temp_tipo_identificacion.value, data.temp_numero_identificacion
    ):
        raise BadRequestError("Número de identificación inválido para el tipo seleccionado")

    # Generate installation number
    numero_instalacion = await _generate_numero_instalacion(db)

    # Create installation with SOLICITUD state and NULL contrato_id
    instalacion = Instalacion(
        numero_instalacion=numero_instalacion,
        contrato_id=None,
        estado=EstadoInstalacion.SOLICITUD,
        **data.model_dump(),
    )
    db.add(instalacion)
    await db.flush()

    # Reload with relationships
    return await get_instalacion(db, instalacion.id)


async def update_instalacion(
    db: AsyncSession, instalacion_id: uuid.UUID, data: InstalacionUpdate
) -> Instalacion:
    """Update installation with state transition validation"""
    instalacion = await get_instalacion(db, instalacion_id)
    update_data = data.model_dump(exclude_unset=True)

    # Validate state transition if estado is being updated
    if "estado" in update_data:
        new_estado = update_data["estado"]
        current_estado = instalacion.estado

        valid_next_states = VALID_TRANSITIONS.get(current_estado, [])
        if new_estado not in valid_next_states:
            raise BadRequestError(
                f"Transición de estado inválida: {current_estado.value} -> {new_estado.value}"
            )

    for key, value in update_data.items():
        setattr(instalacion, key, value)
    await db.flush()

    return await get_instalacion(db, instalacion_id)


async def activar_instalacion(
    db: AsyncSession,
    instalacion_id: uuid.UUID,
    data: InstalacionActivarRequest,
    usuario_id: uuid.UUID,
) -> Instalacion:
    """
    Activate installation by creating client and contract.
    This is a transactional operation - if any step fails, everything rolls back.
    """
    instalacion = await get_instalacion(db, instalacion_id)

    # Validate installation state
    if instalacion.estado not in [EstadoInstalacion.SOLICITUD, EstadoInstalacion.EN_PROGRESO]:
        raise BadRequestError("Solo se pueden activar instalaciones en estado SOLICITUD o EN_PROGRESO")

    # Validate contrato_id is NULL
    if instalacion.contrato_id is not None:
        raise BadRequestError("Esta instalación ya fue activada")

    cliente_id: uuid.UUID

    if data.crear_cliente:
        # Validate temporary client data is complete
        required_temp_fields = [
            "temp_tipo_identificacion",
            "temp_numero_identificacion",
            "temp_nombre",
        ]
        for field in required_temp_fields:
            if not getattr(instalacion, field):
                raise BadRequestError(f"Campo temporal {field} es requerido para crear el cliente")

        # Create new client from temp data
        cliente_data = ClienteCreate(
            tipo_identificacion=TipoIdentificacion(instalacion.temp_tipo_identificacion),
            numero_identificacion=instalacion.temp_numero_identificacion,
            nombre=instalacion.temp_nombre,
            apellido1=instalacion.temp_apellido1,
            apellido2=instalacion.temp_apellido2,
            razon_social=instalacion.temp_razon_social,
            email=instalacion.temp_email,
            telefono=instalacion.temp_telefono,
            provincia=instalacion.temp_provincia,
            canton=instalacion.temp_canton,
            distrito=instalacion.temp_distrito,
            direccion_exacta=instalacion.temp_direccion_exacta,
        )
        cliente = await clientes_service.create_cliente(db, cliente_data)
        cliente_id = cliente.id
    else:
        # Use existing client
        if not data.cliente_id:
            raise BadRequestError("cliente_id es requerido cuando crear_cliente es False")

        result = await db.execute(select(Cliente).where(Cliente.id == data.cliente_id))
        cliente = result.scalar_one_or_none()
        if not cliente:
            raise BadRequestError("Cliente no encontrado")
        if not cliente.is_active:
            raise BadRequestError("Cliente inactivo")

        cliente_id = cliente.id

    # Create contract
    contrato_data = ContratoCreate(
        cliente_id=cliente_id,
        plan_id=instalacion.plan_id,
        fecha_inicio=data.fecha_inicio_contrato,
        dia_facturacion=data.dia_facturacion,
        estado=data.estado_contrato,
    )
    contrato = await contratos_service.create_contrato(db, contrato_data)

    # Update installation
    instalacion.contrato_id = contrato.id
    instalacion.estado = EstadoInstalacion.COMPLETADA
    instalacion.fecha_completada = date.today()
    await db.flush()

    # Reload with relationships
    return await get_instalacion(db, instalacion_id)


async def generate_pdf_solicitud(db: AsyncSession, instalacion_id: uuid.UUID) -> bytes:
    """Generate PDF for installation request"""
    from app.utils.pdf_generator import generate_instalacion_pdf

    instalacion = await get_instalacion(db, instalacion_id)
    return generate_instalacion_pdf(instalacion, instalacion.plan)


async def save_pdf_solicitud(
    db: AsyncSession, instalacion_id: uuid.UUID, pdf_bytes: bytes
) -> str:
    """Save PDF file and update instalacion record"""
    instalacion = await get_instalacion(db, instalacion_id)

    # Create directory if not exists
    upload_dir = "/app/uploads/instalaciones/solicitudes"
    os.makedirs(upload_dir, exist_ok=True)

    # Save PDF file
    file_path = f"{upload_dir}/{instalacion.numero_instalacion}.pdf"
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    # Update instalacion record
    instalacion.pdf_solicitud_path = file_path
    await db.flush()

    return file_path
