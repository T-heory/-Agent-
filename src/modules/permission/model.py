from src.core.base_model import BaseModel
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class Permission(BaseModel):
    __tablename__ = 'permission'
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, comment='权限编码')
    name: Mapped[str] = mapped_column(String(50), comment='权限名称')
    description: Mapped[str] = mapped_column(String(255), nullable=True,comment='权限描述')


