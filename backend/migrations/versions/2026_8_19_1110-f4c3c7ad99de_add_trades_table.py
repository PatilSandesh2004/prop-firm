"""add_trades_table

Revision ID: f4c3c7ad99de
Revises: 8b78b2baf5b4
Create Date: 2026-08-19 11:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f4c3c7ad99de"
down_revision: Union[str, None] = "8b78b2baf5b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "trades",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("instrument_id", sa.Uuid(), nullable=False),
        sa.Column("side", sa.Enum("BUY", "SELL", name="orderside"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["instrument_id"], ["instruments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trades_account_id"), "trades", ["account_id"], unique=False)
    op.create_index(op.f("ix_trades_order_id"), "trades", ["order_id"], unique=False)
    op.create_index(op.f("ix_trades_instrument_id"), "trades", ["instrument_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_trades_instrument_id"), table_name="trades")
    op.drop_index(op.f("ix_trades_order_id"), table_name="trades")
    op.drop_index(op.f("ix_trades_account_id"), table_name="trades")
    op.drop_table("trades")
