FROM python:3.11-slim

WORKDIR /app-server

# 安装系统依赖
RUN apt update && apt install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 复制项目依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制全部业务代码
COPY . .

# 容器内部访问ollama地址：http://ollama-server:11434
# ENV OLLAMA_BASE_URL=http://ollama-server:11434

# 启动入口，根据你项目实际启动文件修改
# CMD ["python3", "-m", "src.com.damon.ming.main"]
