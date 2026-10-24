from src.core.base_repository import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.modules.permission.model import Permission

#对Permission进行增删查改操作
class PermissionRepository(BaseRepository[Permission]):
    SEARCH_FIELDS=['code','name']
    def __init__(self, db: AsyncSession):
        super().__init__(Permission, db)

    #根据权限编码查询权限
    async def get_by_code(self,code:str)->Permission|None:
        #scalar方法的作用是返回查询结果的第一条记录
        return await self.db.scalar(
            select(Permission).filter(Permission.code==code)
        )

    async def get_by_ids(self, ids: list[int]) -> list[Permission]:
        # 根据 ID 列表批量查询权限，用于角色分配权限时批量校验
        stmt = select(Permission).where(Permission.id.in_(ids))
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def search_page(self, offset: int,
                          limit: int,
                          keyword: str | None) -> tuple[list[Permission], int]:
        return await self.get_page(offset, limit,keyword,self.SEARCH_FIELDS)