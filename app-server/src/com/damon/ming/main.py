# app-server/src/com/damon/ming/main.py
# python com/damon/ming/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.com.damon.ming.chat.router import chat_router
from src.com.damon.ming.upload.router import upload_router
from src.com.damon.ming.log import pin

logger = pin("app.main")

app = FastAPI(title="我的多功能应用")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# test
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源请求
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload_router.router)
app.include_router(chat_router.router)
logger.info("应用路由初始化完成")

if __name__ == "__main__":
    logger.info("启动 FastAPI 服务 | host=0.0.0.0 | port=8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)