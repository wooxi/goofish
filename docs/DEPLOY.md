# Goofish 部署手册（单机）

本文面向 `/root/goofish` 项目目录，默认 Linux（systemd 环境）。

## 1. 部署前准备

```bash
# 1) 拉取代码
cd /root
git clone <你的仓库地址> goofish
cd /root/goofish

# 2) 安装系统依赖
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip nodejs npm curl

# 3) 安装后端依赖（建议 venv）
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install fastapi uvicorn httpx pydantic

# 4) 安装前端依赖
cd /root/goofish/frontend
npm install
```

## 2. 启动方式

### 2.1 直接后台启动（简单可用）

```bash
cd /root/goofish
bash start.sh
```

`start.sh` 会：
- 清理旧进程
- 启动后端（8001）
- 启动前端（8002）
- 输出日志位置与访问地址

### 2.2 分开启动（便于排障）

```bash
# 后端
cd /root/goofish
nohup python3 backend/main.py > logs/backend.log 2>&1 &

# 前端开发服务
cd /root/goofish/frontend
nohup npm run dev > /root/goofish/logs/frontend.log 2>&1 &
```

## 3. 健康检查

```bash
# 后端健康检查
curl -sS http://127.0.0.1:8001/health

# 前端可达性
curl -I http://127.0.0.1:8002/

# 端口监听
ss -lntp | grep -E '8001|8002'
```

## 4. systemd（可选，推荐）

> 若你希望机器重启后自动拉起服务，建议使用 systemd。

### 4.1 backend.service

文件：`/etc/systemd/system/goofish-backend.service`

```ini
[Unit]
Description=Goofish Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/goofish
Environment=BACKEND_PORT=8001
ExecStart=/usr/bin/python3 /root/goofish/backend/main.py
Restart=always
RestartSec=3
StandardOutput=append:/root/goofish/logs/backend.log
StandardError=append:/root/goofish/logs/backend.log

[Install]
WantedBy=multi-user.target
```

### 4.2 frontend.service

文件：`/etc/systemd/system/goofish-frontend.service`

```ini
[Unit]
Description=Goofish Frontend (Vite Dev Server)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/goofish/frontend
Environment=FRONTEND_PORT=8002
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=3
StandardOutput=append:/root/goofish/logs/frontend.log
StandardError=append:/root/goofish/logs/frontend.log

[Install]
WantedBy=multi-user.target
```

### 4.3 启用与管理

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now goofish-backend
sudo systemctl enable --now goofish-frontend

sudo systemctl status goofish-backend --no-pager
sudo systemctl status goofish-frontend --no-pager

# 重启
sudo systemctl restart goofish-backend goofish-frontend
```

## 5. 更新发布流程（Release）

```bash
cd /root/goofish

# 1) 拉取最新代码
git fetch origin
git checkout master
git pull --ff-only origin master

# 2) 前端构建校验
cd /root/goofish/frontend
npm install
npm run build

# 3) 后端语法校验
python3 -m py_compile /root/goofish/backend/main.py

# 4) 重启服务（按你的运行方式二选一）
# 方式A：systemd
sudo systemctl restart goofish-backend goofish-frontend

# 方式B：脚本
cd /root/goofish
bash start.sh

# 5) 健康检查
curl -sS http://127.0.0.1:8001/health
curl -I http://127.0.0.1:8002/
```

## 6. 回滚方式

```bash
cd /root/goofish

# 1) 查看历史 commit
git log --oneline -n 20

# 2) 回滚到指定版本（示例）
git reset --hard <commit_hash>

# 3) 重启服务
sudo systemctl restart goofish-backend goofish-frontend
# 或 bash start.sh

# 4) 回滚后验证
curl -sS http://127.0.0.1:8001/health
curl -I http://127.0.0.1:8002/
```

## 7. 日志与故障排查

```bash
# 应用日志
tail -f /root/goofish/logs/backend.log
tail -f /root/goofish/logs/frontend.log

# systemd 日志（若使用 systemd）
sudo journalctl -u goofish-backend -f
sudo journalctl -u goofish-frontend -f
```

常见故障：
- 8001/8002 被占用：先用 `ss -lntp | grep 8001` 定位冲突进程
- 前端白屏：先 `npm run build`，再强制刷新浏览器缓存
- 接口报 400：检查是否已在页面保存 AppKey/AppSecret
