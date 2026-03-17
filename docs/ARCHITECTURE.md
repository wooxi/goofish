# Goofish 架构说明（IA 合并后）

## 1. 总览

Goofish 当前采用 **前后端分离**：
- 前端（Vue3）负责 IA 导航、状态管理、交互和任务中心展示
- 后端（FastAPI）负责签名、上游 API 聚合、任务持久化与回调接收

端口：
- Frontend: `8002`
- Backend: `8001`

---

## 2. 前端目录结构

```text
frontend/src/
├── pages/
│   ├── StoreManagementPage.vue   # 店铺管理（绑定店铺 + 授权设置）
│   ├── ProductLibraryPage.vue    # 商品库（商品列表 + 模板库 + 发布抽屉）
│   └── OrdersPage.vue            # 订单管理
├── components/
│   ├── MainLayout.vue            # 主框架：左侧导航 + 顶部头部 + 页面容器
│   ├── SidebarNav.vue            # 左侧导航
│   ├── TopWorkspaceHeader.vue    # 顶部任务中心入口 + 抽屉时间线
│   ├── ProductDetailDialog.vue   # 商品详情弹窗
│   └── OrderDetailDialog.vue     # 订单详情弹窗
├── composables/
│   ├── useGoofishWorkspace.js    # 全局业务状态/动作（核心）
│   ├── useDetailDialogs.js       # 商品/订单详情加载逻辑
│   ├── useStatusMaps.js          # 状态映射
│   └── useFormatters.js          # 格式化函数
├── router/
│   └── index.js                  # 路由与旧路由重定向
├── App.vue
└── main.js
```

> 说明：`pages/ConfigPage.vue`、`pages/ShopsPage.vue`、`pages/ProductsPage.vue` 等旧页面文件仍在仓库中，但当前 IA 入口已统一收敛到 3 个新页面。

---

## 3. IA 合并说明与路由映射

### 3.1 现行菜单
- 店铺管理（`/shop-management`）
- 商品库（`/product-library`）
- 订单管理（`/orders`）

### 3.2 历史页面收敛策略
为避免旧链接失效，路由层保留重定向：
- `/config`, `/shops` → `/shop-management`
- `/products`, `/templates`, `/create`, `/callback` → `/product-library`

这样可以兼容旧书签/历史入口，同时界面层维持新 IA。

---

## 4. 任务中心数据流（本地任务记录 + 回调记录）

任务中心在 `TopWorkspaceHeader.vue` 中实现，数据由 `useGoofishWorkspace.js` 拉取。

### 4.1 数据来源
1. **本地任务记录**（后端任务执行快照）
   - 接口：`GET /api/products/task/records?limit=50`
   - 存储：`data/product_local_task_records.jsonl`
2. **平台回调记录**（上游异步回调）
   - 接口：`GET /api/products/callback/records?limit=50`
   - 存储：`data/product_callback_records.jsonl`

### 4.2 前端处理流程
- 页面初始化后调用 `loadProcessingResults(true)`
- 每 30 秒自动轮询一次
- 任务中心手动“刷新”可立即触发拉取
- 本地任务与回调数据合并后按时间倒序生成时间线
- 过滤包含 `demo/mock/test/测试/示例` 标记的记录，避免测试噪声

### 4.3 任务状态
- `queued` / `running` / `finished` / `partial_failed` / `failed`
- 右上角 badge 显示运行中任务数量（queued + running）

---

## 5. 后端主要接口清单

后端入口：`backend/main.py`

### 5.1 配置
- `GET /api/config`：读取当前配置（appid、has_secret、seller_id）
- `POST /api/config`：保存授权配置

### 5.2 店铺
- `GET /api/shops`：查询已授权店铺

### 5.3 商品
- `GET /api/products`：商品列表（支持状态筛选、排序、分页）
- `GET /api/products/{product_id}`：商品详情
- `POST /api/products/create`：创建商品
- `POST /api/products/publish`：单商品上架
- `POST /api/products/downshelf`：单商品下架
- `POST /api/products/delete`：单商品删除
- `POST /api/products/publish/batch`：同步批量上架
- `POST /api/products/downshelf/batch`：同步批量下架
- `POST /api/products/delete/batch`：同步批量删除

### 5.4 订单
- `GET /api/orders`：订单列表（状态筛选 + 排序）
- `GET /api/orders/{order_id}`：订单详情（上游失败时自动回退）

### 5.5 模板
- `GET /api/templates`：模板列表
- `POST /api/templates`：创建模板
- `DELETE /api/templates/{template_id}`：删除模板

### 5.6 任务
- `POST /api/products/publish/batch/task`：创建批量上架后台任务
- `GET /api/products/publish/batch/task/{task_id}`：查询上架任务
- `POST /api/products/downshelf/batch/task`：创建批量下架后台任务
- `GET /api/products/downshelf/batch/task/{task_id}`：查询下架任务
- `POST /api/products/delete/batch/task`：创建批量删除后台任务
- `GET /api/products/delete/batch/task/{task_id}`：查询删除任务
- `GET /api/products/task/records`：读取任务记录

### 5.7 回调
- `POST /api/products/callback/receive`：接收上游回调
- `GET /api/products/callback/records`：读取回调记录

### 5.8 运维/诊断
- `GET /health`：健康检查
- `GET /api/logs`：读取后端日志
- `GET /api/status`：服务状态信息

---

## 6. 前后端交互与部署约束

- 前端通过 `window.location.hostname` 自动计算 API 地址：`http://<hostname>:8001`
- 因此浏览器访问前端时，需确保客户端能访问同一主机的 `8001`
- CORS 已在后端全开放（`allow_origins=["*"]`）

---

## 7. 设计取舍说明

1. **单文件后端（main.py）**
   - 优点：部署简单、定位问题快
   - 代价：功能增长后可维护性下降（后续建议按 domain 拆分）

2. **前端集中状态（useGoofishWorkspace）**
   - 优点：页面切换共享状态、IA 合并成本低
   - 代价：文件体积较大，需持续拆分 composables

3. **任务中心采用“本地任务 + 回调”双源合并**
   - 优点：既能看到提交进度，也能看到平台最终回调
   - 代价：需要处理重复记录、时序差异与过滤策略
