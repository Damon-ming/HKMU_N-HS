from fastapi import FastAPI
import uvicorn

from chat.router import chat_router
from upload.router import upload_router

app = FastAPI(title="我的多功能应用")

app.include_router(upload_router.router)
app.include_router(chat_router.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)