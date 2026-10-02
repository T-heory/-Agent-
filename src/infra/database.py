from src.core.config import get_settings
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

settings = get_settings()

# 异步数据库引擎
# 异步数据库引擎的创建需要在异步上下文中进行
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_DEBUG,  # 是否打印sql语句
    pool_size=10,  # 连接池的大小
    max_overflow=20,  # 最大溢出连接数
    pool_timeout=30,  # 连接池超时时间单位秒
    pool_recycle=60 * 5  # 连接池连接的最大空闲时间
)

# 异步数据库会话
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,  # 创建出来的类
    expire_on_commit=False  # 提交事务后，会话是否过期
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e: #出错后回滚事务
            await session.rollback()
            raise e
