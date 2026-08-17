"""统一日志模块，业务层只需要调用 pin(name) 获取 logger。"""

import logging
import os
import sys


_LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}


def _configure_logging() -> None:
    root_logger = logging.getLogger()
    if root_logger.handlers:
        root_logger.setLevel(_LOG_LEVELS.get(os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO))
        return

    logging.basicConfig(
        level=_LOG_LEVELS.get(os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        stream=sys.stdout,
    )


_configure_logging()


def get_logger(name: str) -> logging.Logger:
    """按模块名获取日志对象。"""
    return logging.getLogger(name)


def pin(tag: str) -> logging.Logger:
    """兼容旧代码的日志入口，保留 pin(name) 调用方式。"""
    return get_logger(tag)
