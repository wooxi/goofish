# 🐟 Goofish 项目配置说明

## 📁 项目结构

```
goofish/
├── backend/              # 后端服务
│   └── main.py
├── frontend/             # 前端服务
│   └── src/
│       └── App.vue
├── config/               # ⚙️ 配置目录
│   └── app_config.json   # API 配置文件
├── logs/                 # 📝 日志目录
│   ├── backend.log       # 后端日志
│   └── frontend.log      # 前端日志
├── docs/                 # 文档目录
├── start.sh              # 启动脚本
└── README.md
```

---

## ⚙️ 配置文件

**位置:** `/openclaw-data/goofish/config/app_config.json`

**格式:**
```json
{
  "appid": 54321,
  "appsecret": "your_secret_here",
  "seller_id": 888,
  "updated_at": "2026-03-07T14:56:57.112852",
  "updated_by": null
}
```

**说明:**
- `appid`: 闲管家 AppKey（必填）
- `appsecret`: 闲管家 AppSecret（必填）
- `seller_id`: 商家 ID（可选）
- `updated_at`: 最后更新时间（自动）
- `updated_by`: 最后更新者（预留）

**持久化:** 配置保存后会自动写入文件，重启后不会丢失

---

## 📝 日志文件

### 后端日志

**位置:** `/openclaw-data/goofish/logs/backend.log`

**日志级别:**
- `DEBUG`: 详细调试信息
- `INFO`: 一般信息（请求、响应）
- `WARNING`: 警告信息
- `ERROR`: 错误信息（含堆栈跟踪）

**日志格式:**
```
2026-03-07 14:56:57 [INFO] goofish: 💾 保存配置请求 - appid=54321, seller_id=888
2026-03-07 14:56:57 [INFO] goofish: ✅ 配置已保存到文件：/openclaw-data/goofish/config/app_config.json
2026-03-07 14:56:57 [INFO] goofish: ✅ 配置保存成功 - appid=54321
```

### 前端日志

**位置:** `/openclaw-data/goofish/logs/frontend.log`

包含 Vite 开发服务器的启动和运行日志。

---

## 🚀 启动服务

### 一键启动

```bash
bash /openclaw-data/goofish/start.sh
```

### 手动启动

```bash
# 启动后端
cd /openclaw-data/goofish/backend
python3 main.py &

# 启动前端
cd /openclaw-data/goofish/frontend
npm run dev &
```

---

## 📋 查看日志

### 实时查看

```bash
# 后端日志
tail -f /openclaw-data/goofish/logs/backend.log

# 前端日志
tail -f /openclaw-data/goofish/logs/frontend.log
```

### 查看最近 N 条

```bash
# 最近 50 条
tail -50 /openclaw-data/goofish/logs/backend.log

# 通过 API 查看
curl http://localhost:8001/api/logs?lines=50
```

---

## 🔧 配置管理

### 通过界面配置

1. 访问 http://localhost:8002
2. 填写 AppKey、AppSecret、Seller ID
3. 点击"保存配置"

### 通过 API 配置

```bash
# 保存配置
curl -X POST http://localhost:8001/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "appid": 54321,
    "appsecret": "your_secret",
    "seller_id": 888
  }'

# 查看配置
curl http://localhost:8001/api/config

# 查看系统状态
curl http://localhost:8001/api/status
```

### 直接编辑配置文件

```bash
# 编辑配置
nano /openclaw-data/goofish/config/app_config.json

# 重启后端使其生效
pkill -f "goofish/backend/main.py"
cd /openclaw-data/goofish/backend
python3 main.py &
```

---

## 🛑 停止服务

```bash
# 停止后端
pkill -f "goofish/backend/main.py"

# 停止前端
pkill -f "vite.*8002"
```

---

## 🐛 故障排查

### 后端无法启动

```bash
# 查看错误日志
tail -20 /openclaw-data/goofish/logs/backend.log

# 检查端口占用
lsof -i :8001

# 手动启动测试
cd /openclaw-data/goofish/backend
python3 main.py
```

### 配置无法保存

```bash
# 检查配置文件权限
ls -la /openclaw-data/goofish/config/

# 检查目录是否存在
ls -la /openclaw-data/goofish/

# 手动创建目录
mkdir -p /openclaw-data/goofish/config
```

### 日志不更新

```bash
# 检查日志文件
ls -la /openclaw-data/goofish/logs/

# 检查后端进程
ps aux | grep "main.py"

# 重启后端
pkill -f "goofish/backend/main.py"
cd /openclaw-data/goofish/backend
python3 main.py &
```

---

## 📊 系统状态

```bash
# 检查后端健康
curl http://localhost:8001/health

# 检查系统状态
curl http://localhost:8001/api/status

# 检查前端
curl http://localhost:8002/
```

---

## 🔐 安全建议

1. **配置文件权限**: 建议设置为仅所有者可读写
   ```bash
   chmod 600 /openclaw-data/goofish/config/app_config.json
   ```

2. **生产环境**: 建议将 `appsecret` 加密存储或使用环境变量

3. **日志轮转**: 定期清理旧日志，防止占用过多磁盘空间
   ```bash
   # 保留最近 7 天的日志
   find /openclaw-data/goofish/logs -name "*.log" -mtime +7 -delete
   ```

---

**更新时间:** 2026-03-07 15:00  
**版本:** 1.0.0
