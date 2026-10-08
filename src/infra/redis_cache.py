import redis.asyncio as redis
from src.core.config import get_settings

settings=get_settings()

#创建redis连接池信息
redis_pool=redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    db=settings.REDIS_DB,
    max_connections=100,
    decode_responses=True,
    encoding='utf-8'
)

#模块级创建redis客户端实例(复用连接池)  _开头认为是私有变量，不暴露出去
_redis_client=redis.Redis(connection_pool=redis_pool)

async def get_redis_client()->redis.Redis:
    """
    FastAPI Depends注入用
    直接返回模块级别的Redis客户端实例，不需要每次创建新实例
    连接池会自动管理连接的获取与归还
    """
    return _redis_client