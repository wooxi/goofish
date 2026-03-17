# Goofish 闲鱼商家工作台

Goofish 是一个面向闲鱼商家运营的 Web 工作台，围绕“店铺配置、商品运营、订单追踪”三条主线，把原先分散页面合并为新的信息架构，并在顶部提供全局任务中心统一查看异步任务与回调结果。

## 1. 项目定位与核心能力

### 核心模块（左侧主导航）
1. **店铺管理**：绑定店铺查询 + 授权配置（AppKey/AppSecret）
2. **商品库**：商品查询/筛选/排序、批量上架/下架/删除、模板库、发布新商品
3. **订单管理**：订单列表、状态筛选、排序、订单详情（含回退策略）

### 顶部全局任务中心（右上角）
- 统一展示本地任务记录（批量上架/下架/删除）和平台回调记录
- 按时间线合并展示，支持手动刷新
- 自动过滤 demo/test/mock 测试数据，避免污染线上视图

## 2. 最新信息架构（IA）

### 新 IA（当前生效）
- **店铺管理**
  - 绑定的店铺
  - 授权设置
- **商品库**
  - 全部商品
  - 模板库
  - 发布新商品（右侧抽屉）
- **订单管理**

### 路由映射
- `/shop-management` → 店铺管理
- `/product-library` → 商品库
- `/orders` → 订单管理

兼容旧路由（自动重定向到新 IA）：
- `/config`, `/shops` → `/shop-management`
- `/products`, `/templates`, `/create`, `/callback` → `/product-library`

## 3. 技术栈与前后端结构

### 前端（`frontend/`）
- Vue 3 + Vite + Vue Router
- Element Plus + Ant Design Vue
- 关键状态集中在 `src/composables/useGoofishWorkspace.js`

### 后端（`backend/`）
- FastAPI + Uvicorn + Pydantic
- HTTP 客户端：httpx
- 单文件服务：`backend/main.py`
- 对接上游：`https://open.goofish.pro`

### 数据与日志
- 配置：`config/app_config.json`
- 任务记录：`data/product_local_task_records.jsonl`
- 回调记录：`data/product_callback_records.jsonl`
- 模板库：`data/product_templates.json`
- 日志：`logs/backend.log`、`logs/frontend.log`

## 4. 目录结构（关键）

```text
goofish/
├── backend/
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StoreManagementPage.vue
│   │   │   ├── ProductLibraryPage.vue
│   │   │   └── OrdersPage.vue
│   │   ├── components/
│   │   │   ├── MainLayout.vue
│   │   │   ├── SidebarNav.vue
│   │   │   └── TopWorkspaceHeader.vue
│   │   ├── composables/
│   │   │   └── useGoofishWorkspace.js
│   │   └── router/index.js
│   └── package.json
├── config/
├── data/
├── docs/
├── logs/
├── start.sh
└── watchdog.sh
```

## 5. 本地运行方式

> 以下命令默认在项目根目录执行：`cd /root/goofish`

### 5.1 安装依赖

```bash
# 后端依赖（建议使用虚拟环境）
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install fastapi uvicorn httpx pydantic

# 前端依赖
cd /root/goofish/frontend
npm install
```

### 5.2 开发模式启动

```bash
# 终端1：后端（8001）
cd /root/goofish
python3 backend/main.py

# 终端2：前端（8002）
cd /root/goofish/frontend
npm run dev
```

### 5.3 生产构建（前端）

```bash
cd /root/goofish/frontend
npm run build
npm run preview -- --host 0.0.0.0 --port 8002
```

### 5.4 一键脚本启动（包含后台运行）

```bash
cd /root/goofish
bash start.sh
```

## 6. 端口说明

- **Backend API**: `8001`
- **Frontend Web**: `8002`

默认访问：
- 前端：`http://localhost:8002`
- 后端健康检查：`http://localhost:8001/health`

## 7. 关键页面与功能说明

### 店铺管理
- 查询绑定店铺、展示授权状态/到期时间
- 保存授权配置（AppKey/AppSecret/SellerID）

### 商品库
- 商品列表分页、状态筛选、字段排序
- 批量上架/下架/删除（后台任务）
- 模板管理（新建/应用/删除）
- 发布新商品（抽屉 + 提交前自检）

### 订单管理
- 订单列表查询、状态筛选、金额/状态/时间排序
- 订单详情查询（优先详情接口，失败自动回退列表接口）

### 顶部任务中心
- 汇总本地任务进度（queued/running/finished/failed）
- 汇总回调记录（task_result、err_code、err_msg）
- 时间线展示最近记录

## 8. 常见问题（FAQ）

### 8.1 页面打不开
```bash
# 检查前端是否监听 8002
ss -lntp | grep 8002

# 查看前端日志
tail -n 100 /root/goofish/logs/frontend.log
```

### 8.2 刷新后路由 404
- 请确认访问的是前端入口地址（`8002`），不是后端地址（`8001`）
- 新 IA 路由为 `/shop-management`、`/product-library`、`/orders`
- 旧路由已做重定向，若仍异常请清浏览器缓存后重试

### 8.3 接口 404 / 请求失败
```bash
# 后端健康检查
curl -sS http://localhost:8001/health

# 查看后端日志
tail -n 200 /root/goofish/logs/backend.log
```
- 同时检查是否已在“店铺管理 > 授权设置”保存 AppKey/AppSecret

### 8.4 页面缓存导致显示旧菜单
- 强制刷新：`Ctrl + F5`（或 `Cmd + Shift + R`）
- 清除站点缓存后重新打开
- 前端若有旧进程，请重启 `npm run dev`

---

如需部署到长期运行环境（systemd、发布/回滚流程），见：`docs/DEPLOY.md`。
系统结构与接口说明见：`docs/ARCHITECTURE.md`。