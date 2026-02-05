"""add new user roles to rolusuario enum

Revision ID: a1b2c3d4e5f6
Revises: e333da831bec
Create Date: 2026-02-05 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e333da831bec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new roles to RolUsuario enum (using UPPERCASE to match existing pattern)
    op.execute("""
        DO $$
        BEGIN
            -- Add 'TECNICO' if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum
                WHERE enumlabel = 'TECNICO'
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rolusuario')
            ) THEN
                ALTER TYPE rolusuario ADD VALUE 'TECNICO';
            END IF;

            -- Add 'AUDITOR' if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum
                WHERE enumlabel = 'AUDITOR'
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rolusuario')
            ) THEN
                ALTER TYPE rolusuario ADD VALUE 'AUDITOR';
            END IF;

            -- Add 'SOPORTE' if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum
                WHERE enumlabel = 'SOPORTE'
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rolusuario')
            ) THEN
                ALTER TYPE rolusuario ADD VALUE 'SOPORTE';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type
    pass
