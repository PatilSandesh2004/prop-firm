"""add_client_order_id

Revision ID: 1d2e3f4a5b6c
Revises: f4c3c7ad99de
Create Date: 2026-08-19 11:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1d2e3f4a5b6c"
down_revision: Union[str, None] = "f4c3c7ad99de"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("client_order_id", sa.String(length=100), nullable=True))
    op.create_index(op.f("ix_orders_client_order_id"), "orders", ["client_order_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_orders_client_order_id"), table_name="orders")
    op.drop_column("orders", "client_order_id")
