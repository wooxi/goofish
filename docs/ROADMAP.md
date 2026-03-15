# Goofish Roadmap（分阶段）

## Phase-1（当前已实现，可上线基础版）

1. 新增「订单信息查询」工作台（前后端链路打通）
2. 店铺 / 商品 / 订单三类查询统一支持：
   - 查询结果本地持久化（localStorage）
   - 一键刷新按钮
   - 恢复上次查询提示
3. API 配置页增加长期绑定状态展示（appid / seller_id / secret 是否已保存）

## Phase-2（批量上架）

> 目标：可勾选多个商品一键上架，后端顺序调用上架接口。

### 后端方案
- 新增 `POST /api/products/batch-publish`：接收 `product_ids[] + user_name + 可选扩展参数`。
- 串行执行上架：
  - 每个商品单独调用 `/api/open/product/publish`
  - 记录每个商品的请求结果、错误码、耗时
  - 支持可配置节流（例如每次调用间隔 100~300ms，避免风控/限流）
- 返回批量任务结果：成功数、失败数、失败明细（可用于前端重试）。

### 前端方案
- 商品列表页增加可多选列 +「批量上架」按钮。
- 弹窗确认上架参数（user_name、notify_url、定时上架时间）。
- 执行后展示批量结果表（成功/失败/原因），支持失败项二次重试。

## Phase-3（快捷创建 / 模板创建）

> 目标：基于已有商品或模板，少填字段快速创建新商品。

### 后端方案
- 新增模板管理接口（可存文件或 DB）：
  - `GET /api/product-templates`
  - `POST /api/product-templates`
  - `PATCH /api/product-templates/{id}`
  - `DELETE /api/product-templates/{id}`
- 新增「基于商品生成模板」能力：从商品详情提取稳定字段，去除价格/库存/标题等易变项。
- 创建商品时支持 `template_id + overrides` 合并提交，最终仍调用 `/api/open/product/create`。

### 前端方案
- 商品创建页增加「模板模式」：
  - 选择模板 / 从已有商品生成模板
  - 仅填写少数字段（标题、价格、库存、图片等）
- 提交前展示“最终请求体预览”，降低错填风险。
- 模板列表支持复制、版本备注、最近使用排序。
