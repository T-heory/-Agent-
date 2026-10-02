import sys
from pathlib import Path
from loguru import logger
from src.core.config import get_settings


# 项目一启动，必须自己调用这个方法，配置好日志组件的工作规则
def setup_logger() -> None:
    settings = get_settings()
    logger.remove()

    # 控制台规则
    logger.add(
        sys.stdout, #控制台(终端)标准输出
        level=settings.LOG_LEVEL,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            #颜色标记号 打印日志名字，函数名，行号
            "<level>{message}</level>"
        ),
        colorize=True, #是否打印时有颜色
    )

    # 日志文件规则
    log_dir = Path(settings.LOG_DIR) #日志目录 就是存放的位置  Path把字符串转换为Path对象，方便操作文件路径
    log_dir.mkdir(parents=True, exist_ok=True)
    logger.add(
        str(log_dir / "{time:YYYY-MM-DD}.log"),
        level=settings.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="00:00", #每天凌晨0点 旋转日志文件(开始创建新的日志文件)
        retention="30 days", #保留30天的日志文件
        compression="gz", #压缩日志文件
        encoding="utf-8",
    )
    