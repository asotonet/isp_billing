"""add_pppoe_remote_address_to_contratos

Revision ID: ec9502d5d7ea
Revises: 0075fee39493
Create Date: 2026-02-12 02:59:48.160287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec9502d5d7ea'
down_revision: Union[str, None] = '0075fee39493'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add pppoe_remote_address field for fixed IP assignment in PPPoE
    op.add_column('contratos', sa.Column('pppoe_remote_address', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('contratos', 'pppoe_remote_address')
