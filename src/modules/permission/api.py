from fastapi import APIRouter
from fastapi.params import Depends
from src.core.base_schema import ResponseSchema
from src.modules.permission.service import PermissionService
from src.modules.permission.schema import PermissionRead,PermissionCreate,PermissionUpdate
from src.infra.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


router=APIRouter(prefix="/permission",tags=["权限"])

def get_permission_service(db:AsyncSession=Depends(get_db))->PermissionService:
    return PermissionService(db)


@router.get('{permission_id}',response_model=ResponseSchema[PermissionRead],summary='获取权限详情')
async def get_permissions(permission_id:int,
                         svc:PermissionService=Depends(get_permission_service)
                        )->PermissionRead:
    perm=await svc.get_permission(permission_id)  #查询数据库的permission,api调用service层的get_permission方法

    #api 封装返回值，把entity转换为schema
    return ResponseSchema(data=PermissionRead.model_validate(perm))

@router.get('/',response_model=ResponseSchema[list[PermissionRead]],summary='获取所有权限')
async def list_permissions(service:PermissionService=Depends(get_permission_service)):
    permission=await service.list_permissions()
    return ResponseSchema(data=[PermissionRead.model_validate(perm) for perm in permission])

@router.post('/',response_model=ResponseSchema[PermissionRead],summary='创建权限')
async def create_permission(data:PermissionCreate,
                            svc:PermissionService=Depends(get_permission_service)):
    perm=await svc.create_permission(data)
    return ResponseSchema(data=PermissionRead.model_validate(perm))

@router.put('{permission_id}',response_model=ResponseSchema[PermissionRead],summary='更新权限')
async def update_permission(permission_id:int,
                            data:PermissionUpdate,
                            svc:PermissionService=Depends(get_permission_service)):
    perm=await svc.update_permission(permission_id,data)
    return ResponseSchema(data=PermissionRead.model_validate(perm))

@router.delete('{permission_id}',response_model=ResponseSchema,summary='删除权限')
async def delete_permission(permission_id:int,
                            svc:PermissionService=Depends(get_permission_service)):
    await svc.delete_permission(permission_id)
    return ResponseSchema(message='Permission删除成功')
