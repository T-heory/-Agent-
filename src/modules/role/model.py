from sqlalchemy import Table,Column,ForeignKey,String,BigInteger
from sqlalchemy.orm import Mapped,mapped_column,relationship
from src.core.base_model import BaseModel,Base
from src.modules.permission.model import Permission



#中间表 用于关联角色和权限   不用继承BaseModel类
#复合主键  role_id permission_id
role_permission=Table(
    'role_permission',
    Base.metadata,
    Column('role_id',BigInteger,ForeignKey('role.id',ondelete='CASCADE'),primary_key=True),
    Column('permission_id',BigInteger,ForeignKey('permission.id',ondelete='CASCADE'),primary_key=True)
)

#角色表
class Role(BaseModel):
    __tablename__ = 'role'
    code:Mapped[str]=mapped_column(String(100),unique=True,comment='角色编码')
    name:Mapped[str]=mapped_column(String(100),comment='角色名称')
    description:Mapped[str]=mapped_column(String(255),nullable=True,comment='角色描述')
    permissions:Mapped[list["Permission"]]=relationship(
        'Permission',
        secondary=role_permission,   #关联表
        lazy='selectin'
    )


#用户角色关联表
user_roles=Table(
    'user_roles',
    Base.metadata,
    Column('user_id',BigInteger,ForeignKey('user.id',ondelete='CASCADE'),primary_key=True),
    Column('role_id',BigInteger,ForeignKey('role.id',ondelete='CASCADE'),primary_key=True)
)
