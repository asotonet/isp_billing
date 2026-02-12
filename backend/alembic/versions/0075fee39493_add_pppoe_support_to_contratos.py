"""add pppoe support to contratos

Revision ID: 0075fee39493
Revises: 414cce708fed
Create Date: 2026-02-12 02:17:36.007030

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0075fee39493'
down_revision: Union[str, None] = '414cce708fed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create TipoConexion ENUM type
    tipoconexion_enum = sa.Enum('IPOE', 'PPPOE', name='tipoconexion')
    tipoconexion_enum.create(op.get_bind(), checkfirst=True)

    # Add columns
    op.add_column('contratos', sa.Column('tipo_conexion', tipoconexion_enum, nullable=True))
    op.add_column('contratos', sa.Column('pppoe_usuario', sa.String(length=100), nullable=True))
    op.add_column('contratos', sa.Column('pppoe_password', sa.Text(), nullable=True))

    # Set default value for existing rows
    op.execute("UPDATE contratos SET tipo_conexion = 'IPOE' WHERE tipo_conexion IS NULL")

    # Make tipo_conexion NOT NULL
    op.alter_column('contratos', 'tipo_conexion', nullable=False)


def downgrade() -> None:
    # Drop columns
    op.drop_column('contratos', 'pppoe_password')
    op.drop_column('contratos', 'pppoe_usuario')
    op.drop_column('contratos', 'tipo_conexion')

    # Drop TipoConexion ENUM type
    tipoconexion_enum = sa.Enum('IPOE', 'PPPOE', name='tipoconexion')
    tipoconexion_enum.drop(op.get_bind(), checkfirst=True)
