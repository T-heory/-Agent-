"""新增user表记录最后登录时间

Revision ID: 0a4300502e71
Revises: a69ddd83c48f
Create Date: 2026-10-07 15:53:41.072737

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a4300502e71'
down_revision: Union[str, Sequence[str], None] = 'a69ddd83c48f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
