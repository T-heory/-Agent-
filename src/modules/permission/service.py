from src.modules.permission.repository import PermissionRepository
from src.modules.permission.model import Permission
from src.core.exceptions import BizException
from src.modules.permission.schema import PermissionCreate,PermissionUpdate
from sqlalchemy.ext.asyncio import AsyncSession

class PermissionService:
    def __init__(self, db: AsyncSession):
        self.repo = PermissionRepository(db)

    async def create_permission(self, data: PermissionCreate) -> Permission:
        # 查询是否已存在
        perm = await self.repo.get_by_code(data.code)
        if perm:
            raise BizException(code=30001, message='权限编码已存在')
        # 构建新权限对象
        permDB = Permission(code=data.code, name=data.name, description=data.description)
        # 保存到数据库，保存后 permDB 里会带上 id 字段
        await self.repo.create(permDB)
        return permDB

    async def get_permission(self, permission_id: int) -> Permission | None:
        perm = await self.repo.get_by_id(permission_id)
        if not perm:
            raise BizException(code=30002, message='权限不存在')
        return perm

    async def list_permissions(self)->list[Permission]:
        perms=await self.repo.get_all()
        return perms

    async def update_permission(self,permission_id:int,data:PermissionUpdate)-> Permission:   #data是前端传来的更新数据
        perm = await self.repo.get_by_id(permission_id)
        #只更新data中非None字段
        if data.name:
            perm.name=data.name
        if data.description:
            perm.description=data.description
        #调用repo.update()更新数据库
        return await self.repo.update(perm)


    async def delete_permission(self,permission_id:int)-> None:
        # 直接删
        await self.repo.delete_by_id(permission_id)

        """perm=await self.repo.get_by_id(permission_id)
        return await self.repo.delete_by_id(perm)   先查再删"""

    async def search_page(self, offset: int,
                          limit: int,
                          keyword: str | None) -> tuple[list[Permission], int]:
        return await self.repo.search_page(offset, limit, keyword)
