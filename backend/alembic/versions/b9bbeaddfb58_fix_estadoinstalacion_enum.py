"""fix_estadoinstalacion_enum

Revision ID: b9bbeaddfb58
Revises: 756faf8fb918
Create Date: 2026-02-05 14:55:03.645429

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9bbeaddfb58'
down_revision: Union[str, None] = '756faf8fb918'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add temporary column to store estado values
    op.add_column('instalaciones', sa.Column('estado_temp', sa.String(20), nullable=True))

    # Step 2: Copy data to temp column, converting to lowercase
    op.execute("""
        UPDATE instalaciones
        SET estado_temp = LOWER(estado::text)
    """)

    # Step 3: Drop the old estado column (this releases the enum type)
    op.drop_column('instalaciones', 'estado')

    # Step 4: Drop the corrupted enum type
    op.execute("DROP TYPE IF EXISTS estadoinstalacion")

    # Step 5: Create the new enum type with correct lowercase values
    op.execute("""
        CREATE TYPE estadoinstalacion AS ENUM (
            'solicitud', 'programada', 'en_progreso', 'completada', 'cancelada'
        )
    """)

    # Step 6: Recreate the estado column with the new enum type
    op.add_column('instalaciones',
        sa.Column('estado', sa.Enum('solicitud', 'programada', 'en_progreso',
                                    'completada', 'cancelada',
                                    name='estadoinstalacion', create_type=False),
                  nullable=True)
    )

    # Step 7: Copy data back from temp column
    op.execute("""
        UPDATE instalaciones
        SET estado = estado_temp::estadoinstalacion
    """)

    # Step 8: Make estado NOT NULL and set default
    op.execute("UPDATE instalaciones SET estado = 'solicitud' WHERE estado IS NULL")
    op.alter_column('instalaciones', 'estado', nullable=False)

    # Step 9: Drop the temporary column
    op.drop_column('instalaciones', 'estado_temp')


def downgrade() -> None:
    # This downgrade is complex and risky, so we'll just raise an error
    raise NotImplementedError("Cannot downgrade this migration - enum type was corrupted")
