"""initial_schema_v1

Revision ID: 4114a08f3d6b
Revises:
Create Date: 2026-02-05 15:07:03.066130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4114a08f3d6b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types first
    tipoidentificacion = postgresql.ENUM('CEDULA_FISICA', 'CEDULA_JURIDICA', 'DIMEX', 'NITE', name='tipoidentificacion')
    tipoidentificacion.create(op.get_bind())

    rolusuario = postgresql.ENUM('admin', 'operador', 'tecnico', 'auditor', 'soporte', name='rolusuario')
    rolusuario.create(op.get_bind())

    estadocontrato = postgresql.ENUM('ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'PENDIENTE', name='estadocontrato')
    estadocontrato.create(op.get_bind())

    estadofactura = postgresql.ENUM('BORRADOR', 'EMITIDA', 'ANULADA', name='estadofactura')
    estadofactura.create(op.get_bind())

    estadoinstalacion = postgresql.ENUM('solicitud', 'programada', 'en_progreso', 'completada', 'cancelada', name='estadoinstalacion')
    estadoinstalacion.create(op.get_bind())

    metodopago = postgresql.ENUM('EFECTIVO', 'TRANSFERENCIA', 'SINPE_MOVIL', 'TARJETA', 'DEPOSITO', name='metodopago')
    metodopago.create(op.get_bind())

    estadopago = postgresql.ENUM('PENDIENTE', 'VALIDADO', 'RECHAZADO', name='estadopago')
    estadopago.create(op.get_bind())

    # Create tables

    # Table: clientes
    op.create_table('clientes',
        sa.Column('tipo_identificacion', sa.Enum('CEDULA_FISICA', 'CEDULA_JURIDICA', 'DIMEX', 'NITE', name='tipoidentificacion'), nullable=False),
        sa.Column('numero_identificacion', sa.String(length=20), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('apellido1', sa.String(length=100), nullable=True),
        sa.Column('apellido2', sa.String(length=100), nullable=True),
        sa.Column('razon_social', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('telefono', sa.String(length=20), nullable=True),
        sa.Column('provincia', sa.String(length=50), nullable=True),
        sa.Column('canton', sa.String(length=50), nullable=True),
        sa.Column('distrito', sa.String(length=50), nullable=True),
        sa.Column('direccion_exacta', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clientes_numero_identificacion'), 'clientes', ['numero_identificacion'], unique=True)

    # Table: planes
    op.create_table('planes',
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('velocidad_bajada_mbps', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('velocidad_subida_mbps', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('precio_mensual', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('moneda', sa.String(length=3), nullable=False, server_default='CRC'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )

    # Table: usuarios
    op.create_table('usuarios',
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('nombre_completo', sa.String(length=255), nullable=False),
        sa.Column('rol', sa.Enum('admin', 'operador', 'tecnico', 'auditor', 'soporte', name='rolusuario'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usuarios_email'), 'usuarios', ['email'], unique=True)

    # Table: role_permissions
    op.create_table('role_permissions',
        sa.Column('rol', sa.Enum('admin', 'operador', 'tecnico', 'auditor', 'soporte', name='rolusuario', create_type=False), nullable=False),
        sa.Column('module', sa.String(length=50), nullable=False),
        sa.Column('can_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_write', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rol', 'module', name='uq_rol_module')
    )
    op.create_index(op.f('ix_role_permissions_module'), 'role_permissions', ['module'], unique=False)
    op.create_index(op.f('ix_role_permissions_rol'), 'role_permissions', ['rol'], unique=False)

    # Table: contratos
    op.create_table('contratos',
        sa.Column('numero_contrato', sa.String(length=20), nullable=False),
        sa.Column('cliente_id', sa.UUID(), nullable=False),
        sa.Column('plan_id', sa.UUID(), nullable=False),
        sa.Column('fecha_inicio', sa.Date(), nullable=False),
        sa.Column('fecha_fin', sa.Date(), nullable=True),
        sa.Column('estado', sa.Enum('ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'PENDIENTE', name='estadocontrato'), nullable=False),
        sa.Column('dia_facturacion', sa.Integer(), nullable=False),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('pdf_firmado_path', sa.String(length=500), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['plan_id'], ['planes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contratos_numero_contrato'), 'contratos', ['numero_contrato'], unique=True)

    # Table: facturas
    op.create_table('facturas',
        sa.Column('numero_factura', sa.String(length=50), nullable=False),
        sa.Column('contrato_id', sa.UUID(), nullable=False),
        sa.Column('cliente_id', sa.UUID(), nullable=False),
        sa.Column('clave_numerica_fe', sa.String(length=50), nullable=True),
        sa.Column('fecha_emision', sa.Date(), nullable=False),
        sa.Column('fecha_vencimiento', sa.Date(), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('impuesto', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('moneda', sa.String(length=3), nullable=False, server_default='CRC'),
        sa.Column('periodo', sa.String(length=7), nullable=False),
        sa.Column('estado', sa.Enum('BORRADOR', 'EMITIDA', 'ANULADA', name='estadofactura'), nullable=False),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['contrato_id'], ['contratos.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_facturas_numero_factura'), 'facturas', ['numero_factura'], unique=True)

    # Table: instalaciones (enhanced version with temp fields and plan_id)
    op.create_table('instalaciones',
        sa.Column('numero_instalacion', sa.String(length=20), nullable=False),
        sa.Column('contrato_id', sa.UUID(), nullable=True),
        sa.Column('plan_id', sa.UUID(), nullable=False),
        sa.Column('fecha_programada', sa.Date(), nullable=False),
        sa.Column('fecha_completada', sa.Date(), nullable=True),
        sa.Column('tecnico_asignado', sa.String(length=255), nullable=True),
        sa.Column('estado', sa.Enum('solicitud', 'programada', 'en_progreso', 'completada', 'cancelada', name='estadoinstalacion'), nullable=False),
        sa.Column('notas', sa.Text(), nullable=True),
        # Temporary client data fields
        sa.Column('temp_tipo_identificacion', sa.String(length=20), nullable=True),
        sa.Column('temp_numero_identificacion', sa.String(length=20), nullable=True),
        sa.Column('temp_nombre', sa.String(length=100), nullable=True),
        sa.Column('temp_apellido1', sa.String(length=100), nullable=True),
        sa.Column('temp_apellido2', sa.String(length=100), nullable=True),
        sa.Column('temp_razon_social', sa.String(length=255), nullable=True),
        sa.Column('temp_email', sa.String(length=255), nullable=True),
        sa.Column('temp_telefono', sa.String(length=20), nullable=True),
        sa.Column('temp_provincia', sa.String(length=50), nullable=True),
        sa.Column('temp_canton', sa.String(length=50), nullable=True),
        sa.Column('temp_distrito', sa.String(length=50), nullable=True),
        sa.Column('temp_direccion_exacta', sa.Text(), nullable=True),
        sa.Column('pdf_solicitud_path', sa.String(length=500), nullable=True),
        # Base model fields
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['contrato_id'], ['contratos.id'], ),
        sa.ForeignKeyConstraint(['plan_id'], ['planes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_instalaciones_numero_instalacion'), 'instalaciones', ['numero_instalacion'], unique=True)

    # Table: pagos
    op.create_table('pagos',
        sa.Column('cliente_id', sa.UUID(), nullable=False),
        sa.Column('contrato_id', sa.UUID(), nullable=False),
        sa.Column('monto', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('moneda', sa.String(length=3), nullable=False, server_default='CRC'),
        sa.Column('fecha_pago', sa.Date(), nullable=False),
        sa.Column('metodo_pago', sa.Enum('EFECTIVO', 'TRANSFERENCIA', 'SINPE_MOVIL', 'TARJETA', 'DEPOSITO', name='metodopago'), nullable=False),
        sa.Column('referencia', sa.String(length=100), nullable=True),
        sa.Column('periodo_facturado', sa.String(length=7), nullable=False),
        sa.Column('estado', sa.Enum('PENDIENTE', 'VALIDADO', 'RECHAZADO', name='estadopago'), nullable=False),
        sa.Column('validado_por', sa.UUID(), nullable=True),
        sa.Column('fecha_validacion', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['contrato_id'], ['contratos.id'], ),
        sa.ForeignKeyConstraint(['validado_por'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop tables in reverse order of creation (respecting foreign key dependencies)
    op.drop_table('pagos')
    op.drop_index(op.f('ix_instalaciones_numero_instalacion'), table_name='instalaciones')
    op.drop_table('instalaciones')
    op.drop_index(op.f('ix_facturas_numero_factura'), table_name='facturas')
    op.drop_table('facturas')
    op.drop_index(op.f('ix_contratos_numero_contrato'), table_name='contratos')
    op.drop_table('contratos')
    op.drop_index(op.f('ix_role_permissions_rol'), table_name='role_permissions')
    op.drop_index(op.f('ix_role_permissions_module'), table_name='role_permissions')
    op.drop_table('role_permissions')
    op.drop_index(op.f('ix_usuarios_email'), table_name='usuarios')
    op.drop_table('usuarios')
    op.drop_table('planes')
    op.drop_index(op.f('ix_clientes_numero_identificacion'), table_name='clientes')
    op.drop_table('clientes')

    # Drop enum types
    op.execute('DROP TYPE IF EXISTS estadopago')
    op.execute('DROP TYPE IF EXISTS metodopago')
    op.execute('DROP TYPE IF EXISTS estadoinstalacion')
    op.execute('DROP TYPE IF EXISTS estadofactura')
    op.execute('DROP TYPE IF EXISTS estadocontrato')
    op.execute('DROP TYPE IF EXISTS rolusuario')
    op.execute('DROP TYPE IF EXISTS tipoidentificacion')
