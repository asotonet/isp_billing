"""cleanup rolusuario enum remove lowercase and lectura

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-05 04:05:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Convert rol column to TEXT temporarily
    op.execute("ALTER TABLE usuarios ALTER COLUMN rol TYPE TEXT")

    # Step 2: Update values to UPPERCASE and remove deprecated LECTURA
    op.execute("UPDATE usuarios SET rol = 'OPERADOR' WHERE rol = 'LECTURA'")
    op.execute("UPDATE usuarios SET rol = 'TECNICO' WHERE rol = 'tecnico'")
    op.execute("UPDATE usuarios SET rol = 'AUDITOR' WHERE rol = 'auditor'")
    op.execute("UPDATE usuarios SET rol = 'SOPORTE' WHERE rol = 'soporte'")

    # Step 3: Drop old enum type
    op.execute("DROP TYPE rolusuario")

    # Step 4: Create new enum with only UPPERCASE values
    op.execute("CREATE TYPE rolusuario AS ENUM ('ADMIN', 'OPERADOR', 'TECNICO', 'AUDITOR', 'SOPORTE')")

    # Step 5: Convert column back to enum
    op.execute("ALTER TABLE usuarios ALTER COLUMN rol TYPE rolusuario USING rol::rolusuario")


def downgrade() -> None:
    # Step 1: Convert rol column to TEXT temporarily
    op.execute("ALTER TABLE usuarios ALTER COLUMN rol TYPE TEXT")

    # Step 2: Convert uppercase back to lowercase for new roles
    op.execute("UPDATE usuarios SET rol = 'tecnico' WHERE rol = 'TECNICO'")
    op.execute("UPDATE usuarios SET rol = 'auditor' WHERE rol = 'AUDITOR'")
    op.execute("UPDATE usuarios SET rol = 'soporte' WHERE rol = 'SOPORTE'")

    # Step 3: Drop current enum type
    op.execute("DROP TYPE rolusuario")

    # Step 4: Recreate old enum (with LECTURA and lowercase new roles)
    op.execute("CREATE TYPE rolusuario AS ENUM ('ADMIN', 'OPERADOR', 'LECTURA', 'tecnico', 'auditor', 'soporte')")

    # Step 5: Convert column back to enum
    op.execute("ALTER TABLE usuarios ALTER COLUMN rol TYPE rolusuario USING rol::rolusuario")
