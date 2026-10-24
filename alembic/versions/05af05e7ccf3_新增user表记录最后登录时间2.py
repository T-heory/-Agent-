"""新增user表记录最后登录时间2

Revision ID: 05af05e7ccf3
Revises: 0a4300502e71
Create Date: 2026-10-07 15:54:40.006684

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '05af05e7ccf3'
down_revision: Union[str, Sequence[str], None] = '0a4300502e71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
