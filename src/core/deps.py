from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.infra.database import get_db
from src.utils.jwt_utils import verify_jwt,oauth2_schema
from src.modules.user.model import User
from src.core.exceptions import BizException
from loguru import logger

#oauth2_schema是fastapi自带的依赖项 从Authorization头中提取bearer开头的token
#以后前端发送请求:
#GET XXX
#Authorization: Bearer <token>

async def get_current_user(
    token:str=Depends(oauth2_schema),
    db:AsyncSession=Depends(get_db)
)->User:
    """从JWT TOKEN中解析当前登录用户，用于保护接口"""
    try:
         logger.debug(f"前端传递的token:{printable_token}")
         payload=verify_jwt(token)
         user_id=int(payload.get('sub'))
    except Exception:
        raise BizException(code=401,message='未登录或token已过期')
    #根据token的用户id 查询用户的其它信息

    user=await db.get(User,user_id)
    if not user:
        raise BizException(code=404,message='用户不存在')
    if not user.is_active:
        raise BizException(code=403,message='用户已被禁用')

    return user
