# Goofish 闲鱼商家工作台

Goofish 是一个面向闲鱼商家运营的 Web 工作台，聚焦三件事：**店铺授权管理、商品库运营、订单追踪**。仓库已完成生产化目录重构与部署配置，`clone` 后可按本文快速启动。

---

## 技术栈

- **Frontend**: Vue 3 + Vite + Vue Router + Element Plus
- **Backend**: FastAPI + Uvicorn + Pydantic + httpx
- **Deploy**: Docker + Docker Compose + Nginx（SPA history + /api 反代）

---

## 快速开始（推荐：Docker Compose）

### 1) 克隆与环境变量

```bash
git clone <your-repo-url> goofish
cd goofish
cp .env.example .env
```

> 如需定制端口/上游 API/CORS，修改 `.env`。

### 2) 一键启动

```bash
docker compose up -d --build
```

### 3) 访问

- 前端：`http://localhost:${FRONTEND_PORT}`（默认 `http://localhost:8080`）
- 后端健康检查：`http://localhost/health`（经 Nginx 转发）

### 4) 停止

```bash
docker compose down
```

---

## 本地开发（非 Docker）

### 1) 准备环境变量

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2) 安装依赖

```bash
# backend
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r backend/requirements.txt

# frontend
cd frontend
npm ci
cd ..
```

### 3) 启动开发服务

方式 A：使用集中脚本（推荐）

```bash
bash deploy/start.sh
```

方式 B：手动分开启动

```bash
# terminal 1
python3 backend/main.py

# terminal 2
cd frontend
npm run dev
```

默认端口：
- Backend: `8001`
- Frontend dev: `8002`

---

## Linux 部署建议

### 方案一：Docker Compose（推荐）

生产环境直接使用：

```bash
docker compose up -d --build
```

前端容器内 Nginx 配置：`deploy/nginx.conf`，已支持：
- Vue Router history 回退（`try_files ... /index.html`）
- `/api` 反代到 backend
- `/health` 透传后端健康检查

### 方案二：非 Docker + 宿主机 Nginx 挂载

1. 前端构建：`cd frontend && npm ci && npm run build`
2. 以 `backend/main.py` 启动后端（建议 systemd）
3. 宿主机 Nginx 参考：
   - `root` 指向 `frontend/dist`
   - `location / { try_files $uri $uri/ /index.html; }`
   - `location /api/ { proxy_pass http://127.0.0.1:8001/api/; }`
   - `location = /health { proxy_pass http://127.0.0.1:8001/health; }`

详见 `docs/DEPLOY.md`。

---

## 目录结构

```text
goofish/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── pages/
│   │   └── router/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── deploy/
│   ├── nginx.conf
│   ├── start.sh
│   └── watchdog.sh
├── docs/
│   ├── DEPLOY.md
│   └── ...
├── config/
├── data/
├── logs/
├── docker-compose.yml
├── .env.example
├── start.sh        # 兼容入口，转发到 deploy/start.sh
└── watchdog.sh     # 兼容入口，转发到 deploy/watchdog.sh
```

---

## 常用命令

```bash
# 前端构建校验
cd frontend && npm run build

# 后端语法检查
python3 -m py_compile backend/main.py

# Shell 脚本语法检查
bash -n deploy/start.sh deploy/watchdog.sh start.sh watchdog.sh
```

---

## 说明

- 历史路由已统一收敛到：
  - `/shop-management`
  - `/product-library`
  - `/orders`
- 前端 API 地址通过 `VITE_API_BASE_URL` 管理（默认空，走同源反代）。
- 后端上游地址、端口、CORS 均已支持环境变量配置。
