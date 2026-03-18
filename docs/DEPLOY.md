# Goofish 部署说明

本文覆盖两种部署方式：
1) Docker Compose（推荐）
2) 非 Docker（Nginx + systemd）

---

## 1. 前置要求

- Linux x86_64
- Git
- Docker + Docker Compose（方案一）
- 或 Python3 + Node.js + Nginx（方案二）

---

## 2. 方案一：Docker Compose（推荐）

### 2.1 初始化

```bash
git clone <your-repo-url> goofish
cd goofish
cp .env.example .env
```

### 2.2 启动

```bash
docker compose up -d --build
```

### 2.3 验证

```bash
# 容器状态
docker compose ps

# 前端首页（默认 8080）
curl -I http://127.0.0.1:${FRONTEND_PORT:-8080}

# 后端健康检查（经前端 Nginx 反代）
curl -sS http://127.0.0.1:${FRONTEND_PORT:-8080}/health
```

### 2.4 停止与清理

```bash
docker compose down
# 如需清理镜像缓存
# docker compose down --rmi local
```

---

## 3. 方案二：非 Docker（Nginx + systemd）

### 3.1 安装依赖

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip nodejs npm nginx
```

### 3.2 后端准备

```bash
cd /opt/goofish
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

### 3.3 前端构建

```bash
cd /opt/goofish
cp frontend/.env.example frontend/.env
cd frontend
npm ci
npm run build
```

### 3.4 Nginx 配置（宿主机）

参考 `/etc/nginx/sites-available/goofish.conf`：

```nginx
server {
  listen 80;
  server_name _;

  root /opt/goofish/frontend/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8001/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /health {
    proxy_pass http://127.0.0.1:8001/health;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/goofish.conf /etc/nginx/sites-enabled/goofish.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 3.5 后端 systemd（示例）

`/etc/systemd/system/goofish-backend.service`

```ini
[Unit]
Description=Goofish Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/goofish
EnvironmentFile=/opt/goofish/backend/.env
ExecStart=/opt/goofish/.venv/bin/python /opt/goofish/backend/main.py
Restart=always
RestartSec=3
StandardOutput=append:/opt/goofish/logs/backend.log
StandardError=append:/opt/goofish/logs/backend.log

[Install]
WantedBy=multi-user.target
```

生效：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now goofish-backend
sudo systemctl status goofish-backend --no-pager
```

---

## 4. 开发辅助脚本

部署脚本已集中到 `deploy/`：

- `deploy/start.sh`：本地开发启动（后端 + 前端 dev server）
- `deploy/watchdog.sh`：健康检查守护
- 根目录 `start.sh` / `watchdog.sh` 为兼容入口（转发到 deploy）

语法检查：

```bash
bash -n deploy/start.sh deploy/watchdog.sh start.sh watchdog.sh
```

---

## 5. 常见问题

### Q1: 前端白屏或路由 404
- 确认 Nginx 使用 `try_files ... /index.html`
- 清浏览器缓存并重试

### Q2: `/api` 报错
- 检查后端是否存活：`curl http://127.0.0.1:8001/health`
- 检查 Nginx `proxy_pass` 是否正确

### Q3: 跨域报错
- 调整 `backend/.env` 中 `CORS_ALLOW_ORIGINS`
- 重启后端服务
