# Release Notes - 2026-03-17

## 版本标识
- **版本主题**：IA 合并与三大核心模块重构发布
- **建议标签**：`v2026.03.17-ia`
- **发布分支**：`master`
- **发布基线 Commit**：`47a66e3`

## 核心变更摘要
本次发布完成了工作台 IA 合并与主流程重构，重点如下：

1. **IA 合并**
   - 将原有分散页面收敛为三条主线：店铺管理、商品库、订单管理。
   - 路由结构统一为 `/shop-management`、`/product-library`、`/orders`。

2. **任务中心升级**
   - 顶部全局任务中心统一聚合本地任务记录与平台回调记录。
   - 过滤 demo/test/mock 测试数据，降低线上视图噪音。

3. **页面拆分与懒加载**
   - 页面拆分为 `StoreManagementPage`、`ProductLibraryPage`、`OrdersPage`。
   - 基于路由进行按需加载，完成 chunk 优化改造。

4. **路由治理**
   - 新 IA 路由生效，同时保留旧入口兼容并自动重定向。
   - 保证历史收藏链接与旧操作习惯可平滑迁移。

5. **文档重写**
   - 重写 `README.md`、`docs/DEPLOY.md`、`docs/ARCHITECTURE.md`。
   - 统一运行、部署、排障与发布回滚说明。

## 兼容性 / 迁移说明
为降低升级成本，本次保留旧路由并自动重定向至新 IA：

- `/config`、`/shops` → `/shop-management`
- `/products`、`/templates`、`/create`、`/callback` → `/product-library`

> 迁移建议：对外文档、书签与导航入口逐步切换到新路由，旧路由作为过渡兼容保留。

## 已知问题
- 前端生产构建仍存在 **chunk 体积 warning**（> 500 kB）：
  - `vendor-element-plus` 与 `vendor-antdv` chunk 偏大；
  - 当前不影响功能可用性，但会影响首屏加载体积与后续缓存策略优化空间；
  - 后续可通过更细粒度动态拆包与 manualChunks 继续优化。

## 回滚指引（示例）
如线上异常需要快速回退，可回滚到上一稳定版本（示例）：`9295c6a`

```bash
cd /root/goofish

# 1) 获取最新远端信息
git fetch origin --tags

# 2) 回退到上一稳定提交（示例）
git reset --hard 9295c6a

# 3) 强制同步远端（仅在确认发布事故后执行）
git push origin master --force-with-lease

# 4) 服务重启与验证
bash start.sh
curl -sS http://127.0.0.1:8001/health
curl -I http://127.0.0.1:8002/
```

> 若采用标签回滚，也可执行：`git checkout <历史tag>` 后按部署流程重启服务。

## 验证清单（发布后）
- [x] 前端构建通过：`cd /root/goofish/frontend && npm run build`
- [x] 后端健康检查通过：`curl -sS http://127.0.0.1:8001/health`
- [x] 前端访问可达：`curl -I http://127.0.0.1:8002/`
- [x] 页面入口可访问：
  - `http://localhost:8002/shop-management`
  - `http://localhost:8002/product-library`
  - `http://localhost:8002/orders`
- [x] 旧路由重定向验证：`/config`、`/products` 等可自动跳转到新路由

## 备注
本次发布聚焦 IA 与主流程稳定性，后续迭代将重点推进前端大包体积优化与按业务域进一步拆分依赖。