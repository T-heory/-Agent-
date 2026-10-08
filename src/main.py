from fastapi import FastAPI
from loguru import logger
from src.core.config import get_settings
from src.middlewares.logging import LoggingMiddleware
from src.core.exceptions import register_exception_handlers
from src.core.logger import setup_logger
from src.infra.database import engine
from src.modules.user.api import router as user_router
from src.modules.captcha.api import router as captcha_router
from src.modules.auth.api import router as auth_router

# 使用上下文管理器感知项目的生命周期
from contextlib import asynccontextmanager
ROUTES=[
    (user_router,'/api/v1'),
    (captcha_router,'/api/v1'),
    (auth_router,'/api/v1'),
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 应用启动时要用的
    setup_logger()  # 配置日志组件]
    settings = get_settings()
    logger.info(f"{settings.APP_NAME}启动... | 使用环境：{settings.APP_ENV}")
    yield
    # 应用关闭时要用的
    await engine.dispose()
    logger.info(f'{settings.APP_NAME}关闭...')


def create_app() -> FastAPI:
    settings = get_settings()
    # 创建app应用实例
    app = FastAPI(
        title=settings.APP_NAME,
        version='1.0.0',
        debug=settings.APP_DEBUG
    )
    # 注册中间件
    app.add_middleware(LoggingMiddleware)
    # 注册异常处理器
    register_exception_handlers(app)
    # 注册路由
    for router,prefix in ROUTES:
        app.include_router(router,prefix=prefix)
    return app


app = create_app()
@app.get('/health')
async def root():
    #prometheus规范，返回status=ok表示服务正常，其他状态码表示服务异常
    return {'status': 'ok'}  # 健康检查接口，访问通就说明服务正常
