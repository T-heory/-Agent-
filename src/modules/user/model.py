from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from src.core.base_model import BaseModel
import datetime


class User(BaseModel):
    __tablename__ = 'user'

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, comment='用户名')
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, comment='邮箱')
    hashed_password:Mapped[str]=mapped_column(String(255), comment='密码哈希')
    is_active:Mapped[bool]=mapped_column(default=True, comment='是否激活')
    is_superuser:Mapped[bool]=mapped_column(default=False, comment='是否超级用户')
    last_login:Mapped[datetime.datetime| None]=mapped_column(default=datetime.datetime.now, comment='最后登录时间')
