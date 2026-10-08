from pydantic_settings import BaseSettings
# BaseSetting 配置管理基类  专门从环境变量和.env文件中自动加载配置
from functools import lru_cache


class Settings(BaseSettings):
    # 继承的基类中，key要与.env文件中的key一致,这样才能自动加载配置
    APP_NAME: str = '辰光Agent'
    APP_ENV: str = 'dev'
    APP_DEBUG: bool = True

    DB_HOST: str = '127.0.0.1'
    DB_PORT: int = 3306
    DB_USER: str = 'root'
    DB_PASSWORD: str = 'tu3755142'
    DB_NAME: str = 'agent'

    LOG_LEVEL: str = 'DEBUG'
    LOG_DIR: str = 'logs'

    REDIS_HOST: str = 'localhost'
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = '123456'
    REDIS_DB: int = 0


    @property
    def DATABASE_URL(self) -> str:
        return (
            f'mysql+asyncmy://{self.DB_USER}:{self.DB_PASSWORD}'
            f'@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}'
            f'?charset=utf8mb4'
        )

    model_config = {'env_file': '.env', 'env_file_encoding': 'utf-8','extra':'ignore'}

    # 为了保证读取的env文件是该项目需要的，所以要指定env_file的路径
@lru_cache  # 最近最少使用
def get_settings() -> Settings:
    return Settings()
