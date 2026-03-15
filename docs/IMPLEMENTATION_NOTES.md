# Goofish 实施说明（批量上架 + 模板快捷创建）

> 本文档用于仓库内落库说明，不在前端页面展示。

## 1. 页面清理

- 前端移除了所有“Phase / 规划 / 待办”展示卡片与文案。
- 原入口保留为可操作功能：
  - 批量上架工作台：可直接提交批量上架并查看结果。
  - 模板快捷创建：可直接新增/保存/应用/删除模板。

## 2. 批量上架

### 后端
新增接口：`POST /api/products/publish/batch`

- 输入：
  - `product_ids: number[]`（去重后顺序执行）
  - `user_name: string`（必填）
  - `notify_url?: string`
  - `specify_publish_time?: string`
- 处理：按 `product_ids` 顺序逐条复用既有 publish 逻辑（同签名、同上游接口）。
- 输出：
  - `summary.total/success/failed`
  - `results[]`（逐条 success/error/message/query_time）

### 前端
- 商品列表支持 checkbox 多选。
- 批量上架工作台提供：
  - 一键批量上架按钮
  - 执行结果统计
  - 失败项明细
  - 失败项重试（仅再次提交失败 ID）

## 3. 模板快捷创建

### 后端
新增模板接口：
- `GET /api/templates`：模板列表
- `POST /api/templates`：创建模板
- `DELETE /api/templates/{template_id}`：删除模板

模板存储：`data/product_templates.json`

模板数据字段支持：
- 商品基础字段：`item_biz_type/sp_biz_type/channel_cat_id/price/express_fee/stock`
- `publish_shop` 常用字段：`user_name/province/city/district/title/content/images`

### 前端
模板管理可用能力：
- 新增空白模板
- 基于当前创建表单保存模板
- 删除模板
- 应用模板（应用后直接跳转创建页面）
- 从已有商品生成模板（简化版）

简化版说明：
- 商品列表字段有限（通常不含完整详情图和长描述）。
- 从商品生成模板时，缺失字段会回退到当前创建表单的值，保证流程可用且不破坏创建校验。

## 4. 保持能力

本次改造不改动以下能力的核心逻辑：
- 店铺/商品/订单查询缓存恢复
- 手动刷新按钮
- 绑定状态展示

## 5. 验证建议

- 前端：`npm run build`
- 后端基础验证：
  - `/api/templates` 的增删查
  - `/api/products/publish/batch` 接口可调用（配置真实 appid/secret 后可联通上游）
