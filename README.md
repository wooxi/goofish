# 🐟 Goofish 闲鱼管理系统

闲鱼店铺/商品管理系统，基于闲管家 OpenAPI 开发。

## 📁 项目结构

```
goofish/
├── backend/          # 后端 FastAPI 服务 (端口 8001)
│   └── main.py
├── frontend/         # 前端 Vue 3 服务 (端口 8002)
│   ├── src/
│   │   └── App.vue
│   ├── index.html
│   └── package.json
├── config/           # 配置文件目录
│   └── app_config.json  # 需要配置 AppKey/AppSecret
├── docs/             # API 文档
│   └── API 接口文档.md
├── logs/             # 日志目录
├── start.sh          # 启动脚本
├── watchdog.sh       # 服务守护脚本
└── README.md         # 项目说明
```

## 🚀 快速启动

### 一键启动

```bash
bash /openclaw-data/goofish/start.sh
```

### 手动启动

```bash
# 启动后端
cd backend
python3 main.py &

# 启动前端
cd frontend
npm install  # 首次运行需要
npm run dev &
```

### 访问地址

- **本机**: http://localhost:8002
- **内网**: http://<服务器 IP>:8002

## 📋 功能说明

### 已实现功能

1. **⚙️ API 配置管理**
   - AppKey/AppSecret 配置
   - 配置持久化保存
   - 配置自动加载

2. **🏪 店铺信息查询**
   - 查询已授权的闲鱼店铺
   - 显示店铺详细信息
   - 店铺状态标签

3. **📦 商品列表查询**
   - 查询商品列表
   - 显示商品信息
   - 分页信息展示

### 计划功能

- ⏳ 商品详情查询
- ⏳ 商品创建/编辑
- ⏳ 商品上架/下架
- ⏳ 库存管理

## 🔧 技术栈

| 模块 | 技术 | 端口 |
|------|------|------|
| 后端 | Python FastAPI | 8001 |
| 前端 | Vue 3 + Vite + Element Plus | 8002 |

## 📖 API 文档

基于闲管家 OpenAPI：https://open.goofish.pro

### 签名规则

```python
# 签名公式：sign = md5("appKey,bodyMd5,timestamp,appSecret")

import hashlib

def generate_sign(appid, body_string, timestamp, appsecret):
    body_md5 = hashlib.md5(body_string.encode()).hexdigest()
    sign_str = f"{appid},{body_md5},{timestamp},{appsecret}"
    return hashlib.md5(sign_str.encode()).hexdigest()
```

### 接口列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 查询店铺 | POST | `/api/open/user/authorize/list` | 查询已授权店铺 |
| 查询商品 | POST | `/api/open/product/list` | 查询商品列表 |

## 📝 配置说明

在界面中配置以下信息：

- **AppKey (appid)**: 闲管家开放平台分配的 AppKey
- **AppSecret**: 对应的密钥
- **Seller ID**: 商家 ID（可选）

## 🛡️ 服务守护

使用 `watchdog.sh` 脚本自动守护服务：

```bash
# 启动守护进程
bash watchdog.sh &

# 守护进程会：
# - 每 10 秒检查服务状态
# - 服务挂掉自动重启
# - 记录重启日志
```

## 🐛 故障排查

### 查看日志

```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log

# 守护进程日志
tail -f /tmp/goofish_watchdog.log
```

### 检查服务状态

```bash
# 检查后端
ps aux | grep main.py
curl http://localhost:8001/health

# 检查前端
ps aux | grep vite
curl http://localhost:8002/
```

### 重启服务

```bash
# 停止旧进程
pkill -f "goofish/backend/main.py"
pkill -f "vite.*8002"

# 重启服务
bash start.sh
```

## 🔗 相关链接

- **闲管家开放平台**: https://open.goofish.pro
- **API 文档**: 详见 `docs/API 接口文档.md`

## 📄 License

MIT
