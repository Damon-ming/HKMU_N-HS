import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 支持从 app-server 目录直接执行 `python com/damon/ming/main.py` 或
# `uvicorn main:app`，无需额外设置 PYTHONPATH。
_APP_ROOT = os.path.dirname(os.path.abspath(__file__))
if _APP_ROOT not in sys.path:
    sys.path.insert(0, _APP_ROOT)

from chat.router import chat_router
from upload.router import upload_router

app = FastAPI(title="我的多功能应用")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router.router)
app.include_router(chat_router.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)