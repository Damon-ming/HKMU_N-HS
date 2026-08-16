# 日志配置
import logging
import string


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

def pin(tag:string):
   return logging.getLogger(tag)