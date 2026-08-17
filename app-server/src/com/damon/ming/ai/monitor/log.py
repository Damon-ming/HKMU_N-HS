# app-server/src/com/damon/ming/ai/monitor/log.py
import logging
import string


logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

def pin(tag:string):
   return logging.getLogger(tag)